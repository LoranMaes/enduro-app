export type SportType = 'swim' | 'bike' | 'run' | 'gym' | 'rest';

export type SessionStatus = 'planned' | 'completed' | 'skipped' | 'partial';

export type TelemetryPoint = {
    time: number;
    power: number;
    hr: number;
    cadence: number;
};

export type Session = {
    id: string;
    sport: SportType;
    title: string;
    durationMinutes: number;
    tss: number;
    status: SessionStatus;
};

export type WeekData = {
    id: string;
    startDate: Date;
    summary: {
        totalTss: number;
        plannedTss: number;
    };
};
