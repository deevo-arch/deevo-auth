const { getSession } = require('../lib/session');

module.exports = (req, res) => {
  const session = getSession(req);
  if (!session) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ error: 'not_authenticated' }));
  }

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    user: session.user,
    accessToken: session.accessToken,
  }));
};
