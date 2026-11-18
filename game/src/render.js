// WHITEOUT — all drawing. Canvas 2D, 1280x720, Lilita One display font,
// Bungee for the stacked title logo.
// Layout is deliberately NOT the top-entries' top-bar + side panels: the
// mountain sits in the centre, a storm ring circles it, and four corner
// tablets hold threats, rescue, build and weather/resources.
import {
  BLIZZARDS, BUILD, CX, CY, H, MOUNTAIN_R, RING_R, SLOPE_ANGLES, SLOPE_NAMES, THREATS,
  VILLAGE_R, W, gradeFor, multFor,
} from './config.js';
import {
  SCREEN_DRAFT, SCREEN_LOSE, SCREEN_PAUSE, SCREEN_PLAY, SCREEN_TITLE,
  SCREEN_WIN, housesAlive, phaseOf,
} from './world.js';

const FONT = '"Lilita One", "Arial Black", sans-serif';
const LOGO_FONT = '"Bungee", "Lilita One", "Arial Black", sans-serif';
const TL = { x: 12, y: 12, w: 296, h: 200 };
const TR = { x: 972, y: 12, w: 296, h: 200 };
const BL = { x: 12, y: 508, w: 430, h: 200 };
const BR = { x: 838, y: 508, w: 430, h: 200 };

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align, outline, baseline) {
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = baseline || 'alphabetic';
  if (outline) {
    ctx.lineWidth = Math.max(2, size / 6);
    ctx.strokeStyle = outline;
    ctx.lineJoin = 'round';
    ctx.strokeText(s, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

// Bungee display text (headings, labels, numbers) — the v2 icy concept.
function textB(ctx, s, x, y, size, color, align, outline, baseline) {
  ctx.font = `${size}px ${LOGO_FONT}`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = baseline || 'alphabetic';
  if (outline) {
    ctx.lineWidth = Math.max(2, size / 6);
    ctx.strokeStyle = outline;
    ctx.lineJoin = 'round';
    ctx.strokeText(s, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

// Gradient-filled Bungee text with an ice glow (titles, banner).
function gradText(ctx, s, x, y, size, stops, align, glowColor, glowBlur, baseline) {
  const g = ctx.createLinearGradient(0, y - size, 0, y);
  for (const [off, col] of stops) g.addColorStop(off, col);
  ctx.save();
  ctx.font = `${size}px ${LOGO_FONT}`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = baseline || 'alphabetic';
  if (glowColor) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = glowBlur || 18;
  }
  ctx.fillStyle = g;
  ctx.fillText(s, x, y);
  ctx.restore();
}

function flake(ctx, x, y, r, alpha) {
  ctx.save();
  if (alpha !== undefined) ctx.globalAlpha = alpha;
  ctx.strokeStyle = 'rgba(224,242,254,0.95)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(125,211,252,0.8)';
  ctx.shadowBlur = 6;
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r);
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Realistic pine (v2 mid-play): 3 snow-capped tiers, trunk, soft shadow.
// x,y = ground point (tree grows upward, negative y); s = scale;
// variant 0/1 picks the green mix.
function drawPine(ctx, x, y, s, variant) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 1, 8, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5b3a1e';
  ctx.fillRect(-1.2, -4, 2.5, 5);
  const greens = variant ? ['#15803d', '#166534', '#15803d'] : ['#166534', '#14532d', '#166534'];
  // bottom tier
  ctx.fillStyle = greens[0];
  ctx.beginPath(); ctx.moveTo(-11, -3); ctx.lineTo(0, -16); ctx.lineTo(11, -3); ctx.closePath(); ctx.fill();
  // middle tier
  ctx.fillStyle = greens[1];
  ctx.beginPath(); ctx.moveTo(-8.5, -10); ctx.lineTo(0, -22); ctx.lineTo(8.5, -10); ctx.closePath(); ctx.fill();
  // top tier
  ctx.fillStyle = greens[2];
  ctx.beginPath(); ctx.moveTo(-6, -17); ctx.lineTo(0, -28); ctx.lineTo(6, -17); ctx.closePath(); ctx.fill();
  // snow caps on each tier edge
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath(); ctx.moveTo(-7.5, -6); ctx.lineTo(0, -16); ctx.lineTo(7.5, -6); ctx.lineTo(4.8, -6.8); ctx.lineTo(0, -10.5); ctx.lineTo(-4.8, -6.8); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-6, -12.5); ctx.lineTo(0, -22); ctx.lineTo(6, -12.5); ctx.lineTo(3, -13.2); ctx.lineTo(0, -16); ctx.lineTo(-3, -13.2); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-4.5, -19); ctx.lineTo(0, -28); ctx.lineTo(4.5, -19); ctx.lineTo(2, -19.8); ctx.lineTo(0, -21.5); ctx.lineTo(-2, -19.8); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// Realistic cabin (v2 mid-play): plank body, thick snow roof, chimney with
// smoke, two warm windows, door, snowdrift base, soft shadow. x,y = centre.
function drawCabin(ctx, x, y, warm, dead, time, smokeSeed) {
  ctx.save();
  ctx.translate(x, y);
  if (dead) {
    ctx.fillStyle = 'rgba(51, 65, 85, 0.9)';
    ctx.fillRect(-9, -4, 18, 10);
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, -8); ctx.lineTo(6, 4);
    ctx.moveTo(6, -8); ctx.lineTo(-6, 4);
    ctx.stroke();
    ctx.restore();
    return;
  }
  const cold = warm < 30;
  if (!cold) {
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
    glow.addColorStop(0, 'rgba(253, 224, 71, 0.4)');
    glow.addColorStop(1, 'rgba(253, 224, 71, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();
  }
  // shadow + snowdrift base
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 11, 13, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(238,246,255,0.95)';
  ctx.beginPath();
  ctx.ellipse(0, 10, 15, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // plank body
  ctx.fillStyle = '#78350f';
  ctx.fillRect(-11, -4, 22, 13);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-11, 0.5); ctx.lineTo(11, 0.5);
  ctx.moveTo(-11, 5); ctx.lineTo(11, 5);
  ctx.stroke();
  // chimney + smoke puffs
  ctx.fillStyle = '#57534e';
  ctx.fillRect(7, -13, 4, 6);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  const sy = -15.5 - ((time * 8 + smokeSeed) % 14);
  ctx.beginPath(); ctx.arc(9, sy, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath(); ctx.arc(11.5, sy - 2, 1.4, 0, Math.PI * 2); ctx.fill();
  // thick snow roof
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(-14, -3);
  ctx.lineTo(0, -14);
  ctx.lineTo(14, -3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-14, -3);
  ctx.lineTo(14, -3);
  ctx.stroke();
  // warm windows (halo + pane + crossbar) and door
  ctx.fillStyle = cold ? '#334155' : 'rgba(251,191,36,0.25)';
  ctx.fillRect(-8, -1, 6.5, 7);
  ctx.fillRect(2, -1, 6.5, 7);
  ctx.fillStyle = cold ? '#334155' : '#fbbf24';
  ctx.fillRect(-7, 0, 4.5, 5);
  ctx.fillRect(3, 0, 4.5, 5);
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(-4.8, 0); ctx.lineTo(-4.8, 5);
  ctx.moveTo(-7, 2.5); ctx.lineTo(-2.5, 2.5);
  ctx.moveTo(5.2, 0); ctx.lineTo(5.2, 5);
  ctx.moveTo(3, 2.5); ctx.lineTo(7.5, 2.5);
  ctx.stroke();
  ctx.fillStyle = '#451a03';
  ctx.fillRect(-2, 1, 4, 8);
  ctx.restore();
}

// Rock with a shaded side and a snow cap.
function drawRock(ctx, x, y, s) {
  ctx.fillStyle = 'rgba(100, 116, 139, 0.85)';
  ctx.beginPath();
  ctx.moveTo(x - s, y + s * 0.6);
  ctx.lineTo(x, y - s);
  ctx.lineTo(x + s, y + s * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(71, 85, 105, 0.8)';
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x + s, y + s * 0.6);
  ctx.lineTo(x + s * 0.4, y + s * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.moveTo(x - s * 0.45, y - s * 0.45);
  ctx.lineTo(x, y - s);
  ctx.lineTo(x + s * 0.45, y - s * 0.45);
  ctx.lineTo(x + s * 0.2, y - s * 0.5);
  ctx.lineTo(x, y - s * 0.62);
  ctx.lineTo(x - s * 0.2, y - s * 0.5);
  ctx.closePath();
  ctx.fill();
}

// Chunky 3D wordmark part: dark extrusion stacked below the glyphs, a
// vertical gradient fill with a cold glow, then a dark outline on top so
// the letters stay legible over the peak. Drawn left-aligned at x with the
// given font; returns the part width. Deterministic — fixed offsets.
function logoPart(ctx, s, x, y, size, stops, depthColor, outline, font) {
  ctx.font = `${size}px ${font}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.fillStyle = depthColor;
  for (let d = 2; d <= 10; d += 2) ctx.fillText(s, x, y + d);
  const g = ctx.createLinearGradient(0, y - size, 0, y);
  for (const [off, col] of stops) g.addColorStop(off, col);
  ctx.save();
  ctx.shadowColor = 'rgba(125,211,252,0.55)';
  ctx.shadowBlur = 18;
  ctx.fillStyle = g;
  ctx.fillText(s, x, y);
  ctx.restore();
  ctx.lineWidth = Math.max(2, size / 7);
  ctx.strokeStyle = outline;
  ctx.strokeText(s, x, y);
  return ctx.measureText(s).width;
}

function logoText(ctx, s, x, y, size, stops, depthColor, outline) {
  ctx.font = `${size}px ${FONT}`;
  const w = ctx.measureText(s).width;
  logoPart(ctx, s, x - w / 2, y, size, stops, depthColor, outline, FONT);
}

// Stacked Bungee wordmark, both lines the SAME width with flush left and
// right edges — one straight, neat block. WHITE is fitted to the title
// width; OUT is sized to fit the same vertical budget and stretched with
// letter-spacing to exactly WHITE's width. The two sizes sum to at most
// 250 so the block (caps + gap + extrusion) ends above the tagline at
// 232. Fitted once and cached; the fit uses the loaded Bungee metrics,
// so it matches what is drawn.
const STACKED_TARGET = 360;
const STACKED_TOP = 20;
const STACKED_GAP = 2;
let logoStacked = null;
function fitStackedLogo(ctx) {
  if (logoStacked) return logoStacked;
  ctx.letterSpacing = '0px';
  let sizeW = 200;
  ctx.font = `${sizeW}px ${LOGO_FONT}`;
  while (sizeW > 40 && ctx.measureText('WHITE').width > STACKED_TARGET) {
    sizeW -= 2;
    ctx.font = `${sizeW}px ${LOGO_FONT}`;
  }
  const widthW = ctx.measureText('WHITE').width;
  const capW = ctx.measureText('WHITE').actualBoundingBoxAscent || sizeW * 0.72;
  let sizeO = Math.min(240, 250 - sizeW);
  ctx.font = `${sizeO}px ${LOGO_FONT}`;
  while (sizeO > 40 && ctx.measureText('OUT').width > widthW) {
    sizeO -= 2;
    ctx.font = `${sizeO}px ${LOGO_FONT}`;
  }
  const widthO = ctx.measureText('OUT').width;
  const capO = ctx.measureText('OUT').actualBoundingBoxAscent || sizeO * 0.72;
  const lsO = Math.max(0, (widthW - widthO) / 3);
  const baseW = STACKED_TOP + Math.ceil(capW);
  const baseO = baseW + STACKED_GAP + Math.ceil(capO);
  logoStacked = { sizeW, sizeO, widthW, lsO, baseW, baseO };
  return logoStacked;
}

// v2: tablets use the title-screen panel style — navy body, ice border,
// Bungee title in pale ice with a divider line (no more coloured header
// strips). Rows keep their old y offsets: title row is ~34 px tall.
function tablet(ctx, t, title) {
  ctx.save();
  ctx.fillStyle = 'rgba(7, 18, 30, 0.86)';
  rr(ctx, t.x, t.y, t.w, t.h, 10);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.55)';
  ctx.stroke();
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(t.x + 12, t.y + 34);
  ctx.lineTo(t.x + t.w - 12, t.y + 34);
  ctx.stroke();
  const m = title.match(/^(\S+)\s+(.*)$/);
  if (m) {
    text(ctx, m[1], t.x + 12, t.y + 18, 15, '#e0f2fe', 'left', null, 'middle');
    const iconW = ctx.measureText(m[1]).width;
    textB(ctx, m[2], t.x + 18 + iconW, t.y + 24, 15, '#e0f2fe', 'left');
  } else {
    textB(ctx, title, t.x + 12, t.y + 24, 15, '#e0f2fe', 'left');
  }
  ctx.restore();
}

function bar(ctx, x, y, w, h, frac, fill, bg) {
  ctx.fillStyle = bg || 'rgba(255,255,255,0.18)';
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  if (frac > 0) {
    ctx.fillStyle = fill;
    rr(ctx, x, y, Math.max(h, w * Math.min(1, frac)), h, h / 2);
    ctx.fill();
  }
}

function packColor(pack) {
  if (pack >= 90) return 'rgba(239, 68, 68, 0.75)';
  if (pack >= 70) return 'rgba(249, 115, 22, 0.65)';
  if (pack >= 45) return 'rgba(253, 224, 71, 0.55)';
  return 'rgba(191, 219, 254, 0.4)';
}

// Offscreen canvas for the masked mountain disc (v2: the disc melts into
// the terrain photo instead of ending in a hard rim).
const discCanvas = document.createElement('canvas');
discCanvas.width = W;
discCanvas.height = H;
const discCtx = discCanvas.getContext('2d');
// Radial alpha mask: fully opaque to r≈225, fading to transparent by r=288.
const DISC_MASK = (() => {
  const g = discCtx.createRadialGradient(CX, CY, 0, CX, CY, RING_R);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.78, 'rgba(255,255,255,1)');
  g.addColorStop(0.88, 'rgba(255,255,255,0.6)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  return g;
})();

function drawMountain(ctx, world) {
  const a = world.assets;
  // Painterly terrain, full-bleed.
  if (a && a.play) ctx.drawImage(a.play, 0, 0, W, H);
  else { ctx.fillStyle = '#dfe9f2'; ctx.fillRect(0, 0, W, H); }
  // Cool colour grade so the photo and the disc share one cold tone.
  ctx.fillStyle = 'rgba(10, 25, 40, 0.18)';
  ctx.fillRect(0, 0, W, H);
  const grade = ctx.createLinearGradient(0, 0, 0, H);
  grade.addColorStop(0, 'rgba(125,211,252,0.07)');
  grade.addColorStop(0.5, 'rgba(125,211,252,0.02)');
  grade.addColorStop(1, 'rgba(10,25,40,0.12)');
  ctx.fillStyle = grade;
  ctx.fillRect(0, 0, W, H);

  // --- masked disc: everything here melts into the photo at the rim ---
  const dc = discCtx;
  dc.clearRect(0, 0, W, H);
  // Mountain disc: soft snow light over the terrain.
  const g = dc.createRadialGradient(CX, CY, 40, CX, CY, MOUNTAIN_R + 40);
  g.addColorStop(0, 'rgba(255,255,255,0.34)');
  g.addColorStop(0.75, 'rgba(255,255,255,0.10)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(CX, CY, MOUNTAIN_R + 40, 0, Math.PI * 2);
  ctx.fill();

  // Gullies: pale channels from the village out along each slope.
  dc.save();
  dc.strokeStyle = 'rgba(219, 234, 254, 0.5)';
  dc.lineWidth = 7;
  dc.lineCap = 'round';
  for (const s of world.slopes) {
    const a = (s.angle * Math.PI) / 180;
    dc.beginPath();
    dc.moveTo(CX + Math.cos(a) * 102, CY + Math.sin(a) * 102);
    dc.lineTo(CX + Math.cos(a) * (MOUNTAIN_R - 4), CY + Math.sin(a) * (MOUNTAIN_R - 4));
    dc.stroke();
  }
  dc.restore();

  // Slope wedges with visible snowpack depth.
  for (const s of world.slopes) {
    const a0 = ((s.angle - 22.5) * Math.PI) / 180;
    const a1 = ((s.angle + 22.5) * Math.PI) / 180;
    dc.beginPath();
    dc.moveTo(CX, CY);
    dc.arc(CX, CY, MOUNTAIN_R, a0, a1);
    dc.closePath();
    dc.fillStyle = packColor(s.pack);
    dc.fill();
    dc.lineWidth = 1.5;
    dc.strokeStyle = 'rgba(255,255,255,0.45)';
    dc.stroke();
    // Snowpack fill: white wedge height grows with the pack.
    const rFill = 100 + (s.pack / 100) * (MOUNTAIN_R - 100);
    dc.beginPath();
    dc.moveTo(CX, CY);
    dc.arc(CX, CY, rFill, a0 + 0.03, a1 - 0.03);
    dc.closePath();
    dc.fillStyle = s.pack >= 90 ? 'rgba(254, 150, 150, 0.6)' : s.pack >= 70 ? 'rgba(254, 215, 130, 0.55)' : 'rgba(255,255,255,0.5)';
    dc.fill();
    if (s.flash > 0) {
      dc.beginPath();
      dc.moveTo(CX, CY);
      dc.arc(CX, CY, MOUNTAIN_R, a0, a1);
      dc.closePath();
      dc.fillStyle = `rgba(255,255,255,${s.flash * 0.6})`;
      dc.fill();
    }
  }

  // Rocks and pines (realistic v2 art).
  for (const r of world.rocks) drawRock(dc, r.x, r.y, r.s);
  for (const t of world.trees) drawPine(dc, t.x, t.y, t.s, t.shade > 0.5 ? 1 : 0);

  // Village ground: warm trampled snow.
  const vg = dc.createRadialGradient(CX, CY, 10, CX, CY, VILLAGE_R + 14);
  vg.addColorStop(0, 'rgba(214, 186, 140, 0.5)');
  vg.addColorStop(1, 'rgba(214, 186, 140, 0)');
  dc.fillStyle = vg;
  dc.beginPath();
  dc.arc(CX, CY, VILLAGE_R + 14, 0, Math.PI * 2);
  dc.fill();
  dc.strokeStyle = 'rgba(146, 64, 14, 0.5)';
  dc.lineWidth = 2;
  dc.beginPath();
  dc.arc(CX, CY, VILLAGE_R + 6, 0, Math.PI * 2);
  dc.stroke();

  // Fade the disc's rim into the terrain, then paint it on.
  dc.save();
  dc.globalCompositeOperation = 'destination-in';
  dc.fillStyle = DISC_MASK;
  dc.fillRect(0, 0, W, H);
  dc.restore();
  ctx.drawImage(discCanvas, 0, 0);

  // --- unmasked top layer: slope labels, fence, warnings ---
  for (const s of world.slopes) {
    const a = (s.angle * Math.PI) / 180;
    const nx = CX + Math.cos(a) * 208;
    const ny = CY + Math.sin(a) * 208;
    const danger = s.pack >= 70;
    textB(ctx, `${s.name} ${Math.round(s.pack)}`, nx, ny, danger ? 17 : 14, danger ? '#fecaca' : '#f8fafc', 'center', 'rgba(7,18,30,0.85)');
    bar(ctx, nx - 22, ny + 5, 44, 6, s.pack / 100, s.pack >= 90 ? '#ef4444' : s.pack >= 70 ? '#f97316' : '#7dd3fc');
    if (s.fence) {
      const fx = CX + Math.cos(a) * 150;
      const fy = CY + Math.sin(a) * 150;
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(fx - 10, fy - 6); ctx.lineTo(fx + 10, fy - 6);
      ctx.moveTo(fx - 8, fy - 12); ctx.lineTo(fx - 8, fy + 2);
      ctx.moveTo(fx, fy - 12); ctx.lineTo(fx, fy + 2);
      ctx.moveTo(fx + 8, fy - 12); ctx.lineTo(fx + 8, fy + 2);
      ctx.stroke();
      textB(ctx, 'FENCE', fx, fy + 18, 10, '#7dd3fc', 'center', 'rgba(7,18,30,0.8)');
    }
    if (s.pack >= 90) {
      const wx = CX + Math.cos(a) * 168;
      const wy = CY + Math.sin(a) * 168;
      const pulse = 0.6 + 0.4 * Math.sin(world.time * 6);
      ctx.fillStyle = `rgba(239,68,68,${pulse})`;
      ctx.beginPath();
      ctx.arc(wx, wy, 11, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, '!', wx, wy + 5, 15, '#fff', 'center');
    }
  }

  // Houses: realistic cabins (v2), shields and warmth pips on top.
  for (const h of world.houses) {
    drawCabin(ctx, h.x, h.y, h.warm, h.dead, world.time, h.smoke);
    if (h.dead) continue;
    if (h.shield) {
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(h.x, h.y, 16, 0, Math.PI * 2);
      ctx.stroke();
    }
    // warmth pips under the house
    ctx.save();
    ctx.translate(h.x, h.y);
    bar(ctx, -9, 10, 18, 3, h.warm / 100, h.warm < 30 ? '#ef4444' : '#f59e0b');
    ctx.restore();
  }

  // Villagers: tiny dots with bright coats wandering the village green.
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + world.time * 0.05 * (i % 2 ? 1 : -1);
    const r = 26 + (i % 4) * 9;
    const x = CX + Math.cos(a) * r;
    const y = CY + Math.sin(a) * r;
    ctx.fillStyle = ['#ef4444', '#3b82f6', '#f59e0b', '#a855f7'][i % 4];
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y - 2.5, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Buried villagers: snow mounds, pulsing ring, countdown arc.
  for (const b of world.buried) {
    const pulse = 0.55 + 0.45 * Math.sin(world.time * 7);
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, 13, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = `rgba(239,68,68,${pulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 17, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 20, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * b.timer) / b.max);
    ctx.stroke();
    text(ctx, 'HELP!', b.x, b.y - 24, 12, '#fecaca', 'center', 'rgba(7,18,30,0.85)');
  }

  // Rescue teams: orange wardens with a rope line to their dig site.
  for (const r of world.rescues) {
    ctx.strokeStyle = '#fdba74';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(r.x, r.y);
    ctx.lineTo(r.target.x, r.target.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(r.x, r.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(r.x, r.y - 3, 2, 0, Math.PI * 2);
    ctx.fill();
    if (r.digging) {
      text(ctx, 'DIGGING…', r.x, r.y - 12, 11, '#fdba74', 'center', 'rgba(7,18,30,0.85)');
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(r.target.x, r.target.y, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - r.digTimer / (r.digMax || 3)));
      ctx.stroke();
    }
  }

  // Wolf tracks: dotted trails in the outer terrain behind each wolf.
  for (const w of world.wolves) {
    const dx = w.x - CX;
    const dy = w.y - CY;
    const d = Math.hypot(dx, dy) || 1;
    for (let i = 1; i <= 4; i++) {
      ctx.fillStyle = `rgba(148, 163, 184, ${0.55 - i * 0.1})`;
      ctx.beginPath();
      ctx.arc(w.x + (dx / d) * i * 14, w.y + (dy / d) * i * 14, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Wolves: grey shapes with red eyes, stalking in from the treeline.
  for (const w of world.wolves) {
    const dx = CX - w.x;
    const dy = CY - w.y;
    const d = Math.hypot(dx, dy) || 1;
    const ang = Math.atan2(dy, dx);
    ctx.save();
    ctx.translate(w.x, w.y);
    ctx.rotate(ang);
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(11, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(9, -4); ctx.lineTo(11, -8); ctx.lineTo(13, -3);
    ctx.moveTo(9, 4); ctx.lineTo(11, 8); ctx.lineTo(13, 3);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.quadraticCurveTo(-16, -4, -18, -8 + Math.sin(world.time * 5 + w.x) * 2);
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(12, -1.8, 1.3, 0, Math.PI * 2);
    ctx.arc(12, 1.8, 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (world.upgrades.includes('eyes')) {
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(w.x, w.y, 16, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Flow particles from a controlled release.
  for (const p of world.particles) {
    if (p.kind !== 'flow') continue;
    ctx.fillStyle = `rgba(255,255,255,${Math.max(0, p.life)})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStormRing(ctx, world) {
  // Clock-face gauge: 7 blizzard pips around the ring. Thin, low-opacity
  // ice-blue ring (v2) — the disc melts into the photo, the ring stays quiet.
  ctx.save();
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(CX, CY, RING_R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.10)';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(CX, CY, RING_R, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < BLIZZARDS; i++) {
    const a = (-90 + i * (360 / BLIZZARDS)) * Math.PI / 180;
    const x = CX + Math.cos(a) * RING_R;
    const y = CY + Math.sin(a) * RING_R;
    const done = i < world.blizzard - 1 || (world.blizzard === BLIZZARDS && world.bossDefeated);
    const current = i === world.blizzard - 1;
    const pulse = current ? 0.7 + 0.3 * Math.sin(world.time * 5) : 1;
    ctx.fillStyle = done ? '#38bdf8' : current ? `rgba(125, 211, 252, ${pulse})` : 'rgba(148, 163, 184, 0.6)';
    ctx.beginPath();
    ctx.arc(x, y, current ? 10 : 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(7,18,30,0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, String(i + 1), x, y + 4, 11, '#0b1c2c', 'center');
  }
  // Wind arrow lives in its own pass (drawWindArrow, called after the
  // corner tablets) — at ~135° it lands inside the BUILD tablet's bounds,
  // and the opaque tablet used to hide it.

  // The White Giant's storm eye rides the ring on blizzard 7.
  if (world.eye.active && !world.bossDefeated) {
    const ea = (world.eye.angle * Math.PI) / 180;
    const ex = CX + Math.cos(ea) * world.eye.dist;
    const ey = CY + Math.sin(ea) * world.eye.dist;
    const a = world.assets;
    ctx.save();
    ctx.beginPath();
    ctx.arc(ex, ey, 28, 0, Math.PI * 2);
    ctx.clip();
    if (a && a.giant) ctx.drawImage(a.giant, ex - 28, ey - 42, 56, 84);
    else { ctx.fillStyle = '#c7d2fe'; ctx.fillRect(ex - 28, ey - 28, 56, 56); }
    ctx.restore();
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ex, ey, 28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(ex, ey, 34 + Math.sin(world.time * 4) * 3, 0, Math.PI * 2);
    ctx.stroke();
    // Storm-eye swirl: two sweeping arcs around the Giant on the ring.
    ctx.strokeStyle = 'rgba(199, 210, 254, 0.65)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ex, ey, 42, world.time * 1.2, world.time * 1.2 + Math.PI * 1.1);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.45)';
    ctx.beginPath();
    ctx.arc(ex, ey, 48, world.time * 1.2 + Math.PI, world.time * 1.2 + Math.PI * 1.9);
    ctx.stroke();
    text(ctx, 'STORM EYE — CLICK TO PUSH BACK', ex, ey - 34, 11, '#c7d2fe', 'center', 'rgba(7,18,30,0.85)');
    // faint tether to the village
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.35)';
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(CX, CY);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function drawWindArrow(ctx, world) {
  const wa = (world.windAngle * Math.PI) / 180;
  const wx = CX + Math.cos(wa) * (RING_R + 26);
  const wy = CY + Math.sin(wa) * (RING_R + 26);
  ctx.save();
  ctx.fillStyle = '#7dd3fc';
  ctx.beginPath();
  ctx.moveTo(wx + Math.cos(wa) * 12, wy + Math.sin(wa) * 12);
  ctx.lineTo(wx + Math.cos(wa + 2.5) * 10, wy + Math.sin(wa + 2.5) * 10);
  ctx.lineTo(wx + Math.cos(wa - 2.5) * 10, wy + Math.sin(wa - 2.5) * 10);
  ctx.closePath();
  ctx.fill();
  text(ctx, 'WIND', wx, wy + 26, 10, '#7dd3fc', 'center', 'rgba(7,18,30,0.85)');
  ctx.restore();
}

function drawPills(ctx, world) {
  // Always-visible WIN / LOSE lines, flanking the top of the ring.
  ctx.save();
  ctx.fillStyle = 'rgba(7, 18, 30, 0.85)';
  rr(ctx, 402, 10, 232, 32, 16); ctx.fill();
  ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 2; ctx.stroke();
  textB(ctx, 'WIN', 414, 31, 16, '#4ade80', 'left');
  text(ctx, world.blizzard === BLIZZARDS ? 'Break the Giant' : `Survive 7 blizzards`, 452, 31, 13, '#f8fafc', 'left');
  ctx.fillStyle = 'rgba(7, 18, 30, 0.85)';
  rr(ctx, 646, 10, 232, 32, 16); ctx.fill();
  ctx.strokeStyle = '#f87171'; ctx.lineWidth = 2; ctx.stroke();
  textB(ctx, 'LOSE', 658, 31, 16, '#f87171', 'left');
  text(ctx, 'All houses fall · 15 lost', 700, 31, 13, '#f8fafc', 'left');
  ctx.restore();
}

function drawBossBar(ctx, world) {
  if (world.blizzard !== BLIZZARDS && !world.eye.active) return;
  const x = 440;
  const y = 44;
  const w = 400;
  const h = 34;
  ctx.save();
  ctx.fillStyle = 'rgba(7, 18, 30, 0.88)';
  rr(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = '#818cf8';
  ctx.lineWidth = 2;
  ctx.stroke();
  const a = world.assets;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + 20, y + 17, 13, 0, Math.PI * 2);
  ctx.clip();
  if (a && a.giant) ctx.drawImage(a.giant, x + 7, y + 1, 26, 39);
  else { ctx.fillStyle = '#c7d2fe'; ctx.fillRect(x + 7, y + 4, 26, 26); }
  ctx.restore();
  text(ctx, world.bossDefeated ? 'WHITE GIANT — BROKEN' : 'WHITE GIANT — STORM EYE', x + 40, y + 15, 14, '#e0e7ff', 'left');
  text(ctx, world.bossDefeated ? 'hold until the storm ends' : `pushed back ${world.eye.pushes}/3`, x + 40, y + 29, 10, '#a5b4fc', 'left');
  // push pips
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < world.eye.pushes ? '#818cf8' : 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.arc(x + w - 18 - i * 20, y + 17, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawThreats(ctx, world) {
  tablet(ctx, TL, '⚠  INCOMING THREATS');
  const phase = phaseOf(world);
  const danger = world.slopes.filter((s) => s.pack >= 70).length;
  const critical = world.slopes.filter((s) => s.pack >= 90).length;
  const rows = [
    { icon: '❄', name: 'Avalanche', sub: `${danger} slopes deep · ${critical} critical`, frac: danger / 8, color: '#f97316' },
    { icon: '🌨', name: 'Blizzard', sub: `${world.blizzard} of 7 — ${phase.name.toLowerCase()} now`, frac: world.blizzard / 7, color: '#7dd3fc' },
    { icon: '🧊', name: 'Icefall', sub: critical > 0 ? `${critical} slopes about to break` : 'slopes holding, for now', frac: critical / 8, color: '#38bdf8' },
    { icon: '🌫', name: 'Whiteout', sub: phase.id === 'whiteout' ? 'ACTIVE — visibility down' : `next phase in ${Math.ceil(world.phaseTimer)}s`, frac: phase.id === 'whiteout' ? 1 : 0.3, color: '#cbd5e1' },
    { icon: '🐺', name: 'Wolves', sub: world.wolves.length > 0 ? `${world.wolves.length} on the mountain — click to scare` : 'in the treeline, waiting', frac: world.wolves.length / 5, color: '#a78bfa' },
  ];
  let y = TL.y + 46;
  for (const r of rows) {
    text(ctx, r.icon, TL.x + 10, y + 10, 14, '#fff', 'left');
    text(ctx, r.name, TL.x + 32, y + 8, 13, '#f8fafc', 'left');
    text(ctx, r.sub, TL.x + 32, y + 21, 10, '#cbd5e1', 'left');
    bar(ctx, TL.x + 216, y + 4, 66, 7, r.frac, r.color);
    y += 28;
  }
  const nextPhase = ['calm', 'snowfall', 'whiteout', 'clear'][(world.phaseIndex + 1) % 4].toUpperCase();
  const windDeg = Math.round(((world.windAngle % 360) + 360) % 360);
  text(ctx, `NEXT: ${nextPhase} ${Math.ceil(world.phaseTimer)}s · WIND ${windDeg}°`, TL.x + 10, TL.y + TL.h - 8, 10, '#7dd3fc', 'left');
}

function drawRescue(ctx, world) {
  tablet(ctx, TR, '🏠  VILLAGE RESCUE');
  const v = world.villagers;
  const alive = housesAlive(world);
  const rows = [
    { name: 'Evacuated', n: v.evacuated, color: '#4ade80' },
    { name: 'Protected', n: v.protected, color: '#7dd3fc' },
    { name: 'At risk', n: v.atRisk, color: '#fbbf24' },
    { name: 'Lost', n: v.lost, color: '#f87171' },
  ];
  let y = TR.y + 46;
  for (const r of rows) {
    text(ctx, r.name, TR.x + 12, y, 13, '#f8fafc', 'left');
    bar(ctx, TR.x + 110, y - 10, 120, 8, Math.min(1, r.n / 50), r.color);
    text(ctx, `${r.n} / ${v.total}`, TR.x + 238, y, 13, '#fff', 'left');
    y += 23;
  }
  text(ctx, `HOUSES  ${alive} / 10 standing`, TR.x + 12, y + 1, 12, '#f8fafc', 'left');
  const hpFrac = world.houses.reduce((a, h) => a + Math.max(0, h.hp), 0) / 1000;
  bar(ctx, TR.x + 12, y + 9, 200, 8, hpFrac, '#f59e0b');
  text(ctx, `WARMTH  ${Math.round(world.warmth)}°`, TR.x + 12, y + 31, 12, world.warmth < 30 ? '#fca5a5' : '#f8fafc', 'left');
  bar(ctx, TR.x + 12, y + 39, 200, 8, world.warmth / 100, world.warmth < 30 ? '#ef4444' : '#fbbf24');
  text(ctx, world.buried.length > 0 ? `⚠ ${world.buried.length} BURIED — CLICK TO RESCUE` : 'No one buried. The village breathes.', TR.x + 12, TR.y + TR.h - 8, 11, world.buried.length > 0 ? '#fca5a5' : '#86efac', 'left');
}

function drawBuild(ctx, world) {
  const sel = world.slopes[world.selectedSlope];
  tablet(ctx, BL, `🔨  BUILD  —  SLOPE ${sel.name}`);
  let y = BL.y + 46;
  for (const b of BUILD) {
    const afford = (!b.cost.wood || world.wood >= b.cost.wood) && (!b.cost.food || world.food >= b.cost.food);
    ctx.fillStyle = afford ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)';
    rr(ctx, BL.x + 8, y - 13, BL.w - 16, 26, 6);
    ctx.fill();
    ctx.fillStyle = '#7dd3fc';
    rr(ctx, BL.x + 14, y - 10, 20, 20, 5);
    ctx.fill();
    text(ctx, b.key, BL.x + 24, y + 5, 13, '#0b1c2c', 'center');
    textB(ctx, b.name, BL.x + 42, y + 4, 13, afford ? '#f8fafc' : '#64748b', 'left');
    text(ctx, b.desc, BL.x + 42, y + 16, 10, '#94a3b8', 'left');
    const cost = b.cost.wood ? `🪵${b.cost.wood}` : `🍞${b.cost.food}`;
    text(ctx, cost, BL.x + BL.w - 14, y + 5, 13, afford ? '#7dd3fc' : '#ef4444', 'right');
    y += 29;
  }
  text(ctx, 'SPACE horn · H stoke hearth · R rescue · P pause · M mute', BL.x + 10, BL.y + BL.h - 8, 11, '#7dd3fc', 'left');
}

function drawWeather(ctx, world) {
  const phase = phaseOf(world);
  tablet(ctx, BR, '🌦  WEATHER & STORES');
  const px = BR.x + 12;
  let y = BR.y + 48;
  text(ctx, `${phase.name} — BLIZZARD ${world.blizzard}/7`, px, y, 14, '#f8fafc', 'left');
  const phaseFrac = 1 - world.phaseTimer / phase.dur;
  bar(ctx, px + 210, y - 11, 150, 8, phaseFrac, '#7dd3fc');
  text(ctx, world.finalStand ? 'FINAL STAND' : `${Math.ceil(world.blizzardTimer)}s left`, BR.x + BR.w - 12, y, 12, '#7dd3fc', 'right');
  y += 24;
  // resources
  const res = [
    { icon: '🪵', name: 'WOOD', n: world.wood },
    { icon: '🍞', name: 'FOOD', n: world.food },
    { icon: '🔥', name: 'WARMTH', n: `${Math.round(world.warmth)}°` },
  ];
  for (const r of res) {
    text(ctx, `${r.icon} ${r.name}`, px, y, 13, '#f8fafc', 'left');
    textB(ctx, String(r.n), px + 150, y, 15, '#fff', 'left');
    y += 22;
  }
  // combo + grade + score
  const mult = multFor(world.combo);
  textB(ctx, `COMBO  x${mult.toFixed(2)}`, px, y + 2, 15, '#7dd3fc', 'left');
  bar(ctx, px + 130, y - 8, 110, 8, world.comboTimer / 6, '#7dd3fc');
  text(ctx, `chain ${world.combo}`, px + 250, y + 2, 11, '#cbd5e1', 'left');
  // grade badge
  const grade = gradeFor(world.score);
  ctx.fillStyle = grade === 'S' ? '#e0f2fe' : grade === 'A' ? '#4ade80' : '#7dd3fc';
  ctx.beginPath();
  ctx.arc(BR.x + BR.w - 46, y - 2, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0b1c2c';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, grade, BR.x + BR.w - 46, y + 6, 22, '#0b1c2c', 'center');
  text(ctx, 'GRADE', BR.x + BR.w - 46, y + 34, 9, '#cbd5e1', 'center');
  y += 30;
  text(ctx, 'SCORE', px, y, 11, '#94a3b8', 'left');
  textB(ctx, world.score.toLocaleString('en-US'), px + 60, y, 18, '#fff', 'left');
  text(ctx, 'BEST', px + 200, y, 11, '#94a3b8', 'left');
  textB(ctx, Math.max(world.best, world.score).toLocaleString('en-US'), px + 240, y, 18, '#7dd3fc', 'left');
  text(ctx, world.audioMuted ? 'SOUND OFF [M]' : 'SOUND ON [M]', BR.x + BR.w - 12, BR.y + BR.h - 8, 11, '#7dd3fc', 'right');
}

function drawLog(ctx, world) {
  if (world.log.length === 0) return;
  const x = 452;
  const y = 668;
  const w = 376;
  const h = 40;
  ctx.save();
  ctx.fillStyle = 'rgba(7, 18, 30, 0.8)';
  rr(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const fit = (s) => {
    ctx.font = `11px ${FONT}`;
    let t = s;
    while (t.length > 0 && ctx.measureText(t).width > w - 20) t = t.slice(0, -1);
    return t.length < s.length ? t.slice(0, -1) + '…' : t;
  };
  text(ctx, fit(world.log[0] || ''), x + 10, y + 15, 11, '#f8fafc', 'left');
  if (world.log[1]) text(ctx, fit(world.log[1]), x + 10, y + 31, 11, '#94a3b8', 'left');
  ctx.restore();
  ctx.restore();
}

function drawBanner(ctx, world) {
  if (world.bannerTimer <= 0 || !world.banner) return;
  const w = 560;
  const x = CX - w / 2;
  const y = 84;
  ctx.save();
  ctx.fillStyle = 'rgba(7, 18, 30, 0.88)';
  rr(ctx, x, y, w, 30, 15);
  ctx.fill();
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.55)';
  ctx.lineWidth = 2;
  ctx.stroke();
  gradText(ctx, world.banner, CX, y + 20, 14,
    [[0, '#ffffff'], [0.55, '#e8f4ff'], [1, '#9cc8ee']], 'center', 'rgba(90,160,255,0.45)', 14);
  ctx.restore();
}

function drawFloats(ctx, world) {
  for (const f of world.floats) {
    const alpha = Math.max(0, Math.min(1, f.life / 0.6));
    ctx.globalAlpha = alpha;
    textB(ctx, f.text, f.x, f.y, f.size || 16, f.color, 'center', 'rgba(7,18,30,0.9)');
    ctx.globalAlpha = 1;
  }
}

// Subtle always-on edge fog (v2 mid-play): the board's cold haze, distinct
// from the heavy whiteout-phase fog in drawWhiteout.
function drawFog(ctx) {
  const g = ctx.createRadialGradient(CX, CY, 300, CX, CY, 620);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.07)');
  g.addColorStop(1, 'rgba(255,255,255,0.13)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawSnow(ctx, world) {
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  let i = 0;
  for (const p of world.particles) {
    if (p.kind !== 'snow') continue;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    // Every third flake drags a short wind streak behind it.
    if (i % 3 === 0) {
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - 4, p.y - 9);
      ctx.stroke();
    }
    i += 1;
  }
}

function drawWhiteout(ctx, world) {
  if (phaseOf(world).id !== 'whiteout' || world.screen !== SCREEN_PLAY) return;
  const g = ctx.createRadialGradient(CX, CY, 120, CX, CY, 620);
  g.addColorStop(0, 'rgba(226, 232, 240, 0.05)');
  g.addColorStop(1, 'rgba(226, 232, 240, 0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// --- full screens -----------------------------------------------------------

// --- title-screen panels (v2, B1 Split) -------------------------------------
// Navy Solid panel: icy gradient, ice border, frost sheen on the top edge,
// snowflake crystals in the empty space (corner + big watermark).
function titlePanel(ctx, x, y, w, h) {
  ctx.save();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, 'rgba(13,48,80,0.78)');
  g.addColorStop(1, 'rgba(5,17,32,0.66)');
  ctx.fillStyle = g;
  rr(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(147,197,253,0.55)';
  ctx.stroke();
  // frost sheen — snow sitting on the panel's top edge
  ctx.save();
  rr(ctx, x, y, w, h, 14);
  ctx.clip();
  const sheen = ctx.createLinearGradient(0, y, 0, y + 12);
  sheen.addColorStop(0, 'rgba(255,255,255,0.30)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(x, y, w, 12);
  ctx.restore();
  // crystals: corner pair + big watermark bottom-right
  flake(ctx, x + w - 27, y + 23, 13, 0.55);
  flake(ctx, x + w - 42, y + 48, 8, 0.45);
  flake(ctx, x + w - 47, y + h - 45, 39, 0.24);
  ctx.restore();
}

function titlePanelHeading(ctx, x, y, w, label) {
  flake(ctx, x + 28, y + 24, 10, 1);
  textB(ctx, label, x + 46, y + 34, 20, '#e0f2fe', 'left');
  ctx.strokeStyle = 'rgba(125,211,252,0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 20, y + 43);
  ctx.lineTo(x + w - 20, y + 43);
  ctx.stroke();
}

function drawTitle(ctx, world) {
  // v7: dramatic key-art background (rescuer, avalanche, village, wolves,
  // moon) full-bleed + three-layer navy readability shade, light snow.
  const a = world.assets;
  if (a && a.title) ctx.drawImage(a.title, 0, 0, W, H);
  else { ctx.fillStyle = '#050e1c'; ctx.fillRect(0, 0, W, H); }
  const vShade = ctx.createLinearGradient(0, 0, 0, H);
  vShade.addColorStop(0, 'rgba(4,12,24,0.55)');
  vShade.addColorStop(0.16, 'rgba(4,12,24,0.22)');
  vShade.addColorStop(0.42, 'rgba(4,12,24,0.12)');
  vShade.addColorStop(0.72, 'rgba(4,12,24,0.32)');
  vShade.addColorStop(1, 'rgba(4,12,24,0.58)');
  ctx.fillStyle = vShade;
  ctx.fillRect(0, 0, W, H);
  const hShade = ctx.createLinearGradient(0, 0, W, 0);
  hShade.addColorStop(0, 'rgba(4,12,24,0.62)');
  hShade.addColorStop(0.3, 'rgba(4,12,24,0.28)');
  hShade.addColorStop(0.5, 'rgba(4,12,24,0.10)');
  hShade.addColorStop(0.7, 'rgba(4,12,24,0.28)');
  hShade.addColorStop(1, 'rgba(4,12,24,0.62)');
  ctx.fillStyle = hShade;
  ctx.fillRect(0, 0, W, H);
  const vig = ctx.createRadialGradient(CX, CY, 360, CX, CY, 720);
  vig.addColorStop(0, 'rgba(4,12,24,0)');
  vig.addColorStop(1, 'rgba(4,12,24,0.42)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
  // light falling snow over the key art
  ctx.fillStyle = '#ffffff';
  const dots = [[80, 120, 3, 0.5], [260, 210, 3, 0.4], [480, 170, 4, 0.5], [700, 200, 3, 0.4], [900, 180, 3, 0.5], [1100, 150, 4, 0.4], [1200, 90, 3, 0.6], [40, 240, 3, 0.6], [1240, 260, 3, 0.6], [60, 420, 2, 0.5], [1220, 430, 2, 0.5], [100, 660, 3, 0.6], [1140, 680, 3, 0.6], [640, 690, 2, 0.6]];
  for (const [dx, dy, dr, da] of dots) {
    ctx.globalAlpha = da;
    ctx.beginPath();
    ctx.arc(dx, dy, dr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  ctx.translate(120, 150);
  ctx.rotate(-16 * Math.PI / 180);
  ctx.globalAlpha = 0.25;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(420, 0); ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  ctx.translate(760, 110);
  ctx.rotate(-16 * Math.PI / 180);
  ctx.globalAlpha = 0.2;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(360, 0); ctx.stroke();
  ctx.restore();

  // Content-count strip: every number is a real count from config.js
  // (8 slopes, 7 blizzards, 5 threats, 5 build tools, 9 upgrades).
  ctx.fillStyle = 'rgba(5, 17, 32, 0.70)';
  rr(ctx, CX - 430, 24, 860, 30, 15); ctx.fill();
  ctx.strokeStyle = 'rgba(125,211,252,0.40)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.letterSpacing = '1px';
  textB(ctx, '8 SLOPES  ·  7 BLIZZARDS  ·  5 HAZARDS  ·  5 TOOLS  ·  9 UPGRADES  ·  THE WHITE GIANT', CX, 44, 15, '#7dd3fc', 'center');
  ctx.letterSpacing = '0px';

  // Left column (centre x=302): logo, PLAY, BEST + promise pills.
  if (a && a.logo) {
    const lw = 380;
    const lh = lw * (a.logo.height / a.logo.width);
    ctx.drawImage(a.logo, 302 - lw / 2, 60, lw, lh);
  } else {
    // Stacked wordmark fallback, Bungee: frosty-white WHITE over deep
    // icy-blue OUT, both lines the same width.
    const logo = fitStackedLogo(ctx);
    const lx = 302 - logo.widthW / 2;
    const baseW = 60 + Math.ceil(logo.sizeW * 0.72);
    const baseO = baseW + STACKED_GAP + Math.ceil(logo.sizeO * 0.72);
    logoPart(ctx, 'WHITE', lx, baseW, logo.sizeW,
      [[0, '#ffffff'], [0.55, '#dbeafe'], [1, '#bae6fd']],
      '#1e293b', 'rgba(7,18,30,0.9)', LOGO_FONT);
    ctx.letterSpacing = `${logo.lsO}px`;
    logoPart(ctx, 'OUT', lx, baseO, logo.sizeO,
      [[0, '#7dd3fc'], [0.55, '#38bdf8'], [1, '#1d4ed8']],
      '#1e3a8a', 'rgba(7,18,30,0.9)', LOGO_FONT);
    ctx.letterSpacing = '0px';
    ctx.letterSpacing = '4px';
    text(ctx, 'HOLD • RESCUE • SURVIVE', 302, baseO + 40, 19, '#ffffff', 'center', 'rgba(7,18,30,0.9)');
    ctx.letterSpacing = '0px';
  }

  // PLAY button: blue gradient, Bungee, white text.
  const playGrad = ctx.createLinearGradient(0, 355, 0, 411);
  playGrad.addColorStop(0, '#38bdf8');
  playGrad.addColorStop(1, '#0369a1');
  ctx.fillStyle = playGrad;
  rr(ctx, 172, 355, 260, 56, 12); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.stroke();
  textB(ctx, '▶  PLAY', 302, 393, 28, '#ffffff', 'center');

  // BEST + promise pills, stacked under PLAY.
  const pill = (y, label, star) => {
    ctx.font = `15px ${FONT}`;
    const tw = ctx.measureText(label).width + (star ? 20 : 0);
    const w = tw + 44;
    const x = 302 - w / 2;
    ctx.fillStyle = 'rgba(5, 17, 32, 0.70)';
    rr(ctx, x, y, w, 30, 15); ctx.fill();
    ctx.strokeStyle = 'rgba(125,211,252,0.45)'; ctx.lineWidth = 1; ctx.stroke();
    if (star) text(ctx, '★', 302 - tw / 2, y + 20, 15, '#7dd3fc', 'left');
    text(ctx, label, 302 - tw / 2 + (star ? 20 : 0), y + 20, 15, '#e0f2fe', 'left');
  };
  pill(425, `BEST ${Math.max(world.best, 0).toLocaleString('en-US')}`, true);
  pill(465, '7 BLIZZARDS · 1 GIANT', false);

  // Right column: HOW TO PLAY + WIN·LOSE panels (620x260 each).
  const px = 548;
  const pw = 620;
  const ph = 260;
  // Panel 1: how to play.
  titlePanel(ctx, px, 60, pw, ph);
  titlePanelHeading(ctx, px, 60, pw, 'HOW TO PLAY');
  const howLines = [
    ['CLICK A SLOPE — ', 'bleed the snowpack before it hits 100 and the slope lets go.'],
    ['CLICK WOLF · BURIED · HOUSE — ', 'scare the pack, dig out the buried, stoke the fire.'],
    ['KEYS 1–5 · SPACE — ', 'raise walls, sound the horn, hold the storm, hush the wind.'],
    ['BETWEEN BLIZZARDS — ', 'draft 1 of 3, then drive the storm\u2019s eye 3×.'],
  ];
  let hy = 60 + 70;
  for (const [verb, rest] of howLines) {
    ctx.font = `15px ${FONT}`;
    text(ctx, verb, px + 20, hy, 15, '#7dd3fc', 'left');
    const vw = ctx.measureText(verb).width;
    text(ctx, rest, px + 20 + vw, hy, 15, '#e2e8f0', 'left');
    hy += 24;
  }
  // P / M key chips.
  const chip = (x, label, bold) => {
    ctx.font = `11px ${LOGO_FONT}`;
    const w = ctx.measureText(label).width + ctx.measureText(bold).width + 34;
    ctx.fillStyle = 'rgba(5,17,32,0.55)';
    rr(ctx, x, 60 + 176, w, 26, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(125,211,252,0.5)'; ctx.lineWidth = 1; ctx.stroke();
    flake(ctx, x + 12, 60 + 189, 5.5, 1);
    textB(ctx, bold, x + 24, 60 + 194, 11, '#7dd3fc', 'left');
    ctx.font = `11px ${LOGO_FONT}`;
    textB(ctx, label, x + 24 + ctx.measureText(bold).width + 4, 60 + 194, 11, '#e0f2fe', 'left');
    return w;
  };
  const cw1 = chip(px + 20, 'PAUSE', 'P');
  chip(px + 20 + cw1 + 10, 'MUTE', 'M');

  // Panel 2: win / lose + features.
  titlePanel(ctx, px, 340, pw, ph);
  titlePanelHeading(ctx, px, 340, pw, 'WIN  ·  LOSE');
  text(ctx, 'WIN — ride out all 7 blizzards and break the White Giant.', px + 20, 340 + 70, 15, '#34d399', 'left');
  text(ctx, 'LOSE — every house falls silent, or 15 villagers are lost to the snow.', px + 20, 340 + 94, 15, '#f87171', 'left');
  flake(ctx, px + 28, 340 + 118, 7.5, 1);
  textB(ctx, 'WHAT MAKES IT WHITEOUT', px + 46, 340 + 128, 15, '#7dd3fc', 'left');
  const feats = [
    'Snowpack depth on every slope — the mountain is the enemy, and it keeps piling on.',
    'Warmth & hearths: forget a house and its fire dies in the cold.',
    'Rescue teams, shifting weather, wolves hunting through the whiteout.',
    'The White Giant waits past the seventh blizzard — break him or freeze.',
  ];
  let fy = 340 + 152;
  for (const f of feats) {
    text(ctx, '✦  ' + f, px + 20, fy, 14, '#e2e8f0', 'left');
    fy += 22;
  }

  text(ctx, 'CLICK PLAY OR PRESS ENTER  ·  SEED 20261117  ·  SOUND ON [M]', CX, 700, 12, '#94a3b8', 'center');
  // (John 2026-11-17: no mountain anywhere on the title screen — the
  // White Giant medallion photo and the circular-mountain thumbnail are
  // both gone. The mountain itself still lives in the play screen.)
  // Phase 2 will add the difficulty select in the empty left-column space
  // below the pills (y≈530–560).
}

// One icon + one header-band color per upgrade family (ids from config.js).
const DRAFT_ICONS = {
  roots: '🌲', hearth: '🔥', ropes: '🪢', eyes: '👁', sense: '🌨',
  stock: '📦', walls: '🧱', choir: '🔔', charm: '❄',
};
const DRAFT_COLORS = {
  roots: '#16a34a', hearth: '#f59e0b', ropes: '#0d9488', eyes: '#8b5cf6', sense: '#38bdf8',
  stock: '#eab308', walls: '#64748b', choir: '#ec4899', charm: '#7dd3fc',
};
const DRAFT_FAMILY = {
  roots: 'SLOPE', hearth: 'HEARTH', ropes: 'RESCUE', eyes: 'WOLVES', sense: 'SLOPE',
  stock: 'STORES', walls: 'HOUSES', choir: 'WOLVES', charm: 'RELEASE',
};

function drawDraft(ctx, world) {
  ctx.fillStyle = 'rgba(7, 18, 30, 0.55)';
  ctx.fillRect(0, 0, W, H);
  gradText(ctx, 'THE THAW', CX, 92, 54,
    [[0, '#ffffff'], [0.55, '#e8f4ff'], [1, '#9cc8ee']], 'center', 'rgba(90,160,255,0.55)', 24);
  text(ctx, `BLIZZARD ${world.draftFromBlizzard} SURVIVED — THE SNOW PAUSES. CHOOSE ONE UPGRADE.`, CX, 128, 17, '#e2e8f0', 'center', 'rgba(7,18,30,0.85)');
  text(ctx, `SCORE ${world.score.toLocaleString('en-US')}  ·  HOUSES ${housesAlive(world)}/10  ·  LOST ${world.villagers.lost}  ·  WOOD ${world.wood}  ·  FOOD ${world.food}`, CX, 156, 16, '#7dd3fc', 'center', 'rgba(7,18,30,0.85)');
  const cw = 300;
  const ch = 330;
  const gap = 30;
  const total = cw * 3 + gap * 2;
  let x = CX - total / 2;
  const y = 190;
  world.draftChoices.forEach((c, i) => {
    const band = DRAFT_COLORS[c.id] || '#f59e0b';
    const icon = DRAFT_ICONS[c.id] || '❄';
    const family = DRAFT_FAMILY[c.id] || 'UPGRADE';
    ctx.fillStyle = 'rgba(15, 32, 52, 0.95)';
    rr(ctx, x, y, cw, ch, 14); ctx.fill();
    ctx.strokeStyle = band; ctx.lineWidth = 2.5; ctx.stroke();
    // Color-coded header band.
    ctx.fillStyle = band;
    rr(ctx, x, y, cw, 46, 14); ctx.fill();
    ctx.fillRect(x, y + 32, cw, 14);
    textB(ctx, `◆  ${family}  ◆`, x + cw / 2, y + 30, 14, '#0b1c2c', 'center');
    // One large icon in an ice-ringed circle — ~1/3 of the card height.
    ctx.fillStyle = 'rgba(7, 18, 30, 0.9)';
    ctx.beginPath(); ctx.arc(x + cw / 2, y + 118, 50, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#bae6fd'; ctx.lineWidth = 3; ctx.stroke();
    text(ctx, icon, x + cw / 2, y + 118, 44, '#fff', 'center', null, 'middle');
    textB(ctx, c.name, x + cw / 2, y + 198, 22, '#f8fafc', 'center');
    ctx.strokeStyle = 'rgba(125,211,252,0.4)';
    ctx.beginPath(); ctx.moveTo(x + 30, y + 214); ctx.lineTo(x + cw - 30, y + 214); ctx.stroke();
    // wrap description
    const words = c.desc.split(' ');
    let line = '';
    let ly = y + 244;
    for (const w of words) {
      if ((line + ' ' + w).trim().length > 30) {
        text(ctx, line.trim(), x + cw / 2, ly, 13, '#e2e8f0', 'center');
        line = w;
        ly += 22;
      } else line += ' ' + w;
    }
    if (line.trim()) text(ctx, line.trim(), x + cw / 2, ly, 13, '#e2e8f0', 'center');
    text(ctx, `PRESS ${i + 1} OR CLICK`, x + cw / 2, y + ch - 22, 12, '#7dd3fc', 'center');
    x += cw + gap;
  });
  // NEXT teaser strip: the real next blizzard (banner text + storehouse bonus
  // from startBlizzard: wood 8+n, food +6).
  const next = world.draftFromBlizzard + 1;
  ctx.fillStyle = 'rgba(7, 18, 30, 0.8)';
  rr(ctx, CX - 380, 532, 760, 32, 16); ctx.fill();
  ctx.strokeStyle = '#7dd3fc'; ctx.lineWidth = 2; ctx.stroke();
  text(ctx, next === BLIZZARDS
    ? `NEXT: BLIZZARD 7 — THE WHITE GIANT WAKES  ·  WOOD +${8 + next}  ·  FOOD +6`
    : `NEXT: BLIZZARD ${next} — THE SNOW DEEPENS  ·  WOOD +${8 + next}  ·  FOOD +6`, CX, 553, 15, '#e0f2fe', 'center');
  text(ctx, 'The next blizzard starts the moment you choose. The mountain does not wait.', CX, 592, 14, '#94a3b8', 'center');
}

// Title-screen-style background for the results screen (v2): navy
// gradient, aurora band, snowdrift waves, wind streaks, snow dots, corner
// crystals. No village photo.
function drawTitleBg(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#050e1c');
  g.addColorStop(0.55, '#0a2540');
  g.addColorStop(1, '#0d3050');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // aurora band
  ctx.save();
  ctx.translate(640, 71);
  ctx.rotate(-2.5 * Math.PI / 180);
  ctx.filter = 'blur(26px)';
  const ag = ctx.createLinearGradient(-550, 0, 550, 0);
  ag.addColorStop(0, 'rgba(94,234,212,0)');
  ag.addColorStop(0.3, 'rgba(94,234,212,0.30)');
  ag.addColorStop(0.62, 'rgba(167,139,250,0.26)');
  ag.addColorStop(1, 'rgba(94,234,212,0)');
  ctx.fillStyle = ag;
  ctx.fillRect(-550, -45, 1100, 90);
  ctx.restore();
  ctx.filter = 'none';
  // snowdrift waves at the bottom
  ctx.fillStyle = 'rgba(186,230,253,0.10)';
  ctx.beginPath();
  ctx.moveTo(0, 665);
  ctx.quadraticCurveTo(140, 630, 300, 652);
  ctx.quadraticCurveTo(460, 674, 620, 648);
  ctx.quadraticCurveTo(780, 622, 940, 658);
  ctx.quadraticCurveTo(1100, 694, 1280, 640);
  ctx.lineTo(1280, 720);
  ctx.lineTo(0, 720);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(226,232,240,0.13)';
  ctx.beginPath();
  ctx.moveTo(0, 690);
  ctx.quadraticCurveTo(180, 662, 360, 682);
  ctx.quadraticCurveTo(540, 702, 720, 678);
  ctx.quadraticCurveTo(900, 654, 1080, 686);
  ctx.quadraticCurveTo(1260, 718, 1280, 672);
  ctx.lineTo(1280, 720);
  ctx.lineTo(0, 720);
  ctx.closePath();
  ctx.fill();
  // wind streaks
  const streaks = [[120, 150, 420, 0.5], [760, 110, 360, 0.4], [420, 600, 480, 0.45]];
  for (const [sx, sy, sw, sa] of streaks) {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(-16 * Math.PI / 180);
    ctx.globalAlpha = sa;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sw, 0); ctx.stroke();
    ctx.restore();
  }
  // snow dots
  const dots = [[80, 120, 3, 0.5], [170, 60, 2, 0.7], [260, 210, 3, 0.4], [380, 90, 2, 0.8], [480, 170, 4, 0.5], [600, 60, 2, 0.7], [700, 200, 3, 0.4], [800, 80, 2, 0.8], [900, 180, 3, 0.5], [1010, 70, 2, 0.7], [1100, 150, 4, 0.4], [1200, 90, 3, 0.6], [120, 300, 2, 0.4], [1160, 300, 2, 0.4], [220, 470, 3, 0.5], [1060, 470, 3, 0.5], [80, 620, 2, 0.6], [1200, 620, 2, 0.6], [40, 240, 3, 0.6], [60, 420, 2, 0.5], [30, 560, 4, 0.5], [100, 660, 3, 0.6], [1240, 260, 3, 0.6], [1220, 430, 2, 0.5], [1250, 580, 4, 0.5], [1140, 680, 3, 0.6], [200, 90, 2, 0.6], [520, 40, 3, 0.5], [760, 30, 2, 0.7], [980, 100, 3, 0.5], [640, 690, 2, 0.6], [340, 680, 3, 0.5], [900, 690, 3, 0.6], [150, 350, 2, 0.4], [1150, 330, 2, 0.4], [480, 660, 2, 0.5]];
  ctx.fillStyle = '#ffffff';
  for (const [dx, dy, dr, da] of dots) {
    ctx.globalAlpha = da;
    ctx.beginPath();
    ctx.arc(dx, dy, dr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // corner/edge crystals
  const crystals = [[24, 120, 17, 0.28, 15], [1180, 110, 20, 0.25, -20], [36, 330, 11, 0.35, 40], [1210, 330, 12, 0.32, -35], [90, 640, 13, 0.3, 10], [1140, 640, 14, 0.28, -15], [560, 64, 9, 0.3, 25], [700, 44, 8, 0.35, -30], [250, 660, 10, 0.3, 45], [980, 660, 9, 0.32, -40]];
  for (const [cx2, cy2, cr, ca, rot] of crystals) {
    ctx.save();
    ctx.translate(cx2, cy2);
    ctx.rotate(rot * Math.PI / 180);
    flake(ctx, 0, 0, cr, ca);
    ctx.restore();
  }
}

function drawEnd(ctx, world, won) {
  drawTitleBg(ctx);
  const r = world.result || { score: 0, best: 0, grade: 'D', blizzard: 1, releases: 0, rescues: 0, wolves: 0, avalanches: 0, houses: 0, lost: 0 };
  gradText(ctx, won ? 'THE VILLAGE STANDS' : 'THE SNOW WINS', CX, 96, 64,
    [[0, '#ffffff'], [0.55, '#e8f4ff'], [1, '#9cc8ee']], 'center', 'rgba(90,160,255,0.55)', 26);
  text(ctx, won ? 'Seven blizzards. One broken Giant. Every hearth still lit.' : world.loseReason || 'The mountain keeps what it takes.', CX, 134, 17, '#e2e8f0', 'center', 'rgba(7,18,30,0.85)');
  // Grade badge + score: ice grade circle, Bungee score with an ice glow.
  const gg = ctx.createLinearGradient(0, 140, 0, 264);
  gg.addColorStop(0, '#ffffff');
  gg.addColorStop(0.55, '#bae6fd');
  gg.addColorStop(1, '#7dd3fc');
  ctx.save();
  ctx.shadowColor = 'rgba(125,211,252,0.45)';
  ctx.shadowBlur = 28;
  ctx.fillStyle = gg;
  ctx.beginPath(); ctx.arc(CX - 190, 202, 62, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#bae6fd'; ctx.lineWidth = 4; ctx.stroke();
  textB(ctx, r.grade, CX - 190, 222, 67, '#0b1c2c', 'center');
  text(ctx, 'GRADE', CX - 190, 282, 13, '#cbd5e1', 'center');
  gradText(ctx, r.score.toLocaleString('en-US'), CX + 40, 222, 67,
    [[0, '#ffffff'], [1, '#ffffff']], 'center', 'rgba(125,211,252,0.9)', 26);
  text(ctx, r.newBest ? '★ NEW BEST ★' : `BEST ${r.best.toLocaleString('en-US')}`, CX + 40, 258, 16, '#7dd3fc', 'center');
  // Stat tiles: same 8 stats, 2 rows of 4, icon + big number per tile.
  const px = 280;
  const py = 300;
  ctx.fillStyle = 'rgba(7, 18, 30, 0.85)';
  rr(ctx, px, py, 720, 148, 12); ctx.fill();
  ctx.strokeStyle = 'rgba(125,211,252,0.5)'; ctx.lineWidth = 2; ctx.stroke();
  const stats = [
    ['BLIZZARDS', '🌨', `${r.blizzard} / 7`],
    ['RELEASES', '❄', String(r.releases)],
    ['RESCUES', '🆘', String(r.rescues)],
    ['WOLVES SCARED', '🐺', String(r.wolves)],
    ['AVALANCHES', '⛰', String(r.avalanches)],
    ['HOUSES LEFT', '🏠', `${r.houses} / 10`],
    ['VILLAGERS LOST', '✖', String(r.lost)],
    ['COMBO BEST', '⚡', `x${multFor(world.bestCombo || 0).toFixed(2)}`],
  ];
  stats.forEach((s, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const tx = px + 6 + col * 180;
    const ty = py + 8 + row * 68;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    rr(ctx, tx, ty, 168, 60, 8); ctx.fill();
    text(ctx, s[0], tx + 84, ty + 17, 10, '#94a3b8', 'center');
    text(ctx, `${s[1]} ${s[2]}`, tx + 84, ty + 46, 24, '#fff', 'center');
  });
  // Per-blizzard mini bar chart — real recorded deltas only; hidden when
  // no per-blizzard data exists (e.g. a loss before any blizzard ended).
  const chart = r.blizzardScores || world.blizzardScores || [];
  if (chart.length > 0) {
    const max = Math.max(...chart, 1);
    text(ctx, 'SCORE PER BLIZZARD', px, 466, 13, '#7dd3fc', 'left');
    const slot = 720 / chart.length;
    chart.forEach((v, i) => {
      const bh = Math.max(4, (v / max) * 40);
      const bx = px + i * slot + (slot - 56) / 2;
      if (i === chart.length - 1) {
        ctx.save();
        ctx.shadowColor = 'rgba(224,242,254,0.55)';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#e0f2fe';
      } else {
        ctx.fillStyle = '#38bdf8';
      }
      rr(ctx, bx, 524 - bh, 56, bh, 4); ctx.fill();
      if (i === chart.length - 1) ctx.restore();
      text(ctx, String(v), bx + 28, 518 - bh, 11, '#f8fafc', 'center');
      text(ctx, String(i + 1), bx + 28, 540, 11, '#94a3b8', 'center');
    });
  }
  // NEXT GOAL — from this run's real numbers only. The game tracks no feats,
  // so no feats checklist is shown (nothing invented).
  const goal = r.lost > 0
    ? `NEXT GOAL — FINISH WITH 0 VILLAGERS LOST  (THIS RUN: ${r.lost})`
    : `NEXT GOAL — BEAT ${r.best.toLocaleString('en-US')}`;
  ctx.fillStyle = 'rgba(125, 211, 252, 0.14)';
  rr(ctx, px, 552, 720, 28, 14); ctx.fill();
  ctx.strokeStyle = '#7dd3fc'; ctx.lineWidth = 1.5; ctx.stroke();
  text(ctx, goal, CX, 571, 14, '#e0f2fe', 'center');
  const againGrad = ctx.createLinearGradient(0, 596, 0, 644);
  againGrad.addColorStop(0, '#38bdf8');
  againGrad.addColorStop(1, '#0369a1');
  ctx.fillStyle = againGrad;
  rr(ctx, CX - 230, 596, 220, 48, 12); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.stroke();
  textB(ctx, '↻  PLAY AGAIN', CX - 120, 626, 20, '#ffffff', 'center');
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  rr(ctx, CX + 10, 596, 220, 48, 12); ctx.fill();
  ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2; ctx.stroke();
  textB(ctx, 'MENU  [ESC]', CX + 120, 626, 20, '#f8fafc', 'center');
  text(ctx, 'CLICK A BUTTON OR PRESS ENTER TO PLAY AGAIN', CX, 664, 12, '#cbd5e1', 'center');
}

function drawPause(ctx, world) {
  ctx.fillStyle = 'rgba(7, 18, 30, 0.66)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, 'PAUSED', CX, 300, 72, '#f8fafc', 'center', 'rgba(7,18,30,0.9)');
  text(ctx, `BLIZZARD ${world.blizzard}/7  ·  SCORE ${world.score.toLocaleString('en-US')}  ·  HOUSES ${housesAlive(world)}/10`, CX, 348, 16, '#7dd3fc', 'center');
  text(ctx, 'CLICK A SLOPE — release snow  ·  CLICK A WOLF — scare it  ·  CLICK BURIED — rescue', CX, 396, 14, '#e2e8f0', 'center');
  text(ctx, 'KEYS 1–5 build  ·  SPACE horn  ·  H stoke  ·  R rescue  ·  M mute', CX, 422, 14, '#e2e8f0', 'center');
  text(ctx, 'P / ESC — RESUME', CX, 468, 16, '#7dd3fc', 'center');
}

// --- hit testing (shared by main.js) ---------------------------------------

export function eyePos(world) {
  const ea = (world.eye.angle * Math.PI) / 180;
  return { x: CX + Math.cos(ea) * world.eye.dist, y: CY + Math.sin(ea) * world.eye.dist };
}

export function hitTest(world, x, y) {
  if (world.screen === SCREEN_TITLE) {
    // v2 split layout: PLAY button at (172, 355, 260, 56) in the left column.
    if (x >= 172 && x <= 432 && y >= 355 && y <= 411) return { kind: 'play' };
    return { kind: 'none' };
  }
  if (world.screen === SCREEN_DRAFT) {
    const cw = 300;
    const gap = 30;
    const total = cw * 3 + gap * 2;
    let bx = CX - total / 2;
    for (let i = 0; i < world.draftChoices.length; i++) {
      if (x >= bx && x <= bx + cw && y >= 190 && y <= 520) return { kind: 'draft', index: i };
      bx += cw + gap;
    }
    return { kind: 'none' };
  }
  if (world.screen === SCREEN_WIN || world.screen === SCREEN_LOSE) {
    if (x >= CX - 230 && x <= CX - 10 && y >= 596 && y <= 644) return { kind: 'play' };
    if (x >= CX + 10 && x <= CX + 230 && y >= 596 && y <= 644) return { kind: 'menu' };
    return { kind: 'none' };
  }
  if (world.screen === SCREEN_PAUSE) return { kind: 'resume' };
  if (world.screen !== SCREEN_PLAY) return { kind: 'none' };

  // Boss eye first (it rides the ring).
  if (world.eye.active && !world.bossDefeated) {
    const e = eyePos(world);
    if (Math.hypot(x - e.x, y - e.y) < 30) return { kind: 'eye' };
  }
  for (const w of world.wolves) {
    if (Math.hypot(x - w.x, y - w.y) < 22) return { kind: 'wolf', wolf: w };
  }
  for (const b of world.buried) {
    if (Math.hypot(x - b.x, y - b.y) < 20) return { kind: 'buried', buried: b };
  }
  for (const h of world.houses) {
    if (!h.dead && Math.hypot(x - h.x, y - h.y) < 18) return { kind: 'house', house: h };
  }
  // Build rows (drawn from BL.y+46, 26 px tall, 29 px pitch — keep in sync
  // with drawBuild).
  if (x >= BL.x && x <= BL.x + BL.w && y >= BL.y + 33 && y <= BL.y + 33 + 5 * 29) {
    const i = Math.floor((y - (BL.y + 33)) / 29);
    if (i >= 0 && i < BUILD.length) return { kind: 'build', index: i };
  }
  // Sound toggle (bottom-right of the weather tablet).
  if (x >= BR.x + BR.w - 120 && x <= BR.x + BR.w && y >= BR.y + BR.h - 24 && y <= BR.y + BR.h) {
    return { kind: 'mute' };
  }
  // Slopes: inside the mountain ring, outside the village.
  const dx = x - CX;
  const dy = y - CY;
  const d = Math.hypot(dx, dy);
  if (d >= 100 && d <= MOUNTAIN_R + 6) {
    let ang = (Math.atan2(dy, dx) * 180) / Math.PI;
    let bestI = 0;
    let bestD = 360;
    for (let i = 0; i < 8; i++) {
      const diff = Math.abs(((ang - SLOPE_ANGLES[i] + 540) % 360) - 180);
      if (diff < bestD) { bestD = diff; bestI = i; }
    }
    if (bestD <= 22.5) return { kind: 'slope', slope: world.slopes[bestI] };
  }
  return { kind: 'none' };
}

// --- main entry --------------------------------------------------------------

export function render(ctx, world) {
  ctx.save();
  if (world.shake > 0) {
    ctx.translate((Math.random() - 0.5) * world.shake * 14, (Math.random() - 0.5) * world.shake * 14);
  }
  if (world.screen === SCREEN_TITLE) {
    drawTitle(ctx, world);
  } else if (world.screen === SCREEN_DRAFT) {
    drawMountain(ctx, world);
    drawStormRing(ctx, world);
    drawPills(ctx, world);
    drawThreats(ctx, world);
    drawRescue(ctx, world);
    drawBuild(ctx, world);
    drawWeather(ctx, world);
    drawWindArrow(ctx, world);
    drawDraft(ctx, world);
  } else if (world.screen === SCREEN_WIN) {
    drawEnd(ctx, world, true);
  } else if (world.screen === SCREEN_LOSE) {
    drawEnd(ctx, world, false);
  } else {
    drawMountain(ctx, world);
    drawFog(ctx);
    drawStormRing(ctx, world);
    drawPills(ctx, world);
    drawBossBar(ctx, world);
    drawThreats(ctx, world);
    drawRescue(ctx, world);
    drawBuild(ctx, world);
    drawWeather(ctx, world);
    drawWindArrow(ctx, world);
    drawLog(ctx, world);
    drawBanner(ctx, world);
    drawWhiteout(ctx, world);
    drawSnow(ctx, world);
    drawFloats(ctx, world);
    if (world.screen === SCREEN_PAUSE) drawPause(ctx, world);
  }
  ctx.restore();
}
