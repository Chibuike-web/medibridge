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
		"Securely connect your healthcare institution to the MediBridge network. Enable fast, interoperable patient data sharing and modernize hospital operations.",

	keywords: [
		"electronic health records",
		"EHR Nigeria",
		"hospital data sharing",
		"healthcare interoperability",
		"patient record transfer",
		"medical software",
		"digital health platform",
	],

	authors: [{ name: "MediBridge Team" }],
	creator: "MediBridge",

	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},

	alternates: {
		canonical: "/",
	},

	icons: {
		icon: "/favicon.ico",
		shortcut: "/favicon-16x16.png",
		apple: "/apple-touch-icon.png",
	},

	openGraph: {
		title: "MediBridge | Connect Hospitals Seamlessly",
		description: "Securely connect your healthcare institution to the MediBridge network.",
		url: "https://medibridge.com",
		siteName: "MediBridge",
		images: [
			{
				url: "/og-image.png",
				width: 1200,
				height: 630,
				alt: "MediBridge Platform Preview",
			},
		],
		locale: "en_US",
		type: "website",
	},

	twitter: {
		card: "summary_large_image",
		title: "MediBridge | Connect Hospitals Seamlessly",
		description: "Securely connect your healthcare institution to the MediBridge network.",
		images: ["/og-image.png"],
	},

	manifest: "/site.webmanifest",
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
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

				{/* Structured Data (JSON-LD) */}
				<Script
					id="medibridge-structured-data"
					type="application/ld+json"
					strategy="afterInteractive"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify({
							"@context": "https://schema.org",
							"@type": "Organization",
							name: "MediBridge",
							url: "https://medibridge.com",
							logo: "https://medibridge.com/logo.png",
							description: "Secure hospital data sharing and interoperability platform.",
							sameAs: ["https://twitter.com/medibridge", "https://linkedin.com/company/medibridge"],
						}),
					}}
				/>
			</head>

			<body className="antialiased" suppressHydrationWarning>
				<Shell>{children}</Shell>
			</body>
		</html>
	);
}
