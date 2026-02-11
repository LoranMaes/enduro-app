import { Head, router } from '@inertiajs/react';
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock3,
    FileText,
    ShieldCheck,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { index as adminIndex } from '@/routes/admin';
import type { BreadcrumbItem } from '@/types';

type CoachApplicationFileItem = {
    id: number;
    display_name: string;
    extension: string | null;
    mime_type: string | null;
    size_bytes: number;
    preview_url: string;
};

type CoachApplicationItem = {
    id: number;
    status: 'pending' | 'approved' | 'rejected' | string;
    submitted_at: string | null;
    reviewed_at: string | null;
    reviewed_by: string | null;
    review_notes: string | null;
    user: {
        id: number | null;
        name: string;
        email: string | null;
    };
    answers: {
        coaching_experience: string;
        specialties: string | null;
        certifications_summary: string | null;
        website_url: string | null;
        motivation: string;
    };
    files: CoachApplicationFileItem[];
    review_url: string;
};

type CoachApplicationsPageProps = {
    activeStatus: 'pending' | 'approved' | 'rejected' | 'all' | string;
    metrics: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
    };
    applications: CoachApplicationItem[];
};

const statusTabs = [
    { value: 'pending', label: 'Pending', countKey: 'pending' },
    { value: 'approved', label: 'Accepted', countKey: 'approved' },
    { value: 'rejected', label: 'Rejected', countKey: 'rejected' },
] as const;

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Console',
        href: adminIndex().url,
    },
    {
        title: 'Coach Applications',
        href: '/admin/coach-applications',
    },
];

export default function CoachApplicationsIndex({
    activeStatus,
    metrics,
    applications,
}: CoachApplicationsPageProps) {
    const firstPending = applications.find((application) => {
        return application.status === 'pending';
    });
    const [activeApplicationId, setActiveApplicationId] = useState<
        number | null
    >(firstPending?.id ?? applications[0]?.id ?? null);
    const [fileIndexByApplication, setFileIndexByApplication] = useState<
        Record<number, number>
    >({});
    const [reviewNotesByApplication, setReviewNotesByApplication] = useState<
        Record<number, string>
    >({});
    const [processingApplicationId, setProcessingApplicationId] = useState<
        number | null
    >(null);

    useEffect(() => {
        setActiveApplicationId((current) => {
            if (applications.length === 0) {
                return null;
            }

            if (
                current !== null &&
                applications.some((application) => application.id === current)
            ) {
                return current;
            }

            const nextPending = applications.find(
                (application) => application.status === 'pending',
            );

            return nextPending?.id ?? applications[0].id;
        });
    }, [applications]);

    const activeApplication = useMemo(() => {
        return (
            applications.find((application) => {
                return application.id === activeApplicationId;
            }) ?? null
        );
    }, [activeApplicationId, applications]);

    const selectedFileIndex =
        activeApplication === null
            ? 0
            : Math.max(
                  0,
                  Math.min(
                      fileIndexByApplication[activeApplication.id] ?? 0,
                      activeApplication.files.length - 1,
                  ),
              );
    const selectedFile =
        activeApplication?.files[selectedFileIndex] === undefined
            ? null
            : activeApplication.files[selectedFileIndex];

    const reviewNotes =
        activeApplication === null
            ? ''
            : (reviewNotesByApplication[activeApplication.id] ??
              activeApplication.review_notes ??
              '');

    const review = (decision: 'approve' | 'reject'): void => {
        if (activeApplication === null) {
            return;
        }

        setProcessingApplicationId(activeApplication.id);
        router.post(
            activeApplication.review_url,
            {
                decision,
                review_notes: reviewNotes.trim(),
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessingApplicationId(null);
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Coach Applications" />

            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
                <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border px-6 py-5">
                    <div>
                        <p className="text-[0.6875rem] tracking-[0.24em] text-zinc-500 uppercase">
                            Coach Approval Queue
                        </p>
                        <h1 className="mt-2 text-3xl font-medium text-zinc-100">
                            Coach Applications
                        </h1>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                        <MetricPill label="Total" value={metrics.total} />
                        <MetricPill label="Pending" value={metrics.pending} />
                        <MetricPill label="Accepted" value={metrics.approved} />
                        <MetricPill label="Rejected" value={metrics.rejected} />
                    </div>
                </header>

                <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[minmax(26.25rem,0.95fr)_minmax(0,1.05fr)]">
                    <section className="min-h-0 overflow-y-auto border-r border-border px-6 py-5">
                        <ToggleGroup
                            type="single"
                            value={activeStatus}
                            onValueChange={(value) => {
                                if (value === '') {
                                    return;
                                }

                                router.get(
                                    '/admin/coach-applications',
                                    { status: value },
                                    {
                                        preserveScroll: true,
                                        preserveState: true,
                                        replace: true,
                                    },
                                );
                            }}
                            className="mb-4 inline-flex rounded-lg border border-border bg-surface p-1"
                        >
                            {statusTabs.map((tab) => {
                                const count = metrics[tab.countKey];

                                return (
                                    <ToggleGroupItem
                                        key={tab.value}
                                        value={tab.value}
                                        className={cn(
                                            'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                                            'text-zinc-500 hover:text-zinc-200 data-[state=on]:bg-zinc-800 data-[state=on]:text-zinc-100',
                                        )}
                                    >
                                        {tab.label}
                                        <span className="font-mono text-[0.625rem] text-zinc-500">
                                            {count}
                                        </span>
                                    </ToggleGroupItem>
                                );
                            })}
                        </ToggleGroup>

                        {applications.length === 0 ? (
                            <div className="rounded-xl border border-border bg-surface px-4 py-6 text-sm text-zinc-500">
                                No applications in this state.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {applications.map((application) => {
                                    const isActive =
                                        application.id === activeApplicationId;

                                    return (
                                        <article
                                            key={application.id}
                                            className={cn(
                                                'rounded-xl border bg-surface/70 transition-colors',
                                                isActive
                                                    ? 'border-zinc-500'
                                                    : 'border-border hover:border-zinc-700',
                                            )}
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setActiveApplicationId(
                                                        application.id,
                                                    )
                                                }
                                                className="w-full px-4 py-3 text-left"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium text-zinc-100">
                                                            {
                                                                application.user
                                                                    .name
                                                            }
                                                        </p>
                                                        <p className="truncate text-xs text-zinc-500">
                                                            {
                                                                application.user
                                                                    .email
                                                            }
                                                        </p>
                                                    </div>
                                                    <StatusBadge
                                                        status={
                                                            application.status
                                                        }
                                                    />
                                                </div>
                                                <p className="mt-2 text-[0.6875rem] text-zinc-500">
                                                    Submitted:{' '}
                                                    {application.submitted_at ===
                                                    null
                                                        ? '—'
                                                        : new Date(
                                                              application.submitted_at,
                                                          ).toLocaleString()}
                                                </p>
                                            </button>

                                            {isActive ? (
                                                <div className="space-y-2 border-t border-border px-4 py-3">
                                                    <AnswerRow
                                                        label="Coaching experience"
                                                        value={
                                                            application.answers
                                                                .coaching_experience
                                                        }
                                                    />
                                                    <AnswerRow
                                                        label="Specialties"
                                                        value={
                                                            application.answers
                                                                .specialties
                                                        }
                                                    />
                                                    <AnswerRow
                                                        label="Certifications"
                                                        value={
                                                            application.answers
                                                                .certifications_summary
                                                        }
                                                    />
                                                    <AnswerRow
                                                        label="Website"
                                                        value={
                                                            application.answers
                                                                .website_url
                                                        }
                                                    />
                                                    <AnswerRow
                                                        label="Motivation"
                                                        value={
                                                            application.answers
                                                                .motivation
                                                        }
                                                    />
                                                </div>
                                            ) : null}
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    <section className="flex min-h-0 flex-col px-6 py-5">
                        {activeApplication === null ? (
                            <div className="flex h-full items-center justify-center rounded-xl border border-border bg-surface text-sm text-zinc-500">
                                Select an application to preview documents.
                            </div>
                        ) : (
                            <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-surface">
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-100">
                                            Documents
                                        </p>
                                        <p className="text-xs text-zinc-500">
                                            {activeApplication.files.length}{' '}
                                            file(s)
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={
                                                selectedFile === null ||
                                                selectedFileIndex === 0
                                            }
                                            onClick={() => {
                                                if (
                                                    activeApplication === null
                                                ) {
                                                    return;
                                                }

                                                setFileIndexByApplication(
                                                    (current) => ({
                                                        ...current,
                                                        [activeApplication.id]:
                                                            Math.max(
                                                                0,
                                                                selectedFileIndex -
                                                                    1,
                                                            ),
                                                    }),
                                                );
                                            }}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded border border-border text-zinc-400 transition-colors hover:text-zinc-200 disabled:cursor-not-allowed disabled:text-zinc-700"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        <span className="text-xs text-zinc-500">
                                            {selectedFile === null
                                                ? '0 / 0'
                                                : `${selectedFileIndex + 1} / ${activeApplication.files.length}`}
                                        </span>
                                        <button
                                            type="button"
                                            disabled={
                                                selectedFile === null ||
                                                selectedFileIndex >=
                                                    activeApplication.files
                                                        .length -
                                                        1
                                            }
                                            onClick={() => {
                                                if (
                                                    activeApplication === null
                                                ) {
                                                    return;
                                                }

                                                setFileIndexByApplication(
                                                    (current) => ({
                                                        ...current,
                                                        [activeApplication.id]:
                                                            Math.min(
                                                                activeApplication
                                                                    .files
                                                                    .length - 1,
                                                                selectedFileIndex +
                                                                    1,
                                                            ),
                                                    }),
                                                );
                                            }}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded border border-border text-zinc-400 transition-colors hover:text-zinc-200 disabled:cursor-not-allowed disabled:text-zinc-700"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="min-h-0 flex-1 border-b border-border p-3">
                                    {selectedFile === null ? (
                                        <div className="flex h-full items-center justify-center rounded border border-dashed border-zinc-700 text-xs text-zinc-500">
                                            No uploaded files to preview.
                                        </div>
                                    ) : (
                                        <FilePreview file={selectedFile} />
                                    )}
                                </div>

                                <div className="space-y-3 p-4">
                                    <div className="rounded border border-border/80 bg-background/60 p-2.5">
                                        <label
                                            htmlFor="review_notes"
                                            className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase"
                                        >
                                            Review notes
                                        </label>
                                        <Textarea
                                            id="review_notes"
                                            rows={3}
                                            value={reviewNotes}
                                            onChange={(event) =>
                                                setReviewNotesByApplication(
                                                    (current) => ({
                                                        ...current,
                                                        [activeApplication.id]:
                                                            event.target.value,
                                                    }),
                                                )
                                            }
                                            className="mt-2 text-zinc-200"
                                        />
                                    </div>

                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={
                                                processingApplicationId !== null
                                            }
                                            onClick={() => review('reject')}
                                            className="border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200"
                                        >
                                            <XCircle className="h-4 w-4" />
                                            Reject
                                        </Button>
                                        <Button
                                            type="button"
                                            disabled={
                                                processingApplicationId !== null
                                            }
                                            onClick={() => review('approve')}
                                            className="bg-emerald-600 text-white hover:bg-emerald-500"
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                            Approve
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}

function MetricPill({ label, value }: { label: string; value: number }) {
    return (
        <div className="min-w-[5.375rem] rounded border border-border bg-surface px-3 py-2 text-center">
            <p className="text-[0.625rem] tracking-wide text-zinc-500 uppercase">
                {label}
            </p>
            <p className="mt-0.5 font-mono text-sm text-zinc-100">{value}</p>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const isPending = status === 'pending';
    const isApproved = status === 'approved';
    const label = isApproved ? 'accepted' : status;

    return (
        <Badge
            className={cn(
                'inline-flex items-center gap-1 border-transparent px-2 py-0.5 text-[0.625rem] tracking-wide uppercase',
                isPending && 'bg-amber-500/15 text-amber-300',
                isApproved && 'bg-emerald-500/15 text-emerald-300',
                !isPending && !isApproved && 'bg-red-500/15 text-red-300',
            )}
        >
            {isPending ? <Clock3 className="h-3 w-3" /> : null}
            {isApproved ? <ShieldCheck className="h-3 w-3" /> : null}
            {label}
        </Badge>
    );
}

function AnswerRow({ label, value }: { label: string; value: string | null }) {
    return (
        <div className="rounded border border-border/70 bg-background/50 px-3 py-2">
            <p className="text-[0.625rem] tracking-[0.2em] text-cyan-300/90 uppercase">
                {label}
            </p>
            <p className="mt-1 text-xs leading-relaxed whitespace-pre-wrap text-zinc-300">
                {value === null || value.trim() === '' ? '—' : value}
            </p>
        </div>
    );
}

function FilePreview({ file }: { file: CoachApplicationFileItem }) {
    if (file.mime_type !== null && file.mime_type.startsWith('image/')) {
        return (
            <div className="h-full overflow-auto rounded border border-border bg-background/50 p-3">
                <img
                    src={file.preview_url}
                    alt={file.display_name}
                    className="mx-auto max-h-full max-w-full rounded"
                />
            </div>
        );
    }

    if (file.mime_type === 'application/pdf') {
        return (
            <iframe
                src={file.preview_url}
                className="h-full w-full rounded border border-border bg-background/50"
                title={file.display_name}
            />
        );
    }

    return (
        <div className="flex h-full flex-col items-center justify-center rounded border border-dashed border-zinc-700 text-center">
            <FileText className="mb-2 h-5 w-5 text-zinc-500" />
            <p className="text-sm text-zinc-400">
                Preview unavailable for this file type.
            </p>
            <a
                href={file.preview_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 text-xs text-zinc-200 underline"
            >
                Open file in new tab
            </a>
        </div>
    );
}
