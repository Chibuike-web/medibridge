// @vitest-environment node
import { config } from "dotenv";
import { createHash, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "vitest";

config({ path: ".env.local", quiet: true });

test.skipIf(process.env.TEST_STORAGE_INTEGRATION !== "1")(
	"private buckets accept a direct upload larger than a Vercel request, reject overwrites, and only serve authorized reads",
	async () => {
		const client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
			auth: { persistSession: false },
		});
		const bytes = Buffer.alloc(5 * 1024 * 1024, 65);
		bytes.write("%PDF-1.4 synthetic storage verification\n");
		for (const bucket of ["patient-uploads", "hospital-uploads"]) {
			const key = `_storage-verification/${randomUUID()}.pdf`;
			const storage = client.storage.from(bucket);
			try {
				const { data: grant, error } = await storage.createSignedUploadUrl(key, { upsert: false });
				expect(error).toBeNull();
				expect(grant).not.toBeNull();
				const uploaded = await fetch(grant!.signedUrl, {
					method: "PUT",
					headers: { "Content-Type": "application/pdf", "x-upsert": "false" },
					body: bytes,
				});
				expect(uploaded.ok).toBe(true);
				const { data: metadata, error: infoError } = await storage.info(key);
				expect(infoError).toBeNull();
				expect(metadata).toMatchObject({ size: bytes.length, contentType: "application/pdf" });
				const { data: listed, error: listError } = await storage.list("_storage-verification", {
					search: key.split("/")[1],
				});
				expect(listError).toBeNull();
				expect(listed?.[0].metadata).toMatchObject({
					size: bytes.length,
					mimetype: "application/pdf",
				});
				const overwrite = await fetch(grant!.signedUrl, {
					method: "PUT",
					headers: { "Content-Type": "application/pdf", "x-upsert": "true" },
					body: Buffer.from("replacement"),
				});
				expect(overwrite.ok).toBe(false);
				const { data: signed } = await storage.createSignedUrl(key, 60);
				const downloaded = await fetch(signed!.signedUrl);
				expect(downloaded.ok).toBe(true);
				const digest = (value: Uint8Array) => createHash("sha256").update(value).digest("hex");
				expect(digest(new Uint8Array(await downloaded.arrayBuffer()))).toBe(digest(bytes));
				const publicRead = await fetch(
					`${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${key}`,
				);
				expect(publicRead.ok).toBe(false);
			} finally {
				const { error } = await storage.remove([key]);
				expect(error).toBeNull();
			}
		}
	},
	90_000,
);
