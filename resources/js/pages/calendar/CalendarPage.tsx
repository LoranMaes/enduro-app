import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';
import type {
    ActivityView,
    CalendarEntryView,
    GoalView,
    TrainingSessionView,
} from '@/types/training-plans';
import type { WorkoutLibraryItemView } from '@/features/workout-library/WorkoutLibraryList';
import { CalendarEntryEditorModal } from './components/calendar-entry-editor-modal';
import { CalendarHeader } from './components/CalendarHeader';
import { CalendarWeekGrid } from './components/CalendarWeekGrid';
import {
    CreateEntrySelectorModal,
    OTHER_CREATE_ICONS,
    WORKOUT_CREATE_ICONS,
} from './components/create-entry-selector-modal';
import { GoalEditorModal } from './components/goal-editor-modal';
import { SessionEditorModal } from './components/session-editor-modal';
import { WorkoutLibraryDialog } from '@/features/workout-library/WorkoutLibraryDialog';
import { DAY_HEADERS, SYNC_PENDING_STATUSES, VIEW_MODES } from './constants';
import { useCalendarDragDrop } from './hooks/useCalendarDragDrop';
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
import { index as progressIndex } from '@/routes/progress';
import {
    store as storeTrainingSession,
    update as updateTrainingSession,
} from '@/routes/training-sessions';
import type {
    AthleteTrainingTargets,
    EntryTypeEntitlement,
    OtherEntryType,
    ProgressComplianceWeek,
    ProviderStatus,
    WorkoutEntrySport,
} from './types';
import { resolveAvatarInitials } from './utils';

type CalendarPageViewProps = {
    initialSessions: TrainingSessionView[];
    initialActivities: ActivityView[];
    initialEntries: CalendarEntryView[];
    initialGoals: GoalView[];
    initialCompliance: ProgressComplianceWeek[];
    initialWindow: CalendarWindow;
    providerStatus: ProviderStatus;
    entryTypeEntitlements: EntryTypeEntitlement[];
    isSubscribed: boolean;
    athleteTrainingTargets: AthleteTrainingTargets | null;
    viewingAthleteId?: number | null;
    viewingAthleteName?: string | null;
};

function normalizePlannedStructureForRequest(
    plannedStructure: TrainingSessionView['plannedStructure'],
) {
    if (plannedStructure === null || !Array.isArray(plannedStructure.steps)) {
        return null;
    }

    if (plannedStructure.steps.length === 0) {
        return null;
    }

    return {
        unit: plannedStructure.unit,
        mode: plannedStructure.mode,
        steps: plannedStructure.steps.map((step) => {
            return {
                id: step.id ?? null,
                type: step.type,
                duration_minutes: Math.max(1, Math.round(step.durationMinutes)),
                target: step.target ?? null,
                range_min: step.rangeMin ?? null,
                range_max: step.rangeMax ?? null,
                repeat_count: step.repeatCount ?? 1,
                note: step.note?.trim() === '' ? null : (step.note ?? null),
                items:
                    step.items?.map((item) => {
                        return {
                            id: item.id ?? null,
                            label: item.label ?? null,
                            duration_minutes: Math.max(
                                1,
                                Math.round(item.durationMinutes),
                            ),
                            target: item.target ?? null,
                            range_min: item.rangeMin ?? null,
                            range_max: item.rangeMax ?? null,
                        };
                    }) ?? null,
            };
        }),
    };
}

function normalizeLibraryStructureForRequest(
    structure: Record<string, unknown>,
) {
    const rawSteps = Array.isArray(structure.steps)
        ? structure.steps
        : Array.isArray((structure as { Steps?: unknown[] }).Steps)
          ? ((structure as { Steps: unknown[] }).Steps ?? [])
          : [];

    if (rawSteps.length === 0) {
        return null;
    }

    return {
        unit:
            (typeof structure.unit === 'string' ? structure.unit : null) ??
            (typeof (structure as { Unit?: unknown }).Unit === 'string'
                ? String((structure as { Unit?: unknown }).Unit)
                : 'rpe'),
        mode:
            (typeof structure.mode === 'string' ? structure.mode : null) ??
            (typeof (structure as { Mode?: unknown }).Mode === 'string'
                ? String((structure as { Mode?: unknown }).Mode)
                : 'target'),
        steps: rawSteps
            .map((rawStep, index) => {
                if (typeof rawStep !== 'object' || rawStep === null) {
                    return null;
                }

                const step = rawStep as {
                    id?: string;
                    type?: string;
                    duration_minutes?: number;
                    durationMinutes?: number;
                    target?: number | null;
                    range_min?: number | null;
                    range_max?: number | null;
                    rangeMin?: number | null;
                    rangeMax?: number | null;
                    repeat_count?: number | null;
                    repeatCount?: number | null;
                    note?: string | null;
                    items?: unknown[];
                };

                const items = Array.isArray(step.items) ? step.items : null;

                return {
                    id: step.id ?? `step-${index}`,
                    type: step.type ?? 'active',
                    duration_minutes: Math.max(
                        1,
                        Math.round(
                            Number(
                                step.duration_minutes ??
                                    step.durationMinutes ??
                                    1,
                            ),
                        ),
                    ),
                    target: step.target ?? null,
                    range_min: step.range_min ?? step.rangeMin ?? null,
                    range_max: step.range_max ?? step.rangeMax ?? null,
                    repeat_count: Math.max(
                        1,
                        Math.round(
                            Number(
                                step.repeat_count ??
                                    step.repeatCount ??
                                    1,
                            ),
                        ),
                    ),
                    note: step.note ?? null,
                    items:
                        items?.map((rawItem, itemIndex) => {
                            if (
                                typeof rawItem !== 'object' ||
                                rawItem === null
                            ) {
                                return null;
                            }

                            const item = rawItem as {
                                id?: string;
                                label?: string;
                                duration_minutes?: number;
                                durationMinutes?: number;
                                target?: number | null;
                                range_min?: number | null;
                                range_max?: number | null;
                                rangeMin?: number | null;
                                rangeMax?: number | null;
                            };

                            return {
                                id: item.id ?? `item-${index}-${itemIndex}`,
                                label: item.label ?? null,
                                duration_minutes: Math.max(
                                    1,
                                    Math.round(
                                        Number(
                                            item.duration_minutes ??
                                                item.durationMinutes ??
                                                1,
                                        ),
                                    ),
                                ),
                                target: item.target ?? null,
                                range_min: item.range_min ?? item.rangeMin ?? null,
                                range_max: item.range_max ?? item.rangeMax ?? null,
                            };
                        })?.filter((item): item is NonNullable<typeof item> => {
                            return item !== null;
                        }) ?? null,
                };
            })
            .filter((step): step is NonNullable<typeof step> => {
                return step !== null;
            }),
    };
}

export default function CalendarPage({
    initialSessions,
    initialActivities,
    initialEntries,
    initialGoals,
    initialCompliance,
    initialWindow,
    providerStatus,
    entryTypeEntitlements,
    isSubscribed,
    athleteTrainingTargets,
    viewingAthleteId = null,
    viewingAthleteName = null,
}: CalendarPageViewProps) {
    void viewingAthleteId;
    const [isWorkoutLibraryOpen, setIsWorkoutLibraryOpen] = useState(false);
    const [workoutLibraryPanelMode, setWorkoutLibraryPanelMode] = useState<
        'browse' | 'create'
    >('browse');

    const page = usePage<SharedData>();
    const { auth } = page.props;
    const previousSyncStatusRef = useRef<string | null>(null);
    const hydratedWindowRef = useRef(
        `${initialWindow.starts_at}:${initialWindow.ends_at}`,
    );
    const lastJumpedWeekRef = useRef<string | null>(null);

    const selection = useCalendarSelection({
        role: auth.user.role,
        impersonating: auth.impersonating ?? false,
    });

    const sessionState = useCalendarSessions({
        initialSessions,
        initialActivities,
        initialEntries,
        initialGoals,
        initialCompliance,
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
        fetchWindowGoals: sessionState.fetchWindowGoals,
        fetchWindowCompliance: sessionState.fetchWindowCompliance,
        mergeSessions: sessionState.mergeSessions,
        mergeActivities: sessionState.mergeActivities,
        mergeCalendarEntries: sessionState.mergeCalendarEntries,
        mergeGoals: sessionState.mergeGoals,
        mergeComplianceWeeks: sessionState.mergeComplianceWeeks,
        setSessions: sessionState.setSessions,
        setActivities: sessionState.setActivities,
        setCalendarEntries: sessionState.setCalendarEntries,
        setGoals: sessionState.setGoals,
        setComplianceWeeks: sessionState.setComplianceWeeks,
        setCalendarWindow: calendarWindowState.setCalendarWindow,
    });
    const scrollContainerRef = scrollState.scrollContainerRef;
    const weekElementsRef = scrollState.weekElementsRef;

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

    const weekGoals = useMemo(() => {
        const goalsByWeek = new Map<string, GoalView[]>();

        sessionState.goals.forEach((goal) => {
            if (goal.targetDate === null) {
                return;
            }

            const weekStart = formatDateKey(
                startOfIsoWeek(parseDate(goal.targetDate)),
            );
            const currentWeekGoals = goalsByWeek.get(weekStart) ?? [];
            currentWeekGoals.push(goal);
            goalsByWeek.set(weekStart, currentWeekGoals);
        });

        goalsByWeek.forEach((goals, key) => {
            goalsByWeek.set(
                key,
                goals.slice().sort((left, right) => left.id - right.id),
            );
        });

        return goalsByWeek;
    }, [sessionState.goals]);

    const weekCompliance = useMemo(() => {
        return sessionState.complianceWeeks.reduce<Map<string, ProgressComplianceWeek>>(
            (carry, week) => {
                carry.set(week.week_starts_at, week);

                return carry;
            },
            new Map<string, ProgressComplianceWeek>(),
        );
    }, [sessionState.complianceWeeks]);

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

    const moveSessionToDate = useCallback(
        async (
            session: TrainingSessionView,
            targetDate: string,
            targetWeekId: number,
        ): Promise<boolean> => {
            if (session.status === 'completed') {
                return false;
            }

            const route = updateTrainingSession(session.id);
            const payload = {
                date: targetDate,
                sport: session.sport,
                title: session.title,
                planned_duration_minutes: Math.max(
                    1,
                    session.durationMinutes,
                ),
                planned_tss: session.plannedTss,
                notes: session.notes,
                planned_structure: normalizePlannedStructureForRequest(
                    session.plannedStructure,
                ),
            };

            const tryUpdate = async (
                trainingWeekId: number | null,
            ): Promise<Response> => {
                return fetch(route.url, {
                    method: route.method.toUpperCase(),
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({
                        ...payload,
                        training_week_id: trainingWeekId,
                    }),
                });
            };

            const initialTrainingWeekId =
                session.trainingWeekId === null ? null : targetWeekId;
            let response = await tryUpdate(initialTrainingWeekId);

            if (!response.ok && initialTrainingWeekId !== null) {
                response = await tryUpdate(null);
            }

            if (!response.ok) {
                return false;
            }

            sessionState.refreshCalendarData(calendarWindowState.calendarWindow);

            return true;
        },
        [calendarWindowState.calendarWindow, sessionState.refreshCalendarData],
    );

    const createSessionFromLibraryAtDate = useCallback(
        async (
            item: WorkoutLibraryItemView,
            sport: string,
            targetDate: string,
            targetWeekId: number,
        ): Promise<boolean> => {
            const route = storeTrainingSession();
            const payload = {
                date: targetDate,
                sport,
                title: item.title,
                planned_duration_minutes: Math.max(
                    1,
                    item.estimated_duration_minutes,
                ),
                planned_tss: item.estimated_tss,
                notes: null,
                planned_structure: normalizeLibraryStructureForRequest(
                    item.structure_json,
                ),
            };

            const tryCreate = async (
                trainingWeekId: number | null,
            ): Promise<Response> => {
                return fetch(route.url, {
                    method: route.method.toUpperCase(),
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({
                        ...payload,
                        training_week_id: trainingWeekId,
                    }),
                });
            };

            let response = await tryCreate(targetWeekId);

            if (!response.ok) {
                response = await tryCreate(null);
            }

            if (!response.ok) {
                return false;
            }

            sessionState.refreshCalendarData(calendarWindowState.calendarWindow);

            return true;
        },
        [calendarWindowState.calendarWindow, sessionState.refreshCalendarData],
    );

    const dragDrop = useCalendarDragDrop({
        onMoveSessionToDate: moveSessionToDate,
        onCreateFromLibraryAtDate: createSessionFromLibraryAtDate,
    });

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
    const requestedWeekFromQuery = useMemo(() => {
        const parsedUrl = new URL(
            page.url,
            window?.location.origin ?? 'http://localhost',
        );
        const week = parsedUrl.searchParams.get('week');

        if (week === null || !/^\d{4}-\d{2}-\d{2}$/.test(week)) {
            return null;
        }

        return week;
    }, [page.url]);

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

    useEffect(() => {
        if (
            requestedWeekFromQuery === null ||
            requestedWeekFromQuery === lastJumpedWeekRef.current
        ) {
            return;
        }

        if (calendarWindowState.calendarViewMode !== 'infinite') {
            return;
        }

        scrollState.jumpToWeek(requestedWeekFromQuery, 'auto');
        lastJumpedWeekRef.current = requestedWeekFromQuery;
    }, [
        calendarWindowState.calendarViewMode,
        requestedWeekFromQuery,
        scrollState.jumpToWeek,
        calendarWindowState.visibleWeeks,
    ]);

    return (
        <section
            ref={scrollContainerRef}
            className={cn(
                'relative flex min-h-0 flex-1 flex-col overflow-y-auto bg-background transition-[padding-right] duration-300 [--calendar-controls-height:2.5rem] [--calendar-days-height:2.75rem] [--calendar-header-height:4rem] [--calendar-week-sticky:calc(var(--calendar-header-height)+var(--calendar-controls-height)+var(--calendar-days-height))]',
                isWorkoutLibraryOpen &&
                    workoutLibraryPanelMode === 'browse' &&
                    'xl:pr-[24rem]',
                isWorkoutLibraryOpen &&
                    workoutLibraryPanelMode === 'create' &&
                    'xl:pr-[44rem]',
            )}
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
                onOpenWorkoutLibrary={() => {
                    setIsWorkoutLibraryOpen(true);
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
                weekGoals={weekGoals}
                weekCompliance={weekCompliance}
                activeDayDates={calendarWindowState.activeDayDates}
                canManageSessions={selection.canManageSessionWrites}
                canManageSessionLinks={selection.canManageSessionLinks}
                canOpenActivityDetails={selection.canOpenActivityDetails}
                onCreateSession={selection.openCreateEntryFlow}
                onEditSession={selection.openEditSessionModal}
                onSessionDragStart={dragDrop.startSessionDrag}
                onSessionDragEnd={dragDrop.endDrag}
                onDayDragOver={dragDrop.handleDayDragOver}
                onDayDrop={(targetDate, targetWeekId) => {
                    void dragDrop.handleDayDrop(targetDate, targetWeekId);
                }}
                draggingSessionId={dragDrop.draggingSessionId}
                isDayDropTarget={dragDrop.isDropTarget}
                onOpenActivity={selection.openActivityDetails}
                onOpenCalendarEntry={selection.openEditCalendarEntryModal}
                onOpenGoal={selection.openGoalModal}
                onOpenProgressForWeek={(weekStartsAt) => {
                    const currentWeek = startOfIsoWeek(
                        parseDate(calendarWindowState.currentWeekStart),
                    );
                    const targetWeek = startOfIsoWeek(parseDate(weekStartsAt));
                    const daysDiff = Math.abs(
                        Math.round(
                            (currentWeek.getTime() - targetWeek.getTime()) /
                                (1000 * 60 * 60 * 24),
                        ),
                    );
                    const weeksNeeded = Math.max(1, Math.ceil(daysDiff / 7) + 1);
                    const rangeOptions = [4, 8, 12, 24];
                    const selectedRange =
                        rangeOptions.find((option) => option >= weeksNeeded) ?? 24;
                    const route = progressIndex({
                        query: { weeks: selectedRange },
                    });

                    router.get(route.url, undefined, {
                        preserveScroll: true,
                        preserveState: false,
                    });
                }}
                weekElementsRef={weekElementsRef}
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

                    if (type === 'goal') {
                        selection.openCreateGoalModal(selection.createEntryDate);

                        return;
                    }

                    selection.openCreateCalendarEntryModal(
                        selection.createEntryDate,
                        type,
                    );
                }}
            />

            <WorkoutLibraryDialog
                open={isWorkoutLibraryOpen}
                trainingTargets={athleteTrainingTargets}
                onOpenChange={(nextOpen) => {
                    setIsWorkoutLibraryOpen(nextOpen);
                }}
                onTemplateDragStart={(item, sport) => {
                    dragDrop.startLibraryDrag(item, sport);
                }}
                onTemplateDragEnd={() => {
                    dragDrop.endDrag();
                }}
                onPanelModeChange={setWorkoutLibraryPanelMode}
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

            <GoalEditorModal
                open={selection.goalEditorContext !== null}
                context={selection.goalEditorContext}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) {
                        selection.closeGoalModal();
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
