import { Head } from '@inertiajs/react';
import { ProgressPage } from './ProgressPage';
import type { ProgressPageProps } from './types';

export default function ProgressIndex(props: ProgressPageProps) {
    return (
        <>
            <Head title="Training Progress" />
            <ProgressPage {...props} />
        </>
    );
}
