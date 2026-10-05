import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

const databaseTests = "tests/integration/db/**/*.test.ts";

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
		projects: [
			{
				extends: true,
				test: {
					name: "unit",
					exclude: [...configDefaults.exclude, databaseTests],
				},
			},
			{
				extends: true,
				test: {
					name: "database",
					include: [databaseTests],
					// These files share one test database, so run them one at a time.
					fileParallelism: false,
				},
			},
		],
	},
});
