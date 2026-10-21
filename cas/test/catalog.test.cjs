const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context={module:{exports:{}}};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../runtime/ecosystem-ui.js'),'utf8'),context);
const {matches}=context.module.exports;
test('Russian, English, aliases and multiple words find the intended catalog mode',()=>{
 assert.equal(matches('v71Blackjack','BLACKJACK'),true);
 assert.equal(matches('v71Blackjack','блекджек 21'),true);
 assert.equal(matches('v71Roulette','рулетка'),true);
 assert.equal(matches('v71Private','друг покер'),true);
 assert.equal(matches('v69QuickPlay','POKER'),true);
 assert.equal(matches('v69Tournaments','турниры'),true);
 assert.equal(matches('v71Roulette','покер'),false);
 assert.equal(matches('v71Blackjack','<script>'),false);
 assert.equal(matches('__proto__','poker'),false);
});
