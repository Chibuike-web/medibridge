import { SignJWT } from "jose";
import { and, eq } from "drizzle-orm";
import { patient } from "@/db/schemas";
import { recordFileExtensions } from "@/features/patients/server/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";
import { ENV } from "@/lib/utils/env";
import { patientUploads } from "@/lib/storage/client";
import { recordUploadSchema } from "@/lib/storage/schemas";

const receiptLifetimeInSeconds = 2 * 60 * 60;

export async function POST(request: Request) {
	try {
		const session = await getSessionData();
		if (!session?.user?.id) {
			return Response.json(
				{ status: "unauthorized", error: "Sign in to attach reports." },
				{ status: 401 },
			);
		}

		if (!session.user.emailVerified) {
			return Response.json(
				{ status: "failed", error: "Verify your email before attaching reports." },
				{ status: 403 },
			);
		}

		const organizationId = await getOrganizationId();
		if (!organizationId) {
			return Response.json(
				{ status: "failed", error: "Your hospital must be verified before attaching reports." },
				{ status: 403 },
			);
		}

		const parsed = recordUploadSchema
			.omit({ id: true, organizationId: true, userId: true })
			.safeParse(await request.json().catch(() => null));
		if (!parsed.success) {
			return Response.json(
				{ status: "failed", error: "Choose a PDF, PNG or JPG report up to 50 MB." },
				{ status: 400 },
			);
		}

		const [ownedPatient] = await db
			.select({ id: patient.id })
			.from(patient)
			.where(and(eq(patient.id, parsed.data.patientId), eq(patient.organizationId, organizationId)))
			.limit(1);
		if (!ownedPatient) {
			return Response.json(
				{ status: "failed", error: "Patient could not be found." },
				{ status: 404 },
			);
		}

		const file = {
			...parsed.data,
			id: crypto.randomUUID(),
			organizationId,
			userId: session.user.id,
		};
		const key = `${organizationId}/record-files/${file.id}${recordFileExtensions[file.type]}`;
		const { data, error } = await patientUploads.createSignedUploadUrl(key, { upsert: false });
		if (error) throw error;

		const receipt = await new SignJWT(file)
			.setProtectedHeader({ alg: "HS256" })
			.setAudience("patient-record-upload")
			.setIssuedAt()
			.setExpirationTime(`${receiptLifetimeInSeconds}s`)
			.sign(new TextEncoder().encode(ENV.BETTER_AUTH_SECRET));
		return Response.json(
			{
				status: "success",
				signedUrl: data.signedUrl,
				receipt,
				expiresIn: receiptLifetimeInSeconds,
			},
			{ headers: { "Cache-Control": "no-store" } },
		);
	} catch (error) {
		console.error("Preparing report upload failed:", error);
		return Response.json(
			{ status: "failed", error: "We couldn’t upload this report. Please try again." },
			{ status: 500 },
		);
	}
}
