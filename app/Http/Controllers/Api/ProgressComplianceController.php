<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ProgressComplianceIndexRequest;
use App\Models\User;
use App\Services\Progress\ComplianceService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;

class ProgressComplianceController extends Controller
{
    public function __construct(
        private readonly ComplianceService $complianceService,
    ) {}

    public function __invoke(ProgressComplianceIndexRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        return response()->json(
            $this->complianceService->resolve(
                $user,
                CarbonImmutable::parse($validated['from']),
                CarbonImmutable::parse($validated['to']),
            ),
        );
    }
}
