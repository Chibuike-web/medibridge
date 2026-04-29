import { EditPersonalInformation } from "./edit-personal-information";
import { EditContactInformation } from "./edit-contact-information";
import { EditEmergencyContact } from "./edit-emergency-contact";
import { EditPhysicalInformation } from "./edit-physical-information";

export function PatientDetailsSection({ patientId }: { patientId: string }) {
	void patientId;

	return (
		<div className="p-8">
			<div className="mx-auto max-w-7xl">
				<h1 className="mb-6 text-xl font-semibold text-gray-800">Patient Details</h1>
				<div className="flex flex-col gap-10">
					<EditPersonalInformation />
					<EditContactInformation />
					<EditEmergencyContact />
					<EditPhysicalInformation />
				</div>
			</div>
		</div>
	);
}
