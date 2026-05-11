import { getPool } from "@/lib/db";
import { requireMe } from "@/lib/auth";

export async function GET(req) {
  const { me, error } = await requireMe(req);
  if (error) return error;

  // if (me.role !== "admin" && me.role !== "manager") {
  //   return Response.json({ message: "无权限" }, { status: 403 });
  // }

  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT id, email, name, role, title, status, location, company, bio, created_at
     FROM users
     ORDER BY id DESC`
  );

  return Response.json({ users: rows });
}

export async function POST(req) {
  const { me, error } = await requireMe(req);
  if (error) return error;

  if (me.role !== "admin" && me.role !== "manager") {
    return Response.json({ message: "无权限" }, { status: 403 });
  }

  const body = await req.json();
  const email = (body.email || "").trim().toLowerCase();
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : null;
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 100) : null;
  const status = body.status || "active";
  const role = body.role || "user";

  // manager 只能创建 user
  if (me.role === "manager" && role !== "user") {
    return Response.json({ message: "manager 只能创建 role=user 的用户" }, { status: 403 });
  }

  if (!email) return Response.json({ message: "email 不能为空" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ message: "email 格式不正确" }, { status: 400 });
  }

  const pool = getPool();

  const password = body.password;
  if (!password) {
    return Response.json({ message: "需要提供初始密码 password" }, { status: 400 });
  }

  // 简单校验（和 signup 规则一致：字母数字>=8且包含字母数字）
  if (!/^[A-Za-z\d]+$/.test(password) || !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password)) {
    return Response.json({ message: "password 不符合规则" }, { status: 400 });
  }

  const bcrypt = (await import("bcrypt")).default;
  const hash = await bcrypt.hash(password, 10);

  try {
    const [ret] = await pool.query(
      `INSERT INTO users (email, password_hash, name, title, role, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email, hash, name, title, role, status]
    );

    const [rows] = await pool.query(
      `SELECT id, email, name, role, title, status, location, company, bio, created_at
       FROM users WHERE id = ?`,
      [ret.insertId]
    );

    return Response.json({ user: rows[0] }, { status: 201 });
  } catch (e) {
    // 处理重复邮箱
    if (String(e?.code) === "ER_DUP_ENTRY") {
      return Response.json({ message: "该邮箱已存在" }, { status: 409 });
    }
    console.error("CREATE USER ERROR:", e);
    return Response.json({ message: "服务器错误" }, { status: 500 });
  }
}