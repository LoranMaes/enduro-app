<?php

namespace App\Services\AnnualTrainingPlan;

use App\Enums\GoalPriority;
use App\Models\Goal;
use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class AtpWeekGoalResolver
{
    /**
     * @return array<string, array{
     *     id: int,
     *     title: string,
     *     target_date: string|null,
     *     priority: string,
     *     status: string
     * }>
     */
    public function resolve(User $user, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $goalsByWeek = [];

        /** @var Collection<int, Goal> $goals */
        $goals = Goal::query()
            ->where('user_id', $user->id)
            ->whereNotNull('target_date')
            ->whereDate('target_date', '>=', $from->toDateString())
            ->whereDate('target_date', '<=', $to->toDateString())
            ->orderBy('target_date')
            ->get([
                'id',
                'title',
                'target_date',
                'priority',
                'status',
            ]);

        foreach ($goals as $goal) {
            if ($goal->target_date === null) {
                continue;
            }

            $weekStart = CarbonImmutable::parse($goal->target_date->toDateString())
                ->startOfWeek(CarbonInterface::MONDAY)
                ->toDateString();

            $candidate = [
                'id' => $goal->id,
                'title' => $goal->title,
                'target_date' => $goal->target_date->toDateString(),
                'priority' => $goal->priority?->value ?? (string) $goal->priority,
                'status' => $goal->status?->value ?? (string) $goal->status,
            ];

            $current = $goalsByWeek[$weekStart] ?? null;

            if ($current === null) {
                $goalsByWeek[$weekStart] = $candidate;

                continue;
            }

            if ($this->priorityWeight($candidate['priority']) > $this->priorityWeight($current['priority'])) {
                $goalsByWeek[$weekStart] = $candidate;
            }
        }

        return $goalsByWeek;
    }

    public function weeksToGoal(string $weekStart, ?string $goalDate): ?int
    {
        if ($goalDate === null) {
            return null;
        }

        $from = CarbonImmutable::parse($weekStart)->startOfWeek(CarbonInterface::MONDAY);
        $to = CarbonImmutable::parse($goalDate)->startOfWeek(CarbonInterface::MONDAY);

        return (int) floor($from->diffInDays($to, false) / 7);
    }

    private function priorityWeight(string $priority): int
    {
        return match ($priority) {
            GoalPriority::High->value => 3,
            GoalPriority::Normal->value => 2,
            GoalPriority::Low->value => 1,
            default => 0,
        };
    }
}
