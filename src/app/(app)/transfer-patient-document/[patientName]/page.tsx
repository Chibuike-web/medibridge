import { getTransferPacket } from "@/features/transfers/document/get-transfer-packet";
import { DownloadPdfButtonClient } from "./download-pdf-button-client";

export const metadata = {
	title: "Transfer Patient Document",
};

export default async function TransferPatientDocumentPage({
	params,
	searchParams,
}: {
	params: Promise<{ patientName: string }>;
	searchParams: Promise<{ patientId: string }>;
}) {
	const { patientName } = await params;
	const { patientId } = await searchParams;
	const packet = await getTransferPacket({ patientId, patientName });

	return (
		<main className="mx-auto my-12 flex w-full max-w-4xl flex-col gap-9 px-6 md:px-0">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="mt-2 text-2xl font-semibold text-gray-800">{packet.patientName}</h1>
					<p className="mt-1 text-sm text-gray-600">Patient ID: {packet.patientId}</p>
				</div>
				<DownloadPdfButtonClient packet={packet} />
			</div>

			{/* Receiving Hospital */}
			<section className="rounded-xl bg-gray-50 ring ring-gray-200">
				<div className="px-4 h-10 flex items-center ">
					<h2 className="text-lg font-semibold text-gray-600">Receiving Hospital</h2>
				</div>

				<div className="grid gap-6 rounded-xl bg-white p-4 ring ring-gray-200 md:grid-cols-2">
					<div className="space-y-1">
						<p className="text-sm text-gray-400">Name</p>
						<p className="text-sm font-semibold text-gray-600">{packet.receivingHospitalName}</p>
					</div>

					<div className="space-y-1">
						<p className="text-sm text-gray-400">Email</p>
						<p className="text-sm font-semibold text-gray-600">{packet.receivingHospitalEmail}</p>
					</div>
				</div>
			</section>

			{/* Transfer Note */}
			<section className="rounded-xl bg-gray-50 ring ring-gray-200">
				<div className="px-4 h-10 flex items-center ">
					<h2 className="text-lg font-semibold text-gray-600">Transfer Note</h2>
				</div>

				<div className="rounded-xl bg-white p-4 ring ring-gray-200">
					<p className="text-sm text-gray-700 leading-6">{packet.transferNote}</p>
				</div>
			</section>

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
