
## Project preferences

- Bias toward brainstorming before making changes, especially for UI/product decisions. Keep the user in the loop by discussing the intended direction, tradeoffs, and what has already changed before continuing with implementation.
- When discussing, planning, or reviewing UI, use ASCII art frequently to visually explain the proposed interface, including wireframes, layouts, component placement, states, and interaction flows.
- Before implementing a feature, first check whether the same or a closely related feature already exists elsewhere in the codebase. When it does, follow the established sibling pattern for structure, naming, state flow, helper boundaries, and UI behavior so related files stay consistent and easy to read. Only diverge when the new feature has a real requirement the existing pattern cannot cover, and keep that difference explicit.
- Prefer straightforward repetition when an abstraction would add complexity or make related files harder to read. Before introducing a new shared abstraction for repeated feature code, ask the user for permission.
- For spacing, sizing, and other style values, default to rem-based values or Tailwind scale utilities instead of raw pixel values unless exact pixels are required by an external asset or spec.
- Use explicit names for values returned from React hooks. This applies to destructured hook results from hooks such as `useState`, `useTransition`, `useOptimistic`, `useReducer`, and `useActionState`. Prefer names that explain the UI state or action without needing surrounding context, even if they are longer, for example `enteredVerificationCode`, `isRequestingNewAccessCode`, `startRequestNewAccessCodeTransition`, and `optimisticSelectedSharedRecordSection`. Concise names are acceptable when the component scope already provides the feature context and there is only one matching workflow in the file, for example `optimisticPage`, `optimisticLimit`, `isPending`, and `startTransition` inside a single table client component. Do not make hook result names verbose just to repeat the component name. Do not alias imported React APIs just for naming. State updater callback parameters should stay concise as `prev` when the surrounding setter name already makes the state clear; do not use explicit callback parameter names like `previousAttachments`, `currentActiveFilter`, or `prevSelectedRows`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
