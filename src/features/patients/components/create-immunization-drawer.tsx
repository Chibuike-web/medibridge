"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RiCalendarLine, RiCloseLine } from "@remixicon/react";
import { format } from "date-fns";
import { useId, useState } from "react";

type CreateImmunizationDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const fieldLabelClassName = "inline-flex items-baseline gap-0.5 text-sm font-medium text-gray-700";
const optionalLabelClassName = "font-normal text-gray-400";
const fieldControlClassName =
	"border-gray-200 bg-white text-gray-700 placeholder:text-gray-400 text-sm h-9";

export function CreateImmunizationDrawer({ open, onOpenChange }: CreateImmunizationDrawerProps) {
	const generatedFormId = useId();
	const [administeredAt, setAdministeredAt] = useState<Date | undefined>();

	return (
		<Drawer open={open} onOpenChange={onOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[50rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 px-6 py-5 text-left">
					<DrawerTitle className="text-base leading-[1.2] text-gray-800">
						Add immunization
					</DrawerTitle>
					<DrawerClose aria-label="Close add immunization drawer">
						<RiCloseLine className="size-6" aria-hidden="true" />
					</DrawerClose>
					<DrawerDescription className="sr-only">
						Create a new immunization record for this patient.
					</DrawerDescription>
				</DrawerHeader>

				<form className="flex min-h-0 flex-1 flex-col gap-12 overflow-y-auto px-6 py-8 text-sm">
					<div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-vaccine-name`} className={fieldLabelClassName}>
								Vaccine name<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-vaccine-name`}
								placeholder="e.g. Hepatitis B, BCG, COVID-19 Vaccine"
								className={fieldControlClassName}
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-series-type`} className={fieldLabelClassName}>
								Series Type<span className={optionalLabelClassName}>(optional)</span>
							</Label>
							<Select>
								<SelectTrigger
									id={`${generatedFormId}-series-type`}
									className="w-full data-[placeholder]:text-gray-400"
								>
									<SelectValue placeholder="Select series type" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectItem value="primary">
											Primary
										</SelectItem>
										<SelectItem value="booster">
											Booster
										</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-current-dose`} className={fieldLabelClassName}>
								Current Dose<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-current-dose`}
								placeholder="e.g. 1, 2, 3"
								className={fieldControlClassName}
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-total-dosage`} className={fieldLabelClassName}>
								Total Dosage<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-total-dosage`}
								placeholder="e.g. 1, 2, 3"
								className={fieldControlClassName}
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-status`} className={fieldLabelClassName}>
								Status<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Select>
								<SelectTrigger
									id={`${generatedFormId}-status`}
									className="w-full data-[placeholder]:text-gray-400"
								>
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectItem value="active">
											Active
										</SelectItem>
										<SelectItem value="completed">
											Completed
										</SelectItem>
										<SelectItem value="cancelled">
											Cancelled
										</SelectItem>
										<SelectItem value="discontinued">
											Discontinued
										</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-2">
							<Label className={fieldLabelClassName}>
								Date administered<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<input
								type="hidden"
								name="dateAdministered"
								value={administeredAt ? format(administeredAt, "yyyy-MM-dd") : ""}
							/>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										id={`${generatedFormId}-date-administered`}
										type="button"
										variant="outline"
										data-empty={!administeredAt}
										className={`${fieldControlClassName} flex w-full justify-between font-normal data-[empty=true]:text-gray-400 hover:bg-white active:scale-100`}
									>
										{administeredAt ? format(administeredAt, "PPP") : "Select administration date"}
										<RiCalendarLine className="size-4 text-gray-600" aria-hidden="true" />
									</Button>
								</PopoverTrigger>
								<PopoverContent className="p-0">
									<Calendar
										mode="single"
										selected={administeredAt}
										onSelect={setAdministeredAt}
										autoFocus
									/>
								</PopoverContent>
							</Popover>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-administered-by`} className={fieldLabelClassName}>
								Administered by<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-administered-by`}
								placeholder="e.g. Dr. Adebayo Johnson"
								className={fieldControlClassName}
							/>
						</div>

						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-clinical-notes`} className={fieldLabelClassName}>
								Clinical notes<span className={optionalLabelClassName}>(optional)</span>
							</Label>
							<Textarea
								id={`${generatedFormId}-clinical-notes`}
								placeholder="Add vaccination notes, patient response, or follow-up instructions"
								className="min-h-28 bg-white text-sm text-gray-700 placeholder:text-gray-400"
							/>
						</div>
					</div>
				</form>

				<DrawerFooter className="border-t border-gray-200 px-6 py-5 text-sm">
					<div className="flex flex-col gap-x-4 gap-y-2 lg:flex-row lg:self-end">
						<DrawerClose asChild>
							<Button type="button" variant="outline" className="text-sm">
								Cancel
							</Button>
						</DrawerClose>
						<Button type="button" className="text-sm">
							Add immunization
						</Button>
					</div>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
