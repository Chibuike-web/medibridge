# Known bugs

Found while writing behaviour tests for the patient-record section tables on 2026-09-11. None of these have been fixed. Line numbers refer to the working tree on that date and will drift.

## Patient-record tables

### 1. Imaging modality filter pills are mislabelled
- Where: `src/features/patients/components/imaging-table.tsx` lines 705 and 961-966.
- What happens: filter options read "CT", "MRI", "X-ray", but the active filter pills render "Modality: Ct", "Modality: Mri", "Modality: X Ray".
- Expected: pills use the same label as the option the user chose.
- Related: the same label helper in `lab-tests-table.tsx` lines 931-936 turns the "Within range" option into "Flag: Within Range".
- Test: covered by an `it.todo` in `imaging-table.test.tsx`.

### 2. Checkbox filters cannot be operated by keyboard
- Where: `diagnoses-table.tsx` lines 259-287, `allergies-table.tsx` lines 650-676, `medications-table.tsx` lines 571-597. The same pattern is likely in the other tables.
- What happens: after opening the Status submenu from the keyboard, Tab never moves focus into the checkbox, and Space or Enter on the menu item is consumed by `onSelect` with `preventDefault`, so the filter callback never fires.
- Expected: a keyboard user can toggle a filter.
- Note: mouse interaction works.

### 3. Clicking a row's text does not open the row
- Where: every section table. Examples: `lab-tests-table.tsx` line 985 (and 1005, 1015, 1026, 1036), `procedures-table.tsx` lines 428-432, `immunizations-table.tsx` lines 438-442, `vitals-table.tsx` lines 455-461.
- What happens: each cell wraps its content in a div with `onClick={stopPropagation}`, so clicking the visible text does nothing. Only a click on the cell padding, or keyboard Enter/Space, opens the details drawer.
- Expected: the row has `role="button"` and a pointer cursor, so clicking anywhere on it should open the row. If the wrapper exists to protect the copy-ID button and action menu, it should be limited to those controls.

### 4. Rows-per-page select has no accessible name
- Where: every section table. Examples: `encounters-table.tsx` lines 506-508, `procedures-table.tsx` lines 459-461, `immunizations-table.tsx` lines 469-471, `diagnoses-table.tsx` line 590.
- What happens: `aria-label="Rows per page"` is placed on `SelectValue`, a span, so it does not become the name of the combobox. Screen readers announce an unnamed combobox.
- Expected: the `aria-label` belongs on `SelectTrigger`.

### 5. Documents row menu has a dead action and a duplicate
- Where: `src/features/patients/components/documents-table.tsx`.
- "Remove" at lines 941-944 has no handler; choosing it does nothing.
- "Open" at lines 929-935 is identical to "View details".
- Expected: Remove deletes or archives the document (the server action `remove-patient-document-action.ts` exists), and Open either opens the file or is dropped.

### 6. Documents type filter omits "Radiology Report"
- Where: `documents-table.tsx` lines 148-155 versus `document-details-drawer.tsx` lines 34-42.
- What happens: the details drawer lets a user assign the type "Radiology Report", but the filter list does not include it, so such documents can never be filtered by type.

### 7. Documents controls stay enabled while loading
- Where: `documents-table.tsx` lines 277-288 (type checkboxes) and 453-458 (rows-per-page).
- What happens: these controls remain enabled while `isPending` is true. The lab-tests and imaging tables disable the same controls during loading.
- Expected: consistent pending behaviour across tables.

### 8. Medication details drawer hides the clinical note in view mode
- Where: `src/features/patients/components/medication-details-drawer.tsx` lines 206-215.
- What happens: the view-mode overview omits `clinicalNote`; it only appears in the edit form at line 435.
- Expected: shown in view mode, as the diagnosis drawer (`diagnosis-details-drawer.tsx` line 208) and allergy drawer (`allergy-details-drawer.tsx` line 191) do.

### 9. Dead code in documents-table.tsx
- `fileFormat` helper at lines 118-124 is unused.
- `LegacyDocumentDetailsDrawer` and `LegacyCreateDocumentDrawer` from line 953 to 1328 are unused.

## Vitals

### 10. Chart tooltip always reports "Normal"
- Where: `src/features/patients/components/vitals-chart.tsx` line 228.
- What happens: the hover card shows a hardcoded green "Normal" for every reading regardless of value.
- Expected: status derived from the reading against the metric's normal range, with High/Low states.
- Test: not covered. Suggest extracting the status calculation into a plain function and testing it directly.

### 11. Vitals table test is out of date with the summary label
- Where: `src/features/patients/components/vitals-table.test.tsx` line 101.
- What happens: the test looks for the text "Current" but the chart now renders "Current:", so the test fails. The figures themselves are correct.
- Expected: update the matcher once the label wording is settled.

## Test-suite notes (not product bugs)

- Three custom-calendar tests (immunizations, medications, procedures) exceed the default 5-second timeout when all patient-component test files run in parallel. They pass in isolation. Raising `testTimeout` in `vitest.config.ts` to around 15 seconds would settle it.
- Action items with no handler (Export, Archive, Mark as completed, Cancel, Remove) are only asserted for visibility in the current tests. They should become `it.todo` entries naming the expected outcome so the gap stays visible.
