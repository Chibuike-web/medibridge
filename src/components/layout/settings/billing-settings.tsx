import { Button } from "@/components/ui/button";

import type { SettingsSubView } from "./types";

type BillingPlan =
	| {
			kind: "free";
			usedCases: number;
			caseLimit: number;
			trialEnds: string;
	  }
	| {
			kind: "paid";
			usedCases: number;
			caseLimit: number;
	  };

const PRO_MONTHLY_PRICE = "₦20,000 / month";
const PRO_OVERAGE_PRICE = "₦25";
const planToShow = "paid" as BillingPlan["kind"];

const billingPlans = {
	free: { kind: "free", usedCases: 142, caseLimit: 200, trialEnds: "August 28, 2026" },
	paid: { kind: "paid", usedCases: 642, caseLimit: 1000 },
} satisfies Record<BillingPlan["kind"], BillingPlan>;

const activeBillingPlan = billingPlans[planToShow];

export function BillingSettings({
	activeSettingsSubView,
	onSettingsSubViewChange,
}: {
	activeSettingsSubView: SettingsSubView | null;
	onSettingsSubViewChange: (view: SettingsSubView | null) => void;
}) {
	switch (activeSettingsSubView) {
		case "payment-method":
			return <div>Payment method</div>;
		case "billing-history":
			return <div>Billing History</div>;
		case null:
			return (
				<div className="flex flex-col gap-6 px-6 py-6">
					<BillingPlanCard plan={activeBillingPlan} />
					{planToShow === "paid" ? (
						<PaidBillingDetails onSettingsSubViewChange={onSettingsSubViewChange} />
					) : null}
				</div>
			);
		default:
			return null;
	}
}

function BillingPlanCard({ plan }: { plan: BillingPlan }) {
	const remainingCases = Math.max(0, plan.caseLimit - plan.usedCases);
	const usagePercent =
		plan.caseLimit > 0 ? Math.min(100, (plan.usedCases / plan.caseLimit) * 100) : 0;

	return (
		<section
			aria-labelledby="current-plan-heading"
			className="rounded-2xl border border-gray-200 p-4"
		>
			<div className="flex items-center justify-between gap-4">
				<h3 id="current-plan-heading" className="text-sm font-medium text-gray-400">
					Current plan
				</h3>
				<span className="rounded-[6px] bg-blue-100 p-[6px] text-[12px] font-semibold text-blue-700 no-line-height">
					{plan.kind === "free" ? "FREE TRIAL" : "PRO"}
				</span>
			</div>
			<p className="mt-2 text-base font-semibold leading-[1.2em] tabular-nums text-gray-800">
				{plan.kind === "free" ? "Free" : PRO_MONTHLY_PRICE}
			</p>
			<div className="mt-3 flex items-center justify-between gap-4 text-sm font-medium tabular-nums text-gray-400">
				<span>
					{plan.usedCases} of {plan.caseLimit.toLocaleString()} cases used
				</span>
				<span className="text-right">{remainingCases} cases remaining</span>
			</div>
			<div
				className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-gray-200"
				role="progressbar"
				aria-label="Plan usage"
				aria-valuemin={0}
				aria-valuemax={plan.caseLimit}
				aria-valuenow={plan.usedCases}
			>
				<div className="h-full rounded-full bg-gray-800" style={{ width: `${usagePercent}%` }} />
			</div>
			{plan.kind === "free" ? (
				<div className="mt-3 flex items-end justify-between gap-4">
					<div>
						<p className="text-sm font-medium text-gray-400">Trial ends</p>
						<p className="mt-1 text-sm font-medium text-gray-600">{plan.trialEnds}</p>
					</div>
					<Button type="button" variant="outline" className="shrink-0 text-sm text-gray-600">
						Upgrade to Pro
					</Button>
				</div>
			) : (
				<div className="mt-3">
					<p className="text-sm font-medium text-gray-400">Overage</p>
					<p className="mt-1 text-sm font-medium text-gray-600">
						{PRO_OVERAGE_PRICE} per additional case
					</p>
				</div>
			)}
		</section>
	);
}

function PaidBillingDetails({
	onSettingsSubViewChange,
}: {
	onSettingsSubViewChange: (view: SettingsSubView | null) => void;
}) {
	return (
		<>
			<section aria-labelledby="payment-method-heading">
				<h3 id="payment-method-heading" className="font-semibold text-gray-800 no-line-height">
					Payment method
				</h3>
				<div className="flex h-16 items-center justify-between gap-4 border-b border-gray-200">
					<p className="min-w-0 truncate text-sm font-medium text-gray-600">
						<span className="font-bold text-blue-800">VISA</span>
						<span aria-hidden="true">••••••</span> <span className="tabular-nums">4242</span>
					</p>
					<Button
						type="button"
						variant="ghost"
						className="shrink-0 text-sm text-gray-400"
						onClick={() => onSettingsSubViewChange("payment-method")}
					>
						Manage
					</Button>
				</div>
			</section>

			<section aria-labelledby="billing-history-heading">
				<h3 id="billing-history-heading" className="font-semibold text-gray-800 no-line-height">
					Billing history
				</h3>
				<div className="flex h-16 items-center justify-between gap-4 border-b border-gray-200">
					<p className="text-sm font-medium text-gray-600">10 invoices</p>
					<Button
						type="button"
						variant="ghost"
						className="shrink-0 text-sm text-gray-400"
						onClick={() => onSettingsSubViewChange("billing-history")}
					>
						View
					</Button>
				</div>
			</section>

			<section
				aria-labelledby="cancel-plan-heading"
				className="flex items-center justify-between gap-12 pt-2"
			>
				<div className="min-w-0">
					<h3 id="cancel-plan-heading" className="font-semibold text-gray-800">
						Cancel plan
					</h3>
					<p className="mt-1 max-w-md text-sm text-gray-600 text-pretty">
						If you cancel, you&apos;ll keep full access to your plan features until the end of your
						billing period.
					</p>
				</div>
				<Button
					type="button"
					variant="outline"
					className="shrink-0 border-destructive text-destructive hover:bg-red-50 hover:text-red-700"
				>
					Cancel
				</Button>
			</section>
		</>
	);
}
