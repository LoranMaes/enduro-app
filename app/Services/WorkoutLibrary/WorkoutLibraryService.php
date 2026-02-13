<?php

namespace App\Services\WorkoutLibrary;

use App\Models\User;
use App\Models\WorkoutLibraryItem;
use Illuminate\Database\Eloquent\Collection;

class WorkoutLibraryService
{
    /**
     * @param  array{sport?: string|null, search?: string|null}  $filters
     * @return Collection<int, WorkoutLibraryItem>
     */
    public function listForUser(User $user, array $filters = []): Collection
    {
        return WorkoutLibraryItem::query()
            ->where('user_id', $user->id)
            ->when(
                isset($filters['sport']) && is_string($filters['sport']) && trim($filters['sport']) !== '',
                fn ($query) => $query->where('sport', trim((string) $filters['sport'])),
            )
            ->when(
                isset($filters['search']) && is_string($filters['search']) && trim($filters['search']) !== '',
                fn ($query) => $query->where('title', 'like', '%'.trim((string) $filters['search']).'%'),
            )
            ->orderBy('title')
            ->orderBy('id')
            ->get();
    }

    /**
     * @param  array{
     *     title: string,
     *     sport: string,
     *     structure_json: array<string, mixed>,
     *     tags?: array<int, string>|null
     * }  $attributes
     */
    public function createForUser(User $user, array $attributes): WorkoutLibraryItem
    {
        $estimates = $this->estimateMetrics($attributes['structure_json'] ?? []);

        return WorkoutLibraryItem::query()->create([
            'user_id' => $user->id,
            'title' => trim($attributes['title']),
            'sport' => trim($attributes['sport']),
            'structure_json' => $attributes['structure_json'],
            'estimated_duration_minutes' => $estimates['estimated_duration_minutes'],
            'estimated_tss' => $estimates['estimated_tss'],
            'tags' => $attributes['tags'] ?? [],
        ]);
    }

    /**
     * @param  array{
     *     title?: string,
     *     sport?: string,
     *     structure_json?: array<string, mixed>,
     *     tags?: array<int, string>|null
     * }  $attributes
     */
    public function updateItem(
        WorkoutLibraryItem $workoutLibraryItem,
        array $attributes,
    ): WorkoutLibraryItem {
        $nextStructure = $attributes['structure_json'] ?? $workoutLibraryItem->structure_json ?? [];
        $estimates = $this->estimateMetrics($nextStructure);

        $workoutLibraryItem->update([
            'title' => array_key_exists('title', $attributes)
                ? trim((string) $attributes['title'])
                : $workoutLibraryItem->title,
            'sport' => array_key_exists('sport', $attributes)
                ? trim((string) $attributes['sport'])
                : $workoutLibraryItem->sport,
            'structure_json' => $nextStructure,
            'estimated_duration_minutes' => $estimates['estimated_duration_minutes'],
            'estimated_tss' => $estimates['estimated_tss'],
            'tags' => array_key_exists('tags', $attributes)
                ? ($attributes['tags'] ?? [])
                : $workoutLibraryItem->tags,
        ]);

        return $workoutLibraryItem->refresh();
    }

    public function deleteItem(WorkoutLibraryItem $workoutLibraryItem): void
    {
        $workoutLibraryItem->delete();
    }

    /**
     * @param  array<string, mixed>  $structure
     * @return array{
     *     estimated_duration_minutes: int,
     *     estimated_tss: int|null
     * }
     */
    public function estimateMetrics(array $structure): array
    {
        $steps = $this->extractArray($structure, 'steps');

        if ($steps === []) {
            return [
                'estimated_duration_minutes' => 0,
                'estimated_tss' => null,
            ];
        }

        $mode = strtolower((string) ($structure['mode'] ?? $structure['Mode'] ?? 'target'));
        $unit = strtolower((string) ($structure['unit'] ?? $structure['Unit'] ?? 'ftp_percent'));
        $totalDurationMinutes = 0;
        $estimatedTss = 0.0;

        foreach ($steps as $step) {
            if (! is_array($step)) {
                continue;
            }

            $items = $this->extractArray($step, 'items');
            $repeatCount = max(
                1,
                (int) ($step['repeat_count'] ?? $step['repeatCount'] ?? 1),
            );
            $cycles = strtolower((string) ($step['type'] ?? '')) === 'repeats'
                ? max(2, $repeatCount)
                : 1;
            $sources = $items !== [] ? $items : [$step];

            for ($cycle = 0; $cycle < $cycles; $cycle++) {
                foreach ($sources as $source) {
                    if (! is_array($source)) {
                        continue;
                    }

                    $durationMinutes = max(
                        1,
                        (int) ($source['duration_minutes'] ?? $source['durationMinutes'] ?? 1),
                    );
                    $totalDurationMinutes += $durationMinutes;
                    $midpoint = $this->resolveIntensityMidpoint($source, $mode);
                    $intensityFactor = $unit === 'rpe'
                        ? ($midpoint / 10)
                        : ($midpoint / 100);
                    $durationHours = $durationMinutes / 60;

                    $estimatedTss += $durationHours * $intensityFactor * $intensityFactor * 100;
                }
            }
        }

        return [
            'estimated_duration_minutes' => max(0, $totalDurationMinutes),
            'estimated_tss' => max(0, (int) round($estimatedTss)),
        ];
    }

    /**
     * @param  array<string, mixed>  $source
     */
    private function resolveIntensityMidpoint(array $source, string $mode): float
    {
        if ($mode === 'target') {
            return (float) ($source['target'] ?? 0);
        }

        $rangeMin = (float) ($source['range_min'] ?? $source['rangeMin'] ?? $source['target'] ?? 0);
        $rangeMax = (float) ($source['range_max'] ?? $source['rangeMax'] ?? $source['target'] ?? $rangeMin);

        return ($rangeMin + $rangeMax) / 2;
    }

    /**
     * @param  array<string, mixed>  $source
     * @return array<int, mixed>
     */
    private function extractArray(array $source, string $key): array
    {
        $camelCaseKey = str($key)->camel()->value();
        $value = $source[$key] ?? $source[$camelCaseKey] ?? null;

        return is_array($value) ? array_values($value) : [];
    }
}
