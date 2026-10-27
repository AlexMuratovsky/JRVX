const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const index=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'public/service-worker.js'),'utf8');
const changes={
 'assets/js-v330/casino.js':'assets/js-v331/casino.js',
 'modules/network/runtime/online-v330.js':'modules/network/runtime/online-v331.js',
 'modules/ui/runtime/roulette-picker-v330.js':'modules/ui/runtime/roulette-picker-v331.js'
};

test('the historical v331 manifest still identifies its retained recovery modules',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'recovery-v331-active-paths.json'),'utf8'));
 assert.equal(manifest.version,'v331');
 for(const current of Object.values(changes)){assert.ok(Object.values(manifest.paths).includes(current));assert.ok(fs.existsSync(path.join(root,'public',current)))}
});

test('already uploaded v330 resources retain their original immutable bytes',()=>{
 const baseline={
  'assets/js-v330/casino.js':'f6ba0e908f6aa426d6400cbe25219de01824cc8411f9d0767aff302a103054ec',
  'modules/network/runtime/online-v330.js':'fbef94f6c866b9720f6bf542cd20f72a2b023672403e2681c342af41b79ce686',
  'modules/ui/runtime/roulette-picker-v330.js':'e68b5d6056c9811ad577cb3d938b350028d5a0bfe8ac8191faa09fd65adba50a'
 };
 for(const [file,expected]of Object.entries(baseline))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'public',file))).digest('hex'),expected,file);
});
