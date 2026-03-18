# MediBridge

MediBridge is a web-based platform for managing and transferring patient records between hospitals. It focuses on structured data capture, clean workflows, and patient-controlled interoperability across facilities.

## Overview

Healthcare systems still rely on fragmented, paper-heavy processes. MediBridge provides a unified interface where hospitals can:

- Create and manage patient profiles
- Capture structured medical records across encounters
- Transfer patient data between hospitals in controlled formats
- Reduce duplication and manual data entry

The product is designed as a web-first system with a focus on clarity, speed, and reliability in clinical workflows.

## Core Features

### Patient Onboarding

Upload a document with patient details. The system extracts personal information and presents it for review before creating a profile.

- Supports multiple patient entries
- AI-assisted parsing for faster onboarding
- Manual correction before confirmation

### Patient Records

Each patient has structured data across:

- Overview
- Details
- Appointments
- Medical History
- Medications
- Encounters
- Labs
- Imaging
- Documents

### Encounters

Encounters act as the central unit of care.

- Capture vitals, diagnoses, medications, notes
- Track updates to medications across visits
- Maintain a timeline of care

### Medications

- Add, modify, discontinue, or complete medications per encounter
- Track history of changes over time

### Record Transfer

Hospitals can send patient records to other facilities.

- Select an existing patient
- Choose destination hospital
- Export in multiple formats such as PDF or document-based files
- Maintain consistency across systems

## Tech Stack

- Frontend: Next.js (App Router)
- Styling: Tailwind CSS
- State Management: Zustand
- Forms: React Hook Form + Zod

## Getting Started

Run the development server:

```bash
npm run dev
# or
pnpm dev
# or
bun dev


## Deployment

Optimized for deployment on Vercel.

## Notes

MediBridge is built with a focus on real-world hospital workflows in Nigeria and similar environments where interoperability and usability gaps are still significant.
```
