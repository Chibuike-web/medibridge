import { cn } from "@/lib/utils/cn";
import { formatLabel } from "@/lib/utils/format-label";
import { statusStyles } from "@/lib/utils/status-styles";

type StatusBadgeProps = {
	status: string;
	className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
	const statusClassName =
		statusStyles[status.toLowerCase() as keyof typeof statusStyles] ?? statusStyles.cancelled;

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
				statusClassName,
				className,
			)}
		>
			<span className="size-1 shrink-0 rounded-full bg-current" aria-hidden="true" />
			{formatLabel(status)}
		</span>
	);
}
