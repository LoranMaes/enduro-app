import { Button } from '@/components/ui/button';

type WorkoutLibraryFormProps = {
    sportLabel: string;
    onCreateNew: () => void;
};

export function WorkoutLibraryForm({
    sportLabel,
    onCreateNew,
}: WorkoutLibraryFormProps) {
    return (
        <div className="rounded-md border border-border bg-background/60 px-4 py-4">
            <p className="text-xs font-medium text-zinc-200">Create a new {sportLabel} session</p>
            <p className="mt-1 text-xs text-zinc-500">
                Open the session editor to configure details and structure from scratch.
            </p>
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={onCreateNew}
            >
                New workout
            </Button>
        </div>
    );
}
