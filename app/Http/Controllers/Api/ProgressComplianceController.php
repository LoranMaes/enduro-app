<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ProgressComplianceIndexRequest;
use App\Models\User;
use App\Services\Calendar\HistoryWindowLimiter;
use App\Services\Progress\ComplianceService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;

class ProgressComplianceController extends Controller
{
    public function __construct(
        private readonly ComplianceService $complianceService,
        private readonly HistoryWindowLimiter $historyWindowLimiter,
    ) {}

    public function __invoke(ProgressComplianceIndexRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $from = CarbonImmutable::parse(
            $this->historyWindowLimiter->clampDate($user, (string) $validated['from']) ?? $validated['from'],
        );
        $to = CarbonImmutable::parse((string) $validated['to']);

        if ($to->lt($from)) {
            $to = $from;
        }

        return response()->json(
            $this->complianceService->resolve(
                $user,
                $from,
                $to,
            ),
        );
    }
}
