import type { MutableRefObject } from 'react';
import { cn } from '@/lib/utils';
import type {
    ActivityView,
    CalendarEntryView,
    GoalView,
    TrainingSessionView,
} from '@/types/training-plans';
import { SUMMARY_RAIL_WIDTH } from '../constants';
import type { ProgressComplianceWeek } from '../types';
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
    weekCalendarEntries: Map<string, CalendarEntryView[]>;
    weekGoals: Map<string, GoalView[]>;
    weekCompliance: Map<string, ProgressComplianceWeek>;
    activeDayDates: string[] | null;
    canManageSessions: boolean;
    canManageSessionLinks: boolean;
    canOpenActivityDetails: boolean;
    onCreateSession: (date: string) => void;
    onEditSession: (session: TrainingSessionView) => void;
    onSessionDragStart: (session: TrainingSessionView) => void;
    onSessionDragEnd: () => void;
    onDayDragOver: (date: string) => void;
    onDayDrop: (date: string, targetWeekId: number) => void;
    draggingSessionId: number | null;
    isDayDropTarget: (date: string) => boolean;
    onOpenActivity: (activity: ActivityView) => void;
    onOpenCalendarEntry: (entry: CalendarEntryView) => void;
    onOpenGoal: (goal: GoalView) => void;
    onOpenProgressForWeek: (weekStartsAt: string) => void;
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
    weekCalendarEntries,
    weekGoals,
    weekCompliance,
    activeDayDates,
    canManageSessions,
    canManageSessionLinks,
    canOpenActivityDetails,
    onCreateSession,
    onEditSession,
    onSessionDragStart,
    onSessionDragEnd,
    onDayDragOver,
    onDayDrop,
    draggingSessionId,
    isDayDropTarget,
    onOpenActivity,
    onOpenCalendarEntry,
    onOpenGoal,
    onOpenProgressForWeek,
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
                        calendarEntries={
                            weekCalendarEntries.get(week.startsAt) ?? []
                        }
                        goals={weekGoals.get(week.startsAt) ?? []}
                        compliance={weekCompliance.get(week.startsAt) ?? null}
                        visibleDayDates={activeDayDates}
                        summaryRailWidth={SUMMARY_RAIL_WIDTH}
                        canManageSessions={canManageSessions}
                        canManageSessionLinks={canManageSessionLinks}
                        canOpenActivityDetails={canOpenActivityDetails}
                        onCreateSession={onCreateSession}
                        onEditSession={onEditSession}
                        onSessionDragStart={onSessionDragStart}
                        onSessionDragEnd={onSessionDragEnd}
                        onDayDragOver={onDayDragOver}
                        onDayDrop={onDayDrop}
                        draggingSessionId={draggingSessionId}
                        isDayDropTarget={isDayDropTarget}
                        onOpenActivity={onOpenActivity}
                        onOpenCalendarEntry={onOpenCalendarEntry}
                        onOpenGoal={onOpenGoal}
                        onOpenProgressForWeek={onOpenProgressForWeek}
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
