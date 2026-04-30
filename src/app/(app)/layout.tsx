import Script from "next/script";
import { DashboardAuth } from "@/components/layout/dashboard-auth";
import { Metadata } from "next";
import { Shell } from "@/components/layout/shell";

export const metadata: Metadata = {
	title: {
		default: "Dashboard | MediBridge",
		template: "%s | MediBridge",
	},
	description: "Manage your hospital operations on MediBridge.",

	robots: {
		index: false,
		follow: false,
	},
};

export default function AppLayout({
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
				<Shell>
					<DashboardAuth>{children}</DashboardAuth>
				</Shell>
			</body>
		</html>
	);
}
