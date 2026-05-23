import * as fs from 'fs';
import * as path from 'path';

const srcDir = path.join(process.cwd(), 'src');

function getAllFiles(dir: string, fileList: string[] = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      getAllFiles(p, fileList);
    } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
      fileList.push(p);
    }
  }
  return fileList;
}

const allTsx = getAllFiles(srcDir);
const HINDI_REGEX = /[\u0900-\u097F]/;

const extractedStrings = new Set<string>();

allTsx.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (!HINDI_REGEX.test(content)) return;

  // 1. >Hindi< to >{t('Hindi')}<
  const jsxTextRegex = />([\s\n]*)([^<]*[\u0900-\u097F]+[^<]*?)([\s\n]*)</g;
  content = content.replace(jsxTextRegex, (match, prefix, p1, suffix) => {
    let text = p1.trim();
    if (text === '') return match;
    extractedStrings.add(text);
    return `>${prefix}{t('${text.replace(/'/g, "\\'")}')}${suffix}<`;
  });

  // 2. placeholder="Hindi" to placeholder={t('Hindi')}
  const placeholderRegex = /placeholder="([^"]*[\u0900-\u097F]+[^"]*)"/g;
  content = content.replace(placeholderRegex, (match, p1) => {
    extractedStrings.add(p1);
    return `placeholder={t('${p1.replace(/'/g, "\\'")}')}`;
  });

  // 3. title="Hindi" to title={t('Hindi')}
  const titleRegex = /title="([^"]*[\u0900-\u097F]+[^"]*)"/g;
  content = content.replace(titleRegex, (match, p1) => {
    extractedStrings.add(p1);
    return `title={t('${p1.replace(/'/g, "\\'")}')}`;
  });

  // 4. In generic strings: 'Hindi' to t('Hindi') -- skip for now, mostly handled manually or by DOM

  // Add import and hook call
  if (!content.includes('useLanguage')) {
    const depth = file.split(path.sep).length - srcDir.split(path.sep).length;
    let prefix = '';
    if (depth === 1) prefix = '.';
    else if (depth === 2) prefix = '..';
    else if (depth === 3) prefix = '../../';
    else if (depth === 4) prefix = '../../../';
    const importStmt = `\nimport { useLanguage } from '${prefix}/context/LanguageContext';\n`;
    
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfLine = content.indexOf('\n', lastImportIndex);
      content = content.slice(0, endOfLine + 1) + importStmt + content.slice(endOfLine + 1);
    } else {
      content = importStmt + content;
    }
  }

  const funcRegex = /((?:export\s+(?:default\s+)?)?(?:function\s+[A-Z]\w*\s*\([^)]*\)\s*\{|const\s+[A-Z]\w*\s*=\s*\([^)]*\)\s*=>\s*\{))/g;
  content = content.replace(funcRegex, (match) => {
    if (content.includes('const { t } = useLanguage();')) return match;
    return match + '\n  const { t } = useLanguage();\n';
  });

  fs.writeFileSync(file, content, 'utf8');
});

console.log(Array.from(extractedStrings).join('\n'));

