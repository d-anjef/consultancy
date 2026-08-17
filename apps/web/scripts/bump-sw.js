const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '../public/sw.js');
const content = fs.readFileSync(swPath, 'utf8');
const timestamp = Date.now();
const updated = content.replace(
  /const SW_VERSION = ['"][^'"]+['"]/,
  `const SW_VERSION = '${timestamp}'`,
);

fs.writeFileSync(swPath, updated);
console.log(`[SW] Bumped version to ${timestamp}`);