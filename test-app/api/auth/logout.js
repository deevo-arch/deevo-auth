const { clearSession } = require('../../lib/session');

module.exports = (req, res) => {
  clearSession(res);
  res.writeHead(302, { Location: '/' });
  res.end();
};
