<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Admin\UpdateSubscriptionFeatureEntitlementsRequest;
use App\Models\User;
use App\Services\Entitlements\SubscriptionFeatureMatrixService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionFeatureEntitlementController extends Controller
{
    public function __construct(
        private readonly SubscriptionFeatureMatrixService $subscriptionFeatureMatrixService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorizeAdminAccess($request);

        return response()->json([
            'data' => $this->subscriptionFeatureMatrixService->resolvedDefinitions(),
        ]);
    }

    public function update(
        UpdateSubscriptionFeatureEntitlementsRequest $request,
    ): JsonResponse {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $this->subscriptionFeatureMatrixService->updateMany(
            $request->validated('entitlements'),
            $user,
        );

        return response()->json([
            'data' => $this->subscriptionFeatureMatrixService->resolvedDefinitions(),
        ]);
    }

    public function reset(Request $request): JsonResponse
    {
        $this->authorizeAdminAccess($request);
        $this->subscriptionFeatureMatrixService->resetToDefaults();

        return response()->json([
            'data' => $this->subscriptionFeatureMatrixService->resolvedDefinitions(),
        ]);
    }

    private function authorizeAdminAccess(Request $request): void
    {
        $user = $request->user();
        abort_unless($user instanceof User && $user->isAdmin(), 403);
    }
}
