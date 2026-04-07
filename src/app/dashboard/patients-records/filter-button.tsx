"use client";

import { Button } from "@/components/ui/button";
import { RiFilter3Line } from "@remixicon/react";

export function FilterButton() {
	return (
		<Button size="lg" variant="outline">
			<RiFilter3Line aria-hidden className="size-5 text-gray-600" />
			Filter
		</Button>
	);
}
