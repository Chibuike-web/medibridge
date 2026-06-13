"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import type { AccessVerificationState } from "@/lib/api/get-access-verification-state";
import { useRouter } from "next/navigation";
import { requestAccessCodeAction, verifyAccessCodeAction } from "./actions";

type VerifyAccessClientProps = {
	accessId: string;
	verificationState: AccessVerificationState;
};

export function VerifyAccessClient({ accessId, verificationState }: VerifyAccessClientProps) {
	const router = useRouter();
	const [enteredVerificationCode, setEnteredVerificationCode] = useState("");
	const [requestAccessCodeError, setRequestAccessCodeError] = useState("");
	const [verifyAccessCodeError, setVerifyAccessCodeError] = useState("");
	const [isRequestingNewAccessCode, startRequestNewAccessCodeTransition] =
		useTransition();
	const [isVerifyingEnteredAccessCode, startVerifyEnteredAccessCodeTransition] =
		useTransition();

	if (verificationState.status === "invalid") {
		return (
			<VerifyAccessMessage
				title="Invalid access link"
				description="This shared patient record link is invalid. Contact the sending hospital for a new link."
			/>
		);
	}

	if (verificationState.status === "access-expired") {
		return (
			<VerifyAccessMessage
				title="Shared record expired"
				description="This shared patient record is no longer available. Contact the sending hospital for a new link."
			/>
		);
	}

	if (verificationState.status === "revoked") {
		return (
			<VerifyAccessMessage
				title="Access revoked"
				description="This shared patient record is no longer available."
			/>
		);
	}

	if (verificationState.status === "code-expired" || verificationState.status === "no-code") {
		return (
			<section className="flex w-full max-w-[500px] flex-col items-center text-center">
				<h1 className="text-2xl font-semibold leading-[1.2] text-gray-800">
					{verificationState.status === "code-expired"
						? "Verification code expired"
						: "No active verification code"}
				</h1>
				<p className="mt-4 text-base leading-6 text-gray-600">
					{verificationState.status === "code-expired"
						? `The verification code sent to ${verificationState.recipientEmail} has expired. Request a new code to continue.`
						: `No active verification code was found for ${verificationState.recipientEmail}. Request a code to continue.`}
				</p>
				{requestAccessCodeError ? (
					<p className="mt-4 text-sm text-red-600">{requestAccessCodeError}</p>
				) : null}
				<Button
					type="button"
					className="mt-16 h-auto px-6 py-3"
					disabled={isRequestingNewAccessCode}
					onClick={() => {
						setRequestAccessCodeError("");
						startRequestNewAccessCodeTransition(async () => {
							const result = await requestAccessCodeAction(accessId);

							if (!result.success) {
								setRequestAccessCodeError(result.message);
								return;
							}

							router.refresh();
						});
					}}
				>
					{isRequestingNewAccessCode
						? "Sending..."
						: verificationState.status === "code-expired"
							? "Request new code"
							: "Request code"}
				</Button>
			</section>
		);
	}

	return (
		<section className="flex w-full max-w-[500px] flex-col items-center text-center">
			<h1 className="text-2xl font-semibold leading-[1.2] text-gray-800">Verify Access</h1>
			<p className="mt-4 text-base leading-6 text-gray-600">
				Enter the verification code sent to {verificationState.recipientEmail} to access the
				shared patient record.
			</p>

			<InputOTP
				maxLength={6}
				value={enteredVerificationCode}
				onChange={(nextEnteredVerificationCode) => {
					setEnteredVerificationCode(nextEnteredVerificationCode);
					setVerifyAccessCodeError("");
				}}
				containerClassName="mt-6 justify-center"
			>
				<InputOTPGroup className="gap-6">
					{Array.from({ length: 6 }).map((_, index) => (
						<InputOTPSlot
							key={index}
							index={index}
							className="size-12 rounded-md border border-gray-300 bg-white text-base font-medium text-gray-800 first:rounded-md first:border last:rounded-md"
						/>
					))}
				</InputOTPGroup>
			</InputOTP>

			{verifyAccessCodeError ? (
				<p className="mt-4 text-sm text-red-600">{verifyAccessCodeError}</p>
			) : null}

			<Button
				type="button"
				className="mt-16 h-auto px-6 py-3"
				disabled={isVerifyingEnteredAccessCode || enteredVerificationCode.length < 6}
				onClick={() => {
					setVerifyAccessCodeError("");
					startVerifyEnteredAccessCodeTransition(async () => {
						const result = await verifyAccessCodeAction({
							accessId,
							verificationCode: enteredVerificationCode,
						});

						if (!result.success) {
							setVerifyAccessCodeError(result.message);
							return;
						}

						router.push(`/shared-records/${accessId}`);
					});
				}}
			>
				{isVerifyingEnteredAccessCode ? "Verifying..." : "Continue"}
			</Button>
		</section>
	);
}

function VerifyAccessMessage({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<section className="flex w-full max-w-[500px] flex-col items-center text-center">
			<h1 className="text-2xl font-semibold leading-[1.2] text-gray-800">{title}</h1>
			<p className="mt-4 text-base leading-6 text-gray-600">{description}</p>
		</section>
	);
}
