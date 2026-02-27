<?php

namespace App\Services\ActivityProviders;

use App\Jobs\StravaFullHistoryImportJob;
use App\Models\ActivityProviderConnection;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class InitialFullHistoryImportDispatcher
{
    public function dispatchIfEligible(
        User $user,
        ActivityProviderConnection $connection,
    ): bool {
        if (! (bool) config('services.activity_providers.initial_full_import_enabled', true)) {
            return false;
        }

        if (strtolower(trim((string) $connection->provider)) !== 'strava') {
            return false;
        }

        if ((int) $connection->user_id !== (int) $user->id) {
            return false;
        }

        if (! $user->isAthlete()) {
            return false;
        }

        if ($connection->last_synced_at !== null) {
            return false;
        }

        if (! Schema::hasColumn('activity_provider_connections', 'initial_full_import_requested_at')) {
            return false;
        }

        $queuedAt = now();

        $updated = DB::table('activity_provider_connections')
            ->where('id', $connection->id)
            ->whereNull('initial_full_import_requested_at')
            ->whereNull('last_synced_at')
            ->update([
                'initial_full_import_requested_at' => $queuedAt,
                'updated_at' => $queuedAt,
            ]);

        if ($updated !== 1) {
            return false;
        }

        StravaFullHistoryImportJob::dispatch($user);

        return true;
    }
}
