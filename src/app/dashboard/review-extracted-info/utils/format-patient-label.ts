import { SectionData } from "./types";

export function formatPatientLabel(values: SectionData) {
	const firstName = typeof values.firstName === "string" ? values.firstName : "";
	const lastName = typeof values.lastName === "string" ? values.lastName : "";
	const fullName = [firstName, lastName].filter(Boolean).join(" ");

	return fullName || "Unnamed Patient";
}
