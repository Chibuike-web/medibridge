import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactCompiler: false,
	cacheComponents: true,
	logging: {
		fetches: {
			fullUrl: true,
		},
	},
	experimental: {
		turbopackFileSystemCacheForDev: true,
	},
};

export default nextConfig;
