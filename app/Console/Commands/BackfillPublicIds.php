<?php

namespace App\Console\Commands;

use App\Support\Ids\IdMigrationMap;
use App\Support\Ids\PublicIdCodec;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class BackfillPublicIds extends Command
{
    protected $signature = 'ids:backfill-public-ids {--chunk=500 : Rows per chunk} {--table=* : Limit to specific tables}';

    protected $description = 'Backfill encrypted opaque public_id values from uuid_id.';

    public function handle(IdMigrationMap $map, PublicIdCodec $codec): int
    {
        $chunkSize = max(1, (int) $this->option('chunk'));
        $requestedTables = collect((array) $this->option('table'))
            ->filter(fn (mixed $value): bool => is_string($value) && $value !== '')
            ->values();

        $tables = collect($map->publicIdEntityTables())
            ->when($requestedTables->isNotEmpty(), fn ($query) => $query->intersect($requestedTables))
            ->values();

        foreach ($tables as $tableName) {
            $this->info(sprintf('Backfilling public_id for %s', $tableName));

            DB::table($tableName)
                ->whereNull('public_id')
                ->whereNotNull('uuid_id')
                ->select(['id', 'uuid_id'])
                ->orderBy('id')
                ->chunkById($chunkSize, function ($rows) use ($codec, $tableName): void {
                    foreach ($rows as $row) {
                        DB::table($tableName)
                            ->where('id', $row->id)
                            ->update([
                                'public_id' => $codec->encode((string) $row->uuid_id),
                                'updated_at' => now(),
                            ]);
                    }
                });
        }

        $this->info('public_id backfill completed.');

        return self::SUCCESS;
    }
}
