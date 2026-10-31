import "server-only";

import { sql } from "drizzle-orm";
import { db } from "@/lib/better-auth/auth";
import { hospitalUploads, patientUploads } from "@/lib/storage/client";
import { ENV } from "@/lib/utils/env";

type CleanupUnreferencedUploadsResult =
	| { status: "success"; removedCount: number }
	| { status: "failed"; error: string };

export async function cleanupUnreferencedUploadsService(): Promise<CleanupUnreferencedUploadsResult> {
	try {
		const databaseUrl = new URL(ENV.DATABASE_URL);
		const projectRef = new URL(process.env.SUPABASE_URL!).hostname.split(".")[0];
		const isPoolerConnection =
			databaseUrl.hostname.endsWith(".supabase.com") &&
			decodeURIComponent(databaseUrl.username) === `postgres.${projectRef}`;
		const isDirectConnection = databaseUrl.hostname === `db.${projectRef}.supabase.co`;

		// WARNING: never remove this check. Against another project's database every stored file
		// looks unreferenced, and this cleanup would delete all of them.
		if (!isPoolerConnection && !isDirectConnection) {
			console.error("Skipped upload cleanup: the database and storage projects differ.");
			return { status: "failed", error: "We couldn’t clean up unreferenced uploads." };
		}

		const unreferencedFiles = await db.execute<{ bucket_id: string; name: string }>(sql`
			select bucket_id, name from storage.objects as object
			where object.created_at < now() - interval '24 hours'
			and (
				(
					object.bucket_id = 'hospital-uploads'
					and not exists (
						select 1 from "hospitalDetails" where document_path = object.name
					)
					and (
						exists (
							select 1 from "hospitalDetails"
							where starts_with(document_path, split_part(object.name, '/', 1) || '/')
						)
						or exists (
							select 1 from storage.objects as newer
							where newer.bucket_id = object.bucket_id
							and split_part(newer.name, '/', 1) = split_part(object.name, '/', 1)
							and newer.created_at > object.created_at
						)
					)
				)
				or (
					object.bucket_id = 'patient-uploads'
					and object.name like '%/record-files/%'
					and not exists (
						select 1 from patient_lab_test_file
						where id = regexp_replace(split_part(object.name, '/', 3), '\\.[^.]+$', '')
					)
					and not exists (
						select 1 from patient_imaging_file
						where id = regexp_replace(split_part(object.name, '/', 3), '\\.[^.]+$', '')
					)
				)
				or (
					object.bucket_id = 'patient-uploads'
					and object.name ~ '^[^/]+/[^/]+/[^/]+$'
					and object.name not like '%/record-files/%'
					and not exists (
						select 1 from patient_extractions as extraction
						where extraction.organization_id = split_part(object.name, '/', 1)
						and extraction.created_by = split_part(object.name, '/', 2)
						and extraction.extracted_data @> jsonb_build_array(
							jsonb_build_object('documentId', split_part(object.name, '/', 3))
						)
					)
				)
			)
			limit 500
		`);

		const accreditationKeys = unreferencedFiles
			.filter((file) => file.bucket_id === "hospital-uploads")
			.map((file) => file.name);
		const patientKeys = unreferencedFiles
			.filter((file) => file.bucket_id === "patient-uploads")
			.map((file) => file.name);

		if (accreditationKeys.length > 0) {
			const { error } = await hospitalUploads.remove(accreditationKeys);
			if (error) throw error;
		}

		if (patientKeys.length > 0) {
			const { error } = await patientUploads.remove(patientKeys);
			if (error) throw error;
		}

		return { status: "success", removedCount: accreditationKeys.length + patientKeys.length };
	} catch (error) {
		console.error("Cleaning up unreferenced uploads failed:", error);
		return { status: "failed", error: "We couldn’t clean up unreferenced uploads." };
	}
}
