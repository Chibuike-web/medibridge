import { IconProps } from "@/lib/types/icon-prop-type";

export default function Plus({ className = "" }: IconProps) {
	return (
		<svg className={className} viewBox="0 0 24 24" fill="currentColor">
			<path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z"></path>
		</svg>
	);
}
