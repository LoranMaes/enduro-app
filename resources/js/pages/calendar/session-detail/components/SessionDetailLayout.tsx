import type { ReactNode } from 'react';

type SessionDetailLayoutProps = {
    mapPanel: ReactNode;
    statisticsPanel: ReactNode;
    analysisPanel: ReactNode;
    plannedStructurePanel: ReactNode;
    hasPlannedStructure: boolean;
};

export function SessionDetailLayout({
    mapPanel,
    statisticsPanel,
    analysisPanel,
    plannedStructurePanel,
    hasPlannedStructure,
}: SessionDetailLayoutProps) {
    return (
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
            <section className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.85fr)_minmax(17.5rem,0.75fr)]">
                {mapPanel}
                {statisticsPanel}
            </section>

            {hasPlannedStructure ? (
                <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(17.5rem,0.75fr)_minmax(0,1.25fr)]">
                    {plannedStructurePanel}
                    {analysisPanel}
                </section>
            ) : (
                <section>{analysisPanel}</section>
            )}
        </div>
    );
}
