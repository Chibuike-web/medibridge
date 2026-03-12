import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactCompiler: false,
	logging: { fetches: { fullUrl: true } },
	serverExternalPackages: ["tesseract.js", "pdf-parse", "mammoth"],
	experimental: {
		turbopackFileSystemCacheForBuild: true,
	},
	reactStrictMode: true,
	typedRoutes: true,
};

export default nextConfig;
