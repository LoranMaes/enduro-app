import { validationFields } from './constants';
import type {
    SessionWritePayload,
    SubmitPayloadInput,
    ValidationErrors,
    WorkoutStructure,
    WorkoutStructureMode,
    WorkoutStructureStep,
    WorkoutStructureUnit,
} from './types';

export function buildPayload(data: SubmitPayloadInput): SessionWritePayload {
    const parsedDurationMinutes = Number.parseInt(data.plannedDurationMinutes, 10);
    const parsedPlannedTss = Number.parseInt(data.plannedTss, 10);
    const normalizedTitle = data.title.trim();
    const normalizedNotes = data.notes.trim();

    return {
        training_week_id: data.trainingWeekId,
        date: data.date,
        sport: data.sport,
        title: normalizedTitle === '' ? null : normalizedTitle,
        planned_duration_minutes:
            data.plannedStructure !== null
                ? Math.max(1, Math.round(data.derivedStructureDurationMinutes))
                : Number.isFinite(parsedDurationMinutes)
                  ? parsedDurationMinutes
                  : 0,
        planned_tss:
            data.plannedStructure !== null
                ? data.derivedStructureTss
                : data.plannedTss.trim() === ''
                  ? null
                  : Number.isFinite(parsedPlannedTss)
                    ? parsedPlannedTss
                    : null,
        notes: normalizedNotes === '' ? null : normalizedNotes,
        planned_structure: normalizePlannedStructureForRequest(data.plannedStructure),
    };
}

function normalizePlannedStructureForRequest(
    plannedStructure: WorkoutStructure | null,
): SessionWritePayload['planned_structure'] {
    if (
        plannedStructure === null ||
        !Array.isArray(plannedStructure.steps) ||
        plannedStructure.steps.length === 0
    ) {
        return null;
    }

    return {
        unit: plannedStructure.unit,
        mode: plannedStructure.mode,
        steps: plannedStructure.steps.map((step) => {
            const normalizedNote = step.note.trim();

            return {
                id: step.id,
                type: step.type,
                duration_minutes: Math.max(1, Math.round(step.durationMinutes)),
                duration_seconds: Math.max(60, Math.round(step.durationSeconds)),
                duration_type: step.durationType,
                distance_meters:
                    step.durationType === 'distance'
                        ? Math.max(1, Math.round(step.distanceMeters ?? 1000))
                        : null,
                target:
                    step.target === null || Number.isNaN(step.target)
                        ? null
                        : step.target,
                range_min:
                    step.rangeMin === null || Number.isNaN(step.rangeMin)
                        ? null
                        : step.rangeMin,
                range_max:
                    step.rangeMax === null || Number.isNaN(step.rangeMax)
                        ? null
                        : step.rangeMax,
                zone_label: step.zoneLabel ?? null,
                repeat_count: Math.max(1, Math.round(step.repeatCount)),
                note: normalizedNote === '' ? null : normalizedNote,
                items:
                    step.items?.map((item) => {
                        return {
                            id: item.id,
                            label: item.label,
                            duration_minutes: Math.max(
                                1,
                                Math.round(item.durationMinutes),
                            ),
                            duration_seconds: Math.max(
                                60,
                                Math.round(item.durationSeconds),
                            ),
                            duration_type: item.durationType,
                            distance_meters:
                                item.durationType === 'distance'
                                    ? Math.max(
                                          1,
                                          Math.round(item.distanceMeters ?? 1000),
                                      )
                                    : null,
                            target:
                                item.target === null || Number.isNaN(item.target)
                                    ? null
                                    : item.target,
                            range_min:
                                item.rangeMin === null || Number.isNaN(item.rangeMin)
                                    ? null
                                    : item.rangeMin,
                            range_max:
                                item.rangeMax === null || Number.isNaN(item.rangeMax)
                                    ? null
                                    : item.rangeMax,
                            zone_label: item.zoneLabel ?? null,
                        };
                    }) ?? null,
            };
        }),
    };
}

export function extractValidationErrors(payload: unknown): ValidationErrors | null {
    if (
        typeof payload !== 'object' ||
        payload === null ||
        !('errors' in payload) ||
        typeof payload.errors !== 'object' ||
        payload.errors === null
    ) {
        return null;
    }

    const errors = payload.errors as Record<string, unknown>;
    const extracted: ValidationErrors = {};

    validationFields.forEach((field) => {
        const value = errors[field];

        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
            extracted[field] = value[0];
        }
    });

    const plannedStructureError = Object.entries(errors).find(([key, value]) => {
        return (
            key.startsWith('planned_structure') &&
            Array.isArray(value) &&
            value.length > 0 &&
            typeof value[0] === 'string'
        );
    });

    if (plannedStructureError !== undefined) {
        extracted.planned_structure = (plannedStructureError[1] as Array<string>)[0];
    }

    return extracted;
}

export function extractMessage(payload: unknown): string | null {
    if (
        typeof payload === 'object' &&
        payload !== null &&
        'message' in payload &&
        typeof payload.message === 'string'
    ) {
        return payload.message;
    }

    return null;
}

export function mapSessionFromApi(
    session: import('@/types/training-plans').TrainingSessionApi,
): import('@/types/training-plans').TrainingSessionView {
    return {
        id: session.id,
        trainingWeekId: session.training_week_id ?? null,
        scheduledDate: session.scheduled_date,
        sport: session.sport,
        title: session.title ?? null,
        status: session.status,
        planningSource: session.planning_source ?? 'planned',
        completionSource: session.completion_source ?? null,
        isCompleted: session.is_completed ?? session.status === 'completed',
        completedAt: session.completed_at ?? null,
        autoCompletedAt: session.auto_completed_at ?? null,
        durationMinutes: session.duration_minutes,
        actualDurationMinutes: session.actual_duration_minutes ?? null,
        plannedTss: session.planned_tss,
        actualTss: session.actual_tss,
        notes: session.notes,
        plannedStructure:
            session.planned_structure !== undefined &&
            session.planned_structure !== null
                ? {
                      unit: session.planned_structure.unit as WorkoutStructureUnit,
                      mode: session.planned_structure.mode as WorkoutStructureMode,
                      steps: session.planned_structure.steps.map((step) => ({
                          id: step.id ?? `step-${session.id}-${step.type}`,
                          type: step.type as WorkoutStructureStep['type'],
                          durationSeconds: Math.max(
                              60,
                              Math.round(
                                  step.duration_seconds ??
                                      step.duration_minutes * 60,
                              ),
                          ),
                          durationMinutes: Math.max(
                              1,
                              Math.round(
                                  (
                                      step.duration_seconds ??
                                      step.duration_minutes * 60
                                  ) / 60,
                              ),
                          ),
                          durationType:
                              step.duration_type === 'distance'
                                  ? 'distance'
                                  : 'time',
                          distanceMeters:
                              step.duration_type === 'distance'
                                  ? Math.max(
                                        1,
                                        Math.round(step.distance_meters ?? 1000),
                                    )
                                  : null,
                          target: step.target ?? null,
                          rangeMin: step.range_min ?? null,
                          rangeMax: step.range_max ?? null,
                          zoneLabel: step.zone_label ?? null,
                          repeatCount: step.repeat_count ?? 1,
                          note: step.note ?? '',
                          items:
                              step.items?.map((item, itemIndex) => ({
                                  id:
                                      item.id ??
                                      `item-${session.id}-${step.type}-${itemIndex}`,
                                  label: item.label ?? `Step ${itemIndex + 1}`,
                                  durationSeconds: Math.max(
                                      60,
                                      Math.round(
                                          item.duration_seconds ??
                                              item.duration_minutes * 60,
                                      ),
                                  ),
                                  durationMinutes: Math.max(
                                      1,
                                      Math.round(
                                          (
                                              item.duration_seconds ??
                                              item.duration_minutes * 60
                                          ) / 60,
                                      ),
                                  ),
                                  durationType:
                                      item.duration_type === 'distance'
                                          ? 'distance'
                                          : 'time',
                                  distanceMeters:
                                      item.duration_type === 'distance'
                                          ? Math.max(
                                                1,
                                                Math.round(
                                                    item.distance_meters ?? 1000,
                                                ),
                                            )
                                          : null,
                                  target: item.target ?? null,
                                  rangeMin: item.range_min ?? null,
                                  rangeMax: item.range_max ?? null,
                                  zoneLabel: item.zone_label ?? null,
                              })) ?? null,
                      })),
                  }
                : null,
        linkedActivityId: session.linked_activity_id ?? null,
        linkedActivitySummary:
            session.linked_activity_summary !== undefined &&
            session.linked_activity_summary !== null
                ? {
                      id: session.linked_activity_summary.id,
                      provider: session.linked_activity_summary.provider,
                      startedAt: session.linked_activity_summary.started_at ?? null,
                      durationSeconds:
                          session.linked_activity_summary.duration_seconds ?? null,
                      sport: session.linked_activity_summary.sport ?? null,
                  }
                : null,
        suggestedActivities:
            session.suggested_activities?.map((activity) => ({
                id: activity.id,
                provider: activity.provider,
                sport: activity.sport ?? null,
                startedAt: activity.started_at ?? null,
                durationSeconds: activity.duration_seconds ?? null,
            })) ?? [],
    };
}
