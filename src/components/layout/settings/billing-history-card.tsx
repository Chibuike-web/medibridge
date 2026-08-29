import { useId, useState } from "react";
import Image from "next/image";
import { RiArrowRightSLine, RiDownloadLine } from "@remixicon/react";

import { cn } from "@/lib/utils/cn";

type BillingHistoryCardProps = {
	amount: string;
	date: string;
	cardBrand: "visa" | "mastercard" | "verve";
	cardLastFour: string;
	expires: string;
	status: string;
	breakdown: {
		plan: string;
		includedCases: string;
		additionalCases: string;
		overage: string;
		total: string;
	};
};

const cardBrandDetails = {
	visa: { alt: "Visa", height: 13, src: "/assets/visa-logo.svg", width: 40 },
	mastercard: { alt: "Mastercard", height: 24, src: "/assets/mastercard-logo.svg", width: 40 },
	verve: { alt: "Verve", height: 14, src: "/assets/verve-logo.svg", width: 40 },
} as const;

export function BillingHistoryCard({
	amount,
	date,
	cardBrand,
	cardLastFour,
	expires,
	status,
	breakdown,
}: BillingHistoryCardProps) {
	const [isBillingDetailsExpanded, setIsBillingDetailsExpanded] = useState(false);
	const billingDetailsId = useId();
	const selectedCardBrand = cardBrandDetails[cardBrand];

	return (
		<article className="shrink-0 rounded-2xl border border-gray-200">
			<button
				type="button"
				className="block w-full rounded-2xl border border-transparent p-4 text-left focus-visible:border-gray-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gray-100"
				aria-expanded={isBillingDetailsExpanded}
				aria-controls={billingDetailsId}
				onClick={() => {
					setIsBillingDetailsExpanded((prev) => !prev);
				}}
			>
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<p className="text-sm font-semibold text-gray-600">{amount}</p>
						<p className="text-sm font-medium text-gray-400">{date}</p>
					</div>
					<span className="rounded-md bg-blue-100 px-2 py-1 text-sm font-semibold text-blue-700">
						{status}
					</span>
				</div>

				<div className="mt-[14px] flex items-center justify-between gap-4">
					<div className="flex min-w-0 items-center gap-2">
						<Image
							src={selectedCardBrand.src}
							width={selectedCardBrand.width}
							height={selectedCardBrand.height}
							alt={selectedCardBrand.alt}
							className="shrink-0"
						/>
						<span
							className="text-sm font-medium text-gray-600"
							aria-label={`Card ending in ${cardLastFour}`}
						>
							******** {cardLastFour}
						</span>
						<span className="text-sm font-medium text-gray-400">Expires {expires}</span>
					</div>
					<span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-gray-400">
						{isBillingDetailsExpanded ? "View less" : "View more"}
						<RiArrowRightSLine
							className={cn(
								"size-5 transition-transform duration-200 ease-out motion-reduce:transition-none",
								isBillingDetailsExpanded && "rotate-90",
							)}
							aria-hidden="true"
						/>
					</span>
				</div>
			</button>

			<div
				id={billingDetailsId}
				className={cn(
					"grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
					isBillingDetailsExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
				)}
				aria-hidden={!isBillingDetailsExpanded}
				inert={!isBillingDetailsExpanded}
			>
				<div className="min-h-0 overflow-hidden">
					<div className="px-4 pb-4">
						<dl className="flex flex-col gap-3 text-sm">
							<div className="flex items-center justify-between gap-3">
								<dt className="text-gray-400">Pro plan</dt>
								<dd className="font-semibold text-gray-600">{breakdown.plan}</dd>
							</div>
							<div className="flex items-center justify-between gap-4">
								<dt className="text-gray-400">Included cases</dt>
								<dd className="font-semibold text-gray-600">{breakdown.includedCases}</dd>
							</div>
							<div className="flex items-center justify-between gap-4">
								<dt className="text-gray-400">Additional cases</dt>
								<dd className="font-semibold text-gray-600">{breakdown.additionalCases}</dd>
							</div>
							<div className="flex items-center justify-between gap-4">
								<dt className="text-gray-400">Overage</dt>
								<dd className="font-semibold text-gray-600">{breakdown.overage}</dd>
							</div>
							<div className="flex items-center justify-between gap-4 border-t border-gray-200 pt-3">
								<dt className="text-gray-400">Total</dt>
								<dd className="font-semibold text-gray-600">{breakdown.total}</dd>
							</div>
						</dl>

						<div className="flex items-center justify-between gap-4 pt-5 text-sm">
							<span className="font-medium text-gray-600">Receipt</span>
							<button
								type="button"
								className="inline-flex items-center gap-1 rounded-md border border-transparent font-medium text-gray-600 transition-colors hover:text-gray-800 focus-visible:border focus-visible:border-gray-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gray-100"
								tabIndex={isBillingDetailsExpanded ? 0 : -1}
							>
								Download
								<RiDownloadLine className="size-5" aria-hidden="true" />
							</button>
						</div>
					</div>
				</div>
			</div>
		</article>
	);
}
