<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ProgressIndexRequest;
use App\Http\Resources\LoadHistoryResource;
use App\Models\User;
use App\Services\Load\LoadHistoryService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;

class ProgressController extends Controller
{
    public function __construct(
        private readonly LoadHistoryService $loadHistoryService,
    ) {}

    public function __invoke(ProgressIndexRequest $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $validated = $request->validated();
        $to = isset($validated['to'])
            ? CarbonImmutable::parse($validated['to'])->startOfDay()
            : CarbonImmutable::today()->startOfDay();
        $from = isset($validated['from'])
            ? CarbonImmutable::parse($validated['from'])->startOfDay()
            : $to->subDays(83);
        $history = $this->loadHistoryService->resolve(
            $user,
            $from,
            $to,
        );

        return response()->json([
            'from' => $history['from'],
            'to' => $history['to'],
            'combined' => collect($history['combined'])
                ->map(fn (array $point): array => (new LoadHistoryResource($point))->resolve($request))
                ->all(),
            'per_sport' => [
                'run' => collect($history['per_sport']['run'])
                    ->map(fn (array $point): array => (new LoadHistoryResource($point))->resolve($request))
                    ->all(),
                'bike' => collect($history['per_sport']['bike'])
                    ->map(fn (array $point): array => (new LoadHistoryResource($point))->resolve($request))
                    ->all(),
                'swim' => collect($history['per_sport']['swim'])
                    ->map(fn (array $point): array => (new LoadHistoryResource($point))->resolve($request))
                    ->all(),
                'other' => collect($history['per_sport']['other'])
                    ->map(fn (array $point): array => (new LoadHistoryResource($point))->resolve($request))
                    ->all(),
            ],
            'latest' => $history['latest'],
        ]);
    }
}
