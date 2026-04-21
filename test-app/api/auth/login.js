const { getDeevo } = require('../../lib/deevo');

module.exports = (req, res) => {
  const deevo = getDeevo();
  const loginUrl = deevo.getAuthUrl({
    state: 'csrf-' + Date.now(),
  });
  res.writeHead(302, { Location: loginUrl });
  res.end();
};
