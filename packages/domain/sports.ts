export const SPORTS = ['swim', 'bike', 'run', 'gym'] as const;
export type Sport = (typeof SPORTS)[number];

export const SPORT_LABELS: Record<Sport, string> = {
    swim: 'Swim',
    bike: 'Bike',
    run: 'Run',
    gym: 'Strength',
};
