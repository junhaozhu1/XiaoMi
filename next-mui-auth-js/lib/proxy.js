export async function proxyToBackend(path, req) {
  const base = process.env.NEST_API_BASE_URL || "http://localhost:4100";
  const url = new URL(req.url);
  
  // 构建上游 URL
  const upstreamUrl = `${base}${path}${url.search}`;
  
  // 获取请求头
  const headers = {};
  
  // 转发 Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }
  
  // 转发 Cookie
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    headers['Cookie'] = cookieHeader;
  }
  
  // 转发 Content-Type
  const contentType = req.headers.get('content-type');
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  // 准备请求配置
  const config = {
    method: req.method,
    headers,
  };

  // 如果有 body，转发它
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    config.body = await req.text();
  }

  // 发送请求到后端
  const response = await fetch(upstreamUrl, config);
  
  // 获取响应数据
  const data = await response.text();
  
  // 创建响应
  const res = new Response(data, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      'Content-Type': response.headers.get('content-type') || 'application/json',
    },
  });

  // 转发 Set-Cookie header
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    res.headers.set('set-cookie', setCookie);
  }

  return res;
}