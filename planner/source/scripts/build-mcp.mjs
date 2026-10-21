import { createRequire } from "node:module";
import { resolve } from "node:path";
const require=createRequire(import.meta.resolve("drizzle-kit"));const {build}=require("esbuild");
await build({entryPoints:["server/main.ts"],outfile:"dist-mcp/server.mjs",bundle:true,platform:"node",target:"node22",format:"esm",packages:"external",alias:{"cloudflare:workers":resolve("server/environment.ts")}});
