import { Head, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef } from 'react';
import type { SharedData } from '@/types';
import type {
    ActivityView,
    CalendarEntryView,
    TrainingSessionView,
} from '@/types/training-plans';
import { CalendarEntryEditorModal } from './components/calendar-entry-editor-modal';
import { CalendarHeader } from './components/CalendarHeader';
import { CalendarWeekGrid } from './components/CalendarWeekGrid';
import {
    CreateEntrySelectorModal,
    OTHER_CREATE_ICONS,
    WORKOUT_CREATE_ICONS,
} from './components/create-entry-selector-modal';
import { SessionEditorModal } from './components/session-editor-modal';
import { DAY_HEADERS, SYNC_PENDING_STATUSES, VIEW_MODES } from './constants';
import { useCalendarInfiniteLoading } from './hooks/useCalendarInfiniteLoading';
import { useCalendarScroll } from './hooks/useCalendarScroll';
import { useCalendarSelection } from './hooks/useCalendarSelection';
import { useCalendarSessions } from './hooks/useCalendarSessions';
import { useCalendarWindow } from './hooks/useCalendarWindow';
import {
    formatDateKey,
    parseDate,
    startOfIsoWeek,
    type CalendarWindow,
} from './lib/calendar-weeks';
import type {
    AthleteTrainingTargets,
    EntryTypeEntitlement,
    OtherEntryType,
    ProviderStatus,
    WorkoutEntrySport,
} from './types';
import { resolveAvatarInitials } from './utils';

type CalendarPageViewProps = {
    initialSessions: TrainingSessionView[];
    initialActivities: ActivityView[];
    initialEntries: CalendarEntryView[];
    initialWindow: CalendarWindow;
    providerStatus: ProviderStatus;
    entryTypeEntitlements: EntryTypeEntitlement[];
    isSubscribed: boolean;
    athleteTrainingTargets: AthleteTrainingTargets | null;
    viewingAthleteId?: number | null;
    viewingAthleteName?: string | null;
};

export default function CalendarPage({
    initialSessions,
    initialActivities,
    initialEntries,
    initialWindow,
    providerStatus,
    entryTypeEntitlements,
    isSubscribed,
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
        initialEntries,
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
        fetchWindowCalendarEntries: sessionState.fetchWindowCalendarEntries,
        mergeSessions: sessionState.mergeSessions,
        mergeActivities: sessionState.mergeActivities,
        mergeCalendarEntries: sessionState.mergeCalendarEntries,
        setSessions: sessionState.setSessions,
        setActivities: sessionState.setActivities,
        setCalendarEntries: sessionState.setCalendarEntries,
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

    const weekCalendarEntries = useMemo(() => {
        const entriesByWeek = new Map<string, CalendarEntryView[]>();

        sessionState.calendarEntries.forEach((entry) => {
            const weekStart = formatDateKey(
                startOfIsoWeek(parseDate(entry.scheduledDate)),
            );
            const currentWeekEntries = entriesByWeek.get(weekStart) ?? [];
            currentWeekEntries.push(entry);
            entriesByWeek.set(weekStart, currentWeekEntries);
        });

        entriesByWeek.forEach((entries, key) => {
            entriesByWeek.set(
                key,
                entries.slice().sort((left, right) => left.id - right.id),
            );
        });

        return entriesByWeek;
    }, [sessionState.calendarEntries]);

    const entitlementMap = useMemo(() => {
        return entryTypeEntitlements.reduce<Record<string, boolean>>(
            (carry, entitlement) => {
                carry[entitlement.key] = entitlement.requires_subscription;

                return carry;
            },
            {},
        );
    }, [entryTypeEntitlements]);

    const workoutCreateOptions = useMemo(() => {
        const options: Array<{
            sport: WorkoutEntrySport;
            label: string;
        }> = [
            { sport: 'run', label: 'Run' },
            { sport: 'bike', label: 'Bike' },
            { sport: 'swim', label: 'Swim' },
            { sport: 'day_off', label: 'Day Off' },
            { sport: 'mtn_bike', label: 'MTN Bike' },
            { sport: 'custom', label: 'Custom' },
            { sport: 'walk', label: 'Walk' },
        ];

        return options.map((option) => ({
            ...option,
            icon: WORKOUT_CREATE_ICONS[option.sport],
            locked:
                !isSubscribed &&
                Boolean(entitlementMap[`workout.${option.sport}`]),
        }));
    }, [entitlementMap, isSubscribed]);

    const otherCreateOptions = useMemo(() => {
        const options: Array<{
            type: OtherEntryType;
            label: string;
        }> = [
            { type: 'event', label: 'Event' },
            { type: 'goal', label: 'Goal' },
            { type: 'note', label: 'Note' },
        ];

        return options.map((option) => ({
            ...option,
            icon: OTHER_CREATE_ICONS[option.type],
            locked:
                !isSubscribed &&
                Boolean(entitlementMap[`other.${option.type}`]),
        }));
    }, [entitlementMap, isSubscribed]);

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
                weekCalendarEntries={weekCalendarEntries}
                activeDayDates={calendarWindowState.activeDayDates}
                canManageSessions={selection.canManageSessionWrites}
                canManageSessionLinks={selection.canManageSessionLinks}
                canOpenActivityDetails={selection.canOpenActivityDetails}
                onCreateSession={selection.openCreateEntryFlow}
                onEditSession={selection.openEditSessionModal}
                onOpenActivity={selection.openActivityDetails}
                onOpenCalendarEntry={selection.openEditCalendarEntryModal}
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

            <CreateEntrySelectorModal
                open={selection.createEntryDate !== null}
                date={selection.createEntryDate}
                workoutOptions={workoutCreateOptions}
                otherOptions={otherCreateOptions}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) {
                        selection.closeCreateEntryFlow();
                    }
                }}
                onSelectWorkout={(sport) => {
                    if (selection.createEntryDate === null) {
                        return;
                    }

                    selection.openCreateSessionModal(selection.createEntryDate, sport);
                }}
                onSelectOther={(type) => {
                    if (selection.createEntryDate === null) {
                        return;
                    }

                    selection.openCreateCalendarEntryModal(
                        selection.createEntryDate,
                        type,
                    );
                }}
            />

            <CalendarEntryEditorModal
                open={selection.calendarEntryEditorContext !== null}
                context={selection.calendarEntryEditorContext}
                isSubscribed={isSubscribed}
                entryTypeEntitlements={entryTypeEntitlements}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) {
                        selection.closeCalendarEntryModal();
                    }
                }}
                onSaved={() => {
                    sessionState.refreshCalendarData(
                        calendarWindowState.calendarWindow,
                    );
                }}
            />
        </section>
    );
}
