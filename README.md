# Medibridge

Medibridge is a hospital-facing patient record and controlled record-sharing platform. It gives a healthcare organization one workspace for onboarding patients, reviewing longitudinal clinical data, and preparing selected records for another hospital without exposing the patient's entire chart.

> **Repository status:** active prototype development. Patient onboarding, clinical record reading and editing, transfer submission, approval, and access-scoped sharing are database-backed. Vitals and encounter editing, transfer recovery actions, and hosted end-to-end verification are still incomplete. This repository is not ready for production clinical use.

## Product demo

### Patient onboarding

Four patient PDFs are uploaded, the extracted details are reviewed, a wrong age is corrected, and each patient is saved.

https://github.com/user-attachments/assets/b362512a-c3a4-443a-accd-087657c07c34

### Patient management

A patient record: the profile overview, a 30-day blood pressure chart, diagnoses with a detail drawer, then allergies, medications, and lab results.

https://github.com/user-attachments/assets/e477d7d3-e4c4-4563-ab16-07593db9aef3

A diagnosis is edited from Stage 2 to Stage 1, its activity log shows the change, and an encounter lists the vitals and medications recorded during the visit.

https://github.com/user-attachments/assets/bac25c52-1ffd-42b7-aa50-957bf4d1f03d

### Patient records transfer

A patient is selected, diagnoses, allergies, medications, and labs are attached, the receiving hospital is entered, and the request is sent for patient approval.

https://github.com/user-attachments/assets/3186590a-bc9e-4793-9d5e-11c4ccc271c3

The patient approves the transfer, the receiving hospital enters a verification code to open a read-only, expiring view of the approved records, and the request shows as completed.

https://github.com/user-attachments/assets/4575e6fd-9496-48d7-af7f-71765b9f7c34

## What the product does

Medibridge is designed around three participants:

- **Hospital staff** register an organization, sign in, add patients, and work with records scoped to their hospital.
- **Patients or designated approvers** review a proposed transfer and approve or reject it.
- **Receiving hospitals** verify a short-lived access code and open a time-limited, read-only view containing only the selected records.

The intended end-to-end journey is:

1. A hospital owner registers an account and hospital.
2. Staff upload existing patient documents or enter patient information for review.
3. Medibridge extracts structured demographic data from the uploaded files and saves confirmed patients to the hospital's workspace.
4. Staff review a patient's profile and clinical sections.
5. Staff select specific records and request a transfer to another hospital.
6. The patient approves or rejects the request.
7. After approval, Medibridge emails the recipient a verification code and a protected, expiring record link.

## Current implementation

| Area                                   | Current state                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hospital onboarding and authentication | Email/password registration and sign-in use Better Auth. Organization creation, owner membership, email verification, and hospital verification-document upload are present. Admin invitation and password-recovery screens exist but are not fully connected end to end.                                                                                                                                                                                                                                           |
| Dashboard                              | Database-backed organization statistics, recent patients, recent transfers, and empty states.                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Patient import                         | Uploads PDF, PNG, JPG, and DOCX files up to 50 MB. Text is extracted with PDF Parse, Tesseract OCR, or Mammoth, then structured with an AI Gateway model. Users can review and correct multiple extracted patients before saving.                                                                                                                                                                                                                                                                                   |
| Patient directory                      | Database-backed patient list with search, filters, pagination, profile headers, and editable personal, contact, emergency-contact, and physical information.                                                                                                                                                                                                                                                                                                                                                        |
| Clinical records                       | Database-backed list/detail views for diagnoses, allergies, immunizations, procedures, medications, encounters, lab tests, imaging, and documents. Each record's Activity shows every saved change with its old and new values. Document metadata supports create, update, and delete.                                                                                                                                                                                                                              |
| Record authoring                       | Diagnoses, allergies, medications, immunizations, procedures, lab tests, and imaging can be added and edited from the patient page or inside an encounter. Edits save only the changed fields and record one history row per field. Lab tests and imaging accept PDF, PNG, or JPG reports up to 50 MB, stored in private Supabase Storage and streamed through the app only to the same hospital. Encounters can be created; vitals and encounter editing are placeholders, and drawer status actions only confirm. |
| Transfers                              | The request builder reads organization-scoped patients and clinical records, validates record ownership, and atomically creates transfer, content, and progress rows. The target hospital is a name and email entered by staff. Transfer details show who requested it, the patient's answer, and whether the access code was sent. Resend, retry, cancel, and archive are not connected yet.                                                                                                                       |
| Patient approval and delivery          | Patients receive a signed, expiring approval link. A transfer can be answered once: approval and rejection run in one transaction that only updates a waiting transfer, and each transfer has at most one access grant. Approval records the selected records, then sends the receiving hospital an OTP-protected access link.                                                                                                                                                                                      |
| Shared record portal                   | OTP verification creates a signed, expiring external session. Patient details and clinical tables are loaded from PostgreSQL and restricted to the patient and record IDs captured in the approved access grant.                                                                                                                                                                                                                                                                                                    |

## Patient record model

A patient belongs to one hospital organization and can have:

- Personal, contact, emergency-contact, and physical information
- Diagnoses and diagnosis history
- Allergies and allergy history
- Immunizations and immunization history
- Procedures and procedure history
- Medications and medication history
- Encounters
- Lab tests, lab-test history, and lab files
- Imaging studies and imaging history
- Documents and document metadata
- Transfers, transfer contents, transfer progress, record-access grants, and access verifications

Organization scoping is applied in the patient and transfer query layer so authenticated staff read records for their active hospital.

## Architecture

```mermaid
flowchart LR
    Staff["Hospital staff"] --> App["Next.js App Router UI"]
    Approver["Patient / approver"] --> Approval["Transfer approval page"]
    Recipient["Receiving hospital"] --> Verify["OTP verification and shared record portal"]

    App --> Auth["Better Auth organizations and sessions"]
    App --> Server["Server Components, Server Actions, and route handlers"]
    Approval --> Server
    Verify --> Server

    Auth --> DB[("PostgreSQL")]
    Server --> DB
    Server --> Files["Private Supabase Storage"]
    Server --> AI["Vercel AI Gateway"]
    Server --> Email["Resend email delivery"]
```

The application uses the Next.js App Router. Pages and layouts live under `src/app`, reusable product code is grouped under `src/features`, database queries live under `src/lib/api`, and PostgreSQL schemas live under `src/db/schemas`.

## Main routes

| Route                             | Purpose                                                 |
| --------------------------------- | ------------------------------------------------------- |
| `/`                               | Product entry point with registration and sign-in links |
| `/owner`, `/hospital-details`     | Hospital owner and organization registration            |
| `/sign-in`                        | Staff sign-in                                           |
| `/dashboard/overview`             | Organization overview and recent activity               |
| `/dashboard/patients`             | Patient directory                                       |
| `/dashboard/patients/[patientId]` | Patient profile and clinical record sections            |
| `/dashboard/add-new-patient`      | Document upload and AI-assisted patient onboarding      |
| `/dashboard/transfers`            | Transfer history and status tracking                    |
| `/dashboard/new-transfer-request` | Create a patient-approved transfer request              |
| `/transfer-approval/[transferId]` | Patient approval or rejection                           |
| `/verify-access/[accessId]`       | Recipient verification-code flow                        |
| `/shared-records/[accessId]`      | Protected, read-only shared record view                 |

## Tech stack

- Next.js 16 App Router, React 19, and TypeScript
- Tailwind CSS 4 with reusable local UI primitives
- PostgreSQL with Drizzle ORM and Drizzle Kit
- Better Auth with organization and admin plugins
- Vercel AI SDK and AI Gateway for structured patient extraction
- Tesseract.js, PDF Parse, and Mammoth for source-document extraction
- Resend for verification and access-code email
- React Hook Form and Zod for form handling and validation
- TanStack Table for data-heavy patient and transfer views

## Repository structure

```text
src/
├── app/                 # Routes, layouts, pages, route handlers, and route-scoped UI
├── components/          # Shared layout and UI components
├── db/
│   ├── schemas/         # Auth, hospital, patient, transfer, and access tables
│   └── drizzle/         # Generated migrations
├── features/
│   ├── auth/            # Auth schemas and server-action boundaries
│   ├── patients/        # Patient tables, drawers, actions, and types
│   └── transfers/       # Transfer UI, validation, and actions
├── lib/
│   ├── api/             # Organization-scoped database queries
│   ├── better-auth/     # Auth server and client configuration
│   └── utils/           # Environment, email, formatting, and shared helpers
├── services/            # Auth, hospital, and patient application services
└── hooks/               # Upload and shared client hooks
```

Patient documents, clinical reports, and accreditation files use private Supabase Storage. Browsers upload directly using scoped upload URLs, and application endpoints authorize every download and stream it through the app. A patient's source document is deleted when the patient is saved, and a daily cron job removes what is left behind.

Create two private Supabase buckets before uploading, each with a 50 MB limit: `patient-uploads` allowing PDF, PNG, JPEG and DOCX, and `hospital-uploads` allowing PDF, PNG, JPEG and DOC. Before the first deploy, run `bun run storage:migrate -- --source <checkout>` to preview copying existing local uploads, then add `--apply` to copy them. The app only reads from storage, so files left on disk return 404.

Set `CRON_SECRET` on the host. The daily job in `vercel.json` removes abandoned reviews and any file older than a day that no record points to, except each owner's newest accreditation upload, which stays until they submit their hospital details.

## Local development

### Prerequisites

- Node.js 22 or newer
- Bun
- A PostgreSQL database
- AI Gateway credentials to use document extraction
- Resend credentials to exercise email verification and record sharing

### Environment variables

Create `.env.local` in the repository root:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
BETTER_AUTH_SECRET=replace-with-a-long-random-secret
BETTER_AUTH_URL=http://localhost:4300
NEXT_PUBLIC_URL=http://localhost:4300

# Required by feature flows
AI_GATEWAY_API_KEY=your-ai-gateway-key
RESEND_API_KEY=your-resend-key
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
CRON_SECRET=replace-with-a-long-random-secret

# Optional database pool override
POSTGRES_POOL_MAX=5
```

### Install and run

```bash
bun install
bun run db:push
bun run dev
```

Open [http://localhost:4300](http://localhost:4300).

Create your hospital owner account through the registration flow, then complete email verification and hospital onboarding. Populate patient records through the application.

In development, emails are not sent. Email verification and password-reset links, transfer approval links, and shared-record access codes are printed to the `bun run dev` terminal, so the whole transfer flow can be tested with placeholder addresses.

### Useful commands

| Command                | Purpose                                             |
| ---------------------- | --------------------------------------------------- |
| `bun run dev`          | Start the development server on port 4300           |
| `bun run build`        | Create a production build                           |
| `bun run start`        | Start the production server                         |
| `bun run lint`         | Run Oxlint                                          |
| `bun run lint:fix`     | Apply Oxlint fixes                                  |
| `bun run format`       | Format supported files with Oxfmt                   |
| `bun run format:check` | Check formatting with Oxfmt                         |
| `bun run db:generate`  | Generate Drizzle migrations from the schemas        |
| `bun run db:push`      | Push the current schema to PostgreSQL               |
| `bun run db:migrate`   | Apply the migrations in `src/db/drizzle/migrations` |
| `bun run devtools`     | Start the AI SDK development tools                  |

## Ongoing work

The highest-value remaining work, based on the current code paths, is:

1. Finish transfer recovery: resend the approval request, retry a failed delivery, cancel, and archive. Show record names on the patient's approval page, and let the receiving hospital open lab and imaging reports.
2. Connect vitals and encounter editing, and the drawer status actions (complete, discontinue, archive).
3. Verify the private-storage flow on a hosted preview.
4. Complete administrator invitations, invitation acceptance, and password-recovery flows.
5. Broaden automated tests for organization isolation, patient import, OTP expiry/retry behavior, and shared-record permissions.
6. Harden production configuration: add audit logging, validate all feature environment variables, and complete privacy/security review.

## Product direction

Medibridge is being built for hospitals in Nigeria and similar environments where records are often fragmented across facilities. Its central product principle is **minimum necessary sharing**: a receiving hospital should get the records needed for a care transition, for a limited time, after explicit approval—not unrestricted access to the patient's full history.
