import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
export async function sendEmail(email: string, url: string) {
	const verificationEmail = await resend.emails.send({
		from: "Acme <onboarding@resend.dev>",
		to: email,
		subject: "Verify your email",
		html: `<p>Verify your email address to continue setting up your hospital.</p><p><a href="${escapeHtml(url)}">Verify email address</a></p>`,
	});

	if (verificationEmail.error) {
		throw new Error(verificationEmail.error.message);
	}

	return verificationEmail.data;
}

export async function sendPasswordResetEmail(email: string, url: string) {
	const resetEmail = await resend.emails.send({
		from: "Acme <onboarding@resend.dev>",
		to: email,
		subject: "Reset your MediBridge password",
		html: `<p>We received a request to reset your MediBridge password.</p><p><a href="${escapeHtml(url)}">Reset password</a></p><p>If you didn’t request this, you can ignore this email.</p>`,
		text: `We received a request to reset your MediBridge password. Reset it here: ${url}\n\nIf you didn’t request this, you can ignore this email.`,
	});

	if (resetEmail.error) {
		throw new Error(resetEmail.error.message);
	}

	return resetEmail.data;
}

type SendOrganizationInvitationEmailInput = {
	email: string;
	invitationUrl: string;
	inviterName: string;
	organizationName: string;
	recipientName: string;
};

export async function sendOrganizationInvitationEmail({
	email,
	invitationUrl,
	inviterName,
	organizationName,
	recipientName,
}: SendOrganizationInvitationEmailInput) {
	const invitationEmail = await resend.emails.send({
		from: "Acme <onboarding@resend.dev>",
		to: email,
		subject: `Invitation to join ${organizationName}`,
		html: `<p>Hello ${escapeHtml(recipientName)},</p><p>${escapeHtml(inviterName)} invited you to join ${escapeHtml(organizationName)} as an administrator.</p><p><a href="${escapeHtml(invitationUrl)}">Accept invitation</a></p>`,
	});

	if (invitationEmail.error) {
		throw new Error(invitationEmail.error.message);
	}

	return invitationEmail.data;
}

type SendHospitalApprovedEmailInput = {
	email: string;
	hospitalName: string;
	signInUrl: string;
};

export async function sendHospitalApprovedEmail({
	email,
	hospitalName,
	signInUrl,
}: SendHospitalApprovedEmailInput) {
	const approvedEmail = await resend.emails.send({
		from: "Acme <onboarding@resend.dev>",
		to: email,
		subject: `${hospitalName} is approved on MediBridge`,
		html: `<p>${escapeHtml(hospitalName)} has been approved. You can now sign in and start using MediBridge.</p><p><a href="${escapeHtml(signInUrl)}">Sign in</a></p>`,
		text: `${hospitalName} has been approved. You can now sign in and start using MediBridge: ${signInUrl}`,
	});

	if (approvedEmail.error) {
		throw new Error(approvedEmail.error.message);
	}

	return approvedEmail.data;
}

function escapeHtml(value: string) {
	return value.replace(
		/[&<>"']/g,
		(character) =>
			({
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&#039;",
			})[character]!,
	);
}
