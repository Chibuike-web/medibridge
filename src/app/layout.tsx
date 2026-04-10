import type { Metadata } from "next";
import Script from "next/script";
import "@/styles/globals.css";
import { Providers } from "@/components/providers";
import { Agentation } from "agentation";

export const metadata: Metadata = {
	title: "MediBridge | Connect Hospitals Seamlessly",
	description:
		"Securely connect your healthcare institution to the MediBridge network. Enable fast, interoperable patient data sharing and modernize your hospital operations.",
};
export default function RootLayout({
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
				<Providers>{children}</Providers>
				{process.env.NODE_ENV === "development" && <Agentation />}
			</body>
		</html>
	);
}
