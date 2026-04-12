import { getPool } from "@/lib/db";

function parseCookie(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;

  cookieHeader.split(";").forEach(part => {
    const [k, ...rest] = part.trim().split("=");
    if (!k) return;
    out[k] = decodeURIComponent(rest.join("="));
  });
  return out;
}

// 从 Route Handler 传入 req
export async function getMeOrNull(req) {
  const cookieHeader = req?.headers?.get?.("cookie") || "";
  const ck = parseCookie(cookieHeader);
  const uid = ck.uid;

  if (!uid) return null;

  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT id, email, name, role, title, status, location, company, bio, created_at FROM users WHERE id = ?",
    [uid]
  );
  return rows[0] || null;
}

export async function requireMe(req) {
  const me = await getMeOrNull(req);
  if (!me) {
    return { me: null, error: Response.json({ message: "未登录" }, { status: 401 }) };
  }
  return { me, error: null };
}

export function canManageTarget(me, targetUser) {
  if (!me) return false;
  if (me.role === "admin") return true;
  if (me.role === "manager") return targetUser.role === "user";
  return false;
}