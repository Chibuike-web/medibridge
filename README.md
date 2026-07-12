# MediBridge

MediBridge is a hospital-facing patient record and controlled record-sharing platform. It gives a healthcare organization one workspace for onboarding patients, reviewing longitudinal clinical data, and preparing selected records for another hospital without exposing the patient's entire chart.

> **Repository status:** active prototype development. Patient onboarding, record-reading, transfer submission, approval, and access-scoped sharing are database-backed. Clinical record authoring and durable attachment storage are still incomplete. This repository is not ready for production clinical use.

## What the product does

MediBridge is designed around three participants:

- **Hospital staff** register an organization, sign in, add patients, and work with records scoped to their hospital.
- **Patients or designated approvers** review a proposed transfer and approve or reject it.
- **Receiving hospitals** verify a short-lived access code and open a time-limited, read-only view containing only the selected records.

The intended end-to-end journey is:

1. A hospital owner registers an account and hospital.
2. Staff upload existing patient documents or enter patient information for review.
3. MediBridge extracts structured demographic data from the uploaded files and saves confirmed patients to the hospital's workspace.
4. Staff review a patient's profile and clinical sections.
5. Staff select specific records and request a transfer to another hospital.
6. The patient approves or rejects the request.
7. After approval, MediBridge emails the recipient a verification code and a protected, expiring record link.

## Current implementation

| Area                                   | Current state                                                                                                                                                                                                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hospital onboarding and authentication | Email/password registration and sign-in use Better Auth. Organization creation, owner membership, email verification, and hospital verification-document upload are present. Admin invitation and password-recovery screens exist but are not fully connected end to end.      |
| Dashboard                              | Database-backed organization statistics, recent patients, recent transfers, and empty states.                                                                                                                                                                                  |
| Patient import                         | Uploads PDF, PNG, JPG, DOC, and DOCX files up to 50 MB. Text is extracted with PDF Parse, Tesseract OCR, or Mammoth, then structured with an AI Gateway model. Users can review and correct multiple extracted patients before saving.                                         |
| Patient directory                      | Database-backed patient list with search, filters, pagination, profile headers, and editable personal, contact, emergency-contact, and physical information.                                                                                                                   |
| Clinical records                       | Database-backed list/detail views for diagnoses, allergies, immunizations, procedures, medications, encounters, lab tests, imaging, and documents. Detail/history UI is present. Document metadata supports create, update, and delete.                                        |
| Record authoring                       | Creation/edit drawers exist for several clinical sections, but most do not persist yet. Vitals and encounter creation are placeholders. Attachment controls in several record drawers are local UI only.                                                                       |
| Transfers                              | The request builder reads organization-scoped patients and clinical records, validates record ownership, and atomically creates transfer, content, and progress rows. Target hospital identity is entered by staff and receives a runtime identifier for patient confirmation. |
| Patient approval and delivery          | Patients receive a signed, expiring approval link. Approval or rejection updates the transfer; approval creates an exact record-access snapshot, then sends the receiving hospital an OTP-protected access link.                                                               |
| Shared record portal                   | OTP verification creates a signed, expiring external session. Patient details and clinical tables are loaded from PostgreSQL and restricted to the patient and record IDs captured in the approved access grant.                                                               |

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
    Server --> Files["Local upload directories"]
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
- Zustand for short-lived, persisted client workflow state
- React Hook Form and Zod for form handling and validation
- TanStack Table for data-heavy patient and transfer views

## Repository structure

```text
src/
├── app/                 # Routes, layouts, pages, route handlers, and route-scoped UI
├── components/          # Shared layout and UI components
├── db/
│   ├── schemas/         # Auth, hospital, patient, transfer, and access tables
│   ├── drizzle/         # Generated migrations
│   └── table-seeds/     # Local development seed data
├── features/
│   ├── auth/            # Auth schemas and server-action boundaries
│   ├── patients/        # Patient tables, drawers, actions, stores, and types
│   └── transfers/       # Transfer UI, validation, actions, and local workflow state
├── lib/
│   ├── api/             # Organization-scoped database queries
│   ├── better-auth/     # Auth server and client configuration
│   └── utils/           # Environment, email, formatting, and shared helpers
├── services/            # Auth, hospital, and patient application services
└── hooks/               # Upload and shared client hooks
```

`patient-uploads/` and `hospital-uploads/` are runtime upload directories used by the current local implementation. They should be replaced by durable private object storage before deployment.

## Local development

### Prerequisites

- Node.js 20.9 or newer
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

# Optional database pool override
POSTGRES_POOL_MAX=5
```

### Install and run

```bash
bun install
bun run db:push
bun run db:seed
bun run db:seed-shared-record
bun run dev
```

Open [http://localhost:4300](http://localhost:4300).

The main seed command populates local development data across auth, hospital, patient, clinical-record, and transfer tables. `db:seed-shared-record` then creates a repeatable OTP-protected access grant over real seeded records and prints the verification URL and development code. Do not run these commands against a database containing data you need to preserve.

### Useful commands

| Command                         | Purpose                                                                 |
| ------------------------------- | ----------------------------------------------------------------------- |
| `bun run dev`                   | Start the development server on port 4300                               |
| `bun run build`                 | Create a production build                                               |
| `bun run start`                 | Start the production server                                             |
| `bun run lint`                  | Run ESLint                                                              |
| `bun run db:generate`           | Generate Drizzle migrations from the schemas                            |
| `bun run db:push`               | Push the current schema to PostgreSQL                                   |
| `bun run db:seed`               | Seed local development data                                             |
| `bun run db:seed-shared-record` | Seed a repeatable shared-record access grant over real clinical records |
| `bun run db:sync-hospitals`     | Synchronize the larger hospital/transfer development dataset            |
| `bun run devtools`              | Start the AI SDK development tools                                      |

## Ongoing work

The highest-value remaining work, based on the current code paths, is:

1. Connect create/update actions for diagnoses, allergies, immunizations, procedures, medications, encounters, lab tests, imaging, and vitals.
2. Replace local and mocked attachment handling with private object storage, signed URLs, validation, and retention rules.
3. Complete administrator invitations, invitation acceptance, and password-recovery flows.
4. Add automated tests for organization isolation, patient import, transfer approval, OTP expiry/retry behavior, and shared-record permissions.
5. Harden production configuration: stop ignoring TypeScript build errors, disable auth debug logging, add audit logging, validate all feature environment variables, and complete privacy/security review.

## Product direction

MediBridge is being built for hospitals in Nigeria and similar environments where records are often fragmented across facilities. Its central product principle is **minimum necessary sharing**: a receiving hospital should get the records needed for a care transition, for a limited time, after explicit approval—not unrestricted access to the patient's full history.
