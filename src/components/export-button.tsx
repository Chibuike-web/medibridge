import { RiShare2Line } from "@remixicon/react";

import { Button } from "@/components/ui/button";

export function ExportButton() {
	return (
		<Button variant="outline" className="bg-white text-gray-600 hover:bg-gray-50 max-md:flex-1">
			<RiShare2Line aria-hidden className="size-4 text-gray-600" />
			Export
		</Button>
	);
}
