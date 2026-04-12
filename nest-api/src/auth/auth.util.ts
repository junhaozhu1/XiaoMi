export function parseCookie(cookieHeader?: string) {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;

  cookieHeader.split(';').forEach((part) => {
    const [k, ...rest] = part.trim().split('=');
    if (!k) return;
    out[k] = decodeURIComponent(rest.join('='));
  });
  return out;
}

export function getUidFromRequest(req: any) {
  const cookieName = process.env.COOKIE_NAME || 'uid';
  const cookieHeader = req?.headers?.cookie || '';
  const ck = parseCookie(cookieHeader);
  return ck[cookieName] || null;
}