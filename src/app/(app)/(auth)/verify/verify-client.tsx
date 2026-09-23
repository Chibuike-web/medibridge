"use client";

import { RiCheckboxCircleFill, RiLockLine, RiTimeLine } from "@remixicon/react";
import useSWR from "swr";

type VerificationStep = {
	id: string;
	label: string;
	description: string;
	status: "complete" | "pending" | "locked";
	statusLabel: string;
};

const initialVerificationSteps: VerificationStep[] = [
	{
		id: "registration",
		label: "Account created",
		description: "Your MediBridge account is ready.",
		status: "complete",
		statusLabel: "Complete",
	},
	{
		id: "email-verification",
		label: "Email address verification",
		description: "Check your inbox to verify your hospital email address.",
		status: "pending",
		statusLabel: "Pending",
	},
	{
		id: "hospital-verification",
		label: "Hospital accreditation review",
		description: "Our team will review the accreditation document you submitted.",
		status: "pending",
		statusLabel: "Pending",
	},
	{
		id: "administrator-setup",
		label: "Administrator setup",
		description: "Sign in and invite your administrator after approval.",
		status: "locked",
		statusLabel: "Locked",
	},
];

type VerificationStatus = {
	status: "success";
	emailVerified: boolean;
	isOrganizationVerified: boolean;
	role: string;
};

const fetchVerificationStatus = async (url: string): Promise<VerificationStatus> => {
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error("Unable to load verification status");
	}

	return response.json();
};

export function VerifyClient() {
	const {
		data: verificationStatus,
		error: verificationStatusError,
		isLoading: isVerificationStatusLoading,
		isValidating: isVerificationStatusRefreshing,
		mutate: refreshVerificationStatus,
	} = useSWR("/api/verify", fetchVerificationStatus, {
		refreshInterval: 60_000,
		revalidateOnFocus: true,
		revalidateOnReconnect: true,
	});

	const verificationSteps: VerificationStep[] = initialVerificationSteps.map((step) => {
		if (step.id === "email-verification") {
			return {
				...step,
				status: verificationStatus?.emailVerified ? "complete" : "pending",
				statusLabel: verificationStatus?.emailVerified ? "Complete" : "Pending",
			};
		}

		if (step.id === "hospital-verification") {
			return {
				...step,
				status: verificationStatus?.isOrganizationVerified ? "complete" : "pending",
				statusLabel: verificationStatus?.isOrganizationVerified ? "Complete" : "Pending",
			};
		}

		return step;
	});

	if (isVerificationStatusLoading && !verificationStatus) {
		return (
			<div className="mt-10 flex w-full flex-col items-center gap-4" aria-live="polite">
				<div className="size-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-800" />
				<p className="text-sm font-medium text-gray-600">Checking verification status...</p>
			</div>
		);
	}

	if (verificationStatusError && !verificationStatus) {
		return (
			<div className="mt-10 flex w-full flex-col items-center gap-4 text-center" role="alert">
				<p className="text-sm font-medium text-red-600">
					We could not load your verification status.
				</p>

				<button
					type="button"
					className="text-sm font-medium text-gray-800 underline"
					onClick={() => refreshVerificationStatus()}
				>
					Try again
				</button>
			</div>
		);
	}
	return (
		<section aria-labelledby="verification-status-heading" className="mt-8 w-full">
			<div className="bg-white">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
					<h2 id="verification-status-heading" className="text-sm font-semibold text-gray-800">
						Verification status
					</h2>
					<span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
						In progress
					</span>
				</div>

				<div className="mt-5 w-full">
					{isVerificationStatusRefreshing && (
						<p className="text-xs font-medium text-gray-500" aria-live="polite">
							Updating status...
						</p>
					)}
					<ol className="flex flex-col gap-5">
						{verificationSteps.map((step, stepIndex) => (
							<li
								key={step.id}
								aria-current={step.status === "pending" && stepIndex === 1 ? "step" : undefined}
								className="relative flex gap-3"
							>
								{stepIndex < verificationSteps.length - 1 ? (
									<span
										aria-hidden="true"
										className="absolute top-8 left-4 h-[calc(100%+1.25rem)] w-px bg-gray-200"
									/>
								) : null}

								<VerificationStepIcon status={step.status} />

								<div className="min-w-0 flex-1">
									<div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
										<p className="text-sm font-medium text-gray-800">{step.label}</p>
										<span className={getStatusClassName(step.status)}>{step.statusLabel}</span>
									</div>
									<p className="mt-1 text-sm leading-5 text-gray-500">{step.description}</p>
								</div>
							</li>
						))}
					</ol>
				</div>
			</div>

			<p className="mt-10 text-center text-sm leading-5 text-gray-500">
				You can leave this page. We’ll email you when your hospital review is complete.
			</p>
		</section>
	);
}

function VerificationStepIcon({ status }: { status: VerificationStep["status"] }) {
	if (status === "complete") {
		return (
			<span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600 ring-4 ring-white">
				<RiCheckboxCircleFill className="size-5" aria-hidden="true" />
				<span className="sr-only">Complete</span>
			</span>
		);
	}

	if (status === "locked") {
		return (
			<span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400 ring-4 ring-white">
				<RiLockLine className="size-4" aria-hidden="true" />
				<span className="sr-only">Locked</span>
			</span>
		);
	}

	return (
		<span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-4 ring-white">
			<RiTimeLine className="size-5" aria-hidden="true" />
			<span className="sr-only">Pending</span>
		</span>
	);
}

function getStatusClassName(status: VerificationStep["status"]) {
	if (status === "complete") {
		return "text-xs font-medium text-green-700 px-2.5 py-1";
	}

	if (status === "locked") {
		return "text-xs font-medium text-gray-400 px-2.5 py-1";
	}

	return "text-xs font-medium text-amber-700 px-2.5 py-1";
}
