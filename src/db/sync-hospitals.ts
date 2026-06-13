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
		await db
			.delete(schema.patient)
			.where(inArray(schema.patient.organizationId, demoOrganizationIds));
		await db
			.delete(schema.hospitalDetails)
			.where(
				inArray(schema.hospitalDetails.organizationId, demoOrganizationIds),
			);
		console.log("Cleared existing demo patients and hospital details");
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
			const patientRowId = prefixedId(
				hospitalAbbreviation(HOSPITALS[hospitalIndex], hospitalIndex),
			);
			patientIdsByHospitalAndIndex.set(
				`${hospitalIndex}:${patientIndex}`,
				patientRowId,
			);
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

			for (let encounterIndex = 0; encounterIndex < 10; encounterIndex++) {
				const createdAt = new Date("2024-04-17T12:30:00.000Z");
				const encounterDate = new Date("2026-03-12T12:00:00.000Z");
				encounterDate.setDate(encounterDate.getDate() - encounterIndex * 3);
				const encounterId = prefixedId("ENC");

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

	const ENCOUNTER_INSERT_BATCH_SIZE = 1000;
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
	console.log(`Inserted ${seededEncounters.length} demo patient encounters`);

	const seededTransfers = [];

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

			seededTransfers.push({
				id: transferId,
				patientId: patientRowId,
				sourceOrganizationId,
				targetOrganizationId,
				targetHospitalName: HOSPITALS[(hospitalIndex + 1) % HOSPITALS.length],
				targetHospitalAdminName: `Admin ${((hospitalIndex + 1) % HOSPITALS.length) + 1}`,
				targetHospitalAdminEmail: hospitalEmail(
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
		}
	}

	await db
		.insert(schema.patientTransfer)
		.values(seededTransfers)
		.onConflictDoNothing();

	for (const transfer of seededTransfers) {
		await sql`
			update patient_transfer
			set
				status = ${transfer.status},
				patient_approval_status = ${transfer.patientApprovalStatus},
				delivery_status = ${transfer.deliveryStatus},
				sent_at = ${transfer.sentAt?.toISOString() ?? null},
				completed_at = ${transfer.completedAt?.toISOString() ?? null},
				cancelled_at = ${transfer.cancelledAt?.toISOString() ?? null},
				updated_at = ${transfer.updatedAt.toISOString()}
			where id = ${transfer.id}
		`;
	}
	console.log(
		`Inserted ${TRANSFERS_PER_HOSPITAL} demo transfers per hospital (${PENDING_TRANSFERS_PER_HOSPITAL} pending)`,
	);

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
