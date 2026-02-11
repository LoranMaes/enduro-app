import { Head, Link } from '@inertiajs/react';
import { Clock3, ExternalLink, FileText, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AuthSplitLayout from '@/layouts/auth/auth-split-layout';
import { logout } from '@/routes';

type PendingFile = {
    id: number;
    display_name: string;
    extension: string | null;
    mime_type: string | null;
    size_bytes: number;
    preview_url: string;
};

type PendingApplication = {
    status: string;
    coaching_experience: string;
    specialties: string | null;
    certifications_summary: string | null;
    website_url: string | null;
    motivation: string;
    review_notes: string | null;
    files: PendingFile[];
};

type PendingApprovalPageProps = {
    submittedAt: string | null;
    application: PendingApplication | null;
};

export default function PendingApproval({
    submittedAt,
    application,
}: PendingApprovalPageProps) {
    const [selectedFile, setSelectedFile] = useState<PendingFile | null>(null);
    const status = application?.status ?? 'pending';
    const isRejected = status === 'rejected';

    return (
        <AuthSplitLayout
            pageTitle={
                isRejected
                    ? 'Coach Application Review'
                    : 'Coach Approval Pending'
            }
            title={
                isRejected
                    ? 'Coach application was not approved.'
                    : 'Coach account pending approval.'
            }
            description={
                isRejected
                    ? 'Your application needs adjustments before coach access can be granted. Review details below.'
                    : 'Your application has been submitted. You can review your answers and uploaded files below.'
            }
            asideTitle={
                isRejected
                    ? 'Application update required'
                    : 'Review in progress'
            }
            asideDescription={
                isRejected
                    ? 'Admin marked your submission as rejected. Update your dossier and re-apply once requirements are met.'
                    : 'Admin reviews every coach profile before access is activated. This keeps athlete workflows safe and deliberate.'
            }
            asideItems={[
                'Submitted applications are reviewed manually.',
                isRejected
                    ? 'Rejected applications remain read-only until resubmission.'
                    : 'Your account unlocks automatically after approval.',
                'You can sign out and return anytime.',
            ]}
        >
            <Head
                title={
                    isRejected
                        ? 'Coach Application Review'
                        : 'Coach Approval Pending'
                }
            />

            <div className="space-y-4">
                <section
                    className={`rounded-xl border p-4 ${
                        isRejected
                            ? 'border-red-500/30 bg-red-500/10'
                            : 'border-amber-500/30 bg-amber-500/10'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <Clock3
                            className={`h-4 w-4 ${
                                isRejected ? 'text-red-300' : 'text-amber-300'
                            }`}
                        />
                        <p
                            className={`text-sm font-medium ${
                                isRejected ? 'text-red-200' : 'text-amber-200'
                            }`}
                        >
                            {isRejected
                                ? 'Application rejected'
                                : 'Waiting for admin approval'}
                        </p>
                    </div>
                    <p
                        className={`mt-1 text-xs ${
                            isRejected ? 'text-red-100/85' : 'text-amber-100/80'
                        }`}
                    >
                        Status: {status}
                    </p>
                    <p
                        className={`mt-1 text-xs ${
                            isRejected ? 'text-red-100/85' : 'text-amber-100/80'
                        }`}
                    >
                        Submitted:{' '}
                        {submittedAt === null
                            ? '—'
                            : new Date(submittedAt).toLocaleString()}
                    </p>
                    {isRejected && application?.review_notes !== null ? (
                        <div className="mt-3 rounded border border-red-500/30 bg-red-950/40 px-3 py-2">
                            <p className="text-[0.6875rem] tracking-wide text-red-300 uppercase">
                                Rejection reason
                            </p>
                            <p className="mt-1 text-sm text-red-100/90">
                                {application?.review_notes}
                            </p>
                        </div>
                    ) : null}
                </section>

                {application === null ? (
                    <section className="rounded-xl border border-border bg-background/50 p-4">
                        <p className="text-sm text-zinc-400">
                            No application details were found yet.
                        </p>
                    </section>
                ) : (
                    <>
                        <section className="space-y-3 rounded-xl border border-border bg-background/50 p-4">
                            <Question
                                label="Coaching experience"
                                answer={application.coaching_experience}
                            />
                            <Question
                                label="Specialties"
                                answer={application.specialties}
                            />
                            <Question
                                label="Certifications summary"
                                answer={application.certifications_summary}
                            />
                            <Question
                                label="Website URL"
                                answer={application.website_url}
                                isLink
                            />
                            <Question
                                label="Motivation"
                                answer={application.motivation}
                            />
                        </section>

                        <section className="rounded-xl border border-border bg-background/50 p-4">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-zinc-400" />
                                <h2 className="text-sm font-medium text-zinc-200">
                                    Uploaded files
                                </h2>
                            </div>
                            {application.files.length === 0 ? (
                                <p className="mt-2 text-xs text-zinc-500">
                                    No files uploaded.
                                </p>
                            ) : (
                                <ul className="mt-3 space-y-2">
                                    {application.files.map((file) => (
                                        <li key={file.id}>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSelectedFile(file)
                                                }
                                                className="flex w-full items-center justify-between gap-2 rounded border border-border/70 bg-background/60 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
                                            >
                                                <span className="truncate">
                                                    {file.display_name}
                                                    {file.extension !== null
                                                        ? `.${file.extension}`
                                                        : ''}
                                                </span>
                                                <span className="text-xs text-zinc-500">
                                                    {(
                                                        file.size_bytes / 1024
                                                    ).toFixed(1)}{' '}
                                                    KB
                                                </span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {application.review_notes !== null ? (
                                <div className="mt-4 rounded border border-border/70 bg-zinc-900/40 px-3 py-2">
                                    <p className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase">
                                        Review notes
                                    </p>
                                    <p className="mt-1 text-sm text-zinc-300">
                                        {application.review_notes}
                                    </p>
                                </div>
                            ) : null}
                        </section>
                    </>
                )}

                <Button asChild variant="outline" className="w-full">
                    <Link href={logout()} method="post" as="button">
                        <LogOut className="h-4 w-4" />
                        Sign out
                    </Link>
                </Button>
            </div>

            <Dialog
                open={selectedFile !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedFile(null);
                    }
                }}
            >
                <DialogContent className="max-h-[92vh] max-w-6xl overflow-hidden border-border bg-surface text-zinc-100">
                    <DialogHeader className="space-y-2">
                        <DialogTitle className="text-base">
                            {selectedFile?.display_name}
                            {selectedFile?.extension
                                ? `.${selectedFile?.extension}`
                                : null}
                        </DialogTitle>
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-xs text-zinc-500">
                                Preview only. Use open in new tab if your
                                browser cannot render this file type.
                            </p>
                            {selectedFile !== null ? (
                                <a
                                    href={selectedFile.preview_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1.5 text-xs text-nowrap text-zinc-300 transition-colors hover:bg-zinc-800/70 hover:text-zinc-100"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Open in new tab
                                </a>
                            ) : null}
                        </div>
                    </DialogHeader>

                    <DialogDescription className="sr-only text-sm text-zinc-400">
                        Preview of the selected file
                    </DialogDescription>
                    {selectedFile !== null ? (
                        <div className="h-[68vh] overflow-hidden rounded border border-border/70 bg-background">
                            <iframe
                                src={selectedFile.preview_url}
                                title={`${selectedFile.display_name} preview`}
                                className="h-full w-full"
                            />
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </AuthSplitLayout>
    );
}

function Question({
    label,
    answer,
    isLink = false,
}: {
    label: string;
    answer: string | null;
    isLink?: boolean;
}) {
    return (
        <article className="rounded-lg border border-border/70 bg-background/60 p-3">
            <p className="text-[0.6875rem] tracking-[0.2em] text-cyan-300/90 uppercase">
                {label}
            </p>
            {answer === null || answer.trim() === '' ? (
                <p className="mt-1 text-sm text-zinc-500">—</p>
            ) : isLink ? (
                <a
                    href={answer}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex text-sm text-zinc-300 hover:text-zinc-100"
                >
                    {answer}
                </a>
            ) : (
                <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-zinc-300">
                    {answer}
                </p>
            )}
        </article>
    );
}
