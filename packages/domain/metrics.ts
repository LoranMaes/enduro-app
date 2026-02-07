export interface CoreMetrics {
    durationMinutes: number;
    tss: number;
    distanceKm?: number;
}

export interface PerformanceMetrics {
    power?: number;
    heartRate?: number;
    cadence?: number;
    speed?: number;
}
