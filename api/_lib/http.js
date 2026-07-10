export const sendJson = (res, statusCode, payload) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(statusCode).json(payload);
};

export const readJsonBody = async (req) => {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return {};
  }
};

const getHeader = (headers, name) => {
  const value = headers[name.toLowerCase()] || headers[name];
  return Array.isArray(value) ? value[0] : value;
};

export const getClientIp = (req) => {
  const forwardedFor = getHeader(req.headers, 'x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return (
    getHeader(req.headers, 'x-real-ip') ||
    getHeader(req.headers, 'cf-connecting-ip') ||
    req.socket?.remoteAddress ||
    ''
  );
};

export const getRequestMeta = (req) => ({
  ip: getClientIp(req),
  userAgent: getHeader(req.headers, 'user-agent') || '',
  country: getHeader(req.headers, 'x-vercel-ip-country') || '',
  region: getHeader(req.headers, 'x-vercel-ip-country-region') || '',
  city: getHeader(req.headers, 'x-vercel-ip-city') || ''
});

export const getQueryParam = (req, name) => {
  const url = new URL(req.url, 'http://localhost');
  return url.searchParams.get(name);
};

export const requireAdmin = (req, res) => {
  const expectedPassword = process.env.VOTE_ADMIN_PASSWORD || 'admin';
  const providedPassword = getHeader(req.headers, 'x-admin-password') || '';

  if (!expectedPassword || providedPassword !== expectedPassword) {
    sendJson(res, 401, { ok: false, reason: 'unauthorized' });
    return false;
  }

  return true;
};
