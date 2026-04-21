const { DeevoAuth } = require('deevo-oauth');

function getDeevo() {
  return new DeevoAuth({
    clientId: process.env.DEEVO_CLIENT_ID,
    clientSecret: process.env.DEEVO_CLIENT_SECRET,
    redirectUri: `${process.env.BASE_URL || 'http://localhost:3001'}/api/auth/callback`,
    authServerUrl: process.env.DEEVO_AUTH_SERVER || 'http://localhost:3000',
  });
}

module.exports = { getDeevo };
