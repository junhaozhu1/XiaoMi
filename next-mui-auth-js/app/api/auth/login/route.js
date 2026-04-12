// import bcrypt from "bcrypt";
// import { getPool } from "@/lib/db";
// import { cookies } from "next/headers";

// export async function POST(req) {
//   try {
//     const { email, password } = await req.json();

//     if (!email || !password) {
//       return Response.json({ message: "Email/Password 不能为空" }, { status: 400 });
//     }

//     const pool = getPool();

//     const [rows] = await pool.query(
//       "SELECT id, email, password_hash FROM users WHERE email = ?",
//       [email]
//     );

//     if (rows.length === 0) {
//       return Response.json({ message: "用户邮箱不存在" }, { status: 404 });
//     }

//     const user = rows[0];
//     const ok = await bcrypt.compare(password, user.password_hash);

//     if (!ok) {
//       return Response.json({ message: "密码错误" }, { status: 401 });
//     }

//     // 写 cookie：用于“最简单鉴权”
//     const cookieStore = await cookies();
//     cookieStore.set("uid", String(user.id), {
//       httpOnly: true,
//       sameSite: "lax",
//       path: "/",
//       // 本地开发先不加 secure；上线再根据 https 设置
//       secure: process.env.NODE_ENV === "production",
//       maxAge: 60 * 60 * 24 * 7, // 7天
//     });

//     return Response.json({ message: "登录成功", user: { id: user.id, email: user.email } });
//   } catch (e) {
//     return Response.json(
//       { message: "服务器错误", error: String(e?.message || e) },
//       { status: 500 }
//     );
//   }
// }

import { proxyToBackend } from "@/lib/proxy";

export async function POST(req) {
  return proxyToBackend("/login", req);
}