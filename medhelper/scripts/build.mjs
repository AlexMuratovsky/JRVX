import {cp,mkdir,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
for(const name of ['index.html','manifest.webmanifest'])await cp(name,`dist/${name}`);
for(const name of ['assets','src'])await cp(name,`dist/${name}`,{recursive:true});
console.log('Static build written to dist/');
