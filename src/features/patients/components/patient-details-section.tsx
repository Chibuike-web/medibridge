export function PatientDetailsSection({ patientId }: { patientId: string }) {
	return (
		<div>
			<PersonalInformation />
			<ContactInformation />
			<EmergencyContact />
			<PhysicalInformation />
		</div>
	);
}

function PersonalInformation() {
	return <div></div>;
}

function ContactInformation() {
	return <div></div>;
}

function EmergencyContact() {
	return <div></div>;
}

function PhysicalInformation() {
	return <div></div>;
}
