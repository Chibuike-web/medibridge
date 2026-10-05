// @vitest-environment node

import { describe, expect, test } from "vitest";
import {
	assertAccountCanBeDeleted,
	assertCanJoinHospital,
	assertInvitationAllowed,
	assertInviteeCanJoinHospital,
	assertOwnerEmail,
} from "./auth-policies";

const verifiedOwner = { inviterRole: "owner", isOrganizationVerified: true };
const verifiedAdmin = { inviterRole: "admin", isOrganizationVerified: true };
const verifiedMember = { inviterRole: "member", isOrganizationVerified: true };

describe("assertOwnerEmail", () => {
	test("accepts an official .org hospital email regardless of letter case", () => {
		expect(() => assertOwnerEmail("sarah@stmaryhospital.org")).not.toThrow();
		expect(() => assertOwnerEmail("SARAH@STMARYHOSPITAL.ORG")).not.toThrow();
	});

	test("rejects an email outside the .org domain", () => {
		expect(() => assertOwnerEmail("sarah@gmail.com")).toThrow(
			"Use your official hospital email address (.org).",
		);
	});
});

describe("assertCanJoinHospital", () => {
	test("lets an account without a hospital join one", () => {
		expect(() => assertCanJoinHospital(false)).not.toThrow();
	});

	test("does not let an account that already belongs to a hospital join another", () => {
		expect(() => assertCanJoinHospital(true)).toThrow(
			"Your account already belongs to a hospital. An account can only join one hospital.",
		);
	});
});

describe("assertInviteeCanJoinHospital", () => {
	test("lets a hospital invite someone who has no hospital yet", () => {
		expect(() => assertInviteeCanJoinHospital(false)).not.toThrow();
	});

	test("does not let a hospital invite someone who already belongs to another hospital", () => {
		expect(() => assertInviteeCanJoinHospital(true)).toThrow(
			"This person already belongs to a hospital and can't be invited to another.",
		);
	});
});

describe("assertAccountCanBeDeleted", () => {
	test("lets an administrator or member delete their account", () => {
		expect(() => assertAccountCanBeDeleted(["admin"])).not.toThrow();
		expect(() => assertAccountCanBeDeleted(["member"])).not.toThrow();
	});

	test("lets someone without any hospital membership delete their account", () => {
		expect(() => assertAccountCanBeDeleted([])).not.toThrow();
	});

	test("does not let a hospital owner delete their account before transferring ownership", () => {
		expect(() => assertAccountCanBeDeleted(["owner"])).toThrow(
			"Transfer ownership of your hospital before deleting your account.",
		);
	});

	test("checks every hospital, not only the one currently active", () => {
		expect(() => assertAccountCanBeDeleted(["admin", "member", "owner"])).toThrow(
			"Transfer ownership of your hospital before deleting your account.",
		);
	});
});

describe("assertInvitationAllowed", () => {
	test("lets a verified hospital owner invite an administrator or a member", () => {
		expect(() => assertInvitationAllowed({ role: "admin" }, verifiedOwner)).not.toThrow();
		expect(() => assertInvitationAllowed({ role: "member" }, verifiedOwner)).not.toThrow();
	});

	test("lets a verified hospital administrator invite a member", () => {
		expect(() => assertInvitationAllowed({ role: "member" }, verifiedAdmin)).not.toThrow();
	});

	test("does not let an administrator invite another administrator", () => {
		expect(() => assertInvitationAllowed({ role: "admin" }, verifiedAdmin)).toThrow(
			"You can't invite someone with this role.",
		);
	});

	test("does not let an administrator gain admin rights by requesting several roles", () => {
		expect(() => assertInvitationAllowed({ role: "member,admin" }, verifiedAdmin)).toThrow(
			"You can't invite someone with this role.",
		);
	});

	test("does not let an owner invite another owner", () => {
		expect(() => assertInvitationAllowed({ role: "owner" }, verifiedOwner)).toThrow(
			"You can't invite someone with this role.",
		);
	});

	test("does not let a member send invitations", () => {
		expect(() => assertInvitationAllowed({ role: "member" }, verifiedMember)).toThrow(
			"You can't invite someone with this role.",
		);
	});

	test("does not send invitations before the hospital is verified", () => {
		expect(() =>
			assertInvitationAllowed(
				{ role: "admin" },
				{ inviterRole: "owner", isOrganizationVerified: false },
			),
		).toThrow("Your hospital must be verified before you can send invitations.");
	});

	test("does not send invitations for someone who is not a member of the hospital", () => {
		expect(() => assertInvitationAllowed({ role: "admin" }, undefined)).toThrow(
			"Your hospital must be verified before you can send invitations.",
		);
	});
});
