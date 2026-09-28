import { config } from "dotenv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

config({ path: ".env.local", quiet: true });

export const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
	console.warn("TEST_DATABASE_URL is not set, so tests that need a real database are skipped.");
}

// Points the app's database client at the test database.
// Call it before importing any app module that creates the `db` client.
export function useTestDatabase() {
	if (!testDatabaseUrl) {
		throw new Error("TEST_DATABASE_URL is not set.");
	}
	if (testDatabaseUrl === process.env.DATABASE_URL) {
		throw new Error("TEST_DATABASE_URL must point to a separate database, not DATABASE_URL.");
	}

	process.env.DATABASE_URL = testDatabaseUrl;
}

export async function migrateTestDatabase() {
	const sql = postgres(testDatabaseUrl!, { max: 1, onnotice: () => {} });

	try {
		await migrate(drizzle({ client: sql }), { migrationsFolder: "./src/db/drizzle/migrations" });
	} finally {
		await sql.end();
	}
}

// Empties every app table so each test starts from the rows it seeds.
export async function resetTestDatabase() {
	const sql = postgres(testDatabaseUrl!, { max: 1, onnotice: () => {} });

	try {
		const tables = await sql<{ tableName: string }[]>`
			select table_name as "tableName" from information_schema.tables
			where table_schema = 'public' and table_type = 'BASE TABLE'
		`;
		if (tables.length === 0) return;

		const tableList = tables.map(({ tableName }) => `"public"."${tableName}"`).join(", ");
		await sql.unsafe(`truncate table ${tableList} restart identity cascade`);
	} finally {
		await sql.end();
	}
}
