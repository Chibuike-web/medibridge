import { Check } from "lucide-react";

export default function Checkbox({ id, children }: { id: string; children?: React.ReactNode }) {
	return (
		<label
			htmlFor={id}
			className="group flex w-max relative items-center gap-2 cursor-pointer text-[14px] text-gray-600"
		>
			<input id={id} type="checkbox" className="absolute inset-0 opacity-0 cursor-pointer" />

			<span className="size-4 flex items-center justify-center rounded-[4px] border border-gray-400 bg-white group-has-[input:checked]:bg-gray-800 group-has-[input:checked]:border-gray-800 group-focus-within:border-ring group-focus-within:ring-ring/50 group-focus-within:ring-[3px]">
				<Check className="hidden group-has-[input:checked]:block text-white size-[14px]" />
			</span>

			{children}
		</label>
	);
}
