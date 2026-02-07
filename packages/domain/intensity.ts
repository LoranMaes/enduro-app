export type Intensity = 'easy' | 'steady' | 'tempo' | 'threshold' | 'vo2';

export const INTENSITY_LABELS: Record<Intensity, string> = {
    easy: 'Easy',
    steady: 'Steady',
    tempo: 'Tempo',
    threshold: 'Threshold',
    vo2: 'VO₂ Max',
};
