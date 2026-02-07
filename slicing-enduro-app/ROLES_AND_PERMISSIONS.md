# Roles & Responsibilities — Endure

Endure is a role-based endurance training platform.
Roles are strict and must never overlap in responsibility.

This file defines **what each role is allowed to see and do** at a UI level.
Backend enforcement is out of scope for now, but UI must respect these boundaries.

---

## Roles Overview

Endure supports three distinct roles:

- Athlete
- Coach
- Admin (Endure platform)

Design and navigation must always reflect the **active role** clearly.

---

## Athlete

**Purpose**
The athlete is the training subject.
They execute training and review their own data.

**Capabilities**
- View and interact with:
  - Training calendar
  - Training sessions
  - Weekly summaries
  - Progress over time
  - Training plans (assigned or personal)
- Sync activities from Garmin
- Analyze completed sessions

**Restrictions**
- Cannot manage other users
- Cannot create or sell training plans
- Cannot access admin or coach dashboards

---

## Coach

**Purpose**
The coach manages athletes and training structure.

**Capabilities**
- View and manage multiple athletes
- Switch athlete context
- Create training plans
- Assign plans to athletes
- Review athlete progress and compliance

**Restrictions**
- Cannot manage platform users
- Cannot approve other coaches
- Cannot access platform-level metrics

---

## Admin (Endure Platform)

**Purpose**
The admin governs the platform itself.

**Capabilities**
- View all registered users
- Approve or deny coach accounts
- View subscription status
- Impersonate athlete or coach views
- Access platform-level dashboards

**Restrictions**
- Does not train
- Does not coach
- Does not own athlete data

Admin access is operational, not participatory.

---

## Impersonation Rules

- Admins may impersonate athletes or coaches
- Impersonation is:
  - Clearly indicated in the UI
  - Read-only by default
  - Reversible at any time
- Impersonation must never feel ambiguous

---

## UI Enforcement Rules (Critical)

- UI must never mix role responsibilities
- Sidebar navigation adapts per active role
- Only relevant views are visible per role
- Role context must be obvious without explanation

If a view feels unclear about **who it is for**, the design is incorrect.