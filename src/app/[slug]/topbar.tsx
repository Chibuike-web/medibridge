import { Bell, Search } from "lucide-react";

export default function Topbar() {
	return (
		<div className="top-0 sticky w-full border-b border-gray-200 h-20 flex items-center justify-end px-8">
			<div className="flex items-center gap-4">
				<Search />
				<Bell />
			</div>
		</div>
	);
}
