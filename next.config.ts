import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactCompiler: false,
	cacheComponents: true,
	partialPrefetching: true,
	logging: { fetches: { fullUrl: true } },
	serverExternalPackages: ["tesseract.js", "pdf-parse", "mammoth"],
	experimental: {
		cachedNavigations: true,
		turbopackFileSystemCacheForDev: true,
		turbopackFileSystemCacheForBuild: true,

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
