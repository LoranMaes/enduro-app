import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { SessionDetailsTab } from './components/SessionDetailsTab';
import { SessionFooter } from './components/SessionFooter';
import { SessionHeader } from './components/SessionHeader';
import { SessionStructureTab } from './components/SessionStructureTab';
import { useSessionCompletion } from './hooks/useSessionCompletion';
import { useSessionDerivedValues } from './hooks/useSessionDerivedValues';
import { useSessionEditorActions } from './hooks/useSessionEditorActions';
import { useSessionEditorMutations } from './hooks/useSessionEditorMutations';
import { useSessionEditorRefresh } from './hooks/useSessionEditorRefresh';
import { useSessionEditorState } from './hooks/useSessionEditorState';
import { useSessionEditorWorkflowActions } from './hooks/useSessionEditorWorkflowActions';
import { useSessionLinking } from './hooks/useSessionLinking';
import type { SessionEditorModalProps } from './types';

export function SessionEditorModal({
    open,
    context,
    canManageSessionWrites,
    canManageSessionLinks,
    athleteTrainingTargets,
    onOpenChange,
    onSaved,
}: SessionEditorModalProps) {
    const {
        plannedDurationInputRef,
        sport,
        setSport,
        sessionTitle,
        setSessionTitle,
        plannedDurationMinutes,
        setPlannedDurationMinutes,
        plannedTss,
        setPlannedTss,
        notes,
        setNotes,
        plannedStructure,
        setPlannedStructure,
        sessionDetails,
        setSessionDetails,
        errors,
        setErrors,
        generalError,
        setGeneralError,
        statusMessage,
        setStatusMessage,
        confirmingDelete,
        setConfirmingDelete,
        activeEditorTab,
        setActiveEditorTab,
        clearFieldError,
        dateLabel,
    } = useSessionEditorState({
        open,
        context,
    });

    const {
        isSubmitting,
        isDeleting,
        isLoadingSessionDetails,
        refreshSessionDetails,
        submitSession,
        deleteSession,
    } = useSessionEditorMutations();

    const {
        isLinkingActivity,
        isUnlinkingActivity,
        linkActivity,
        unlinkActivity,
    } = useSessionLinking();

    const {
        isCompletingSession,
        isRevertingCompletion,
        completeSession,
        revertSessionCompletion,
    } = useSessionCompletion();

    const derived = useSessionDerivedValues({
        context,
        sessionDetails,
        plannedStructure,
        activeEditorTab,
        canManageSessionWrites,
        canManageSessionLinks,
        isSubmitting,
        isDeleting,
        isLinkingActivity,
        isUnlinkingActivity,
        isCompletingSession,
        isRevertingCompletion,
    });

    const isBusy = derived.isBusy;

    useSessionEditorRefresh({
        open,
        context,
        refreshSessionDetails,
        setSessionDetails,
    });

    const {
        handleFormKeyDown,
        submit,
        handleDeleteSession,
    } = useSessionEditorActions({
        context,
        canManageSessionWrites,
        isBusy,
        sport,
        title: sessionTitle,
        plannedDurationMinutes,
        plannedTss,
        notes,
        plannedStructure,
        derivedStructureDurationMinutes: derived.derivedStructureDurationMinutes,
        derivedStructureTss: derived.derivedStructureTss,
        confirmingDelete,
        setErrors,
        setGeneralError,
        setStatusMessage,
        setConfirmingDelete,
        submitSession,
        deleteSession,
        onOpenChange,
        onSaved,
    });

    const {
        handleLinkActivity,
        handleUnlinkActivity,
        handleCompleteSession,
        handleRevertCompletion,
    } = useSessionEditorWorkflowActions({
        context,
        canPerformLinking: derived.canPerformLinking,
        canPerformCompletion: derived.canPerformCompletion,
        setErrors,
        setGeneralError,
        setStatusMessage,
        setSessionDetails,
        refreshSessionDetails,
        linkActivity,
        unlinkActivity,
        completeSession,
        revertSessionCompletion,
        onSaved,
    });

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (isBusy && !nextOpen) {
                    return;
                }

                onOpenChange(nextOpen);
            }}
        >
            <DialogContent
                size="xl"
                className={cn(
                    'max-h-[calc(100dvh-1rem)] gap-0 overflow-hidden border-border bg-surface p-0 text-zinc-200',
                    derived.isStructureTab
                        ? 'max-w-[min(98vw,85rem)]'
                        : 'max-w-[min(96vw,53.75rem)]',
                )}
                onEscapeKeyDown={(event) => {
                    if (isBusy) {
                        event.preventDefault();
                        return;
                    }

                    onOpenChange(false);
                }}
            >
                <SessionHeader
                    title={derived.dialogTitle}
                    description={derived.dialogDescription}
                />

                {context !== null ? (
                    <form
                        onSubmit={submit}
                        onKeyDown={handleFormKeyDown}
                        aria-busy={isBusy}
                        className="flex h-[calc(100dvh-7.5rem)] min-h-0 flex-col"
                    >
                        <Tabs
                            value={activeEditorTab}
                            onValueChange={(nextTab) => {
                                setActiveEditorTab(
                                    nextTab === 'structure' ? 'structure' : 'details',
                                );
                            }}
                            className="min-h-0 flex-1"
                        >
                            <div className="border-b border-border px-6 py-2.5">
                                <TabsList className="border-border bg-background/60 p-1">
                                    <TabsTrigger value="details" className="text-xs font-medium">
                                        Session Details
                                    </TabsTrigger>
                                    <TabsTrigger value="structure" className="text-xs font-medium">
                                        Workout Structure
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 pt-5">
                                {generalError !== null ? (
                                    <p
                                        role="alert"
                                        className="mb-4 rounded-md border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-300"
                                    >
                                        {generalError}
                                    </p>
                                ) : null}

                                {statusMessage !== null ? (
                                    <p className="mb-4 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                                        {statusMessage}
                                    </p>
                                ) : null}

                                {activeEditorTab === 'structure' ? (
                                    <SessionStructureTab
                                        plannedStructure={plannedStructure}
                                        sport={sport}
                                        athleteTrainingTargets={athleteTrainingTargets}
                                        canManageSessionWrites={canManageSessionWrites}
                                        errors={errors}
                                        clearFieldError={clearFieldError}
                                        setPlannedStructure={setPlannedStructure}
                                    />
                                ) : (
                                    <SessionDetailsTab
                                        context={context}
                                        dateLabel={dateLabel}
                                        sport={sport}
                                        setSport={setSport}
                                        sessionTitle={sessionTitle}
                                        setSessionTitle={setSessionTitle}
                                        canManageSessionWrites={canManageSessionWrites}
                                        clearFieldError={clearFieldError}
                                        errors={errors}
                                        hasStructuredPlanning={derived.hasStructuredPlanning}
                                        derivedStructureDurationMinutes={
                                            derived.derivedStructureDurationMinutes
                                        }
                                        derivedStructureTss={derived.derivedStructureTss}
                                        plannedDurationMinutes={plannedDurationMinutes}
                                        plannedTss={plannedTss}
                                        plannedDurationInputRef={plannedDurationInputRef}
                                        setPlannedDurationMinutes={setPlannedDurationMinutes}
                                        setPlannedTss={setPlannedTss}
                                        notes={notes}
                                        setNotes={setNotes}
                                        isEditMode={derived.isEditMode}
                                        isLoadingSessionDetails={isLoadingSessionDetails}
                                        linkedActivitySummary={derived.linkedActivitySummary}
                                        suggestedActivities={derived.suggestedActivities}
                                        canManageSessionLinks={canManageSessionLinks}
                                        canPerformLinking={derived.canPerformLinking}
                                        isUnlinkingActivity={isUnlinkingActivity}
                                        isLinkingActivity={isLinkingActivity}
                                        onUnlinkActivity={() => {
                                            void handleUnlinkActivity();
                                        }}
                                        onLinkActivity={(activityId) => {
                                            void handleLinkActivity(activityId);
                                        }}
                                        selectedSession={derived.selectedSession}
                                        sessionIsCompleted={derived.sessionIsCompleted}
                                        sessionIsAdjusted={derived.sessionIsAdjusted}
                                        plannedDurationLabel={derived.plannedDurationLabel}
                                        actualDurationLabel={derived.actualDurationLabel}
                                        plannedTssLabel={derived.plannedTssLabel}
                                        actualTssLabel={derived.actualTssLabel}
                                        canPerformCompletion={derived.canPerformCompletion}
                                        isRevertingCompletion={isRevertingCompletion}
                                        isCompletingSession={isCompletingSession}
                                        onRevertCompletion={() => {
                                            void handleRevertCompletion();
                                        }}
                                        onCompleteSession={() => {
                                            void handleCompleteSession();
                                        }}
                                    />
                                )}
                            </div>
                        </Tabs>

                        <SessionFooter
                            isEditMode={derived.isEditMode}
                            canManageSessionWrites={canManageSessionWrites}
                            confirmingDelete={confirmingDelete}
                            setConfirmingDelete={setConfirmingDelete}
                            isBusy={isBusy}
                            isDeleting={isDeleting}
                            isLinkingActivity={isLinkingActivity}
                            isUnlinkingActivity={isUnlinkingActivity}
                            isCompletingSession={isCompletingSession}
                            isRevertingCompletion={isRevertingCompletion}
                            isSubmitting={isSubmitting}
                            canPersistSessionWrites={derived.canPersistSessionWrites}
                            onDeleteSession={() => {
                                void handleDeleteSession();
                            }}
                            onClose={() => {
                                onOpenChange(false);
                            }}
                        />
                    </form>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
