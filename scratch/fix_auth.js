const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('page.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('<AuthProvider>')) {
        // Remove import
        content = content.replace(/import\s*\{\s*AuthProvider\s*\}\s*from\s+['"]@\/lib\/auth-context['"];?\n?/g, '');
        // Remove <AuthProvider> and </AuthProvider> tags
        content = content.replace(/<AuthProvider>/g, '');
        content = content.replace(/<\/AuthProvider>/g, '');
        
        fs.writeFileSync(fullPath, content);
        console.log('Fixed:', fullPath);
      }
    }
  }
}

processDir('./app');
