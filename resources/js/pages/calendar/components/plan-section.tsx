import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { TrainingPlanView } from '@/types/training-plans';
import { WeekSection } from './week-section';

type PlanSectionProps = {
    plan: TrainingPlanView;
};

export function PlanSection({ plan }: PlanSectionProps) {
    return (
        <Card>
            <CardHeader className="gap-2">
                <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base">{plan.title}</CardTitle>
                    <Badge variant="secondary" className="font-mono">
                        {plan.weeks.length}w
                    </Badge>
                </div>
                <CardDescription>
                    {plan.startsAt} to {plan.endsAt}
                </CardDescription>
                {plan.description ? (
                    <p className="text-muted-foreground text-sm">{plan.description}</p>
                ) : null}
            </CardHeader>
            <CardContent className="space-y-3">
                {plan.weeks.map((week) => (
                    <WeekSection key={week.id} week={week} />
                ))}
            </CardContent>
        </Card>
    );
}
