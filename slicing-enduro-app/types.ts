

export type SportType = 'swim' | 'bike' | 'run' | 'gym' | 'rest';

export type SessionStatus = 'planned' | 'completed' | 'skipped' | 'partial';

export type UserRole = 'athlete' | 'coach' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'pending' | 'disabled';
  avatarInitials: string;
  // Specific data pointers
  athleteId?: string; 
  subscriptionTier?: 'free' | 'core' | 'advanced';
}

export interface WorkoutStep {
  id: string;
  type: 'warmup' | 'active' | 'recovery' | 'cooldown';
  durationSeconds: number;
  targetPower?: number; // % of FTP
  targetHarthRate?: number; // % of LTHR
  description?: string;
}

export interface TelemetryPoint {
  time: number; // seconds from start
  power: number;
  hr: number;
  cadence: number;
  altitude?: number;
}

export interface Session {
  id: string;
  date: string; // ISO Date String YYYY-MM-DD
  sport: SportType;
  title: string;
  durationMinutes: number;
  tss: number; // Training Stress Score
  rpe?: number; // Rate of Perceived Exertion 1-10
  status: SessionStatus;
  description?: string;
  // Structured Workout
  structure?: WorkoutStep[];
  // Completed metrics
  actualDuration?: number;
  actualTss?: number;
  distanceKm?: number;
  normalizedPower?: number;
  avgHr?: number;
  telemetry?: TelemetryPoint[]; // Mock data for charts
}

export interface DayData {
  date: Date;
  sessions: Session[];
}

export interface WeekData {
  id: string;
  startDate: Date;
  days: DayData[];
  summary: {
    totalDuration: number;
    totalTss: number;
    plannedTss: number;
    distanceKm: number;
    completedCount: number;
  };
}

// Training Plan Types
export interface PlanWeekStructure {
  day: string; // Mon, Tue...
  focus: string; // "Rest", "VO2 Max", "Long Ride"
  sport: SportType;
  durationMin: number;
}

export interface TrainingPlan {
  id: string;
  title: string;
  sport: SportType | 'triathlon'; // 'triathlon' is a composite sport context
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro';
  durationWeeks: number;
  avgHoursPerWeek: number;
  avgTssPerWeek: number;
  description: string;
  status: 'active' | 'completed' | 'not-started';
  weeklyStructure: PlanWeekStructure[]; // A typical week
  loadProgression: number[]; // Array of weekly TSS targets
  tags: string[]; // e.g. "Base", "Build", "Polarized"
}

// Athlete Types
export interface AthleteProfile {
  age: number;
  heightCm: number;
  weightKg: number;
  trainingSince: string; // ISO Date
}

export interface AthleteContext {
  preferredVolumeHours: number;
  phase: string;
  notes: string;
}

export interface AthleteIntegrations {
  garmin: boolean;
  strava: boolean;
  trainingPeaks: boolean;
}

export interface Athlete {
  id: string;
  name: string;
  email: string;
  primarySport: SportType | 'triathlon';
  status: 'active' | 'injured' | 'paused';
  metrics: {
    avgWeeklyTss: number;
    avgWeeklyHours: number;
  };
  profile: AthleteProfile;
  context: AthleteContext;
  integrations: AthleteIntegrations;
  currentPlanId?: string;
}
