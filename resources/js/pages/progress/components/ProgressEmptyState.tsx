type ProgressEmptyStateProps = {
    message: string;
};

export function ProgressEmptyState({ message }: ProgressEmptyStateProps) {
    return (
        <div className="flex h-full items-center justify-center">
            <p className="text-sm text-zinc-500">{message}</p>
        </div>
    );
}
