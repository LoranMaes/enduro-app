# Navigation Rules — Endure

Navigation in Endure is designed for clarity, predictability, and daily use.
It must remain calm and authoritative at all times.

---

## Sidebar Authority

- The sidebar is the primary navigation mechanism
- It defines the current application context
- Navigation should never feel ambiguous

---

## Active State Rules (Critical)

- Only ONE sidebar item may be active at any time
- Parent sections must NOT remain active when a child view is active
- Active state reflects the CURRENT VIEW, not the broader section

Incorrect:
- Highlighting both “Admin” and “Users” simultaneously

Correct:
- “Admin” active on Admin dashboard
- “Users” active on Users list
- Never both

---

## Context Communication

Hierarchy must be communicated using:
- Page headers
- Section titles
- Layout structure

Avoid:
- Nested sidebar indicators
- Breadcrumb overload
- Visual clutter

---

## Role-Aware Navigation

Sidebar contents adapt to role:

### Athlete
- Calendar
- Analysis
- Progress
- Plans
- Settings

### Coach
- Athletes
- Plans
- Calendar (per athlete)
- Settings

### Admin
- Admin Dashboard
- Users
- (Other platform views)

Navigation must never expose inaccessible views.

---

## Interaction Principles

- No hidden navigation states
- No surprise context switches
- Navigation must feel stable under fatigue

If a user hesitates to understand “where they are”, navigation has failed.