<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\User;
use App\Services\Activities\ActivityStreamService;
use App\Services\ActivityProviders\Exceptions\UnsupportedActivityProviderException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityStreamController extends Controller
{
    public function __construct(
        private readonly ActivityStreamService $activityStreamService,
    ) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request, Activity $activity): JsonResponse
    {
        $this->authorize('view', $activity);

        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $requestedKeys = $this->resolveRequestedStreamKeys($request);
        try {
            $streamData = $this->activityStreamService->streamsForActivity(
                user: $user,
                activity: $activity,
                streamKeys: $requestedKeys,
            );
        } catch (UnsupportedActivityProviderException) {
            abort(404);
        }

        return response()->json([
            'data' => [
                ...$streamData->toArray(),
                'default_enabled_streams' => [
                    'heart_rate',
                    'power',
                    'cadence',
                    'elevation',
                ],
                'stream_catalog' => [
                    'heart_rate',
                    'power',
                    'cadence',
                    'elevation',
                    'temperature',
                    'power_balance_left_right',
                    'speed',
                    'grade',
                    'distance',
                ],
            ],
        ]);
    }

    /**
     * @return list<string>
     */
    private function resolveRequestedStreamKeys(Request $request): array
    {
        $streamKeys = $request->query('stream_keys');

        if (is_string($streamKeys)) {
            $streamKeys = explode(',', $streamKeys);
        }

        if (! is_array($streamKeys)) {
            return [];
        }

        return array_values(array_filter(
            array_map(
                static fn (mixed $value): ?string => is_string($value)
                    ? trim($value)
                    : null,
                $streamKeys,
            ),
            static fn (?string $value): bool => $value !== null && $value !== '',
        ));
    }
}
