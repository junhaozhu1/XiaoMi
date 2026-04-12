// import { cookies } from "next/headers";

// export async function POST() {
//   const cookieStore = await cookies();
//   cookieStore.set("uid", "", { path: "/", maxAge: 0 });
//   return Response.json({ message: "已退出" });
// }

import { proxyToBackend } from "@/lib/proxy";

export async function POST(req) {
  return proxyToBackend("/logout", req);
}