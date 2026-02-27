<?php

namespace App\Console\Commands;

use App\Support\Ids\BlindIndex;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class BackfillBlindIndexes extends Command
{
    protected $signature = 'crypto:backfill-blind-indexes {--chunk=500 : Rows per chunk}';

    protected $description = 'Backfill blind-index columns for sensitive fields.';

    public function handle(BlindIndex $blindIndex): int
    {
        $chunkSize = max(1, (int) $this->option('chunk'));

        DB::table('users')
            ->whereNull('email_bidx')
            ->whereNotNull('email')
            ->select(['id', 'email'])
            ->orderBy('id')
            ->chunkById($chunkSize, function ($rows) use ($blindIndex): void {
                foreach ($rows as $row) {
                    DB::table('users')
                        ->where('id', $row->id)
                        ->update([
                            'email_bidx' => $blindIndex->forEmail((string) $row->email),
                            'updated_at' => now(),
                        ]);
                }
            });

        DB::table('users')
            ->whereNull('stripe_customer_id_bidx')
            ->whereNotNull('stripe_customer_id')
            ->select(['id', 'stripe_customer_id'])
            ->orderBy('id')
            ->chunkById($chunkSize, function ($rows) use ($blindIndex): void {
                foreach ($rows as $row) {
                    DB::table('users')
                        ->where('id', $row->id)
                        ->update([
                            'stripe_customer_id_bidx' => $blindIndex->forGeneric((string) $row->stripe_customer_id),
                            'updated_at' => now(),
                        ]);
                }
            });

        DB::table('activities')
            ->whereNull('external_id_bidx')
            ->whereNotNull('external_id')
            ->whereNotNull('provider')
            ->whereNotNull('athlete_id')
            ->select(['id', 'athlete_id', 'provider', 'external_id'])
            ->orderBy('id')
            ->chunkById($chunkSize, function ($rows) use ($blindIndex): void {
                foreach ($rows as $row) {
                    DB::table('activities')
                        ->where('id', $row->id)
                        ->update([
                            'external_id_bidx' => $blindIndex->forExternalActivityId(
                                $row->athlete_id,
                                (string) $row->provider,
                                (string) $row->external_id,
                            ),
                            'updated_at' => now(),
                        ]);
                }
            });

        DB::table('activity_provider_connections')
            ->whereNull('provider_athlete_id_bidx')
            ->whereNotNull('provider_athlete_id')
            ->whereNotNull('provider')
            ->select(['id', 'provider', 'provider_athlete_id'])
            ->orderBy('id')
            ->chunkById($chunkSize, function ($rows) use ($blindIndex): void {
                foreach ($rows as $row) {
                    DB::table('activity_provider_connections')
                        ->where('id', $row->id)
                        ->update([
                            'provider_athlete_id_bidx' => $blindIndex->forProviderAthleteId(
                                (string) $row->provider,
                                (string) $row->provider_athlete_id,
                            ),
                            'updated_at' => now(),
                        ]);
                }
            });

        $this->info('Blind index backfill completed.');

        return self::SUCCESS;
    }
}
