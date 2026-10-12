import pg from "pg";

// Host, port, user and password come from the PG* environment variables (see .env.example)
const pool = new pg.Pool({ database: process.env.PGDATABASE || "BlogDB" });

export default pool;
