// Run the existing MG owner/replay/precision scenarios against the replacement
// controllers as well as retaining their original v330 regression coverage.
const path=require('node:path');
process.env.JRVX_MG_ONLINE_SOURCE=path.join(__dirname,'../public/modules/network/runtime/online-v331.js');
process.env.JRVX_MG_CASINO_SOURCE=path.join(__dirname,'../public/assets/js-v331/casino.js');
require('./mg-games-v330.test.cjs');
