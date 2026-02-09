<?php

namespace App\Http\Resources;

use App\Enums\TrainingSessionStatus;
use App\Models\Activity;
use App\Models\User;
use App\Services\Activities\TrainingSessionActualMetricsResolver;
use App\Services\ActivityLinkingService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\TrainingSession
 */
class TrainingSessionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $requestUser = $request->user();
        $contextUser = $requestUser instanceof User ? $requestUser : null;
        $actualMetricsResolver = app(TrainingSessionActualMetricsResolver::class);
        $linkedActivitySummary = null;
        $linkedActivityId = null;
        $resolvedActualTss = $actualMetricsResolver->resolveActualTss(
            $this->resource,
            $contextUser,
        );

        if ($this->relationLoaded('activity') && $this->activity instanceof Activity) {
            $linkedActivityId = $this->activity->id;
            $linkedActivitySummary = [
                'id' => $this->activity->id,
                'provider' => $this->activity->provider,
                'started_at' => $this->activity->started_at?->toISOString(),
                'duration_seconds' => $this->activity->duration_seconds,
                'sport' => $this->activity->sport,
            ];
        }

        $suggestedActivities = [];

        if ((bool) $request->attributes->get('include_suggested_activities', false)) {
            $suggestedActivities = app(ActivityLinkingService::class)
                ->suggestMatchesForSession($this->resource)
                ->map(function (Activity $activity): array {
                    return [
                        'id' => $activity->id,
                        'provider' => $activity->provider,
                        'sport' => $activity->sport,
                        'started_at' => $activity->started_at?->toISOString(),
                        'duration_seconds' => $activity->duration_seconds,
                    ];
                })
                ->values()
                ->all();
        }

        return [
            'id' => $this->id,
            'training_week_id' => $this->training_week_id,
            'scheduled_date' => $this->scheduled_date?->toDateString(),
            'sport' => $this->sport,
            'status' => $this->status instanceof TrainingSessionStatus ? $this->status->value : $this->status,
            'is_completed' => ($this->status instanceof TrainingSessionStatus
                ? $this->status === TrainingSessionStatus::Completed
                : $this->status === TrainingSessionStatus::Completed->value),
            'duration_minutes' => $this->duration_minutes,
            'actual_duration_minutes' => $this->actual_duration_minutes,
            'planned_tss' => $this->planned_tss,
            'actual_tss' => $this->actual_tss,
            'resolved_actual_tss' => $resolvedActualTss,
            'completed_at' => $this->completed_at?->toISOString(),
            'notes' => $this->notes,
            'planned_structure' => $this->planned_structure,
            'linked_activity_id' => $linkedActivityId,
            'linked_activity_summary' => $linkedActivitySummary,
            'suggested_activities' => $suggestedActivities,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
