// 用于发送带认证的请求
export async function authFetch(url, options = {}) {
  // 从 localStorage 获取 token
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  
  const headers = {
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // 保留 cookie 支持
  });
}

// 登录函数
export async function login(email, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Login failed');
  }

  const data = await res.json();
  
  // 保存 token 到 localStorage
  if (data.access_token) {
    localStorage.setItem('access_token', data.access_token);
  }
  
  return data;
}

// 登出函数
export function logout() {
  localStorage.removeItem('access_token');
  // 可选：调用后端登出接口清除 cookie
  fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });
}

// 检查是否已登录
export function isAuthenticated() {
  return typeof window !== 'undefined' && !!localStorage.getItem('access_token');
}