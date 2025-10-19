import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactCompiler: true,
	experimental: {
		turbopackFileSystemCacheForDev: true,
		serverActions: {
			bodySizeLimit: "2mb",
		},
	},
};

export default nextConfig;
