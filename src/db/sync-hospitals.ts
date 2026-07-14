import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schemas";
import { ENV } from "../lib/utils/env";
import { hashPassword } from "better-auth/crypto";
import { and, eq, inArray } from "drizzle-orm";

const sql = postgres(ENV.DATABASE_URL!);
const db = drizzle({ client: sql, schema });

const HOSPITALS = [
	"MediCare General Hospital",
	"St. Mary's Medical Center",
	"City Central Hospital",
	"University Teaching Hospital",
	"Grace Memorial Hospital",
	"Royal Infirmary",
	"Sunrise Medical Center",
	"Valley View Hospital",
	"Lakeside Medical Center",
	"Mountain Peak Hospital",
	"Riverside General Hospital",
	"Northern Star Hospital",
	"Eastern Hope Medical Center",
	"Western Mercy Hospital",
	"Southern Cross Hospital",
	"Central City Hospital",
	"Pediatric Care Center",
	"Heart and Vascular Institute",
	"Orthopedic Specialty Hospital",
	"Women's Health Center",
];

const PASSWORD = "12345678";
const PATIENTS_PER_HOSPITAL = 100;
const CLINICAL_RECORDS_PER_PATIENT = 14;
const TRANSFERS_PER_HOSPITAL = 100;
const PENDING_TRANSFERS_PER_HOSPITAL = 50;
const PATIENT_ID_PATTERN =
	"^[A-Z0-9]+-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$";

function randomString(length: number): string {
	return Math.random()
		.toString(36)
		.substring(2, 2 + length);
}

function prefixedId(prefix: string): string {
	return `${prefix}-${crypto.randomUUID()}`;
}

function hospitalAbbreviation(name: string, fallbackIndex: number): string {
	const abbreviation = name
		.split(/[^a-zA-Z0-9]+/)
		.filter(Boolean)
		.map((word) => word[0])
		.join("")
		.toUpperCase();

	return abbreviation || `H${fallbackIndex + 1}`;
}

function hospitalSlug(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "-")
		.replace(/-+/g, "-");
}

function hospitalEmail(name: string): string {
	return `admin@${name
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "")
		.replace(/-+/g, "")}.org`;
}

async function seedHospitals() {
	console.log("Seeding 20 hospitals with auth...");

	const hashedPassword = await hashPassword(PASSWORD);

	const hospitalOrgs = [];
	for (let i = 0; i < 20; i++) {
		hospitalOrgs.push({
			id: prefixedId("ORG"),
			name: HOSPITALS[i],
			slug: hospitalSlug(HOSPITALS[i]),
			logo: null,
			createdAt: new Date(),
			metadata: JSON.stringify({ type: "hospital" }),
			isVerified: true,
		});
	}
	await db
		.insert(schema.organization)
		.values(hospitalOrgs)
		.onConflictDoNothing();
	console.log("Inserted 20 organizations");

	const allOrgs = await db
		.select({ id: schema.organization.id, slug: schema.organization.slug })
		.from(schema.organization)
		.where(
			inArray(
				schema.organization.slug,
				HOSPITALS.map((hospital) => hospitalSlug(hospital)),
			),
		);
	const orgsBySlug = new Map(
		allOrgs.map((organization) => [organization.slug, organization.id]),
	);
	const demoOrganizationIds = allOrgs.map((organization) => organization.id);

	const [legacyCleanup] = await sql<{ count: number }[]>`
		with deleted as (
			delete from patient
			where id !~ ${PATIENT_ID_PATTERN}
			returning id
		)
		select count(*)::int as count from deleted
	`;
	console.log(`Cleared ${legacyCleanup?.count ?? 0} legacy patient rows`);

	const hospitalUsers = [];
	for (let i = 0; i < 20; i++) {
		hospitalUsers.push({
			id: prefixedId("USR"),
			name: `Admin ${i + 1}`,
			email: hospitalEmail(HOSPITALS[i]),
			emailVerified: true,
			image: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			role: "owner",
			banned: false,
		});
	}
	await db.insert(schema.user).values(hospitalUsers).onConflictDoNothing();
	console.log("Inserted 20 users");

	const allUsers = await db
		.select({ id: schema.user.id, email: schema.user.email })
		.from(schema.user)
		.where(
			inArray(
				schema.user.email,
				HOSPITALS.map((hospital) => hospitalEmail(hospital)),
			),
		);
	const usersByEmail = new Map(allUsers.map((user) => [user.email, user.id]));

	for (const hospital of HOSPITALS) {
		const userId = usersByEmail.get(hospitalEmail(hospital));
		if (!userId) continue;

		const existingCredential = await db
			.select({ id: schema.account.id })
			.from(schema.account)
			.where(
				and(
					eq(schema.account.userId, userId),
					eq(schema.account.providerId, "credential"),
				),
			)
			.limit(1);

		if (existingCredential[0]) {
			await db
				.update(schema.account)
				.set({
					accountId: userId,
					password: hashedPassword,
					updatedAt: new Date(),
				})
				.where(eq(schema.account.id, existingCredential[0].id));
			continue;
		}

		await db.insert(schema.account).values({
			id: prefixedId("ACC"),
			accountId: userId,
			providerId: "credential",
			userId,
			accessToken: null,
			refreshToken: null,
			idToken: null,
			scope: null,
			password: hashedPassword,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}
	console.log("Inserted 20 accounts (password: 12345678)");

	const sessions = [];
	const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
	for (let i = 0; i < 20; i++) {
		sessions.push({
			id: prefixedId("SES"),
			expiresAt,
			token: randomString(64),
			createdAt: new Date(),
			updatedAt: new Date(),
			ipAddress: "127.0.0.1",
			userAgent: "Mozilla/5.0",
			userId: usersByEmail.get(hospitalEmail(HOSPITALS[i])) || randomString(24),
			impersonatedBy: null,
			activeOrganizationId:
				orgsBySlug.get(hospitalSlug(HOSPITALS[i])) || randomString(24),
		});
	}
	await db.insert(schema.session).values(sessions).onConflictDoNothing();
	console.log("Inserted 20 sessions");

	for (const hospital of HOSPITALS) {
		const organizationId = orgsBySlug.get(hospitalSlug(hospital));
		const userId = usersByEmail.get(hospitalEmail(hospital));
		if (!organizationId || !userId) continue;

		const existingMember = await db
			.select({ id: schema.member.id })
			.from(schema.member)
			.where(
				and(
					eq(schema.member.organizationId, organizationId),
					eq(schema.member.userId, userId),
				),
			)
			.limit(1);

		if (existingMember[0]) {
			await db
				.update(schema.member)
				.set({ role: "owner" })
				.where(eq(schema.member.id, existingMember[0].id));
			continue;
		}

		await db.insert(schema.member).values({
			id: prefixedId("MEM"),
			organizationId,
			userId,
			role: "owner",
			createdAt: new Date(),
		});
	}
	console.log("Inserted 20 members");

	if (demoOrganizationIds.length > 0) {
		await sql`
			delete from patient_record_access_verification
			where access_id in (
				select pra.id
				from patient_record_access pra
				join patient p on p.id = pra.patient_id
				where p.organization_id = any(${demoOrganizationIds})
			)
		`;
		await sql`
			delete from patient_record_access
			where patient_id in (
				select id from patient where organization_id = any(${demoOrganizationIds})
			)
		`;
		await sql`
			delete from patient_transfer_content
			where transfer_id in (
				select pt.id
				from patient_transfer pt
				join patient p on p.id = pt.patient_id
				where p.organization_id = any(${demoOrganizationIds})
			)
		`;
		await sql`
			delete from patient_transfer_progress
			where transfer_id in (
				select pt.id
				from patient_transfer pt
				join patient p on p.id = pt.patient_id
				where p.organization_id = any(${demoOrganizationIds})
			)
		`;
		await sql`
			delete from patient_transfer
			where patient_id in (
				select id from patient where organization_id = any(${demoOrganizationIds})
			)
		`;

		for (const table of [
			"patient_document",
			"patient_imaging",
			"patient_lab_test",
			"patient_procedure",
			"patient_immunization",
			"patient_allergy",
			"patient_medication",
			"patient_diagnosis",
		]) {
			await sql.unsafe(
				`delete from ${table} where patient_id in (select id from patient where organization_id = any($1))`,
				[demoOrganizationIds],
			);
		}

		console.log("Cleared existing demo clinical records and transfers");
	}

	const hospitalDetails = [];
	const addresses = [
		"123 Health Street, Lagos",
		"456 Medical Avenue, Abuja",
		"789 Hospital Road, Kano",
		"321 Care Lane, Port Harcourt",
		"654 Wellness Way, Ibadan",
		"987 Healing Boulevard, Benin City",
		"147 Doctor Drive, Kaduna",
		"258 Clinic Circle, Jos",
		"369 Medical Plaza, Sokoto",
		"741 Hospital Highway, Owerri",
		"852 Care Corner, Abeokuta",
		"963 Wellness Street, Akure",
		"159 Health Avenue, Bauchi",
		"267 Medical Center, Makurdi",
		"375 Hospital Lane, Gombe",
		"483 Clinic Road, Yola",
		"591 Care Street, Damaturu",
		"607 Medical Way, Asaba",
		"708 Hospital Avenue, Owerri",
		"819 Health Plaza, Umuahia",
	];
	for (let i = 0; i < 20; i++) {
		hospitalDetails.push({
			id: prefixedId("HOS"),
			organizationId:
				orgsBySlug.get(hospitalSlug(HOSPITALS[i])) || randomString(24),
			hospitalName: HOSPITALS[i],
			hospitalAddress: addresses[i],
			hospitalOwnerName: `Admin ${i + 1}`,
			hospitalOwnerEmail: hospitalEmail(HOSPITALS[i]),
			documentPath: null,
			createdAt: new Date(),
		});
	}
	await db
		.insert(schema.hospitalDetails)
		.values(hospitalDetails)
		.onConflictDoNothing();
	console.log("Inserted 20 hospitalDetails");

	const firstNames = [
		"Amina",
		"Tunde",
		"Chidera",
		"Fatima",
		"Kunle",
		"Ngozi",
		"Musa",
		"Ifeoma",
	];
	const lastNames = [
		"Okafor",
		"Adeyemi",
		"Bello",
		"Eze",
		"Nwosu",
		"Ibrahim",
		"Balogun",
		"Okoro",
	];
	const seededPatients = [];
	const seededPersonalInfo = [];
	const seededContactInfo = [];
	const seededEmergencyContacts = [];
	const seededPhysicalInfo = [];
	const patientIdsByHospitalAndIndex = new Map<string, string>();
	const existingPatients = await db
		.select({
			id: schema.patient.id,
			organizationId: schema.patient.organizationId,
		})
		.from(schema.patient)
		.where(inArray(schema.patient.organizationId, demoOrganizationIds))
		.orderBy(schema.patient.createdAt, schema.patient.id);
	const existingPatientIdsByOrganizationId = new Map<string, string[]>();
	for (const existingPatient of existingPatients) {
		const organizationPatientIds =
			existingPatientIdsByOrganizationId.get(existingPatient.organizationId) ?? [];
		organizationPatientIds.push(existingPatient.id);
		existingPatientIdsByOrganizationId.set(
			existingPatient.organizationId,
			organizationPatientIds,
		);
	}

	for (
		let hospitalIndex = 0;
		hospitalIndex < HOSPITALS.length;
		hospitalIndex++
	) {
		const organizationId = orgsBySlug.get(
			hospitalSlug(HOSPITALS[hospitalIndex]),
		);
		if (!organizationId) continue;

		for (
			let patientIndex = 0;
			patientIndex < PATIENTS_PER_HOSPITAL;
			patientIndex++
		) {
			const patientRowId =
				existingPatientIdsByOrganizationId.get(organizationId)?.[patientIndex] ??
				prefixedId(
					hospitalAbbreviation(HOSPITALS[hospitalIndex], hospitalIndex),
				);
			patientIdsByHospitalAndIndex.set(
				`${hospitalIndex}:${patientIndex}`,
				patientRowId,
			);
			if (
				existingPatientIdsByOrganizationId
					.get(organizationId)
					?.includes(patientRowId)
			) {
				continue;
			}
			const createdAt = new Date();
			createdAt.setDate(createdAt.getDate() - patientIndex * 3);

			seededPatients.push({
				id: patientRowId,
				organizationId,
				patientId: patientRowId,
				createdAt,
				updatedAt: createdAt,
			});

			seededPersonalInfo.push({
				id: prefixedId("PPI"),
				patientId: patientRowId,
				firstName:
					firstNames[(hospitalIndex + patientIndex) % firstNames.length],
				middleName: null,
				lastName: lastNames[(hospitalIndex + patientIndex) % lastNames.length],
				dateOfBirth: `19${80 + (patientIndex % 15)}-0${(patientIndex % 9) + 1}-15`,
				age: 30 + patientIndex,
				sex: patientIndex % 2 === 0 ? "female" : "male",
				maritalStatus: patientIndex % 2 === 0 ? "married" : "single",
				nationalId: `NIN-${hospitalIndex + 1}-${patientIndex + 1}`,
				createdAt,
				updatedAt: createdAt,
			});

			seededContactInfo.push({
				id: prefixedId("PCI"),
				patientId: patientRowId,
				phoneNumber: `+23480${String(hospitalIndex + 1).padStart(2, "0")}${String(patientIndex + 1).padStart(6, "0")}`,
				emailAddress: `patient${hospitalIndex + 1}-${patientIndex + 1}@example.com`,
				residentialAddress: `${patientIndex + 10} Care Street, Lagos`,
				stateOfOrigin: ["Lagos", "Abuja", "Kano", "Oyo", "Rivers"][
					patientIndex % 5
				],
				countryOfOrigin: "Nigeria",
				createdAt,
				updatedAt: createdAt,
			});

			seededEmergencyContacts.push({
				id: prefixedId("PEC"),
				patientId: patientRowId,
				firstName:
					firstNames[(hospitalIndex + patientIndex + 1) % firstNames.length],
				middleName: null,
				lastName:
					lastNames[(hospitalIndex + patientIndex + 1) % lastNames.length],
				relationship: ["spouse", "parent", "sibling", "child", "friend"][
					patientIndex % 5
				],
				phoneNumber: `+23481${String(hospitalIndex + 1).padStart(2, "0")}${String(patientIndex + 1).padStart(6, "0")}`,
				createdAt,
				updatedAt: createdAt,
			});

			seededPhysicalInfo.push({
				id: prefixedId("PPH"),
				patientId: patientRowId,
				height: `${160 + (patientIndex % 35)}cm`,
				weight: `${55 + (patientIndex % 45)}kg`,
				bloodGroup: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"][
					patientIndex % 8
				],
				genotype: ["AA", "AS", "SS", "AC"][patientIndex % 4],
				createdAt,
				updatedAt: createdAt,
			});
		}
	}

	if (seededPatients.length > 0) {
		await db.insert(schema.patient).values(seededPatients).onConflictDoNothing();
		await db
			.insert(schema.patientPersonalInformation)
			.values(seededPersonalInfo)
			.onConflictDoNothing();
		await db
			.insert(schema.patientContactInformation)
			.values(seededContactInfo)
			.onConflictDoNothing();
		await db
			.insert(schema.patientEmergencyContact)
			.values(seededEmergencyContacts)
			.onConflictDoNothing();
		await db
			.insert(schema.patientPhysicalInformation)
			.values(seededPhysicalInfo)
			.onConflictDoNothing();
	}
	console.log(`Inserted ${PATIENTS_PER_HOSPITAL} demo patients per hospital`);

	const encounterTypes = [
		"Emergency Visit",
		"Routine Checkup",
		"Follow-up Visit",
		"Outpatient Visit",
	];
	const departments = [
		"Emergency Medicine",
		"General Medicine",
		"Cardiology",
		"Endocrinology",
		"Family Medicine",
		"Nephrology",
	];
	const physicians = [
		"Dr. Adebayo",
		"Dr. S. Okonkwo",
		"Dr. A. Bello",
		"Dr. T. Adeyemi",
		"Dr. R. Hassan",
		"Dr. E. Nwosu",
		"Dr. M. Ibrahim",
	];
	const seededEncounters: (typeof schema.patientEncounter.$inferInsert)[] = [];
	const firstEncounterIdByPatientId = new Map<string, string>();
	const encounterCountByPatientId = new Map<string, number>();
	const existingEncounters = await db
		.select({
			id: schema.patientEncounter.id,
			patientId: schema.patientEncounter.patientId,
		})
		.from(schema.patientEncounter)
		.innerJoin(
			schema.patient,
			eq(schema.patient.id, schema.patientEncounter.patientId),
		)
		.where(inArray(schema.patient.organizationId, demoOrganizationIds))
		.orderBy(schema.patientEncounter.createdAt, schema.patientEncounter.id);
	for (const existingEncounter of existingEncounters) {
		firstEncounterIdByPatientId.set(
			existingEncounter.patientId,
			firstEncounterIdByPatientId.get(existingEncounter.patientId) ??
				existingEncounter.id,
		);
		encounterCountByPatientId.set(
			existingEncounter.patientId,
			(encounterCountByPatientId.get(existingEncounter.patientId) ?? 0) + 1,
		);
	}

	for (
		let hospitalIndex = 0;
		hospitalIndex < HOSPITALS.length;
		hospitalIndex++
	) {
		for (
			let patientIndex = 0;
			patientIndex < PATIENTS_PER_HOSPITAL;
			patientIndex++
		) {
			const patientRowId = patientIdsByHospitalAndIndex.get(
				`${hospitalIndex}:${patientIndex}`,
			);
			if (!patientRowId) continue;

			for (
				let encounterIndex = encounterCountByPatientId.get(patientRowId) ?? 0;
				encounterIndex < CLINICAL_RECORDS_PER_PATIENT;
				encounterIndex++
			) {
				const createdAt = new Date("2024-04-17T12:30:00.000Z");
				const encounterDate = new Date("2026-03-12T12:00:00.000Z");
				encounterDate.setDate(encounterDate.getDate() - encounterIndex * 3);
				const encounterId = prefixedId("ENC");
				if (!firstEncounterIdByPatientId.has(patientRowId)) {
					firstEncounterIdByPatientId.set(patientRowId, encounterId);
				}

				seededEncounters.push({
					id: encounterId,
					patientId: patientRowId,
					encounterType: encounterTypes[encounterIndex % encounterTypes.length],
					department: departments[encounterIndex % departments.length],
					physician: physicians[encounterIndex % physicians.length],
					encounterDate,
					createdBy: physicians[encounterIndex % physicians.length],
					updatedBy: physicians[encounterIndex % physicians.length],
					createdAt,
					updatedAt: createdAt,
				});
			}
		}
	}

	const ENCOUNTER_INSERT_BATCH_SIZE = 5000;
	for (
		let i = 0;
		i < seededEncounters.length;
		i += ENCOUNTER_INSERT_BATCH_SIZE
	) {
		await db
			.insert(schema.patientEncounter)
			.values(seededEncounters.slice(i, i + ENCOUNTER_INSERT_BATCH_SIZE))
			.onConflictDoNothing();
	}
	console.log(
		`Inserted ${seededEncounters.length} missing demo patient encounters (minimum ${CLINICAL_RECORDS_PER_PATIENT} per patient)`,
	);

	const diagnosisNames = [
		"Hypertension",
		"Type 2 Diabetes Mellitus",
		"Asthma",
		"Iron Deficiency Anemia",
		"Chronic Kidney Disease",
	];
	const medicationNames = [
		"Metformin 500 mg",
		"Lisinopril 10 mg",
		"Salbutamol inhaler",
		"Ferrous sulfate 325 mg",
		"Atorvastatin 20 mg",
	];
	const allergyTemplates = [
		{ allergen: "Penicillin", reaction: "Skin rash", severity: "Moderate" },
		{ allergen: "Peanuts", reaction: "Facial swelling", severity: "Severe" },
		{ allergen: "Dust mites", reaction: "Sneezing and wheezing", severity: "Mild" },
		{ allergen: "Latex", reaction: "Contact dermatitis", severity: "Moderate" },
		{ allergen: "Shellfish", reaction: "Hives", severity: "Severe" },
	];
	const immunizationTemplates = [
		{ vaccineName: "Hepatitis B", currentDose: "3", totalDoses: "3" },
		{ vaccineName: "Tetanus", currentDose: "1", totalDoses: "1" },
		{ vaccineName: "Influenza", currentDose: "1", totalDoses: "1" },
		{ vaccineName: "COVID-19", currentDose: "2", totalDoses: "2" },
		{ vaccineName: "Yellow Fever", currentDose: "1", totalDoses: "1" },
	];
	const procedureTemplates = [
		{ name: "Electrocardiogram", indication: "Cardiac assessment" },
		{ name: "Wound dressing", indication: "Wound management" },
		{ name: "Upper GI endoscopy", indication: "Persistent abdominal discomfort" },
		{ name: "Spirometry", indication: "Respiratory function assessment" },
		{ name: "Joint aspiration", indication: "Joint pain and swelling" },
	];
	const labTestTemplates = [
		{
			name: "Complete Blood Count",
			result: "Within normal limits",
			specimen: "Blood",
			referenceRange: "4.0-11.0 x10^9/L",
			interpretation: "Within Range",
		},
		{
			name: "Fasting Blood Glucose",
			result: "110 mg/dL",
			specimen: "Blood",
			referenceRange: "70-99 mg/dL",
			interpretation: "High",
		},
		{
			name: "Urinalysis",
			result: "No significant abnormality",
			specimen: "Urine",
			referenceRange: "Negative",
			interpretation: "Within Range",
		},
		{
			name: "Lipid Profile",
			result: "150 mg/dL",
			specimen: "Blood",
			referenceRange: "<100 mg/dL",
			interpretation: "Borderline",
		},
		{
			name: "Serum Creatinine",
			result: "1.1 mg/dL",
			specimen: "Serum",
			referenceRange: "0.7-1.3 mg/dL",
			interpretation: "Within Range",
		},
	];
	const imagingTemplates = [
		{ study: "Chest radiograph", modality: "X-ray", region: "Chest" },
		{ study: "Abdominal ultrasound", modality: "Ultrasound", region: "Abdomen" },
		{ study: "Brain MRI", modality: "MRI", region: "Head" },
		{ study: "CT chest", modality: "CT", region: "Chest" },
	];
	const documentTemplates = [
		{ title: "Clinical visit summary", documentType: "Clinical Summary" },
		{ title: "Laboratory report", documentType: "Lab Report" },
		{ title: "Referral letter", documentType: "Referral" },
		{ title: "Imaging report", documentType: "Imaging" },
	];
	const seededDiagnoses: (typeof schema.patientDiagnosis.$inferInsert)[] = [];
	const seededMedications: (typeof schema.patientMedication.$inferInsert)[] = [];
	const seededAllergies: (typeof schema.patientAllergy.$inferInsert)[] = [];
	const seededImmunizations: (typeof schema.patientImmunization.$inferInsert)[] = [];
	const seededProcedures: (typeof schema.patientProcedure.$inferInsert)[] = [];
	const seededLabTests: (typeof schema.patientLabTest.$inferInsert)[] = [];
	const seededLabTestFiles: (typeof schema.patientLabTestFile.$inferInsert)[] = [];
	const seededImagingStudies: (typeof schema.patientImaging.$inferInsert)[] = [];
	const seededImagingFiles: (typeof schema.patientImagingFile.$inferInsert)[] = [];
	const seededDocuments: (typeof schema.patientDocument.$inferInsert)[] = [];
	const seededDocumentFiles: (typeof schema.patientDocumentFile.$inferInsert)[] = [];
	const diagnosisIdByPatientId = new Map<string, string>();
	const medicationIdByPatientId = new Map<string, string>();
	const allergyIdByPatientId = new Map<string, string>();
	const immunizationIdByPatientId = new Map<string, string>();
	const procedureIdByPatientId = new Map<string, string>();
	const labTestIdByPatientId = new Map<string, string>();
	const imagingIdByPatientId = new Map<string, string>();

	for (
		let hospitalIndex = 0;
		hospitalIndex < HOSPITALS.length;
		hospitalIndex++
	) {
		for (
			let patientIndex = 0;
			patientIndex < PATIENTS_PER_HOSPITAL;
			patientIndex++
		) {
			const patientRowId = patientIdsByHospitalAndIndex.get(
				`${hospitalIndex}:${patientIndex}`,
			);
			if (!patientRowId) continue;

			for (
				let clinicalRecordIndex = 0;
				clinicalRecordIndex < CLINICAL_RECORDS_PER_PATIENT;
				clinicalRecordIndex++
			) {
			const createdAt = new Date("2026-03-13T09:00:00.000Z");
			createdAt.setDate(createdAt.getDate() - clinicalRecordIndex * 3 - (patientIndex % 7));
			const physician = physicians[(patientIndex + clinicalRecordIndex) % physicians.length];
			const encounterId = firstEncounterIdByPatientId.get(patientRowId) ?? null;
			const diagnosisId = prefixedId("DIA");
			const medicationId = prefixedId("MED");
			const allergyId = prefixedId("ALL");
			const immunizationId = prefixedId("IMM");
			const procedureId = prefixedId("PRO");
			const labTestId = prefixedId("LAB");
			const imagingId = prefixedId("IMG");
			const documentId = prefixedId("DOC");
			const templateIndex = patientIndex + clinicalRecordIndex;
			const diagnosisName = diagnosisNames[templateIndex % diagnosisNames.length];
			const medicationName = medicationNames[templateIndex % medicationNames.length];
			const allergy = allergyTemplates[templateIndex % allergyTemplates.length];
			const immunization = immunizationTemplates[templateIndex % immunizationTemplates.length];
			const procedure = procedureTemplates[templateIndex % procedureTemplates.length];
			const labTest = labTestTemplates[templateIndex % labTestTemplates.length];
			const imagingStudy = imagingTemplates[templateIndex % imagingTemplates.length];
			const document = documentTemplates[templateIndex % documentTemplates.length];

			if (clinicalRecordIndex === 0) {
			diagnosisIdByPatientId.set(patientRowId, diagnosisId);
			medicationIdByPatientId.set(patientRowId, medicationId);
			allergyIdByPatientId.set(patientRowId, allergyId);
			immunizationIdByPatientId.set(patientRowId, immunizationId);
			procedureIdByPatientId.set(patientRowId, procedureId);
			labTestIdByPatientId.set(patientRowId, labTestId);
			imagingIdByPatientId.set(patientRowId, imagingId);
			}

			seededDiagnoses.push({
				id: diagnosisId,
				patientId: patientRowId,
				encounterId,
				diagnosisName,
				status: clinicalRecordIndex % 3 === 0 ? "Resolved" : "Active",
				severityStage: clinicalRecordIndex % 4 === 0 ? "moderate" : "mild",
				diagnosedAt: createdAt.toISOString().slice(0, 10),
				lastReviewedAt: "2026-03-13",
				clinicalNote: `${diagnosisName} seeded for transfer content previews.`,
				diagnosedBy: physician,
				createdBy: physician,
				updatedBy: physician,
				createdAt,
				updatedAt: createdAt,
			});

			seededMedications.push({
				id: medicationId,
				patientId: patientRowId,
				encounterId,
				medicationName,
				dose: medicationName.match(/\d/) ? medicationName.replace(/^\D+/, "").trim() : null,
				route: medicationName.includes("inhaler") ? "inhalation" : "oral",
				indication: diagnosisName,
				status: clinicalRecordIndex % 5 === 0 ? "completed" : "active",
				createdAt,
				updatedAt: createdAt,
			});

			seededAllergies.push({
				id: allergyId,
				patientId: patientRowId,
				encounterId,
				allergen: allergy.allergen,
				reaction: allergy.reaction,
				severity: allergy.severity,
				status: clinicalRecordIndex % 6 === 0 ? "Inactive" : "Active",
				clinicalNote: `${allergy.reaction} reported after exposure to ${allergy.allergen}.`,
				createdBy: physician,
				updatedBy: physician,
				createdAt,
				updatedAt: createdAt,
			});

			seededImmunizations.push({
				id: immunizationId,
				patientId: patientRowId,
				encounterId,
				vaccineName: immunization.vaccineName,
				currentDose: immunization.currentDose,
				totalDoses: immunization.totalDoses,
				seriesType: "Primary series",
				dateAdministered: createdAt,
				administeredBy: physician,
				status: "Completed",
				clinicalNote: `${immunization.vaccineName} administered without complications.`,
				createdBy: physician,
				updatedBy: physician,
				createdAt,
				updatedAt: createdAt,
			});

			seededProcedures.push({
				id: procedureId,
				patientId: patientRowId,
				encounterId,
				procedureName: procedure.name,
				indication: procedure.indication,
				facility: HOSPITALS[hospitalIndex],
				status: "completed",
				procedureDate: createdAt,
				performedBy: physician,
				diagnosisId,
				medicationId,
				clinicalNote: `${procedure.name} completed successfully.`,
				createdBy: physician,
				updatedBy: physician,
				createdAt,
				updatedAt: createdAt,
			});

			seededLabTests.push({
				id: labTestId,
				patientId: patientRowId,
				encounterId,
				testName: labTest.name,
				result: labTest.result,
				specimen: labTest.specimen,
				referenceRange: labTest.referenceRange,
				interpretation: labTest.interpretation,
				flag: labTest.interpretation,
				orderedAt: createdAt,
				orderedBy: physician,
				status: "completed",
				clinicalNote: `${labTest.name} result reviewed during the encounter.`,
				createdBy: physician,
				updatedBy: physician,
				createdAt,
				updatedAt: createdAt,
			});
			seededLabTestFiles.push({
				id: prefixedId("LTF"),
				parentRecordId: labTestId,
				name: `${labTest.name.toLowerCase().replaceAll(" ", "-")}-results.csv`,
				url: `https://medibridge-demo.s3.amazonaws.com/patients/${patientRowId}/lab-tests/${labTestId}.csv`,
				type: "text/csv",
				size: "248 B",
				uploadedBy: physician,
				uploadedAt: createdAt,
			});

			seededImagingStudies.push({
				id: imagingId,
				patientId: patientRowId,
				encounterId,
				study: imagingStudy.study,
				modality: imagingStudy.modality,
				region: imagingStudy.region,
				impression: "No acute abnormality identified.",
				orderedAt: createdAt,
				orderedBy: physician,
				reportedBy: physician,
				status: "completed",
				clinicalNote: `${imagingStudy.study} reviewed with the patient.`,
				createdBy: physician,
				updatedBy: physician,
				createdAt,
				updatedAt: createdAt,
			});
			seededImagingFiles.push({
				id: prefixedId("IMF"),
				parentRecordId: imagingId,
				name: `${imagingStudy.study.toLowerCase().replaceAll(" ", "-")}-report.pdf`,
				url: `https://medibridge-demo.s3.amazonaws.com/patients/${patientRowId}/imaging/${imagingId}.pdf`,
				type: "application/pdf",
				size: "1.8 MB",
				uploadedBy: physician,
				uploadedAt: createdAt,
			});

			seededDocuments.push({
				id: documentId,
				patientId: patientRowId,
				encounterId,
				title: document.title,
				documentType: document.documentType,
				clinicalNotes: `${document.title} generated for the seeded encounter.`,
				createdBy: physician,
				updatedBy: physician,
				createdAt,
				updatedAt: createdAt,
			});
			seededDocumentFiles.push({
				id: prefixedId("DOF"),
				parentRecordId: documentId,
				name: `${document.title.toLowerCase().replaceAll(" ", "-")}.pdf`,
				url: `https://medibridge-demo.s3.amazonaws.com/patients/${patientRowId}/documents/${documentId}.pdf`,
				type: "application/pdf",
				size: "640 KB",
				uploadedBy: physician,
				uploadedAt: createdAt,
			});
			}
		}
	}

	const CLINICAL_INSERT_BATCH_SIZE = 3000;
	for (
		let i = 0;
		i < seededDiagnoses.length;
		i += CLINICAL_INSERT_BATCH_SIZE
	) {
		await db
			.insert(schema.patientDiagnosis)
			.values(seededDiagnoses.slice(i, i + CLINICAL_INSERT_BATCH_SIZE))
			.onConflictDoNothing();
	}
	for (
		let i = 0;
		i < seededMedications.length;
		i += CLINICAL_INSERT_BATCH_SIZE
	) {
		await db
			.insert(schema.patientMedication)
			.values(seededMedications.slice(i, i + CLINICAL_INSERT_BATCH_SIZE))
			.onConflictDoNothing();
	}
	for (let i = 0; i < seededAllergies.length; i += CLINICAL_INSERT_BATCH_SIZE) {
		await db
			.insert(schema.patientAllergy)
			.values(seededAllergies.slice(i, i + CLINICAL_INSERT_BATCH_SIZE))
			.onConflictDoNothing();
	}
	for (let i = 0; i < seededImmunizations.length; i += CLINICAL_INSERT_BATCH_SIZE) {
		await db
			.insert(schema.patientImmunization)
			.values(seededImmunizations.slice(i, i + CLINICAL_INSERT_BATCH_SIZE))
			.onConflictDoNothing();
	}
	for (let i = 0; i < seededProcedures.length; i += CLINICAL_INSERT_BATCH_SIZE) {
		await db
			.insert(schema.patientProcedure)
			.values(seededProcedures.slice(i, i + CLINICAL_INSERT_BATCH_SIZE))
			.onConflictDoNothing();
	}
	for (let i = 0; i < seededLabTests.length; i += CLINICAL_INSERT_BATCH_SIZE) {
		await db
			.insert(schema.patientLabTest)
			.values(seededLabTests.slice(i, i + CLINICAL_INSERT_BATCH_SIZE))
			.onConflictDoNothing();
	}
	for (let i = 0; i < seededLabTestFiles.length; i += CLINICAL_INSERT_BATCH_SIZE) {
		await db
			.insert(schema.patientLabTestFile)
			.values(seededLabTestFiles.slice(i, i + CLINICAL_INSERT_BATCH_SIZE))
			.onConflictDoNothing();
	}
	for (let i = 0; i < seededImagingStudies.length; i += CLINICAL_INSERT_BATCH_SIZE) {
		await db
			.insert(schema.patientImaging)
			.values(seededImagingStudies.slice(i, i + CLINICAL_INSERT_BATCH_SIZE))
			.onConflictDoNothing();
	}
	for (let i = 0; i < seededImagingFiles.length; i += CLINICAL_INSERT_BATCH_SIZE) {
		await db
			.insert(schema.patientImagingFile)
			.values(seededImagingFiles.slice(i, i + CLINICAL_INSERT_BATCH_SIZE))
			.onConflictDoNothing();
	}
	for (let i = 0; i < seededDocuments.length; i += CLINICAL_INSERT_BATCH_SIZE) {
		await db
			.insert(schema.patientDocument)
			.values(seededDocuments.slice(i, i + CLINICAL_INSERT_BATCH_SIZE))
			.onConflictDoNothing();
	}
	for (let i = 0; i < seededDocumentFiles.length; i += CLINICAL_INSERT_BATCH_SIZE) {
		await db
			.insert(schema.patientDocumentFile)
			.values(seededDocumentFiles.slice(i, i + CLINICAL_INSERT_BATCH_SIZE))
			.onConflictDoNothing();
	}
	console.log(
		`Inserted ${seededDiagnoses.length} demo diagnoses, ${seededMedications.length} medications, ${seededAllergies.length} allergies, ${seededImmunizations.length} immunizations, ${seededProcedures.length} procedures, ${seededLabTests.length} lab tests with ${seededLabTestFiles.length} files, ${seededImagingStudies.length} imaging studies with ${seededImagingFiles.length} files, and ${seededDocuments.length} documents with ${seededDocumentFiles.length} files`,
	);

	const seededTransfers = [];
	const seededTransferContent: (typeof schema.patientTransferContent.$inferInsert)[] = [];

	for (
		let hospitalIndex = 0;
		hospitalIndex < HOSPITALS.length;
		hospitalIndex++
	) {
		const sourceOrganizationId = orgsBySlug.get(
			hospitalSlug(HOSPITALS[hospitalIndex]),
		);
		const targetOrganizationId = orgsBySlug.get(
			hospitalSlug(HOSPITALS[(hospitalIndex + 1) % HOSPITALS.length]),
		);
		if (!sourceOrganizationId || !targetOrganizationId) continue;

		for (
			let transferIndex = 0;
			transferIndex < TRANSFERS_PER_HOSPITAL;
			transferIndex++
		) {
			const patientRowId = patientIdsByHospitalAndIndex.get(
				`${hospitalIndex}:${transferIndex}`,
			);
			if (!patientRowId) continue;

			const requestedAt = new Date();
			requestedAt.setDate(requestedAt.getDate() - transferIndex * 4);
			const status =
				transferIndex < PENDING_TRANSFERS_PER_HOSPITAL
					? "pending"
					: ["completed", "rejected", "failed", "cancelled"][
							transferIndex % 4
						];

			const transferId = prefixedId("TRF");
			const diagnosisId = diagnosisIdByPatientId.get(patientRowId);
			const medicationId = medicationIdByPatientId.get(patientRowId);
			const allergyId = allergyIdByPatientId.get(patientRowId);
			const immunizationId = immunizationIdByPatientId.get(patientRowId);
			const procedureId = procedureIdByPatientId.get(patientRowId);
			const labTestId = labTestIdByPatientId.get(patientRowId);
			const imagingId = imagingIdByPatientId.get(patientRowId);
			const encounterId = firstEncounterIdByPatientId.get(patientRowId);

			seededTransfers.push({
				id: transferId,
				patientId: patientRowId,
				sourceOrganizationId,
				targetOrganizationId,
				targetHospitalName: HOSPITALS[(hospitalIndex + 1) % HOSPITALS.length],
				targetHospitalEmail: hospitalEmail(
					HOSPITALS[(hospitalIndex + 1) % HOSPITALS.length],
				),
				status,
				patientApprovalStatus: transferIndex % 2 === 0 ? "waiting" : "approved",
				patientRejectionReason: null,
				deliveryStatus:
					status === "completed" ? "sent" : status === "failed" ? "failed" : "not_started",
				requestedBy:
					usersByEmail.get(hospitalEmail(HOSPITALS[hospitalIndex])) ?? null,
				createdBy:
					usersByEmail.get(hospitalEmail(HOSPITALS[hospitalIndex])) ?? null,
				updatedBy:
					usersByEmail.get(hospitalEmail(HOSPITALS[hospitalIndex])) ?? null,
				requestedAt,
				sentAt:
					status === "completed" ? requestedAt : null,
				completedAt: status === "completed" ? requestedAt : null,
				cancelledAt: status === "cancelled" ? requestedAt : null,
				failedAt: status === "failed" ? requestedAt : null,
				createdAt: requestedAt,
				updatedAt: requestedAt,
			});

			const transferContent = [
				{ contentType: "diagnoses", recordId: diagnosisId },
				{ contentType: "allergies", recordId: allergyId },
				{ contentType: "immunizations", recordId: immunizationId },
				{ contentType: "procedures", recordId: procedureId },
				{ contentType: "medications", recordId: medicationId },
				{ contentType: "lab-tests", recordId: labTestId },
				{ contentType: "imaging", recordId: imagingId },
				{ contentType: "encounters", recordId: encounterId },
			].filter(
				(content): content is { contentType: string; recordId: string } =>
					typeof content.recordId === "string",
			);

			seededTransferContent.push(
				...transferContent.map(({ contentType, recordId }) => ({
					id: prefixedId("TCO"),
					transferId,
					contentType,
					recordId,
					createdAt: requestedAt,
				})),
			);
		}
	}

	await db
		.insert(schema.patientTransfer)
		.values(seededTransfers)
		.onConflictDoNothing();

	console.log(
		`Inserted ${TRANSFERS_PER_HOSPITAL} demo transfers per hospital (${PENDING_TRANSFERS_PER_HOSPITAL} pending)`,
	);

	const TRANSFER_CONTENT_INSERT_BATCH_SIZE = 1000;
	for (
		let i = 0;
		i < seededTransferContent.length;
		i += TRANSFER_CONTENT_INSERT_BATCH_SIZE
	) {
		await db
			.insert(schema.patientTransferContent)
			.values(seededTransferContent.slice(i, i + TRANSFER_CONTENT_INSERT_BATCH_SIZE))
			.onConflictDoNothing();
	}
	console.log(`Inserted ${seededTransferContent.length} demo transfer content rows`);

	console.log("Hospital seeding completed!");
	console.log(`\nYou can login with:`);
	console.log(`Email: ${hospitalEmail(HOSPITALS[0])}`);
	console.log(`Password: ${PASSWORD}`);
	console.log(`(Replace with any of the 20 hospital admin emails)`);
	process.exit(0);
}

seedHospitals().catch((error) => {
	console.error("Seeding failed:", error);
	process.exit(1);
});
