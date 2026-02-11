import { Head, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef } from 'react';
import type { SharedData } from '@/types';
import type {
    ActivityView,
    TrainingSessionView,
} from '@/types/training-plans';
import { DAY_HEADERS, SYNC_PENDING_STATUSES, VIEW_MODES } from './constants';
import {
    formatDateKey,
    parseDate,
    startOfIsoWeek,
    type CalendarWindow,
} from './lib/calendar-weeks';
import { SessionEditorModal } from './components/session-editor-modal';
import { CalendarHeader } from './components/CalendarHeader';
import { CalendarWeekGrid } from './components/CalendarWeekGrid';
import { useCalendarInfiniteLoading } from './hooks/useCalendarInfiniteLoading';
import { useCalendarScroll } from './hooks/useCalendarScroll';
import { useCalendarSelection } from './hooks/useCalendarSelection';
import { useCalendarSessions } from './hooks/useCalendarSessions';
import { useCalendarWindow } from './hooks/useCalendarWindow';
import type { AthleteTrainingTargets, ProviderStatus } from './types';
import { resolveAvatarInitials } from './utils';

type CalendarPageViewProps = {
    initialSessions: TrainingSessionView[];
    initialActivities: ActivityView[];
    initialWindow: CalendarWindow;
    providerStatus: ProviderStatus;
    athleteTrainingTargets: AthleteTrainingTargets | null;
    viewingAthleteId?: number | null;
    viewingAthleteName?: string | null;
};

export default function CalendarPage({
    initialSessions,
    initialActivities,
    initialWindow,
    providerStatus,
    athleteTrainingTargets,
    viewingAthleteId = null,
    viewingAthleteName = null,
}: CalendarPageViewProps) {
    void viewingAthleteId;

    const { auth } = usePage<SharedData>().props;
    const previousSyncStatusRef = useRef<string | null>(null);
    const hydratedWindowRef = useRef(
        `${initialWindow.starts_at}:${initialWindow.ends_at}`,
    );

    const selection = useCalendarSelection({
        role: auth.user.role,
        impersonating: auth.impersonating ?? false,
    });

    const sessionState = useCalendarSessions({
        initialSessions,
        initialActivities,
        initialWindow,
        providerStatus,
        authUserId: auth.user.id,
        canManageSessionWrites: selection.canManageSessionWrites,
    });

    const calendarWindowState = useCalendarWindow(
        initialWindow,
        sessionState.sessions,
    );

    const scrollState = useCalendarScroll({
        calendarViewMode: calendarWindowState.calendarViewMode,
        currentWeekStart: calendarWindowState.currentWeekStart,
        focusWeekStart: calendarWindowState.focusWeekStart,
        visibleWeeks: calendarWindowState.visibleWeeks,
    });

    const infiniteLoading = useCalendarInfiniteLoading({
        calendarViewMode: calendarWindowState.calendarViewMode,
        calendarWindow: calendarWindowState.calendarWindow,
        scrollContainerRef: scrollState.scrollContainerRef,
        fetchWindowSessions: sessionState.fetchWindowSessions,
        fetchWindowActivities: sessionState.fetchWindowActivities,
        mergeSessions: sessionState.mergeSessions,
        mergeActivities: sessionState.mergeActivities,
        setSessions: sessionState.setSessions,
        setActivities: sessionState.setActivities,
        setCalendarWindow: calendarWindowState.setCalendarWindow,
    });

    const weekActivities = useMemo(() => {
        const activitiesByWeek = new Map<string, ActivityView[]>();

        sessionState.activities.forEach((activity) => {
            if (activity.startedDate === null) {
                return;
            }

            const weekStart = formatDateKey(
                startOfIsoWeek(parseDate(activity.startedDate)),
            );
            const currentWeekActivities = activitiesByWeek.get(weekStart) ?? [];
            currentWeekActivities.push(activity);
            activitiesByWeek.set(weekStart, currentWeekActivities);
        });

        activitiesByWeek.forEach((items, key) => {
            activitiesByWeek.set(
                key,
                items.slice().sort((left, right) => {
                    if (left.startedAt === right.startedAt) {
                        return left.id - right.id;
                    }

                    return (left.startedAt ?? '').localeCompare(
                        right.startedAt ?? '',
                    );
                }),
            );
        });

        return activitiesByWeek;
    }, [sessionState.activities]);

    const jumpButtonVisible =
        calendarWindowState.calendarViewMode === 'infinite'
            ? !scrollState.isCurrentWeekVisible
            : calendarWindowState.focusWeekStart !==
              calendarWindowState.currentWeekStart;

    const activeDayHeaders = useMemo(() => {
        if (calendarWindowState.calendarViewMode !== 'day') {
            return DAY_HEADERS;
        }

        return calendarWindowState.activeDayHeaders;
    }, [
        calendarWindowState.activeDayHeaders,
        calendarWindowState.calendarViewMode,
    ]);

    const canShowSyncButton =
        selection.canManageSessionWrites &&
        sessionState.stravaStatus?.connected === true;

    const isStravaSyncInProgress = SYNC_PENDING_STATUSES.has(
        sessionState.stravaSyncStatus ?? '',
    );

    useEffect(() => {
        const nextSignature = `${initialWindow.starts_at}:${initialWindow.ends_at}`;

        if (hydratedWindowRef.current === nextSignature) {
            return;
        }

        hydratedWindowRef.current = nextSignature;
        calendarWindowState.setCalendarWindow(initialWindow);
        scrollState.markHydratedWindow();
    }, [
        initialWindow.ends_at,
        initialWindow.starts_at,
        initialWindow,
        calendarWindowState.setCalendarWindow,
        scrollState.markHydratedWindow,
    ]);

    useEffect(() => {
        const nextWindow = calendarWindowState.ensureFocusWithinWindow();

        if (nextWindow === null) {
            return;
        }

        calendarWindowState.setCalendarWindow(nextWindow);
        sessionState.refreshCalendarData(nextWindow);
    }, [
        calendarWindowState.ensureFocusWithinWindow,
        calendarWindowState.setCalendarWindow,
        sessionState.refreshCalendarData,
    ]);

    useEffect(() => {
        const currentStatus = sessionState.stravaStatus?.last_sync_status ?? null;
        const previousStatus = previousSyncStatusRef.current;

        if (
            previousStatus !== null &&
            previousStatus !== currentStatus &&
            currentStatus === 'success'
        ) {
            sessionState.refreshCalendarData(calendarWindowState.calendarWindow);
        }

        previousSyncStatusRef.current = currentStatus;
    }, [
        calendarWindowState.calendarWindow,
        sessionState.refreshCalendarData,
        sessionState.stravaStatus?.last_sync_status,
    ]);

    return (
        <section
            ref={scrollState.scrollContainerRef}
            className="relative flex min-h-0 flex-1 flex-col overflow-y-auto bg-background [--calendar-controls-height:2.5rem] [--calendar-days-height:2.75rem] [--calendar-header-height:4rem] [--calendar-week-sticky:calc(var(--calendar-header-height)+var(--calendar-controls-height)+var(--calendar-days-height))]"
        >
            <Head title="Calendar" />

            <CalendarHeader
                viewingAthleteName={viewingAthleteName}
                canManageSessionWrites={selection.canManageSessionWrites}
                isRefreshing={sessionState.isRefreshing}
                integrationDotClass={sessionState.integrationDotClass}
                integrationLabel={sessionState.integrationLabel}
                stravaSyncStatus={sessionState.stravaSyncStatus}
                canShowSyncButton={canShowSyncButton}
                isSyncDispatching={sessionState.isSyncDispatching}
                isStravaSyncInProgress={isStravaSyncInProgress}
                onSync={() => {
                    void sessionState.triggerProviderSync();
                }}
                viewModes={VIEW_MODES}
                calendarViewMode={calendarWindowState.calendarViewMode}
                onModeChange={calendarWindowState.setCalendarViewMode}
                onShiftFocusDate={calendarWindowState.shiftFocusDate}
                focusLabel={calendarWindowState.focusLabel}
                jumpButtonVisible={jumpButtonVisible}
                onJumpToCurrentWeek={() => {
                    if (calendarWindowState.calendarViewMode !== 'infinite') {
                        calendarWindowState.setFocusDate(formatDateKey(new Date()));

                        return;
                    }

                    scrollState.jumpToCurrentWeek();
                }}
                avatarInitials={resolveAvatarInitials(auth.user.name)}
                headerGridTemplateColumns={
                    calendarWindowState.headerGridTemplateColumns
                }
                activeDayHeaders={activeDayHeaders}
            />

            <CalendarWeekGrid
                visibleWeeks={calendarWindowState.visibleWeeks}
                weekActivities={weekActivities}
                activeDayDates={calendarWindowState.activeDayDates}
                canManageSessions={selection.canManageSessionWrites}
                canManageSessionLinks={selection.canManageSessionLinks}
                canOpenActivityDetails={selection.canOpenActivityDetails}
                onCreateSession={selection.openCreateSessionModal}
                onEditSession={selection.openEditSessionModal}
                onOpenActivity={selection.openActivityDetails}
                weekElementsRef={scrollState.weekElementsRef}
                topSentinelRef={infiniteLoading.topSentinelRef}
                bottomSentinelRef={infiniteLoading.bottomSentinelRef}
                isLoadingPast={infiniteLoading.isLoadingPast}
                isLoadingFuture={infiniteLoading.isLoadingFuture}
                isRefreshing={sessionState.isRefreshing}
            />

            <div className="h-16" />

            <SessionEditorModal
                open={selection.sessionEditorContext !== null}
                context={selection.sessionEditorContext}
                onOpenChange={(open) => {
                    if (!open) {
                        selection.closeSessionModal();
                    }
                }}
                canManageSessionWrites={selection.canManageSessionWrites}
                canManageSessionLinks={selection.canManageSessionLinks}
                athleteTrainingTargets={athleteTrainingTargets}
                onSaved={() => {
                    sessionState.refreshCalendarData(
                        calendarWindowState.calendarWindow,
                    );
                }}
            />
        </section>
    );
}
