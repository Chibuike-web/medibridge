import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
export async function sendEmail(email: string, url: string) {
	try {
		const data = await resend.emails.send({
			from: "Acme <onboarding@resend.dev>",
			to: email,
			subject: "Verify your email",
			html: `<strong>Verification Link ${url}</strong>`,
		});

		return data;
	} catch (error) {
		console.error(error);
	}
}
