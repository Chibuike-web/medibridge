import NotificationLine from "@/icons/notification-line";
import SearchLine from "@/icons/search-line";

export default function Topbar() {
	return (
		<div className="top-0 sticky w-full border-b border-gray-200 h-20 flex items-center justify-end px-8">
			<div className="flex items-center gap-[12px]">
				<button className="size-10 flex items-center justify-center">
					<SearchLine className="size-5" />
				</button>
				<button className="size-10 flex items-center justify-center">
					<NotificationLine className="size-5" />
				</button>
			</div>
		</div>
	);
}
