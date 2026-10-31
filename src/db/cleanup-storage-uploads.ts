import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

config({ path: ".env.local", quiet: true });
const client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
	auth: { persistSession: false },
});
const databaseUrl = new URL(process.env.DATABASE_URL!);
const projectRef = new URL(process.env.SUPABASE_URL!).hostname.split(".")[0];
const isPoolerConnection =
	databaseUrl.hostname.endsWith(".supabase.com") &&
	decodeURIComponent(databaseUrl.username) === `postgres.${projectRef}`;
const isDirectConnection = databaseUrl.hostname === `db.${projectRef}.supabase.co`;
if (!isPoolerConnection && !isDirectConnection) {
	throw new Error("Cleanup must use the same Supabase project for database and storage.");
}
const sql = postgres(databaseUrl.toString(), { max: 1, ssl: "require", connect_timeout: 10 });
const apply = process.argv.includes("--apply");
const unusedObjects: { bucket: string; name: string }[] = [];
let removed = 0;

try {
	const accreditationObjects = await sql<{ name: string }[]>`
		select name from storage.objects
		where bucket_id = 'hospital-uploads' and created_at < now() - interval '24 hours'
	`;
	for (const { name } of accreditationObjects) {
		const [owner] = name.split("/");
		const references =
			await sql`select id from "hospitalDetails" where document_path = ${name} limit 1`;
		if (references.length) continue;
		const ownerHospitals = await sql`
			select id from "hospitalDetails" where starts_with(document_path, ${`${owner}/`}) limit 1
		`;
		const [newestUpload] = await sql<{ name: string }[]>`
			select name from storage.objects
			where bucket_id = 'hospital-uploads' and starts_with(name, ${`${owner}/`})
			order by created_at desc limit 1
		`;
		if (!ownerHospitals.length && newestUpload?.name === name) continue;
		unusedObjects.push({ bucket: "hospital-uploads", name });
	}

	const reportObjects = await sql<{ name: string }[]>`
		select name from storage.objects
		where bucket_id = 'patient-uploads' and created_at < now() - interval '24 hours'
		and name like '%/record-files/%'
	`;
	for (const { name } of reportObjects) {
		const fileId = name
			.split("/")
			.at(-1)
			?.replace(/\.[^.]+$/, "");
		if (!fileId) continue;
		const references = await sql`
			select id from patient_lab_test_file where id = ${fileId}
			union all select id from patient_imaging_file where id = ${fileId} limit 1
		`;
		if (references.length) continue;
		unusedObjects.push({ bucket: "patient-uploads", name });
	}

	const intakeObjects = await sql<{ name: string }[]>`
		select name from storage.objects
		where bucket_id = 'patient-uploads' and created_at < now() - interval '24 hours'
		and name ~ '^[^/]+/[^/]+/[^/]+$' and name not like '%/record-files/%'
	`;
	for (const { name } of intakeObjects) {
		const [organizationId, createdBy, documentId] = name.split("/");
		const references = await sql`
			select id from patient_extractions
			where organization_id = ${organizationId} and created_by = ${createdBy}
			and extracted_data @> ${sql.json([{ documentId }])} limit 1
		`;
		if (references.length) continue;
		unusedObjects.push({ bucket: "patient-uploads", name });
	}

	if (apply) {
		for (const { bucket, name } of unusedObjects) {
			const { error } = await client.storage.from(bucket).remove([name]);
			if (error) throw error;
			removed++;
		}
	}

	console.log({
		mode: apply ? "removed expired unreferenced uploads" : "dry run; review before using --apply",
		eligible: unusedObjects.length,
		removed,
		retained: "All referenced files and each owner's newest unsubmitted accreditation upload",
	});
} finally {
	await sql.end();
}
