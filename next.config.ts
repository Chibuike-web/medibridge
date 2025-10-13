import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	experimental: {
		turbopackFileSystemCacheForDev: true,
		serverActions: {
			bodySizeLimit: "2mb",
		},
	},
};

export default nextConfig;
