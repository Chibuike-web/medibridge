import { RiCloseLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";

export function FilterChip({
	name,
	value,
	onRemove,
}: {
	name: string;
	value: string;
	onRemove: () => void;
}) {
	return (
		<div className="flex divide-x divide-gray-200 rounded-md border border-gray-200 bg-background text-sm font-medium text-gray-600">
			<span className="flex items-center px-2.5 py-1.5">{name}</span>
			<span className="flex items-center px-2.5 py-1.5">{value}</span>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				onClick={onRemove}
				className="h-auto rounded-l-none text-gray-500 hover:bg-gray-100 hover:text-gray-800"
				aria-label={`Remove ${name}: ${value} filter`}
			>
				<RiCloseLine aria-hidden="true" />
			</Button>
		</div>
	);
}

export function formatChecklistFilterLabel(values: string[]) {
	return values.length > 2 ? `${values.length} selected` : values.join(", ");
}
