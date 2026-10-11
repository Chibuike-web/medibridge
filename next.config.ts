import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactCompiler: true,
	cacheComponents: true,
	partialPrefetching: true,
	typedRoutes: true,
	logging: { fetches: { fullUrl: true } },
	serverExternalPackages: ["tesseract.js", "pdf-parse", "mammoth"],
	experimental: {
		turbopackRustReactCompiler: true,
		optimizePackageImports: [
			"@radix-ui/react-label",
			"@radix-ui/react-dropdown-menu",
			"@remixicon/react",
			"@radix-ui/react-popover",
			"@radix-ui/react-select",
			"@radix-ui/react-checkbox",
		],
	},
};

export default nextConfig;
