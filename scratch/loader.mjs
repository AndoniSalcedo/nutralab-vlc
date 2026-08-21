import { resolve as resolvePath } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import fs from "node:fs";
import babel from "@babel/core";

export async function resolve(specifier, context, defaultResolve) {
  if (specifier.startsWith("@/")) {
    const target = resolvePath(process.cwd(), specifier.slice(2));
    if (fs.existsSync(target) && fs.statSync(target).isFile()) {
      return { url: pathToFileURL(target).href, shortCircuit: true };
    }
    if (fs.existsSync(target + ".js")) {
      return { url: pathToFileURL(target + ".js").href, shortCircuit: true };
    }
    if (fs.existsSync(target + ".jsx")) {
      return { url: pathToFileURL(target + ".jsx").href, shortCircuit: true };
    }
  }
  try {
    return await defaultResolve(specifier, context, defaultResolve);
  } catch (err) {
    if (specifier.startsWith("./") || specifier.startsWith("../")) {
      const parentDir = new URL(context.parentURL).pathname.replace(/\/[^/]*$/, "");
      const fullPath = resolvePath(parentDir, specifier);
      if (fs.existsSync(fullPath + ".js")) {
        return { url: pathToFileURL(fullPath + ".js").href, shortCircuit: true };
      }
      if (fs.existsSync(fullPath + ".jsx")) {
        return { url: pathToFileURL(fullPath + ".jsx").href, shortCircuit: true };
      }
    }
    throw err;
  }
}

export async function load(url, context, defaultLoad) {
  if (url.endsWith(".jsx")) {
    const filePath = fileURLToPath(url);
    const rawSource = fs.readFileSync(filePath, "utf-8");
    const transformed = babel.transformSync(rawSource, {
      presets: [
        [
          "next/babel",
          {
            "preset-env": {
              modules: false
            }
          }
        ]
      ],
      filename: filePath,
      sourceMaps: "inline"
    });

    return {
      format: "module",
      shortCircuit: true,
      source: transformed.code
    };
  }

  return defaultLoad(url, context, defaultLoad);
}
