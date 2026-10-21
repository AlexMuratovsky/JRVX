import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.resolve(root,'dist/standalone');
if(!output.startsWith(path.resolve(root,'dist')+path.sep))throw Error('Invalid standalone output directory');
try{if((await fs.lstat(output)).isSymbolicLink())throw Error('Standalone output cannot be a symlink');}catch(error){if(error.code!=='ENOENT')throw error;}
await fs.rm(output,{recursive:true,force:true});
await fs.mkdir(output,{recursive:true});
let count=0;
async function copy(dir,relative=''){
 for(const item of await fs.readdir(dir,{withFileTypes:true})){
  const name=path.join(relative,item.name),source=path.join(dir,item.name),target=path.join(output,name);
  if(item.isDirectory()){await copy(source,name);continue;}
  if(!/\.m?js$/.test(item.name))continue;
  await fs.mkdir(path.dirname(target),{recursive:true});await fs.copyFile(source,target);count++;
 }
}
await copy(path.join(root,'dist/server'));
const source=await fs.readFile(path.join(root,'standalone-worker.mjs'),'utf8');
if(!source.includes("'./dist/server/index.js'"))throw Error('Unexpected standalone entry import');
await fs.writeFile(path.join(output,'standalone-worker.mjs'),source.replace("'./dist/server/index.js'","'./index.js'"));
console.log(`Prepared standalone Worker: ${count+1} JavaScript modules`);
