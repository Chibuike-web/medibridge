import { SectionData } from "./types";

export function formatPatientLabel(values: SectionData) {
	const firstName = typeof values.firstName === "string" ? values.firstName : "";
	const lastName = typeof values.lastName === "string" ? values.lastName : "";
	const patientId = typeof values.patientId === "string" ? values.patientId : null;
	const fullName = [firstName, lastName].filter(Boolean).join(" ");

	return fullName ? `${fullName} - ${formatPatientId(patientId)}` : formatPatientId(patientId);
}

export function formatPatientId(patientId: string | null) {
	if (!patientId) return "No ID";
	const cleaned = patientId.replace(/[^a-zA-Z0-9]/g, "");
	return cleaned.replace(/(.{3})/g, "$1-").replace(/-$/, "");
}
