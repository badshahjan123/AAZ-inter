
const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      if (file !== 'node_modules') {
        filelist = walkSync(filepath, filelist);
      }
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        filelist.push(filepath);
      }
    }
  });
  return filelist;
};

const srcDir = path.join(__dirname, 'src');
const files = walkSync(srcDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Fix 1: Broken fetch calls: fetch(api('url', { -> fetch(api('url'), {
  // Regex looks for: fetch(api(QUOTE url QUOTE COMMA
  content = content.replace(/fetch\(api\((['"`][^'"`]+['"`])\s*,/g, "fetch(api($1),");
  
  // Fix 2: Duplicate imports or imports in middle of file
  // Strategy: Find all imports. If 'api' is imported multiple times or not at top, fix it.
  
  // Simple fix for now: Remove any mid-file imports of api
  // match "import { api } ..." that is preceded by non-whitespace/non-comment code?
  // Easier: Just look for indented imports
  // content = content.replace(/^\s+import \{ api \} from .*;$/gm, '');
  
  // Better: replace relative paths for config/api
  const relDir = path.relative(path.dirname(file), path.join(srcDir, 'config', 'api'));
  let importPath = relDir.replace(/\\/g, '/');
  if (!importPath.startsWith('.')) importPath = './' + importPath;
  
  // Replace the excessively long imports we made
  content = content.replace(/from ['"](\.\.\/)+config\/api['"]/g, `from '${importPath}'`);
  
  if (content !== originalContent) {
    console.log(`Fixing ${file}`);
    fs.writeFileSync(file, content);
  }
});
