import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { mapTrainingSession } from '@/lib/training-plans';
import { dashboard } from '@/routes';
import { show as showSession } from '@/routes/sessions';
import { update as updateTrainingSession } from '@/routes/training-sessions';
import type { BreadcrumbItem, SharedData } from '@/types';
import { SessionAnalysisChart } from './session-detail/components/SessionAnalysisChart';
import { SessionDetailLayout } from './session-detail/components/SessionDetailLayout';
import { SessionMap } from './session-detail/components/SessionMap';
import { SessionPlannedStructurePreview } from './session-detail/components/SessionPlannedStructurePreview';
import { SessionStatisticsCard } from './session-detail/components/SessionStatisticsCard';
import { useSessionHover } from './session-detail/hooks/useSessionHover';
import { useSessionStats } from './session-detail/hooks/useSessionStats';
import { useSessionStreams } from './session-detail/hooks/useSessionStreams';
import { useSessionZoom } from './session-detail/hooks/useSessionZoom';
import type { SessionDetailPageProps } from './session-detail/types';
import {
    extractErrorMessage,
    formatDate,
    serializePlannedStructureForRequest,
} from './session-detail/utils';

export default function SessionDetailPage({
    session,
    providerStatus,
    isActivityOnly = false,
}: SessionDetailPageProps) {
    const { auth } = usePage<SharedData>().props;
    const sessionView = mapTrainingSession(session);

    const [internalNotes, setInternalNotes] = useState(sessionView.notes ?? '');
    const [savedNotes, setSavedNotes] = useState(sessionView.notes ?? '');
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [notesError, setNotesError] = useState<string | null>(null);
    const [notesStatus, setNotesStatus] = useState<string | null>(null);
    const [sideCardTab, setSideCardTab] = useState<'statistics' | 'notes'>(
        'statistics',
    );

    const linkedActivityId = sessionView.linkedActivityId;
    const canEditNotes =
        !isActivityOnly &&
        auth.user.role === 'athlete' &&
        auth.impersonating !== true;

    const {
        streamData,
        streamError,
        isLoadingStreams,
        activeStreams,
        setActiveStreams,
        xAxisMode,
        setXAxisMode,
        availableStreams,
        normalizedStreams,
        orderedStreamKeys,
        enabledStreamKeys,
        rawXAxisSamples,
        referencePoints,
        baseSeries,
        fallbackXAxisBySample,
        latLngPoints,
        xMin,
        xMax,
        plannedSegments,
        hasPlannedStructure,
        plannedPreviewScaleMax,
        totalPlannedSegmentDuration,
        canUseDistanceAxis,
    } = useSessionStreams({
        linkedActivityId,
        plannedStructure: sessionView.plannedStructure,
    });

    const {
        hoverSampleIndex,
        setHoverSampleIndex,
        hoverPoint,
        hoverSummary,
    } = useSessionHover({
        latLngPoints,
        rawXAxisSamples,
        fallbackXAxisBySample,
        enabledStreamKeys,
        normalizedStreams,
        plannedSegments,
    });

    const {
        isZoomed,
        zoomedSeries,
        visibleReferencePoints,
        focusedRoutePoints,
        selectedRangeSummary,
        showSelectionPanel,
        resetZoomSelection,
        applyZoomSelection,
    } = useSessionZoom({
        xMin,
        xMax,
        baseSeries,
        referencePoints,
        latLngPoints,
        rawXAxisSamples,
        fallbackXAxisBySample,
        normalizedStreams,
        onHoverSampleIndexChange: setHoverSampleIndex,
    });

    const {
        avgHeartRate,
        avgPower,
        avgCadence,
        avgSpeedLabel,
        totalDistanceKilometers,
        elevationGainMeters,
        stravaStatus,
        integrationLabel,
    } = useSessionStats({
        sessionView,
        normalizedStreams,
        providerStatus,
    });

    useEffect(() => {
        setInternalNotes(sessionView.notes ?? '');
        setSavedNotes(sessionView.notes ?? '');
        setNotesError(null);
        setNotesStatus(null);
        setSideCardTab('statistics');
    }, [sessionView.id, sessionView.notes]);

    useEffect(() => {
        if (streamData === null) {
            return;
        }

        setHoverSampleIndex(null);
        resetZoomSelection();
    }, [resetZoomSelection, setHoverSampleIndex, streamData]);

    const hasNotesChanged = internalNotes.trim() !== savedNotes.trim();
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Calendar',
            href: dashboard().url,
        },
        {
            title: 'Session Detail',
            href: showSession(sessionView.id).url,
        },
    ];

    const saveInternalNotes = async (): Promise<void> => {
        if (!canEditNotes || isSavingNotes || !hasNotesChanged) {
            return;
        }

        setIsSavingNotes(true);
        setNotesError(null);
        setNotesStatus(null);

        const normalizedNotes = internalNotes.trim();

        try {
            const route = updateTrainingSession(sessionView.id);
            const response = await fetch(route.url, {
                method: 'PUT',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    training_week_id: sessionView.trainingWeekId,
                    date: sessionView.scheduledDate,
                    sport: sessionView.sport,
                    planned_duration_minutes: sessionView.durationMinutes,
                    planned_tss: sessionView.plannedTss,
                    notes: normalizedNotes === '' ? null : normalizedNotes,
                    planned_structure: serializePlannedStructureForRequest(
                        sessionView.plannedStructure,
                    ),
                }),
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                const message =
                    extractErrorMessage(payload) ?? 'Unable to save notes.';

                setNotesError(message);
                return;
            }

            setSavedNotes(normalizedNotes);
            setNotesStatus('Internal notes saved.');
        } finally {
            setIsSavingNotes(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head
                title={isActivityOnly ? 'Activity Detail' : 'Session Detail'}
            />

            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
                <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-6 py-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link
                                href={dashboard().url}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Link>

                            <div>
                                <p className="text-[0.6875rem] tracking-wider text-zinc-500 uppercase">
                                    {isActivityOnly
                                        ? 'Activity Detail'
                                        : 'Training Detail'}
                                </p>
                                <h1 className="mt-0.5 text-lg font-medium text-zinc-100">
                                    {sessionView.sport.toUpperCase()}{' '}
                                    {isActivityOnly ? 'Activity' : 'Session'} •{' '}
                                    {formatDate(sessionView.scheduledDate)}
                                </h1>
                            </div>
                        </div>

                        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs">
                            <span
                                className={`h-2 w-2 rounded-full ${
                                    stravaStatus?.connected
                                        ? stravaStatus.last_sync_status ===
                                              'queued' ||
                                          stravaStatus.last_sync_status ===
                                              'running'
                                            ? 'bg-amber-500'
                                            : 'bg-emerald-500'
                                        : 'bg-zinc-500'
                                }`}
                            />
                            <span className="text-zinc-400">
                                {integrationLabel}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                    <SessionDetailLayout
                        hasPlannedStructure={hasPlannedStructure}
                        mapPanel={
                            <SessionMap
                                latLngPoints={latLngPoints}
                                focusedRoutePoints={focusedRoutePoints}
                                hoverPoint={hoverPoint}
                                hoverSummary={hoverSummary}
                                xAxisMode={xAxisMode}
                                onResetZoom={resetZoomSelection}
                            />
                        }
                        statisticsPanel={
                            <SessionStatisticsCard
                                sessionView={sessionView}
                                sideCardTab={sideCardTab}
                                onSideCardTabChange={setSideCardTab}
                                notesStatus={notesStatus}
                                internalNotesProps={{
                                    value: internalNotes,
                                    canEditNotes,
                                    isSavingNotes,
                                    hasNotesChanged,
                                    notesError,
                                    notesStatus,
                                    onChange: (value) => {
                                        setInternalNotes(value);
                                        setNotesError(null);
                                        setNotesStatus(null);
                                    },
                                    onSave: () => {
                                        void saveInternalNotes();
                                    },
                                }}
                                avgHeartRate={avgHeartRate}
                                avgPower={avgPower}
                                avgCadence={avgCadence}
                                avgSpeedLabel={avgSpeedLabel}
                                totalDistanceKilometers={totalDistanceKilometers}
                                elevationGainMeters={elevationGainMeters}
                            />
                        }
                        plannedStructurePanel={
                            hasPlannedStructure ? (
                                <SessionPlannedStructurePreview
                                    sessionView={sessionView}
                                    plannedSegments={plannedSegments}
                                    plannedPreviewScaleMax={plannedPreviewScaleMax}
                                    totalPlannedSegmentDuration={
                                        totalPlannedSegmentDuration
                                    }
                                />
                            ) : null
                        }
                        analysisPanel={
                            <SessionAnalysisChart
                                mode={xAxisMode}
                                onModeChange={setXAxisMode}
                                canUseDistanceAxis={canUseDistanceAxis}
                                isZoomed={isZoomed}
                                onResetZoom={resetZoomSelection}
                                orderedStreamKeys={orderedStreamKeys}
                                availableStreams={availableStreams}
                                activeStreams={activeStreams}
                                onStreamToggle={(streamKey) => {
                                    setActiveStreams((current) => ({
                                        ...current,
                                        [streamKey]: !current[streamKey],
                                    }));
                                }}
                                isLoadingStreams={isLoadingStreams}
                                streamError={streamError}
                                zoomedSeries={zoomedSeries}
                                visibleReferencePoints={visibleReferencePoints}
                                hoverSampleIndex={hoverSampleIndex}
                                onHoverSampleIndexChange={setHoverSampleIndex}
                                onZoomSelection={applyZoomSelection}
                                hoverSummary={hoverSummary}
                                showSelectionPanel={showSelectionPanel}
                                selectedRangeSummary={selectedRangeSummary}
                                sport={sessionView.sport}
                            />
                        }
                    />
                </div>
            </div>
        </AppLayout>
    );
}
