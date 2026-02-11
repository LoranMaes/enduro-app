import type {
    ActivityView,
    TrainingSessionView,
    TrainingWeekView,
} from '@/types/training-plans';
import { WeekSection } from '../components/week-section';

type CalendarWeekRowProps = {
    week: TrainingWeekView;
    activities: ActivityView[];
    visibleDayDates: string[] | null;
    summaryRailWidth: number;
    canManageSessions: boolean;
    canManageSessionLinks: boolean;
    canOpenActivityDetails: boolean;
    onCreateSession: (date: string) => void;
    onEditSession: (session: TrainingSessionView) => void;
    onOpenActivity: (activity: ActivityView) => void;
};

export function CalendarWeekRow({
    week,
    activities,
    visibleDayDates,
    summaryRailWidth,
    canManageSessions,
    canManageSessionLinks,
    canOpenActivityDetails,
    onCreateSession,
    onEditSession,
    onOpenActivity,
}: CalendarWeekRowProps) {
    return (
        <WeekSection
            week={week}
            activities={activities}
            visibleDayDates={visibleDayDates}
            summaryRailWidth={summaryRailWidth}
            canManageSessions={canManageSessions}
            canManageSessionLinks={canManageSessionLinks}
            canOpenActivityDetails={canOpenActivityDetails}
            onCreateSession={onCreateSession}
            onEditSession={onEditSession}
            onOpenActivity={onOpenActivity}
        />
    );
}
