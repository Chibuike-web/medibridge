// @vitest-environment node

import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { sql } from "drizzle-orm";
import { hospitalDetails, organization, patient } from "@/db/schemas";
import { patientExtraction } from "@/db/schemas/patient";
import { patientLabTest, patientLabTestFile } from "@/db/schemas/patient/lab-test";
import {
	migrateTestDatabase,
	resetTestDatabase,
	testDatabaseUrl,
	useTestDatabase,
} from "../../helpers/test-database";

const { removedAccreditation, removedPatientFiles } = vi.hoisted(() => ({
	removedAccreditation: [] as string[],
	removedPatientFiles: [] as string[],
}));

vi.mock("@/lib/storage/client", () => ({
	hospitalUploads: {
		remove: async (keys: string[]) => {
			removedAccreditation.push(...keys);
			return { data: [], error: null };
		},
	},
	patientUploads: {
		remove: async (keys: string[]) => {
			removedPatientFiles.push(...keys);
			return { data: [], error: null };
		},
	},
}));

// WARNING: this test truncates and drops the storage schema. Never let it run on a Supabase database.
const isLocalDatabase =
	!!testDatabaseUrl && ["localhost", "127.0.0.1"].includes(new URL(testDatabaseUrl).hostname);

describe.skipIf(!isLocalDatabase)("sweeping unreferenced uploads", () => {
	let authModule: typeof import("@/lib/better-auth/auth");
	let cleanupUnreferencedUploadsService: typeof import("@/services/patient/cleanup-unreferenced-uploads-service").cleanupUnreferencedUploadsService;

	async function storeObject(bucketId: string, name: string, ageInHours: number) {
		await authModule.db.execute(sql`
			insert into storage.objects (bucket_id, name, created_at)
			values (${bucketId}, ${name}, now() - make_interval(hours => ${ageInHours}))
		`);
	}

	beforeAll(async () => {
		useTestDatabase();
		await migrateTestDatabase();
		authModule = await import("@/lib/better-auth/auth");
		({ cleanupUnreferencedUploadsService } =
			await import("@/services/patient/cleanup-unreferenced-uploads-service"));
		const { ENV } = await import("@/lib/utils/env");
		vi.stubEnv("SUPABASE_URL", "https://projectref.supabase.co");
		ENV.DATABASE_URL = "postgresql://postgres.projectref:secret@pooler.supabase.com:5432/postgres";
		await authModule.db.execute(sql`create schema if not exists storage`);
		await authModule.db.execute(sql`
			create table if not exists storage.objects (
				bucket_id text not null,
				name text not null,
				created_at timestamptz not null
			)
		`);
	});

	beforeEach(async () => {
		await resetTestDatabase();
		await authModule.db.execute(sql`truncate table storage.objects`);
		removedAccreditation.length = 0;
		removedPatientFiles.length = 0;

		await authModule.db.insert(organization).values({
			id: "hospital-1",
			name: "Test Hospital",
			slug: "test-hospital",
			createdAt: new Date(),
		});
		await authModule.db.insert(hospitalDetails).values({
			id: "details-1",
			organizationId: "hospital-1",
			hospitalName: "Test Hospital",
			hospitalAddress: "1 Test Road",
			hospitalOwnerName: "Owner One",
			hospitalOwnerEmail: "owner-1@hospital.test",
			documentPath: "owner-1/submitted.pdf",
		});
		await authModule.db.insert(patient).values({ id: "patient-1", organizationId: "hospital-1" });
		await authModule.db.insert(patientLabTest).values({
			id: "LAB-1",
			patientId: "patient-1",
			testName: "Full blood count",
			status: "Pending",
			createdBy: "Owner One",
			orderedBy: "Dr. Obi",
			orderedAt: new Date(),
			specimen: "Blood",
		} as typeof patientLabTest.$inferInsert);
		await authModule.db.insert(patientLabTestFile).values({
			id: "saved-report",
			parentRecordId: "LAB-1",
			name: "report.pdf",
			url: "/api/patient-record-files/lab/saved-report",
			type: "application/pdf",
			size: "10 B",
		} as typeof patientLabTestFile.$inferInsert);
		await authModule.db.insert(patientExtraction).values({
			id: "extraction-1",
			organizationId: "hospital-1",
			createdBy: "member-1",
			extractedData: [{ documentId: "in-review.pdf", status: "failed", patient: null }],
		});
	});

	afterAll(async () => {
		await authModule?.db.execute(sql`drop schema if exists storage cascade`);
		await authModule?.sql.end();
		vi.unstubAllEnvs();
	});

	test("keeps the accreditation file a hospital points to and removes its old uploads", async () => {
		await storeObject("hospital-uploads", "owner-1/submitted.pdf", 48);
		await storeObject("hospital-uploads", "owner-1/replaced.pdf", 72);

		await cleanupUnreferencedUploadsService();

		expect(removedAccreditation).toEqual(["owner-1/replaced.pdf"]);
	});

	test("keeps an owner's newest upload until they submit their hospital details", async () => {
		await storeObject("hospital-uploads", "owner-2/newest.pdf", 48);
		await storeObject("hospital-uploads", "owner-2/older.pdf", 72);

		await cleanupUnreferencedUploadsService();

		expect(removedAccreditation).toEqual(["owner-2/older.pdf"]);
	});

	test("keeps a report saved on a record and removes one that never was", async () => {
		await storeObject("patient-uploads", "hospital-1/record-files/saved-report.pdf", 48);
		await storeObject("patient-uploads", "hospital-1/record-files/never-saved.pdf", 48);

		await cleanupUnreferencedUploadsService();

		expect(removedPatientFiles).toEqual(["hospital-1/record-files/never-saved.pdf"]);
	});

	test("keeps a document still under review and removes one with no review", async () => {
		await storeObject("patient-uploads", "hospital-1/member-1/in-review.pdf", 48);
		await storeObject("patient-uploads", "hospital-1/member-1/no-review.pdf", 48);

		await cleanupUnreferencedUploadsService();

		expect(removedPatientFiles).toEqual(["hospital-1/member-1/no-review.pdf"]);
	});

	test("doesn't let another member's review protect a file with the same name", async () => {
		await storeObject("patient-uploads", "hospital-1/member-2/in-review.pdf", 48);

		await cleanupUnreferencedUploadsService();

		expect(removedPatientFiles).toEqual(["hospital-1/member-2/in-review.pdf"]);
	});

	test("leaves every file under a day old alone", async () => {
		await storeObject("patient-uploads", "hospital-1/record-files/just-uploaded.pdf", 1);
		await storeObject("patient-uploads", "hospital-1/member-1/just-uploaded.pdf", 1);
		await storeObject("hospital-uploads", "owner-1/just-uploaded.pdf", 1);

		expect(await cleanupUnreferencedUploadsService()).toEqual({
			status: "success",
			removedCount: 0,
		});
	});
});
