import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	serverExternalPackages: [
		"zod",
		"uuid",
		"class-variance-authority",
		"clsx",
		"@hookform/resolvers",
	],
	reactStrictMode: true,
};

export default nextConfig;
