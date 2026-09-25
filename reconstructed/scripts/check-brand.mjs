import { readdir, readFile } from "node:fs/promises";
import { extname } from "node:path";

const root = new URL("../src/", import.meta.url);
const forbidden = [
  String.fromCharCode(74,65,82,86,73,83),
  String.fromCharCode(74,97,114,118,105,115)
];
const extensions = new Set([".js", ".jsx", ".css", ".json", ".md"]);

async function walk(url) {
  const entries = await readdir(url, { withFileTypes: true });
  for (const entry of entries) {
    const child = new URL(entry.name + (entry.isDirectory() ? "/" : ""), url);
    if (entry.isDirectory()) {
      await walk(child);
      continue;
    }
    if (!extensions.has(extname(entry.name))) continue;
    const content = await readFile(child, "utf8");
    for (const word of forbidden) {
      if (content.includes(word)) {
        throw new Error(`Forbidden legacy public brand found in ${child.pathname}`);
      }
    }
  }
}

await walk(root);
console.log("JRVX brand check passed.");
