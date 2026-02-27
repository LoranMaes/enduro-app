<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Model;

trait HasBlindIndexes
{
    public static function bootHasBlindIndexes(): void
    {
        static::saving(function (Model $model): void {
            if (! method_exists($model, 'syncBlindIndexes')) {
                return;
            }

            /** @phpstan-ignore-next-line */
            $model->syncBlindIndexes();
        });
    }
}
