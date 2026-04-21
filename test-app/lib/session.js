/**
 * Simple cookie-based session for Vercel serverless functions.
 * Stores session data as base64-encoded JSON in an HTTP-only cookie.
 */

function setSession(res, data) {
  const encoded = Buffer.from(JSON.stringify(data)).toString('base64');
  res.setHeader('Set-Cookie', [
    `deevo_session=${encoded}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`,
  ]);
}

function getSession(req) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/deevo_session=([^;]+)/);
  if (!match) return null;
  try {
    return JSON.parse(Buffer.from(match[1], 'base64').toString());
  } catch {
    return null;
  }
}

function clearSession(res) {
  res.setHeader('Set-Cookie', [
    'deevo_session=; Path=/; HttpOnly; Max-Age=0',
  ]);
}

module.exports = { setSession, getSession, clearSession };
