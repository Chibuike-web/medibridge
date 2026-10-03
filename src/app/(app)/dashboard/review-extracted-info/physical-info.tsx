"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PatientRecord } from "@/features/patients/schemas/patient-schema";
import { cn } from "@/lib/utils/cn";
import { useId, useState } from "react";
import type { SubmitEvent } from "react";

const physicalInfoFields = [
	{ key: "height", label: "Height", type: "text" },
	{ key: "weight", label: "Weight", type: "text" },
	{ key: "bloodGroup", label: "Blood group", type: "text" },
	{ key: "genotype", label: "Genotype", type: "text" },
] as const;

export function PhysicalInfo({
	physicalInfo,
	onSave,
}: {
	physicalInfo: PatientRecord["physicalInfo"];
	onSave: (physicalInfo: PatientRecord["physicalInfo"]) => void;
}) {
	const sectionId = useId();
	const [editingField, setEditingField] = useState<keyof PatientRecord["physicalInfo"] | null>(
		null,
	);
	const [draftValue, setDraftValue] = useState("");

	function handleSave(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		if (editingField === null) return;

		onSave({ ...physicalInfo, [editingField]: draftValue });
		setEditingField(null);
		setDraftValue("");
	}

	function handleCancel() {
		setEditingField(null);
		setDraftValue("");
	}

	return (
		<section aria-labelledby={sectionId} className="flex flex-col gap-4">
			<h2 id={sectionId} className="text-sm font-semibold tracking-[-0.02em]">
				Physical Info
			</h2>
			<div className="flex flex-col gap-6">
				{physicalInfoFields.map((field) => {
					const value = physicalInfo[field.key];
					const isEditing = editingField === field.key;
					const fieldId = `${sectionId}-${field.key}`;

					return (
						<form
							key={field.key}
							onSubmit={handleSave}
							className={cn(
								"flex justify-between text-sm",
								isEditing && "flex-col md:flex-row md:items-end gap-2",
							)}
						>
							<div className="flex flex-col gap-4">
								{isEditing ? (
									<>
										<label htmlFor={fieldId} className="text-gray-400 no-line-height">
											{field.label}
										</label>
										<Input
											autoFocus
											id={fieldId}
											type={field.type}
											value={draftValue}
											onChange={(event) => setDraftValue(event.target.value)}
										/>
									</>
								) : (
									<>
										<span className="text-gray-400 no-line-height">{field.label}</span>
										<p className="no-line-height">
											{value === null || value === "" ? "--" : value}
										</p>
									</>
								)}
							</div>
							{isEditing ? (
								<div className="flex gap-2 self-end">
									<Button type="button" variant="outline" onClick={handleCancel}>
										Cancel
									</Button>
									<Button type="submit">Save</Button>
								</div>
							) : (
								<Button
									type="button"
									variant="ghost"
									aria-label={`Edit ${field.label}`}
									className="h-max py-0 hover:bg-transparent px-0 hover:text-gray-900"
									onClick={() => {
										setEditingField(field.key);
										setDraftValue(value === null ? "" : String(value));
									}}
								>
									Edit
								</Button>
							)}
						</form>
					);
				})}
			</div>
		</section>
	);
}
