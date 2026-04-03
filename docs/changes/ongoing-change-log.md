# Ongoing Change Log

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
