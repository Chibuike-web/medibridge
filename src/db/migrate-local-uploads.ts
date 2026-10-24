import { config } from "dotenv";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local", quiet: true });
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
	auth: { persistSession: false },
});
const sourceIndex = process.argv.indexOf("--source");
const source = path.resolve(sourceIndex >= 0 ? process.argv[sourceIndex + 1] : process.cwd());
const apply = process.argv.includes("--apply");
const contentTypes: Record<string, string> = {
	".pdf": "application/pdf",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".doc": "application/msword",
	".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};
let copied = 0;
let existing = 0;
let planned = 0;
let skipped = 0;

for (const bucket of ["patient-uploads", "hospital-uploads"]) {
	const root = path.join(source, bucket);
	const pending = [""];
	while (pending.length) {
		const relative = pending.pop()!;
		const directory = path.join(root, relative);
		const entries = await readdir(directory, { withFileTypes: true }).catch(
			(error: NodeJS.ErrnoException) => {
				if (error.code === "ENOENT" && !relative) return [];
				throw error;
			},
		);
		for (const entry of entries) {
			const relativeName = path.join(relative, entry.name);
			if (entry.isDirectory()) {
				pending.push(relativeName);
				continue;
			}
			if (!entry.isFile()) continue;
			const type = contentTypes[path.extname(entry.name).toLowerCase()];
			if (!type) continue;
			let key = relativeName.split(path.sep).join("/");
			const parts = key.split("/");
			const generatedName =
				/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(pdf|png|jpe?g|docx?)$/i.test(
					entry.name,
				);
			const ownedPath =
				bucket === "hospital-uploads"
					? parts.length === 2
					: parts.length === 3 || (parts.length === 4 && parts[1] === "record-files");
			if (!generatedName || !ownedPath) {
				skipped++;
				continue;
			}
			// Older clinical objects nested the file under its record ID; the API now uses the immutable file ID.
			if (bucket === "patient-uploads" && parts.length === 4 && parts[1] === "record-files")
				key = `${parts[0]}/record-files/${parts[3]}`;
			planned++;
			if (!apply) continue;
			const bytes = await readFile(path.join(root, relativeName));
			const { error } = await supabase.storage
				.from(bucket)
				.upload(key, bytes, { contentType: type, upsert: false });
			if (!error) {
				copied++;
				continue;
			}
			if (error.statusCode !== "409" && !/already exists/i.test(error.message)) throw error;
			const { data, error: readError } = await supabase.storage.from(bucket).download(key);
			if (readError) throw readError;
			const digest = (input: Uint8Array) => createHash("sha256").update(input).digest("hex");
			if (digest(bytes) !== digest(new Uint8Array(await data.arrayBuffer())))
				throw new Error(
					`An existing ${bucket} object differs from the local file; nothing was overwritten.`,
				);
			existing++;
		}
	}
}
console.log({
	mode: apply ? "copied and verified; local files preserved" : "dry run; use --apply to copy",
	planned,
	copied,
	existing,
	skippedUnrecognizedLegacyFiles: skipped,
});
