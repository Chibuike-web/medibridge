import { getPatientProfile } from "@/lib/api/get-patient-profile";
import { notFound } from "next/navigation";
import { ContactInformation } from "./contact-information";
import { EmergencyContact } from "./emergency-contact";
import { PersonalInformation } from "./personal-information";
import { PhysicalInformation } from "./physical-information";

export async function PatientDetailsSection({ patientId }: { patientId: string }) {
	const profile = await getPatientProfile(patientId);

	if (!profile) {
		notFound();
	}

	return (
		<div className="p-8">
			<div className="mx-auto max-w-7xl">
				<h1 className="mb-6 text-xl font-semibold text-gray-800">Patient Details</h1>
				<div className="flex flex-col gap-10">
					<PersonalInformation personalInformation={profile.personalInformation} />
					<ContactInformation contactInformation={profile.contactInformation} />
					<EmergencyContact emergencyContact={profile.emergencyContact} />
					<PhysicalInformation physicalInformation={profile.physicalInformation} />
				</div>
			</div>
		</div>
	);
}
