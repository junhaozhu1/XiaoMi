import { NextResponse } from "next/server";

export async function GET(request) {
  const base = process.env.NEST_API_BASE_URL || "http://localhost:3001";
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  const upstreamUrl = `${base}/companies${qs ? `?${qs}` : ""}`;

  console.log("[api/companies] upstreamUrl =", upstreamUrl); 

  const res = await fetch(upstreamUrl, { cache: "no-store" });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return NextResponse.json(
      { message: "Upstream Nest API error", status: res.status, detail, upstreamUrl },
      { status: 500 }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}