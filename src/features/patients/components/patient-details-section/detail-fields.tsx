import type { ReactNode } from "react";

export function DetailsSection({
	title,
	action,
	children,
}: {
	title: string;
	action?: ReactNode;
	children: ReactNode;
}) {
	return (
		<section className="overflow-hidden rounded-xl bg-gray-50 ring-1 ring-gray-200">
			<div className="flex min-h-11 items-center justify-between gap-4 px-4 h-11">
				<h3 className="font-semibold text-gray-700">{title}</h3>
				{action}
			</div>
			<div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-6 rounded-xl bg-white p-4 ring-1 ring-gray-200">
				{children}
			</div>
		</section>
	);
}

export function DetailItem({
	label,
	value,
}: {
	label: string;
	value: string | number | null | undefined;
}) {
	return (
		<div className="flex flex-col gap-2">
			<span className="text-sm text-gray-400">{label}</span>
			<span className="text-sm font-semibold text-gray-700">{value || "-"}</span>
		</div>
	);
}
