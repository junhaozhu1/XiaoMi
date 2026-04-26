import { proxyToBackend } from "@/lib/proxy";

export async function POST(req) {
  return proxyToBackend("/login", req);
}