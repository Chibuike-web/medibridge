"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO, subYears } from "date-fns";
import {
	RiArrowDownSLine,
	RiCalendarLine,
	RiCloseLine,
	RiErrorWarningFill,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { PixelLoader } from "@/components/ui/pixel-loader";
import { Calendar } from "@/components/ui/calendar";
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
import {
	manualPatientSchema,
	type ManualPatientType,
} from "@/features/patients/schemas/manual-patient-schema";
import { createPatientAction } from "@/features/patients/server/create-patient-action";
import { nigerianStates } from "@/features/patients/utils/nigerian-states";
import { cn } from "@/lib/utils/cn";
import sectionSeparator from "@/assets/review/section-separator.svg";

const fieldLabelClassName = "mb-2 items-baseline gap-0.5 text-sm font-medium text-gray-700";
const requiredLabelClassName = "font-normal text-gray-400";
const fieldControlClassName =
	"h-9 border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400";
const fieldErrorClassName = "mt-1.5 text-sm font-medium text-red-500";

export function ManualPatientClient({ returnTo }: { returnTo: Route }) {
	const router = useRouter();
	const formId = useId();
	const [formError, setFormError] = useState("");
	const [collapsedSections, setCollapsedSections] = useState({
		personalInformation: false,
		contactInformation: false,
		emergencyContact: false,
		physicalInformation: false,
	});
	const [isPending, startTransition] = useTransition();

	const {
		register,
		control,
		handleSubmit,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(manualPatientSchema),
		defaultValues: {
			personalInformation: {
				firstName: "",
				middleName: "",
				lastName: "",
				dateOfBirth: "",
				sex: "",
				age: "",
				maritalStatus: "",
				nationalId: "",
			},
			contactInformation: {
				phoneNumber: "",
				emailAddress: "",
				residentialAddress: "",
				stateOfOrigin: "",
				countryOfOrigin: "",
			},
			emergencyContact: {
				firstName: "",
				middleName: "",
				lastName: "",
				relationship: "",
				phoneNumber: "",
			},
			physicalInformation: {
				height: "",
				weight: "",
				bloodGroup: "",
				genotype: "",
			},
		},
	});

	function onSubmit(data: ManualPatientType) {
		setFormError("");
		startTransition(async () => {
			try {
				const result = await createPatientAction(data);

				if (result.status === "unauthorized") {
					router.refresh();
					return;
				}

				if (result.status !== "success") {
					setFormError(result.error);
					return;
				}

				router.push(`/dashboard/patients/${result.patientId}?section=patient-overview` as Route);
			} catch (error) {
				console.error("Creating patient failed:", error);
				setFormError("We couldn’t save this patient. Please try again.");
			}
		});
	}

	return (
		<main className="min-h-dvh px-6 pt-12 pb-40 text-gray-800">
			<header className="flex flex-col items-center gap-3 text-center">
				<h1 className="text-lg leading-[1.2] font-semibold tracking-[-0.015em] text-balance">
					Add Patient
				</h1>
				<p className="text-sm leading-[1.2] font-normal tracking-[-0.02em] text-pretty text-gray-600">
					Enter the patient’s details to create their record.
				</p>
			</header>
			{formError && (
				<div
					key={formError}
					ref={(banner) => banner?.scrollIntoView({ behavior: "smooth", block: "center" })}
					role="alert"
					className="mx-auto mt-6 flex w-full max-w-[31.25rem] items-start gap-2 rounded-xl bg-red-50 px-3 py-3 text-left text-sm font-medium text-red-700"
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
			<form
				method="post"
				id={formId}
				noValidate
				onSubmit={handleSubmit(onSubmit, (formErrors) =>
					setCollapsedSections((prev) => ({
						personalInformation: prev.personalInformation && !formErrors.personalInformation,
						contactInformation: prev.contactInformation && !formErrors.contactInformation,
						emergencyContact: prev.emergencyContact && !formErrors.emergencyContact,
						physicalInformation: prev.physicalInformation && !formErrors.physicalInformation,
					})),
				)}
				className="mx-auto mt-12 flex w-full max-w-[31.25rem] flex-col gap-6"
			>
				<PatientFormSection
					id={`${formId}-personal`}
					title="Personal Information"
					fieldCount={8}
					isCollapsed={collapsedSections.personalInformation}
					onToggle={() =>
						setCollapsedSections((prev) => ({
							...prev,
							personalInformation: !prev.personalInformation,
						}))
					}
				>
					<div>
						<Label htmlFor={`${formId}-first-name`} className={fieldLabelClassName}>
							First name<span className={requiredLabelClassName}>(required)</span>
						</Label>
						<Input
							id={`${formId}-first-name`}
							{...register("personalInformation.firstName")}
							aria-invalid={!!errors.personalInformation?.firstName}
							aria-describedby={
								errors.personalInformation?.firstName ? `${formId}-first-name-error` : undefined
							}
							className={fieldControlClassName}
						/>
						{errors.personalInformation?.firstName && (
							<p id={`${formId}-first-name-error`} className={fieldErrorClassName}>
								{errors.personalInformation.firstName.message}
							</p>
						)}
					</div>
					<div>
						<Label htmlFor={`${formId}-middle-name`} className={fieldLabelClassName}>
							Middle name
						</Label>
						<Input
							id={`${formId}-middle-name`}
							{...register("personalInformation.middleName")}
							className={fieldControlClassName}
						/>
					</div>
					<div>
						<Label htmlFor={`${formId}-last-name`} className={fieldLabelClassName}>
							Last name<span className={requiredLabelClassName}>(required)</span>
						</Label>
						<Input
							id={`${formId}-last-name`}
							{...register("personalInformation.lastName")}
							aria-invalid={!!errors.personalInformation?.lastName}
							aria-describedby={
								errors.personalInformation?.lastName ? `${formId}-last-name-error` : undefined
							}
							className={fieldControlClassName}
						/>
						{errors.personalInformation?.lastName && (
							<p id={`${formId}-last-name-error`} className={fieldErrorClassName}>
								{errors.personalInformation.lastName.message}
							</p>
						)}
					</div>
					<div>
						<Label htmlFor={`${formId}-date-of-birth`} className={fieldLabelClassName}>
							Date of birth<span className={requiredLabelClassName}>(required)</span>
						</Label>
						<Controller
							name="personalInformation.dateOfBirth"
							control={control}
							render={({ field }) => (
								<Popover>
									<PopoverTrigger asChild>
										<Button
											ref={field.ref}
											type="button"
											variant="outline"
											id={`${formId}-date-of-birth`}
											aria-invalid={!!errors.personalInformation?.dateOfBirth}
											aria-describedby={
												errors.personalInformation?.dateOfBirth
													? `${formId}-date-of-birth-error`
													: undefined
											}
											className={`${fieldControlClassName} w-full justify-between font-normal active:scale-100`}
										>
											{field.value ? format(parseISO(field.value), "PPP") : "Select date"}
											<RiCalendarLine aria-hidden="true" />
										</Button>
									</PopoverTrigger>
									<PopoverContent align="end" collisionPadding={16} className="p-0">
										<Calendar
											mode="single"
											required
											selected={field.value ? parseISO(field.value) : undefined}
											defaultMonth={field.value ? parseISO(field.value) : undefined}
											disabled={{ after: new Date() }}
											startMonth={subYears(new Date(), 100)}
											onSelect={(date) => field.onChange(format(date, "yyyy-MM-dd"))}
											autoFocus
										/>
									</PopoverContent>
								</Popover>
							)}
						/>
						{errors.personalInformation?.dateOfBirth && (
							<p id={`${formId}-date-of-birth-error`} className={fieldErrorClassName}>
								{errors.personalInformation.dateOfBirth.message}
							</p>
						)}
					</div>
					<div>
						<Label htmlFor={`${formId}-sex`} className={fieldLabelClassName}>
							Sex
						</Label>
						<Controller
							name="personalInformation.sex"
							control={control}
							render={({ field }) => (
								<Select value={field.value} onValueChange={field.onChange}>
									<SelectTrigger
										ref={field.ref}
										id={`${formId}-sex`}
										className={`${fieldControlClassName} w-full`}
									>
										<SelectValue placeholder="Select sex" />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											<SelectItem value="female">Female</SelectItem>
											<SelectItem value="male">Male</SelectItem>
											<SelectItem value="other">Other</SelectItem>
										</SelectGroup>
									</SelectContent>
								</Select>
							)}
						/>
					</div>
					<div>
						<Label htmlFor={`${formId}-age`} className={fieldLabelClassName}>
							Age
						</Label>
						<Input
							id={`${formId}-age`}
							type="number"
							min={0}
							{...register("personalInformation.age")}
							aria-invalid={!!errors.personalInformation?.age}
							aria-describedby={errors.personalInformation?.age ? `${formId}-age-error` : undefined}
							className={fieldControlClassName}
						/>
						{errors.personalInformation?.age && (
							<p id={`${formId}-age-error`} className={fieldErrorClassName}>
								{errors.personalInformation.age.message}
							</p>
						)}
					</div>
					<div>
						<Label htmlFor={`${formId}-marital-status`} className={fieldLabelClassName}>
							Marital status
						</Label>
						<Controller
							name="personalInformation.maritalStatus"
							control={control}
							render={({ field }) => (
								<Select value={field.value} onValueChange={field.onChange}>
									<SelectTrigger
										ref={field.ref}
										id={`${formId}-marital-status`}
										className={`${fieldControlClassName} w-full`}
									>
										<SelectValue placeholder="Select marital status" />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											<SelectItem value="single">Single</SelectItem>
											<SelectItem value="married">Married</SelectItem>
											<SelectItem value="divorced">Divorced</SelectItem>
											<SelectItem value="widowed">Widowed</SelectItem>
										</SelectGroup>
									</SelectContent>
								</Select>
							)}
						/>
					</div>
					<div>
						<Label htmlFor={`${formId}-national-id`} className={fieldLabelClassName}>
							National ID
						</Label>
						<Input
							id={`${formId}-national-id`}
							{...register("personalInformation.nationalId")}
							className={fieldControlClassName}
						/>
					</div>
				</PatientFormSection>

				<PatientFormSection
					id={`${formId}-contact`}
					title="Contact Information"
					fieldCount={5}
					isCollapsed={collapsedSections.contactInformation}
					onToggle={() =>
						setCollapsedSections((prev) => ({
							...prev,
							contactInformation: !prev.contactInformation,
						}))
					}
				>
					<div>
						<Label htmlFor={`${formId}-phone-number`} className={fieldLabelClassName}>
							Phone number
						</Label>
						<Input
							id={`${formId}-phone-number`}
							type="tel"
							{...register("contactInformation.phoneNumber")}
							className={fieldControlClassName}
						/>
					</div>
					<div>
						<Label htmlFor={`${formId}-email-address`} className={fieldLabelClassName}>
							Email address
						</Label>
						<Input
							id={`${formId}-email-address`}
							type="email"
							{...register("contactInformation.emailAddress")}
							aria-invalid={!!errors.contactInformation?.emailAddress}
							aria-describedby={
								errors.contactInformation?.emailAddress
									? `${formId}-email-address-error`
									: undefined
							}
							className={fieldControlClassName}
						/>
						{errors.contactInformation?.emailAddress && (
							<p id={`${formId}-email-address-error`} className={fieldErrorClassName}>
								{errors.contactInformation.emailAddress.message}
							</p>
						)}
					</div>
					<div className="sm:col-span-2">
						<Label htmlFor={`${formId}-residential-address`} className={fieldLabelClassName}>
							Residential address
						</Label>
						<Input
							id={`${formId}-residential-address`}
							{...register("contactInformation.residentialAddress")}
							className={fieldControlClassName}
						/>
					</div>
					<div>
						<Label htmlFor={`${formId}-state-of-origin`} className={fieldLabelClassName}>
							State of origin
						</Label>
						<Controller
							name="contactInformation.stateOfOrigin"
							control={control}
							render={({ field }) => (
								<Select value={field.value} onValueChange={field.onChange}>
									<SelectTrigger
										ref={field.ref}
										id={`${formId}-state-of-origin`}
										className={`${fieldControlClassName} w-full`}
									>
										<SelectValue placeholder="Select state" />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											{nigerianStates.map((state) => (
												<SelectItem key={state} value={state}>
													{state}
												</SelectItem>
											))}
										</SelectGroup>
									</SelectContent>
								</Select>
							)}
						/>
					</div>
					<div>
						<Label htmlFor={`${formId}-country-of-origin`} className={fieldLabelClassName}>
							Country of origin
						</Label>
						<Controller
							name="contactInformation.countryOfOrigin"
							control={control}
							render={({ field }) => (
								<Select value={field.value} onValueChange={field.onChange}>
									<SelectTrigger
										ref={field.ref}
										id={`${formId}-country-of-origin`}
										className={`${fieldControlClassName} w-full`}
									>
										<SelectValue placeholder="Select country" />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											<SelectItem value="Nigeria">Nigeria</SelectItem>
										</SelectGroup>
									</SelectContent>
								</Select>
							)}
						/>
					</div>
				</PatientFormSection>

				<PatientFormSection
					id={`${formId}-emergency`}
					title="Emergency Contact"
					fieldCount={5}
					isCollapsed={collapsedSections.emergencyContact}
					onToggle={() =>
						setCollapsedSections((prev) => ({ ...prev, emergencyContact: !prev.emergencyContact }))
					}
				>
					<div>
						<Label htmlFor={`${formId}-emergency-first-name`} className={fieldLabelClassName}>
							First name<span className={requiredLabelClassName}>(required)</span>
						</Label>
						<Input
							id={`${formId}-emergency-first-name`}
							{...register("emergencyContact.firstName")}
							aria-invalid={!!errors.emergencyContact?.firstName}
							aria-describedby={
								errors.emergencyContact?.firstName
									? `${formId}-emergency-first-name-error`
									: undefined
							}
							className={fieldControlClassName}
						/>
						{errors.emergencyContact?.firstName && (
							<p id={`${formId}-emergency-first-name-error`} className={fieldErrorClassName}>
								{errors.emergencyContact.firstName.message}
							</p>
						)}
					</div>
					<div>
						<Label htmlFor={`${formId}-emergency-middle-name`} className={fieldLabelClassName}>
							Middle name
						</Label>
						<Input
							id={`${formId}-emergency-middle-name`}
							{...register("emergencyContact.middleName")}
							className={fieldControlClassName}
						/>
					</div>
					<div>
						<Label htmlFor={`${formId}-emergency-last-name`} className={fieldLabelClassName}>
							Last name<span className={requiredLabelClassName}>(required)</span>
						</Label>
						<Input
							id={`${formId}-emergency-last-name`}
							{...register("emergencyContact.lastName")}
							aria-invalid={!!errors.emergencyContact?.lastName}
							aria-describedby={
								errors.emergencyContact?.lastName
									? `${formId}-emergency-last-name-error`
									: undefined
							}
							className={fieldControlClassName}
						/>
						{errors.emergencyContact?.lastName && (
							<p id={`${formId}-emergency-last-name-error`} className={fieldErrorClassName}>
								{errors.emergencyContact.lastName.message}
							</p>
						)}
					</div>
					<div>
						<Label htmlFor={`${formId}-relationship`} className={fieldLabelClassName}>
							Relationship
						</Label>
						<Input
							id={`${formId}-relationship`}
							{...register("emergencyContact.relationship")}
							className={fieldControlClassName}
						/>
					</div>
					<div>
						<Label htmlFor={`${formId}-emergency-phone-number`} className={fieldLabelClassName}>
							Phone number
						</Label>
						<Input
							id={`${formId}-emergency-phone-number`}
							type="tel"
							{...register("emergencyContact.phoneNumber")}
							className={fieldControlClassName}
						/>
					</div>
				</PatientFormSection>

				<PatientFormSection
					id={`${formId}-physical`}
					title="Physical Information"
					fieldCount={4}
					isCollapsed={collapsedSections.physicalInformation}
					onToggle={() =>
						setCollapsedSections((prev) => ({
							...prev,
							physicalInformation: !prev.physicalInformation,
						}))
					}
				>
					<div>
						<Label htmlFor={`${formId}-height`} className={fieldLabelClassName}>
							Height
						</Label>
						<Input
							id={`${formId}-height`}
							{...register("physicalInformation.height")}
							className={fieldControlClassName}
						/>
					</div>
					<div>
						<Label htmlFor={`${formId}-weight`} className={fieldLabelClassName}>
							Weight
						</Label>
						<Input
							id={`${formId}-weight`}
							{...register("physicalInformation.weight")}
							className={fieldControlClassName}
						/>
					</div>
					<div>
						<Label htmlFor={`${formId}-blood-group`} className={fieldLabelClassName}>
							Blood group
						</Label>
						<Input
							id={`${formId}-blood-group`}
							{...register("physicalInformation.bloodGroup")}
							className={fieldControlClassName}
						/>
					</div>
					<div>
						<Label htmlFor={`${formId}-genotype`} className={fieldLabelClassName}>
							Genotype
						</Label>
						<Input
							id={`${formId}-genotype`}
							{...register("physicalInformation.genotype")}
							className={fieldControlClassName}
						/>
					</div>
				</PatientFormSection>
			</form>
			<footer className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-100 bg-white px-6 py-4">
				<div className="mx-auto flex w-full max-w-[31.25rem] flex-wrap items-center justify-between gap-3">
					<Button variant="outline" className="rounded-lg max-sm:w-full" asChild>
						<Link href={returnTo}>Cancel</Link>
					</Button>
					<Button
						type="submit"
						form={formId}
						disabled={isPending}
						aria-busy={isPending}
						className="rounded-lg bg-[#222530] hover:bg-[#222530]/90 max-sm:w-full"
					>
						{isPending ? <PixelLoader label="Saving…" /> : "Save patient"}
					</Button>
				</div>
			</footer>
		</main>
	);
}

function PatientFormSection({
	id,
	title,
	fieldCount,
	isCollapsed,
	onToggle,
	children,
}: {
	id: string;
	title: string;
	fieldCount: number;
	isCollapsed: boolean;
	onToggle: () => void;
	children: ReactNode;
}) {
	return (
		<section aria-labelledby={`${id}-heading`}>
			<h2 id={`${id}-heading`}>
				<Button
					type="button"
					variant="ghost"
					className="h-8 w-full justify-between border-0 px-0 font-semibold hover:bg-transparent active:scale-100"
					aria-expanded={!isCollapsed}
					aria-controls={id}
					onClick={onToggle}
				>
					<span className="flex min-w-0 items-center gap-2 text-base tracking-[-0.02em]">
						{title}{" "}
						<Image src={sectionSeparator} alt="" width={4} height={4} className="shrink-0" />{" "}
						<span className="text-xs font-normal text-gray-400 sm:text-base">
							{fieldCount} fields
						</span>
					</span>
					<RiArrowDownSLine
						className={cn(
							"shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none",
							!isCollapsed && "rotate-180",
						)}
						aria-hidden="true"
					/>
				</Button>
			</h2>
			<div
				id={id}
				aria-hidden={isCollapsed}
				inert={isCollapsed}
				className={cn(
					"grid transition-[grid-template-rows] duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none",
					isCollapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
				)}
			>
				<div className="-m-1 min-h-0 overflow-hidden p-1">
					<div className="grid grid-cols-1 gap-x-4 gap-y-6 pt-2.5 sm:grid-cols-2">{children}</div>
				</div>
			</div>
		</section>
	);
}
