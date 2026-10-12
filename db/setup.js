import pg from "pg";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const database = process.env.PGDATABASE || "BlogDB";

async function createDatabaseIfMissing() {
  const admin = new pg.Client({ database: "postgres" });
  await admin.connect();
  try {
    const { rowCount } = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [database]);
    if (rowCount === 0) {
      await admin.query(`CREATE DATABASE ${pg.escapeIdentifier(database)}`);
      console.log(`Created database ${database}`);
    }
  } finally {
    await admin.end();
  }
}

async function loadTables() {
  const client = new pg.Client({ database });
  await client.connect();
  try {
    for (const file of ["schema.sql", "seed.sql"]) {
      await client.query(await fs.readFile(path.join(__dirname, file), "utf8"));
      console.log(`Ran ${file}`);
    }
    const users = await client.query("SELECT COUNT(*) FROM users");
    const blogs = await client.query("SELECT COUNT(*) FROM blogs");
    console.log(`${database} ready: ${users.rows[0].count} users, ${blogs.rows[0].count} blogs`);
  } finally {
    await client.end();
  }
}

try {
  await createDatabaseIfMissing();
  await loadTables();
} catch (err) {
  console.error("Database setup failed:", err.message);
  process.exitCode = 1;
}
