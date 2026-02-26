<?php

namespace App\Models\Concerns;

use App\Support\Ids\PublicIdCodec;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

trait UsesDualUuidIdentity
{
    use HasUuids;

    public function uniqueIds(): array
    {
        return ['uuid_id'];
    }

    public static function bootUsesDualUuidIdentity(): void
    {
        static::creating(function (Model $model): void {
            if (! isset($model->uuid_id) || $model->uuid_id === null || $model->uuid_id === '') {
                $model->uuid_id = $model->newUniqueId();
            }

            if (! isset($model->public_id) || $model->public_id === null || $model->public_id === '') {
                $model->public_id = app(PublicIdCodec::class)->encode((string) $model->uuid_id);
            }
        });

        static::saving(function (Model $model): void {
            $model->syncForeignUuidColumns();
        });
    }

    public function getRouteKeyName(): string
    {
        if (config('id_migration.ids.mode', 'legacy') === 'legacy') {
            return $this->getKeyName();
        }

        return 'public_id';
    }

    public function getRouteKey(): mixed
    {
        if (config('id_migration.ids.mode', 'legacy') === 'legacy') {
            return parent::getRouteKey();
        }

        return $this->public_id ?: parent::getRouteKey();
    }

    public function resolveRouteBinding($value, $field = null): ?Model
    {
        if (config('id_migration.ids.mode', 'legacy') === 'legacy') {
            return parent::resolveRouteBinding($value, $field);
        }

        try {
            $model = parent::resolveRouteBinding($value, $field);

            if ($model !== null) {
                return $model;
            }
        } catch (ModelNotFoundException) {
            // fallback attempts below
        }

        if (is_numeric($value)) {
            return parent::resolveRouteBinding($value, $this->getKeyName());
        }

        return $this->newQuery()
            ->where('uuid_id', $value)
            ->first();
    }

    private function syncForeignUuidColumns(): void
    {
        $tableName = $this->getTable();
        $schemaBuilder = DB::getSchemaBuilder();

        if (! $schemaBuilder->hasTable($tableName)) {
            return;
        }

        $columns = $schemaBuilder->getColumnListing($tableName);

        foreach ($columns as $column) {
            if (! str_ends_with($column, '_id')) {
                continue;
            }

            $uuidColumn = str_replace('_id', '_uuid_id', $column);

            if (! in_array($uuidColumn, $columns, true)) {
                continue;
            }

            $foreignId = $this->getAttribute($column);

            if ($foreignId === null || $foreignId === '') {
                $this->setAttribute($uuidColumn, null);

                continue;
            }

            if ($this->getAttribute($uuidColumn) !== null && $this->getAttribute($uuidColumn) !== '') {
                continue;
            }

            $parentTable = $this->resolveParentTableName($column);

            if ($parentTable === null || ! $schemaBuilder->hasTable($parentTable)) {
                continue;
            }

            if (! $schemaBuilder->hasColumn($parentTable, 'uuid_id')) {
                continue;
            }

            $parentUuid = DB::table($parentTable)
                ->where('id', $foreignId)
                ->value('uuid_id');

            if (is_string($parentUuid) && $parentUuid !== '') {
                $this->setAttribute($uuidColumn, $parentUuid);
            }
        }
    }

    private function resolveParentTableName(string $foreignKeyColumn): ?string
    {
        $candidate = str_replace('_id', '', $foreignKeyColumn);
        $plural = str($candidate)->plural()->toString();

        if (DB::getSchemaBuilder()->hasTable($plural)) {
            return $plural;
        }

        if ($candidate === 'athlete') {
            return 'users';
        }

        if ($candidate === 'coach') {
            return 'users';
        }

        if (str_ends_with($candidate, '_admin')) {
            return 'users';
        }

        if ($candidate === 'reviewed_by_user' || $candidate === 'suspended_by_user') {
            return 'users';
        }

        return null;
    }
}
