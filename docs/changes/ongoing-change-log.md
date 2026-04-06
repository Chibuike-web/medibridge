# Ongoing Change Log

## 2026-04-06

### Dashboard Preview Mode Promotion

#### What we changed

- Removed the `preview` search-param gate from the dashboard overview, transfers, and patient-records routes.
- Made the populated dashboard/table experiences the default render path so those pages open directly in their main state.
- Kept the current preview-backed overview stats as the active source for the overview screen while the visual work continues.
- Restored the original empty-state layouts and now decide between empty and populated states from the existing static dashboard data.

#### Files changed

- `src/app/dashboard/overview/page.tsx`
- `src/app/dashboard/transfers/page.tsx`
- `src/app/dashboard/patients-records/page.tsx`
- `docs/changes/ongoing-change-log.md`

## 2026-04-03

### Dashboard Transfers Sidebar Icon

#### What we changed

- Added the `RiContractLeftLine` icon to the top row of the dashboard sidebar.
- Kept the change visual-only and did not add any interaction or collapse logic.

#### Files changed

- `src/components/layout/sidebar.tsx`
- `docs/changes/ongoing-change-log.md`

### User Profile Collapse Spacing

#### What we changed

- Matched the collapsed user-profile trigger padding and width behavior to the expanded state to remove the visual jump during sidebar collapse.

#### Files changed

- `src/components/layout/user-profile.tsx`
- `docs/changes/ongoing-change-log.md`

### Sidebar Collapse Rendering

#### What we changed

- Reworked the sidebar collapse state so header, search, and navigation rows stay mounted while their text labels collapse away.
- Standardized the sidebar icon sizing so the collapse toggle and menu icons remain visually consistent during resize.
- Restored the collapsed-header hover behavior so the compact mark swaps to the toggle control on hover.

#### Files changed

- `src/components/layout/sidebar.tsx`
- `docs/changes/ongoing-change-log.md`

### User Profile Hidden Collapsed Content

#### What we changed

- Kept the user-profile trigger mounted in both states and hid the extra profile text and chevron while collapsed.
- Replaced conditional template-string class composition with `cn(...)` in the user-profile trigger.
- Grouped the expanded-only profile details and chevron together and unmounted them when collapsed.

#### Files changed

- `src/components/layout/user-profile.tsx`
- `docs/changes/ongoing-change-log.md`
