import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "./schemas";
import { ENV } from "../lib/utils/env";
import { sendHospitalApprovedEmail } from "../lib/utils/send-email";

const sql = postgres(ENV.DATABASE_URL!);
const db = drizzle({ client: sql, schema });

async function listPendingHospitals() {
	const pendingHospitals = await db
		.select({
			name: schema.hospitalDetails.hospitalName,
			ownerEmail: schema.hospitalDetails.hospitalOwnerEmail,
			submittedAt: schema.hospitalDetails.createdAt,
		})
		.from(schema.hospitalDetails)
		.innerJoin(
			schema.organization,
			eq(schema.hospitalDetails.organizationId, schema.organization.id),
		)
		.where(eq(schema.organization.isVerified, false))
		.orderBy(schema.hospitalDetails.createdAt);

	if (pendingHospitals.length === 0) {
		console.log("No hospitals are waiting for approval.");
		return;
	}

	console.table(pendingHospitals);
	console.log("Approve one with: bun db:approve-hospital <owner email>");
}

async function approveHospital(ownerEmail: string) {
	const normalizedOwnerEmail = ownerEmail.trim().toLowerCase();
	const [hospital] = await db
		.select({
			organizationId: schema.organization.id,
			name: schema.organization.name,
			isVerified: schema.organization.isVerified,
		})
		.from(schema.hospitalDetails)
		.innerJoin(
			schema.organization,
			eq(schema.hospitalDetails.organizationId, schema.organization.id),
		)
		.where(eq(schema.hospitalDetails.hospitalOwnerEmail, normalizedOwnerEmail))
		.limit(1);

	if (!hospital) {
		console.error(`No hospital found for ${ownerEmail}.`);
		process.exitCode = 1;
		return;
	}

	if (hospital.isVerified) {
		console.log(`${hospital.name} is already approved.`);
		return;
	}

	await db
		.update(schema.organization)
		.set({ isVerified: true })
		.where(eq(schema.organization.id, hospital.organizationId));

	console.log(`Approved ${hospital.name}.`);

	try {
		await sendHospitalApprovedEmail({
			email: normalizedOwnerEmail,
			hospitalName: hospital.name,
			signInUrl: new URL("/sign-in", ENV.BETTER_AUTH_URL).toString(),
		});
		console.log(`Emailed ${ownerEmail}.`);
	} catch (error) {
		console.error(`Approved, but the email to ${ownerEmail} failed:`, error);
		process.exitCode = 1;
	}
}

const ownerEmail = process.argv[2];

(ownerEmail ? approveHospital(ownerEmail) : listPendingHospitals())
	.catch((error) => {
		console.error("Approving the hospital failed:", error);
		process.exitCode = 1;
	})
	.finally(() => sql.end());
