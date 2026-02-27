<?php

namespace App\Http\Controllers\Admin;

use App\Enums\TrainingSessionStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Activity as ExternalActivity;
use App\Models\ActivityProviderConnection;
use App\Models\ActivityProviderSyncRun;
use App\Models\ActivityProviderWebhookEvent;
use App\Models\CoachApplication;
use App\Models\TrainingSession;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity as ActivityLog;

class AdminAnalyticsController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        $admin = $request->user();
        abort_unless($admin !== null && $admin->isAdmin(), 403);

        $validated = $request->validate([
            'range' => ['nullable', 'in:4w,8w,12w,24w'],
        ]);

        $rangeKey = (string) ($validated['range'] ?? '12w');
        $rangeWeeks = $this->resolveRangeWeeks($rangeKey);
        $rangeEnd = CarbonImmutable::now()->endOfWeek();
        $rangeStart = CarbonImmutable::now()
            ->startOfWeek()
            ->subWeeks($rangeWeeks - 1);
        $rangeCacheKey = sprintf(
            '%s:%s:%s',
            $rangeKey,
            $rangeStart->toDateString(),
            $rangeEnd->toDateString(),
        );

        $weekStarts = collect(range(0, $rangeWeeks - 1))
            ->map(fn (int $offset): CarbonImmutable => $rangeStart->addWeeks($offset));

        return Inertia::render('admin/analytics', [
            'range' => [
                'selected' => $rangeKey,
                'options' => ['4w', '8w', '12w', '24w'],
                'weeks' => $rangeWeeks,
                'start' => $rangeStart->toIso8601String(),
                'end' => $rangeEnd->toIso8601String(),
            ],
            'userGrowth' => $this->rememberAnalytics(
                "{$rangeCacheKey}:user-growth",
                fn (): array => $this->buildUserGrowthData($weekStarts, $rangeStart, $rangeEnd),
            ),
            'coachPipeline' => $this->rememberAnalytics(
                "{$rangeCacheKey}:coach-pipeline",
                fn (): array => $this->buildCoachPipelineData($rangeStart, $rangeEnd),
            ),
            'platformUsage' => $this->rememberAnalytics(
                "{$rangeCacheKey}:platform-usage",
                fn (): array => $this->buildPlatformUsageData($rangeStart, $rangeEnd),
            ),
            'syncHealth' => $this->rememberAnalytics(
                "{$rangeCacheKey}:sync-health",
                fn (): array => $this->buildSyncHealthData($rangeStart, $rangeEnd),
            ),
            'moderation' => $this->rememberAnalytics(
                "{$rangeCacheKey}:moderation",
                fn (): array => $this->buildModerationData($rangeStart, $rangeEnd),
            ),
            'systemOps' => $this->rememberAnalytics(
                "{$rangeCacheKey}:system-ops",
                fn (): array => $this->buildSystemOpsData(),
            ),
        ]);
    }

    /**
     * @template T
     *
     * @param  \Closure(): T  $callback
     * @return T
     */
    private function rememberAnalytics(string $cacheKey, \Closure $callback): mixed
    {
        return Cache::remember(
            "admin:analytics:{$cacheKey}",
            now()->addSeconds(60),
            $callback,
        );
    }

    private function resolveRangeWeeks(string $rangeKey): int
    {
        return match ($rangeKey) {
            '4w' => 4,
            '8w' => 8,
            '24w' => 24,
            default => 12,
        };
    }

    /**
     * @param  \Illuminate\Support\Collection<int, CarbonImmutable>  $weekStarts
     * @return array{
     *     labels: array<int, string>,
     *     totals: array<int, int>,
     *     athletes: array<int, int>,
     *     coaches: array<int, int>,
     *     current: array{total: int, athletes: int, coaches: int}
     * }
     */
    private function buildUserGrowthData(
        \Illuminate\Support\Collection $weekStarts,
        CarbonImmutable $rangeStart,
        CarbonImmutable $rangeEnd,
    ): array {
        $baselineTotal = User::query()
            ->where('created_at', '<', $rangeStart)
            ->count();
        $baselineAthletes = User::query()
            ->where('created_at', '<', $rangeStart)
            ->where(function ($query): void {
                $query->whereNull('role')
                    ->orWhere('role', 'athlete');
            })->count();
        $baselineCoaches = User::query()
            ->where('created_at', '<', $rangeStart)
            ->where('role', 'coach')
            ->count();

        $rows = User::query()
            ->selectRaw('YEARWEEK(created_at, 3) as bucket, role, COUNT(*) as aggregate')
            ->whereBetween('created_at', [$rangeStart, $rangeEnd])
            ->groupBy('bucket', 'role')
            ->get();

        $totalsPerBucket = [];
        $athletesPerBucket = [];
        $coachesPerBucket = [];

        foreach ($rows as $row) {
            $bucket = (int) $row->bucket;
            $count = (int) $row->aggregate;
            $role = $row->role instanceof UserRole
                ? $row->role->value
                : $row->role;

            $totalsPerBucket[$bucket] = ($totalsPerBucket[$bucket] ?? 0) + $count;

            if ($role === 'coach') {
                $coachesPerBucket[$bucket] = ($coachesPerBucket[$bucket] ?? 0) + $count;

                continue;
            }

            if ($role === null || $role === 'athlete') {
                $athletesPerBucket[$bucket] = ($athletesPerBucket[$bucket] ?? 0) + $count;
            }
        }

        $runningTotal = $baselineTotal;
        $runningAthletes = $baselineAthletes;
        $runningCoaches = $baselineCoaches;

        $labels = [];
        $totals = [];
        $athletes = [];
        $coaches = [];

        foreach ($weekStarts as $weekStart) {
            $bucket = (int) $weekStart->format('oW');
            $weekLabel = sprintf(
                '%s — %s',
                $weekStart->format('M j'),
                $weekStart->endOfWeek()->format('M j'),
            );

            $runningTotal += (int) ($totalsPerBucket[$bucket] ?? 0);
            $runningAthletes += (int) ($athletesPerBucket[$bucket] ?? 0);
            $runningCoaches += (int) ($coachesPerBucket[$bucket] ?? 0);

            $labels[] = $weekLabel;
            $totals[] = $runningTotal;
            $athletes[] = $runningAthletes;
            $coaches[] = $runningCoaches;
        }

        return [
            'labels' => $labels,
            'totals' => $totals,
            'athletes' => $athletes,
            'coaches' => $coaches,
            'current' => [
                'total' => $runningTotal,
                'athletes' => $runningAthletes,
                'coaches' => $runningCoaches,
            ],
        ];
    }

    /**
     * @return array{
     *     pending: int,
     *     approved: int,
     *     rejected: int,
     *     submitted_in_range: int,
     *     reviewed_in_range: int
     * }
     */
    private function buildCoachPipelineData(CarbonImmutable $rangeStart, CarbonImmutable $rangeEnd): array
    {
        return [
            'pending' => CoachApplication::query()->where('status', 'pending')->count(),
            'approved' => CoachApplication::query()->where('status', 'approved')->count(),
            'rejected' => CoachApplication::query()->where('status', 'rejected')->count(),
            'submitted_in_range' => CoachApplication::query()
                ->whereBetween('submitted_at', [$rangeStart, $rangeEnd])
                ->count(),
            'reviewed_in_range' => CoachApplication::query()
                ->whereBetween('reviewed_at', [$rangeStart, $rangeEnd])
                ->count(),
        ];
    }

    /**
     * @return array{
     *     planned_sessions: int,
     *     completed_sessions: int,
     *     linked_sessions: int,
     *     synced_activities: int,
     *     active_athletes: int,
     *     completion_rate: float
     * }
     */
    private function buildPlatformUsageData(CarbonImmutable $rangeStart, CarbonImmutable $rangeEnd): array
    {
        $sessionsQuery = TrainingSession::query()
            ->whereBetween('scheduled_date', [$rangeStart->toDateString(), $rangeEnd->toDateString()]);

        $plannedSessions = (clone $sessionsQuery)->count();
        $completedSessions = (clone $sessionsQuery)
            ->where('status', TrainingSessionStatus::Completed->value)
            ->count();
        $linkedSessions = (clone $sessionsQuery)
            ->whereHas('activity')
            ->count();

        return [
            'planned_sessions' => $plannedSessions,
            'completed_sessions' => $completedSessions,
            'linked_sessions' => $linkedSessions,
            'synced_activities' => ExternalActivity::query()
                ->whereBetween('started_at', [$rangeStart, $rangeEnd])
                ->count(),
            'active_athletes' => TrainingSession::query()
                ->whereBetween('scheduled_date', [$rangeStart->toDateString(), $rangeEnd->toDateString()])
                ->distinct('user_id')
                ->count('user_id'),
            'completion_rate' => $plannedSessions > 0
                ? round(($completedSessions / $plannedSessions) * 100, 1)
                : 0.0,
        ];
    }

    /**
     * @return array{
     *     connected_accounts: int,
     *     queued_or_running: int,
     *     success_runs: int,
     *     failed_runs: int,
     *     rate_limited_runs: int,
     *     success_rate: float
     * }
     */
    private function buildSyncHealthData(CarbonImmutable $rangeStart, CarbonImmutable $rangeEnd): array
    {
        $runCounts = ActivityProviderSyncRun::query()
            ->selectRaw('status, COUNT(*) as aggregate')
            ->whereBetween('created_at', [$rangeStart, $rangeEnd])
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $successRuns = (int) ($runCounts[ActivityProviderSyncRun::STATUS_SUCCESS] ?? 0);
        $failedRuns = (int) ($runCounts[ActivityProviderSyncRun::STATUS_FAILED] ?? 0);
        $rateLimitedRuns = (int) ($runCounts[ActivityProviderSyncRun::STATUS_RATE_LIMITED] ?? 0);
        $terminalRuns = $successRuns + $failedRuns + $rateLimitedRuns;

        return [
            'connected_accounts' => ActivityProviderConnection::query()->distinct('user_id')->count('user_id'),
            'queued_or_running' => ActivityProviderConnection::query()
                ->whereIn('last_sync_status', ['queued', 'running'])
                ->count(),
            'success_runs' => $successRuns,
            'failed_runs' => $failedRuns,
            'rate_limited_runs' => $rateLimitedRuns,
            'success_rate' => $terminalRuns > 0
                ? round(($successRuns / $terminalRuns) * 100, 1)
                : 0.0,
        ];
    }

    /**
     * @return array{
     *     suspended_total: int,
     *     suspended_in_range: int,
     *     pending_coach_applications: int,
     *     recent_suspensions: array<int, array{
     *         id: int,
     *         name: string,
     *         email: string,
     *         suspended_at: string|null,
     *         reason: string|null
     *     }>
     * }
     */
    private function buildModerationData(CarbonImmutable $rangeStart, CarbonImmutable $rangeEnd): array
    {
        return [
            'suspended_total' => User::query()->whereNotNull('suspended_at')->count(),
            'suspended_in_range' => User::query()
                ->whereBetween('suspended_at', [$rangeStart, $rangeEnd])
                ->count(),
            'pending_coach_applications' => CoachApplication::query()
                ->where('status', 'pending')
                ->count(),
            'recent_suspensions' => User::query()
                ->whereNotNull('suspended_at')
                ->latest('suspended_at')
                ->limit(5)
                ->get([
                    'id',
                    'name',
                    'email',
                    'suspended_at',
                    'suspension_reason',
                ])
                ->map(fn (User $user): array => [
                    'id' => $user->id,
                    'name' => $user->fullName(),
                    'email' => $user->email,
                    'suspended_at' => $user->suspended_at?->toIso8601String(),
                    'reason' => $user->suspension_reason,
                ])->values()->all(),
        ];
    }

    /**
     * @return array{
     *     queue_backlog: int,
     *     failed_jobs_24h: int,
     *     webhook_events_24h: int,
     *     webhook_failed_24h: int,
     *     mutating_requests_24h: int
     * }
     */
    private function buildSystemOpsData(): array
    {
        $windowStart = CarbonImmutable::now()->subDay();

        return [
            'queue_backlog' => (int) DB::table('jobs')->count(),
            'failed_jobs_24h' => (int) DB::table('failed_jobs')
                ->where('failed_at', '>=', $windowStart)
                ->count(),
            'webhook_events_24h' => ActivityProviderWebhookEvent::query()
                ->where('received_at', '>=', $windowStart)
                ->count(),
            'webhook_failed_24h' => ActivityProviderWebhookEvent::query()
                ->where('received_at', '>=', $windowStart)
                ->where('status', 'failed')
                ->count(),
            'mutating_requests_24h' => ActivityLog::query()
                ->where('log_name', 'http')
                ->where('created_at', '>=', $windowStart)
                ->count(),
        ];
    }
}
