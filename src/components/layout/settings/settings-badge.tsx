import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export type SettingsBadgeTone = "neutral" | "info" | "success" | "warning" | "danger" | "premium";

const settingsBadgeToneStyles: Record<SettingsBadgeTone, string> = {
	neutral: "bg-gray-100 text-gray-600",
	info: "bg-blue-100 text-blue-700",
	success: "bg-green-100 text-green-700",
	warning: "bg-amber-100 text-amber-700",
	danger: "bg-red-50 text-red-700",
	premium: "bg-violet-100 text-violet-700",
};

const mutedSettingsBadgeToneStyles: Record<SettingsBadgeTone, string> = {
	neutral: "bg-gray-50 text-gray-400",
	info: "bg-blue-50 text-blue-400",
	success: "bg-green-50 text-green-400",
	warning: "bg-amber-50 text-amber-500",
	danger: "bg-red-50 text-red-400",
	premium: "bg-violet-50 text-violet-400",
};

export function SettingsBadge({
	children,
	className,
	muted = false,
	tone,
}: {
	children: ReactNode;
	className?: string;
	muted?: boolean;
	tone: SettingsBadgeTone;
}) {
	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center rounded-md px-2 py-1 text-xs font-semibold no-line-height",
				muted ? mutedSettingsBadgeToneStyles[tone] : settingsBadgeToneStyles[tone],
				className,
			)}
		>
			{children}
		</span>
	);
}
