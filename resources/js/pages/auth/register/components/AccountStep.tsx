import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { RegistrationForm } from '../types';

type AccountStepProps = {
    form: RegistrationForm;
};

export function AccountStep({ form }: AccountStepProps) {
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
                    onChange={(event) => form.setData('email', event.target.value)}
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
