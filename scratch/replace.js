const fs = require('fs');
const files = [
  'sdk/README.md',
  'app/developers/page.jsx',
  'README.md',
  'test-app/README.md'
];
for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/# deevoauth/g, '# deevo-oauth');
    content = content.replace(/npm install deevoauth/g, 'npm install deevo-oauth');
    content = content.replace(/from 'deevoauth'/g, "from 'deevo-oauth'");
    content = content.replace(/require\('deevoauth'\)/g, "require('deevo-oauth')");
    content = content.replace(/`deevoauth`/g, "`deevo-oauth`");
    fs.writeFileSync(file, content);
    console.log('Fixed:', file);
  }
}
