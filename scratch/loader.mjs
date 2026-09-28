/* eslint-disable import-x/no-unused-modules */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const projectRoot = process.cwd();

export async function resolve(specifier, context, defaultResolve) {
  if (specifier.startsWith('@/')) {
    const relPath = specifier.slice(2);
    const absPath = path.join(projectRoot, relPath);

    const candidates = [
      absPath,
      absPath + '.js',
      absPath + '.jsx',
      absPath + '.json',
      path.join(absPath, 'index.js'),
      path.join(absPath, 'index.jsx')
    ];

    for (const cand of candidates) {
      if (fs.existsSync(cand) && !fs.statSync(cand).isDirectory()) {
        return {
          url: pathToFileURL(cand).href,
          shortCircuit: true,
        };
      }
    }
  }

  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    if (context.parentURL) {
      const parentDir = path.dirname(new URL(context.parentURL).pathname);
      const absPath = path.resolve(parentDir, specifier);
      const candidates = [
        absPath,
        absPath + '.js',
        absPath + '.jsx',
        absPath + '.json',
        path.join(absPath, 'index.js'),
        path.join(absPath, 'index.jsx')
      ];
      for (const cand of candidates) {
        if (fs.existsSync(cand) && !fs.statSync(cand).isDirectory()) {
          return {
            url: pathToFileURL(cand).href,
            shortCircuit: true,
          };
        }
      }
    }
  }

  try {
    return await defaultResolve(specifier, context);
  } catch {
    return defaultResolve(specifier, {
      ...context,
      parentURL: pathToFileURL(path.join(projectRoot, 'dummy.js')).href
    });
  }
}
