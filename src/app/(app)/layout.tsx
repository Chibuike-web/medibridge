import { Metadata } from "next";
import { Shell } from "@/components/layout/shell";

export const metadata: Metadata = {
	title: {
		default: "Dashboard | Medibridge",
		template: "%s | Medibridge",
	},
	description: "Manage your hospital operations on Medibridge.",
	robots: { index: false, follow: false },
};

export default function AppLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className="antialiased" suppressHydrationWarning>
				<Shell>{children}</Shell>
			</body>
		</html>
	);
}
