import { getPool } from "@/lib/db";

export async function GET() {
  try {
    const pool = getPool();
    const [rows] = await pool.query("SELECT 1 AS ok");
    return Response.json({ message: "db ok", rows });
  } catch (e) {
    return Response.json(
      { message: "db error", error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

// http://localhost:3000/api/health/db