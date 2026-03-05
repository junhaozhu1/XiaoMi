import bcrypt from "bcrypt";
import { getPool } from "@/lib/db";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 示例规则：>= 8 位，至少 1 个字母 + 1 个数字
function isValidPassword(pw) {
  return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(pw);
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
    if (!isValidPassword(password)) {
      return Response.json(
        { message: "密码至少8位，且包含字母和数字（仅允许字母数字）" },
        { status: 400 }
      );
    }

    const pool = getPool();

    const [rows] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (rows.length > 0) {
      return Response.json({ message: "该邮箱已注册" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query("INSERT INTO users (email, password_hash) VALUES (?, ?)", [
      email,
      passwordHash,
    ]);

    return Response.json({ message: "注册成功" }, { status: 201 });
  } catch (e) {
    return Response.json({ message: "服务器错误" }, { status: 500 });
  }
}