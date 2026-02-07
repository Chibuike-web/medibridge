import { defineConfig } from "drizzle-kit";
import { ENV } from "./utils/env";

export default defineConfig({
	schema: [
		"./src/db/schemas/auth/*",
		"./src/db/schemas/hospital/*",
		"./src/db/schemas/patient/*",
	],
	out: "./src/db/drizzle/migrations",
	dialect: "postgresql",
	dbCredentials: { url: ENV.DATABASE_URL! },
});
