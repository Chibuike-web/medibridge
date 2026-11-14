"use client";

import { useId, useState } from "react";
import { RiCloseLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { encounterDepartments } from "@/features/patients/server/schemas";
import { cn } from "@/lib/utils/cn";
import { formatLabel } from "@/lib/utils/format-label";

import type { MemberAccess, StaffType } from "./types";

const staffTypes = [
	{
		value: "clinician",
		description: "Reads and edits clinical records and requests transfers.",
		includedPermissions: [
			{
				label: "Create and edit clinical records",
				description: "Diagnoses, medications, allergies, labs, vitals and encounters.",
			},
			{ label: "Request transfers", description: "Prepare records to send to another hospital." },
		],
	},
	{
		value: "front_desk",
		description: "Adds patients and uploads their documents. Can't edit clinical records.",
		includedPermissions: [
			{
				label: "Add patients",
				description: "Upload documents or enter details to create patient profiles.",
			},
			{
				label: "Edit patient details",
				description: "Contact, emergency contact and physical details.",
			},
		],
	},
] as const;

const extraPermissions = [
	{
		value: "approve_transfers",
		label: "Approve transfers",
		description: "Send a request to the patient for approval.",
	},
	{
		value: "archive_records",
		label: "Archive records",
		description: "Hide outdated records from the patient's chart.",
	},
	{
		value: "export_data",
		label: "Export data",
		description: "Download patient and record lists as CSV.",
	},
	{
		value: "manage_members",
		label: "Manage members",
		description: "Invite people and change their access.",
	},
	{
		value: "view_audit_log",
		label: "View audit log",
		description: "See who changed which record, and when.",
	},
];

const mcpScopes = [
	{ value: "read_records", label: "Read patient records" },
	{ value: "create_encounters", label: "Create encounters" },
	{ value: "request_transfers", label: "Request transfers" },
];

export function ManageAccessDialog({
	open,
	onOpenChange,
	memberLabel,
	access,
	onSave,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	memberLabel: string;
	access: MemberAccess | null;
	onSave: (access: MemberAccess) => void;
}) {
	const formId = useId();
	const [selectedRole, setSelectedRole] = useState<MemberAccess["role"]>(access?.role ?? "member");
	const [selectedStaffType, setSelectedStaffType] = useState<StaffType | null>(
		access?.staffType ?? null,
	);
	const [selectedDepartments, setSelectedDepartments] = useState<string[] | null>(
		access?.departments ?? null,
	);
	const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
		access?.permissions ?? [],
	);
	const [isMcpAllowed, setIsMcpAllowed] = useState(Boolean(access?.mcpScopes.length));
	const [selectedMcpScopes, setSelectedMcpScopes] = useState<string[]>(
		access?.mcpScopes.length ? access.mcpScopes : ["read_records"],
	);
	const [isSaveAttempted, setIsSaveAttempted] = useState(false);

	const selectedStaffTypeDetails = staffTypes.find(({ value }) => value === selectedStaffType);
	const isStaffTypeMissing = isSaveAttempted && selectedStaffType === null;
	const isDepartmentMissing = isSaveAttempted && selectedDepartments?.length === 0;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[37.5rem] gap-0 p-0">
				<DialogHeader className="py-4">
					<div className="flex min-w-0 items-center gap-2">
						<DialogTitle className="shrink-0">Manage access</DialogTitle>
						<span className="truncate text-sm text-gray-500">{memberLabel}</span>
					</div>
					<DialogClose asChild>
						<Button variant="ghost" size="icon" aria-label="Close manage access dialog">
							<RiCloseLine aria-hidden="true" />
						</Button>
					</DialogClose>
				</DialogHeader>
				<DialogDescription className="sr-only">
					Choose this member&apos;s role, departments, permissions and MCP connections.
				</DialogDescription>
				<form
					method="post"
					id={formId}
					noValidate
					className="relative flex max-h-[60vh] flex-col gap-5 overflow-y-auto px-4 py-5"
					onSubmit={(event) => {
						event.preventDefault();
						if (selectedRole === "admin") {
							onSave({
								role: "admin",
								staffType: null,
								departments: null,
								permissions: [],
								mcpScopes: [],
							});
							return;
						}
						if (selectedStaffType === null || selectedDepartments?.length === 0) {
							setIsSaveAttempted(true);
							return;
						}
						onSave({
							role: "member",
							staffType: selectedStaffType,
							departments: selectedDepartments,
							permissions: selectedPermissions,
							mcpScopes: isMcpAllowed ? selectedMcpScopes : [],
						});
					}}
				>
					<div className="flex flex-col gap-2">
						<span id={`${formId}-role`} className="text-sm font-medium text-gray-600">
							Role <span className="font-normal text-gray-400">(required)</span>
						</span>
						<RadioGroup
							aria-labelledby={`${formId}-role`}
							value={selectedRole}
							onValueChange={(role) => setSelectedRole(role as MemberAccess["role"])}
							className="gap-0"
						>
							<div className="flex items-start gap-3 py-1.5">
								<RadioGroupItem value="admin" id={`${formId}-role-admin`} className="mt-0.5" />
								<Label
									htmlFor={`${formId}-role-admin`}
									className="flex-col items-start gap-1 text-sm leading-5"
								>
									Admin
									<span className="font-normal text-gray-500">
										Manages members, hospital settings and every record.
									</span>
								</Label>
							</div>
							<div className="flex items-start gap-3 py-1.5">
								<RadioGroupItem value="member" id={`${formId}-role-member`} className="mt-0.5" />
								<Label
									htmlFor={`${formId}-role-member`}
									className="flex-col items-start gap-1 text-sm leading-5"
								>
									Member
									<span className="font-normal text-gray-500">
										Hospital staff. What they can do depends on their staff type.
									</span>
								</Label>
							</div>
						</RadioGroup>
						{selectedRole === "admin" ? (
							<div className="flex flex-col gap-1 rounded-lg bg-gray-50 px-4 py-3 text-sm">
								<span className="font-medium text-gray-800">Full access</span>
								<span className="text-gray-500 text-pretty">
									Admins see every department and have every permission, including MCP connections.
								</span>
							</div>
						) : (
							<div>
								<div
									className={cn(
										"flex flex-col gap-1 rounded-lg bg-gray-50 px-4 py-3",
										isStaffTypeMissing && "ring-1 ring-destructive",
									)}
								>
									<span id={`${formId}-staff-type`} className="text-sm font-medium text-gray-600">
										Staff type <span className="font-normal text-gray-400">(required)</span>
									</span>
									<RadioGroup
										aria-labelledby={`${formId}-staff-type`}
										aria-invalid={isStaffTypeMissing}
										aria-describedby={isStaffTypeMissing ? `${formId}-staff-type-error` : undefined}
										value={selectedStaffType ?? ""}
										onValueChange={(staffType) => setSelectedStaffType(staffType as StaffType)}
										className="gap-0"
									>
										{staffTypes.map((staffType) => (
											<div key={staffType.value} className="flex items-start gap-3 py-1.5">
												<RadioGroupItem
													value={staffType.value}
													id={`${formId}-staff-type-${staffType.value}`}
													className="mt-0.5"
												/>
												<Label
													htmlFor={`${formId}-staff-type-${staffType.value}`}
													className="flex-col items-start gap-1 text-sm leading-5"
												>
													{formatLabel(staffType.value)}
													<span className="font-normal text-gray-500">{staffType.description}</span>
												</Label>
											</div>
										))}
									</RadioGroup>
								</div>
								{isStaffTypeMissing ? (
									<p
										id={`${formId}-staff-type-error`}
										className="mt-1.5 text-sm font-medium text-red-500"
									>
										Select a staff type.
									</p>
								) : null}
							</div>
						)}
					</div>

					{selectedRole === "member" ? (
						<>
							<div className="flex flex-col gap-2 border-t border-gray-200 pt-5">
								<div className="flex flex-col gap-1 text-sm">
									<span id={`${formId}-departments`} className="font-medium text-gray-600">
										Departments
									</span>
									<span className="text-gray-500 text-pretty">
										Clinical records outside these departments stay hidden from this member.
									</span>
								</div>
								<RadioGroup
									aria-labelledby={`${formId}-departments`}
									value={selectedDepartments === null ? "all" : "selected"}
									onValueChange={(value) => setSelectedDepartments(value === "all" ? null : [])}
									className="gap-0"
								>
									<div className="flex items-center gap-3 py-1.5">
										<RadioGroupItem value="all" id={`${formId}-departments-all`} />
										<Label htmlFor={`${formId}-departments-all`} className="text-sm leading-5">
											All departments
										</Label>
									</div>
									<div className="flex items-center gap-3 py-1.5">
										<RadioGroupItem value="selected" id={`${formId}-departments-selected`} />
										<Label htmlFor={`${formId}-departments-selected`} className="text-sm leading-5">
											Only selected departments
										</Label>
									</div>
								</RadioGroup>
								{selectedDepartments ? (
									<div>
										<div
											role="group"
											aria-label="Selected departments"
											aria-describedby={
												isDepartmentMissing ? `${formId}-departments-error` : undefined
											}
											className={cn(
												"grid grid-cols-1 gap-x-4 rounded-lg bg-gray-50 px-4 py-3 sm:grid-cols-2",
												isDepartmentMissing && "ring-1 ring-destructive",
											)}
										>
											{encounterDepartments.map((department, departmentIndex) => (
												<div key={department} className="flex items-center gap-3 py-1.5">
													<Checkbox
														id={`${formId}-department-${departmentIndex}`}
														checked={selectedDepartments.includes(department)}
														onCheckedChange={(checked) =>
															setSelectedDepartments(
																checked === true
																	? [...selectedDepartments, department]
																	: selectedDepartments.filter((name) => name !== department),
															)
														}
													/>
													<Label
														htmlFor={`${formId}-department-${departmentIndex}`}
														className="text-sm leading-5"
													>
														{department}
													</Label>
												</div>
											))}
										</div>
										{isDepartmentMissing ? (
											<p
												id={`${formId}-departments-error`}
												className="mt-1.5 text-sm font-medium text-red-500"
											>
												Select at least one department.
											</p>
										) : null}
									</div>
								) : null}
							</div>

							<div className="flex flex-col gap-2 border-t border-gray-200 pt-5">
								<div className="flex flex-col gap-1 text-sm">
									<span className="font-medium text-gray-600">Permissions</span>
									<span className="text-gray-500 text-pretty">
										{selectedStaffTypeDetails
											? `${formatLabel(selectedStaffTypeDetails.value)} includes the first two. Add anything extra this member needs.`
											: "Pick a staff type to see which permissions come with it."}
									</span>
								</div>
								<div className="flex flex-col">
									{selectedStaffTypeDetails?.includedPermissions.map(
										(permission, permissionIndex) => (
											<div key={permission.label} className="flex items-start gap-3 py-1.5">
												<Checkbox
													id={`${formId}-included-${permissionIndex}`}
													checked
													disabled
													className="mt-0.5"
												/>
												<Label
													htmlFor={`${formId}-included-${permissionIndex}`}
													className="flex-1 flex-col items-start gap-1 text-sm leading-5"
												>
													{permission.label}
													<span className="font-normal text-gray-500">
														{permission.description}
													</span>
												</Label>
												<span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
													Included
												</span>
											</div>
										),
									)}
									{extraPermissions.map((permission) => (
										<div key={permission.value} className="flex items-start gap-3 py-1.5">
											<Checkbox
												id={`${formId}-permission-${permission.value}`}
												checked={selectedPermissions.includes(permission.value)}
												onCheckedChange={(checked) =>
													setSelectedPermissions((prev) =>
														checked === true
															? [...prev, permission.value]
															: prev.filter((value) => value !== permission.value),
													)
												}
												className="mt-0.5"
											/>
											<Label
												htmlFor={`${formId}-permission-${permission.value}`}
												className="flex-col items-start gap-1 text-sm leading-5"
											>
												{permission.label}
												<span className="font-normal text-gray-500">{permission.description}</span>
											</Label>
										</div>
									))}
								</div>
							</div>

							<div className="flex flex-col gap-2 border-t border-gray-200 pt-5">
								<div className="flex flex-col gap-1 text-sm">
									<span className="font-medium text-gray-600">MCP connections</span>
									<span className="text-gray-500 text-pretty">
										Let this member connect AI tools, such as Claude, to Medibridge. A connection
										can never do more than the member who made it.
									</span>
								</div>
								<div className="flex items-center gap-3 py-1.5">
									<Checkbox
										id={`${formId}-mcp-allowed`}
										checked={isMcpAllowed}
										onCheckedChange={(checked) => setIsMcpAllowed(checked === true)}
									/>
									<Label htmlFor={`${formId}-mcp-allowed`} className="text-sm leading-5">
										Allow MCP connections
									</Label>
								</div>
								{isMcpAllowed ? (
									<div
										role="group"
										aria-labelledby={`${formId}-mcp-scopes`}
										className="flex flex-col rounded-lg bg-gray-50 px-4 py-3"
									>
										<span
											id={`${formId}-mcp-scopes`}
											className="pb-1 text-sm font-medium text-gray-600"
										>
											What connections can do
										</span>
										{mcpScopes.map((scope) => (
											<div key={scope.value} className="flex items-center gap-3 py-1.5">
												<Checkbox
													id={`${formId}-mcp-${scope.value}`}
													checked={selectedMcpScopes.includes(scope.value)}
													onCheckedChange={(checked) =>
														setSelectedMcpScopes((prev) =>
															checked === true
																? [...prev, scope.value]
																: prev.filter((value) => value !== scope.value),
														)
													}
												/>
												<Label
													htmlFor={`${formId}-mcp-${scope.value}`}
													className="text-sm leading-5"
												>
													{scope.label}
												</Label>
											</div>
										))}
									</div>
								) : null}
							</div>
						</>
					) : null}
				</form>
				<DialogFooter className="sm:justify-end">
					<DialogClose asChild>
						<Button type="button" variant="outline">
							Cancel
						</Button>
					</DialogClose>
					<Button type="submit" form={formId}>
						Save access
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
