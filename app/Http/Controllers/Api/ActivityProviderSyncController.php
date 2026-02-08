<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\SyncActivityProviderRequest;
use App\Services\Activities\ActivitySyncDispatcher;
use App\Services\ActivityProviders\Exceptions\ActivityProviderInvalidTokenException;
use App\Services\ActivityProviders\Exceptions\ActivityProviderRequestException;
use App\Services\ActivityProviders\Exceptions\ActivityProviderTokenMissingException;
use App\Services\ActivityProviders\Exceptions\UnsupportedActivityProviderException;
use Illuminate\Http\JsonResponse;

class ActivityProviderSyncController extends Controller
{
    public function __construct(
        private readonly ActivitySyncDispatcher $activitySyncDispatcher,
    ) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(SyncActivityProviderRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $resolvedProvider = (string) $validated['provider'];

        try {
            $syncRun = $this->activitySyncDispatcher->dispatch(
                user: $request->user(),
                provider: $resolvedProvider,
            );

            return response()->json([
                'status' => 'queued',
                'provider' => $resolvedProvider,
                'sync_run_id' => $syncRun->id,
            ], 202);
        } catch (UnsupportedActivityProviderException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        } catch (ActivityProviderTokenMissingException|ActivityProviderInvalidTokenException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        } catch (ActivityProviderRequestException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 502);
        }
    }
}
