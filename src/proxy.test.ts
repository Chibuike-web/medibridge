// @vitest-environment node

import { NextRequest } from "next/server";
import { expect, test } from "vitest";
import { proxy } from "./proxy";

const reviewUrl = "http://localhost:4300/dashboard/review-extracted-info?extractionId=extraction-1";

test("sends a signed-out page visit to sign in and back afterwards", () => {
	const response = proxy(new NextRequest(reviewUrl));

	expect(response.status).toBe(307);
	expect(response.headers.get("location")).toBe(
		`http://localhost:4300/sign-in?callbackUrl=${encodeURIComponent("/dashboard/review-extracted-info?extractionId=extraction-1")}`,
	);
});

test("lets a signed-out server action reach its own sign-in check", () => {
	const response = proxy(
		new NextRequest(reviewUrl, { method: "POST", headers: { "next-action": "action-id" } }),
	);

	expect(response.status).toBe(200);
	expect(response.headers.get("location")).toBeNull();
});

test("lets a signed-in page visit through", () => {
	const response = proxy(
		new NextRequest(reviewUrl, { headers: { cookie: "better-auth.session_token=token" } }),
	);

	expect(response.status).toBe(200);
	expect(response.headers.get("location")).toBeNull();
});
