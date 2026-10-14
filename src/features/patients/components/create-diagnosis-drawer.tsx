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
import {
	AttachmentFormFields,
	type AttachmentFormRow,
} from "@/features/patients/components/attachment-form-fields";
import { createPatientDiagnosisAction } from "@/features/patients/server/create-patient-diagnosis-action";
import { diagnosisSeverityStages, diagnosisStatuses } from "@/features/patients/server/schemas";
import { authClient } from "@/lib/better-auth/auth.client";
import { RiAddLine, RiCalendarLine, RiCloseLine, RiErrorWarningFill } from "@remixicon/react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition, type FormEvent } from "react";

type CreateDiagnosisDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	patientId: string;
	encounterId?: string;
	onDiagnosisCreated: () => void;
};

const fieldLabelClassName = "inline-flex items-baseline gap-0.5 text-sm font-medium text-gray-700";
const optionalLabelClassName = "font-normal text-gray-400";
const fieldControlClassName =
	"border-gray-200 bg-white text-gray-700 placeholder:text-gray-400 text-sm h-9";

export function CreateDiagnosisDrawer({
	open,
	onOpenChange,
	patientId,
	encounterId,
	onDiagnosisCreated,
}: CreateDiagnosisDrawerProps) {
	const router = useRouter();
	const generatedFormId = useId();
	const nextAttachmentRowNumberRef = useRef(0);
	const { data: session } = authClient.useSession();
	const [formError, setFormError] = useState("");
	const [diagnosedAt, setDiagnosedAt] = useState<Date | undefined>();
	const [attachmentRows, setAttachmentRows] = useState<AttachmentFormRow[]>([]);
	const [isPending, startTransition] = useTransition();

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			setFormError("");
			setDiagnosedAt(undefined);
			setAttachmentRows([]);
		}
		onOpenChange(isOpen);
	}

	function handleCreate(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setFormError("");
		const formData = new FormData(event.currentTarget);
		formData.set("diagnosedAt", diagnosedAt ? format(diagnosedAt, "yyyy-MM-dd") : "");
		if (encounterId) formData.set("encounterId", encounterId);

		startTransition(async () => {
			const result = await createPatientDiagnosisAction(patientId, formData);

			if (result.status === "unauthorized") {
				router.refresh();
				return;
			}

			if (result.status !== "success") {
				setFormError(result.error);
				return;
			}

			handleOpenChange(false);
			onDiagnosisCreated();
		});
	}

	function handleAddAttachmentRow() {
		nextAttachmentRowNumberRef.current += 1;

		setAttachmentRows((prev) => [
			...prev,
			{
				id: `${generatedFormId}-attachment-${nextAttachmentRowNumberRef.current}`,
				name: "",
				recordId: "",
			},
		]);
	}

	function handleRemoveAttachmentRow(attachmentRowId: string) {
		setAttachmentRows((prev) =>
			prev.filter((attachmentRow) => attachmentRow.id !== attachmentRowId),
		);
	}

	return (
		<Drawer open={open} onOpenChange={handleOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[37.5rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 text-left">
					<DrawerTitle className="leading-[1.2] text-gray-800">Add diagnosis</DrawerTitle>
					<DrawerClose asChild>
						<Button variant="ghost" size="icon" aria-label="Close add diagnosis drawer">
							<RiCloseLine aria-hidden="true" />
						</Button>
					</DrawerClose>
					<DrawerDescription className="sr-only">
						Create a new diagnosis record for this patient.
					</DrawerDescription>
				</DrawerHeader>

				<form
					id={generatedFormId}
					onSubmit={handleCreate}
					className="flex min-h-0 flex-1 flex-col gap-12 overflow-y-auto px-4 py-5 text-sm"
				>
					<div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
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
						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-diagnosis-name`} className={fieldLabelClassName}>
								Diagnosis name<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-diagnosis-name`}
								name="diagnosisName"
								placeholder="e.g. Type 2 Diabetes Mellitus"
								className={fieldControlClassName}
								required
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-severity`} className={fieldLabelClassName}>
								Severity/Stage<span className={optionalLabelClassName}>(optional)</span>
							</Label>
							<Select name="severityStage">
								<SelectTrigger id={`${generatedFormId}-severity`} className="w-full">
									<SelectValue placeholder="Select severity or stage" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										{diagnosisSeverityStages.map((severityStage) => (
											<SelectItem key={severityStage} value={severityStage}>
												{severityStage}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-status`} className={fieldLabelClassName}>
								Status<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Select name="status" required>
								<SelectTrigger id={`${generatedFormId}-status`} className="w-full">
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										{diagnosisStatuses.map((status) => (
											<SelectItem key={status} value={status}>
												{status}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-diagnosed-at`} className={fieldLabelClassName}>
								Diagnosed at<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										id={`${generatedFormId}-diagnosed-at`}
										type="button"
										variant="outline"
										data-empty={!diagnosedAt}
										className={`${fieldControlClassName} flex w-full justify-between font-normal data-[empty=true]:text-gray-400 hover:bg-white active:scale-100`}
									>
										{diagnosedAt ? format(diagnosedAt, "PPP") : "Select diagnosis date"}
										<RiCalendarLine className="size-4 text-gray-600" aria-hidden="true" />
									</Button>
								</PopoverTrigger>
								<PopoverContent className="p-0">
									<Calendar
										mode="single"
										selected={diagnosedAt}
										onSelect={setDiagnosedAt}
										disabled={{ after: new Date() }}
										autoFocus
									/>
								</PopoverContent>
							</Popover>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-diagnosed-by`} className={fieldLabelClassName}>
								Diagnosed by<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-diagnosed-by`}
								name="diagnosedBy"
								defaultValue={session?.user.name}
								placeholder="e.g. Dr. Chinenye Okafor"
								className={fieldControlClassName}
								required
							/>
						</div>

						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-clinical-notes`} className={fieldLabelClassName}>
								Clinical notes<span className={optionalLabelClassName}>(optional)</span>
							</Label>
							<Textarea
								id={`${generatedFormId}-clinical-notes`}
								name="clinicalNote"
								placeholder="Add supporting clinical observations, symptoms, or treatment notes"
								className="bg-white text-gray-700 placeholder:text-gray-400"
							/>
						</div>
					</div>

					<div className="flex flex-col gap-6">
						{attachmentRows.map((attachmentRow, attachmentIndex) => (
							<AttachmentFormFields
								key={attachmentRow.id}
								attachmentRow={attachmentRow}
								attachmentIndex={attachmentIndex}
								fieldLabelClassName={fieldLabelClassName}
								requiredLabelClassName={optionalLabelClassName}
								fieldControlClassName={fieldControlClassName}
								onRemoveAttachmentRow={handleRemoveAttachmentRow}
							/>
						))}

						<div>
							<Button
								type="button"
								variant="outline"
								className="bg-white text-gray-600"
								onClick={handleAddAttachmentRow}
							>
								<RiAddLine className="size-5" aria-hidden="true" />
								Add related record
							</Button>
						</div>
					</div>
				</form>

				<DrawerFooter className="border-t border-gray-200 text-sm">
					<div className="flex flex-col gap-2 lg:flex-row lg:self-end">
						<DrawerClose asChild>
							<Button type="button" variant="outline">
								Cancel
							</Button>
						</DrawerClose>
						<Button type="submit" form={generatedFormId} disabled={isPending}>
							{isPending ? "Adding…" : "Add diagnosis"}
						</Button>
					</div>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
