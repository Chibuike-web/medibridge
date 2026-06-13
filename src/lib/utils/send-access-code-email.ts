import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAccessCodeEmail({
	email,
	code,
}: {
	email: string;
	code: string;
}) {
	return resend.emails.send({
		from: "MediBridge <onboarding@resend.dev>",
		to: email,
		subject: "Your shared patient record access code",
		html: `
			<div>
				<p>Your verification code is:</p>
				<p style="font-size: 24px; font-weight: 700; letter-spacing: 4px;">${code}</p>
				<p>This code expires in 10 minutes.</p>
			</div>
		`,
	});
}
