import type { Metadata } from "next";
import "./globals.css";

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
		<html lang="en">
			<body className="antialiased">{children}</body>
		</html>
	);
}
