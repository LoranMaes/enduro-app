import { Link } from '@inertiajs/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { ArrowRight } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

import { AccessSection } from './access-section';
import { AudienceFit } from './audience-fit';
import { ManifestoHero } from './manifesto-hero';
import { MarketingClosing } from './marketing-closing';
import { MarketingFooter } from './marketing-footer';
import { PhilosophyBlock } from './philosophy-block';
import { ProductSurfacePreview } from './product-surface-preview';
import { TrainingLoop } from './training-loop';

type LandingPageProps = {
    enterLabUrl: string;
};

export function LandingPage({ enterLabUrl }: LandingPageProps) {
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const rootElement = rootRef.current;

        if (!rootElement) {
            return;
        }

        gsap.registerPlugin(ScrollTrigger);

        const lenis = new Lenis({
            duration: 1.2,
            smoothWheel: true,
            wheelMultiplier: 0.9,
            touchMultiplier: 1.4,
        });

        lenis.on('scroll', () => {
            ScrollTrigger.update();
        });

        const tick = (time: number) => {
            lenis.raf(time * 1000);
        };

        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);

        const context = gsap.context(() => {
            const landingSections = gsap.utils.toArray<HTMLElement>(
                '[data-landing-section]',
            );
            const deferredSections = landingSections.slice(1);
            const surfaceItems = gsap.utils.toArray<HTMLElement>(
                '[data-surface-panel], [data-access-card], [data-loop-step]',
            );

            gsap.from('[data-landing-nav]', {
                y: -20,
                autoAlpha: 0,
                duration: 0.7,
                ease: 'power3.out',
            });

            const heroTimeline = gsap.timeline({
                defaults: {
                    ease: 'power3.out',
                    duration: 0.9,
                },
            });

            heroTimeline
                .from('[data-landing-hero-label]', { autoAlpha: 0, y: 18 })
                .from(
                    '[data-landing-hero-title]',
                    { autoAlpha: 0, y: 36 },
                    '-=0.45',
                )
                .from(
                    '[data-landing-hero-copy]',
                    { autoAlpha: 0, y: 24 },
                    '-=0.5',
                )
                .from(
                    '[data-landing-hero-pillars] > *',
                    {
                        autoAlpha: 0,
                        y: 24,
                        stagger: 0.08,
                        duration: 0.65,
                    },
                    '-=0.4',
                );

            gsap.set(deferredSections, { autoAlpha: 0, y: 64 });
            gsap.set(surfaceItems, { autoAlpha: 0, y: 18, scale: 0.97 });

            deferredSections.forEach((section) => {
                gsap.to(section, {
                    autoAlpha: 1,
                    y: 0,
                    duration: 1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: section,
                        start: 'top 85%',
                        once: true,
                    },
                });
            });

            landingSections.forEach((section) => {
                const motionItems = section.querySelectorAll(
                    '[data-motion-item]:not([data-loop-step]):not([data-access-card]):not([data-surface-panel])',
                );

                if (motionItems.length === 0) {
                    return;
                }

                gsap.set(motionItems, { autoAlpha: 0, y: 28 });

                gsap.to(motionItems, {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.7,
                    ease: 'power2.out',
                    stagger: 0.08,
                    scrollTrigger: {
                        trigger: section,
                        start: 'top 72%',
                        once: true,
                    },
                });
            });

            surfaceItems.forEach((item, index) => {
                gsap.to(item, {
                    scale: 1,
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.8,
                    ease: 'power2.out',
                    delay: index % 3 === 0 ? 0.02 : 0,
                    scrollTrigger: {
                        trigger: item,
                        start: 'top 80%',
                        once: true,
                    },
                });
            });
        }, rootElement);

        return () => {
            context.revert();
            gsap.ticker.remove(tick);
            lenis.destroy();
        };
    }, []);

    return (
        <div
            ref={rootRef}
            className="min-h-screen overflow-x-hidden bg-background font-sans text-zinc-100 selection:bg-zinc-800 selection:text-white"
        >
            <nav
                data-landing-nav
                className="fixed top-0 right-0 z-50 p-6 mix-blend-difference"
            >
                <Link
                    href={enterLabUrl}
                    className="group flex items-center gap-2 text-xs font-medium tracking-wider text-zinc-400 uppercase transition-colors hover:text-white"
                >
                    Enter Lab
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
            </nav>

            <main>
                <ManifestoHero />
                <TrainingLoop />
                <ProductSurfacePreview />
                <AudienceFit />
                <AccessSection />
                <PhilosophyBlock />
                <MarketingClosing />
            </main>

            <MarketingFooter />
        </div>
    );
}
