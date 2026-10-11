import { clinicalRecords } from "@/features/transfers/data";
import type { ClinicalRecordType } from "@/features/transfers/types";
import { getPatientAllergies } from "@/lib/api/get-patient-allergies";
import { getPatientDiagnoses } from "@/lib/api/get-patient-diagnoses";
import { getPatientImaging } from "@/lib/api/get-patient-imaging";
import { getPatientImmunizations } from "@/lib/api/get-patient-immunizations";
import { getPatientLabTests } from "@/lib/api/get-patient-lab-tests";
import { getPatientMedications } from "@/lib/api/get-patient-medications";
import { getPatientProcedures } from "@/lib/api/get-patient-procedures";
import { getSessionData } from "@/lib/api/get-session-data";
import { getOrganizationId } from "@/lib/api/get-organization-id";

type ClinicalRecordOption = {
	id: string;
	name: string;
	type: ClinicalRecordType;
	createdAt?: string;
};

const clinicalRecordTypeLabels = new Map(
	clinicalRecords.map((clinicalRecord) => [clinicalRecord.id, clinicalRecord.label]),
);

export async function GET(request: Request) {
	const session = await getSessionData();

	if (!session?.user?.id) {
		return Response.json(
			{ status: "failed", error: "Sign in to view clinical records." },
			{ status: 401 },
		);
	}

	if (!session.user.emailVerified) {
		return Response.json(
			{ status: "failed", error: "Verify your email before you can view clinical records." },
			{ status: 403 },
		);
	}

	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return Response.json(
			{
				status: "failed",
				error: "Your hospital must be verified before you can view clinical records.",
			},
			{ status: 403 },
		);
	}

	const { searchParams } = new URL(request.url);
	const patientId = searchParams.get("patientId") ?? "";
	const type = searchParams.get("type") ?? "";
	const query = searchParams.get("query") ?? "";
	const page = parsePositiveInteger(searchParams.get("page") ?? "1", 1);
	const limit = Math.min(parsePositiveInteger(searchParams.get("limit") ?? "8", 8), 50);

	if (!patientId) {
		return Response.json({ error: "Missing patient ID." }, { status: 400 });
	}

	if (!clinicalRecordTypeLabels.has(type as ClinicalRecordType)) {
		return Response.json({ error: "Invalid clinical record type." }, { status: 400 });
	}

	const { records, totalRecords } = await getClinicalRecordOptions({
		patientId,
		type,
		page,
		limit,
		query,
	});

	return Response.json({
		records,
		page,
		totalRecords,
		totalPages: Math.ceil(totalRecords / limit) || 1,
	});
}

async function getClinicalRecordOptions({
	patientId,
	type,
	page,
	limit,
	query,
}: {
	patientId: string;
	type: string;
	page: number;
	limit: number;
	query: string;
}): Promise<{ records: ClinicalRecordOption[]; totalRecords: number }> {
	const recordType = type as ClinicalRecordType;

	if (type === "diagnoses") {
		const { diagnoses, totalDiagnoses } = await getPatientDiagnoses(patientId, page, limit, query);

		return {
			totalRecords: totalDiagnoses,
			records: diagnoses.map((diagnosis) => ({
				id: diagnosis.diagnosisId,
				name: diagnosis.name,
				type: recordType,
				createdAt: diagnosis.createdAtLabel,
			})),
		};
	}

	if (type === "allergies") {
		const { allergies, totalAllergies } = await getPatientAllergies(patientId, page, limit, query);

		return {
			totalRecords: totalAllergies,
			records: allergies.map((allergy) => ({
				id: allergy.allergyId,
				name: allergy.allergen,
				type: recordType,
				createdAt: allergy.createdAtLabel,
			})),
		};
	}

	if (type === "immunizations") {
		const { immunizations, totalImmunizations } = await getPatientImmunizations(
			patientId,
			page,
			limit,
			query,
		);

		return {
			totalRecords: totalImmunizations,
			records: immunizations.map((immunization) => ({
				id: immunization.immunizationId,
				name: immunization.vaccineName,
				type: recordType,
				createdAt: immunization.createdAtLabel,
			})),
		};
	}

	if (type === "procedures") {
		const { procedures, totalProcedures } = await getPatientProcedures(
			patientId,
			page,
			limit,
			query,
		);

		return {
			totalRecords: totalProcedures,
			records: procedures.map((procedure) => ({
				id: procedure.procedureId,
				name: procedure.procedure,
				type: recordType,
				createdAt: procedure.createdAtLabel,
			})),
		};
	}

	if (type === "medications") {
		const { medications, totalMedications } = await getPatientMedications(
			patientId,
			page,
			limit,
			query,
		);

		return {
			totalRecords: totalMedications,
			records: medications.map((medication) => ({
				id: medication.medicationId,
				name: medication.medication,
				type: recordType,
				createdAt: medication.createdAtLabel,
			})),
		};
	}

	if (type === "lab-tests") {
		const { labTests, totalLabTests } = await getPatientLabTests(patientId, page, limit, query);

		return {
			totalRecords: totalLabTests,
			records: labTests.map((labTest) => ({
				id: labTest.labId,
				name: labTest.test,
				type: recordType,
				createdAt: labTest.createdAtLabel,
			})),
		};
	}

	const { imagingStudies, totalImagingStudies } = await getPatientImaging(
		patientId,
		page,
		limit,
		query,
	);

	return {
		totalRecords: totalImagingStudies,
		records: imagingStudies.map((imaging) => ({
			id: imaging.imagingId,
			name: imaging.study,
			type: recordType,
			createdAt: imaging.createdAtLabel,
		})),
	};
}

function parsePositiveInteger(value: string, fallback: number) {
	const parsedValue = parseInt(value, 10);

	return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}
