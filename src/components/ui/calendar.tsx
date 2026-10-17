"use client";

import * as React from "react";
import {
	DayPicker,
	getDefaultClassNames,
	type DayButton,
	type DropdownProps,
} from "react-day-picker";

import { Button, buttonVariants } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import { RiArrowDownSLine, RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";

function Calendar({
	className,
	classNames,
	showOutsideDays = true,
	captionLayout = "dropdown",
	startMonth = new Date(2012, 0),
	buttonVariant = "outline",
	formatters,
	components,
	...props
}: React.ComponentProps<typeof DayPicker> & {
	buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
	const defaultClassNames = getDefaultClassNames();

	return (
		<DayPicker
			showOutsideDays={showOutsideDays}
			className={cn(
				"group/calendar bg-background px-4 py-3 text-sm [--cell-size:2.5rem] [[data-slot=popover-content]_&]:bg-transparent",
				String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
				String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
				className,
			)}
			captionLayout={captionLayout}
			startMonth={startMonth}
			formatters={{
				formatMonthDropdown: (date) => date.toLocaleString("en-US", { month: "long" }),
				...formatters,
			}}
			classNames={{
				root: cn("w-full", defaultClassNames.root),
				months: cn("relative flex flex-col gap-4 md:flex-row", defaultClassNames.months),
				month: cn("flex w-full flex-col gap-5", defaultClassNames.month),
				nav: cn(
					"pointer-events-none absolute inset-x-0 top-0 flex h-8 w-full items-center justify-between gap-1",
					defaultClassNames.nav,
				),
				button_previous: cn(
					buttonVariants({ variant: buttonVariant }),
					"pointer-events-auto size-8 rounded-lg text-gray-600 select-none aria-disabled:opacity-50",
					defaultClassNames.button_previous,
				),
				button_next: cn(
					buttonVariants({ variant: buttonVariant }),
					"pointer-events-auto size-8 rounded-lg text-gray-600 select-none aria-disabled:opacity-50",
					defaultClassNames.button_next,
				),
				month_caption: cn(
					"flex h-8 w-full items-center justify-center px-(--cell-size)",
					defaultClassNames.month_caption,
				),
				dropdowns: cn(
					"flex h-8 w-full items-center justify-center text-sm",
					defaultClassNames.dropdowns,
				),
				caption_label: cn(
					"text-sm font-medium text-gray-800 select-none",
					defaultClassNames.caption_label,
				),
				month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
				weekdays: cn("flex", defaultClassNames.weekdays),
				weekday: cn(
					"flex h-(--cell-size) flex-1 items-center justify-center rounded-md text-sm font-normal text-gray-800 select-none",
					defaultClassNames.weekday,
				),
				week: cn("flex w-full", defaultClassNames.week),
				week_number_header: cn("w-(--cell-size) select-none", defaultClassNames.week_number_header),
				week_number: cn("text-sm text-muted-foreground select-none", defaultClassNames.week_number),
				day: cn(
					"group/day relative aspect-square h-full w-full p-0 text-center select-none [&:last-child[data-selected=true]_button]:rounded-r-md",
					props.showWeekNumber
						? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-md"
						: "[&:first-child[data-selected=true]_button]:rounded-l-md",
					defaultClassNames.day,
				),
				range_start: cn("rounded-l-md bg-accent", defaultClassNames.range_start),
				range_middle: cn("rounded-none", defaultClassNames.range_middle),
				range_end: cn("rounded-r-md bg-accent", defaultClassNames.range_end),
				today: cn(
					"rounded-lg bg-gray-100 text-gray-800 data-[selected=true]:rounded-none",
					defaultClassNames.today,
				),
				outside: cn("opacity-50", defaultClassNames.outside),
				disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),
				hidden: cn("invisible", defaultClassNames.hidden),
				...classNames,
			}}
			components={{
				Root: ({ className, rootRef, ...props }) => {
					return <div data-slot="calendar" ref={rootRef} className={className} {...props} />;
				},
				Chevron: ({ className, orientation, ...props }) => {
					if (orientation === "left") {
						return <RiArrowLeftSLine className={cn("size-5", className)} {...props} />;
					}

					if (orientation === "right") {
						return <RiArrowRightSLine className={cn("size-5", className)} {...props} />;
					}

					return <RiArrowDownSLine className={cn("size-5", className)} {...props} />;
				},
				DayButton: CalendarDayButton,
				MonthsDropdown: (props) => (
					<CalendarDropdown {...props} align="start" menuClassName="min-w-40" />
				),
				YearsDropdown: (props) => (
					<CalendarDropdown
						{...props}
						options={props.options && [...props.options].reverse()}
						align="end"
						menuClassName="min-w-30"
					/>
				),
				WeekNumber: ({ children, ...props }) => {
					return (
						<td {...props}>
							<div className="flex size-(--cell-size) items-center justify-center text-center">
								{children}
							</div>
						</td>
					);
				},
				...components,
			}}
			{...props}
		/>
	);
}

function CalendarDayButton({
	className,
	day,
	modifiers,
	...props
}: React.ComponentProps<typeof DayButton>) {
	const defaultClassNames = getDefaultClassNames();

	const ref = React.useRef<HTMLButtonElement>(null);
	React.useEffect(() => {
		if (modifiers.focused) ref.current?.focus();
	}, [modifiers.focused]);

	return (
		<Button
			ref={ref}
			variant="ghost"
			size="icon"
			data-day={day.date.toLocaleDateString()}
			data-selected-single={
				modifiers.selected &&
				!modifiers.range_start &&
				!modifiers.range_end &&
				!modifiers.range_middle
			}
			data-range-start={modifiers.range_start}
			data-range-end={modifiers.range_end}
			data-range-middle={modifiers.range_middle}
			className={cn(
				"flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 rounded-lg text-sm leading-none font-normal text-gray-800 hover:bg-gray-100 hover:text-gray-800 group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-3 group-data-[focused=true]/day:ring-ring/50 data-[range-end=true]:bg-gray-900 data-[range-end=true]:text-white data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-gray-100 data-[range-middle=true]:text-gray-800 data-[range-start=true]:bg-gray-900 data-[range-start=true]:text-white data-[selected-single=true]:bg-gray-900 data-[selected-single=true]:text-white data-[selected-single=true]:hover:bg-gray-900 data-[selected-single=true]:hover:text-white dark:hover:text-accent-foreground [&>span]:text-xs [&>span]:opacity-70",
				defaultClassNames.day,
				className,
			)}
			{...props}
		/>
	);
}

function CalendarDropdown({
	options,
	value,
	onChange,
	"aria-label": ariaLabel,
	align,
	menuClassName,
}: DropdownProps & { align: "start" | "end"; menuClassName: string }) {
	const [isOpen, setIsOpen] = React.useState(false);

	return (
		<Select
			open={isOpen}
			onOpenChange={setIsOpen}
			value={String(value)}
			onValueChange={(nextValue) =>
				onChange?.({
					target: { value: nextValue },
				} as React.ChangeEvent<HTMLSelectElement>)
			}
		>
			<SelectTrigger
				aria-label={ariaLabel}
				className="h-7 w-auto gap-0 rounded-lg border-0 bg-transparent px-1.5 text-sm font-normal text-gray-800 shadow-none hover:bg-gray-100 data-[state=open]:bg-gray-100 [&>svg]:hidden"
			>
				<SelectValue>{options?.find((option) => option.value === value)?.label}</SelectValue>
			</SelectTrigger>
			<SelectContent align={align} className={cn("no-scrollbar max-h-80 w-auto", menuClassName)}>
				{isOpen &&
					options?.map((option) => (
						<SelectItem
							key={option.value}
							value={String(option.value)}
							disabled={option.disabled}
							className="pl-3 text-gray-500 data-[state=checked]:bg-gray-100 data-[state=checked]:text-gray-800"
						>
							{option.label}
						</SelectItem>
					))}
			</SelectContent>
		</Select>
	);
}

export { Calendar, CalendarDayButton };
