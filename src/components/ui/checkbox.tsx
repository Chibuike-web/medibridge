import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { ChangeEvent } from "react";

type CheckBoxType = {
	id: string;
	children: React.ReactNode;
	checked?: boolean;
	handleChange?: (e: ChangeEvent<HTMLInputElement>) => void;
	className?: string;
};

export default function Checkbox({ id, checked, handleChange, children, className }: CheckBoxType) {
	return (
		<label
			htmlFor={id}
			className={cn(
				"group flex w-max relative items-center gap-2 cursor-pointer text-[14px] text-gray-600",
				className,
				checked && "opacity-50"
			)}
		>
			<input
				id={id}
				type="checkbox"
				checked={checked}
				onChange={(e) => handleChange && handleChange(e)}
				className="absolute inset-0 opacity-0 cursor-pointer"
				disabled={checked}
			/>

			<span className="size-4 flex items-center justify-center rounded-[4px] border border-gray-400 bg-white group-has-[input:checked]:bg-gray-800 group-has-[input:checked]:border-gray-800 group-focus-within:border-ring group-focus-within:ring-ring/50 group-focus-within:ring-[3px]">
				<Check className="hidden group-has-[input:checked]:block text-white size-[14px]" />
			</span>

			{children}
		</label>
	);
}
