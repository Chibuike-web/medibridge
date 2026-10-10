# Auth

Last updated 2026-10-07. This is the single record for MediBridge auth: what is still open, the decisions made so far, and what has been fixed. It replaces `auth-bug.md`, the earlier `auth.md` and `auth.hole.md`. Old finding numbers are kept so commits and past notes still make sense (see [ID key](#id-key)).

## Status

- Auth is ready to leave for onboarding. The 2026-10-07 reviews found no way to take over an account or to read another hospital's patients.
- The 2026-10-07 fix pass (P1–P16), the sign-up wording revert, the P1 revert and the follow-up fixes were committed in d60a040 and pushed to `main` on 2026-10-07.
- Four questions need a decision (Q3–Q6). None of them blocks onboarding. Q1 and Q2 were settled on 2026-10-07 (see Decisions).

## Open questions

- **Q3. What may admins do?** The app's rule is that admins manage members only, but Better Auth's defaults let admins promote members to admin, remove other admins, cancel the owner's invitations and rename the hospital. Asked on 2026-10-05, not answered. See L6.
- **Q4. How is a hospital rejected?** Only approval exists. Not decided: rejecting with a reason, a pending/approved/rejected status instead of the `isVerified` boolean, and registry checks (NHFR, CAC).
- **Q5. How much should hospital staff control patient consent?** Staff can set the patient email that receives the approval link, transfers can go to any email address, and nothing revokes a grant once given. External recipients may be intentional (H10).
- **Q6. Is a one-hour verification link long enough?** It is Better Auth's default, and hospital staff may not open the email within the hour.

## What's left

### Before switching to onboarding

1. **Migration 0024 (H1).** Since 2026-10-07, `bun db:migrate` runs `drizzle-kit migrate` instead of `generate` and `push` (`package.json:19`). A database built with `push` has no migration history, so `migrate` tries to re-run 0000, fails with "already exists" and rolls everything back. Nothing breaks, but 0024 isn't applied. To apply it:
   1. Back up the database (`pg_dump`).
   2. Check for accounts in more than one hospital: `SELECT user_id, count(*) FROM member GROUP BY user_id HAVING count(*) > 1;`. If any exist, 0024 fails and rolls back without deleting anything. Resolve them first.
   3. If a constraint named `member_user_id_unique` already exists (an earlier `push` may have added it), treat 0024 as applied too.
   4. Record 0000–0023 as applied in `drizzle.__drizzle_migrations`: one row each, with the SHA-256 of the SQL file as `hash` and the journal's `when` as `created_at`. This skips the hand-written data backfills in 0015, 0018 and 0021, which `push` never ran, so check those by hand.
   5. Run `bun db:migrate`, which then applies only 0024.
   - Don't use `bun db:push` on a database managed by `migrate`.
   - Once 0024 is applied everywhere, no account can have two hospitals, so the sign-in hospital selector (P6, `sign-in-client.tsx:106`) can't trigger and can be removed.

### During onboarding

These sit on the onboarding path.

- **O1. Unapproved hospitals see the dashboard shell (H11, rest of #2).** No data leaks, because `getOrganizationId()` returns null, but the pages render. Following the 2026-09-25 decision, each dashboard page should call `redirect("/verify")` when `getOrganizationId()` returns null; the layout stays unchecked. Server actions currently return a failure result instead of redirecting.
- **O2. Hospital save outcomes.**
  - If `setActiveOrganization` fails after a successful save, the owner is told the save failed, and a retry then says "already submitted" (`create-hospital-service.ts:114`).
  - If the rollback delete itself throws, an empty organization is left behind and only logged.
  - An address made of spaces passes validation (`hospital-details-schema.ts:5` has `min(1)` without `.trim()`).
- **O3. Verify screen (rest of #12).** The header badge is hard-coded "In progress" (`verify-client.tsx:152`), and there is no Continue action, so the page only moves on at the next 60-second poll or when the tab regains focus.
- **O5. Smaller gaps.**
  - Hospital selector: an expired session fails at `organization.setActive` (`sign-in-client.tsx:120`) before reaching the expired-session branch (`:131`), so the selector stays up with "Unable to select your hospital".
  - An invite form that was already open when the account got created elsewhere shows "Unable to create your account. Please try again." with no sign-in link (`accept-invite-client.tsx:80-82`). Rare.
  - `/email-verified?error=unverified` says "contact support" and offers no resend (`email-verified-client.tsx:25-43`).
  - Signing in from an invitation link returns before `organization.list` and `setActive` (`sign-in-client.tsx:74`). Someone who already belongs to a hospital and still has a second pending invitation lands on `/accept-invite` with no active hospital. Accepting fails with "already belongs to a hospital", and the dashboard treats them as unapproved until they sign in again without the link. Rare.
  - Accreditation upload (`src/app/api/verification-file-upload/route.ts`). Since 2026-10-07 the new file is written to a temporary file and moved into place before old files are deleted, so a failed write keeps the old document. Still open:
    - If deleting an old file fails, the route returns a 500 although the new document is already stored, and both files stay.
    - When several documents exist, the hospital save links whichever `readdir()` lists first (`create-hospital-service.ts:70`), which is effectively random. Pick the newest, or record the stored name at upload time.
    - Submitting the hospital isn't serialized with a replacement upload. A slow upload can delete the document a just-submitted hospital points to. Choosing file A, removing it, then choosing B can keep A on the server while the screen shows B, because the client never aborts the first request.
    - On Windows, `rename` right after the write can fail while antivirus scans the file. There is no retry; the old document is kept.
    - The type check uses the extension only, the whole body is read into memory, any verified account can upload, and a crash leaves `.tmp` files in `hospital-uploads/`.

### Before launch

- **L1. Migration snapshots (H1).** Snapshots are missing for 0015–0018, 0021, 0023 and 0024, so the next `bun db:generate` compares against 0022 and re-emits changes that are already applied; under `migrate` those fail and block every later migration. Before the next schema change, run `db:generate` once, keep its snapshot as `0024_snapshot.json`, and delete the SQL file and journal entry it generated.
- **L2. Email sending domain (A4).** Deliberately deferred (2026-10-05). Until a domain is verified in Resend, mail from `onboarding@resend.dev` reaches only the Resend account's own inbox.
- **L3. Rate limits (H8, rest of A1).**
  - Counts live in process memory, so each server instance counts separately and a restart resets them. Use `rateLimit.storage: "database"` (needs Better Auth's rate-limit table) or secondary storage.
  - Set `advanced.ipAddress.ipAddressHeaders` or `advanced.ipAddress.trustedProxies` for the hosting proxy. Otherwise a forged `X-Forwarded-For` can dodge the limits, or put everyone in one shared bucket.
  - Limit the app actions that send email or cost money: invitation resend (`inviteAdminAction`), transfer request emails, shared-record code requests and `/api/extract-file`.
- **L4. Hospital deletion (H5).** Any owner session can call `POST /api/auth/organization/delete`, which cascades to every patient record. Set `disableOrganizationDeletion: true` in the organization plugin.
- **L5. Hospital identity (H4).** Owners and admins can change the hospital's name, slug, logo and metadata through `/organization/update` without re-approval. The new name appears on transfer approvals and shared records. Add a `beforeUpdateOrganization` hook.
- **L6. Admin permissions (H7).** Once Q3 is answered, use custom roles or the `beforeUpdateMemberRole`, `beforeRemoveMember` and `beforeCancelInvitation` hooks.
- **L7. Patient data left in the browser.** Extracted patients (`src/features/patients/store/use-extracted-patient-store.ts`) and the transfer stores (selected patients, transfer data, attached clinical records in `src/features/transfers/stores/`) persist in `localStorage` and are not cleared on sign-out. The next person on a shared computer, even from another hospital, sees them on the review screen. Clear these stores on sign-out.
- **L8. Shared-record codes (H9).** Code requests aren't locked, so several requests at once each send an email. Each code allows five guesses, but there is no limit across codes for one link: about five guesses every 10 minutes for the link's 7 days.
- **L9. Patient uploads (rest of P13).** Since 2026-10-07 files are stored under generated names, so same-name files no longer overwrite each other, and the whole batch is checked before anything is written. Still open: type checks use the extension only and size is checked per file, with no total-size or file-count cap. The whole body is read into memory. Extraction accepts any number of file names, duplicates included. A failed write leaves earlier files from the batch behind. Extraction results include the absolute server path. Staged files are never deleted after the patients are saved. An empty file gets the misleading message "No file". A session-store outage returns 401 rather than the fixed 500, because `getSessionData()` swallows errors.
- **L10. Build and config.**
  - Never run the seed scripts against production: seeded owners use the password `12345678`.
  - Remove the unused `admin()` plugin.
  - Use `import "server-only"` in `src/services/**` instead of `"use server"`, so helpers such as `getInvitationPreviewService` aren't callable endpoints.
  - Cap the table actions' `limit`.
- **L11. Smaller.**
  - The owner and sign-in forms show Better Auth's own error text (`owner-client.tsx:69`, `sign-in-client.tsx:71`).
  - `getOrganizationAccessService` and `/api/verify` return failures without `error` text, unlike the AGENTS.md result shape.

### Other areas

- **X1. Patient IDs (H2).** The patient number a hospital enters becomes the global primary key (`src/db/schemas/patient/patient.ts:5`), so two hospitals can't both have `P-0001`. Since 2026-10-07 the save names the patient whose ID is repeated in the upload or already in use, and other failures show fixed text instead of the raw database error. Because the key is global, that message, like any failed save, also tells a user that another hospital uses the ID. Belongs to the patient save flow.
- **X2. Patient consent (H10).** See Q5. Belongs to transfers.
- **X3. Unfinished settings.** The session list is static and its Log out buttons do nothing. The delete-account and transfer-ownership callbacks aren't connected. Confirming invitations sends nothing, and the hospital name is hard-coded ("Medicare General Hospital"). The role select saves nothing (UI only, decided 2026-10-02).
- **X4. Error handling.** Failed SWR fetches show nothing in eight components, and the 13-file try/catch plan from 2026-10-05 is still unanswered.
- **X5. Extraction retry drops earlier patients.** Retrying failed extractions sends only the failed files, then `setPatientData(data.extracted)` (`use-file-upload.tsx:180`) replaces every extracted patient with the retried files' results. Patients from files that already succeeded disappear from the review screen and can't be extracted again. It behaved the same before the fix pass. Belongs to the patient upload flow.

### Only with evidence

- **H3. Back button after sign-out.** Unconfirmed. In Next 16.3.8, `router.refresh()` also clears the back/forward cache. Change caching only after reproducing it in a browser.

## Decisions

Dates are when each decision was made. When a later decision overrides an earlier one, the note says so.

### Process

- **2026-09-24.** Keep auth bugs in one file with an explicit fix order. This file continues that.
- **2026-10-05.** Work follows the Notion tracker's order: Auth, Onboarding, Patient, Transfer, Receiving, Export, Demo support. Settings, search, Archive, the UI pass and the Vitals chart wait until the demo works.
- **2026-10-07.** Auth is ready to leave for onboarding. The remaining items are parked by phase in this file.

### Sign-up and sign-in

- **2026-09-24.** Sign-up (owner and invited) and sign-in call Better Auth over HTTP from the client (`authClient`), not through server actions, because only HTTP requests go through Better Auth's rate limiter. The unused auth services and actions were deleted.
- **2026-09-24.** Rate limiting is on in every environment: 100 requests per minute, on top of Better Auth's stricter built-in rules for auth endpoints.
- **2026-10-05.** Hospital owners must use a `.org` email. Invited members may use any domain: the server allows a non-`.org` sign-up only when a pending, unexpired invitation exists for that email. This overrides the 2026-09-24 rule that every account and invitation needed `.org`. Rejected: dropping `.org` for owners, blocking free email providers, and relying on approval alone.
- **2026-10-05.** Every email schema trims and lowercases.
- **2026-10-05.** Owner passwords are 8–128 characters, with the hint "Use 8 to 128 characters."
- **2026-10-05, confirmed 2026-10-07.** A sign-up with an email that already has an account gets "This email already has an account. Sign in instead." on the email field, with no links under it. It is a `hooks.before` check on `/sign-up/email` that uses `ctx.context.internalAdapter.findUserByEmail`.
  - Why: Better Auth's neutral alternative (`onExistingUserSignUp`) emails the account owner on every attempt, which can run up the Resend bill and flood an inbox. The real owner also gets help on screen straight away.
  - Accepted risk: anyone can check whether an email is registered. That is acceptable for a small B2B user base behind rate limits and hospital approval.
  - So sign-up success screens state plainly that a link was sent. P9 reworded them neutrally, and that was reverted on 2026-10-07. Neutral wording stays only where anyone can type any address: the resend form on `/email-verified` and the invite page's resend.
- **2026-10-05.** After sign-up, the form is replaced by "Check your email": the address, a "Resend link" button, "Wrong email? Go back" and "Already verified? Sign in".
- **2026-10-05.** Feedback is `{ type, message }`, shown green for success and red for errors, on `/email-verified`, sign-in, hospital details and forgot password, but not create new password. On `/email-verified` and forgot password, editing the email field clears the message.
- **2026-10-05.** Sign-up verification links land on `/email-verified`, which explains Better Auth's error codes and lets a signed-out person request a new link by entering their email. Its success view has a Continue link to `/hospital-details`. P1 replaced this flow; it was restored on 2026-10-07.
- **2026-10-07.** People choose their password once, at sign-up, and keep it after verifying. The verification link signs them in and returns them to `/email-verified` (owners) or their invitation (invitees). P1's wipe-and-reset step was removed (was Q1). Accepted risk: see #14 under Accepted risks. Rejected: asking for the password only after verification, and keeping both steps.
- **2026-10-05.** Sign-in passes no `callbackURL` to Better Auth, because it would also redirect verified users, and `sendOnSignIn` is off. For an unverified email, the sign-in form sends a new link itself and says so.
- **2026-10-05.** After sign-in, `callbackUrl` is followed only when it starts with `/dashboard/`; otherwise the person goes to `/dashboard/overview`. Owners without a hospital go to `/hospital-details`, and unapproved hospitals to `/verify`, before that. P6 later added invitation callbacks.

### Hospitals, approval and access

- **2026-09-24.** Accreditation upload: one file, PDF, PNG, JPG or DOC, with a specific message for each failure. The route returns 401 when signed out, 403 for an unverified email, 409 when details were already submitted and 400 for a bad file. It stores the file under a server-generated name in a per-user folder, replacing any earlier upload. The hospital save fails before creating the organization if no document was uploaded, and submit stays disabled until the upload finishes.
- **2026-09-24.** People can't create organizations directly (`allowUserToCreateOrganization: false`). The hospital service creates the organization on the server and sets it active.
- **2026-09-24.** An account belongs to one hospital at most, checked when inviting, accepting and adding a member. P15 added a database constraint.
- **2026-09-24.** Owners can't delete their account (until ownership transfer exists). Rejected on 2026-09-25: naming the owned hospitals in the error.
- **2026-09-25.** `getOrganizationId()` returns null unless the hospital is approved. `getOrganizationContext()` ignores approval, so `/verify` and `/admin-invite` work for unapproved hospitals.
- **2026-09-25.** Redirect where the helpers are called. Pages and server actions call `redirect()` outside any `try`, and a null organization goes to `/verify`. Route handlers return 401/403 JSON and the calling client redirects. There is no approval check in the dashboard layout, to avoid a Suspense boundary there. Rejected: a layout guard, redirecting inside `getOrganizationId()`, and checking approval in `proxy.ts`.
- **2026-09-25.** `/api/verify` reads `getOrganizationContext()`. Extraction checks sign-in before input and says "Sign in to extract patient records." (401) or "Your hospital must be verified before you can extract patient records." (403).
- **2026-09-28.** MediBridge is B2B, and unapproved hospitals must not add noise to the product. Their users get nothing beyond onboarding and verification; block and redirect rather than show an empty dashboard. The first version also said they shouldn't create accounts; see 2026-09-29.
- **2026-09-29.** Owners may create an account, with the preference that the hospital itself isn't created until approval. Rejected: an apply-first flow with a public form and no account. Superseded on 2026-10-07.
- **2026-10-07.** The hospital is created when the owner submits its details and stays unapproved until the approval script approves it. This replaces the 2026-09-29 preference (was Q2).
- **2026-10-05.** A failed hospital-details insert deletes the new organization (try/catch, not a transaction), and the hospital becomes active only after everything is saved. Unexpected failures show a fixed message.
- **2026-10-05.** Slugs get a random suffix so hospitals with the same name don't collide. Approved as six characters; P15 made it a full UUID so a failed save deletes only its own organization by slug.
- **2026-10-05.** Approval runs from a script, not a review page: `bun db:approve-hospital` lists pending hospitals, and `bun db:approve-hospital <owner email>` approves one and emails the owner. The approval stands if the email fails. The long-term idea is an outside verification service that calls back; none was found for Nigeria. Rejection was never discussed (Q4).
- **2026-10-02.** The member role control in settings is an Admin/Member select that shows the current role. It is UI only and saves nothing yet.

### Invitations

- **2026-09-24.** Invitations need an approved hospital. Owners invite admins or members; admins invite members only. Invitees no longer need `.org` since 2026-10-05.
- **2026-09-28.** The invitation policy runs in one `hooks.before` check on `/organization/invite-member`, so renewals (`resend: true`) follow it too, including the stored invitation's role. The second policy call on the stored invitation stays, rather than a role-only helper.

### Errors, tests and conventions

- **2026-10-05.** Results are `{ status: "success" | "failed" }`. Failures carry `error`, successes add `message` only when there is something to say, and a caught `error.message` never reaches the client. Recorded in AGENTS.md. The extra `unauthorized`, `forbidden` and `invalid` states listed there were added by Claude and not separately approved.
- **2026-10-05.** Page-load failures go to error boundaries. Recoverable form and request failures are handled where they happen, and catches must let `redirect()` through.
- **2026-09-28 and 2026-10-05.** Security fixes are tested against a real PostgreSQL database, in a separate Vitest project that runs one file at a time.
- **2026-10-05.** Patient uploads accept `.docx` but not `.doc`, for now.
- **2026-10-05.** A verified Resend sending domain waits until a domain is bought. Confirmed again on 2026-10-07.

## The 2026-10-07 fix pass

A separate session made these changes on 2026-10-07 (formerly `auth.hole.md`, items 1–16). It was committed in d60a040. Where a change altered an earlier decision or a claim was overstated, the note says so.

| ID  | Change                                                                                                                                                                                                                                                   | Note                                                                                                                  |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| P1  | The first verification clears the password typed at sign-up and the account's sessions (`beforeEmailVerification`), then sends the person to choose a password (`hooks.after` on `/verify-email`), keeping invitation links. A used link issues nothing. | Reverted on 2026-10-07 by decision, so #14 is an accepted risk again.                                                 |
| P2  | Removed Better Auth's session cookie cache, so password reset, deletion and revocation apply on the next request. `use cache: private` stays on `verifySession` and `getOrganizationId`.                                                                 | Replaces the first review's view that a 60-second delay was acceptable. That was a review note, not a decision.       |
| P3  | Accepting an invitation needs a verified email and a currently approved hospital. Inviting needs a verified email.                                                                                                                                       |                                                                                                                       |
| P4  | An owner can re-invite an existing account that hasn't joined a hospital.                                                                                                                                                                                | Correction: an expired invitation is replaced by a new one with a new ID. The old row stays "pending" and is ignored. |
| P5  | Existing members can't start a second hospital.                                                                                                                                                                                                          |                                                                                                                       |
| P6  | Sign-in keeps invitation callbacks, finds pending invitations without one, and offers a hospital selector.                                                                                                                                               | Correction: the selector's expired-session recovery can't trigger (O5).                                               |
| P7  | The invite page offers resend and sign-in with the invitation kept, and says "hospital membership" rather than "administrator".                                                                                                                          | Correction: an already-open invite form still shows a generic failure for an existing account (O5).                   |
| P8  | Password-reset errors separate a bad link from throttling and temporary failures.                                                                                                                                                                        |                                                                                                                       |
| P9  | Neutral sign-up wording ("If … is a new account…").                                                                                                                                                                                                      | Reverted on 2026-10-07 under the duplicate sign-up decision.                                                          |
| P10 | Sign-out checks the result and stays on the page if it fails.                                                                                                                                                                                            |                                                                                                                       |
| P11 | The hospital-details and admin-invite forms show fixed error text.                                                                                                                                                                                       | The owner and sign-in forms still show Better Auth's text (L11).                                                      |
| P12 | `getOrganizationId()` also requires a verified email.                                                                                                                                                                                                    |                                                                                                                       |
| P13 | Patient upload, extraction and deletion use per-hospital, per-user folders, and extraction results are per request.                                                                                                                                      | Correction: the type check is extension-only and size is per file (L9).                                               |
| P14 | Shared-record codes allow at most five guesses per code even under concurrency, work once, and re-check revocation and expiry.                                                                                                                           | Code requests still race (L8).                                                                                        |
| P15 | Unique `member.user_id` (migration 0024). A failed hospital creation deletes only its own organization, found by a full-UUID slug. `.org` is checked again at hospital creation.                                                                         | Migration runner issue (H1, L1). The slug length changed from the approved six characters.                            |
| P16 | `/email-verified` checks the session before showing success.                                                                                                                                                                                             |                                                                                                                       |

The pass ended by saying no concrete access bypass remained. That was too broad: the 2026-10-07 re-review found H1–H11, and the pass's author agreed.

Its validation: database suites 35 of 35; full unit run 420 passed, with two timeouts that passed when rerun alone and one todo; `tsc` passed; lint passed with 11 existing warnings; production build passed. Browser smoke checks covered signed-out redirects, invalid password links and signed-out upload requests.

### Follow-up fixes and review, 2026-10-07

- Accepting an invitation, inviting an administrator, saving patients and deleting an upload log caught errors and return fixed text instead of `error.message`. A failed patient save used to show the SQL statement with the patient's details.
- Accepting an invitation gives its own message for an invitation that is no longer pending, a hospital that isn't verified (P3's hook) and an account that already belongs to a hospital, instead of the generic failure. Its result is a typed union, and `unauthorized` carries text.
- Saving patients names the patient whose ID is repeated in the upload or already in use (X1).
- A review of the whole uncommitted diff found nothing blocking. Its new items are in item 1 (the selector), O5 (sign-in from an invitation link) and X5. The rest were already listed: 0024 on duplicate memberships and the `migrate` switch (item 1, L1), the accreditation upload race (O5), absolute paths in extraction results (L9) and result shapes (L11).
- Validation before d60a040: `tsc` passed, lint showed only existing warnings, all 455 unit tests passed (one todo) and the database suites 35 of 35. The allergies table test timed out once under full-suite load and passed when rerun alone. No production build was run, because a `next start` server on port 4300 serves the current `.next`.

## Fixed from the 2026-09-24 reviews

| ID  | Finding                                                             | Status                                                                                                                                                                                       |
| --- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #1  | Accreditation upload was unauthenticated and allowed path traversal | Fixed: session and verified email required, server-generated name in a per-user folder, size and type checks, awaited write, and the document path saved with the hospital. Leftovers in O5. |
| #2  | Dashboard reachable before approval                                 | Data fixed in 1394842 (`getOrganizationId()` returns only approved hospitals; P12 adds verified email). Pages: O1.                                                                           |
| #3  | Invited admins were pushed into creating a hospital                 | Fixed by P6 and P7: a "Sign in to accept" state, a pending-invitation check at sign-in, and the invitation kept through verification.                                                        |
| #4  | A failed hospital save stranded the owner                           | Fixed in d220ec9 (rollback and unique slug), hardened by P15. Leftovers: O2.                                                                                                                 |
| #5  | Expired verification links had no recovery                          | Fixed in 4faf68a.                                                                                                                                                                            |
| #6  | Sign-out redirected even when it failed                             | Fixed by P10.                                                                                                                                                                                |
| #7  | Owner sign-up accepted a one-character password                     | Fixed in 49fb210.                                                                                                                                                                            |
| #8  | The owner duplicate check never matched                             | No longer applies: the service was removed in 1394842.                                                                                                                                       |
| #9  | `/api/verify` returned wrong statuses                               | Fixed: 401 and 403 JSON. The bodies lack `error` text (L11).                                                                                                                                 |
| #10 | Sign-in ignored `callbackUrl`                                       | Fixed in 92eed3d. P6 added invitation callbacks.                                                                                                                                             |
| #11 | `debug: true` in the auth config                                    | Removed in d60a040. It was unused anyway.                                                                                                                                                    |
| #12 | The verify page never showed completion                             | Partly fixed in 1ab45c4. The rest is O3.                                                                                                                                                     |
| #13 | Links nested in buttons on `/email-verified`                        | Fixed.                                                                                                                                                                                       |
| #14 | Whoever held the invitation link could choose the password first    | Fixed by P1, then reopened by decision on 2026-10-07. See Accepted risks.                                                                                                                    |
| A1  | Server auth calls skipped rate limiting                             | Fixed: auth calls go over HTTP. The rest is L3.                                                                                                                                              |
| A2  | The invitation endpoint skipped app rules                           | Fixed by the `hooks.before` policy (47708fd).                                                                                                                                                |
| A3  | A sole owner could delete their account                             | Fixed: `deleteUser.beforeDelete` blocks any owner.                                                                                                                                           |
| A4  | Auth email used Resend's testing sender                             | Open by decision (L2).                                                                                                                                                                       |
| A5  | Stale active hospital in the session cookie                         | No longer applies: the cookie cache is gone (P2), and the hospital is set active after saving.                                                                                               |
| A6  | An invitation couldn't be renewed for an existing account           | Fixed by P4.                                                                                                                                                                                 |
| A7  | Duplicate sign-up claimed a verification email was sent             | Resolved by decision: an explicit error (49fb210).                                                                                                                                           |
| A8  | Several hospital memberships blocked sign-in                        | Fixed: hospital selector (P6), and P15 prevents new duplicates.                                                                                                                              |
| A9  | Every reset failure said the link had expired                       | Fixed by P8.                                                                                                                                                                                 |
| A10 | Validation differed between forms and server                        | Fixed: emails normalized (49fb210) and hospital details parsed on the server. Spaces-only address: O2.                                                                                       |
| A11 | Any signed-in user could create organizations                       | Fixed in 1394842.                                                                                                                                                                            |
| A12 | Public sign-up skipped app rules                                    | Fixed: the `.org` rule runs in `databaseHooks.user.create.before` (owners only since 49fb210) and again at hospital creation (P15).                                                          |
| A13 | Invitation renewal skipped the policy                               | Fixed in 47708fd.                                                                                                                                                                            |

## Accepted risks and not bugs

- Pre-registration (#14), decision of 2026-10-07. Someone who signs up with an email before its owner keeps a working password, name and image if the owner then opens the verification link. The owner can take the account back with "Forgot password". Asking for the password only after verification would close this without extra steps.
- Sign-up reveals whether an email has an account (decision of 2026-10-05). For a non-`.org` email, the `.org` error also shows whether a pending invitation exists.
- The `.org` rule is weak, since anyone can register a `.org` domain. Manual approval is the real gate.
- Anyone holding an invitation link sees the invitee's email, the hospital name and whether the invitee already has an account. Invitation IDs carry about 190 bits of randomness.
- Password reset and change-password don't reveal whether an email has an account. A reset revokes sessions, and changing the password signs out other sessions.
- The shared-record cookie and the transfer-approval token both use `BETTER_AUTH_SECRET`. They can't be confused today, because approval tokens carry a `purpose` claim.
- The `admin()` plugin and the public invitation preview aren't vulnerabilities by themselves. L10 tidies them up.

## Tests

- Unit tests: `npx vitest run`.
- Database tests: `npx vitest run --project database`. They need `TEST_DATABASE_URL` pointing at a disposable PostgreSQL database, are skipped without it, and run one file at a time. They cover sign-up rules, invitations (including renewals and concurrent acceptance), hospital creation and rollback, and shared-record codes.
- Gaps: no test covers the invited account's "Verify Your Email" message, and the selector's expired-session test mocks a `setActive` success that can't happen in practice.

## ID key

- `#1`–`#14`: first review, 2026-09-24 (was `auth-bug.md`).
- `A1`–`A13`: deeper review, 2026-09-24 (was the first `auth.md`).
- `P1`–`P16`: fix pass, 2026-10-07 (was `auth.hole.md`, items 1–16).
- `H1`–`H11`: re-review, 2026-10-07. H1 → L1, H2 → X1, H3 → only with evidence, H4 → L5, H5 → L4, H6 → accepted (duplicate sign-up decision), H7 → L6, H8 → L3, H9 → L8, H10 → X2, H11 → O1.
- `Q`, `O`, `L` and `X`: open items in this file.
