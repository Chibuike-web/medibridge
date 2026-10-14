"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { RiCalendarLine, RiCloseLine, RiErrorWarningFill } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { createPatientEncounterAction } from "@/features/patients/server/create-patient-encounter-action";
import { encounterDepartments, encounterTypes } from "@/features/patients/server/schemas";
import { authClient } from "@/lib/better-auth/auth.client";

const fieldLabelClassName = "inline-flex items-baseline gap-0.5 text-sm font-medium text-gray-700";
const optionalLabelClassName = "font-normal text-gray-400";
const fieldControlClassName =
	"h-9 border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400";

export function CreateEncounterDrawer({
	open,
	onOpenChange,
	patientId,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	patientId: string;
}) {
	const router = useRouter();
	const formId = useId();
	const { data: session } = authClient.useSession();
	const [formError, setFormError] = useState("");
	const [selectedEncounterDate, setSelectedEncounterDate] = useState(() => new Date());
	const [isPending, startTransition] = useTransition();

	function handleCreate(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setFormError("");
		const now = new Date();
		const encounterDate = new Date(selectedEncounterDate);
		encounterDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
		const formData = new FormData(event.currentTarget);
		formData.set("encounterDate", encounterDate.toISOString());

		startTransition(async () => {
			const result = await createPatientEncounterAction(patientId, formData);

			if (result.status === "unauthorized") {
				router.refresh();
				return;
			}

			if (result.status !== "success") {
				setFormError(result.error);
				return;
			}

			onOpenChange(false);
			router.push(
				`/dashboard/patients/${patientId}/encounters/${result.encounterId}?created=true` as Route,
			);
		});
	}

	return (
		<Drawer
			direction="right"
			open={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) {
					setFormError("");
					setSelectedEncounterDate(new Date());
				}
				onOpenChange(isOpen);
			}}
		>
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[37.5rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 text-left">
					<DrawerTitle className="leading-[1.2] text-gray-800">Create encounter</DrawerTitle>
					<DrawerClose asChild>
						<Button variant="ghost" size="icon" aria-label="Close create encounter drawer">
							<RiCloseLine aria-hidden="true" />
						</Button>
					</DrawerClose>
					<DrawerDescription className="sr-only">
						Record the visit before adding vitals, diagnoses, and other records.
					</DrawerDescription>
				</DrawerHeader>
				<form
					id={formId}
					onSubmit={handleCreate}
					className="grid min-h-0 flex-1 content-start gap-x-4 gap-y-6 overflow-y-auto px-4 py-5 text-sm sm:grid-cols-2"
				>
					{formError && (
						<div
							key={formError}
							ref={(banner) => banner?.scrollIntoView({ behavior: "smooth", block: "center" })}
							role="alert"
							className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-3 text-left text-sm font-medium text-red-700 sm:col-span-2"
						>
							<RiErrorWarningFill className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
							<p className="min-w-0 flex-1 text-pretty">{formError}</p>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="ml-auto -my-1 size-6 rounded-full text-red-700 hover:bg-red-100 hover:text-red-700"
								aria-label="Dismiss error"
								onClick={() => setFormError("")}
							>
								<RiCloseLine aria-hidden="true" />
							</Button>
						</div>
					)}
					<div className="flex flex-col gap-2">
						<Label htmlFor={`${formId}-type`} className={fieldLabelClassName}>
							Visit type <span className={optionalLabelClassName}>(required)</span>
						</Label>
						<Select name="encounterType" required>
							<SelectTrigger id={`${formId}-type`} className="w-full">
								<SelectValue placeholder="Select visit type" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{encounterTypes.map((encounterType) => (
										<SelectItem key={encounterType} value={encounterType}>
											{encounterType}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor={`${formId}-department`} className={fieldLabelClassName}>
							Department <span className={optionalLabelClassName}>(required)</span>
						</Label>
						<Select name="department" required>
							<SelectTrigger id={`${formId}-department`} className="w-full">
								<SelectValue placeholder="Select department" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{encounterDepartments.map((department) => (
										<SelectItem key={department} value={department}>
											{department}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor={`${formId}-physician`} className={fieldLabelClassName}>
							Attending physician <span className={optionalLabelClassName}>(required)</span>
						</Label>
						<Input
							id={`${formId}-physician`}
							name="physician"
							defaultValue={session?.user.name}
							className={fieldControlClassName}
							placeholder="Dr. Chinenye Okafor"
							required
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor={`${formId}-date`} className={fieldLabelClassName}>
							Visit date <span className={optionalLabelClassName}>(required)</span>
						</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									id={`${formId}-date`}
									type="button"
									variant="outline"
									className={`${fieldControlClassName} flex w-full justify-between font-normal hover:bg-white active:scale-100`}
								>
									{format(selectedEncounterDate, "PPP")}
									<RiCalendarLine className="size-4 text-gray-600" aria-hidden="true" />
								</Button>
							</PopoverTrigger>
							<PopoverContent align="end" className="p-0">
								<Calendar
									mode="single"
									required
									selected={selectedEncounterDate}
									onSelect={setSelectedEncounterDate}
									disabled={{ after: new Date() }}
									autoFocus
								/>
							</PopoverContent>
						</Popover>
					</div>
					<div className="flex flex-col gap-2 sm:col-span-2">
						<Label htmlFor={`${formId}-reason`} className={fieldLabelClassName}>
							Reason for visit <span className={optionalLabelClassName}>(optional)</span>
						</Label>
						<Textarea
							id={`${formId}-reason`}
							name="reason"
							className="min-h-28 bg-white text-sm text-gray-700 placeholder:text-gray-400"
							placeholder="Chest pain for 2 days"
						/>
					</div>
				</form>
				<DrawerFooter className="flex-col gap-2 border-t border-gray-200 text-sm lg:flex-row lg:justify-end">
					<DrawerClose asChild>
						<Button type="button" variant="outline">
							Cancel
						</Button>
					</DrawerClose>
					<Button type="submit" form={formId} disabled={isPending}>
						{isPending ? "Creating…" : "Create encounter"}
					</Button>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
