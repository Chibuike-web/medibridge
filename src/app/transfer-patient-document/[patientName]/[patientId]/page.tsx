import { DownloadPdfButton } from "@/features/transfers/document/download-pdf-button";
import { getTransferPacket } from "@/features/transfers/document/get-transfer-packet";

export default async function TransferPatientDocumentPage({
	params,
}: {
	params: Promise<{ patientName: string; patientId: string }>;
}) {
	const { patientName, patientId } = await params;
	const packet = await getTransferPacket({ patientId, patientName });

	return (
		<main className="mx-auto my-12 flex w-full max-w-4xl flex-col gap-9 px-6 md:px-0">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<p className="text-sm font-medium uppercase tracking-[0.12em] text-gray-500">
						Patient Transfer Document
					</p>
					<h1 className="mt-2 text-2xl font-semibold text-gray-950">{packet.patientName}</h1>
					<p className="mt-1 text-sm text-gray-600">Patient ID: {packet.patientId}</p>
				</div>
				<DownloadPdfButton packet={packet} />
			</div>

			<section className="rounded-3xl border border-gray-200 bg-white px-6 py-8 shadow-sm">
				<div className="grid gap-6 md:grid-cols-2">
					<section className="rounded-2xl bg-gray-50 px-5 py-4">
						<h2 className="text-sm font-semibold text-gray-800">Receiving hospital</h2>
						<p className="mt-3 text-sm text-gray-700">
							<span className="font-medium">Name:</span> {packet.receivingHospitalName}
						</p>
						<p className="mt-2 text-sm text-gray-700">
							<span className="font-medium">Email:</span> {packet.receivingHospitalEmail}
						</p>
					</section>

					<section className="rounded-2xl bg-gray-50 px-5 py-4">
						<h2 className="text-sm font-semibold text-gray-800">Transfer note</h2>
						<p className="mt-3 text-sm leading-6 text-gray-700">{packet.transferNote}</p>
					</section>
				</div>

				<section className="mt-8">
					<h2 className="text-sm font-semibold text-gray-800">Selected clinical records</h2>
					<div className="mt-4 overflow-hidden rounded-2xl border border-gray-200">
						<table className="w-full border-collapse text-left text-sm">
							<thead className="bg-gray-50 text-gray-600">
								<tr>
									<th className="px-4 py-3 font-medium">Record</th>
									<th className="px-4 py-3 font-medium">Status</th>
								</tr>
							</thead>
							<tbody>
								{packet.records.map((record) => (
									<tr key={record.id} className="border-t border-gray-200">
										<td className="px-4 py-3 text-gray-800">{record.label}</td>
										<td className="px-4 py-3 text-gray-600">{record.status}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</section>
			</section>
		</main>
	);
}
