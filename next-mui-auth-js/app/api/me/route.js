import { proxyToBackend } from "@/lib/proxy";

export async function GET(req) {
  return proxyToBackend("/me", req);
}

export async function PATCH(req) {
  return proxyToBackend("/me", req);
}