"use server";

import { patientPersonalIdentification } from "@/db/schemas/patient";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";
import { eq } from "drizzle-orm";
import { OverviewStats } from "./types";

export async function getOverviewStatsService(): Promise<OverviewStats> {
	const session = await getSessionData();
	const organizationId = session?.session.activeOrganizationId;

	if (!organizationId) {
		return {
			totalPatients: 0,
			transferredRecords: 0,
			newPatients: 0,
			patientCreatedAt: [],
			hasPatients: false,
		};
	}

	const patientRows = await db
		.select({ createdAt: patientPersonalIdentification.createdAt })
		.from(patientPersonalIdentification)
		.where(eq(patientPersonalIdentification.organizationId, organizationId));

	const now = new Date();
	const last7DaysStart = new Date(now);
	last7DaysStart.setDate(now.getDate() - 7);

	const newPatients = patientRows.filter((patient) => patient.createdAt >= last7DaysStart).length;
	const totalPatients = patientRows.length;
	const patientCreatedAt = patientRows.map((patient) => patient.createdAt.toISOString());

	return {
		totalPatients,
		transferredRecords: 0,
		newPatients,
		patientCreatedAt,
		hasPatients: totalPatients > 0,
	};
}
