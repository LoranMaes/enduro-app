# Endure — Component Inventory

All UI components required to support the Endure training platform.
Design reference: Google AI Studio prototype + /slicing/screenshots

---

## Core Layout

| Component  | Status   | Notes                         |
| ---------- | -------- | ----------------------------- |
| AppShell   | Complete | Sidebar + main content        |
| Sidebar    | Complete | Athlete / Coach / Admin aware |
| PageHeader | Complete | Sticky, context-aware         |
| Panel      | Complete | Primary container primitive   |

---

## Calendar (Core)

| Component        | Status   | Notes                      |
| ---------------- | -------- | -------------------------- |
| TrainingCalendar | Complete | Infinite vertical scroll   |
| WeekSection      | Complete | Week header + grid         |
| DayCell          | Complete | Click-to-create            |
| SessionCard      | Complete | Planned vs completed       |
| WeekSummary      | Complete | Load, duration, compliance |

---

## Session Creation & Editing

| Component            | Status   | Notes                     |
| -------------------- | -------- | ------------------------- |
| TrainingSessionModal | Complete | Planned session creation  |
| WorkoutBuilder       | Partial  | V1 interval visualization |
| IntensitySelector    | Complete | RPE / zone-based          |
| SportSelector        | Complete | Swim/Bike/Run/Gym         |

---

## Analysis

| Component           | Status   | Notes                   |
| ------------------- | -------- | ----------------------- |
| SessionAnalysisView | Complete | Core analysis screen    |
| PerformanceChart    | Complete | SVG / lightweight       |
| MetricCard          | Complete | Standard metric display |
| SessionNotes        | Complete | RPE + notes             |
| IntervalTable       | Planned  | V1.2                    |

---

## Progress & Trends

| Component          | Status   | Notes                  |
| ------------------ | -------- | ---------------------- |
| ProgressView       | Complete | Long-term load         |
| LoadTrendChart     | Complete | Target tunnel + actual |
| WeeklyListItem     | Complete | Click-through to week  |
| ConsistencySummary | Complete | Compliance logic       |

---

## Admin / Coach

| Component           | Status  | Notes      |
| ------------------- | ------- | ---------- |
| AthletesView        | Planned | Coach-only |
| CoachApprovalQueue  | Planned | Admin      |
| ImpersonationBanner | Planned | Admin      |
| TrainingPlanLibrary | Planned | Coach      |

---

## Settings

| Component            | Status  | Notes   |
| -------------------- | ------- | ------- |
| ProfileSettings      | Planned | Athlete |
| SyncSettings         | Planned | Garmin  |
| SubscriptionSettings | Planned | Paywall |
| NotificationSettings | Planned | V1.1    |

---

## Design Rules

- No component may invent new colors outside the Design System
- All metrics use `DataValue`
- All labels use `Label`
- No component owns business logic
