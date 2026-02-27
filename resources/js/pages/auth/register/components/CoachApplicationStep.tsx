import { Check, CheckCircle2, PencilLine, Trash2, Upload, X } from 'lucide-react';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CoachFileDraft, RegistrationForm, UploadLimits } from '../types';
import { formatBytesToMegabytes } from '../utils';

type CoachApplicationStepProps = {
    form: RegistrationForm;
    coachFiles: CoachFileDraft[];
    coachFilesError: string | null;
    coachFileFieldErrors: string[];
    uploadLimits: UploadLimits;
    onFilesAdded: (files: FileList | null) => void;
    onDeleteFile: (fileId: string) => void;
    onStartRenaming: (fileId: string) => void;
    onChangeDraftLabel: (fileId: string, value: string) => void;
    onConfirmRename: (fileId: string) => void;
    onCancelRename: (fileId: string) => void;
};

export function CoachApplicationStep({
    form,
    coachFiles,
    coachFilesError,
    coachFileFieldErrors,
    uploadLimits,
    onFilesAdded,
    onDeleteFile,
    onStartRenaming,
    onChangeDraftLabel,
    onConfirmRename,
    onCancelRename,
}: CoachApplicationStepProps) {
    const acceptAttribute = uploadLimits.acceptedExtensions
        .map((extension) => `.${extension}`)
        .join(',');
    const totalUploadedBytes = coachFiles.reduce(
        (sum, entry) => sum + entry.file.size,
        0,
    );

    return (
        <section className="space-y-4 rounded-xl border border-border bg-background/50 p-4">
            <div className="space-y-2">
                <Label htmlFor="motivation">Motivation</Label>
                <Textarea
                    id="motivation"
                    rows={5}
                    value={form.data.motivation}
                    onChange={(event) => form.setData('motivation', event.target.value)}
                    placeholder="Why do you want to coach inside Endure and what outcomes do you aim to deliver?"
                />
                <InputError message={form.errors.motivation} />
            </div>

            <div className="rounded-lg border border-border bg-background/60 p-3">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-medium text-zinc-200">
                            Certification files
                        </p>
                        <p className="text-xs text-zinc-500">
                            Upload documents for approval. Max {uploadLimits.maxFiles} files,{' '}
                            {uploadLimits.maxFileSizeMb} MB each,{' '}
                            {uploadLimits.maxTotalSizeMb} MB total.
                        </p>
                        <p className="text-xs text-zinc-500">
                            Accepted formats: {acceptAttribute}
                        </p>
                        <p className="mt-1 text-xs text-zinc-400">
                            Uploaded: {coachFiles.length} / {uploadLimits.maxFiles} files (
                            {formatBytesToMegabytes(totalUploadedBytes)} /{' '}
                            {uploadLimits.maxTotalSizeMb} MB)
                        </p>
                    </div>

                    <label className="inline-flex cursor-pointer items-center gap-2 rounded border border-border bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 transition-colors hover:bg-zinc-800">
                        <Upload className="h-3.5 w-3.5" />
                        Add file
                        <input
                            type="file"
                            className="hidden"
                            multiple
                            accept={acceptAttribute}
                            onChange={(event) => {
                                onFilesAdded(event.target.files);
                                event.currentTarget.value = '';
                            }}
                        />
                    </label>
                </div>

                <InputError
                    message={coachFilesError ?? form.errors.coach_certification_files}
                />
                {coachFileFieldErrors.map((error, index) => (
                    <p
                        key={`${error}-${index}`}
                        className="mt-1 text-xs text-red-300"
                    >
                        {error}
                    </p>
                ))}

                {coachFiles.length === 0 ? (
                    <div className="mt-3 rounded border border-dashed border-zinc-700/70 px-3 py-4 text-center text-xs text-zinc-500">
                        No files uploaded yet.
                    </div>
                ) : (
                    <ul className="mt-3 space-y-2">
                        {coachFiles.map((entry) => (
                            <li
                                key={entry.id}
                                className="rounded border border-border/70 bg-background/50 px-3 py-2"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        {entry.isRenaming ? (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    value={entry.draftLabel}
                                                    onChange={(event) =>
                                                        onChangeDraftLabel(
                                                            entry.id,
                                                            event.target.value,
                                                        )
                                                    }
                                                    onKeyDown={(event) => {
                                                        if (event.key === 'Enter') {
                                                            event.preventDefault();
                                                            onConfirmRename(entry.id);
                                                        }

                                                        if (event.key === 'Escape') {
                                                            event.preventDefault();
                                                            onCancelRename(entry.id);
                                                        }
                                                    }}
                                                    className="h-8"
                                                />
                                                <span className="text-xs text-zinc-500">
                                                    .{entry.extension}
                                                </span>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => onStartRenaming(entry.id)}
                                                className="inline-flex max-w-full items-center gap-1 text-left text-sm text-zinc-200 hover:text-white"
                                            >
                                                <span className="truncate">
                                                    {entry.label}
                                                </span>
                                                <span className="shrink-0 text-zinc-500">
                                                    .{entry.extension}
                                                </span>
                                            </button>
                                        )}

                                        <p className="mt-1 text-xs text-zinc-500">
                                            {formatBytesToMegabytes(entry.file.size)} MB
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        {entry.isRenaming ? (
                                            <>
                                                <button
                                                    type="button"
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                                                    onClick={() => onConfirmRename(entry.id)}
                                                    aria-label="Confirm rename"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded border border-red-500/40 bg-red-500/10 text-red-300"
                                                    onClick={() => onCancelRename(entry.id)}
                                                    aria-label="Cancel rename"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => onStartRenaming(entry.id)}
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded border border-border bg-zinc-900 text-zinc-400 transition-colors hover:text-zinc-200"
                                                    aria-label="Rename file"
                                                >
                                                    <PencilLine className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onDeleteFile(entry.id)}
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded border border-border bg-zinc-900 text-zinc-500 transition-colors hover:text-red-300"
                                                    aria-label="Delete file"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {entry.renameFlash !== null ? (
                                    <p
                                        className={`mt-2 inline-flex items-center gap-1 text-[0.6875rem] ${
                                            entry.renameFlash === 'saved'
                                                ? 'text-emerald-400'
                                                : 'text-red-300'
                                        }`}
                                    >
                                        {entry.renameFlash === 'saved' ? (
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                        ) : (
                                            <X className="h-3.5 w-3.5" />
                                        )}
                                        {entry.renameFlash === 'saved'
                                            ? 'Name updated'
                                            : 'Rename cancelled'}
                                    </p>
                                ) : null}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
