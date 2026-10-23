/* Photographic roulette renderer. This module only draws; the server and the
   existing spin plan remain responsible for every result and all game state. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.JRVXRoulettePhoto = api;
})(typeof window === 'object' ? window : null, function () {
  'use strict';
  var TAU = Math.PI * 2, POCKETS = 37, SEGMENT = TAU / POCKETS;
  // The generated photograph is suitable for the stationary case only. Its
  // printed ring is neither concentric nor a valid European wheel (38 labels).
  // Construct the rotating part from the same exact order as the game instead.
  var POCKET_ORDER = Object.freeze([0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26]);
  var RED = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
  var cachedRotor = null, cachedSide = 0, cachedRadius = 0;
  function finite(value, fallback) { return Number.isFinite(value) ? value : fallback; }
  function normalizeAngle(angle) { return ((angle % TAU) + TAU) % TAU; }
  function photoPocketCenter(index, wheelAngle) {
    return finite(wheelAngle, 0) + (index + 0.5) * SEGMENT - Math.PI / 2;
  }
  function photoPocketIndex(ballAngle, wheelAngle) {
    var relative = normalizeAngle(ballAngle - finite(wheelAngle, 0) + Math.PI / 2);
    return Math.min(POCKETS - 1, Math.floor(relative / SEGMENT));
  }
  function circle(ctx, radius, fill, stroke, width) {
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, TAU);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
  }
  function radial(ctx, radius, stops) {
    var gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    stops.forEach(function (s) { gradient.addColorStop(s[0], s[1]); });
    return gradient;
  }
  function drawRotor(ctx, radius) {
    // Every circular edge and the spindle share (0,0). No source photograph,
    // perspective, per-frame text layout or independent CSS transform enters
    // the rotating geometry.
    circle(ctx, radius * 0.77, '#20140d');
    circle(ctx, radius * 0.753, radial(ctx, radius * 0.753,
      [[0,'#b18c43'],[0.96,'#e7cf91'],[0.978,'#6a4825'],[1,'#f8e2a3']]));
    for (var index = 0; index < POCKETS; index++) {
      var number = POCKET_ORDER[index];
      var start = index * SEGMENT - Math.PI / 2, end = start + SEGMENT;
      var color = number === 0 ? '#075c40' : RED.has(number) ? '#a10d18' : '#090e10';
      ctx.beginPath(); ctx.arc(0,0,radius*0.733,start,end);
      ctx.arc(0,0,radius*0.50,end,start,true); ctx.closePath();
      ctx.fillStyle = color; ctx.fill();
      ctx.strokeStyle = '#bda36c'; ctx.lineWidth = radius * 0.0024; ctx.stroke();
      // A radial sheen gives the recessed pocket depth without moving its edge.
      ctx.beginPath(); ctx.arc(0,0,radius*0.605,start+0.003,end-0.003);
      ctx.arc(0,0,radius*0.505,end-0.003,start+0.003,true); ctx.closePath();
      ctx.fillStyle = radial(ctx,radius*0.61,[[0,'#050807'],[0.82,'#030706'],[1,color]]);
      ctx.fill();
      ctx.save();
      try {
        ctx.rotate((index+0.5)*SEGMENT);
        ctx.font = '600 ' + (radius*0.071) + 'px Georgia, serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff1ce';
        ctx.fillText(String(number),0,-radius*0.669,radius*0.099);
      } finally { ctx.restore(); }
    }
    circle(ctx,radius*0.610,null,'#e0c185',radius*0.006);
    circle(ctx,radius*0.499,radial(ctx,radius*0.50,
      [[0,'#28180f'],[0.38,'#352317'],[0.7,'#1c110c'],[0.94,'#3b281b'],[1,'#170e0a']]),'#dec48c',radius*0.007);
    // Fine deterministic wood grain is built once into the cached disc.
    ctx.save();
    try {
      ctx.beginPath(); ctx.arc(0,0,radius*0.491,0,TAU); ctx.clip();
      ctx.lineWidth = radius*0.0012;
      for (var grain=0; grain<72; grain++) {
        ctx.strokeStyle = grain%2 ? 'rgba(215,164,93,.075)' : 'rgba(0,0,0,.12)';
        ctx.beginPath();
        ctx.ellipse(0,radius*0.08,radius*(0.13+grain*0.0073),radius*(0.08+grain*0.006),-0.35,0,TAU);
        ctx.stroke();
      }
    } finally { ctx.restore(); }
    var brass=radial(ctx,radius*0.239,[[0,'#fff0ba'],[0.18,'#ae8038'],[0.39,'#ffe9a2'],[0.57,'#79501e'],[0.83,'#d4b16b'],[1,'#594020']]);
    circle(ctx,radius*0.239,brass,'#d9bd80',radius*0.004);
    for(var arm=0;arm<4;arm++) {
      ctx.save();
      try {
        ctx.rotate(arm*Math.PI/2);
        ctx.beginPath(); ctx.moveTo(-radius*0.025,0);
        ctx.lineTo(-radius*0.013,-radius*0.31); ctx.lineTo(radius*0.013,-radius*0.31);
        ctx.lineTo(radius*0.025,0); ctx.closePath();
        ctx.fillStyle=brass; ctx.fill(); ctx.strokeStyle='#dfc58b'; ctx.lineWidth=radius*0.003; ctx.stroke();
        ctx.save();
        try {
          ctx.translate(0,-radius*0.31);
          circle(ctx,radius*0.031,radial(ctx,radius*0.031,[[0,'#fff4c4'],[0.30,'#d9ba72'],[0.72,'#79521f'],[1,'#27190b']]),'#d5b471',radius*0.003);
        } finally { ctx.restore(); }
      } finally { ctx.restore(); }
    }
    circle(ctx,radius*0.13,brass,'#f4d994',radius*0.004);
    circle(ctx,radius*0.098,null,'#61431f',radius*0.007);
    circle(ctx,radius*0.077,radial(ctx,radius*0.077,
      [[0,'#fff4ca'],[0.25,'#e8c889'],[0.61,'#9d7331'],[0.87,'#3d2b13'],[1,'#e3c180']]),'#f4d994',radius*0.003);
  }
  function rotorSurface(ctx, radius) {
    // One retained surface, bounded at 2048px (16MiB RGBA), reused across
    // frames. Match the real backing scale, rather than stretching a 640px
    // image on a high-DPR screen. No new canvas is allocated during a spin.
    var transform = typeof ctx.getTransform === 'function' ? ctx.getTransform() : null;
    var scale = transform ? Math.hypot(transform.a,transform.b) : 1;
    var side = Math.min(2048,Math.max(640,Math.ceil((radius*2*scale-1e-7)/128)*128));
    if(cachedRotor && cachedSide===side && cachedRadius===radius) return cachedRotor;
    var surface = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(side,side) :
      typeof document === 'object' && document.createElement ? document.createElement('canvas') : null;
    if(!surface) return null;
    surface.width=side; surface.height=side;
    var target=surface.getContext('2d'); if(!target) return null;
    target.setTransform(side/(radius*2),0,0,side/(radius*2),side/2,side/2);
    drawRotor(target,radius);
    cachedRotor=surface; cachedSide=side; cachedRadius=radius;
    return surface;
  }
  function draw(ctx, g, state, artwork, busy) {
    if (!artwork || !artwork.complete || !(artwork.naturalWidth > 0) ||
        !(artwork.naturalHeight > 0) || !ctx || !g || !(g.R > 0)) return false;
    state = state || {};
    var radius = g.R, diameter = radius * 2;
    var wheelAngle = finite(state.wheelAngle, 0);
    var ballAngle = finite(state.ballAngle, -Math.PI / 2);
    var ballRadius = finite(state.ballRadius, finite(g.rail, radius * 0.813));
    var ballSize = radius * 0.028;
    var bx = Math.cos(ballAngle) * ballRadius, by = Math.sin(ballAngle) * ballRadius;
    ctx.save();
    try {
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      // Keep the approved wood case and fixed markers. Cover the invalid
      // photographed pockets completely with a genuinely concentric disc.
      ctx.drawImage(artwork, -radius, -radius, diameter, diameter);
      ctx.save();
      try {
        var rotor=rotorSurface(ctx,radius);
        ctx.rotate(wheelAngle);
        if(rotor) ctx.drawImage(rotor,-radius,-radius,diameter,diameter);
        else drawRotor(ctx,radius);
      } finally { ctx.restore(); }

      var winner = state.highlightIndex;
      if (Number.isInteger(winner) && winner >= 0 && winner < POCKETS) {
        var middle = photoPocketCenter(winner, wheelAngle);
        var start = middle - SEGMENT * 0.43, end = middle + SEGMENT * 0.43;
        ctx.save();
        try {
          ctx.beginPath();
          ctx.arc(0, 0, radius * 0.733, start, end);
          ctx.arc(0, 0, radius * 0.50, end, start, true);
          ctx.closePath();
          ctx.fillStyle = 'rgba(255,225,160,0.13)';
          ctx.strokeStyle = 'rgba(255,230,179,0.68)';
          ctx.lineWidth = Math.max(1, radius * 0.003);
          ctx.shadowColor = 'rgba(255,220,150,0.32)';
          ctx.shadowBlur = radius * 0.025;
          ctx.fill(); ctx.stroke();
        } finally { ctx.restore(); }
      }

      if (busy && state.phase !== 'settled' && state.phase !== 'pocket') {
        ctx.save();
        try {
          for (var trail = 4; trail >= 1; trail--) {
            var angle = ballAngle - trail * 0.026;
            ctx.globalAlpha = 0.035 * (5 - trail);
            ctx.fillStyle = '#fff3d7';
            ctx.beginPath();
            ctx.arc(Math.cos(angle) * ballRadius, Math.sin(angle) * ballRadius,
              ballSize * (0.42 + 0.09 * (5 - trail)), 0, TAU);
            ctx.fill();
          }
        } finally { ctx.restore(); }
      }
      ctx.save();
      try {
        ctx.fillStyle = 'rgba(0,0,0,0.52)';
        ctx.beginPath();
        ctx.ellipse(bx + radius * 0.011, by + radius * 0.015,
          ballSize * 1.06, ballSize * 0.62, 0, 0, TAU);
        ctx.fill();
        var ball = ctx.createRadialGradient(bx - ballSize * 0.32,
          by - ballSize * 0.38, ballSize * 0.04, bx, by, ballSize);
        ball.addColorStop(0, '#fffef8');
        ball.addColorStop(0.30, '#fff8e7');
        ball.addColorStop(0.66, '#e9ddc0');
        ball.addColorStop(0.88, '#bfb18d');
        ball.addColorStop(1, '#83785e');
        ctx.shadowColor = 'rgba(0,0,0,0.48)';
        ctx.shadowBlur = radius * 0.018;
        ctx.fillStyle = ball;
        ctx.beginPath(); ctx.arc(bx, by, ballSize, 0, TAU); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.86)';
        ctx.beginPath();
        ctx.arc(bx - ballSize * 0.29, by - ballSize * 0.34, ballSize * 0.17, 0, TAU);
        ctx.fill();
      } finally { ctx.restore(); }
      return true;
    } catch (_) {
      // A failed decode or unsupported drawing surface uses the existing
      // renderer. Context restoration must also hold on that fallback path.
      return false;
    } finally { ctx.restore(); }
  }
  return Object.freeze({
    assetPath: '/assets/art/roulette-no-ball-v323.webp',
    pocketOrder: POCKET_ORDER,
    drawRotor: drawRotor,
    photoPocketCenter: photoPocketCenter,
    photoPocketIndex: photoPocketIndex,
    draw: draw
  });
});
