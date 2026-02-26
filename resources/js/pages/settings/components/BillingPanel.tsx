import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { SettingsOverviewProps } from '../types';

type BillingPanelProps = {
    name: string;
    email: string;
    billing: SettingsOverviewProps['billing'];
    subscribeUrl: string;
    portalUrl: string;
    billingStatusMessage: string | null;
};

export function BillingPanel({
    name,
    email,
    billing,
    subscribeUrl,
    portalUrl,
    billingStatusMessage,
}: BillingPanelProps) {
    const syncedAtLabel = billing.subscription_synced_at !== null
        ? new Date(billing.subscription_synced_at).toLocaleString()
        : null;

    return (
        <div className="space-y-6">
            {billingStatusMessage !== null ? (
                <p className="rounded-md border border-border bg-background/70 px-3 py-2 text-sm text-muted-foreground">
                    {billingStatusMessage}
                </p>
            ) : null}

            <div className="rounded-lg border border-emerald-900/30 bg-emerald-950/10 p-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-base font-medium text-emerald-300">
                            {billing.is_subscribed ? 'Advanced Athlete' : 'Free Athlete'}
                        </h3>
                        <p className="mt-1 text-sm text-zinc-400">
                            {billing.is_subscribed
                                ? 'Your subscription is active. Changes sync live after Stripe webhook updates.'
                                : 'Upgrade to unlock subscription-gated workout and calendar entry types.'}
                        </p>
                    </div>
                    <Badge
                        variant={billing.is_subscribed ? 'default' : 'outline'}
                        className={billing.is_subscribed ? 'bg-emerald-600 text-white' : ''}
                    >
                        {billing.is_subscribed ? 'Subscribed' : 'Not subscribed'}
                    </Badge>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                    {billing.is_subscribed ? (
                        <Button asChild>
                            <a href={portalUrl}>Manage subscription</a>
                        </Button>
                    ) : (
                        <Button asChild>
                            <a href={subscribeUrl}>Subscribe</a>
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                    <p className="text-xs text-zinc-500">Billing Name</p>
                    <div className="rounded-md border border-border bg-background/60 px-3 py-2 text-sm text-foreground">
                        {name}
                    </div>
                </div>
                <div className="space-y-1.5">
                    <p className="text-xs text-zinc-500">Billing Email</p>
                    <div className="rounded-md border border-border bg-background/60 px-3 py-2 text-sm text-foreground">
                        {email}
                    </div>
                </div>
            </div>

            <p className="text-xs text-zinc-500">
                {syncedAtLabel !== null
                    ? `Last subscription update: ${syncedAtLabel}`
                    : 'No subscription sync received yet.'}
            </p>
        </div>
    );
}
