import type {
    ActivityView,
    CalendarEntryView,
    TrainingSessionView,
    TrainingWeekView,
} from '@/types/training-plans';
import { WeekSection } from '../components/week-section';

type CalendarWeekRowProps = {
    week: TrainingWeekView;
    activities: ActivityView[];
    calendarEntries: CalendarEntryView[];
    visibleDayDates: string[] | null;
    summaryRailWidth: number;
    canManageSessions: boolean;
    canManageSessionLinks: boolean;
    canOpenActivityDetails: boolean;
    onCreateSession: (date: string) => void;
    onEditSession: (session: TrainingSessionView) => void;
    onOpenActivity: (activity: ActivityView) => void;
    onOpenCalendarEntry: (entry: CalendarEntryView) => void;
};

export function CalendarWeekRow({
    week,
    activities,
    calendarEntries,
    visibleDayDates,
    summaryRailWidth,
    canManageSessions,
    canManageSessionLinks,
    canOpenActivityDetails,
    onCreateSession,
    onEditSession,
    onOpenActivity,
    onOpenCalendarEntry,
}: CalendarWeekRowProps) {
    return (
        <WeekSection
            week={week}
            activities={activities}
            calendarEntries={calendarEntries}
            visibleDayDates={visibleDayDates}
            summaryRailWidth={summaryRailWidth}
            canManageSessions={canManageSessions}
            canManageSessionLinks={canManageSessionLinks}
            canOpenActivityDetails={canOpenActivityDetails}
            onCreateSession={onCreateSession}
            onEditSession={onEditSession}
            onOpenActivity={onOpenActivity}
            onOpenCalendarEntry={onOpenCalendarEntry}
        />
    );
}
