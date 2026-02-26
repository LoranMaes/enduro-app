<?php

namespace App\Console\Commands;

use App\Support\Ids\IdMigrationMap;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class BackfillForeignUuidKeys extends Command
{
    protected $signature = 'ids:backfill-foreign-uuids {--chunk=500 : Rows per chunk}';

    protected $description = 'Backfill *_uuid_id foreign key companion columns.';

    public function handle(IdMigrationMap $map): int
    {
        $chunkSize = max(1, (int) $this->option('chunk'));

        foreach ($map->foreignUuidRelationships() as $relationship) {
            $tableName = $relationship['table'];
            $column = $relationship['column'];
            $uuidColumn = $relationship['uuid_column'];
            $parentTable = $relationship['parent_table'];
            $hasUpdatedAtColumn = DB::getSchemaBuilder()->hasColumn($tableName, 'updated_at');

            if (! DB::getSchemaBuilder()->hasTable($tableName)) {
                continue;
            }

            if (! DB::getSchemaBuilder()->hasColumn($tableName, $uuidColumn)) {
                continue;
            }

            $this->info(sprintf(
                'Backfilling %s.%s from %s.%s',
                $tableName,
                $uuidColumn,
                $parentTable,
                $column,
            ));

            DB::table($tableName)
                ->whereNull($uuidColumn)
                ->whereNotNull($column)
                ->select(['id', $column])
                ->orderBy('id')
                ->chunkById($chunkSize, function ($rows) use ($column, $hasUpdatedAtColumn, $parentTable, $tableName, $uuidColumn): void {
                    $foreignIds = collect($rows)
                        ->pluck($column)
                        ->filter()
                        ->map(fn (mixed $value): int => (int) $value)
                        ->unique()
                        ->values()
                        ->all();

                    if ($foreignIds === []) {
                        return;
                    }

                    $uuidMap = DB::table($parentTable)
                        ->whereIn('id', $foreignIds)
                        ->whereNotNull('uuid_id')
                        ->pluck('uuid_id', 'id');

                    foreach ($rows as $row) {
                        $foreignId = (int) $row->{$column};
                        $foreignUuid = $uuidMap->get($foreignId);

                        if (! is_string($foreignUuid) || $foreignUuid === '') {
                            continue;
                        }

                        $updatePayload = [
                            $uuidColumn => $foreignUuid,
                        ];

                        if ($hasUpdatedAtColumn) {
                            $updatePayload['updated_at'] = now();
                        }

                        DB::table($tableName)
                            ->where('id', $row->id)
                            ->update($updatePayload);
                    }
                });
        }

        $this->info('Foreign UUID backfill completed.');

        return self::SUCCESS;
    }
}
