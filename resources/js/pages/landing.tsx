import { Head } from '@inertiajs/react';

import { LandingPage } from '@/components/landing/marketing/landing-page';

type LandingProps = {
    enterLabUrl: string;
};

export default function Landing({ enterLabUrl }: LandingProps) {
    return (
        <>
            <Head title="Endure" />
            <LandingPage enterLabUrl={enterLabUrl} />
        </>
    );
}
