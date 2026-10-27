const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
test('the local v332 shell loads and precaches only the active versions, preserving the carousel',()=>{
 const index=fs.readFileSync(path.join(root,'public/index.html'),'utf8'),sw=fs.readFileSync(path.join(root,'public/service-worker.js'),'utf8');
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'recovery-v332-active-paths.json'),'utf8'));
 const scripts=[...index.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(manifest.version,'v332');assert.equal(scripts.length,77);assert.equal(scripts.length,new Set(scripts).size);assert.equal(scripts[0],'modules/core/runtime/money-v330.js');
 const context={self:{addEventListener(){}},location:{origin:'https://cas.jrvx.ru'}};vm.runInNewContext(sw+';this.paths=PRECACHE',context);
 assert.equal(context.paths.length,169);assert.equal(new Set(context.paths).size,169);assert.match(sw,/recovery-20261027-v332-shell/);
 for(const current of [...Object.values(manifest.paths),...manifest.additional]){
  assert.ok(index.includes(current),current);assert.ok(context.paths.includes('/'+current),current);assert.ok(fs.existsSync(path.join(root,'public',current)),current);
 }
 for(const old of ['assets/js-v331/casino.js','modules/ui/runtime/connection-v329.js','modules/ui/styles/connection-v329.css','modules/ui/runtime/pwa-v328.js','modules/core/runtime/lifecycle-v328.js']){assert.ok(!index.includes(old));assert.ok(!context.paths.includes('/'+old))}
 assert.equal(scripts.filter(p=>p==='modules/ui/legacy-runtime/29-v108-mode-carousel.js').length,1);
});
test('all replaced or retained v331 modules keep their immutable original bytes',()=>{
 const baseline=JSON.parse(fs.readFileSync(path.join(root,'recovery-v332-retained-paths.json'),'utf8'));
 for(const [file,hash]of Object.entries(baseline))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'public',file))).digest('hex'),hash,file);
});
