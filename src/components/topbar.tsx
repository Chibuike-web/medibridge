"use client";

import { RiNotificationLine, RiSearchLine } from "@remixicon/react";

export function Topbar() {
	return (
		<div className="top-0 sticky w-full border-b border-gray-200 h-20 flex items-center justify-end px-8">
			<div className="flex items-center gap-3">
				<button className="size-10 flex items-center justify-center">
					<RiSearchLine className="size-5" />
				</button>
				<button className="size-10 flex items-center justify-center">
					<RiNotificationLine className="size-5" />
				</button>
			</div>
		</div>
	);
}
