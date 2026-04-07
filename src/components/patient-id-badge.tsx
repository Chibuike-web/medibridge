import { RiFileCopyLine } from "@remixicon/react";

type PatientIdBadgeProps = {
	patientId: string;
};

export function PatientIdBadge({ patientId }: PatientIdBadgeProps) {
	return (
		<div className="flex w-max items-center gap-[6px] rounded-[6px] border border-gray-200 bg-gray-100 p-1">
			<span className="font-medium">{patientId}</span>
			<RiFileCopyLine className="size-4 text-gray-600" />
		</div>
	);
}
