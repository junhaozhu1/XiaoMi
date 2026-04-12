const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4100";

export async function proxyToBackend(path, req) {
  // 拼上 query string
  const url = new URL(req.url);
  const upstreamUrl = `${API_BASE}${path}${url.search}`;

  // 读取 body（只在需要时）
  let body;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      body = JSON.stringify(await req.json());
    } else {
      body = await req.text();
    }
  }

  const upstream = await fetch(upstreamUrl, {
    method: req.method,
    headers: {
      // 透传 cookie 给 Nest
      cookie: req.headers.get("cookie") || "",
      // 透传 content-type（不要强行固定 json）
      ...(req.headers.get("content-type")
        ? { "Content-Type": req.headers.get("content-type") }
        : {}),
    },
    body,
    // 不需要 credentials：这是 server-to-server
  });

  const buf = await upstream.arrayBuffer();

  const res = new Response(buf, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "application/json",
    },
  });

  // 透传 Set-Cookie（兼容多条）
  // 在 Next/undici 环境中，headers.getSetCookie() 通常可用；不行再 fallback
  const h = upstream.headers;
  if (typeof h.getSetCookie === "function") {
    const cookies = h.getSetCookie();
    for (const c of cookies) res.headers.append("set-cookie", c);
  } else {
    const setCookie = h.get("set-cookie");
    if (setCookie) res.headers.set("set-cookie", setCookie);
  }

  return res;
}