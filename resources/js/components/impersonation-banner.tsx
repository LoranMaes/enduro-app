import { Link, usePage } from '@inertiajs/react';
import { ShieldAlert, X } from 'lucide-react';
import { stop as stopImpersonation } from '@/routes/admin/impersonate';
import type { SharedData } from '@/types';

export function ImpersonationBanner() {
    const { auth } = usePage<SharedData>().props;

    if (!auth.impersonating || auth.impersonated_user == null) {
        return null;
    }

    const impersonatedUser = auth.impersonated_user;
    const roleLabel = (impersonatedUser.role ?? 'athlete').toString();

    return (
        <div className="pointer-events-none fixed right-0 bottom-0 left-16 z-30 border-t border-amber-900/40 bg-amber-950/90 px-6 py-3 backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3 text-amber-100">
                    <span className="inline-flex shrink-0 items-center gap-2 rounded-md border border-amber-800/60 bg-amber-900/60 px-2 py-1 text-[0.625rem] font-semibold tracking-wider uppercase">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Admin Mode
                    </span>
                    <p className="truncate text-xs text-amber-100/90">
                        Impersonating {impersonatedUser.name} ({roleLabel})
                    </p>
                </div>

                <Link
                    href={stopImpersonation()}
                    as="button"
                    className="pointer-events-auto inline-flex shrink-0 items-center gap-2 rounded-md border border-amber-800/70 bg-amber-900/40 px-3 py-1.5 text-xs font-medium text-amber-100 transition-colors hover:bg-amber-900/80"
                >
                    <span>Stop impersonation</span>
                    <X className="h-3.5 w-3.5" />
                </Link>
            </div>
        </div>
    );
}
