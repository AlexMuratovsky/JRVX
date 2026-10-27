// Keep the original accessibility, cleanup and identity/network scenarios running
// against both their historical v328 modules and the active v332 replacements.
const path=require('node:path');
process.env.JRVX_PWA_SOURCE=path.join(__dirname,'../public/modules/ui/runtime/pwa-v332.js');
process.env.JRVX_LIFECYCLE_SOURCE=path.join(__dirname,'../public/modules/core/runtime/lifecycle-v332.js');
require('./pwa-accessibility-v328.test.cjs');
require('./lifecycle-cleanup-v328.test.cjs');
require('./lifecycle-network.test.cjs');
