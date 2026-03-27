<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\Load\TrainingLoadCalculator;
use Carbon\Carbon;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RecalculateUserLoadJob implements ShouldQueue, ShouldBeUnique
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;
    public int $uniqueFor = 300;

    public function __construct(
        public readonly User $user,
        public readonly Carbon $from,
        public readonly Carbon $to,
    ) {}

    public function handle(TrainingLoadCalculator $trainingLoadCalculator): void
    {
        $freshUser = User::query()->find($this->user->id);

        if (! $freshUser instanceof User || ! $freshUser->isAthlete()) {
            return;
        }

        $trainingLoadCalculator->recalculateForUser(
            $freshUser,
            $this->from->copy(),
            $this->to->copy(),
        );
    }

    public function uniqueId(): string
    {
        return implode(':', [
            'recalculate-user-load',
            (string) $this->user->id,
            $this->from->copy()->startOfDay()->format('Y-m-d'),
            $this->to->copy()->endOfDay()->format('Y-m-d'),
        ]);
    }

    public static function dispatchRecentDays(User $user, int $days = 60): void
    {
        $to = Carbon::parse(now())->endOfDay();
        $from = Carbon::parse(now())->subDays(max(1, $days) - 1)->startOfDay();

        self::dispatch($user, $from, $to);
    }
}
