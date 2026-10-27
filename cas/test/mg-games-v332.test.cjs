// Retain all MG correlation/replay coverage against the current local controllers.
const path=require('node:path');
process.env.JRVX_MG_ONLINE_SOURCE=path.join(__dirname,'../public/modules/network/runtime/online-v331.js');
process.env.JRVX_MG_CASINO_SOURCE=path.join(__dirname,'../public/assets/js-v332/casino.js');
require('./mg-games-v330.test.cjs');
