import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

function tryFile(filePath) {
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return filePath;
  for (const ext of ['.js', '.jsx', '.json', '/index.js', '/index.jsx']) {
    const candidate = filePath + ext;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('next/') && !specifier.endsWith('.js')) {
    return nextResolve(`${specifier}.js`, context);
  }

  let targetPath = null;
  if (specifier.startsWith('@/')) {
    targetPath = path.resolve(process.cwd(), specifier.slice(2));
  } else if (specifier.startsWith('./') || specifier.startsWith('../')) {
    const parentDir = context.parentURL ? path.dirname(fileURLToPath(context.parentURL)) : process.cwd();
    targetPath = path.resolve(parentDir, specifier);
  }

  if (targetPath) {
    const resolved = tryFile(targetPath);
    if (resolved) {
      return nextResolve(pathToFileURL(resolved).href, context);
    }
  }

  return nextResolve(specifier, context);
}
