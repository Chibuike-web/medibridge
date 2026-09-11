
## Project preferences

- Bias toward brainstorming before making changes, especially for UI/product decisions. Keep the user in the loop by discussing the intended direction, tradeoffs, and what has already changed before continuing with implementation.
- When discussing, planning, or reviewing UI, use ASCII art frequently to visually explain the proposed interface, including wireframes, layouts, component placement, states, and interaction flows.
- Before implementing a feature, first check whether the same or a closely related feature already exists elsewhere in the codebase. When it does, follow the established sibling pattern for structure, naming, state flow, helper boundaries, and UI behavior so related files stay consistent and easy to read. Only diverge when the new feature has a real requirement the existing pattern cannot cover, and keep that difference explicit.
- Prefer straightforward repetition when an abstraction would add complexity or make related files harder to read. Before introducing a new shared abstraction for repeated feature code, ask the user for permission.
- For spacing, sizing, and other style values, default to rem-based values or Tailwind scale utilities instead of raw pixel values unless exact pixels are required by an external asset or spec.
- Use explicit names for values returned from React hooks. This applies to destructured hook results from hooks such as `useState`, `useTransition`, `useOptimistic`, `useReducer`, and `useActionState`. Prefer names that explain the UI state or action without needing surrounding context, even if they are longer, for example `enteredVerificationCode`, `isRequestingNewAccessCode`, `startRequestNewAccessCodeTransition`, and `optimisticSelectedSharedRecordSection`. Concise names are acceptable when the component scope already provides the feature context and there is only one matching workflow in the file, for example `optimisticPage`, `optimisticLimit`, `isPending`, and `startTransition` inside a single table client component. Do not make hook result names verbose just to repeat the component name. Do not alias imported React APIs just for naming. State updater callback parameters should stay concise as `prev` when the surrounding setter name already makes the state clear; do not use explicit callback parameter names like `previousAttachments`, `currentActiveFilter`, or `prevSelectedRows`.

## Testing principles

- Write tests around the intent and user-visible contract of the feature, not around the current implementation. A test should remain useful if the component is refactored, state is renamed, markup is rearranged, or the database query is rewritten.
- Start each test by identifying the behavior it protects: who can perform the action, what input or event triggers it, what the user sees, what result is returned, and what must not happen. Name the test after that behavior.
- Prefer black-box assertions against rendered roles, accessible names, visible text, form values, focus, navigation outcomes, response status, response payloads, and persisted results. Avoid asserting private state, exact class lists, hook calls, render counts, internal query-builder calls, or the number and order of implementation steps unless that detail is itself the contract.
- A negative assertion is meaningful only when the required subject is first proven to exist. For example, assert that a protected member card is visible before asserting that its management controls are absent. Do not let a missing component make a permission test pass.
- Test both sides of important behavior. A test that proves an action is not called is incomplete without a valid-case test proving the same action works with valid input. Exercise allowed and denied roles, present and missing data, success and failure responses, and expanded and collapsed states where those are part of the feature.
- Test associations, not just messages. For forms, connect each validation message to its own field through the accessible description or invalid state. For lists, scope assertions to the relevant card or row so one item cannot satisfy another item's expectation.
- Use the least mocking needed to isolate the boundary under test. Keep real component composition, routing behavior, response construction, and validation logic when those are part of the intended behavior. Mock external systems such as a database, network service, clock, or authentication provider only when the test needs deterministic control of that boundary.
- Treat accessibility as behavior: use role and accessible-name queries, verify keyboard focus and keyboard actions, preserve label-in-name, and test disabled or unavailable actions through what a user can observe. Do not encode incidental DOM structure when an accessible interaction expresses the requirement.
- When a stronger intent-based test exposes a product bug, fix the product behavior or record the gap. Do not weaken the assertion to match the existing code, and do not replace a behavior assertion with an implementation assertion just to make the test pass.
- Keep test data representative and explicit about the scenario. Avoid fixtures that accidentally omit the subject under test, and do not hard-code incidental row counts or generated IDs when the behavior can be expressed through the data that was supplied.
- Before considering a test complete, verify that it would fail if the intended behavior were removed. Prefer a small number of meaningful tests over broad assertions that only confirm the component rendered.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
