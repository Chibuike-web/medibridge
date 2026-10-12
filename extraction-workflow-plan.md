# Patient extraction: Workflow SDK wiring draft

Status: proposed implementation order. The new review screen saves real patient records and opens their source documents. Remove currently affects only the browser's list; persistent removal, saved status, partial-success routing, and retries still need the batch model below.

## Intended flow

```text
Upload files → confirm → create batch + document rows → start workflow run
                                                          │
            any document ready ───────────────────────────┼─→ redirect to review
            every document failed, none ready ────────────┴─→ stay on upload failure screen

Each document attempt: try → retry → retry → ready, or failed
Fatal errors skip the remaining retries.
Review page: review ready documents, Try again failed ones, Remove, Save.
Browser refresh or disconnect → reconnect to the same batch by ID.
```

```text
Upload (all failed)                    Review (partial success)
┌──────────────────────────────┐      ┌────────────────────────┬─────────────────────┐
│ We couldn’t extract these    │      │ Ada Okafor             │ Documents           │
│ records                      │      │ [form for ready doc]   │ ✓ ada.pdf   Ready   │
│ [cards: Retry · Remove]      │      │                        │ ⟳ bola.pdf  Extract │
│ [Retry all]                  │      │                        │ ⚠ emeka.pdf Failed  │
└──────────────────────────────┘      │                        │   Try again Remove  │
                                      └────────────────────────┴─────────────────────┘
```

## 1. Make uploaded files durable

- Replace local `patient-uploads/` storage with a private bucket using the existing Supabase client. Verify the bucket and access before switching upload/delete behavior.
- Keep generated upload IDs, original filenames, file sizes, and hospital/user ownership together.
- Each workflow step downloads its own document. A step must not depend on a browser `File` or a previous request's local filesystem.
- The same stored file serves retries and **View document**.

Primary targets: `src/app/api/file-upload/route.ts`, `src/services/patient/delete-patient-upload-service.ts`, `src/lib/utils/supabase.ts`.

## 2. One batch, one row per document

Each document has its own status, attempts, retries, removal, and save, so it gets its own row instead of an entry in the batch's JSON array.

- **Batch** (`patient_extractions`): `id`, `organizationId`, `createdBy`, `startRequestId`, `createdAt`. Unique on `(organizationId, startRequestId)`.
- **Document** (`patient_extraction_documents`): `id`, `extractionId`, `organizationId`, `uploadPath`, `originalFilename`, `size`, `status`, `attempt`, `workflowRunId`, `error`, `result` (jsonb), `savedPatientId`, timestamps.
- Statuses: `extracting`, `ready`, `failed`, `saved`. Removing a document deletes its row and stored file, so a late completion has nothing to update.
- Every write is a guarded, single-row update:
  - **Completion** (ready or failed): `where id = $documentId and status = 'extracting' and attempt = $attempt`. One condition rejects saved documents, deleted documents, and results from an earlier attempt.
  - **Retry**: `set status = 'extracting', attempt = attempt + 1 where status = 'failed'`, returning the new attempt. A repeated retry request matches nothing and returns the current state.
  - **Remove**: only `where status in ('ready', 'failed')`.
  - **Save**: insert the patient and set `status = 'saved', savedPatientId` `where status = 'ready'` in one transaction. A repeated save returns the existing `savedPatientId`.
- Drop `extracted_data` once the review page reads document rows.

Primary targets: `src/db/schemas/patient/patient-extraction.ts`, a new document schema, extraction services, and a migration.

## 3. Workflow SDK setup and the extraction workflow

- Install a compatible `workflow` version and read its bundled docs. Confirm `maxRetries = 2` still means two retries after the first attempt in that version.
- Wrap the existing Next config with `withWorkflow`, keeping every current option. Verify it works with `cacheComponents`, `typedRoutes`, and Turbopack, and that `serverExternalPackages` (`tesseract.js`, `pdf-parse`, `mammoth`) still applies to step bundles. The proxy matcher (`/dashboard/:path*`) already leaves Workflow's internal paths alone.
- Add `src/workflows/patient-extraction.ts`. Input: `{ extractionId, documents: [{ id, attempt }] }`. The first start passes every document; a retry passes only the retried ones.
- The workflow processes documents in small chunks (`Promise.all` per chunk) to bound OCR and memory per run. Pick the chunk size after measuring a Tesseract worker.
- One step per document, `extractDocument(documentId, attempt)`, with `maxRetries = 2`:
  1. Return early if the row is no longer `extracting` at this attempt.
  2. Download the file, extract text with the existing PDF/image/DOCX helpers (missing embedded PDF text already falls back to OCR), and create and terminate the Tesseract worker inside the step.
  3. Parse with `generateText` for one document, `maxRetries: 0` so the provider does not multiply the step's retry budget, and an `abortSignal` timeout.
  4. Write the result with the completion guard and return only a status.
- Keep patient data out of step inputs and outputs. Workflow persists them in its event log, so text and extracted records go straight to the database inside the step.
- Retry classification:
  - `FatalError`: unsupported file type, missing upload, and a completed extraction that found no text.
  - Retryable (plain throw): Tesseract worker crashes, timeouts, provider and network errors, storage download errors, and structured-output parse errors.
- When a step throws for the last time, the workflow catches it and calls a `markDocumentFailed` step with the same guard and a fixed user-facing message. The real error is logged with `console.error`. Other documents continue.
- Workflow bodies run in a sandbox, so Node-only modules (`tesseract.js`, `pdf-parse`, `mammoth`, `fs`) are used only from step code.

References: [Next.js integration](https://workflow-sdk.dev/docs/getting-started/next), [errors and retries](https://workflow-sdk.dev/docs/foundations/errors-and-retries), [starting workflows](https://workflow-sdk.dev/docs/api-reference/workflow-api/start).

## 4. Start, status, and document actions

- **Start** (`POST /api/extract-file`): keep the sign-in, verified email, verified hospital, and upload ownership checks. The client sends the uploads and a `startRequestId` generated when the user confirms. Insert the batch and document rows; on a `startRequestId` conflict, return the existing batch without starting another run. Call `start()`, store the run ID, and return HTTP 202 with `{ status: "success", extractionId }`. If `start()` throws, mark those documents failed so **Try again** can recover them.
- **Status** (`GET /api/patient-extractions/[extractionId]`): ownership-checked; returns the batch's documents with status, error, and result.
- **Retry, remove, save**: server actions following `deletePatientUploadAction`, each scoped to the caller's hospital and using the guarded updates from step 2. Retry starts a new run for the documents it moved back to `extracting`; it also backs **Retry all** on the upload page.
- The workflow receives only trusted IDs; steps load everything from the database, never from request cookies.

Primary targets: `src/app/api/extract-file/route.ts`, `src/app/api/patient-extractions/[extractionId]/route.ts`, and new patient extraction actions.

## 5. Extraction hook and navigation

- `useFileExtraction` starts a batch, then reads the status endpoint with SWR (as in hospital verification), polling every two seconds while any document is `extracting` and stopping when none are.
- Put the batch ID in the URL on both pages so a refresh restores the same documents.
- **Upload page:** redirect to `/dashboard/review-extracted-info?extractionId=<batch>` as soon as any document is `ready`. Stay only when every document has failed; that screen keeps per-card Retry/Remove and **Retry all**.
- A failed status request shows connection feedback and keeps the last known documents. It never marks documents failed or restarts the batch.

Primary targets: `src/hooks/use-file-extraction.tsx`, the upload page, and the review page.

## 6. Promote the review UI

- Replace `review-extracted-info-client.tsx` and the modal editor with the new review UI, fed by the batch's documents. Remove the `/preview` route, sample data, the sample document dialog, and the simulated retry timer.
- Unsaved form edits are kept per document. Polling updates statuses and other documents but never overwrites a document's form once it is being edited.
- **Try again:** retries that document in the same batch; ready and saved documents are untouched.
- **Remove:** ready or failed documents only, enforced on the server too. When nothing remains, return to file selection.
- **Save patient & review next:** saves the selected ready document and selects the next ready one. Saved documents stay viewable alongside **Continue to dashboard**.
- Server validation matches the UI: personal, contact, and emergency fields required (including date of birth, which the date picker cannot enforce); physical information optional.
- **View document:** opens a short-lived signed URL for the original file in a new tab, after an ownership check.
- Show the file-type icon per document instead of always the PDF icon.

## 7. Verify the whole flow

- Success on the first attempt and after either retry; failure after all three attempts; a fatal error fails after one attempt.
- Partial success redirects to review while other documents continue; all failures stay on upload.
- Try again and Retry all keep earlier results and reuse the batch; a late result from an earlier attempt is rejected.
- A repeated start request returns the same batch and starts no second run.
- Refresh, navigation, browser disconnect, and server restart recover the same work without duplicates.
- Removed documents cannot come back; saved documents cannot be removed or overwritten.
- Saving twice creates one patient, and polling never erases edits.
- Upload, status, retry, remove, save, and file access reject another hospital's records.

Before live provider tests, verify AI Gateway access; earlier calls were blocked by billing verification. Controlled provider responses can cover the flow before then.

## Open decisions

- **View document** for DOCX: browsers download it instead of displaying it. Label it differently, or convert for viewing?
- Chunk size for OCR, once a worker's memory and time are measured.

## Suggested first implementation slice

Durable uploads and the batch/document tables, then a single-document workflow and the status endpoint. Once that path works, add chunked multi-document runs, the partial-success redirect, and the review actions.
