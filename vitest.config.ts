import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		tsconfigPaths: true,
		alias: {
			"server-only": fileURLToPath(
				new URL("./node_modules/next/dist/compiled/server-only/empty.js", import.meta.url),
			),
		},
	},
	test: {
		environment: "jsdom",
		maxWorkers: 2,
		clearMocks: true,
		setupFiles: ["./vitest.setup.ts"],
	},
});
