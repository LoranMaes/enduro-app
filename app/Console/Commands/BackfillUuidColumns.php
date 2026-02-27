<?php

namespace App\Console\Commands;

use App\Support\Ids\IdMigrationMap;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BackfillUuidColumns extends Command
{
    protected $signature = 'ids:backfill-uuids {--chunk=500 : Rows per chunk} {--table=* : Limit to specific tables}';

    protected $description = 'Backfill uuid_id columns for legacy bigint-key tables.';

    public function handle(IdMigrationMap $map): int
    {
        $chunkSize = max(1, (int) $this->option('chunk'));
        $requestedTables = collect((array) $this->option('table'))
            ->filter(fn (mixed $value): bool => is_string($value) && $value !== '')
            ->values();

        $tables = collect($map->uuidEntityTables())
            ->when($requestedTables->isNotEmpty(), fn ($query) => $query->intersect($requestedTables))
            ->values();

        foreach ($tables as $tableName) {
            $this->info(sprintf('Backfilling UUIDs for %s', $tableName));

            DB::table($tableName)
                ->whereNull('uuid_id')
                ->select(['id'])
                ->orderBy('id')
                ->chunkById($chunkSize, function ($rows) use ($tableName): void {
                    foreach ($rows as $row) {
                        DB::table($tableName)
                            ->where('id', $row->id)
                            ->update([
                                'uuid_id' => (string) Str::uuid7(),
                                'updated_at' => now(),
                            ]);
                    }
                });
        }

        $this->info('UUID backfill completed.');

        return self::SUCCESS;
    }
}
