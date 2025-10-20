import Check from "@/icons/check";
import { cn } from "@/lib/utils";
import { ChangeEvent } from "react";
import { FieldValues, Path, UseFormRegister } from "react-hook-form";

type CheckBoxType<T extends FieldValues = FieldValues> = {
	id: string;
	children: React.ReactNode;
	checked?: boolean;
	defaultChecked?: boolean;
	handleChange?: (e: ChangeEvent<HTMLInputElement>) => void;
	className?: string;
	ariaDescribedBy?: string;
	ariaInvalid?: boolean;
	register?: UseFormRegister<T>;
	name?: Path<T>;
};

export default function Checkbox<T extends FieldValues = FieldValues>({
	id,
	checked,
	defaultChecked,
	handleChange,
	children,
	className,
	register,
	name,
	ariaDescribedBy,
	ariaInvalid,
}: CheckBoxType<T>) {
	return (
		<label
			htmlFor={id}
			className={cn(
				"group flex w-max relative items-center gap-2 cursor-pointer text-[14px] text-gray-600",
				className,
				defaultChecked && "opacity-50"
			)}
		>
			<input
				id={id}
				type="checkbox"
				className="absolute inset-0 opacity-0 cursor-pointer peer"
				{...(register && name
					? register(name)
					: {
							checked,
							defaultChecked,
							onChange: handleChange,
							disabled: defaultChecked,
					  })}
				aria-describedby={ariaDescribedBy}
				aria-invalid={ariaInvalid}
			/>

			<span
				className={cn(
					"size-4 flex items-center justify-center ",
					"rounded-[4px] border border-gray-400 bg-white ",
					"group-has-[input:checked]:bg-gray-800 group-has-[input:checked]:border-gray-800 ",
					"group-focus-within:border-ring group-focus-within:ring-ring/50 group-focus-within:ring-[3px] ",
					"peer-aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 peer-aria-invalid:border-destructive"
				)}
			>
				<Check className="hidden group-has-[input:checked]:block text-white size-[14px]" />
			</span>

			{children}
		</label>
	);
}
