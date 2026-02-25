<?php

namespace App\Jobs;

use App\Enums\UserRole;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RecalculateRecentLoadJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly int $days = 90,
        public readonly int $chunkSize = 100,
    ) {}

    public function handle(): void
    {
        $from = Carbon::parse(now())->subDays(max(1, $this->days) - 1)->startOfDay();
        $to = Carbon::parse(now())->endOfDay();

        User::query()
            ->where(function ($query): void {
                $query->whereNull('role')
                    ->orWhere('role', UserRole::Athlete->value);
            })
            ->orderBy('id')
            ->chunkById(
                max(1, $this->chunkSize),
                function ($users) use ($from, $to): void {
                    foreach ($users as $user) {
                        if (! $user instanceof User) {
                            continue;
                        }

                        RecalculateUserLoadJob::dispatch(
                            $user,
                            $from->copy(),
                            $to->copy(),
                        );
                    }
                },
            );
    }
}
