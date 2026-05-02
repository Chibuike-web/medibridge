import { ContactInformation } from "./contact-information";
import { EmergencyContact } from "./emergency-contact";
import { PersonalInformation } from "./personal-information";
import { PhysicalInformation } from "./physical-information";

export function PatientDetailsSection({ patientId }: { patientId: string }) {
	void patientId;

	return (
		<div className="p-8">
			<div className="mx-auto max-w-7xl">
				<h1 className="mb-6 text-xl font-semibold text-gray-800">Patient Details</h1>
				<div className="flex flex-col gap-10">
					<PersonalInformation />
					<ContactInformation />
					<EmergencyContact />
					<PhysicalInformation />
				</div>
			</div>
		</div>
	);
}
