"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { TransferPatientDocumentPdf } from "./transfer-patient-document-pdf";
import { TransferPacket } from "./types";

export default function DownloadPdfButton({ packet }: { packet: TransferPacket }) {
	return (
		<PDFDownloadLink
			key={JSON.stringify(packet)}
			document={<TransferPatientDocumentPdf packet={packet} />}
			fileName={`${packet.patientName.toLowerCase().replace(/\s+/g, "-")}-${packet.patientId}.pdf`}
			className="inline-flex h-11 items-center shrink-0 justify-center rounded-lg bg-gray-900 px-5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
		>
			{({ loading }) => (loading ? "Preparing PDF..." : "Download PDF")}
		</PDFDownloadLink>
	);
}
