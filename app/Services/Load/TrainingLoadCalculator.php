<?php

namespace App\Services\Load;

use App\Enums\TrainingSessionStatus;
use App\Models\TrainingLoadSnapshot;
use App\Models\TrainingSession;
use App\Models\User;
use App\Services\Activities\TrainingSessionActualMetricsResolver;
use Carbon\Carbon;
use Carbon\CarbonImmutable;

class TrainingLoadCalculator
{
    public const ATL_TIME_CONSTANT_DAYS = 7.0;

    public const CTL_TIME_CONSTANT_DAYS = 42.0;

    /**
     * @var array<int, string>
     */
    private const SPORT_BUCKETS = [
        'run',
        'bike',
        'swim',
        'other',
        'combined',
    ];

    public function __construct(
        private readonly TrainingSessionActualMetricsResolver $actualMetricsResolver,
    ) {}

    public function recalculateForUser(User $user, Carbon $from, Carbon $to): void
    {
        $rangeStart = CarbonImmutable::parse($from)->startOfDay();
        $rangeEnd = CarbonImmutable::parse($to)->startOfDay();

        if ($rangeStart->greaterThan($rangeEnd)) {
            return;
        }

        $dailyTss = $this->resolveDailyTss($user, $rangeStart, $rangeEnd);
        $seedValues = $this->seedValues($user, $rangeStart->subDay());
        $upserts = [];
        $cursor = $rangeStart;
        $now = now();

        while ($cursor->lessThanOrEqualTo($rangeEnd)) {
            $dateKey = $cursor->toDateString();

            foreach (self::SPORT_BUCKETS as $sport) {
                $tss = (float) ($dailyTss[$dateKey][$sport] ?? 0.0);
                $previousAtl = $seedValues[$sport]['atl'];
                $previousCtl = $seedValues[$sport]['ctl'];
                $tsb = $previousCtl - $previousAtl;
                $atl = $this->ewma(
                    $previousAtl,
                    $tss,
                    self::ATL_TIME_CONSTANT_DAYS,
                );
                $ctl = $this->ewma(
                    $previousCtl,
                    $tss,
                    self::CTL_TIME_CONSTANT_DAYS,
                );

                $upserts[] = [
                    'user_id' => $user->id,
                    'date' => $dateKey,
                    'sport' => $sport,
                    'tss' => $tss,
                    'atl' => $atl,
                    'ctl' => $ctl,
                    'tsb' => $tsb,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $seedValues[$sport] = [
                    'atl' => $atl,
                    'ctl' => $ctl,
                ];
            }

            $cursor = $cursor->addDay();
        }

        foreach (array_chunk($upserts, 300) as $batch) {
            TrainingLoadSnapshot::query()->upsert(
                $batch,
                ['user_id', 'date', 'sport'],
                ['tss', 'atl', 'ctl', 'tsb', 'updated_at'],
            );
        }
    }

    private function ewma(
        float $previousValue,
        float $dailyTss,
        float $timeConstantDays,
    ): float {
        return $previousValue + (($dailyTss - $previousValue) * (1 / $timeConstantDays));
    }

    /**
     * @return array<string, array<string, float>>
     */
    private function resolveDailyTss(
        User $user,
        CarbonImmutable $from,
        CarbonImmutable $to,
    ): array {
        $sessions = TrainingSession::query()
            ->where('user_id', $user->id)
            ->whereDate('scheduled_date', '>=', $from->toDateString())
            ->whereDate('scheduled_date', '<=', $to->toDateString())
            ->with([
                'activity:id,training_session_id,athlete_id,provider,raw_payload,duration_seconds',
            ])
            ->orderBy('scheduled_date')
            ->orderBy('id')
            ->get([
                'id',
                'scheduled_date',
                'sport',
                'status',
                'planned_tss',
                'actual_tss',
                'completed_at',
            ]);

        $dailyTotals = [];

        foreach ($sessions as $session) {
            if ($session->scheduled_date === null) {
                continue;
            }

            $dateKey = $session->scheduled_date->toDateString();
            $tss = $this->resolveSessionTss($session, $user);

            if ($tss <= 0) {
                continue;
            }

            if (! array_key_exists($dateKey, $dailyTotals)) {
                $dailyTotals[$dateKey] = [];
            }

            $sport = $this->sportBucket($session->sport);

            $dailyTotals[$dateKey][$sport] = ($dailyTotals[$dateKey][$sport] ?? 0.0) + $tss;
            $dailyTotals[$dateKey]['combined'] = ($dailyTotals[$dateKey]['combined'] ?? 0.0) + $tss;
        }

        return $dailyTotals;
    }

    private function resolveSessionTss(TrainingSession $session, User $user): float
    {
        $isCompleted = $session->completed_at !== null
            || (
                $session->status instanceof TrainingSessionStatus
                && $session->status === TrainingSessionStatus::Completed
            )
            || $session->status === TrainingSessionStatus::Completed->value;

        if ($isCompleted) {
            $actualTss = (float) (
                $this->actualMetricsResolver->resolveActualTss($session, $user)
                ?? 0
            );

            if ($actualTss > 0) {
                return $actualTss;
            }

            return 0.0;
        }

        $plannedTss = (float) ($session->planned_tss ?? 0);

        if ($plannedTss > 0) {
            return $plannedTss;
        }

        return 0.0;
    }

    private function sportBucket(?string $sport): string
    {
        $normalizedSport = strtolower(trim((string) $sport));

        if ($normalizedSport === '') {
            return 'other';
        }

        return match ($normalizedSport) {
            'run' => 'run',
            'bike', 'ride', 'cycling', 'virtualride', 'ebikeride', 'mtn_bike', 'mountainbike' => 'bike',
            'swim' => 'swim',
            default => 'other',
        };
    }

    /**
     * @return array<string, array{atl: float, ctl: float}>
     */
    private function seedValues(User $user, CarbonImmutable $seedDate): array
    {
        $previousSnapshots = TrainingLoadSnapshot::query()
            ->where('user_id', $user->id)
            ->whereDate('date', $seedDate->toDateString())
            ->whereIn('sport', self::SPORT_BUCKETS)
            ->get([
                'sport',
                'atl',
                'ctl',
            ])
            ->keyBy('sport');
        $seedValues = [];

        foreach (self::SPORT_BUCKETS as $sport) {
            /** @var TrainingLoadSnapshot|null $snapshot */
            $snapshot = $previousSnapshots->get($sport);

            $seedValues[$sport] = [
                'atl' => (float) ($snapshot?->atl ?? 0.0),
                'ctl' => (float) ($snapshot?->ctl ?? 0.0),
            ];
        }

        return $seedValues;
    }
}
