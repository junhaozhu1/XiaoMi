import { NextResponse } from "next/server";

export async function GET(request) {
  const base = process.env.NEST_API_BASE_URL || "http://localhost:4100";
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  const upstreamUrl = `${base}/companies${qs ? `?${qs}` : ""}`;

  console.log("[api/companies] upstreamUrl =", upstreamUrl);

  // 从请求头获取 Authorization
  const authHeader = request.headers.get('authorization');
  
  const headers = {};
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  const res = await fetch(upstreamUrl, { 
    cache: "no-store",
    headers 
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return NextResponse.json(
      { message: "Upstream Nest API error", status: res.status, detail, upstreamUrl },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}