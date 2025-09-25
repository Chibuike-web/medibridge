import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Transfers() {
	return (
		<div className="w-full mx-auto max-w-[1440px] flex items-center justify-center h-full p-10">
			<div className="flex flex-col items-center max-w-[355px]">
				<h1 className="font-semibold text-[24px] text-center mb-6">No transfers yet</h1>
				<p className="mb-12 text-center">
					Start by creating your first transfer request to move patient records securely.
				</p>
				<Button>
					<Plus /> New Transfer Request
				</Button>
			</div>
		</div>
	);
}
