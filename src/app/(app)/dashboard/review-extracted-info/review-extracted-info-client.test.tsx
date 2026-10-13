import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import type { PatientRecord } from "@/features/patients/schemas/patient-schema";
import { ReviewExtractedInfoClient, type ReviewDocument } from "./review-extracted-info-client";

const { savePatientsMock, retryExtractionMock, removeDocumentMock, refreshMock } = vi.hoisted(
	() => ({
		savePatientsMock: vi.fn(),
		retryExtractionMock: vi.fn(),
		removeDocumentMock: vi.fn(),
		refreshMock: vi.fn(),
	}),
);

vi.mock("@/features/patients/server/save-patients-action", () => ({
	savePatientsAction: savePatientsMock,
}));
vi.mock("@/features/patients/server/remove-extraction-document-action", () => ({
	removeExtractionDocumentAction: removeDocumentMock,
}));
vi.mock("@/features/patients/server/retry-patient-extraction-action", () => ({
	retryPatientExtractionAction: retryExtractionMock,
}));
vi.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: refreshMock }),
}));

function patient(firstName: string, lastName: string, patientId: string): PatientRecord {
	return {
		personalInfo: {
			firstName,
			middleName: "Chinwe",
			lastName,
			patientId,
			dateOfBirth: "1994-04-12",
			sex: "female",
			age: 32,
			maritalStatus: "single",
			nationalId: "NIN-001",
		},
		contactInfo: {
			phoneNumber: "08011111111",
			emailAddress: "patient@example.com",
			residentialAddress: "12 Hospital Road",
			stateOfOrigin: "Enugu",
			countryOfOrigin: "Nigeria",
		},
		emergencyInfo: {
			firstName: "Emeka",
			middleName: "Chidi",
			lastName,
			relationship: "brother",
			phone: "08022222222",
		},
		physicalInfo: { height: null, weight: null, bloodGroup: null, genotype: null },
	};
}

const documents: ReviewDocument[] = [
	{
		id: "ada.pdf",
		label: "Document 1",
		fileUrl: "/files/ada.pdf",
		status: "ready",
		patient: patient("Ada", "Okafor", "PAT-001"),
	},
	{
		id: "grace.docx",
		label: "Document 2",
		fileUrl: "/files/grace.docx",
		status: "ready",
		patient: patient("Grace", "Musa", "PAT-002"),
	},
	{
		id: "emeka.pdf",
		label: "Document 3",
		fileUrl: "/files/emeka.pdf",
		status: "failed",
		patient: null,
	},
];

const personalSection = () => within(screen.getByRole("region", { name: /Personal Information/ }));

beforeEach(() => {
	savePatientsMock.mockReset();
	savePatientsMock.mockResolvedValue({ status: "success", savedCount: 1 });
	retryExtractionMock.mockReset();
	removeDocumentMock.mockReset();
	removeDocumentMock.mockResolvedValue({ status: "success" });
	refreshMock.mockReset();
});

test("saves the edited patient, marks the document saved and moves to the next ready document", async () => {
	const user = userEvent.setup();
	render(<ReviewExtractedInfoClient extractionId="extraction-1" initialDocuments={documents} />);
	fireEvent.change(personalSection().getByRole("textbox", { name: "First name (required)" }), {
		target: { value: "Adanna" },
	});
	await user.click(screen.getByRole("button", { name: "Review Document 2" }));
	await user.click(screen.getByRole("button", { name: "Review Document 1" }));
	expect(personalSection().getByRole("textbox", { name: "First name (required)" })).toHaveValue(
		"Adanna",
	);
	await user.click(screen.getByRole("button", { name: "Save patient & review next" }));
	expect(savePatientsMock).toHaveBeenCalledWith(
		"extraction-1",
		"ada.pdf",
		expect.objectContaining({
			personalInfo: expect.objectContaining({ firstName: "Adanna", patientId: "PAT-001" }),
		}),
	);
	const savedCard = within(screen.getByRole("article", { name: "Document 1" }));
	expect(await savedCard.findByText("Saved")).toBeVisible();
	expect(savedCard.queryByRole("button", { name: /Remove/ })).not.toBeInTheDocument();
	expect(screen.getByRole("heading", { name: "Grace Musa" })).toBeVisible();
	const savedDocumentButton = screen.getByRole("button", { name: "Review Document 1" });
	await waitFor(() => expect(savedDocumentButton).toBeEnabled());
	await user.click(savedDocumentButton);
	expect(screen.getByRole("heading", { name: "Adanna Okafor" })).toBeVisible();
	expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
});

test("edits a saved patient without a patient ID field and saves the changes on the same document", async () => {
	const user = userEvent.setup();
	const savedDocument: ReviewDocument = { ...documents[0], status: "saved" };
	render(
		<ReviewExtractedInfoClient
			extractionId="extraction-1"
			initialDocuments={[savedDocument, documents[1]]}
		/>,
	);
	expect(
		within(screen.getByRole("article", { name: "Document 1" })).getByText("Saved"),
	).toBeVisible();
	expect(screen.getByRole("heading", { name: "Grace Musa" })).toBeVisible();
	await user.click(screen.getByRole("button", { name: "Review Document 1" }));
	expect(screen.getByRole("heading", { name: "Ada Okafor" })).toBeVisible();
	expect(personalSection().getByRole("textbox", { name: "First name (required)" })).toHaveValue(
		"Ada",
	);
	expect(personalSection().queryByRole("textbox", { name: /Patient ID/ })).not.toBeInTheDocument();
	fireEvent.change(personalSection().getByRole("textbox", { name: "First name (required)" }), {
		target: { value: "Adanna" },
	});
	await user.click(screen.getByRole("button", { name: "Save changes" }));
	expect(savePatientsMock).toHaveBeenCalledWith(
		"extraction-1",
		"ada.pdf",
		expect.objectContaining({
			personalInfo: expect.objectContaining({ firstName: "Adanna", patientId: "PAT-001" }),
		}),
	);
	expect(await screen.findByRole("status")).toHaveTextContent("Changes to Adanna Okafor saved.");
	expect(screen.getByRole("button", { name: "Review Document 1" })).toHaveAttribute(
		"aria-pressed",
		"true",
	);
	expect(screen.getByRole("heading", { name: "Adanna Okafor" })).toBeVisible();
});

test("keeps the document ready and shows the error when saving fails", async () => {
	const user = userEvent.setup();
	savePatientsMock.mockResolvedValueOnce({
		status: "failed",
		error: "Patient 1: patient ID PAT-001 is already in use.",
	});
	render(<ReviewExtractedInfoClient extractionId="extraction-1" initialDocuments={documents} />);
	const saveButton = screen.getByRole("button", { name: "Save patient & review next" });
	await user.click(saveButton);
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Patient 1: patient ID PAT-001 is already in use.",
	);
	const card = within(screen.getByRole("article", { name: "Document 1" }));
	expect(card.getByText("Ready to review")).toBeVisible();
	await waitFor(() => expect(saveButton).toBeEnabled());
	await user.click(saveButton);
	expect(await card.findByText("Saved")).toBeVisible();
	expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("removes a failed document from the saved extraction and keeps ready documents in review", async () => {
	const user = userEvent.setup();
	render(<ReviewExtractedInfoClient extractionId="extraction-1" initialDocuments={documents} />);
	for (const name of ["Document 1", "Document 2"]) {
		const card = within(screen.getByRole("article", { name }));
		expect(card.getByText("Ready to review")).toBeVisible();
		expect(card.queryByRole("button", { name: `Remove ${name}` })).not.toBeInTheDocument();
	}
	await user.click(screen.getByRole("button", { name: "Remove Document 3" }));
	expect(removeDocumentMock).toHaveBeenCalledWith("extraction-1", "emeka.pdf");
	await waitFor(() =>
		expect(screen.queryByRole("article", { name: "Document 3" })).not.toBeInTheDocument(),
	);
	expect(screen.getByRole("article", { name: "Document 1" })).toBeVisible();
	expect(screen.getByRole("article", { name: "Document 2" })).toBeVisible();
	expect(screen.getByRole("heading", { name: "Ada Okafor" })).toBeVisible();
});

test("keeps the document and shows the error when removing it fails", async () => {
	const user = userEvent.setup();
	removeDocumentMock.mockResolvedValueOnce({
		status: "failed",
		error: "We couldn’t remove this document. Please try again.",
	});
	render(<ReviewExtractedInfoClient extractionId="extraction-1" initialDocuments={documents} />);
	await user.click(screen.getByRole("button", { name: "Remove Document 3" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"We couldn’t remove this document. Please try again.",
	);
	expect(screen.getByRole("article", { name: "Document 3" })).toBeVisible();
});

test("opens a PDF source document in a new tab and offers a Word source document as a download", async () => {
	const user = userEvent.setup();
	render(<ReviewExtractedInfoClient extractionId="extraction-1" initialDocuments={documents} />);
	const viewLink = screen.getByRole("link", { name: "View document" });
	expect(viewLink).toHaveAttribute("href", "/files/ada.pdf");
	expect(viewLink).toHaveAttribute("target", "_blank");
	expect(screen.queryByRole("link", { name: "Download document" })).not.toBeInTheDocument();
	await user.click(screen.getByRole("button", { name: "Review Document 2" }));
	expect(screen.getByRole("link", { name: "Download document" })).toHaveAttribute(
		"href",
		"/files/grace.docx",
	);
	expect(screen.queryByRole("link", { name: "View document" })).not.toBeInTheDocument();
});

test("opens on the first ready document and does not open a failed document for review", async () => {
	render(
		<ReviewExtractedInfoClient
			extractionId="extraction-1"
			initialDocuments={[documents[2], documents[0]]}
		/>,
	);
	const failedCard = within(screen.getByRole("article", { name: "Document 3" }));
	expect(failedCard.getByText("Extraction failed")).toBeVisible();
	expect(failedCard.queryByRole("button", { name: "Review Document 3" })).not.toBeInTheDocument();
	expect(screen.getByRole("button", { name: "Review Document 1" })).toHaveAttribute(
		"aria-pressed",
		"true",
	);
	expect(screen.getByRole("heading", { name: "Ada Okafor" })).toBeVisible();
	expect(
		screen.queryByRole("heading", { name: "We couldn’t extract this record" }),
	).not.toBeInTheDocument();
});

test("retries a failed document in the saved extraction and opens its patient for review", async () => {
	const user = userEvent.setup();
	retryExtractionMock.mockResolvedValueOnce({
		status: "success",
		documents: [
			{ documentId: "emeka.pdf", status: "ready", patient: patient("Emeka", "Obi", "PAT-003") },
		],
	});
	render(<ReviewExtractedInfoClient extractionId="extraction-1" initialDocuments={documents} />);
	const card = within(screen.getByRole("article", { name: "Document 3" }));
	expect(card.getByText("Extraction failed")).toBeVisible();
	await user.click(card.getByRole("button", { name: "Try again for Document 3" }));
	expect(retryExtractionMock).toHaveBeenCalledWith("extraction-1", ["emeka.pdf"]);
	expect(await card.findByText("Ready to review")).toBeVisible();
	await user.click(screen.getByRole("button", { name: "Review Document 3" }));
	expect(screen.getByRole("heading", { name: "Emeka Obi" })).toBeVisible();
	expect(screen.getByRole("button", { name: "Save patient & review next" })).toBeEnabled();
});

test("keeps a document failed and retryable when it still cannot be extracted", async () => {
	const user = userEvent.setup();
	retryExtractionMock.mockResolvedValueOnce({
		status: "success",
		documents: [{ documentId: "emeka.pdf", status: "failed", patient: null }],
	});
	render(<ReviewExtractedInfoClient extractionId="extraction-1" initialDocuments={documents} />);
	const card = within(screen.getByRole("article", { name: "Document 3" }));
	await user.click(card.getByRole("button", { name: "Try again for Document 3" }));
	expect(await card.findByText("Extraction failed")).toBeVisible();
	expect(card.getByRole("button", { name: "Try again for Document 3" })).toBeEnabled();
	expect(screen.getByRole("status")).toHaveTextContent(
		"We couldn’t extract Document 3. Please try again.",
	);
});

test("shows the server's reason when a retry is refused", async () => {
	const user = userEvent.setup();
	retryExtractionMock.mockResolvedValueOnce({
		status: "failed",
		error: "These documents can’t be extracted again.",
	});
	render(<ReviewExtractedInfoClient extractionId="extraction-1" initialDocuments={documents} />);
	const card = within(screen.getByRole("article", { name: "Document 3" }));
	await user.click(card.getByRole("button", { name: "Try again for Document 3" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"These documents can’t be extracted again.",
	);
	expect(card.getByText("Extraction failed")).toBeVisible();
	expect(screen.getByRole("status")).not.toHaveTextContent("Please try again.");

	await user.click(screen.getByRole("button", { name: "Dismiss error" }));
	expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test.each([
	{
		button: "Save patient & review next",
		action: savePatientsMock,
		error: "You must be signed in to save patients.",
	},
	{
		button: "Try again for Document 3",
		action: retryExtractionMock,
		error: "Sign in to extract patient records.",
	},
	{
		button: "Remove Document 3",
		action: removeDocumentMock,
		error: "Sign in to remove patient documents.",
	},
])(
	"reloads the page to send a signed-out user to sign in from $button",
	async ({ button, action, error }) => {
		const user = userEvent.setup();
		action.mockResolvedValueOnce({ status: "unauthorized", error });
		render(<ReviewExtractedInfoClient extractionId="extraction-1" initialDocuments={documents} />);
		await user.click(screen.getByRole("button", { name: button }));
		await waitFor(() => expect(refreshMock).toHaveBeenCalled());
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	},
);

test("collapses a section without losing entered values and supports reopening from the keyboard", async () => {
	const user = userEvent.setup();
	render(<ReviewExtractedInfoClient extractionId="extraction-1" initialDocuments={documents} />);
	const section = personalSection();
	expect(section.getByRole("textbox", { name: "First name (required)" })).toHaveValue("Ada");
	const toggle = section.getByRole("button", { name: /Personal Information/ });
	await user.click(toggle);
	expect(toggle).toHaveAttribute("aria-expanded", "false");
	expect(section.queryByRole("textbox", { name: "First name (required)" })).not.toBeInTheDocument();
	toggle.focus();
	await user.keyboard("{Enter}");
	expect(toggle).toHaveAttribute("aria-expanded", "true");
	expect(section.getByRole("textbox", { name: "First name (required)" })).toHaveValue("Ada");
});

test("uses the custom calendar for required birth date and leaves physical information optional", async () => {
	const user = userEvent.setup();
	render(<ReviewExtractedInfoClient extractionId="extraction-1" initialDocuments={documents} />);
	const physicalSection = within(screen.getByRole("region", { name: /Physical Information/ }));
	for (const label of ["Height", "Weight", "Blood group", "Genotype"]) {
		const field = physicalSection.getByRole("textbox", { name: label });
		expect(field).toBeVisible();
		expect(field).not.toBeRequired();
	}
	for (const sectionName of [/Personal Information/, /Contact Information/, /Emergency Contact/]) {
		const section = within(screen.getByRole("region", { name: sectionName }));
		for (const field of section.getAllByRole("textbox")) expect(field).toBeRequired();
	}
	const birthDate = screen.getByRole("button", { name: "Date of birth (required)" });
	expect(birthDate).toHaveTextContent("April 12th, 1994");
	await user.click(birthDate);
	expect(screen.getByRole("grid")).toBeVisible();
	await user.keyboard("{Escape}");
	expect(birthDate).toHaveFocus();
});

test.each([null, "12/04/1994", "2023-02-30"])(
	"keeps an unusable birth date %s editable and blocks saving until it is corrected",
	async (dateOfBirth) => {
		const user = userEvent.setup();
		const document = structuredClone(documents[0]);
		document.patient!.personalInfo.dateOfBirth = dateOfBirth;
		render(<ReviewExtractedInfoClient extractionId="extraction-1" initialDocuments={[document]} />);
		const birthDate = screen.getByRole("button", { name: "Date of birth (required)" });
		expect(birthDate).toHaveTextContent(dateOfBirth ?? "Select date");
		await user.click(screen.getByRole("button", { name: /Personal Information/ }));
		await user.click(screen.getByRole("button", { name: "Save patient & review next" }));
		expect(birthDate).toBeVisible();
		expect(birthDate).toHaveAttribute("aria-invalid", "true");
		expect(birthDate).toHaveAccessibleDescription(
			dateOfBirth ? "Choose a valid date of birth." : "Date of birth is required.",
		);
		expect(savePatientsMock).not.toHaveBeenCalled();
		await user.click(birthDate);
		expect(screen.getByRole("grid")).toBeVisible();
	},
);

test("prevents edits, removal and selection changes until the patient save finishes", async () => {
	const user = userEvent.setup();
	let completeSave!: (result: { status: "success"; savedCount: number }) => void;
	savePatientsMock.mockReturnValueOnce(
		new Promise((resolve) => {
			completeSave = resolve;
		}),
	);
	render(<ReviewExtractedInfoClient extractionId="extraction-1" initialDocuments={documents} />);
	const firstName = personalSection().getByRole("textbox", { name: "First name (required)" });
	await user.click(screen.getByRole("button", { name: "Save patient & review next" }));
	await user.type(firstName, " edited");
	expect(firstName).toHaveValue("Ada");
	expect(screen.getByRole("button", { name: "Date of birth (required)" })).toBeDisabled();
	expect(screen.getByRole("button", { name: "Remove Document 3" })).toBeDisabled();
	expect(screen.getByRole("button", { name: "Review Document 2" })).toBeDisabled();
	await act(async () => {
		completeSave({ status: "success", savedCount: 1 });
	});
	expect(
		within(screen.getByRole("article", { name: "Document 1" })).getByText("Saved"),
	).toBeVisible();
	expect(screen.getByRole("heading", { name: "Grace Musa" })).toBeVisible();
	expect(screen.getByRole("button", { name: "Remove Document 3" })).toBeEnabled();
	expect(
		personalSection().getByRole("textbox", { name: "First name (required)" }),
	).not.toHaveAttribute("readonly");
});
