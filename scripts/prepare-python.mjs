import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { mkdir, copyFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const source = dirname(require.resolve("pyodide"));
const destination = join(process.cwd(), "public", "_python");
await mkdir(destination, { recursive: true });
for (const file of [
  "pyodide.js",
  "pyodide.asm.mjs",
  "pyodide.asm.wasm",
  "python_stdlib.zip",
  "pyodide-lock.json",
]) {
  await copyFile(join(source, file), join(destination, file));
}
console.log("Python runtime assets ready.");
