import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export type SubscriptionFeatureEntitlement = {
    key: string;
    group: string;
    label: string;
    description: string;
    athlete_free_enabled: boolean;
    athlete_free_limit: number | null;
    athlete_paid_enabled: boolean;
    coach_paid_enabled: boolean;
    source: 'config_default' | 'customized';
};

type SubscriptionFeatureMatrixProps = {
    entitlements: SubscriptionFeatureEntitlement[];
    onToggle: (
        key: string,
        segment: 'athlete_free_enabled' | 'athlete_paid_enabled',
        checked: boolean,
    ) => void;
    onChangeFreeLimit: (key: string, limit: number | null) => void;
};

export function SubscriptionFeatureMatrix({
    entitlements,
    onToggle,
    onChangeFreeLimit,
}: SubscriptionFeatureMatrixProps) {
    const customizedCount = entitlements.filter(
        (entitlement) => entitlement.source === 'customized',
    ).length;
    const defaultsCount = entitlements.length - customizedCount;

    return (
        <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
                <MatrixStatCard label="Feature keys" value={entitlements.length} />
                <MatrixStatCard label="Customized" value={customizedCount} />
                <MatrixStatCard label="Config defaults" value={defaultsCount} />
            </div>

            <div className="rounded-lg border border-border bg-background/40">
                <Table className="min-w-[54rem]">
                    <TableHeader className="bg-surface/95 backdrop-blur-sm">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[8rem]">Group</TableHead>
                            <TableHead>Feature</TableHead>
                            <TableHead className="w-[10rem] text-center">
                                Athlete Free
                            </TableHead>
                            <TableHead className="w-[12rem] text-center">
                                Free max templates
                            </TableHead>
                            <TableHead className="w-[10rem] text-center">
                                Athlete Paid
                            </TableHead>
                            <TableHead className="w-[9rem] text-right">Source</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {entitlements
                            .slice()
                            .sort((left, right) => left.key.localeCompare(right.key))
                            .map((entitlement) => (
                                <TableRow
                                    key={entitlement.key}
                                    className={
                                        entitlement.source === 'customized'
                                            ? 'bg-emerald-950/10'
                                            : ''
                                    }
                                >
                                    <TableCell className="align-top">
                                        <Badge
                                            variant="outline"
                                            className="text-[0.625rem] text-zinc-400"
                                        >
                                            {entitlement.group.replaceAll('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="align-top">
                                        <p className="text-sm text-zinc-100">{entitlement.label}</p>
                                        <p className="mt-1 text-xs text-zinc-500">
                                            {entitlement.description}
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-2 rounded-md border border-border/70 bg-background/60 px-2 py-2">
                                            <span className="text-xs text-zinc-400">
                                                {entitlement.athlete_free_enabled
                                                    ? 'Enabled'
                                                    : 'Locked'}
                                            </span>
                                            <Checkbox
                                                checked={entitlement.athlete_free_enabled}
                                                onCheckedChange={(checked) => {
                                                    onToggle(
                                                        entitlement.key,
                                                        'athlete_free_enabled',
                                                        checked === true,
                                                    );
                                                }}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {entitlement.key === 'workout.library' ? (
                                            <Input
                                                type="number"
                                                min={1}
                                                max={500}
                                                value={entitlement.athlete_free_limit ?? ''}
                                                disabled={!entitlement.athlete_free_enabled}
                                                onChange={(event) => {
                                                    const parsed = Number.parseInt(
                                                        event.target.value,
                                                        10,
                                                    );

                                                    if (Number.isNaN(parsed) || parsed < 1) {
                                                        onChangeFreeLimit(
                                                            entitlement.key,
                                                            null,
                                                        );

                                                        return;
                                                    }

                                                    onChangeFreeLimit(
                                                        entitlement.key,
                                                        parsed,
                                                    );
                                                }}
                                                className="h-8 bg-background text-center text-xs"
                                            />
                                        ) : (
                                            <span className="block text-center text-xs text-zinc-600">
                                                —
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-2 rounded-md border border-border/70 bg-background/60 px-2 py-2">
                                            <span className="text-xs text-zinc-400">
                                                {entitlement.athlete_paid_enabled
                                                    ? 'Enabled'
                                                    : 'Locked'}
                                            </span>
                                            <Checkbox
                                                checked={entitlement.athlete_paid_enabled}
                                                onCheckedChange={(checked) => {
                                                    onToggle(
                                                        entitlement.key,
                                                        'athlete_paid_enabled',
                                                        checked === true,
                                                    );
                                                }}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge
                                            variant="outline"
                                            className={
                                                entitlement.source === 'customized'
                                                    ? 'border-emerald-700/60 bg-emerald-950/40 text-[0.625rem] text-emerald-300'
                                                    : 'border-border text-[0.625rem] text-zinc-400'
                                            }
                                        >
                                            {entitlement.source === 'customized'
                                                ? 'Customized'
                                                : 'Config default'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function MatrixStatCard({
    label,
    value,
}: {
    label: string;
    value: number;
}) {
    return (
        <div className="rounded-md border border-border bg-background/40 px-3 py-2.5">
            <p className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase">{label}</p>
            <p className="mt-1 text-lg font-medium text-zinc-100">{value}</p>
        </div>
    );
}
