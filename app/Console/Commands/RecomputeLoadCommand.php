<?php

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Jobs\RecalculateUserLoadJob;
use App\Jobs\RecalculateWeeklyMetricsJob;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;

class RecomputeLoadCommand extends Command
{
    protected $signature = 'load:recompute
        {--user= : Recompute load for one user id}
        {--all : Recompute load for all athletes}
        {--from= : Recompute start date (YYYY-MM-DD)}';

    protected $description = 'Queue training load recalculation jobs.';

    public function handle(): int
    {
        $userOption = $this->option('user');
        $forAllUsers = (bool) $this->option('all');

        if ($userOption !== null && $forAllUsers) {
            $this->error('Use either --user or --all, not both.');

            return self::FAILURE;
        }

        if ($userOption === null && ! $forAllUsers) {
            $this->error('Provide --user=ID or --all.');

            return self::FAILURE;
        }

        $from = $this->resolveFromDate($this->option('from'));
        $to = Carbon::parse(now())->endOfDay();

        if ($userOption !== null) {
            $user = User::query()->find((int) $userOption);

            if (! $user instanceof User || ! $user->isAthlete()) {
                $this->error('The selected user does not exist or is not an athlete.');

                return self::FAILURE;
            }

            RecalculateUserLoadJob::dispatch($user, $from, $to);
            RecalculateWeeklyMetricsJob::dispatch($user, $from, $to);
            $this->info("Queued load recompute for athlete #{$user->id}.");

            return self::SUCCESS;
        }

        $dispatched = 0;

        User::query()
            ->where(function ($query): void {
                $query->whereNull('role')
                    ->orWhere('role', UserRole::Athlete->value);
            })
            ->orderBy('id')
            ->chunkById(100, function ($users) use (&$dispatched, $from, $to): void {
                foreach ($users as $user) {
                    if (! $user instanceof User) {
                        continue;
                    }

                    RecalculateUserLoadJob::dispatch($user, $from->copy(), $to->copy());
                    RecalculateWeeklyMetricsJob::dispatch($user, $from->copy(), $to->copy());
                    $dispatched++;
                }
            });

        $this->info("Queued load recompute for {$dispatched} athletes.");

        return self::SUCCESS;
    }

    private function resolveFromDate(mixed $fromOption): Carbon
    {
        if (is_string($fromOption) && trim($fromOption) !== '') {
            try {
                return Carbon::parse($fromOption)->startOfDay();
            } catch (\Throwable) {
                $this->warn('Invalid --from provided, defaulting to 90-day window.');
            }
        }

        return Carbon::parse(now())->subDays(89)->startOfDay();
    }
}
