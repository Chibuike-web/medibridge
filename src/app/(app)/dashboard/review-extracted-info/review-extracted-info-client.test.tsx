import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import type { PatientRecord } from "@/features/patients/schemas/patient-schema";
import { ReviewExtractedInfoClient, type ReviewDocument } from "./review-extracted-info-client";

const {
	savePatientsMock,
	retryExtractionMock,
	removeDocumentMock,
	discardExtractionMock,
	refreshMock,
	pushMock,
} = vi.hoisted(() => ({
	savePatientsMock: vi.fn(),
	retryExtractionMock: vi.fn(),
	removeDocumentMock: vi.fn(),
	discardExtractionMock: vi.fn(),
	refreshMock: vi.fn(),
	pushMock: vi.fn(),
}));

vi.mock("@/features/patients/server/save-patients-action", () => ({
	savePatientsAction: savePatientsMock,
}));
vi.mock("@/features/patients/server/remove-extraction-document-action", () => ({
	removeExtractionDocumentAction: removeDocumentMock,
}));
vi.mock("@/features/patients/server/discard-patient-extraction-action", () => ({
	discardPatientExtractionAction: discardExtractionMock,
}));
vi.mock("@/features/patients/server/retry-patient-extraction-action", () => ({
	retryPatientExtractionAction: retryExtractionMock,
}));
vi.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: refreshMock, push: pushMock }),
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
	discardExtractionMock.mockReset();
	discardExtractionMock.mockResolvedValue({ status: "success" });
	refreshMock.mockReset();
	pushMock.mockReset();
});

test("saves the edited patient, removes its document from review and moves to the next ready document", async () => {
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
			personalInfo: expect.objectContaining({ firstName: "Adanna" }),
		}),
	);
	await waitFor(() =>
		expect(screen.queryByRole("article", { name: "Document 1" })).not.toBeInTheDocument(),
	);
	expect(screen.getByRole("heading", { name: "Grace Musa" })).toBeVisible();
	expect(screen.getByRole("status")).toHaveTextContent("Adanna Okafor saved.");
	expect(pushMock).not.toHaveBeenCalled();
});

test("continues to the dashboard after the last document is saved", async () => {
	const user = userEvent.setup();
	render(
		<ReviewExtractedInfoClient extractionId="extraction-1" initialDocuments={[documents[0]]} />,
	);
	await user.click(screen.getByRole("button", { name: "Save patient & review next" }));
	expect(savePatientsMock).toHaveBeenCalledWith("extraction-1", "ada.pdf", expect.anything());
	await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/dashboard/overview"));
});

test("drops a document that can no longer be saved, explains why and opens the next one", async () => {
	const user = userEvent.setup();
	savePatientsMock.mockResolvedValueOnce({
		status: "invalid",
		error: "This document can’t be saved.",
	});
	render(<ReviewExtractedInfoClient extractionId="extraction-1" initialDocuments={documents} />);
	expect(screen.getByRole("article", { name: "Document 1" })).toBeVisible();
	await user.click(screen.getByRole("button", { name: "Save patient & review next" }));
	expect(await screen.findByRole("alert")).toHaveTextContent("This document can’t be saved.");
	expect(screen.queryByRole("article", { name: "Document 1" })).not.toBeInTheDocument();
	expect(screen.getByRole("heading", { name: "Grace Musa" })).toBeVisible();
	expect(screen.getByRole("status")).not.toHaveTextContent("saved.");
});

test("keeps the document ready and shows the error when saving fails", async () => {
	const user = userEvent.setup();
	savePatientsMock.mockResolvedValueOnce({
		status: "failed",
		error: "We couldn’t save this patient. Please try again.",
	});
	render(<ReviewExtractedInfoClient extractionId="extraction-1" initialDocuments={documents} />);
	const saveButton = screen.getByRole("button", { name: "Save patient & review next" });
	await user.click(saveButton);
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"We couldn’t save this patient. Please try again.",
	);
	const card = within(screen.getByRole("article", { name: "Document 1" }));
	expect(card.getByText("Ready to review")).toBeVisible();
	await waitFor(() => expect(saveButton).toBeEnabled());
	await user.click(saveButton);
	await waitFor(() =>
		expect(screen.queryByRole("article", { name: "Document 1" })).not.toBeInTheDocument(),
	);
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

test("opens on the first ready document and explains why a failed document cannot be reviewed", async () => {
	const user = userEvent.setup();
	render(
		<ReviewExtractedInfoClient
			extractionId="extraction-1"
			initialDocuments={[documents[2], documents[0]]}
		/>,
	);
	expect(screen.getByRole("button", { name: "Review Document 1" })).toHaveAttribute(
		"aria-pressed",
		"true",
	);
	expect(screen.getByRole("heading", { name: "Ada Okafor" })).toBeVisible();
	await user.click(screen.getByRole("button", { name: "Review Document 3" }));
	expect(screen.getByRole("heading", { name: "We couldn’t extract this record" })).toBeVisible();
	expect(screen.getByText("Try again, or remove the document from the list.")).toBeVisible();
	const viewDocument = screen.getByRole("link", { name: "View document" });
	expect(viewDocument).toHaveAttribute("href", "/files/emeka.pdf");
	expect(viewDocument).toHaveAttribute("target", "_blank");
	expect(screen.queryByRole("heading", { name: "Ada Okafor" })).not.toBeInTheDocument();
	expect(screen.getByRole("button", { name: "Save patient & review next" })).toBeDisabled();
});

test("opens the next ready document after removing the failed document under review", async () => {
	const user = userEvent.setup();
	render(
		<ReviewExtractedInfoClient
			extractionId="extraction-1"
			initialDocuments={[documents[2], documents[0]]}
		/>,
	);
	await user.click(screen.getByRole("button", { name: "Review Document 3" }));
	expect(screen.getByRole("heading", { name: "We couldn’t extract this record" })).toBeVisible();
	await user.click(screen.getByRole("button", { name: "Remove Document 3" }));
	expect(await screen.findByRole("heading", { name: "Ada Okafor" })).toBeVisible();
	expect(screen.queryByRole("article", { name: "Document 3" })).not.toBeInTheDocument();
	expect(pushMock).not.toHaveBeenCalled();
});

test("continues to the dashboard after the last document is removed", async () => {
	const user = userEvent.setup();
	render(
		<ReviewExtractedInfoClient extractionId="extraction-1" initialDocuments={[documents[2]]} />,
	);
	expect(screen.getByRole("heading", { name: "We couldn’t extract this record" })).toBeVisible();
	await user.click(screen.getByRole("button", { name: "Remove Document 3" }));
	expect(removeDocumentMock).toHaveBeenCalledWith("extraction-1", "emeka.pdf");
	await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/dashboard/overview"));
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
	expect(screen.queryByRole("article", { name: "Document 1" })).not.toBeInTheDocument();
	expect(screen.getByRole("heading", { name: "Grace Musa" })).toBeVisible();
	expect(screen.getByRole("button", { name: "Remove Document 3" })).toBeEnabled();
	expect(
		personalSection().getByRole("textbox", { name: "First name (required)" }),
	).not.toHaveAttribute("readonly");
});

test("asks before discarding unsaved documents and keeps reviewing when the user cancels", async () => {
	const user = userEvent.setup();
	render(<ReviewExtractedInfoClient extractionId="extraction-1" initialDocuments={documents} />);
	await user.click(screen.getByRole("button", { name: "Continue to dashboard" }));
	const dialog = screen.getByRole("alertdialog", { name: "Leave review?" });
	expect(dialog).toHaveTextContent(
		"You have 2 patients you haven’t saved. Leaving will discard them and the 1 document that couldn’t be extracted. Saved patients will remain available.",
	);
	await user.click(within(dialog).getByRole("button", { name: "Keep reviewing" }));
	expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
	expect(discardExtractionMock).not.toHaveBeenCalled();
	expect(pushMock).not.toHaveBeenCalled();
	expect(screen.getByRole("heading", { name: "Ada Okafor" })).toBeVisible();
});

test.each([
	{ button: "Remove Document 3", action: removeDocumentMock },
	{ button: "Try again for Document 3", action: retryExtractionMock },
])(
	"drops a document already removed elsewhere and says so after $button",
	async ({ button, action }) => {
		const user = userEvent.setup();
		action.mockResolvedValueOnce({
			status: "invalid",
			error: "This document was already removed.",
		});
		render(<ReviewExtractedInfoClient extractionId="extraction-1" initialDocuments={documents} />);
		expect(screen.getByRole("article", { name: "Document 3" })).toBeVisible();
		await user.click(screen.getByRole("button", { name: button }));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"This document was already removed.",
		);
		expect(screen.queryByRole("article", { name: "Document 3" })).not.toBeInTheDocument();
		expect(screen.getByRole("article", { name: "Document 1" })).toBeVisible();
	},
);

test("opens a remaining document when the one selected during its retry was already removed", async () => {
	const user = userEvent.setup();
	let finishRetry!: (result: unknown) => void;
	retryExtractionMock.mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				finishRetry = resolve;
			}),
	);
	render(<ReviewExtractedInfoClient extractionId="extraction-1" initialDocuments={documents} />);
	await user.click(screen.getByRole("button", { name: "Try again for Document 3" }));
	await user.click(screen.getByRole("button", { name: "Review Document 3" }));
	expect(screen.getByRole("button", { name: "Review Document 3" })).toHaveAttribute(
		"aria-pressed",
		"true",
	);
	await act(async () =>
		finishRetry({ status: "invalid", error: "This document was already removed." }),
	);
	expect(screen.queryByRole("article", { name: "Document 3" })).not.toBeInTheDocument();
	expect(screen.getByRole("heading", { name: "Ada Okafor" })).toBeVisible();
});

test("only mentions the documents that couldn’t be extracted when no patients are left to save", async () => {
	const user = userEvent.setup();
	render(
		<ReviewExtractedInfoClient extractionId="extraction-1" initialDocuments={[documents[2]]} />,
	);
	await user.click(screen.getByRole("button", { name: "Continue to dashboard" }));
	expect(screen.getByRole("alertdialog", { name: "Leave review?" })).toHaveTextContent(
		"Leaving will discard the 1 document that couldn’t be extracted. Saved patients will remain available.",
	);
});

test("discards the review and continues to the dashboard when the user confirms", async () => {
	const user = userEvent.setup();
	render(<ReviewExtractedInfoClient extractionId="extraction-1" initialDocuments={documents} />);
	await user.click(screen.getByRole("button", { name: "Continue to dashboard" }));
	await user.click(screen.getByRole("button", { name: "Discard and continue" }));
	expect(discardExtractionMock).toHaveBeenCalledWith("extraction-1");
	await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/dashboard/overview"));
});

test("stays on the review and shows the error when discarding fails", async () => {
	const user = userEvent.setup();
	discardExtractionMock.mockResolvedValueOnce({
		status: "failed",
		error: "We couldn’t clear this review. Please try again.",
	});
	render(<ReviewExtractedInfoClient extractionId="extraction-1" initialDocuments={documents} />);
	await user.click(screen.getByRole("button", { name: "Continue to dashboard" }));
	await user.click(screen.getByRole("button", { name: "Discard and continue" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"We couldn’t clear this review. Please try again.",
	);
	expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
	expect(pushMock).not.toHaveBeenCalled();
	expect(screen.getByRole("heading", { name: "Ada Okafor" })).toBeVisible();
});

test("offers Nigerian states for state of origin and saves the chosen state", async () => {
	const user = userEvent.setup();
	render(<ReviewExtractedInfoClient extractionId="extraction-1" initialDocuments={documents} />);
	const contactSection = within(screen.getByRole("region", { name: /Contact Information/ }));
	const stateOfOrigin = contactSection.getByRole("combobox", {
		name: "State of origin (required)",
	});
	expect(stateOfOrigin).toHaveTextContent("Enugu");
	expect(
		contactSection.getByRole("combobox", { name: "Country of origin (required)" }),
	).toHaveTextContent("Nigeria");
	await user.click(stateOfOrigin);
	await user.click(screen.getByRole("option", { name: "Lagos" }));
	expect(stateOfOrigin).toHaveTextContent("Lagos");
	await user.click(screen.getByRole("button", { name: "Save patient & review next" }));
	expect(savePatientsMock).toHaveBeenCalledWith(
		"extraction-1",
		"ada.pdf",
		expect.objectContaining({
			contactInfo: expect.objectContaining({ stateOfOrigin: "Lagos", countryOfOrigin: "Nigeria" }),
		}),
	);
});

test("matches an extracted state written with a different case and a State suffix", () => {
	const document = structuredClone(documents[0]);
	document.patient!.contactInfo.stateOfOrigin = "ENUGU State";
	render(<ReviewExtractedInfoClient extractionId="extraction-1" initialDocuments={[document]} />);
	expect(
		within(screen.getByRole("region", { name: /Contact Information/ })).getByRole("combobox", {
			name: "State of origin (required)",
		}),
	).toHaveTextContent("Enugu");
});

test("keeps edited patient fields and lets the user retry when a save request is rejected", async () => {
	const user = userEvent.setup();
	savePatientsMock.mockRejectedValueOnce(new Error("Connection lost"));
	render(<ReviewExtractedInfoClient extractionId="extraction-1" initialDocuments={documents} />);
	fireEvent.change(personalSection().getByRole("textbox", { name: "First name (required)" }), {
		target: { value: "Adanna" },
	});
	await user.click(screen.getByRole("button", { name: "Save patient & review next" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"We couldn’t save this patient. Please try again.",
	);
	expect(personalSection().getByRole("textbox", { name: "First name (required)" })).toHaveValue(
		"Adanna",
	);
	const saveButton = await screen.findByRole("button", { name: "Save patient & review next" });
	await waitFor(() => expect(saveButton).toBeEnabled());
	await user.click(saveButton);
	expect(savePatientsMock).toHaveBeenLastCalledWith(
		"extraction-1",
		"ada.pdf",
		expect.objectContaining({ personalInfo: expect.objectContaining({ firstName: "Adanna" }) }),
	);
	await waitFor(() =>
		expect(screen.queryByRole("article", { name: "Document 1" })).not.toBeInTheDocument(),
	);
});

test("keeps a failed document removable after a rejected removal request", async () => {
	const user = userEvent.setup();
	removeDocumentMock.mockRejectedValueOnce(new Error("Connection lost"));
	render(<ReviewExtractedInfoClient extractionId="extraction-1" initialDocuments={documents} />);
	const card = within(screen.getByRole("article", { name: "Document 3" }));
	await user.click(card.getByRole("button", { name: "Remove Document 3" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"We couldn’t remove this document. Please try again.",
	);
	expect(card.getByText("Extraction failed")).toBeVisible();
	const removeButton = card.getByRole("button", { name: "Remove Document 3" });
	await waitFor(() => expect(removeButton).toBeEnabled());
	await user.click(removeButton);
	await waitFor(() =>
		expect(screen.queryByRole("article", { name: "Document 3" })).not.toBeInTheDocument(),
	);
});

test("restores retry controls after a rejected extraction request and can retry again", async () => {
	const user = userEvent.setup();
	retryExtractionMock.mockRejectedValueOnce(new Error("Connection lost"));
	retryExtractionMock.mockResolvedValueOnce({
		status: "success",
		documents: [
			{ documentId: "emeka.pdf", status: "ready", patient: patient("Emeka", "Okafor", "PAT-003") },
		],
	});
	render(<ReviewExtractedInfoClient extractionId="extraction-1" initialDocuments={documents} />);
	const card = within(screen.getByRole("article", { name: "Document 3" }));
	await user.click(card.getByRole("button", { name: "Try again for Document 3" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"We couldn’t extract Document 3. Please try again.",
	);
	expect(card.getByText("Extraction failed")).toBeVisible();
	await user.click(card.getByRole("button", { name: "Try again for Document 3" }));
	expect(await card.findByText("Ready to review")).toBeVisible();
});

test("keeps the review available after a rejected discard request and can leave on retry", async () => {
	const user = userEvent.setup();
	discardExtractionMock.mockRejectedValueOnce(new Error("Connection lost"));
	render(<ReviewExtractedInfoClient extractionId="extraction-1" initialDocuments={documents} />);
	await user.click(screen.getByRole("button", { name: "Continue to dashboard" }));
	await user.click(screen.getByRole("button", { name: "Discard and continue" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"We couldn’t clear this review. Please try again.",
	);
	expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
	expect(screen.getByRole("heading", { name: "Ada Okafor" })).toBeVisible();
	expect(pushMock).not.toHaveBeenCalled();
	const continueButton = screen.getByRole("button", { name: "Continue to dashboard" });
	await waitFor(() => expect(continueButton).toBeEnabled());
	await user.click(continueButton);
	await user.click(screen.getByRole("button", { name: "Discard and continue" }));
	await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/dashboard/overview"));
});
