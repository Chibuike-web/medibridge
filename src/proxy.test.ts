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

function visitSignedIn(path: string) {
	return proxy(
		new NextRequest(`http://localhost:4300${path}`, {
			headers: { cookie: "better-auth.session_token=token" },
		}),
	);
}

test("removes a rows-per-page limit the tables do not offer and keeps the other params", () => {
	const response = visitSignedIn(
		"/dashboard/patients/patient-1/encounters/ENC-1?limit=50&allergiesLimit=3&diagnosesLimit=28&query=Ada",
	);

	expect(response.status).toBe(307);
	expect(response.headers.get("location")).toBe(
		"http://localhost:4300/dashboard/patients/patient-1/encounters/ENC-1?diagnosesLimit=28&query=Ada",
	);
});

test("keeps every rows-per-page limit the tables offer", () => {
	const response = visitSignedIn("/dashboard/transfers?limit=14&allergiesLimit=28&vitalsLimit=42");

	expect(response.status).toBe(200);
	expect(response.headers.get("location")).toBeNull();
});

test("removes dates that are not real dates and keeps valid dates and the return link", () => {
	const response = visitSignedIn(
		"/dashboard/transfers?requestedFrom=garbage&requestedTo=2026-02-30&createdFrom=2026-10-01&returnTo=%2Fdashboard%2Fpatients",
	);

	expect(response.status).toBe(307);
	expect(response.headers.get("location")).toBe(
		"http://localhost:4300/dashboard/transfers?createdFrom=2026-10-01&returnTo=%2Fdashboard%2Fpatients",
	);
});

test("keeps a reversed but valid date range for the page to show", () => {
	const response = visitSignedIn(
		"/dashboard/transfers?requestedFrom=2026-10-10&requestedTo=2026-09-01",
	);

	expect(response.status).toBe(200);
	expect(response.headers.get("location")).toBeNull();
});
