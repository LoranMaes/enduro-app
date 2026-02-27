import { Link } from '@inertiajs/react';
import { Lock } from 'lucide-react';
import { overview as settingsOverview } from '@/routes/settings';

type FeatureLockedCardProps = {
    title: string;
    description: string;
};

export function FeatureLockedCard({
    title,
    description,
}: FeatureLockedCardProps) {
    return (
        <div className="rounded-xl border border-border bg-surface px-5 py-5">
            <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-amber-700/50 bg-amber-900/20 text-amber-300">
                    <Lock className="h-3.5 w-3.5" />
                </span>
                <div>
                    <p className="text-sm font-medium text-zinc-100">{title}</p>
                    <p className="mt-1 text-xs text-zinc-400">{description}</p>
                    <Link
                        href={settingsOverview({ query: { tab: 'billing' } }).url}
                        className="mt-3 inline-flex rounded border border-border bg-background px-2.5 py-1 text-[0.6875rem] text-zinc-200 transition-colors hover:border-zinc-600"
                    >
                        Upgrade
                    </Link>
                </div>
            </div>
        </div>
    );
}
