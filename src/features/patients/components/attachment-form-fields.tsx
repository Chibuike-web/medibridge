"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RiCloseLine } from "@remixicon/react";

export type AttachmentFormRow = {
	id: string;
	name: string;
	recordId: string;
};

type AttachmentFormFieldsProps = {
	attachmentRow: AttachmentFormRow;
	attachmentIndex: number;
	fieldLabelClassName: string;
	requiredLabelClassName: string;
	fieldControlClassName: string;
	onRemoveAttachmentRow: (attachmentRowId: string) => void;
};

export function AttachmentFormFields({
	attachmentRow,
	attachmentIndex,
	fieldLabelClassName,
	requiredLabelClassName,
	fieldControlClassName,
	onRemoveAttachmentRow,
}: AttachmentFormFieldsProps) {
	return (
		<div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
			<div className="flex items-center justify-between gap-4 sm:col-span-2">
				<span className="text-base font-semibold text-gray-800">
					Related record {attachmentIndex + 1}
				</span>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					aria-label={`Remove related record ${attachmentIndex + 1}`}
					className="size-6 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center"
					onClick={() => onRemoveAttachmentRow(attachmentRow.id)}
				>
					<RiCloseLine className="size-4" aria-hidden="true" />
				</Button>
			</div>
			<div className="flex flex-col gap-2">
				<Label htmlFor={`${attachmentRow.id}-name`} className={fieldLabelClassName}>
					Record type<span className={requiredLabelClassName}>(required)</span>
				</Label>
				<Input
					id={`${attachmentRow.id}-name`}
					defaultValue={attachmentRow.name}
					required
					placeholder="e.g. Lab test, imaging, medication"
					className={fieldControlClassName}
				/>
			</div>
			<div className="flex flex-col gap-2">
				<Label htmlFor={`${attachmentRow.id}-id`} className={fieldLabelClassName}>
					Record ID<span className={requiredLabelClassName}>(required)</span>
				</Label>
				<Input
					id={`${attachmentRow.id}-id`}
					defaultValue={attachmentRow.recordId}
					required
					placeholder="e.g. LAB-2048, IMG-1032, MED-4821"
					className={fieldControlClassName}
				/>
			</div>
		</div>
	);
}
