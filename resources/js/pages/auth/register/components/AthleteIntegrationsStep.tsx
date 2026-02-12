import type { RegistrationForm } from '../types';

type AthleteIntegrationsStepProps = {
    form: RegistrationForm;
};

export function AthleteIntegrationsStep({
    form,
}: AthleteIntegrationsStepProps) {
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
