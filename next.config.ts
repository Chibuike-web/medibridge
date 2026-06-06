import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactCompiler: false,
	logging: { fetches: { fullUrl: true } },
	serverExternalPackages: ["tesseract.js", "pdf-parse", "mammoth"],
	experimental: {
		turbopackFileSystemCacheForBuild: true,
		staleTimes: {
			dynamic: 300,
			static: 300,
		},
		optimizePackageImports: [
			"@radix-ui/react-label",
			"@radix-ui/react-dropdown-menu",
			"@remixicon/react",
			"@radix-ui/react-popover",
			"@radix-ui/react-select",
			"@radix-ui/react-checkbox",
		],
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	reactStrictMode: true,
	typedRoutes: true,
};

export default nextConfig;
