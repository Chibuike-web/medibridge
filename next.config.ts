import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactCompiler: false,
	cacheComponents: true,
	logging: { fetches: { fullUrl: true } },
	serverExternalPackages: ["tesseract.js", "pdf-parse", "mammoth"],
	experimental: {
		turbopackFileSystemCacheForDev: true,
		turbopackFileSystemCacheForBuild: true,
		staleTimes: {
			dynamic: 60 * 60 * 24 * 30, // 30 days
			static: 60 * 60 * 24 * 30,
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
