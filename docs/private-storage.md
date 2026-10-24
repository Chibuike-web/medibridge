# Private file storage

The app uses two private Supabase buckets: `patient-uploads` (intake documents and clinical reports) and `hospital-uploads` (accreditation documents). Better Auth and verified hospital membership continue to authorize each app entry point. No Supabase Auth account or public storage policy is required.

## Environment

Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` on the server, alongside the existing database and Better Auth variables. Never expose the service role key through `NEXT_PUBLIC_` variables. The old S3 credentials are not used: the saved key returned `InvalidAccessKeyId`, while the existing Supabase credential was verified against both buckets.

Both buckets must remain private, with a 52,428,800-byte limit. Allow PDF, PNG and JPEG in both; also allow `application/vnd.openxmlformats-officedocument.wordprocessingml.document` in the patient bucket and `application/msword` in the hospital bucket to match the existing intake forms.

## Transfer and authorization

1. The browser posts file metadata to the app. The app validates the session, email verification, hospital access, patient ownership when applicable, file type and size.
2. The app grants an upload URL for a new generated object key. Its token permits uploading that object and cannot overwrite an existing object. Supabase's signed upload URLs expire after two hours.
3. The browser sends bytes directly to Supabase. No file bytes pass through a Vercel request or server action, preserving the 50 MB limit despite Vercel's 4.5 MB function request limit.
4. Clinical forms submit signed upload receipts. The server checks their signature, expiry, uploader, hospital, patient and report type, then verifies the actual stored file's size and MIME type before persisting the record and its Activity entries.
5. Existing download endpoints authorize each request, then redirect to a private signed URL valid for 60 seconds. That bearer URL remains usable until expiry. The service role key is never included.

Intake keys are `{organizationId}/{uploadedBy}/{generatedName}`. Clinical keys are `{organizationId}/record-files/{fileId}.{extension}`. Accreditation keys are `{ownerUserId}/{generatedName}`. Database report viewer URLs remain unchanged. An unfinished hospital submission reads the latest complete accreditation upload for its owner.

Failed patient uploads can be retried individually without reuploading successful files. Extraction reads buffers from Storage; Tesseract may cache its language data in the OS temporary directory. No patient or accreditation documents are written to local disk.

## Migration and retention

Run `bun src/db/migrate-local-uploads.ts --source <existing-checkout>` to inspect a migration, then add `--apply` to copy. It copies only generated UUID filenames in app-owned folder shapes, leaving unrelated or unrecognized legacy files for manual mapping. It preserves all local files, never overwrites remote objects, verifies existing objects by SHA-256 on reruns, and converts older clinical folder keys without changing database viewer URLs.

Uploads happen before record saves. An unsaved or failed clinical form can leave an unreferenced object; it is retained for retry rather than deleting an object another successful submission may reference. Old unused accreditation uploads are likewise retained until cleanup. Run `bun src/db/cleanup-storage-uploads.ts` to count unreferenced clinical/accreditation objects older than 24 hours, then explicitly add `--apply` to remove them. It refuses to combine storage and database from different projects, checks current references, and preserves every intake source document. Intake source retention after saving an extracted patient needs a separate retention decision because the current schema does not retain a source-file association. Never empty either bucket or delete database tables as part of deployment.

## Before hosting

Use a Vercel preview with server-side storage credentials and the intended Supabase database. Configure `BETTER_AUTH_URL` and `NEXT_PUBLIC_URL` for the hosted URL and verify real email links. Check upload, extraction/retry, review/save, report access, cross-hospital denial, and transfer approval/recovery separately. Storage completion does not establish that the whole hosted demo or recipient report access is complete.
