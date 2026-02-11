type BillingPanelProps = {
    name: string;
    email: string;
};

export function BillingPanel({ name, email }: BillingPanelProps) {
    return (
        <div className="space-y-6">
            <div className="rounded-lg border border-emerald-900/30 bg-emerald-950/10 p-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-base font-medium text-emerald-400">
                            Advanced Athlete
                        </h3>
                        <p className="mt-1 text-sm text-zinc-400">
                            Billing shell only. Subscription wiring is not enabled yet.
                        </p>
                    </div>
                    <span className="font-mono text-xl text-zinc-200">—</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label htmlFor="billing-name" className="text-xs text-zinc-500">
                        Billing Name
                    </label>
                    <input
                        id="billing-name"
                        defaultValue={name}
                        className="w-full rounded-md border border-border bg-zinc-900/50 px-3 py-2 text-sm text-zinc-400 focus:outline-none"
                    />
                </div>
                <div className="space-y-1.5">
                    <label htmlFor="billing-email" className="text-xs text-zinc-500">
                        Billing Email
                    </label>
                    <input
                        id="billing-email"
                        defaultValue={email}
                        className="w-full rounded-md border border-border bg-zinc-900/50 px-3 py-2 text-sm text-zinc-400 focus:outline-none"
                    />
                </div>
            </div>

            <p className="text-xs text-zinc-500">
                Billing fields are editable as a UI shell in this phase. Payment
                processing and invoicing will be added in the dedicated Cashier
                integration step.
            </p>
        </div>
    );
}
