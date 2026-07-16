import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAccessCodeEmail({
	email,
	code,
	accessUrl,
}: {
	email: string;
	code: string;
	accessUrl?: string;
}) {
	return resend.emails.send({
		from: "MediBridge <onboarding@resend.dev>",
		to: email,
		subject: "Your shared patient record access code",
		html: `
			<div>
				<p>Your verification code is:</p>
				<p style="font-size: 1.25rem; font-weight: 700; letter-spacing: 0.25rem;">${code}</p>
				${accessUrl ? `<p>Open the shared patient record link: <a href="${accessUrl}">${accessUrl}</a></p>` : ""}
				<p>This code expires in 10 minutes.</p>
			</div>
		`,
	});
}
