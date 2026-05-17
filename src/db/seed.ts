import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schemas";
import { ENV } from "../lib/utils/env";

const sql = postgres(ENV.DATABASE_URL!);
const db = drizzle({ client: sql, schema });

const ROWS = 500;
const BATCH_SIZE = 50;

function randomString(length: number): string {
	return Math.random().toString(36).substring(2, 2 + length);
}

function randomEmail(index: number): string {
	return `user${index}@example.com`;
}

function randomDate(start: Date, end: Date): Date {
	return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function batchInsert<T>(table: any, data: T[]): Promise<void> {
	for (let i = 0; i < data.length; i += BATCH_SIZE) {
		const batch = data.slice(i, i + BATCH_SIZE);
		await db.insert(table).values(batch).onConflictDoNothing();
	}
}

async function seed() {
	console.log("Starting seed...");

	console.log("Seeding user...");
	const users = [];
	for (let i = 1; i <= ROWS; i++) {
		users.push({
			id: randomString(24),
			name: `User ${i}`,
			email: randomEmail(i),
			emailVerified: Math.random() > 0.5,
			image: `https://example.com/avatar${i}.jpg`,
			createdAt: new Date(),
			updatedAt: new Date(),
			role: ["admin", "doctor", "nurse", "member"][Math.floor(Math.random() * 4)],
			banned: false,
		});
	}
	await batchInsert(schema.user, users);
	console.log("Inserted 500 users");

	console.log("Seeding organization...");
	const organizations = [];
	for (let i = 1; i <= ROWS; i++) {
		organizations.push({
			id: randomString(24),
			name: `Organization ${i}`,
			slug: `org-${i}-${randomString(8)}`,
			logo: `https://example.com/logo${i}.png`,
			createdAt: new Date(),
			metadata: JSON.stringify({ type: "hospital" }),
			isVerified: Math.random() > 0.3,
		});
	}
	await batchInsert(schema.organization, organizations);
	console.log("Inserted 500 organizations");

	console.log("Seeding account...");
	const allUsers = await db.select({ id: schema.user.id }).from(schema.user).limit(ROWS);
	const accounts = [];
	for (let i = 0; i < ROWS; i++) {
		accounts.push({
			id: randomString(24),
			accountId: randomString(24),
			providerId: ["google", "email", "github"][Math.floor(Math.random() * 3)],
			userId: allUsers[i]?.id || randomString(24),
			accessToken: randomString(32),
			refreshToken: randomString(32),
			idToken: randomString(64),
			scope: "openid profile email",
			password: Math.random() > 0.5 ? randomString(60) : null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}
	await batchInsert(schema.account, accounts);
	console.log("Inserted 500 accounts");

	console.log("Seeding session...");
	const sessions = [];
	for (let i = 0; i < ROWS; i++) {
		const expiresAt = randomDate(new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
		sessions.push({
			id: randomString(24),
			expiresAt,
			token: randomString(64),
			createdAt: new Date(),
			updatedAt: new Date(),
			ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
			userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
			userId: allUsers[i]?.id || randomString(24),
			impersonatedBy: null,
			activeOrganizationId: null,
		});
	}
	await batchInsert(schema.session, sessions);
	console.log("Inserted 500 sessions");

	console.log("Seeding member...");
	const allOrgs = await db.select({ id: schema.organization.id }).from(schema.organization).limit(ROWS);
	const members = [];
	for (let i = 0; i < ROWS; i++) {
		members.push({
			id: randomString(24),
			organizationId: allOrgs[i]?.id || randomString(24),
			userId: allUsers[i]?.id || randomString(24),
			role: ["owner", "admin", "member"][Math.floor(Math.random() * 3)],
			createdAt: new Date(),
		});
	}
	await batchInsert(schema.member, members);
	console.log("Inserted 500 members");

	console.log("Seeding invitation...");
	const invitations = [];
	for (let i = 0; i < ROWS; i++) {
		invitations.push({
			id: randomString(24),
			organizationId: allOrgs[i]?.id || randomString(24),
			email: `invite${i}@example.com`,
			role: ["admin", "member", "doctor"][Math.floor(Math.random() * 3)],
			status: ["pending", "accepted", "expired"][Math.floor(Math.random() * 3)],
			expiresAt: randomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
			inviterId: allUsers[Math.floor(Math.random() * ROWS)]?.id || randomString(24),
		});
	}
	await batchInsert(schema.invitation, invitations);
	console.log("Inserted 500 invitations");

	console.log("Seeding verification...");
	const verifications = [];
	for (let i = 0; i < ROWS; i++) {
		verifications.push({
			id: randomString(24),
			identifier: randomEmail(i),
			value: randomString(64),
			expiresAt: randomDate(new Date(), new Date(Date.now() + 24 * 60 * 60 * 1000)),
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}
	await batchInsert(schema.verification, verifications);
	console.log("Inserted 500 verifications");

	console.log("Seeding hospitalDetails...");
	const hospitalDetails = [];
	for (let i = 0; i < ROWS; i++) {
		hospitalDetails.push({
			id: randomString(24),
			organizationId: allOrgs[i]?.id || randomString(24),
			hospitalName: `Hospital ${i + 1}`,
			hospitalAddress: `${Math.floor(Math.random() * 999)} Medical Street, City ${i + 1}`,
			hospitalOwnerName: `Owner ${i + 1}`,
			hospitalOwnerEmail: `hospital${i + 1}@example.com`,
			documentPath: `/documents/hospital-${i + 1}.pdf`,
			createdAt: new Date(),
		});
	}
	await batchInsert(schema.hospitalDetails, hospitalDetails);
	console.log("Inserted 500 hospitalDetails");

	console.log("Seeding patient...");
	const patients = [];
	for (let i = 0; i < ROWS; i++) {
		patients.push({
			id: randomString(24),
			organizationId: allOrgs[Math.floor(Math.random() * ROWS)]?.id || randomString(24),
			patientId: `PAT-${String(i + 1).padStart(6, "0")}`,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}
	await batchInsert(schema.patient, patients);
	console.log("Inserted 500 patients");

	console.log("Seeding patientPersonalInformation...");
	const patientRecords = await db.select({ id: schema.patient.id }).from(schema.patient).limit(ROWS);
	const personalInfos = [];
	for (let i = 0; i < ROWS; i++) {
		const firstNames = ["John", "Jane", "Michael", "Sarah", "David", "Emily", "James", "Mary", "Robert", "Patricia"];
		const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];
		personalInfos.push({
			id: randomString(24),
			patientId: patientRecords[i]?.id || randomString(24),
			firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
			middleName: Math.random() > 0.5 ? randomString(8) : null,
			lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
			dateOfBirth: randomDate(new Date(1950, 0, 1), new Date(2020, 0, 1)).toISOString().split("T")[0],
			age: Math.floor(Math.random() * 70) + 18,
			sex: ["male", "female"][Math.floor(Math.random() * 2)],
			maritalStatus: ["single", "married", "divorced", "widowed"][Math.floor(Math.random() * 4)],
			nationalId: randomString(10).toUpperCase(),
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}
	await batchInsert(schema.patientPersonalInformation, personalInfos);
	console.log("Inserted 500 patientPersonalInformation");

	console.log("Seeding patientContactInformation...");
	const contactInfos = [];
	for (let i = 0; i < ROWS; i++) {
		contactInfos.push({
			id: randomString(24),
			patientId: patientRecords[i]?.id || randomString(24),
			phoneNumber: `+234${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
			emailAddress: randomEmail(i),
			residentialAddress: `${Math.floor(Math.random() * 999)} Street, City, State`,
			stateOfOrigin: ["Lagos", "Abuja", "Kano", "Port Harcourt", "Ibadan"][Math.floor(Math.random() * 5)],
			countryOfOrigin: "Nigeria",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}
	await batchInsert(schema.patientContactInformation, contactInfos);
	console.log("Inserted 500 patientContactInformation");

	console.log("Seeding patientEmergencyContact...");
	const emergencyContacts = [];
	const relationships = ["spouse", "parent", "sibling", "child", "friend", "other"];
	for (let i = 0; i < ROWS; i++) {
		emergencyContacts.push({
			id: randomString(24),
			patientId: patientRecords[i]?.id || randomString(24),
			firstName: ["John", "Jane", "Michael", "Sarah", "David"][Math.floor(Math.random() * 5)],
			middleName: Math.random() > 0.5 ? randomString(8) : null,
			lastName: ["Smith", "Johnson", "Williams", "Brown", "Jones"][Math.floor(Math.random() * 5)],
			relationship: relationships[Math.floor(Math.random() * relationships.length)],
			phoneNumber: `+234${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}
	await batchInsert(schema.patientEmergencyContact, emergencyContacts);
	console.log("Inserted 500 patientEmergencyContact");

	console.log("Seeding patientPhysicalInformation...");
	const physicalInfos = [];
	const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
	const genotypes = ["AA", "AS", "SS", "AC"];
	for (let i = 0; i < ROWS; i++) {
		physicalInfos.push({
			id: randomString(24),
			patientId: patientRecords[i]?.id || randomString(24),
			height: `${(Math.random() * 0.5 + 1.5).toFixed(2)}m`,
			weight: `${(Math.random() * 40 + 50).toFixed(1)}kg`,
			bloodGroup: bloodGroups[Math.floor(Math.random() * bloodGroups.length)],
			genotype: genotypes[Math.floor(Math.random() * genotypes.length)],
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}
	await batchInsert(schema.patientPhysicalInformation, physicalInfos);
	console.log("Inserted 500 patientPhysicalInformation");

	console.log("Seeding patientDiagnosis...");
	const diagnoses = [];
	const diagnosisNames = [
		"Hypertension",
		"Diabetes Type 2",
		"Asthma",
		"Malaria",
		"Typhoid",
		"Arthritis",
		"Migraine",
		"Pneumonia",
		"Tuberculosis",
		"Anemia",
	];
	for (let i = 0; i < ROWS; i++) {
		diagnoses.push({
			id: randomString(24),
			patientId: patientRecords[Math.floor(Math.random() * ROWS)]?.id || randomString(24),
			diagnosisName: diagnosisNames[Math.floor(Math.random() * diagnosisNames.length)],
			status: ["active", "resolved", "chronic"][Math.floor(Math.random() * 3)],
			severityStage: ["mild", "moderate", "severe"][Math.floor(Math.random() * 3)],
			onsetDate: randomDate(new Date(2020, 0, 1), new Date()).toISOString().split("T")[0],
			clinicalNote: `Patient presents with symptoms. Treatment ongoing.`,
			diagnosedBy: `Dr. ${["Smith", "Johnson", "Williams", "Brown"][Math.floor(Math.random() * 4)]}`,
			createdBy: allUsers[Math.floor(Math.random() * ROWS)]?.id || randomString(24),
			updatedBy: Math.random() > 0.5 ? allUsers[Math.floor(Math.random() * ROWS)]?.id : null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}
	await batchInsert(schema.patientDiagnosis, diagnoses);
	console.log("Inserted 500 patientDiagnosis");

	console.log("Seeding patientDiagnosisHistory...");
	const diagnosisRecords = await db.select({ id: schema.patientDiagnosis.id }).from(schema.patientDiagnosis).limit(ROWS);
	const diagnosisHistories = [];
	const fieldNames = ["status", "severityStage", "clinicalNote", "diagnosedBy"];
	for (let i = 0; i < ROWS; i++) {
		diagnosisHistories.push({
			id: randomString(24),
			diagnosisId: diagnosisRecords[i]?.id || randomString(24),
			fieldName: fieldNames[Math.floor(Math.random() * fieldNames.length)],
			newValue: randomString(20),
			updatedBy: allUsers[Math.floor(Math.random() * ROWS)]?.id || randomString(24),
			createdAt: new Date(),
		});
	}
	await batchInsert(schema.patientDiagnosisHistory, diagnosisHistories);
	console.log("Inserted 500 patientDiagnosisHistory");

	console.log("Seeding patientTransfer...");
	const transfers = [];
	const transferStatuses = ["pending", "approved", "rejected", "sent", "completed", "failed", "cancelled"];
	const patientApprovalStatuses = ["waiting", "approved", "rejected"];
	const deliveryStatuses = ["not_started", "sent", "delivered", "failed"];
	for (let i = 0; i < ROWS; i++) {
		transfers.push({
			id: randomString(24),
			transferId: `TRF-${String(i + 1).padStart(6, "0")}`,
			patientId: patientRecords[Math.floor(Math.random() * ROWS)]?.id || randomString(24),
			sourceOrganizationId: allOrgs[Math.floor(Math.random() * ROWS)]?.id || randomString(24),
			targetOrganizationId: allOrgs[Math.floor(Math.random() * ROWS)]?.id || randomString(24),
			targetHospitalName: `Target Hospital ${i + 1}`,
			targetHospitalAdminName: `Admin ${i + 1}`,
			targetHospitalAdminEmail: `admin${i + 1}@hospital.com`,
			status: transferStatuses[Math.floor(Math.random() * transferStatuses.length)],
			patientApprovalStatus: patientApprovalStatuses[Math.floor(Math.random() * patientApprovalStatuses.length)],
			patientRejectionReason: Math.random() > 0.7 ? "Patient declined transfer" : null,
			deliveryStatus: deliveryStatuses[Math.floor(Math.random() * deliveryStatuses.length)],
			clinicalPayloadFileName: `clinical_${i + 1}.pdf`,
			clinicalPayloadFileUrl: `https://storage.example.com/files/clinical_${i + 1}.pdf`,
			clinicalPayloadFileType: "pdf",
			clinicalPayloadFileSize: `${Math.floor(Math.random() * 500) + 50}KB`,
			requestedBy: allUsers[Math.floor(Math.random() * ROWS)]?.id || randomString(24),
			requestedAt: randomDate(new Date(2024, 0, 1), new Date()),
			sentAt: Math.random() > 0.5 ? randomDate(new Date(2024, 0, 1), new Date()) : null,
			completedAt: Math.random() > 0.7 ? randomDate(new Date(2024, 0, 1), new Date()) : null,
			cancelledAt: null,
			failedAt: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}
	await batchInsert(schema.patientTransfer, transfers);
	console.log("Inserted 500 patientTransfer");

	console.log("Seeding patientTransferProgress...");
	const transferRecords = await db.select({ id: schema.patientTransfer.id }).from(schema.patientTransfer).limit(ROWS);
	const progressItems = [];
	const progressTitles = [
		"Initial Request Submitted",
		"Medical Records Reviewed",
		"Patient Approval Received",
		"Transfer Approved",
		"Ambulance Dispatched",
		"Patient Arrived",
		"Transfer Completed",
	];
	for (let i = 0; i < ROWS; i++) {
		progressItems.push({
			id: randomString(24),
			transferId: transferRecords[i]?.id || randomString(24),
			title: progressTitles[Math.floor(Math.random() * progressTitles.length)],
			description: "Progress update description",
			status: ["pending", "in_progress", "completed"][Math.floor(Math.random() * 3)],
			createdAt: new Date(),
		});
	}
	await batchInsert(schema.patientTransferProgress, progressItems);
	console.log("Inserted 500 patientTransferProgress");

	console.log("Seeding patientTransferContent...");
	const contentItems = [];
	const contentTypes = ["medical_records", "lab_results", "imaging", "prescription", "consent_form"];
	for (let i = 0; i < ROWS; i++) {
		contentItems.push({
			id: randomString(24),
			transferId: transferRecords[i]?.id || randomString(24),
			contentType: contentTypes[Math.floor(Math.random() * contentTypes.length)],
			createdAt: new Date(),
		});
	}
	await batchInsert(schema.patientTransferContent, contentItems);
	console.log("Inserted 500 patientTransferContent");

	console.log("Seed completed successfully!");
	process.exit(0);
}

seed().catch((error) => {
	console.error("Seed failed:", error);
	process.exit(1);
});