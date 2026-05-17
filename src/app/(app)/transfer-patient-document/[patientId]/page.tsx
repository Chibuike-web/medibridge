import { getTransferPacket } from "@/features/transfers/document/get-transfer-packet";
import { DownloadPdfButtonClient } from "./download-pdf-button-client";
import { patients } from "@/features/transfers/data";

export const metadata = {
	title: "Transfer Patient Document",
};

function Field({ label, value }: { label: string; value: string | number | undefined }) {
	return (
		<div className="flex flex-col gap-1">
			<p className="text-sm text-gray-400">{label}</p>
			<p className="text-sm font-semibold text-gray-600">{value || "—"}</p>
		</div>
	);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section className="rounded-xl bg-gray-50 ring ring-gray-200">
			<div className="flex h-10 items-center px-4">
				<h2 className="text-lg font-semibold text-gray-600">{title}</h2>
			</div>

			<div className="grid gap-6 rounded-xl bg-white p-4 ring ring-gray-200 md:grid-cols-2 xl:grid-cols-3">
				{children}
			</div>
		</section>
	);
}

export default async function TransferPatientDocumentPage({
	params,
}: {
	params: Promise<{ patientId: string }>;
}) {
	const { patientId } = await params;

	const patient = patients.find((p) => p.patientId === patientId);

	const patientName = patient?.name ?? "Chibuike";

	const packet = await getTransferPacket({
		patientId,
		patientName,
	});

	return (
		<main className="mx-auto my-12 flex w-full max-w-7xl flex-col gap-8 px-6 xl:px-0">
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
				<div className="space-y-2">
					<h1 className="text-2xl font-semibold text-gray-800">{packet.patientName}</h1>

					<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
						<p>Patient ID: {packet.patientId}</p>

						<p>Date of Birth: {packet.personalInformation.dateOfBirth}</p>

						<p>Email: {packet.contactInformation.emailAddress}</p>

						<p>Phone: {packet.contactInformation.phoneNumber}</p>
					</div>
				</div>

				<DownloadPdfButtonClient packet={packet} />
			</div>

			<Section title="Receiving Hospital">
				<Field label="Hospital Name" value={packet.receivingHospitalName} />

				<Field label="Hospital Email" value={packet.receivingHospitalEmail} />

				<Field label="Transfer Note" value={packet.transferNote} />
			</Section>

			<div className="flex flex-col gap-6">
				<h2 className="text-[20px] font-semibold text-gray-800">Patient Details</h2>

				<Section title="Personal Information">
					<Field label="First Name" value={packet.personalInformation.firstName} />

					<Field label="Middle Name" value={packet.personalInformation.middleName} />

					<Field label="Last Name" value={packet.personalInformation.lastName} />

					<Field label="Patient ID" value={packet.personalInformation.patientId} />

					<Field label="Age" value={packet.personalInformation.age} />

					<Field label="Date of Birth" value={packet.personalInformation.dateOfBirth} />

					<Field label="Sex" value={packet.personalInformation.sex} />

					<Field label="Marital Status" value={packet.personalInformation.maritalStatus} />

					<Field label="National ID" value={packet.personalInformation.nationalId} />
				</Section>

				<Section title="Contact Information">
					<Field label="Phone Number" value={packet.contactInformation.phoneNumber} />

					<Field label="Email Address" value={packet.contactInformation.emailAddress} />

					<Field label="Residential Address" value={packet.contactInformation.residentialAddress} />

					<Field label="State of Origin" value={packet.contactInformation.stateOfOrigin} />

					<Field label="Country of Origin" value={packet.contactInformation.countryOfOrigin} />
				</Section>

				<Section title="Emergency Contact">
					<Field label="First Name" value={packet.emergencyContact.firstName} />

					<Field label="Middle Name" value={packet.emergencyContact.middleName} />

					<Field label="Last Name" value={packet.emergencyContact.lastName} />

					<Field label="Relationship" value={packet.emergencyContact.relationship} />

					<Field label="Phone Number" value={packet.emergencyContact.phoneNumber} />
				</Section>

				<Section title="Physical Information">
					<Field label="Height" value={packet.physicalInformation.height} />

					<Field label="Weight" value={packet.physicalInformation.weight} />

					<Field label="Blood Group" value={packet.physicalInformation.bloodGroup} />

					<Field label="Genotype" value={packet.physicalInformation.genotype} />
				</Section>
			</div>
		</main>
	);
}
