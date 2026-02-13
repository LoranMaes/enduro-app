import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
    index as listWorkoutLibraryItems,
    store as storeWorkoutLibraryItem,
    update as updateWorkoutLibraryItem,
} from '@/routes/workout-library';
import type { AthleteTrainingTargets, WorkoutEntrySport } from '@/pages/calendar/types';
import { WorkoutStructureBuilder } from '@/pages/calendar/components/workout-structure-builder/WorkoutStructureBuilder';
import { createDefaultStructureForSport } from '@/pages/calendar/components/workout-structure-builder/hooks/useStructureTemplates';
import type { WorkoutStructure } from '@/pages/calendar/components/workout-structure-builder/types';
import { WorkoutLibraryList, type WorkoutLibraryItemView } from './WorkoutLibraryList';

type WorkoutLibraryDialogProps = {
    open: boolean;
    trainingTargets: AthleteTrainingTargets | null;
    onOpenChange: (open: boolean) => void;
    onTemplateDragStart: (
        item: WorkoutLibraryItemView,
        sport: string,
    ) => void;
    onTemplateDragEnd: () => void;
    onPanelModeChange: (mode: 'browse' | 'create') => void;
};

type PanelSport = WorkoutEntrySport;

const SPORT_OPTIONS: Array<{ sport: PanelSport; label: string }> = [
    { sport: 'run', label: 'Run' },
    { sport: 'bike', label: 'Bike' },
    { sport: 'swim', label: 'Swim' },
    { sport: 'walk', label: 'Walk' },
    { sport: 'mtn_bike', label: 'MTB' },
    { sport: 'day_off', label: 'Day Off' },
    { sport: 'custom', label: 'Custom' },
];

export function WorkoutLibraryDialog({
    open,
    trainingTargets,
    onOpenChange,
    onTemplateDragStart,
    onTemplateDragEnd,
    onPanelModeChange,
}: WorkoutLibraryDialogProps) {
    const [activeSport, setActiveSport] = useState<PanelSport>('run');
    const [items, setItems] = useState<WorkoutLibraryItemView[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);
    const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
    const [templateTitle, setTemplateTitle] = useState('');
    const [templateStructure, setTemplateStructure] = useState<WorkoutStructure | null>(
        createDefaultStructureForSport('run'),
    );
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isDraggingTemplate, setIsDraggingTemplate] = useState(false);
    const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);

    const activeSportLabel = useMemo(() => {
        return SPORT_OPTIONS.find((option) => option.sport === activeSport)?.label ?? 'Workout';
    }, [activeSport]);

    const resetTemplateDraft = useCallback((sport: PanelSport): void => {
        setTemplateTitle('');
        setTemplateStructure(createDefaultStructureForSport(sport));
    }, []);

    const loadItems = useCallback(async (): Promise<void> => {
        if (!open) {
            return;
        }

        setLoadingItems(true);

        try {
            const route = listWorkoutLibraryItems({
                query: {
                    sport: activeSport,
                },
            });

            const response = await fetch(route.url, {
                method: route.method.toUpperCase(),
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error('Unable to load workout templates.');
            }

            const payload = (await response.json()) as { data?: WorkoutLibraryItemView[] };
            setItems(Array.isArray(payload.data) ? payload.data : []);
            setErrorMessage(null);
        } catch {
            setItems([]);
            setErrorMessage('Unable to load workout templates.');
        } finally {
            setLoadingItems(false);
        }
    }, [activeSport, open]);

    useEffect(() => {
        if (!open) {
            setIsDraggingTemplate(false);
            return;
        }

        void loadItems();
    }, [loadItems, open]);

    useEffect(() => {
        if (!open) {
            return;
        }

        setIsCreatingTemplate(false);
        setEditingTemplateId(null);
        resetTemplateDraft(activeSport);
    }, [activeSport, open, resetTemplateDraft]);

    useEffect(() => {
        onPanelModeChange(isCreatingTemplate ? 'create' : 'browse');
    }, [isCreatingTemplate, onPanelModeChange]);

    const saveTemplate = useCallback(async (): Promise<void> => {
        if (templateStructure === null || isSavingTemplate) {
            return;
        }

        const normalizedTitle = templateTitle.trim();

        if (normalizedTitle === '') {
            setErrorMessage('Template title is required.');
            return;
        }

        setIsSavingTemplate(true);

        try {
            const route = storeWorkoutLibraryItem();
            const updateRoute =
                editingTemplateId === null
                    ? null
                    : updateWorkoutLibraryItem(editingTemplateId);
            const response = await fetch(updateRoute?.url ?? route.url, {
                method:
                    updateRoute === null
                        ? route.method.toUpperCase()
                        : updateRoute.method.toUpperCase(),
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    title: normalizedTitle,
                    sport: activeSport,
                    structure_json: templateStructure,
                    tags: [],
                }),
            });

            if (!response.ok) {
                setErrorMessage('Unable to save workout template.');
                return;
            }

            setIsCreatingTemplate(false);
            setEditingTemplateId(null);
            resetTemplateDraft(activeSport);
            await loadItems();
        } catch {
            setErrorMessage('Unable to save workout template.');
        } finally {
            setIsSavingTemplate(false);
        }
    }, [
        activeSport,
        isSavingTemplate,
        loadItems,
        resetTemplateDraft,
        templateStructure,
        templateTitle,
        editingTemplateId,
    ]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
            <SheetContent
                side="right"
                hideOverlay
                onInteractOutside={(event) => {
                    if (isDraggingTemplate) {
                        event.preventDefault();
                    }
                }}
                className={`w-full border-border bg-surface p-0 text-zinc-200 ${isCreatingTemplate ? 'sm:max-w-[44rem]' : 'sm:max-w-[24rem]'}`}
            >
                <SheetHeader className="border-b border-border px-5 py-4 text-left">
                    <SheetTitle className="text-base text-zinc-100">
                        Workout Library
                    </SheetTitle>
                    <SheetDescription className="text-xs text-zinc-500">
                        Drag templates onto a calendar day, or create new templates.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex min-h-0 h-full flex-col px-5 py-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <ToggleGroup
                            type="single"
                            value={activeSport}
                            onValueChange={(value) => {
                                if (value === '') {
                                    return;
                                }

                                if (value === activeSport) {
                                    return;
                                }

                                const nextSport = SPORT_OPTIONS.find(
                                    (option) => option.sport === value,
                                );

                                if (!nextSport) {
                                    return;
                                }

                                setActiveSport(nextSport.sport);
                            }}
                            variant="outline"
                            size="sm"
                            className="flex flex-wrap items-center justify-start gap-1 rounded-lg border border-border bg-background/60 p-1"
                        >
                            {SPORT_OPTIONS.map((option) => (
                                <ToggleGroupItem
                                    key={option.sport}
                                    value={option.sport}
                                    className="h-7 rounded-md border border-transparent px-2 text-xs text-zinc-400 hover:text-zinc-200 data-[state=on]:border-border data-[state=on]:bg-zinc-800 data-[state=on]:text-zinc-100"
                                >
                                    {option.label}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>

                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="shrink-0 border-border bg-background/60 text-zinc-200 hover:bg-background hover:text-zinc-100"
                            onClick={() => {
                                setErrorMessage(null);
                                setIsCreatingTemplate(true);
                                setEditingTemplateId(null);
                                resetTemplateDraft(activeSport);
                            }}
                        >
                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                            New template
                        </Button>
                    </div>

                    {errorMessage !== null ? (
                        <p className="mb-3 rounded-md border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                            {errorMessage}
                        </p>
                    ) : null}

                    {isCreatingTemplate ? (
                        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
                            <Input
                                value={templateTitle}
                                onChange={(event) => {
                                    setTemplateTitle(event.target.value);
                                }}
                                placeholder={`Template title (${activeSportLabel})`}
                                className="h-9 border-border bg-background text-xs"
                            />

                            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                                <WorkoutStructureBuilder
                                    value={templateStructure}
                                    sport={activeSport}
                                    trainingTargets={trainingTargets}
                                    onChange={setTemplateStructure}
                                />
                            </div>

                            <div className="flex justify-end gap-2 border-t border-border pt-3">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                                    onClick={() => {
                                        setIsCreatingTemplate(false);
                                        setEditingTemplateId(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={isSavingTemplate}
                                    className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                                    onClick={() => {
                                        void saveTemplate();
                                    }}
                                >
                                    <Save className="mr-1.5 h-3.5 w-3.5" />
                                    {isSavingTemplate
                                        ? 'Saving...'
                                        : editingTemplateId === null
                                          ? 'Save template'
                                          : 'Update template'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="min-h-0 flex-1 overflow-hidden">
                            <WorkoutLibraryList
                                items={items}
                                loading={loadingItems}
                                onStartDragItem={(item, event) => {
                                    event.dataTransfer.effectAllowed = 'move';
                                    setIsDraggingTemplate(true);
                                    onTemplateDragStart(item, item.sport);
                                }}
                                onEndDragItem={() => {
                                    setIsDraggingTemplate(false);
                                    onTemplateDragEnd();
                                }}
                                onEditItem={(item) => {
                                    setErrorMessage(null);
                                    setIsCreatingTemplate(true);
                                    setEditingTemplateId(item.id);
                                    setTemplateTitle(item.title);
                                    setTemplateStructure(
                                        item.structure_json as WorkoutStructure,
                                    );
                                }}
                            />
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
