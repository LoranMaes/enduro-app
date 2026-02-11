import type { MutableRefObject } from 'react';
import { cn } from '@/lib/utils';
import type { ActivityView, TrainingSessionView } from '@/types/training-plans';
import { SUMMARY_RAIL_WIDTH } from '../constants';
import { CalendarEmptyState } from './CalendarEmptyState';
import { CalendarWeekRow } from './CalendarWeekRow';

type CalendarWeekGridProps = {
    visibleWeeks: Array<{
        id: number;
        startsAt: string;
        sessions: TrainingSessionView[];
        endsAt: string;
    }>;
    weekActivities: Map<string, ActivityView[]>;
    activeDayDates: string[] | null;
    canManageSessions: boolean;
    canManageSessionLinks: boolean;
    canOpenActivityDetails: boolean;
    onCreateSession: (date: string) => void;
    onEditSession: (session: TrainingSessionView) => void;
    onOpenActivity: (activity: ActivityView) => void;
    weekElementsRef: MutableRefObject<Record<string, HTMLDivElement | null>>;
    topSentinelRef: MutableRefObject<HTMLDivElement | null>;
    bottomSentinelRef: MutableRefObject<HTMLDivElement | null>;
    isLoadingPast: boolean;
    isLoadingFuture: boolean;
    isRefreshing: boolean;
};

export function CalendarWeekGrid({
    visibleWeeks,
    weekActivities,
    activeDayDates,
    canManageSessions,
    canManageSessionLinks,
    canOpenActivityDetails,
    onCreateSession,
    onEditSession,
    onOpenActivity,
    weekElementsRef,
    topSentinelRef,
    bottomSentinelRef,
    isLoadingPast,
    isLoadingFuture,
    isRefreshing,
}: CalendarWeekGridProps) {
    return (
        <div className={cn('flex-1 transition-opacity', isRefreshing && 'opacity-80')}>
            <div ref={topSentinelRef} className="h-px w-full" />
            {isLoadingPast ? (
                <p className="border-b border-border/50 px-4 py-1 text-[0.625rem] text-zinc-500 uppercase">
                    Loading earlier weeks...
                </p>
            ) : null}
            {visibleWeeks.map((week) => (
                <div
                    key={week.id}
                    data-week-start={week.startsAt}
                    ref={(element) => {
                        weekElementsRef.current[week.startsAt] = element;
                    }}
                >
                    <CalendarWeekRow
                        week={week}
                        activities={weekActivities.get(week.startsAt) ?? []}
                        visibleDayDates={activeDayDates}
                        summaryRailWidth={SUMMARY_RAIL_WIDTH}
                        canManageSessions={canManageSessions}
                        canManageSessionLinks={canManageSessionLinks}
                        canOpenActivityDetails={canOpenActivityDetails}
                        onCreateSession={onCreateSession}
                        onEditSession={onEditSession}
                        onOpenActivity={onOpenActivity}
                    />
                </div>
            ))}
            {visibleWeeks.length === 0 ? <CalendarEmptyState /> : null}
            {isLoadingFuture ? (
                <p className="border-t border-border/50 px-4 py-1 text-[0.625rem] text-zinc-500 uppercase">
                    Loading upcoming weeks...
                </p>
            ) : null}
            <div ref={bottomSentinelRef} className="h-px w-full" />
        </div>
    );
}
