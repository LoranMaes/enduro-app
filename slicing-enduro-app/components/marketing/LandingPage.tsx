
import React from 'react';
import { ManifestoHero } from './ManifestoHero';
import { TrainingLoop } from './TrainingLoop';
import { ProductSurfacePreview } from './ProductSurfacePreview';
import { AudienceFit } from './AudienceFit';
import { AccessSection } from './AccessSection';
import { PhilosophyBlock } from './PhilosophyBlock';
import { MarketingClosing } from './MarketingClosing';
import { MarketingFooter } from './MarketingFooter';
import { ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  return (
    <div className="min-h-screen bg-background text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white overflow-x-hidden">
      
      {/* Ghost Navigation for App Entry */}
      <nav className="fixed top-0 right-0 p-6 z-50 mix-blend-difference">
        <button 
          onClick={onEnterApp}
          className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors group uppercase tracking-wider"
        >
          Enter Lab
          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </button>
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
};
