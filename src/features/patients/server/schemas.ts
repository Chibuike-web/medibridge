import { addDays, format } from "date-fns";
import { z } from "zod";

export const updatePatientPersonalInformationSchema = z.object({
	firstName: z.string().trim().min(1, "First name is required."),
	middleName: z.string().trim().optional(),
	lastName: z.string().trim().min(1, "Last name is required."),
	age: z.preprocess(
		(value) => (value === "" || value === null ? undefined : value),
		z.coerce
			.number()
			.int("Enter an age from 0 to 150.")
			.min(0, "Enter an age from 0 to 150.")
			.max(150, "Enter an age from 0 to 150.")
			.optional(),
	),
	dateOfBirth: z.string().trim().optional(),
	sex: z.string().trim().optional(),
	maritalStatus: z.string().trim().optional(),
	nationalId: z.string().trim().optional(),
});

export const updatePatientContactInformationSchema = z.object({
	phoneNumber: z.string().trim().optional(),
	emailAddress: z.preprocess(
		(value) => (value === "" || value === null ? undefined : value),
		z.string().trim().toLowerCase().email("Enter a valid email address.").optional(),
	),
	residentialAddress: z.string().trim().optional(),
	stateOfOrigin: z.string().trim().optional(),
	countryOfOrigin: z.string().trim().optional(),
});

export const updatePatientEmergencyContactSchema = z.object({
	firstName: z.string().trim().min(1, "First name is required."),
	middleName: z.string().trim().optional(),
	lastName: z.string().trim().min(1, "Last name is required."),
	relationship: z.string().trim().optional(),
	phoneNumber: z.string().trim().optional(),
});

export const updatePatientPhysicalInformationSchema = z.object({
	height: z.string().trim().optional(),
	weight: z.string().trim().optional(),
	bloodGroup: z.string().trim().optional(),
	genotype: z.string().trim().optional(),
});

export const encounterTypes = [
	"Outpatient Visit",
	"Follow-up Visit",
	"Routine Checkup",
	"Emergency Visit",
] as const;

export const encounterDepartments = [
	"General Medicine",
	"Family Medicine",
	"Emergency Medicine",
	"Cardiology",
	"Endocrinology",
	"Nephrology",
] as const;

export const patientEncounterSchema = z.object({
	encounterType: z.enum(encounterTypes, "Select an encounter type."),
	department: z.enum(encounterDepartments, "Select a department."),
	physician: z.string().trim().min(1, "Enter the physician."),
	encounterDate: z.coerce
		.date("Enter the encounter date.")
		.refine(
			(date) => date.getTime() <= Date.now() + 5 * 60 * 1000,
			"The encounter date can’t be in the future.",
		),
	reason: z.string().trim().optional(),
});

export const diagnosisSeverityStages = [
	"Mild",
	"Moderate",
	"Severe",
	"Stage 1",
	"Stage 2",
	"Stage 3",
] as const;

export const diagnosisStatuses = ["Active", "Resolved"] as const;

export const patientDiagnosisSchema = z.object({
	diagnosisName: z.string().trim().min(1, "Enter the diagnosis name."),
	severityStage: z.enum(diagnosisSeverityStages, "Select a severity or stage.").optional(),
	status: z.enum(diagnosisStatuses, "Select a status."),
	diagnosedAt: z.iso
		.date("Select the diagnosis date.")
		.refine(
			(date) => date <= format(addDays(new Date(), 1), "yyyy-MM-dd"),
			"The diagnosis date can’t be in the future.",
		),
	diagnosedBy: z.string().trim().min(1, "Enter who made the diagnosis."),
	clinicalNote: z.string().trim().optional(),
});

export const allergySeverities = ["Mild", "Moderate", "Severe"] as const;

export const allergyStatuses = ["Active", "Inactive"] as const;

export const patientAllergySchema = z.object({
	allergen: z.string().trim().min(1, "Enter the allergen."),
	severity: z.enum(allergySeverities, "Select a severity."),
	status: z.enum(allergyStatuses, "Select a status."),
	reaction: z.string().trim().min(1, "Describe the reaction."),
	clinicalNote: z.string().trim().optional(),
});

export const medicationStatuses = ["Active", "Completed", "Discontinued"] as const;

export const medicationRoutes = ["Oral", "IV", "Inhalation"] as const;

export const patientMedicationSchema = z.object({
	medicationName: z.string().trim().min(1, "Enter the medication."),
	indication: z.string().trim().min(1, "Enter the indication."),
	status: z.enum(medicationStatuses, "Select a status."),
	dose: z.string().trim().min(1, "Enter the dose."),
	route: z.enum(medicationRoutes, "Select a route."),
	prescribedBy: z.string().trim().min(1, "Enter who prescribed it."),
	frequency: z.string().trim().min(1, "Enter how often it is taken."),
	duration: z.string().trim().min(1, "Enter how long it is taken for."),
	startedAt: z.iso
		.date("Select the start date.")
		.refine(
			(date) => date <= format(addDays(new Date(), 1), "yyyy-MM-dd"),
			"The start date can’t be in the future.",
		),
	clinicalNote: z.string().trim().optional(),
});

export const immunizationSeriesTypes = ["Primary", "Booster"] as const;

export const immunizationStatuses = ["Active", "Completed", "Cancelled", "Discontinued"] as const;

export const patientImmunizationSchema = z
	.object({
		vaccineName: z.string().trim().min(1, "Enter the vaccine name."),
		seriesType: z.enum(immunizationSeriesTypes, "Select a series type.").optional(),
		currentDose: z.coerce
			.number("Enter the current dose as a number.")
			.int()
			.min(1, "Enter the current dose as a number."),
		totalDoses: z.coerce
			.number("Enter the total doses as a number.")
			.int()
			.min(1, "Enter the total doses as a number."),
		status: z.enum(immunizationStatuses, "Select a status."),
		dateAdministered: z.iso
			.date("Select the date administered.")
			.refine(
				(date) => date <= format(addDays(new Date(), 1), "yyyy-MM-dd"),
				"The date administered can’t be in the future.",
			),
		administeredBy: z.string().trim().min(1, "Enter who administered it."),
		clinicalNote: z.string().trim().optional(),
	})
	.refine((immunization) => immunization.currentDose <= immunization.totalDoses, {
		message: "The current dose can’t be more than the total doses.",
	});

export const procedureStatuses = ["Pending", "Completed", "Cancelled"] as const;

export const patientProcedureSchema = z
	.object({
		procedureName: z.string().trim().min(1, "Enter the procedure."),
		indication: z.string().trim().optional(),
		status: z.enum(procedureStatuses, "Select a status."),
		procedureDate: z.iso.date("Select the procedure date."),
		physician: z.string().trim().min(1, "Enter the physician."),
		assistants: z.string().trim().min(1, "Add at least one assistant."),
		facility: z.string().trim().min(1, "Enter the facility."),
		clinicalNote: z.string().trim().optional(),
	})
	.refine(
		(procedure) =>
			procedure.status !== "Completed" ||
			procedure.procedureDate <= format(addDays(new Date(), 1), "yyyy-MM-dd"),
		{ message: "A completed procedure can’t be dated in the future." },
	);

export const recordFileExtensions = {
	"application/pdf": ".pdf",
	"image/png": ".png",
	"image/jpeg": ".jpg",
} as const;

export const labTestStatuses = ["Pending", "Completed", "Cancelled"] as const;

export const labTestFlags = [
	"Within range",
	"Low",
	"High",
	"Critical",
	"Abnormal",
	"Inconclusive",
] as const;

export const patientLabTestSchema = z
	.object({
		testName: z.string().trim().min(1, "Enter the test."),
		status: z.enum(labTestStatuses, "Select a status."),
		flag: z.enum(labTestFlags, "Select a flag.").optional(),
		referenceRange: z.string().trim().optional(),
		orderedBy: z.string().trim().min(1, "Enter who ordered the test."),
		orderedAt: z.iso
			.date("Select the order date.")
			.refine(
				(date) => date <= format(addDays(new Date(), 1), "yyyy-MM-dd"),
				"The order date can’t be in the future.",
			),
		specimen: z.string().trim().min(1, "Enter the specimen."),
		result: z.string().trim().optional(),
		interpretation: z.string().trim().optional(),
		clinicalNote: z.string().trim().optional(),
	})
	.refine((labTest) => labTest.status !== "Completed" || labTest.result, {
		message: "Enter the result of a completed lab test.",
	})
	.refine((labTest) => labTest.status !== "Completed" || labTest.flag, {
		message: "Select a flag for a completed lab test.",
	});

export const imagingStatuses = ["Pending", "Completed", "Cancelled"] as const;

export const imagingModalities = ["CT", "MRI", "Ultrasound", "X-ray"] as const;

export const patientImagingSchema = z
	.object({
		study: z.string().trim().min(1, "Enter the study."),
		region: z.string().trim().min(1, "Enter the region."),
		modality: z.enum(imagingModalities, "Select a modality."),
		orderedAt: z.iso
			.date("Select the order date.")
			.refine(
				(date) => date <= format(addDays(new Date(), 1), "yyyy-MM-dd"),
				"The order date can’t be in the future.",
			),
		orderedBy: z.string().trim().min(1, "Enter who ordered the study."),
		status: z.enum(imagingStatuses, "Select a status."),
		impression: z.string().trim().optional(),
		clinicalNote: z.string().trim().optional(),
	})
	.refine((imaging) => imaging.status !== "Completed" || imaging.impression, {
		message: "Enter the impression of a completed study.",
	});
