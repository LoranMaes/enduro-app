import { Link, useForm } from '@inertiajs/react';
import {
    Check,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    PencilLine,
    Plus,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import AuthSplitLayout from '@/layouts/auth/auth-split-layout';
import { cn } from '@/lib/utils';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Zone = {
    label: string;
    min: number;
    max: number;
};

type CoachFileDraft = {
    id: string;
    file: File;
    extension: string;
    label: string;
    isRenaming: boolean;
    draftLabel: string;
    renameFlash: 'saved' | 'cancelled' | null;
};

type RegistrationFormData = {
    role: 'athlete' | 'coach';
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirmation: string;
    timezone: string;
    unit_system: 'metric' | 'imperial';
    primary_sport: 'swim' | 'bike' | 'run' | 'triathlon' | 'other';
    weekly_training_days: number | '';
    preferred_rest_day:
        | 'monday'
        | 'tuesday'
        | 'wednesday'
        | 'thursday'
        | 'friday'
        | 'saturday'
        | 'sunday';
    intensity_distribution: 'polarized' | 'pyramidal' | 'threshold' | 'mixed';
    ftp_watts: number | '';
    max_heart_rate_bpm: number | '';
    threshold_heart_rate_bpm: number | '';
    threshold_pace_minutes_per_km: number | '';
    power_zones: Zone[];
    heart_rate_zones: Zone[];
    connect_strava_after_signup: boolean;
    tutorial_opt_in: boolean;
    coaching_experience: string;
    specialties: string;
    certifications_summary: string;
    website_url: string;
    motivation: string;
    coach_certification_files: File[];
    coach_certification_labels: string[];
};

type StepConfig = {
    key: string;
    title: string;
    subtitle: string;
};

const athleteSteps: StepConfig[] = [
    {
        key: 'account',
        title: 'Create account',
        subtitle: 'Identity, credentials, and role.',
    },
    {
        key: 'preferences',
        title: 'Preferences',
        subtitle: 'Primary sport and weekly rhythm.',
    },
    {
        key: 'zones',
        title: 'Zones',
        subtitle: 'Set baseline power and heart-rate targets.',
    },
    {
        key: 'integrations',
        title: 'Integrations',
        subtitle: 'Optional onboarding shortcuts before you enter.',
    },
];

const coachSteps: StepConfig[] = [
    {
        key: 'account',
        title: 'Create account',
        subtitle: 'Identity, credentials, and role.',
    },
    {
        key: 'profile',
        title: 'Coach profile',
        subtitle: 'Experience and coaching focus.',
    },
    {
        key: 'application',
        title: 'Application',
        subtitle: 'Motivation and certification documents.',
    },
];

const defaultPowerZones: Zone[] = [
    { label: 'Z1', min: 55, max: 75 },
    { label: 'Z2', min: 76, max: 90 },
    { label: 'Z3', min: 91, max: 105 },
    { label: 'Z4', min: 106, max: 120 },
    { label: 'Z5', min: 121, max: 150 },
];

const defaultHeartRateZones: Zone[] = [
    { label: 'Z1', min: 60, max: 72 },
    { label: 'Z2', min: 73, max: 82 },
    { label: 'Z3', min: 83, max: 89 },
    { label: 'Z4', min: 90, max: 95 },
    { label: 'Z5', min: 96, max: 100 },
];

export default function Register() {
    const [stepIndex, setStepIndex] = useState(0);
    const [coachFiles, setCoachFiles] = useState<CoachFileDraft[]>([]);
    const [localError, setLocalError] = useState<string | null>(null);

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

                    return;
                }
            },
        });
    };

    const addCoachFiles = (files: FileList | null): void => {
        if (files === null || files.length === 0) {
            return;
        }

        const nextEntries = Array.from(files).map((file) => {
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

        setCoachFiles((current) => [...current, ...nextEntries]);
    };

    const deleteCoachFile = (fileId: string): void => {
        setCoachFiles((current) =>
            current.filter((item) => item.id !== fileId),
        );
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

function StepIndicator({
    steps,
    activeIndex,
}: {
    steps: StepConfig[];
    activeIndex: number;
}) {
    const progressPercentage =
        steps.length <= 1 ? 100 : (activeIndex / (steps.length - 1)) * 100;

    return (
        <div className="rounded-xl border border-border bg-background/50 p-4">
            <div className="relative hidden sm:block">
                <div className="absolute top-2 right-2 left-2 h-px bg-border" />
                <div
                    className="absolute top-2 left-2 h-px bg-cyan-400/70 transition-[width] duration-300"
                    style={{
                        width: `calc((100% - 1rem) * ${progressPercentage / 100})`,
                    }}
                />

                <ol
                    className="relative grid gap-3"
                    style={{
                        gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
                    }}
                >
                    {steps.map((step, index) => {
                        const isActive = index === activeIndex;
                        const isComplete = index < activeIndex;

                        return (
                            <li
                                key={step.key}
                                aria-current={isActive ? 'step' : undefined}
                            >
                                <div className="flex flex-col gap-2">
                                    <span
                                        className={cn(
                                            'inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-medium',
                                            isComplete
                                                ? 'bg-emerald-400 text-zinc-950'
                                                : isActive
                                                  ? 'bg-zinc-100 text-zinc-950 ring-2 ring-cyan-400/50'
                                                  : 'bg-zinc-700 text-zinc-300',
                                        )}
                                    >
                                        {isComplete ? (
                                            <Check className="h-2.5 w-2.5" />
                                        ) : (
                                            index + 1
                                        )}
                                    </span>
                                    <div className="space-y-0.5">
                                        <p
                                            className={cn(
                                                'text-[11px] leading-tight font-medium',
                                                isActive
                                                    ? 'text-zinc-100'
                                                    : 'text-zinc-400',
                                            )}
                                        >
                                            {step.title}
                                        </p>
                                        <p className="text-[10px] leading-tight text-zinc-500">
                                            {step.subtitle}
                                        </p>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </div>

            <ol className="space-y-2 sm:hidden">
                {steps.map((step, index) => {
                    const isActive = index === activeIndex;
                    const isComplete = index < activeIndex;

                    return (
                        <li
                            key={step.key}
                            aria-current={isActive ? 'step' : undefined}
                            className={cn(
                                'flex items-start gap-2 rounded-md border px-2.5 py-2',
                                isActive
                                    ? 'border-zinc-600 bg-zinc-900/60'
                                    : 'border-border bg-background/40',
                            )}
                        >
                            <span
                                className={cn(
                                    'mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-medium',
                                    isComplete
                                        ? 'bg-emerald-400 text-zinc-950'
                                        : isActive
                                          ? 'bg-zinc-100 text-zinc-950'
                                          : 'bg-zinc-700 text-zinc-300',
                                )}
                            >
                                {isComplete ? (
                                    <Check className="h-3.5 w-3.5" />
                                ) : (
                                    index + 1
                                )}
                            </span>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-zinc-100">
                                    {step.title}
                                </p>
                                <p className="text-[11px] text-zinc-500">
                                    {step.subtitle}
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

function AccountStep({
    form,
}: {
    form: ReturnType<typeof useForm<RegistrationFormData>>;
}) {
    return (
        <section className="space-y-4 rounded-xl border border-border bg-background/50 p-4">
            <div className="space-y-2">
                <Label>Role</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                    <button
                        type="button"
                        onClick={() => form.setData('role', 'athlete')}
                        className={`rounded-lg border p-3 text-left transition-colors ${
                            form.data.role === 'athlete'
                                ? 'border-zinc-500 bg-zinc-900/70'
                                : 'border-border bg-background hover:border-zinc-700'
                        }`}
                    >
                        <p className="text-sm font-medium text-zinc-100">
                            Athlete
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                            Daily execution, progress review, and integrations.
                        </p>
                    </button>

                    <button
                        type="button"
                        onClick={() => form.setData('role', 'coach')}
                        className={`rounded-lg border p-3 text-left transition-colors ${
                            form.data.role === 'coach'
                                ? 'border-zinc-500 bg-zinc-900/70'
                                : 'border-border bg-background hover:border-zinc-700'
                        }`}
                    >
                        <p className="text-sm font-medium text-zinc-100">
                            Coach
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                            Requires approval after dossier review.
                        </p>
                    </button>
                </div>
                <InputError message={form.errors.role} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="first_name">First name</Label>
                    <Input
                        id="first_name"
                        value={form.data.first_name}
                        onChange={(event) =>
                            form.setData('first_name', event.target.value)
                        }
                        placeholder="Jane"
                        autoComplete="given-name"
                    />
                    <InputError message={form.errors.first_name} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="last_name">Last name</Label>
                    <Input
                        id="last_name"
                        value={form.data.last_name}
                        onChange={(event) =>
                            form.setData('last_name', event.target.value)
                        }
                        placeholder="Doe"
                        autoComplete="family-name"
                    />
                    <InputError message={form.errors.last_name} />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    value={form.data.email}
                    onChange={(event) =>
                        form.setData('email', event.target.value)
                    }
                    placeholder="you@endure.so"
                    autoComplete="email"
                />
                <InputError message={form.errors.email} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        value={form.data.password}
                        onChange={(event) =>
                            form.setData('password', event.target.value)
                        }
                        autoComplete="new-password"
                    />
                    <InputError message={form.errors.password} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password_confirmation">
                        Confirm password
                    </Label>
                    <Input
                        id="password_confirmation"
                        type="password"
                        value={form.data.password_confirmation}
                        onChange={(event) =>
                            form.setData(
                                'password_confirmation',
                                event.target.value,
                            )
                        }
                        autoComplete="new-password"
                    />
                    <InputError message={form.errors.password_confirmation} />
                </div>
            </div>
        </section>
    );
}

function AthletePreferencesStep({
    form,
}: {
    form: ReturnType<typeof useForm<RegistrationFormData>>;
}) {
    return (
        <section className="space-y-4 rounded-xl border border-border bg-background/50 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="primary_sport">Primary sport</Label>
                    <select
                        id="primary_sport"
                        value={form.data.primary_sport}
                        onChange={(event) =>
                            form.setData(
                                'primary_sport',
                                event.target
                                    .value as RegistrationFormData['primary_sport'],
                            )
                        }
                        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-zinc-200"
                    >
                        <option value="triathlon">Triathlon</option>
                        <option value="bike">Bike</option>
                        <option value="run">Run</option>
                        <option value="swim">Swim</option>
                        <option value="other">Other</option>
                    </select>
                    <InputError message={form.errors.primary_sport} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="weekly_training_days">
                        Training days / week
                    </Label>
                    <Input
                        id="weekly_training_days"
                        type="number"
                        min={1}
                        max={7}
                        value={form.data.weekly_training_days}
                        onChange={(event) =>
                            form.setData(
                                'weekly_training_days',
                                toIntegerOrEmpty(event.target.value),
                            )
                        }
                    />
                    <InputError message={form.errors.weekly_training_days} />
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="preferred_rest_day">
                        Preferred rest day
                    </Label>
                    <select
                        id="preferred_rest_day"
                        value={form.data.preferred_rest_day}
                        onChange={(event) =>
                            form.setData(
                                'preferred_rest_day',
                                event.target
                                    .value as RegistrationFormData['preferred_rest_day'],
                            )
                        }
                        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-zinc-200"
                    >
                        <option value="monday">Monday</option>
                        <option value="tuesday">Tuesday</option>
                        <option value="wednesday">Wednesday</option>
                        <option value="thursday">Thursday</option>
                        <option value="friday">Friday</option>
                        <option value="saturday">Saturday</option>
                        <option value="sunday">Sunday</option>
                    </select>
                    <InputError message={form.errors.preferred_rest_day} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="intensity_distribution">
                        Intensity distribution
                    </Label>
                    <select
                        id="intensity_distribution"
                        value={form.data.intensity_distribution}
                        onChange={(event) =>
                            form.setData(
                                'intensity_distribution',
                                event.target
                                    .value as RegistrationFormData['intensity_distribution'],
                            )
                        }
                        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-zinc-200"
                    >
                        <option value="polarized">Polarized</option>
                        <option value="pyramidal">Pyramidal</option>
                        <option value="threshold">Threshold</option>
                        <option value="mixed">Mixed</option>
                    </select>
                    <InputError message={form.errors.intensity_distribution} />
                </div>
            </div>
        </section>
    );
}

function AthleteZonesStep({
    form,
}: {
    form: ReturnType<typeof useForm<RegistrationFormData>>;
}) {
    const updateZone = (
        field: 'power_zones' | 'heart_rate_zones',
        index: number,
        key: 'min' | 'max',
        value: string,
    ): void => {
        form.setData(
            field,
            form.data[field].map((zone, zoneIndex) => {
                if (zoneIndex !== index) {
                    return zone;
                }

                const numericValue = Number.parseInt(value, 10);

                return {
                    ...zone,
                    [key]: Number.isFinite(numericValue) ? numericValue : 0,
                };
            }),
        );
    };

    return (
        <section className="space-y-4 rounded-xl border border-border bg-background/50 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="ftp_watts">FTP (W)</Label>
                    <Input
                        id="ftp_watts"
                        type="number"
                        value={form.data.ftp_watts}
                        onChange={(event) =>
                            form.setData(
                                'ftp_watts',
                                toIntegerOrEmpty(event.target.value),
                            )
                        }
                    />
                    <InputError message={form.errors.ftp_watts} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="max_heart_rate_bpm">Max HR (bpm)</Label>
                    <Input
                        id="max_heart_rate_bpm"
                        type="number"
                        value={form.data.max_heart_rate_bpm}
                        onChange={(event) =>
                            form.setData(
                                'max_heart_rate_bpm',
                                toIntegerOrEmpty(event.target.value),
                            )
                        }
                    />
                    <InputError message={form.errors.max_heart_rate_bpm} />
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="threshold_heart_rate_bpm">
                        Threshold HR (bpm)
                    </Label>
                    <Input
                        id="threshold_heart_rate_bpm"
                        type="number"
                        value={form.data.threshold_heart_rate_bpm}
                        onChange={(event) =>
                            form.setData(
                                'threshold_heart_rate_bpm',
                                toIntegerOrEmpty(event.target.value),
                            )
                        }
                    />
                    <InputError
                        message={form.errors.threshold_heart_rate_bpm}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="threshold_pace_minutes_per_km">
                        Threshold pace (sec/km)
                    </Label>
                    <Input
                        id="threshold_pace_minutes_per_km"
                        type="number"
                        value={form.data.threshold_pace_minutes_per_km}
                        onChange={(event) =>
                            form.setData(
                                'threshold_pace_minutes_per_km',
                                toIntegerOrEmpty(event.target.value),
                            )
                        }
                    />
                    <InputError
                        message={form.errors.threshold_pace_minutes_per_km}
                    />
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <ZoneEditor
                    title="Power zones (%)"
                    zones={form.data.power_zones}
                    onChange={(index, key, value) =>
                        updateZone('power_zones', index, key, value)
                    }
                    error={form.errors.power_zones}
                />
                <ZoneEditor
                    title="Heart-rate zones (%)"
                    zones={form.data.heart_rate_zones}
                    onChange={(index, key, value) =>
                        updateZone('heart_rate_zones', index, key, value)
                    }
                    error={form.errors.heart_rate_zones}
                />
            </div>
        </section>
    );
}

function AthleteIntegrationsStep({
    form,
}: {
    form: ReturnType<typeof useForm<RegistrationFormData>>;
}) {
    return (
        <section className="space-y-4 rounded-xl border border-border bg-background/50 p-4">
            <div className="rounded-lg border border-border bg-background/60 p-3">
                <p className="text-sm font-medium text-zinc-200">
                    Integrations
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                    You can connect providers later from Settings.
                </p>

                <label className="mt-3 flex cursor-pointer items-start gap-2 rounded border border-border/70 bg-background/40 p-2">
                    <input
                        type="checkbox"
                        checked={form.data.connect_strava_after_signup}
                        onChange={(event) =>
                            form.setData(
                                'connect_strava_after_signup',
                                event.target.checked,
                            )
                        }
                        className="mt-0.5"
                    />
                    <span className="text-xs text-zinc-300">
                        Open Strava connection setup right after sign-up.
                    </span>
                </label>
            </div>

            <div className="rounded-lg border border-border bg-background/60 p-3">
                <p className="text-sm font-medium text-zinc-200">
                    Guided onboarding
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                    Short product walkthrough after first login.
                </p>

                <label className="mt-3 flex cursor-pointer items-start gap-2 rounded border border-border/70 bg-background/40 p-2">
                    <input
                        type="checkbox"
                        checked={form.data.tutorial_opt_in}
                        onChange={(event) =>
                            form.setData(
                                'tutorial_opt_in',
                                event.target.checked,
                            )
                        }
                        className="mt-0.5"
                    />
                    <span className="text-xs text-zinc-300">
                        Show onboarding pointers inside calendar and progress.
                    </span>
                </label>
            </div>
        </section>
    );
}

function CoachProfileStep({
    form,
}: {
    form: ReturnType<typeof useForm<RegistrationFormData>>;
}) {
    return (
        <section className="space-y-4 rounded-xl border border-border bg-background/50 p-4">
            <div className="space-y-2">
                <Label htmlFor="coaching_experience">Coaching experience</Label>
                <Textarea
                    id="coaching_experience"
                    rows={4}
                    value={form.data.coaching_experience}
                    onChange={(event) =>
                        form.setData('coaching_experience', event.target.value)
                    }
                    placeholder="Share your coaching background, years active, and athlete profile."
                />
                <InputError message={form.errors.coaching_experience} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="specialties">Specialties</Label>
                <Textarea
                    id="specialties"
                    rows={3}
                    value={form.data.specialties}
                    onChange={(event) =>
                        form.setData('specialties', event.target.value)
                    }
                    placeholder="Examples: long-course triathlon, run performance, bike power development."
                />
                <InputError message={form.errors.specialties} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="website_url">Website or profile URL</Label>
                <Input
                    id="website_url"
                    value={form.data.website_url}
                    onChange={(event) =>
                        form.setData('website_url', event.target.value)
                    }
                    placeholder="https://"
                />
                <InputError message={form.errors.website_url} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="certifications_summary">
                    Certifications summary (optional)
                </Label>
                <Textarea
                    id="certifications_summary"
                    rows={2}
                    value={form.data.certifications_summary}
                    onChange={(event) =>
                        form.setData(
                            'certifications_summary',
                            event.target.value,
                        )
                    }
                    placeholder="List the credentials you hold."
                />
                <InputError message={form.errors.certifications_summary} />
            </div>
        </section>
    );
}

function CoachApplicationStep({
    form,
    coachFiles,
    onFilesAdded,
    onDeleteFile,
    onStartRenaming,
    onChangeDraftLabel,
    onConfirmRename,
    onCancelRename,
}: {
    form: ReturnType<typeof useForm<RegistrationFormData>>;
    coachFiles: CoachFileDraft[];
    onFilesAdded: (files: FileList | null) => void;
    onDeleteFile: (fileId: string) => void;
    onStartRenaming: (fileId: string) => void;
    onChangeDraftLabel: (fileId: string, value: string) => void;
    onConfirmRename: (fileId: string) => void;
    onCancelRename: (fileId: string) => void;
}) {
    return (
        <section className="space-y-4 rounded-xl border border-border bg-background/50 p-4">
            <div className="space-y-2">
                <Label htmlFor="motivation">Motivation</Label>
                <Textarea
                    id="motivation"
                    rows={5}
                    value={form.data.motivation}
                    onChange={(event) =>
                        form.setData('motivation', event.target.value)
                    }
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
                            Upload PDFs or image documents for approval.
                        </p>
                    </div>

                    <label className="inline-flex cursor-pointer items-center gap-2 rounded border border-border bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 transition-colors hover:bg-zinc-800">
                        <Upload className="h-3.5 w-3.5" />
                        Add file
                        <input
                            type="file"
                            className="hidden"
                            multiple
                            accept=".pdf,.png,.jpg,.jpeg,.webp"
                            onChange={(event) => {
                                onFilesAdded(event.target.files);
                                event.currentTarget.value = '';
                            }}
                        />
                    </label>
                </div>

                <InputError message={form.errors.coach_certification_files} />

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
                                                        if (
                                                            event.key ===
                                                            'Enter'
                                                        ) {
                                                            event.preventDefault();
                                                            onConfirmRename(
                                                                entry.id,
                                                            );
                                                        }

                                                        if (
                                                            event.key ===
                                                            'Escape'
                                                        ) {
                                                            event.preventDefault();
                                                            onCancelRename(
                                                                entry.id,
                                                            );
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
                                                onClick={() =>
                                                    onStartRenaming(entry.id)
                                                }
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
                                            {(entry.file.size / 1024).toFixed(
                                                1,
                                            )}{' '}
                                            KB
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        {entry.isRenaming ? (
                                            <>
                                                <button
                                                    type="button"
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                                                    onClick={() =>
                                                        onConfirmRename(
                                                            entry.id,
                                                        )
                                                    }
                                                    aria-label="Confirm rename"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded border border-red-500/40 bg-red-500/10 text-red-300"
                                                    onClick={() =>
                                                        onCancelRename(entry.id)
                                                    }
                                                    aria-label="Cancel rename"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onStartRenaming(
                                                            entry.id,
                                                        )
                                                    }
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded border border-border bg-zinc-900 text-zinc-400 transition-colors hover:text-zinc-200"
                                                    aria-label="Rename file"
                                                >
                                                    <PencilLine className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onDeleteFile(entry.id)
                                                    }
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
                                        className={`mt-2 inline-flex items-center gap-1 text-[11px] ${
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

function ZoneEditor({
    title,
    zones,
    onChange,
    error,
}: {
    title: string;
    zones: Zone[];
    onChange: (index: number, key: 'min' | 'max', value: string) => void;
    error?: string;
}) {
    return (
        <div className="rounded-lg border border-border bg-background/60 p-3">
            <p className="mb-2 text-sm font-medium text-zinc-200">{title}</p>

            <div className="space-y-1.5">
                {zones.map((zone, index) => (
                    <div
                        key={zone.label}
                        className="grid grid-cols-[42px_1fr_auto_1fr] items-center gap-2"
                    >
                        <span className="text-xs text-zinc-400">
                            {zone.label}
                        </span>
                        <Input
                            type="number"
                            value={zone.min}
                            onChange={(event) =>
                                onChange(index, 'min', event.target.value)
                            }
                            className="h-8"
                        />
                        <span className="text-xs text-zinc-500">-</span>
                        <Input
                            type="number"
                            value={zone.max}
                            onChange={(event) =>
                                onChange(index, 'max', event.target.value)
                            }
                            className="h-8"
                        />
                    </div>
                ))}
            </div>

            {error !== undefined ? (
                <p className="mt-2 text-xs text-red-300">{error}</p>
            ) : null}
        </div>
    );
}

function toIntegerOrEmpty(value: string): number | '' {
    const parsed = Number.parseInt(value, 10);

    return Number.isFinite(parsed) ? parsed : '';
}

function toNullableInteger(value: number | ''): number | null {
    if (value === '') {
        return null;
    }

    return Number.isFinite(value) ? value : null;
}

function splitFileName(filename: string): { label: string; extension: string } {
    const lastDotIndex = filename.lastIndexOf('.');

    if (lastDotIndex <= 0) {
        return {
            label: filename,
            extension: 'file',
        };
    }

    return {
        label: filename.slice(0, lastDotIndex),
        extension: filename.slice(lastDotIndex + 1).toLowerCase(),
    };
}
