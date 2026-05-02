import { getTransferPacket } from "@/features/transfers/document/get-transfer-packet";
import { DownloadPdfButtonClient } from "./download-pdf-button-client";
import { patients } from "@/features/transfers/data";

export const metadata = {
	title: "Transfer Patient Document",
};

export default async function TransferPatientDocumentPage({
	params,
}: {
	params: Promise<{ patientId: string }>;
}) {
	const { patientId } = await params;

	const patient = patients.find((p) => p.patientId === patientId);
	const patientName = patient?.name ?? "Chibuike";
	const packet = await getTransferPacket({ patientId, patientName });

	return (
		<main className="mx-auto my-12 flex w-full max-w-7xl flex-col gap-9 px-6 xl:px-0">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="mt-2 text-2xl font-semibold text-gray-800">{packet.patientName}</h1>
					<div className="flex items-center gap-2">
						<p className="text-sm text-gray-600">Patient ID: {packet.patientId}</p>
						<p className="text-sm text-gray-600">Patient ID: {packet.patientId}</p>

						<p className="text-sm text-gray-600">Patient ID: {packet.patientId}</p>

						<p className="text-sm text-gray-600">Patient ID: {packet.patientId}</p>

						<p className="text-sm text-gray-600">Patient ID: {packet.patientId}</p>
					</div>
				</div>
				<DownloadPdfButtonClient packet={packet} />
			</div>

			<div className="flex gap-6">
				{/* Receiving Hospital */}
				<div className="rounded-xl bg-gray-50 ring ring-gray-200 w-full">
					<div className="p-4">
						<h2 className="font-semibold text-lg text-gray-600 no-line-height">
							Receiving Hospital
						</h2>
					</div>

					<div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-6 rounded-xl bg-white p-4 ring ring-gray-200 w-full">
						{receivingHospitalFields.map((p) => (
							<div key={p.label} className="flex flex-col gap-1 w-full">
								<div className="text-sm text-gray-400">{p.label}</div>
								<div className="text-sm font-semibold text-gray-600">{p.value || "—"}</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Clinical Records */}
			<section className="rounded-xl bg-gray-50 ring ring-gray-200">
				<div className="px-4 h-10 flex items-center ">
					<h2 className="text-lg font-semibold text-gray-600">Clinical Records</h2>
				</div>

				<div className="grid gap-6 rounded-xl bg-white p-4 ring ring-gray-200 md:grid-cols-2">
					{packet.records.map((record) => (
						<div key={record.id} className="space-y-1">
							<p className="text-sm text-gray-400">{record.label}</p>
							<p className="text-sm font-semibold text-gray-600">{record.status}</p>
						</div>
					))}
				</div>
			</section>
		</main>
	);
}

const receivingHospitalFields = [
	{
		label: "Hospital name",
		value: "Enugu State Teaching Hospital",
	},
	{
		label: "Hospital Admin name",
		value: "Dr. Adebayo",
	},
	{
		label: "Hospital Admin email",
		value: "referrals@enuguteachinghospital.ng",
	},
	{
		label: "Transfer Note",
		value: "Urgent referral for specialist care",
	},
];
