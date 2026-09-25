import { APIError } from "better-auth";

const invitableRoles: Record<string, string[]> = {
	owner: ["admin", "member"],
	admin: ["member"],
};

type InviterAccess = {
	inviterRole: string;
	isOrganizationVerified: boolean;
};

export function assertOfficialEmail(email: string) {
	if (!email.toLowerCase().endsWith(".org")) {
		throw new APIError("BAD_REQUEST", {
			message: "Use your official hospital email address (.org).",
		});
	}
}

export function assertCanJoinHospital(hasHospitalMembership: boolean) {
	if (hasHospitalMembership) {
		throw new APIError("FORBIDDEN", {
			message: "Your account already belongs to a hospital. An account can only join one hospital.",
		});
	}
}

export function assertInviteeCanJoinHospital(inviteeHasHospitalMembership: boolean) {
	if (inviteeHasHospitalMembership) {
		throw new APIError("FORBIDDEN", {
			message: "This person already belongs to a hospital and can't be invited to another.",
		});
	}
}

export function assertAccountCanBeDeleted(memberRoles: string[]) {
	const ownsAnOrganization = memberRoles.some((memberRole) =>
		memberRole.split(",").some((role) => role.trim() === "owner"),
	);

	if (ownsAnOrganization) {
		throw new APIError("FORBIDDEN", {
			message: "Transfer ownership of your hospital before deleting your account.",
		});
	}
}

export function assertInvitationAllowed(
	invitation: { email: string; role: string },
	inviterAccess: InviterAccess | undefined,
) {
	assertOfficialEmail(invitation.email);

	if (!inviterAccess?.isOrganizationVerified) {
		throw new APIError("FORBIDDEN", {
			message: "Your hospital must be verified before you can send invitations.",
		});
	}

	// Better Auth joins multiple requested roles with commas, so every role must be allowed.
	const allowedRoles = invitableRoles[inviterAccess.inviterRole] ?? [];
	const requestedRoles = invitation.role.split(",").map((role) => role.trim());

	if (!requestedRoles.every((role) => allowedRoles.includes(role))) {
		throw new APIError("FORBIDDEN", {
			message: "You can't invite someone with this role.",
		});
	}
}
