// @vitest-environment node

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { uploadReportFiles, type UploadedReports } from "./upload-report-files";

const fetchMock = vi.fn();
const report = new File(["%PDF-1.4"], "cbc.pdf", { type: "application/pdf", lastModified: 1 });

function grantResponse(receipt = "receipt-1", expiresIn = 7200) {
	return Response.json({
		status: "success",
		signedUrl: "https://storage.test/upload",
		receipt,
		expiresIn,
	});
}

describe("uploading report files", () => {
	let uploadedReports: UploadedReports;

	beforeEach(() => {
		uploadedReports = new Map();
		fetchMock.mockReset();
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => vi.unstubAllGlobals());

	test("uploads the bytes to storage and returns the receipt", async () => {
		fetchMock.mockResolvedValueOnce(grantResponse()).mockResolvedValueOnce(new Response(null));

		const result = await uploadReportFiles([report], "patient-1", "lab", uploadedReports);

		expect(result).toEqual({ status: "success", receipts: ["receipt-1"] });
		expect(fetchMock).toHaveBeenLastCalledWith(
			"https://storage.test/upload",
			expect.objectContaining({ method: "PUT", body: report }),
		);
	});

	test("reuses an uploaded report when the save is retried", async () => {
		fetchMock.mockResolvedValueOnce(grantResponse()).mockResolvedValueOnce(new Response(null));
		await uploadReportFiles([report], "patient-1", "lab", uploadedReports);
		fetchMock.mockClear();

		const result = await uploadReportFiles([report], "patient-1", "lab", uploadedReports);

		expect(result).toEqual({ status: "success", receipts: ["receipt-1"] });
		expect(fetchMock).not.toHaveBeenCalled();
	});

	test("uploads again once the earlier receipt has expired", async () => {
		fetchMock
			.mockResolvedValueOnce(grantResponse("old-receipt", 60))
			.mockResolvedValueOnce(new Response(null))
			.mockResolvedValueOnce(grantResponse("new-receipt"))
			.mockResolvedValueOnce(new Response(null));
		await uploadReportFiles([report], "patient-1", "lab", uploadedReports);

		const result = await uploadReportFiles([report], "patient-1", "lab", uploadedReports);

		expect(result).toEqual({ status: "success", receipts: ["new-receipt"] });
	});

	test("reports an expired session so the drawer can send the user to sign in", async () => {
		fetchMock.mockResolvedValueOnce(
			Response.json(
				{ status: "unauthorized", error: "Sign in to attach reports." },
				{ status: 401 },
			),
		);

		const result = await uploadReportFiles([report], "patient-1", "lab", uploadedReports);

		expect(result).toEqual({ status: "unauthorized", error: "Sign in to attach reports." });
	});

	test("shows the grant's error and uploads nothing when the report is refused", async () => {
		fetchMock.mockResolvedValueOnce(
			Response.json({ status: "failed", error: "Patient could not be found." }, { status: 404 }),
		);

		const result = await uploadReportFiles([report], "patient-1", "lab", uploadedReports);

		expect(result).toEqual({ status: "failed", error: "Patient could not be found." });
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	test("does not keep a receipt when storage refuses the bytes", async () => {
		fetchMock
			.mockResolvedValueOnce(grantResponse())
			.mockResolvedValueOnce(new Response(null, { status: 500 }));

		const result = await uploadReportFiles([report], "patient-1", "lab", uploadedReports);

		expect(result).toEqual({
			status: "failed",
			error: "We couldn’t upload this report. Please try again.",
		});
		expect(uploadedReports.size).toBe(0);
	});
});
