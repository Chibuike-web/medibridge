import type { Metadata } from "next";
import Script from "next/script";
import { Agentation } from "agentation";
import "@/styles/globals.css";
import { Providers } from "@/components/providers";

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

				{process.env.NODE_ENV === "development" && (
					<Script
						src="//unpkg.com/react-grab/dist/index.global.js"
						crossOrigin="anonymous"
						strategy="beforeInteractive"
					/>
				)}
			</head>
			<body className="antialiased" suppressHydrationWarning>
				<Providers>
					{children}
					{process.env.NODE_ENV === "development" && <Agentation />}
				</Providers>
			</body>
		</html>
	);
}
