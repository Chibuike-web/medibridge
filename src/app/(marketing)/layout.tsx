import type { Metadata } from "next";
import Script from "next/script";
import { Shell } from "@/components/layout/shell";

export const metadata: Metadata = {
	metadataBase: new URL("https://medibridge.com"),
	title: {
		default: "MediBridge | Connect Hospitals Seamlessly",
		template: "%s | MediBridge",
	},
	description:
		"Securely connect your healthcare institution to the MediBridge network. Enable fast, interoperable patient data sharing and modernize your hospital operations.",

	openGraph: {
		title: "MediBridge | Connect Hospitals Seamlessly",
		description: "Securely connect your healthcare institution to the MediBridge network.",
		url: "https://medibridge.com",
		siteName: "MediBridge",
		type: "website",
	},

	twitter: {
		card: "summary_large_image",
		title: "MediBridge | Connect Hospitals Seamlessly",
		description: "Securely connect your healthcare institution to the MediBridge network.",
	},
};
export default function MarketingLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				{process.env.NODE_ENV === "development" && (
					<Script
						src="//unpkg.com/react-scan/dist/auto.global.js"
						crossOrigin="anonymous"
						strategy="beforeInteractive"
					/>
				)}
			</head>

			<body className="antialiased" suppressHydrationWarning>
				<Shell>{children}</Shell>
			</body>
		</html>
	);
}
