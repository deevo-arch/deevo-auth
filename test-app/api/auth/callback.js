const { getDeevo } = require('../../lib/deevo');
const { setSession } = require('../../lib/session');

module.exports = async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001';

  if (error) {
    res.writeHead(302, { Location: `/?error=${encodeURIComponent(error)}` });
    return res.end();
  }

  if (!code) {
    res.writeHead(302, { Location: '/?error=no_code' });
    return res.end();
  }

  try {
    const deevo = getDeevo();
    const { accessToken, user } = await deevo.handleCallback(code);

    // Store in cookie-based session
    setSession(res, { accessToken, user });

    res.writeHead(302, { Location: '/dashboard.html' });
    res.end();
  } catch (err) {
    console.error('Auth callback error:', err.message);
    res.writeHead(302, { Location: `/?error=${encodeURIComponent(err.message)}` });
    res.end();
  }
};
