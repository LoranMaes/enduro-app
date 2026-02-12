import type { LucideIcon } from 'lucide-react';
import { Activity, Bike, Calendar, Droplets, Footprints, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { OtherEntryType, WorkoutEntrySport } from '../types';

type WorkoutCreateOption = {
    sport: WorkoutEntrySport;
    label: string;
    locked: boolean;
    icon: LucideIcon;
};

type OtherCreateOption = {
    type: OtherEntryType;
    label: string;
    locked: boolean;
    icon: LucideIcon;
};

type CreateEntrySelectorModalProps = {
    open: boolean;
    date: string | null;
    workoutOptions: WorkoutCreateOption[];
    otherOptions: OtherCreateOption[];
    onOpenChange: (open: boolean) => void;
    onSelectWorkout: (sport: WorkoutEntrySport) => void;
    onSelectOther: (type: OtherEntryType) => void;
};

export function CreateEntrySelectorModal({
    open,
    date,
    workoutOptions,
    otherOptions,
    onOpenChange,
    onSelectWorkout,
    onSelectOther,
}: CreateEntrySelectorModalProps) {
    const [activeTab, setActiveTab] = useState<'workout' | 'other'>('workout');

    useEffect(() => {
        if (!open) {
            return;
        }

        setActiveTab('workout');
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                size="sm"
                className="max-h-[calc(100dvh-1.5rem)] overflow-hidden border-border bg-surface p-0 text-zinc-200"
            >
                <DialogHeader className="border-b border-border px-5 py-4">
                    <DialogTitle className="text-base text-zinc-100">
                        Add calendar entry
                    </DialogTitle>
                    <DialogDescription className="text-xs text-zinc-500">
                        {date !== null
                            ? `Choose what you want to add on ${date}.`
                            : 'Choose what you want to add.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 px-5 py-4">
                    <Tabs
                        value={activeTab}
                        onValueChange={(value) => {
                            setActiveTab(value === 'other' ? 'other' : 'workout');
                        }}
                    >
                        <TabsList className="grid w-full grid-cols-2 border border-border bg-background/60 p-1">
                            <TabsTrigger value="workout" className="text-xs font-medium">
                                Workout
                            </TabsTrigger>
                            <TabsTrigger value="other" className="text-xs font-medium">
                                Other
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {activeTab === 'workout' ? (
                        <div className="grid grid-cols-2 gap-2">
                            {workoutOptions.map((option) => {
                                const OptionIcon = option.icon;

                                return (
                                <button
                                    key={option.sport}
                                    type="button"
                                    disabled={option.locked}
                                    onClick={() => {
                                        if (option.locked) {
                                            return;
                                        }

                                        onSelectWorkout(option.sport);
                                    }}
                                    className={cn(
                                        'rounded-md border border-border bg-background/60 px-3 py-2.5 text-left text-xs text-zinc-200 transition-colors',
                                        option.locked
                                            ? 'cursor-not-allowed opacity-65'
                                            : 'hover:border-zinc-600 hover:bg-background',
                                    )}
                                >
                                    <span className="flex items-center justify-between gap-2">
                                        <span className="flex items-center gap-2">
                                            <OptionIcon className="h-3.5 w-3.5 text-zinc-400" />
                                            <span>{option.label}</span>
                                        </span>
                                        {option.locked ? (
                                            <Badge variant="outline" className="text-[0.625rem]">
                                                Locked
                                            </Badge>
                                        ) : null}
                                    </span>
                                </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {otherOptions.map((option) => {
                                const OptionIcon = option.icon;

                                return (
                                <button
                                    key={option.type}
                                    type="button"
                                    disabled={option.locked}
                                    onClick={() => {
                                        if (option.locked) {
                                            return;
                                        }

                                        onSelectOther(option.type);
                                    }}
                                    className={cn(
                                        'flex w-full items-center justify-between rounded-md border border-border bg-background/60 px-3 py-2.5 text-left text-xs text-zinc-200 transition-colors',
                                        option.locked
                                            ? 'cursor-not-allowed opacity-65'
                                            : 'hover:border-zinc-600 hover:bg-background',
                                    )}
                                >
                                    <span className="flex items-center gap-2">
                                        <OptionIcon className="h-3.5 w-3.5 text-zinc-400" />
                                        <span>{option.label}</span>
                                    </span>
                                    {option.locked ? (
                                        <Badge variant="outline" className="text-[0.625rem]">
                                            Locked
                                        </Badge>
                                    ) : null}
                                </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export const WORKOUT_CREATE_ICONS: Record<WorkoutEntrySport, LucideIcon> = {
    run: Footprints,
    bike: Bike,
    swim: Droplets,
    day_off: Activity,
    mtn_bike: Bike,
    custom: Activity,
    walk: Footprints,
};

export const OTHER_CREATE_ICONS: Record<OtherEntryType, LucideIcon> = {
    event: Calendar,
    goal: Target,
    note: Activity,
};
