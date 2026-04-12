const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4100';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include', // 关键：让浏览器收/发 cookie
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
}

export const backendApi = {
  signup: (payload) => request('/signup', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request('/logout', { method: 'POST' }),
  me: () => request('/me', { method: 'GET' }),
  updateMe: (payload) => request('/me', { method: 'PATCH', body: JSON.stringify(payload) }),
};