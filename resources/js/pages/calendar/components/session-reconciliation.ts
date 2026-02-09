import type { TrainingSessionView } from '@/types/training-plans';

const durationVarianceThreshold = 0.1;
const tssVarianceThreshold = 0.15;

export function isSessionCompleted(session: TrainingSessionView): boolean {
    return session.isCompleted || session.status === 'completed';
}

export function isSessionReadyToComplete(session: TrainingSessionView): boolean {
    return session.linkedActivityId !== null && !isSessionCompleted(session);
}

export function isSessionAdjusted(session: TrainingSessionView): boolean {
    if (!isSessionCompleted(session)) {
        return false;
    }

    const hasDurationVariance = exceedsVarianceThreshold(
        session.durationMinutes,
        session.actualDurationMinutes,
        durationVarianceThreshold,
    );
    const hasTssVariance = exceedsVarianceThreshold(
        session.plannedTss,
        session.actualTss,
        tssVarianceThreshold,
    );

    return hasDurationVariance || hasTssVariance;
}

function exceedsVarianceThreshold(
    planned: number | null,
    actual: number | null,
    threshold: number,
): boolean {
    if (planned === null || actual === null || planned <= 0) {
        return false;
    }

    return Math.abs(actual - planned) / planned >= threshold;
}
