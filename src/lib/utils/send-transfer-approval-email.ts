import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

export async function sendTransferApprovalEmail({
	email,
	patientName,
	sourceHospitalName,
	targetHospitalName,
	approvalUrl,
}: {
	email: string;
	patientName: string;
	sourceHospitalName: string;
	targetHospitalName: string;
	approvalUrl: string;
}) {
	return resend.emails.send({
		from: "MediBridge <onboarding@resend.dev>",
		to: email,
		subject: "Review your MediBridge record transfer",
		html: `
			<div>
				<p>Hello ${escapeHtml(patientName)},</p>
				<p>${escapeHtml(sourceHospitalName)} requested permission to share selected records with ${escapeHtml(targetHospitalName)}.</p>
				<p><a href="${escapeHtml(approvalUrl)}">Review and approve or reject this transfer</a></p>
				<p>This approval link expires in 7 days.</p>
			</div>
		`,
	});
}
