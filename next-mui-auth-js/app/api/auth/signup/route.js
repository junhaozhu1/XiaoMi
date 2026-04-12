// import bcrypt from "bcrypt";
// import { getPool } from "@/lib/db";

// function isValidEmail(email) {
//   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
// }
// function isValidPassword(pw) {
//   return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(pw);
// }

// export async function POST(req) {
//   try {
//     const { email, password, name, title } = await req.json();

//     if (!email || !password) {
//       return Response.json({ message: "Email/Password 不能为空" }, { status: 400 });
//     }
//     if (!isValidEmail(email)) {
//       return Response.json({ message: "Email 格式不正确" }, { status: 400 });
//     }
//     if (!isValidPassword(password)) {
//       return Response.json({ message: "密码至少8位，且包含字母和数字" }, { status: 400 });
//     }

//     // name/title 可选；如果你想 name 必填，把这里改成强校验即可
//     const safeName = typeof name === "string" ? name.trim().slice(0, 100) : null;
//     const safeTitle = typeof title === "string" ? title.trim().slice(0, 100) : null;

//     const pool = getPool();

//     // 查重
//     const [exists] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
//     if (exists.length > 0) {
//       return Response.json({ message: "该邮箱已注册" }, { status: 409 });
//     }

//     const hash = await bcrypt.hash(password, 10);

//     await pool.query(
//       `INSERT INTO users (email, password_hash, name, title, role, status)
//        VALUES (?, ?, ?, ?, 'user', 'active')`,
//       [email, hash, safeName, safeTitle]
//     );

//     return Response.json({ message: "注册成功" }, { status: 201 });
//   } catch (e) {
//     console.error("SIGNUP ERROR:", e);
//     return Response.json(
//       { message: "服务器错误", error: String(e?.message || e) },
//       { status: 500 }
//     );
//   }
// }

import { proxyToBackend } from "@/lib/proxy";

export async function POST(req) {
  return proxyToBackend("/signup", req);
}