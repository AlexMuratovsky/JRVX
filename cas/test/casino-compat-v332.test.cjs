const path=require('node:path');
process.env.CAS_RECOVERY_V331_SOURCE=path.join(__dirname,'../public/assets/js-v332/casino.js');
require('./casino-recovery-v331.test.cjs');
