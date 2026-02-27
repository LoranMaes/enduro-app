<?php

namespace App\Console\Commands;

use App\Models\ActivityProviderConnection;
use App\Models\User;
use App\Services\ActivityProviders\InitialFullHistoryImportDispatcher;
use Illuminate\Console\Command;

class QueueInitialFullHistoryImportsCommand extends Command
{
    protected $signature = 'activity-providers:queue-initial-full-history-import
        {--provider=strava : Provider key (currently strava only)}
        {--user=* : Limit to specific user IDs}
        {--chunk=100 : Rows per chunk}
        {--dry-run : Preview only, do not dispatch jobs}';

    protected $description = 'Queue one-time initial full-history imports for eligible provider connections.';

    public function handle(InitialFullHistoryImportDispatcher $dispatcher): int
    {
        $provider = strtolower(trim((string) $this->option('provider')));

        if ($provider !== 'strava') {
            $this->error('Only strava is currently supported for full-history imports.');

            return self::FAILURE;
        }

        $chunkSize = max(1, (int) $this->option('chunk'));
        $dryRun = (bool) $this->option('dry-run');
        $requestedUserIds = collect((array) $this->option('user'))
            ->filter(fn (mixed $value): bool => is_numeric($value))
            ->map(fn (mixed $value): int => (int) $value)
            ->unique()
            ->values();

        $query = ActivityProviderConnection::query()
            ->with('user')
            ->where('provider', $provider)
            ->whereNull('initial_full_import_requested_at')
            ->whereNull('last_synced_at')
            ->orderBy('id');

        if ($requestedUserIds->isNotEmpty()) {
            $query->whereIn('user_id', $requestedUserIds->all());
        }

        $eligible = 0;
        $queued = 0;
        $skipped = 0;

        $query->chunkById($chunkSize, function ($connections) use (&$eligible, &$queued, &$skipped, $dispatcher, $dryRun): void {
            foreach ($connections as $connection) {
                if (! $connection instanceof ActivityProviderConnection) {
                    continue;
                }

                $user = $connection->user;

                if (! $user instanceof User || ! $user->isAthlete()) {
                    $skipped++;

                    continue;
                }

                $eligible++;

                if ($dryRun) {
                    continue;
                }

                if ($dispatcher->dispatchIfEligible($user, $connection)) {
                    $queued++;
                }
            }
        });

        if ($dryRun) {
            $this->info("Dry run complete. Eligible athlete connections: {$eligible}. Skipped: {$skipped}.");

            return self::SUCCESS;
        }

        $this->info("Queued {$queued} initial full-history import jobs.");
        $this->info("Eligible athlete connections checked: {$eligible}. Skipped: {$skipped}.");

        return self::SUCCESS;
    }
}
