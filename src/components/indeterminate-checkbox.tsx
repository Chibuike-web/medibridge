import { Checkbox } from "./ui/checkbox";

type IndeterminateCheckboxProps = React.ComponentProps<typeof Checkbox> & {
	indeterminate?: boolean;
};

export function IndeterminateCheckbox({
	indeterminate,
	className,
	checked,
	...rest
}: IndeterminateCheckboxProps) {
	return (
		<Checkbox className="shrink-0" checked={indeterminate ? "indeterminate" : checked} {...rest} />
	);
}
