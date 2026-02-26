<?php

namespace App\Console\Commands;

use App\Support\Ids\IdMigrationMap;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class VerifyIdParity extends Command
{
    protected $signature = 'ids:verify-parity';

    protected $description = 'Verify uuid/public/foreign uuid parity for migrated tables.';

    public function handle(IdMigrationMap $map): int
    {
        $hasErrors = false;

        foreach ($map->uuidEntityTables() as $tableName) {
            if (! DB::getSchemaBuilder()->hasTable($tableName)) {
                continue;
            }

            $uuidMissing = DB::table($tableName)->whereNull('uuid_id')->count();
            $publicMissing = DB::table($tableName)->whereNull('public_id')->count();

            if ($uuidMissing > 0 || $publicMissing > 0) {
                $hasErrors = true;
                $this->error(sprintf(
                    '%s has missing values: uuid_id=%d public_id=%d',
                    $tableName,
                    $uuidMissing,
                    $publicMissing,
                ));
            }
        }

        foreach ($map->foreignUuidRelationships() as $relationship) {
            $tableName = $relationship['table'];
            $column = $relationship['column'];
            $uuidColumn = $relationship['uuid_column'];

            if (! DB::getSchemaBuilder()->hasTable($tableName) || ! DB::getSchemaBuilder()->hasColumn($tableName, $uuidColumn)) {
                continue;
            }

            $missingForeignUuid = DB::table($tableName)
                ->whereNotNull($column)
                ->whereNull($uuidColumn)
                ->count();

            if ($missingForeignUuid > 0) {
                $hasErrors = true;
                $this->error(sprintf(
                    '%s.%s missing %d uuid values',
                    $tableName,
                    $uuidColumn,
                    $missingForeignUuid,
                ));
            }
        }

        if ($hasErrors) {
            return self::FAILURE;
        }

        $this->info('ID parity verification passed.');

        return self::SUCCESS;
    }
}
