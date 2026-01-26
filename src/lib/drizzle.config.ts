import { defineConfig } from "drizzle-kit";
import { ENV } from "./utils/env";

export default defineConfig({
	schema: "./src/db/auth-schema.ts",
	out: "./src/db/drizzle/migrations",
	dialect: "postgresql",
	dbCredentials: { url: ENV.DATABASE_URL! },
});
