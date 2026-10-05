import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { SignInClient } from "./sign-in-client";

const {
	getOrganizationAccessActionMock,
	listOrganizationsMock,
	replaceMock,
	sendVerificationEmailMock,
	setActiveOrganizationMock,
	signInEmailMock,
} = vi.hoisted(() => ({
	getOrganizationAccessActionMock: vi.fn(),
	listOrganizationsMock: vi.fn(),
	replaceMock: vi.fn(),
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
}));

vi.mock("@/features/auth/server/actions", () => ({
	getOrganizationAccessAction: getOrganizationAccessActionMock,
}));

vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: {
		signIn: { email: signInEmailMock },
		sendVerificationEmail: sendVerificationEmailMock,
		organization: { list: listOrganizationsMock, setActive: setActiveOrganizationMock },
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
		signInEmailMock.mockResolvedValue({ data: { token: "session-token" }, error: null });
		sendVerificationEmailMock.mockResolvedValue({ data: { status: true }, error: null });
		listOrganizationsMock.mockResolvedValue({ data: [{ id: "hospital-1" }], error: null });
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
});
