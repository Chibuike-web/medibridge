import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

config({ path: ".env.local", quiet: true });
const client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
	auth: { persistSession: false },
});
const databaseUrl = new URL(process.env.DATABASE_URL!);
const projectRef = new URL(process.env.SUPABASE_URL!).hostname.split(".")[0];
if (
	!databaseUrl.hostname.endsWith("supabase.com") ||
	!decodeURIComponent(databaseUrl.username).includes(projectRef)
)
	throw new Error("Cleanup must use the same Supabase project for database and storage.");
const sql = postgres(databaseUrl.toString(), { max: 1, ssl: "require", connect_timeout: 10 });
const apply = process.argv.includes("--apply");
let eligible = 0;
let removed = 0;

try {
	const objects = await sql<{ name: string; bucket_id: string }[]>`
		select name, bucket_id from storage.objects
		where created_at < now() - interval '24 hours'
		and (bucket_id = 'hospital-uploads' or (bucket_id = 'patient-uploads' and name like '%/record-files/%'))
	`;
	for (const object of objects) {
		const fileId = object.name
			.split("/")
			.at(-1)
			?.replace(/\.[^.]+$/, "");
		if (!fileId) continue;
		const references =
			object.bucket_id === "hospital-uploads"
				? await sql`select id from "hospitalDetails" where document_path = ${object.name} limit 1`
				: await sql`select id from patient_lab_test_file where id = ${fileId} union all select id from patient_imaging_file where id = ${fileId} limit 1`;
		if (references.length) continue;
		eligible++;
		if (!apply) continue;
		const { error } = await client.storage.from(object.bucket_id).remove([object.name]);
		if (error) throw error;
		removed++;
	}
	console.log({
		mode: apply ? "removed expired unreferenced uploads" : "dry run; review before using --apply",
		eligible,
		removed,
		retained: "All intake source documents and all referenced files",
	});
} finally {
	await sql.end();
}
