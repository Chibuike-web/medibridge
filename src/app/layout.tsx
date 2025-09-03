import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Medibridge",
	description: "Securely connect your institution to the MediBridge network.",
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
