import { createRequire } from "node:module";
import { mkdirSync,readdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
const require=createRequire(import.meta.resolve("drizzle-kit"));
const {build}=require("esbuild");
mkdirSync(".test-build",{recursive:true});
const tests=readdirSync("tests").filter(f=>f.endsWith(".test.ts"));
await build({entryPoints:tests.map(f=>`tests/${f}`),outdir:".test-build",outExtension:{".js":".mjs"},bundle:true,platform:"node",format:"esm",packages:"external",plugins:[{
  name:"isolated-test-runtime",setup(b){
    b.onResolve({filter:/^(cloudflare:workers|next\/headers|next\/navigation)$/},args=>({path:args.path,namespace:"test-runtime"}));
    b.onLoad({filter:/.*/,namespace:"test-runtime"},args=>({contents:args.path==="next/navigation"?'export function redirect(){throw new Error("Unexpected redirect")}':`export * from ${JSON.stringify(resolve("tests/runtime.ts"))}`,loader:"ts",resolveDir:process.cwd()}));
  }
}]});
const result=spawnSync(process.execPath,["--test",...tests.map(f=>`.test-build/${f.replace(/\.ts$/,".mjs")}`)],{stdio:"inherit"});process.exitCode=result.status??1;
