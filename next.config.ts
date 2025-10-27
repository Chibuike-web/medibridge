import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactCompiler: true,
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
