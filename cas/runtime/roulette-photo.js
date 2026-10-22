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
  // The photographed zero is centred at twelve o'clock. The game describes
  // each pocket by its leading edge, so the photograph needs half a segment.
  var PHOTO_OFFSET = Math.PI / POCKETS;
  function finite(value, fallback) { return Number.isFinite(value) ? value : fallback; }
  function normalizeAngle(angle) { return ((angle % TAU) + TAU) % TAU; }
  function photoPocketCenter(index, wheelAngle) {
    return finite(wheelAngle, 0) + (index + 0.5) * SEGMENT - Math.PI / 2;
  }
  function photoPocketIndex(ballAngle, wheelAngle) {
    var relative = normalizeAngle(ballAngle - finite(wheelAngle, 0) + Math.PI / 2);
    return Math.min(POCKETS - 1, Math.floor(relative / SEGMENT));
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
      // Keep the entire original photograph: the outer wood, track and fixed
      // markers never rotate. The source has no baked-in ball.
      ctx.drawImage(artwork, -radius, -radius, diameter, diameter);
      ctx.save();
      try {
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.742, 0, TAU);
        ctx.clip();
        ctx.rotate(wheelAngle + PHOTO_OFFSET);
        ctx.drawImage(artwork, -radius, -radius, diameter, diameter);
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
    photoPocketCenter: photoPocketCenter,
    photoPocketIndex: photoPocketIndex,
    draw: draw
  });
});
