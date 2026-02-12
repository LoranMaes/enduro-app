import { Link, useForm } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import AuthSplitLayout from '@/layouts/auth/auth-split-layout';
import { login } from '@/routes';
import { store } from '@/routes/register';
import {
    athleteSteps,
    coachSteps,
    defaultHeartRateZones,
    defaultPowerZones,
} from './register/constants';
import { AccountStep } from './register/components/AccountStep';
import { AthleteIntegrationsStep } from './register/components/AthleteIntegrationsStep';
import { AthletePreferencesStep } from './register/components/AthletePreferencesStep';
import { AthleteZonesStep } from './register/components/AthleteZonesStep';
import { CoachApplicationStep } from './register/components/CoachApplicationStep';
import { CoachProfileStep } from './register/components/CoachProfileStep';
import { StepIndicator } from './register/components/StepIndicator';
import type {
    CoachFileDraft,
    RegistrationFormData,
    UploadLimits,
} from './register/types';
import {
    megabytesToBytes,
    splitFileName,
    toNullableInteger,
} from './register/utils';

export default function Register({
    uploadLimits,
}: {
    uploadLimits?: UploadLimits;
}) {
    const [stepIndex, setStepIndex] = useState(0);
    const [coachFiles, setCoachFiles] = useState<CoachFileDraft[]>([]);
    const [localError, setLocalError] = useState<string | null>(null);
    const [coachFilesError, setCoachFilesError] = useState<string | null>(null);

    const form = useForm<RegistrationFormData>({
        role: 'athlete',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
        unit_system: 'metric',
        primary_sport: 'triathlon',
        weekly_training_days: 6,
        preferred_rest_day: 'monday',
        intensity_distribution: 'polarized',
        ftp_watts: '',
        max_heart_rate_bpm: '',
        threshold_heart_rate_bpm: '',
        threshold_pace_minutes_per_km: '',
        power_zones: defaultPowerZones,
        heart_rate_zones: defaultHeartRateZones,
        connect_strava_after_signup: false,
        tutorial_opt_in: true,
        coaching_experience: '',
        specialties: '',
        certifications_summary: '',
        website_url: '',
        motivation: '',
        coach_certification_files: [],
        coach_certification_labels: [],
    });

    const normalizedUploadLimits = useMemo<UploadLimits>(() => {
        const rawMaxFiles = uploadLimits?.maxFiles ?? 10;
        const rawMaxFileSizeMb = uploadLimits?.maxFileSizeMb ?? 10;
        const rawMaxTotalSizeMb = uploadLimits?.maxTotalSizeMb ?? 25;
        const rawAcceptedExtensions = uploadLimits?.acceptedExtensions ?? [
            'pdf',
            'png',
            'jpg',
            'jpeg',
            'webp',
        ];

        const acceptedExtensions = rawAcceptedExtensions
            .map((extension) => extension.trim().toLowerCase())
            .filter((extension) => extension !== '');

        return {
            maxFiles: Math.max(1, rawMaxFiles),
            maxFileSizeMb: Math.max(1, rawMaxFileSizeMb),
            maxTotalSizeMb: Math.max(1, rawMaxTotalSizeMb),
            acceptedExtensions:
                acceptedExtensions.length > 0
                    ? acceptedExtensions
                    : ['pdf', 'png', 'jpg', 'jpeg', 'webp'],
        };
    }, [uploadLimits]);

    const coachFileFieldErrors = useMemo(() => {
        return Object.entries(form.errors)
            .filter(([key]) => key.startsWith('coach_certification_files.'))
            .map(([, value]) => value)
            .filter((value): value is string => typeof value === 'string');
    }, [form.errors]);

    const steps = useMemo(
        () => (form.data.role === 'coach' ? coachSteps : athleteSteps),
        [form.data.role],
    );
    const isLastStep = stepIndex === steps.length - 1;

    useEffect(() => {
        setStepIndex((current) => Math.min(current, steps.length - 1));
    }, [steps.length]);

    useEffect(() => {
        form.setData(
            'coach_certification_files',
            coachFiles.map((entry) => entry.file),
        );
        form.setData(
            'coach_certification_labels',
            coachFiles.map((entry) => entry.label),
        );
    }, [coachFiles]);

    const canProceed = (): boolean => {
        const step = steps[stepIndex];

        if (step?.key === 'account') {
            if (
                form.data.first_name.trim() === '' ||
                form.data.last_name.trim() === '' ||
                form.data.email.trim() === '' ||
                form.data.password.trim() === '' ||
                form.data.password_confirmation.trim() === ''
            ) {
                setLocalError('Fill in all required account fields.');

                return false;
            }

            if (form.data.password !== form.data.password_confirmation) {
                setLocalError('Password confirmation does not match.');

                return false;
            }
        }

        if (step?.key === 'profile' && form.data.role === 'coach') {
            if (
                form.data.coaching_experience.trim() === '' ||
                form.data.specialties.trim() === ''
            ) {
                setLocalError(
                    'Add coaching experience and specialties before continuing.',
                );

                return false;
            }
        }

        if (step?.key === 'application' && form.data.role === 'coach') {
            if (form.data.motivation.trim() === '') {
                setLocalError('Motivation is required.');

                return false;
            }

            if (coachFiles.length === 0) {
                setLocalError('Upload at least one certification document.');

                return false;
            }
        }

        setLocalError(null);

        return true;
    };

    const goNext = (): void => {
        if (!canProceed()) {
            return;
        }

        setStepIndex((current) => Math.min(current + 1, steps.length - 1));
    };

    const goBack = (): void => {
        setLocalError(null);
        setStepIndex((current) => Math.max(0, current - 1));
    };

    const handleStepSubmit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        if (form.processing) {
            return;
        }

        if (isLastStep) {
            submit();

            return;
        }

        goNext();
    };

    const submit = (): void => {
        if (!canProceed()) {
            return;
        }

        const registerRoute = store();
        form.transform((data) => ({
            ...data,
            ftp_watts: toNullableInteger(data.ftp_watts),
            max_heart_rate_bpm: toNullableInteger(data.max_heart_rate_bpm),
            threshold_heart_rate_bpm: toNullableInteger(
                data.threshold_heart_rate_bpm,
            ),
            threshold_pace_minutes_per_km: toNullableInteger(
                data.threshold_pace_minutes_per_km,
            ),
            weekly_training_days: toNullableInteger(data.weekly_training_days),
            coaching_experience: data.coaching_experience.trim(),
            specialties: data.specialties.trim(),
            certifications_summary: data.certifications_summary.trim(),
            website_url: data.website_url.trim(),
            motivation: data.motivation.trim(),
        }));

        form.post(registerRoute.url, {
            forceFormData: form.data.role === 'coach',
            preserveScroll: true,
            onError: () => {
                const errorKeys = Object.keys(form.errors);

                if (
                    errorKeys.some((key) => {
                        return (
                            key.startsWith('first_name') ||
                            key.startsWith('last_name') ||
                            key.startsWith('email') ||
                            key.startsWith('password')
                        );
                    })
                ) {
                    setStepIndex(0);

                    return;
                }

                if (
                    form.data.role === 'coach' &&
                    errorKeys.some((key) => {
                        return (
                            key.startsWith('coaching_experience') ||
                            key.startsWith('specialties')
                        );
                    })
                ) {
                    setStepIndex(1);

                    return;
                }

                if (
                    form.data.role === 'coach' &&
                    errorKeys.some((key) => {
                        return (
                            key.startsWith('motivation') ||
                            key.startsWith('coach_certification')
                        );
                    })
                ) {
                    setStepIndex(2);
                }
            },
        });
    };

    const addCoachFiles = (files: FileList | null): void => {
        if (files === null || files.length === 0) {
            return;
        }

        const selectedFiles = Array.from(files);
        const maxFiles = normalizedUploadLimits.maxFiles;
        const maxFileSizeBytes = megabytesToBytes(
            normalizedUploadLimits.maxFileSizeMb,
        );
        const maxTotalSizeBytes = megabytesToBytes(
            normalizedUploadLimits.maxTotalSizeMb,
        );
        const availableSlots = maxFiles - coachFiles.length;

        if (availableSlots <= 0) {
            setCoachFilesError(`You can upload up to ${maxFiles} files.`);
            form.clearErrors('coach_certification_files');

            return;
        }

        const filesWithinSizeLimit = selectedFiles.filter(
            (file) => file.size <= maxFileSizeBytes,
        );
        const oversizedFilesCount =
            selectedFiles.length - filesWithinSizeLimit.length;
        const filesWithinSlotLimit = filesWithinSizeLimit.slice(0, availableSlots);
        const skippedBecauseOfSlotLimit =
            filesWithinSizeLimit.length - filesWithinSlotLimit.length;

        const currentTotalBytes = coachFiles.reduce(
            (sum, item) => sum + item.file.size,
            0,
        );
        let nextTotalBytes = currentTotalBytes;
        const acceptedFiles: File[] = [];
        let skippedBecauseOfTotalLimit = 0;

        for (const file of filesWithinSlotLimit) {
            if (nextTotalBytes + file.size > maxTotalSizeBytes) {
                skippedBecauseOfTotalLimit++;
                continue;
            }

            acceptedFiles.push(file);
            nextTotalBytes += file.size;
        }

        const nextEntries = acceptedFiles.map((file) => {
            const { label, extension } = splitFileName(file.name);

            return {
                id: crypto.randomUUID(),
                file,
                extension,
                label,
                isRenaming: false,
                draftLabel: label,
                renameFlash: null,
            } satisfies CoachFileDraft;
        });

        if (nextEntries.length > 0) {
            setCoachFiles((current) => [...current, ...nextEntries]);
        }

        const errors: string[] = [];

        if (oversizedFilesCount > 0) {
            errors.push(
                `${oversizedFilesCount} file${oversizedFilesCount === 1 ? '' : 's'} exceeded ${normalizedUploadLimits.maxFileSizeMb} MB.`,
            );
        }

        if (skippedBecauseOfSlotLimit > 0) {
            errors.push(
                `${skippedBecauseOfSlotLimit} file${skippedBecauseOfSlotLimit === 1 ? '' : 's'} exceeded the ${maxFiles}-file limit.`,
            );
        }

        if (skippedBecauseOfTotalLimit > 0) {
            errors.push(
                `${skippedBecauseOfTotalLimit} file${skippedBecauseOfTotalLimit === 1 ? '' : 's'} exceeded the ${normalizedUploadLimits.maxTotalSizeMb} MB total limit.`,
            );
        }

        setCoachFilesError(errors.length > 0 ? errors.join(' ') : null);
        form.clearErrors('coach_certification_files');
    };

    const deleteCoachFile = (fileId: string): void => {
        setCoachFiles((current) =>
            current.filter((item) => item.id !== fileId),
        );
        setCoachFilesError(null);
        form.clearErrors('coach_certification_files');
    };

    const startRenamingCoachFile = (fileId: string): void => {
        setCoachFiles((current) =>
            current.map((item) =>
                item.id === fileId
                    ? {
                          ...item,
                          isRenaming: true,
                          draftLabel: item.label,
                          renameFlash: null,
                      }
                    : item,
            ),
        );
    };

    const changeCoachFileDraftLabel = (fileId: string, value: string): void => {
        setCoachFiles((current) =>
            current.map((item) =>
                item.id === fileId
                    ? {
                          ...item,
                          draftLabel: value,
                          renameFlash: null,
                      }
                    : item,
            ),
        );
    };

    const confirmRenameCoachFile = (fileId: string): void => {
        setCoachFiles((current) =>
            current.map((item) => {
                if (item.id !== fileId) {
                    return item;
                }

                const nextLabel = item.draftLabel.trim();

                return {
                    ...item,
                    label: nextLabel === '' ? item.label : nextLabel,
                    draftLabel: nextLabel === '' ? item.label : nextLabel,
                    isRenaming: false,
                    renameFlash: 'saved',
                };
            }),
        );
    };

    const cancelRenameCoachFile = (fileId: string): void => {
        setCoachFiles((current) =>
            current.map((item) =>
                item.id === fileId
                    ? {
                          ...item,
                          draftLabel: item.label,
                          isRenaming: false,
                          renameFlash: 'cancelled',
                      }
                    : item,
            ),
        );
    };

    return (
        <AuthSplitLayout
            pageTitle="Register"
            title="Create your Endure account."
            description="Choose your role and complete guided setup before entering the platform."
            asideTitle="Structured onboarding, not chaos."
            asideDescription="Athletes complete a practical setup path. Coaches submit an approval dossier reviewed by admin before activation."
            asideItems={[
                'Athlete path includes preferences, zones, and integrations.',
                'Coach path requires profile answers and certifications.',
                'No hidden defaults: every critical field is explicit.',
            ]}
        >
            <form className="space-y-6" onSubmit={handleStepSubmit}>
                <StepIndicator steps={steps} activeIndex={stepIndex} />

                {localError !== null ? (
                    <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                        {localError}
                    </div>
                ) : null}

                {stepIndex === 0 ? <AccountStep form={form} /> : null}

                {form.data.role === 'athlete' && stepIndex === 1 ? (
                    <AthletePreferencesStep form={form} />
                ) : null}

                {form.data.role === 'athlete' && stepIndex === 2 ? (
                    <AthleteZonesStep form={form} />
                ) : null}

                {form.data.role === 'athlete' && stepIndex === 3 ? (
                    <AthleteIntegrationsStep form={form} />
                ) : null}

                {form.data.role === 'coach' && stepIndex === 1 ? (
                    <CoachProfileStep form={form} />
                ) : null}

                {form.data.role === 'coach' && stepIndex === 2 ? (
                    <CoachApplicationStep
                        form={form}
                        coachFiles={coachFiles}
                        coachFilesError={coachFilesError}
                        coachFileFieldErrors={coachFileFieldErrors}
                        uploadLimits={normalizedUploadLimits}
                        onFilesAdded={addCoachFiles}
                        onDeleteFile={deleteCoachFile}
                        onStartRenaming={startRenamingCoachFile}
                        onChangeDraftLabel={changeCoachFileDraftLabel}
                        onConfirmRename={confirmRenameCoachFile}
                        onCancelRename={cancelRenameCoachFile}
                    />
                ) : null}

                <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={goBack}
                        disabled={stepIndex === 0 || form.processing}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back
                    </Button>

                    <div className="flex items-center gap-2">
                        {isLastStep ? (
                            <Button
                                type="submit"
                                disabled={form.processing}
                                className="min-w-36"
                            >
                                {form.processing ? <Spinner /> : null}
                                Create account
                            </Button>
                        ) : (
                            <Button type="submit" disabled={form.processing}>
                                Continue
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                <div className="text-center text-sm text-zinc-500">
                    Already have an account?{' '}
                    <Link
                        href={login().url}
                        className="font-medium text-zinc-200 hover:text-white"
                    >
                        Log in
                    </Link>
                </div>
            </form>
        </AuthSplitLayout>
    );
}
