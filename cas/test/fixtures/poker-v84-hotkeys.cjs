// Exact retained v84 poker hotkey registration, isolated for compatibility checks.
// Full public source SHA-256: 3b337c68dac7428217164ad7ca763aa9d0e669ef8467be756e60c0ff234daf40.
// Only counter-only DOM controls are supplied by the test.
module.exports = function(document, $) {
document.addEventListener('keydown',e=>{if(!$('poker')?.classList.contains('active')||['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName))return;const k=e.key.toLowerCase();if(k==='f')$('p59Fold')?.click();else if(k==='c')$('p59Call')?.click();else if(k==='r')$('p59Raise')?.click()},{passive:true});
};
