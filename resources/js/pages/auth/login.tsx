import { Form } from '@inertiajs/react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthSplitLayout from '@/layouts/auth/auth-split-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type LoginPageProps = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: LoginPageProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <AuthSplitLayout
            pageTitle="Log in"
            title="Enter your training lab."
            description="Use your account credentials to continue into Endure."
            contentAlign="center"
            asideTitle="Plan. Execute. Review."
            asideDescription="Endure gives athletes and coaches one operating surface for planning and post-activity reconciliation."
            asideItems={[
                'Session-first calendar with real linked activity context.',
                'Read/write athlete workflow with explicit completion controls.',
                'Coach visibility and admin supervision without domain shortcuts.',
            ]}
        >
            <Form
                {...store()}
                resetOnSuccess={['password']}
                className="space-y-6"
            >
                {({ processing, errors }) => (
                    <>
                        {status ? (
                            <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                                {status}
                            </div>
                        ) : null}

                        <div className="space-y-4 rounded-xl border border-border bg-background/50 p-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email address</Label>
                                <div className="relative">
                                    <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                        autoFocus
                                        autoComplete="email"
                                        placeholder="you@endure.so"
                                        className="pl-9"
                                    />
                                </div>
                                <InputError message={errors.email} />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                    <Label htmlFor="password">Password</Label>
                                    {canResetPassword ? (
                                        <TextLink
                                            href={request()}
                                            className="text-xs"
                                        >
                                            Forgot password?
                                        </TextLink>
                                    ) : null}
                                </div>
                                <div className="relative">
                                    <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                                    <Input
                                        id="password"
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        name="password"
                                        required
                                        autoComplete="current-password"
                                        placeholder="Your password"
                                        className="pr-10 pl-9"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword((value) => !value)
                                        }
                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
                                        aria-label={
                                            showPassword
                                                ? 'Hide password'
                                                : 'Show password'
                                        }
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center gap-2">
                                <Checkbox id="remember" name="remember" />
                                <Label
                                    htmlFor="remember"
                                    className="text-xs text-zinc-400"
                                >
                                    Keep me signed in on this device
                                </Label>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={processing}
                            className="h-11 w-full rounded-lg"
                        >
                            {processing ? <Spinner /> : null}
                            Enter Lab
                        </Button>

                        {canRegister ? (
                            <p className="text-center text-sm text-zinc-500">
                                Need an account?{' '}
                                <TextLink href={register()} className="text-sm">
                                    Create one
                                </TextLink>
                            </p>
                        ) : null}
                    </>
                )}
            </Form>
        </AuthSplitLayout>
    );
}
