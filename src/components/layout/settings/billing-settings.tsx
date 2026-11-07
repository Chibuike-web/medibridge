import { Fragment, useState } from "react";
import Image from "next/image";
import {
	RiArrowLeftSLine,
	RiArrowRightSLine,
	RiCloseLine,
	RiDownloadLine,
	RiSearchLine,
} from "@remixicon/react";

import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils/cn";

import { SettingsBadge } from "./settings-badge";

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
const ROWS_PER_PAGE_OPTIONS = [14, 28, 42];
const planToShow = "paid" as BillingPlan["kind"];

const billingPlans = {
	free: { kind: "free", usedCases: 142, caseLimit: 200, trialEnds: "August 28, 2026" },
	paid: { kind: "paid", usedCases: 642, caseLimit: 1000 },
} satisfies Record<BillingPlan["kind"], BillingPlan>;

const activeBillingPlan = billingPlans[planToShow];

const invoices = [
	{
		id: "invoice-2026-08",
		date: "Aug 31, 2026",
		total: "₦2,100",
		status: "Paid",
		billingPeriod: "Aug 1–31, 2026",
		includedCases: "1,000",
		billableOverage: "84",
		ratePerAdditionalCase: "₦25",
	},
	{
		id: "invoice-2026-07",
		date: "Jul 31, 2026",
		total: "₦500",
		status: "Paid",
		billingPeriod: "Jul 1–31, 2026",
		includedCases: "1,000",
		billableOverage: "20",
		ratePerAdditionalCase: "₦25",
	},
	{
		id: "invoice-2026-06",
		date: "Jun 30, 2026",
		total: "₦5,000",
		status: "Paid",
		billingPeriod: "Jun 1–30, 2026",
		includedCases: "1,000",
		billableOverage: "200",
		ratePerAdditionalCase: "₦25",
	},
	{
		id: "invoice-2026-05",
		date: "May 31, 2026",
		total: "₦1,000",
		status: "Paid",
		billingPeriod: "May 1–31, 2026",
		includedCases: "1,000",
		billableOverage: "40",
		ratePerAdditionalCase: "₦25",
	},
	{
		id: "invoice-2026-04",
		date: "Apr 30, 2026",
		total: "₦4,500",
		status: "Paid",
		billingPeriod: "Apr 1–30, 2026",
		includedCases: "1,000",
		billableOverage: "180",
		ratePerAdditionalCase: "₦25",
	},
	{
		id: "invoice-2026-03",
		date: "Mar 31, 2026",
		total: "₦1,750",
		status: "Paid",
		billingPeriod: "Mar 1–31, 2026",
		includedCases: "1,000",
		billableOverage: "70",
		ratePerAdditionalCase: "₦25",
	},
];

export function BillingSettings() {
	const [isChangePaymentMethodOpen, setIsChangePaymentMethodOpen] = useState(false);
	const [invoiceQuery, setInvoiceQuery] = useState("");
	const [invoicePage, setInvoicePage] = useState(1);
	const [invoiceLimit, setInvoiceLimit] = useState(ROWS_PER_PAGE_OPTIONS[0]);
	const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
	const matchingInvoices = invoices.filter((invoice) =>
		`${invoice.date} ${invoice.total}`.toLowerCase().includes(invoiceQuery.trim().toLowerCase()),
	);
	const invoicePageCount = Math.max(1, Math.ceil(matchingInvoices.length / invoiceLimit));
	const visibleInvoices = matchingInvoices.slice(
		(invoicePage - 1) * invoiceLimit,
		invoicePage * invoiceLimit,
	);
	const fitsOnSmallestPage = matchingInvoices.length <= ROWS_PER_PAGE_OPTIONS[0];

	return (
		<>
			<div className="flex flex-col gap-10 px-4 py-5">
				<BillingPlanCard plan={activeBillingPlan} />

				<section aria-labelledby="payment-heading">
					<h3 id="payment-heading" className="font-semibold">
						Payment
					</h3>
					<div className="flex items-center justify-between gap-4 border-b py-3">
						<div className="flex min-w-0 flex-col gap-1">
							<div className="flex items-center gap-2">
								<Image src="/assets/visa-logo.svg" width={40} height={13} alt="Visa" />
								<span
									className="text-sm font-medium text-gray-600"
									aria-label="Card ending in 4242"
								>
									******** 4242
								</span>
								<SettingsBadge tone="info">Default</SettingsBadge>
							</div>
							<span className="text-sm text-gray-400">Expires 08/28</span>
						</div>
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsChangePaymentMethodOpen(true)}
						>
							Update
						</Button>
					</div>
				</section>

				<section aria-labelledby="billing-history-heading" className="flex flex-col gap-4">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<div>
							<h3 id="billing-history-heading" className="font-semibold">
								Billing history
							</h3>
							<p className="text-sm text-gray-600">{invoices.length} invoices</p>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<div className="relative w-72 max-md:w-full">
								<RiSearchLine className="pointer-events-none absolute bottom-0 left-2 flex h-full size-4 items-center justify-center text-gray-400" />
								<Input
									type="search"
									className="pl-8"
									aria-label="Search invoices"
									placeholder="Search invoices"
									value={invoiceQuery}
									onChange={(event) => {
										setInvoiceQuery(event.target.value);
										setInvoicePage(1);
									}}
								/>
							</div>
							<Button type="button" variant="outline">
								<RiDownloadLine aria-hidden="true" />
								Download all
							</Button>
						</div>
					</div>
					<div className="overflow-x-auto rounded-xl border border-gray-200">
						<Table className="min-w-[40rem] border-separate border-spacing-0 bg-gray-50 text-left">
							<TableHeader className="text-sm font-semibold text-gray-500">
								<TableRow>
									<TableHead className="h-10 w-1/4 bg-gray-50 px-3 py-0 whitespace-nowrap text-gray-600">
										Date
									</TableHead>
									<TableHead className="h-10 w-1/4 bg-gray-50 px-3 py-0 whitespace-nowrap text-gray-600">
										Total
									</TableHead>
									<TableHead className="h-10 w-1/4 bg-gray-50 px-3 py-0 whitespace-nowrap text-gray-600">
										Status
									</TableHead>
									<TableHead className="h-10 bg-gray-50 px-3 py-0 whitespace-nowrap text-gray-600">
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody className="overflow-hidden rounded-t-xl outline outline-gray-200">
								{visibleInvoices.length ? (
									visibleInvoices.map((invoice, rowPosition) => (
										<Fragment key={invoice.id}>
											<TableRow className="h-14">
												<TableCell
													className={cn(
														"h-14 bg-white px-3 py-0 text-sm text-gray-600",
														rowPosition === 0 && "rounded-tl-lg",
													)}
												>
													{invoice.date}
												</TableCell>
												<TableCell className="h-14 bg-white px-3 py-0 text-sm text-gray-600">
													{invoice.total}
												</TableCell>
												<TableCell className="h-14 bg-white px-3 py-0 text-sm text-gray-600">
													<StatusBadge status={invoice.status} />
												</TableCell>
												<TableCell
													className={cn(
														"h-14 bg-white px-3 py-0",
														rowPosition === 0 && "rounded-tr-lg",
													)}
												>
													<div className="flex items-center gap-2">
														<Button type="button" variant="outline" size="sm">
															Download PDF
														</Button>
														<Button
															type="button"
															variant="ghost"
															size="sm"
															className="text-gray-400 hover:text-gray-600"
															aria-expanded={expandedInvoiceId === invoice.id}
															aria-controls={`invoice-details-${invoice.id}`}
															onClick={() =>
																setExpandedInvoiceId((prev) =>
																	prev === invoice.id ? null : invoice.id,
																)
															}
														>
															{expandedInvoiceId === invoice.id ? "View less" : "View more"}
															<RiArrowRightSLine
																className={cn(
																	"transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
																	expandedInvoiceId === invoice.id && "rotate-90",
																)}
																aria-hidden="true"
															/>
														</Button>
													</div>
												</TableCell>
											</TableRow>
											<TableRow>
												<TableCell
													colSpan={4}
													className={cn(
														"border-b border-gray-200 bg-white p-0",
														rowPosition === visibleInvoices.length - 1 && "border-b-0",
													)}
												>
													<div
														id={`invoice-details-${invoice.id}`}
														className={cn(
															"grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
															expandedInvoiceId === invoice.id
																? "grid-rows-[1fr]"
																: "grid-rows-[0fr]",
														)}
														inert={expandedInvoiceId !== invoice.id}
													>
														<div className="min-h-0">
															<dl className="flex flex-col gap-3 px-3 pb-4 text-sm">
																<div className="flex items-center justify-between gap-4">
																	<dt className="text-gray-400">Billing period</dt>
																	<dd className="font-semibold text-gray-600">
																		{invoice.billingPeriod}
																	</dd>
																</div>
																<div className="flex items-center justify-between gap-4">
																	<dt className="text-gray-400">Included with Pro</dt>
																	<dd className="font-semibold text-gray-600">
																		{invoice.includedCases}
																	</dd>
																</div>
																<div className="flex items-center justify-between gap-4">
																	<dt className="text-gray-400">Billable overage</dt>
																	<dd className="font-semibold text-gray-600">
																		{invoice.billableOverage}
																	</dd>
																</div>
																<div className="flex items-center justify-between gap-4">
																	<dt className="text-gray-400">Rate per additional case</dt>
																	<dd className="font-semibold text-gray-600">
																		{invoice.ratePerAdditionalCase}
																	</dd>
																</div>
																<div className="flex items-center justify-between gap-4 border-t border-gray-200 pt-3">
																	<dt className="text-gray-400">Total</dt>
																	<dd className="font-semibold text-gray-600">{invoice.total}</dd>
																</div>
															</dl>
														</div>
													</div>
												</TableCell>
											</TableRow>
										</Fragment>
									))
								) : (
									<TableRow>
										<TableCell
											colSpan={4}
											className="h-32 rounded-t-lg bg-white px-3 py-0 text-center text-sm text-gray-500"
										>
											No matching invoices found.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
						{fitsOnSmallestPage ? null : (
							<div className="flex items-center justify-between gap-3 overflow-x-auto border-t border-gray-200 bg-white p-3 text-sm whitespace-nowrap text-gray-500">
								<div className="flex items-center gap-3">
									<span>Rows per page</span>
									<Select
										value={String(invoiceLimit)}
										onValueChange={(value) => {
											setInvoiceLimit(Number(value));
											setInvoicePage(1);
										}}
									>
										<SelectTrigger className="h-8 w-16 bg-white px-2 text-gray-700">
											<SelectValue aria-label="Rows per page" placeholder="Rows" />
										</SelectTrigger>
										<SelectContent className="w-20" align="start">
											{ROWS_PER_PAGE_OPTIONS.map((pageSize) => (
												<SelectItem key={pageSize} value={String(pageSize)}>
													{pageSize}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="flex items-center gap-3">
									<span>
										Page {invoicePage} of {invoicePageCount}
									</span>
									<div className="flex items-center gap-2">
										<Button
											type="button"
											variant="outline"
											size="icon"
											aria-label="Previous"
											onClick={() => setInvoicePage((prev) => prev - 1)}
											disabled={invoicePage <= 1}
											className="text-gray-700 shadow-none"
										>
											<RiArrowLeftSLine aria-hidden="true" />
										</Button>
										<Button
											type="button"
											variant="outline"
											size="icon"
											aria-label="Next"
											onClick={() => setInvoicePage((prev) => prev + 1)}
											disabled={invoicePage >= invoicePageCount}
											className="text-gray-700 shadow-none"
										>
											<RiArrowRightSLine aria-hidden="true" />
										</Button>
									</div>
								</div>
							</div>
						)}
					</div>
				</section>

				<section
					aria-labelledby="cancel-plan-heading"
					className="flex items-center justify-between gap-12"
				>
					<div className="min-w-0">
						<h3 id="cancel-plan-heading" className="font-semibold text-gray-800">
							Cancel plan
						</h3>
						<p className="mt-1 max-w-md text-sm text-gray-600 text-pretty">
							If you cancel, you&apos;ll keep full access to your plan features until the end of
							your billing period.
						</p>
					</div>
					<Button
						type="button"
						variant="destructive"
						className="border border-destructive bg-transparent text-destructive shadow-none hover:bg-destructive/10 hover:text-destructive focus-visible:border-destructive dark:bg-transparent dark:hover:bg-destructive/10"
					>
						Cancel
					</Button>
				</section>
			</div>

			<Dialog open={isChangePaymentMethodOpen} onOpenChange={setIsChangePaymentMethodOpen}>
				<DialogContent className="max-w-[37.5rem] gap-0 p-0">
					<DialogHeader className="py-4">
						<DialogTitle>Change payment method</DialogTitle>
						<DialogClose asChild>
							<Button variant="ghost" size="icon" aria-label="Close change payment method dialog">
								<RiCloseLine aria-hidden="true" />
							</Button>
						</DialogClose>
					</DialogHeader>
					<DialogDescription className="px-4 py-5 text-sm font-normal text-gray-400">
						You&apos;ll be redirected to Paystack to securely add and authorize your new payment
						method.
					</DialogDescription>
					<DialogFooter className="sm:justify-end">
						<Button type="button" onClick={() => setIsChangePaymentMethodOpen(false)}>
							Continue
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
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
				<SettingsBadge
					tone={plan.kind === "free" ? "neutral" : "premium"}
					className="rounded-[6px] p-[6px] text-[12px] no-line-height"
				>
					{plan.kind === "free" ? "FREE TRIAL" : "PRO"}
				</SettingsBadge>
			</div>
			<p className="mt-2 text-base font-semibold leading-[1.2em] text-gray-800">
				{plan.kind === "free" ? "Free" : PRO_MONTHLY_PRICE}
			</p>
			<div className="mt-3 flex items-center justify-between gap-4 text-sm font-medium text-gray-400">
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
					<Button type="button" variant="outline" className="text-gray-600">
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
