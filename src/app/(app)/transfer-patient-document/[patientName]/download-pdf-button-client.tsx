"use client";

import type { TransferPacket } from "@/features/transfers/document/types";
import dynamic from "next/dynamic";

const DownloadPdfButton = dynamic(
	() => import("@/features/transfers/document/download-pdf-button"),
	{
		ssr: false,
		loading: () => (
			<button className="inline-flex h-11 items-center justify-center rounded-lg bg-gray-800 px-5 text-sm font-medium text-white">
				Download PDF
			</button>
		),
	},
);

export function DownloadPdfButtonClient({ packet }: { packet: TransferPacket }) {
	return <DownloadPdfButton packet={packet} />;
}
