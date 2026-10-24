import { z } from "zod";

export const uploadMetadataSchema = z.object({
	name: z.string().trim().min(1).max(255),
	type: z.string().min(1),
	size: z
		.number()
		.int()
		.positive()
		.max(50 * 1024 * 1024, "Each file can be up to 50 MB."),
});

export const recordUploadSchema = uploadMetadataSchema.extend({
	id: z.uuid(),
	type: z.enum(["application/pdf", "image/png", "image/jpeg"]),
	patientId: z.string().min(1),
	organizationId: z.string().min(1),
	userId: z.string().min(1),
	recordType: z.enum(["lab", "imaging"]),
});
