<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Admin\UpdateEntryTypeEntitlementsRequest;
use App\Models\User;
use App\Services\Entitlements\EntryTypeEntitlementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EntryTypeEntitlementController extends Controller
{
    public function __construct(
        private readonly EntryTypeEntitlementService $entryTypeEntitlementService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorizeAdminAccess($request);

        return response()->json([
            'data' => $this->entryTypeEntitlementService->resolvedDefinitions(),
        ]);
    }

    public function update(UpdateEntryTypeEntitlementsRequest $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $this->entryTypeEntitlementService->updateMany(
            $request->validated('entitlements'),
            $user,
        );

        return response()->json([
            'data' => $this->entryTypeEntitlementService->resolvedDefinitions(),
        ]);
    }

    public function reset(Request $request): JsonResponse
    {
        $this->authorizeAdminAccess($request);
        $this->entryTypeEntitlementService->resetToDefaults();

        return response()->json([
            'data' => $this->entryTypeEntitlementService->resolvedDefinitions(),
        ]);
    }

    private function authorizeAdminAccess(Request $request): void
    {
        $user = $request->user();
        abort_unless($user instanceof User && $user->isAdmin(), 403);
    }
}
