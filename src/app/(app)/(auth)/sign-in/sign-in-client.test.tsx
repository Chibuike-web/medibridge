import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { SignInClient } from "./sign-in-client";

const {
	getOrganizationAccessActionMock,
	listOrganizationsMock,
	listUserInvitationsMock,
	replaceMock,
	searchParamsState,
	sendVerificationEmailMock,
	setActiveOrganizationMock,
	signInEmailMock,
} = vi.hoisted(() => ({
	getOrganizationAccessActionMock: vi.fn(),
	listOrganizationsMock: vi.fn(),
	listUserInvitationsMock: vi.fn(),
	replaceMock: vi.fn(),
	searchParamsState: { query: "" },
	sendVerificationEmailMock: vi.fn(),
	setActiveOrganizationMock: vi.fn(),
	signInEmailMock: vi.fn(),
}));

// jsdom has no ResizeObserver, which the Remember me checkbox needs.
vi.stubGlobal(
	"ResizeObserver",
	class {
		observe() {}
		unobserve() {}
		disconnect() {}
	},
);

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn(), replace: replaceMock }),
	useSearchParams: () => new URLSearchParams(searchParamsState.query),
}));

vi.mock("@/features/auth/server/actions", () => ({
	getOrganizationAccessAction: getOrganizationAccessActionMock,
}));

vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: {
		signIn: { email: signInEmailMock },
		sendVerificationEmail: sendVerificationEmailMock,
		organization: {
			list: listOrganizationsMock,
			listUserInvitations: listUserInvitationsMock,
			setActive: setActiveOrganizationMock,
		},
	},
}));

async function submitSignInForm() {
	const user = userEvent.setup();
	render(<SignInClient />);

	await user.type(screen.getByRole("textbox", { name: "Email Address" }), "sarah@stmary.org");
	await user.type(screen.getByLabelText("Password"), "secure-password");
	await user.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("SignInClient", () => {
	beforeEach(() => {
		searchParamsState.query = "";
		signInEmailMock.mockResolvedValue({ data: { token: "session-token" }, error: null });
		sendVerificationEmailMock.mockResolvedValue({ data: { status: true }, error: null });
		listOrganizationsMock.mockResolvedValue({ data: [{ id: "hospital-1" }], error: null });
		listUserInvitationsMock.mockResolvedValue({ data: [], error: null });
		setActiveOrganizationMock.mockResolvedValue({ data: { id: "hospital-1" }, error: null });
		getOrganizationAccessActionMock.mockResolvedValue({
			status: "success",
			emailVerified: true,
			isOrganizationVerified: true,
		});
	});

	test("takes a verified owner of an approved hospital to the dashboard without sending a verification email", async () => {
		await submitSignInForm();

		await vi.waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/dashboard/overview"));
		expect(sendVerificationEmailMock).not.toHaveBeenCalled();
	});

	test("returns a signed-in member to the dashboard page they were trying to open", async () => {
		searchParamsState.query = `callbackUrl=${encodeURIComponent("/dashboard/patients/PT-1042?tab=vitals")}`;

		await submitSignInForm();

		await vi.waitFor(() =>
			expect(replaceMock).toHaveBeenCalledWith("/dashboard/patients/PT-1042?tab=vitals"),
		);
	});

	test.each(["https://evil.example/dashboard/", "//evil.example/dashboard/", "/sign-in"])(
		"ignores a callback address outside the dashboard (%s) and opens the overview",
		async (callbackUrl) => {
			searchParamsState.query = `callbackUrl=${encodeURIComponent(callbackUrl)}`;

			await submitSignInForm();

			await vi.waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/dashboard/overview"));
			expect(replaceMock).not.toHaveBeenCalledWith(callbackUrl);
		},
	);

	test("sends an owner whose hospital is not approved to the verify screen even with a callback address", async () => {
		searchParamsState.query = `callbackUrl=${encodeURIComponent("/dashboard/patients/PT-1042")}`;
		getOrganizationAccessActionMock.mockResolvedValue({
			status: "success",
			emailVerified: true,
			isOrganizationVerified: false,
		});

		await submitSignInForm();

		await vi.waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/verify"));
		expect(replaceMock).not.toHaveBeenCalledWith("/dashboard/patients/PT-1042");
	});

	test("sends an unverified owner a new link that returns to the email-verified page", async () => {
		signInEmailMock.mockResolvedValue({
			data: null,
			error: { status: 403, code: "EMAIL_NOT_VERIFIED", message: "Email not verified" },
		});

		await submitSignInForm();

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Check your inbox for a verification link before signing in.",
		);
		expect(sendVerificationEmailMock).toHaveBeenCalledWith({
			email: "sarah@stmary.org",
			callbackURL: "/email-verified",
		});
		expect(replaceMock).not.toHaveBeenCalled();
	});

	test("does not tell an unverified owner to check their inbox when the new link could not be sent", async () => {
		signInEmailMock.mockResolvedValue({
			data: null,
			error: { status: 403, code: "EMAIL_NOT_VERIFIED", message: "Email not verified" },
		});
		sendVerificationEmailMock.mockResolvedValue({
			data: null,
			error: { status: 429, message: "Too many requests" },
		});

		await submitSignInForm();

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Your email isn't verified yet, and we couldn't send a new link. Wait a moment and try again.",
		);
		expect(
			screen.queryByText("Check your inbox for a verification link before signing in."),
		).not.toBeInTheDocument();
		expect(replaceMock).not.toHaveBeenCalled();
	});

	test("lets a member choose a hospital and continue after signing in", async () => {
		const user = userEvent.setup();
		listOrganizationsMock.mockResolvedValue({
			data: [
				{ id: "hospital-1", name: "St Mary" },
				{ id: "hospital-2", name: "City Hospital" },
			],
			error: null,
		});
		await submitSignInForm();

		const hospitalSelector = await screen.findByRole("combobox", { name: "Hospital" });
		expect(screen.getByRole("option", { name: "St Mary" })).toBeVisible();
		expect(screen.getByRole("option", { name: "City Hospital" })).toBeVisible();
		await user.selectOptions(hospitalSelector, "hospital-2");
		await user.click(screen.getByRole("button", { name: "Continue" }));

		await vi.waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/dashboard/overview"));
		expect(setActiveOrganizationMock).toHaveBeenCalledWith({ organizationId: "hospital-2" });
	});

	test("returns an existing invitee to their invitation before hospital setup", async () => {
		const callbackUrl = "/accept-invite?invitationId=invite-1";
		searchParamsState.query = `callbackUrl=${encodeURIComponent(callbackUrl)}`;
		listOrganizationsMock.mockResolvedValue({ data: [], error: null });
		await submitSignInForm();

		await vi.waitFor(() => expect(replaceMock).toHaveBeenCalledWith(callbackUrl));
		expect(replaceMock).not.toHaveBeenCalledWith("/hospital-details");
	});

	test("keeps invitation context in the verification link for an unverified invitee", async () => {
		searchParamsState.query = `callbackUrl=${encodeURIComponent("/accept-invite?invitationId=invite-1")}`;
		signInEmailMock.mockResolvedValue({ error: { status: 403, code: "EMAIL_NOT_VERIFIED" } });
		await submitSignInForm();

		expect(await screen.findByRole("alert")).toHaveTextContent("Check your inbox");
		expect(sendVerificationEmailMock).toHaveBeenCalledWith({
			email: "sarah@stmary.org",
			callbackURL: "/accept-invite?invitationId=invite-1",
		});
	});

	test("shows a retryable error if loading hospitals fails after valid sign-in", async () => {
		listOrganizationsMock.mockRejectedValueOnce(new Error("database connection details"));
		await submitSignInForm();

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Unable to sign in. Please try again.",
		);
		expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
		expect(replaceMock).not.toHaveBeenCalled();
	});

	test("finds a pending invitation for a signed-in account without a callback", async () => {
		listOrganizationsMock.mockResolvedValue({ data: [], error: null });
		listUserInvitationsMock.mockResolvedValue({
			data: [
				{
					id: "pending-invite",
					status: "pending",
					expiresAt: new Date(Date.now() + 60_000).toISOString(),
				},
			],
			error: null,
		});
		await submitSignInForm();

		await vi.waitFor(() =>
			expect(replaceMock).toHaveBeenCalledWith("/accept-invite?invitationId=pending-invite"),
		);
		expect(replaceMock).not.toHaveBeenCalledWith("/hospital-details");
	});

	test("starts hospital onboarding when there are no current invitations", async () => {
		listOrganizationsMock.mockResolvedValue({ data: [], error: null });
		listUserInvitationsMock.mockResolvedValue({
			data: [
				{
					id: "expired-invite",
					status: "pending",
					expiresAt: new Date(Date.now() - 60_000).toISOString(),
				},
			],
			error: null,
		});
		await submitSignInForm();

		await vi.waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/hospital-details"));
	});

	test("returns to the credential form if the session expires while choosing a hospital", async () => {
		const user = userEvent.setup();
		listOrganizationsMock.mockResolvedValue({
			data: [
				{ id: "hospital-1", name: "St Mary" },
				{ id: "hospital-2", name: "City Hospital" },
			],
			error: null,
		});
		getOrganizationAccessActionMock.mockResolvedValueOnce({ status: "unauthorized" });
		await submitSignInForm();
		await user.click(await screen.findByRole("button", { name: "Continue" }));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Your session expired. Please sign in again.",
		);
		expect(screen.getByRole("textbox", { name: "Email Address" })).toHaveValue("sarah@stmary.org");
		expect(replaceMock).not.toHaveBeenCalled();
		await user.click(screen.getByRole("button", { name: "Sign in" }));
		await user.click(await screen.findByRole("button", { name: "Continue" }));
		await vi.waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/dashboard/overview"));
	});
});
