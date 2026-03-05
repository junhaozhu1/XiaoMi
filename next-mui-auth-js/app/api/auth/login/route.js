import bcrypt from "bcrypt";
import { getPool } from "@/lib/db";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ message: "Email/Password 不能为空" }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return Response.json({ message: "Email 格式不正确" }, { status: 400 });
    }

    const pool = getPool();
    const [rows] = await pool.query(
      "SELECT id, email, password_hash FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return Response.json({ message: "用户邮箱不存在" }, { status: 404 });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);

    if (!ok) {
      return Response.json({ message: "密码错误" }, { status: 401 });
    }

    return Response.json({ message: "登录成功", user: { id: user.id, email: user.email } });
  } catch (e) {
    return Response.json({ message: "服务器错误" }, { status: 500 });
  }
}