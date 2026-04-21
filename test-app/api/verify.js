const { getDeevo } = require('../lib/deevo');
const { getSession } = require('../lib/session');

module.exports = async (req, res) => {
  const session = getSession(req);
  if (!session || !session.accessToken) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ error: 'not_authenticated' }));
  }

  try {
    const deevo = getDeevo();
    const user = await deevo.verifyToken(session.accessToken);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ valid: true, user }));
  } catch (err) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ valid: false, error: err.message }));
  }
};
