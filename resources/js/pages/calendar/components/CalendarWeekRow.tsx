import type {
    ActivityView,
    CalendarEntryView,
    GoalView,
    TrainingSessionView,
    TrainingWeekView,
} from '@/types/training-plans';
import type { ProgressComplianceWeek } from '../types';
import { WeekSection } from '../components/week-section';

type CalendarWeekRowProps = {
    week: TrainingWeekView;
    activities: ActivityView[];
    calendarEntries: CalendarEntryView[];
    goals: GoalView[];
    compliance: ProgressComplianceWeek | null;
    visibleDayDates: string[] | null;
    summaryRailWidth: number;
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
};

export function CalendarWeekRow({
    week,
    activities,
    calendarEntries,
    goals,
    compliance,
    visibleDayDates,
    summaryRailWidth,
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
}: CalendarWeekRowProps) {
    return (
        <WeekSection
            week={week}
            activities={activities}
            calendarEntries={calendarEntries}
            goals={goals}
            compliance={compliance}
            visibleDayDates={visibleDayDates}
            summaryRailWidth={summaryRailWidth}
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
    );
}
