<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\SyncActivityProviderRequest;
use App\Services\Activities\ActivitySyncService;
use App\Services\ActivityProviders\Exceptions\ActivityProviderInvalidTokenException;
use App\Services\ActivityProviders\Exceptions\ActivityProviderRateLimitedException;
use App\Services\ActivityProviders\Exceptions\ActivityProviderRequestException;
use App\Services\ActivityProviders\Exceptions\ActivityProviderTokenMissingException;
use App\Services\ActivityProviders\Exceptions\ActivityProviderUnauthorizedException;
use App\Services\ActivityProviders\Exceptions\UnsupportedActivityProviderException;
use Illuminate\Http\JsonResponse;

class ActivityProviderSyncController extends Controller
{
    public function __construct(
        private readonly ActivitySyncService $activitySyncService,
    ) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(SyncActivityProviderRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $resolvedProvider = (string) $validated['provider'];

        try {
            $result = $this->activitySyncService->sync(
                user: $request->user(),
                provider: $resolvedProvider,
            );

            return response()->json($result->toArray());
        } catch (UnsupportedActivityProviderException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        } catch (ActivityProviderTokenMissingException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        } catch (ActivityProviderInvalidTokenException|ActivityProviderUnauthorizedException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 401);
        } catch (ActivityProviderRateLimitedException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 429);
        } catch (ActivityProviderRequestException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 502);
        }
    }
}
