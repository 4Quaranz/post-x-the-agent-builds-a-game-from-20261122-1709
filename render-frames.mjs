// render-frames.mjs — merender semua frame video entri (720x1280, 24 fps, 24 detik)
// dengan Node standard library saja (fs, zlib). Tanpa library gambar, tanpa
// browser: framebuffer RGB digambar piksel demi piksel, lalu dienkode PNG.
//
// Video yang dihasilkan: "Satu prompt. Satu game." — hook, prompt yang diketik,
// agent bekerja di terminal, gameplay Star Catcher yang berjalan, lalu CTA.
// End card resmi make.fun + kode referral dipasang belakangan oleh ffmpeg
// (overlay card-9x16.webm + drawtext), bukan di sini.
//
// Jalankan:  node render-frames.mjs
// Keluaran:  frames/f0000.png ... frames/f0575.png  (576 frame)

import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

export const W = 720;
export const H = 1280;
export const FPS = 24;
export const TOTAL = 576; // 24 detik

// ---- RNG deterministik supaya gameplay di video selalu sama ----
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- Font bitmap 5x7 (huruf kapital, angka, tanda baca) ----
const FONT = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "*": ["00000", "00100", "10101", "01110", "10101", "00100", "00000"],
  ">": ["10000", "01000", "00100", "00010", "00100", "01000", "10000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
};

// ---- PNG encoder (RGB, filter 0, zlib) ----
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}
function encodePNG(rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) rgb.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
  const idat = deflateSync(raw, { level: 6 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- Framebuffer RGB ----
const fb = Buffer.alloc(W * H * 3);
function px(x, y, r, g, b) {
  x |= 0; y |= 0;
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  fb[i] = r; fb[i + 1] = g; fb[i + 2] = b;
}
function fillRect(x, y, w, h, c) {
  x |= 0; y |= 0; w |= 0; h |= 0;
  const x0 = Math.max(0, x), y0 = Math.max(0, y);
  const x1 = Math.min(W, x + w), y1 = Math.min(H, y + h);
  for (let yy = y0; yy < y1; yy++)
    for (let xx = x0; xx < x1; xx++) px(xx, yy, c[0], c[1], c[2]);
}
function fillCircle(cx, cy, r, c) {
  const x0 = Math.max(0, (cx - r) | 0), x1 = Math.min(W - 1, (cx + r) | 0);
  const y0 = Math.max(0, (cy - r) | 0), y1 = Math.min(H - 1, (cy + r) | 0);
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= r * r) px(x, y, c[0], c[1], c[2]);
    }
}
function fillStar(cx, cy, r, rot, c) {
  const x0 = Math.max(0, (cx - r) | 0), x1 = Math.min(W - 1, (cx + r) | 0);
  const y0 = Math.max(0, (cy - r) | 0), y1 = Math.min(H - 1, (cy + r) | 0);
  // uji titik di dalam bintang 5 sudut: pakai radius sudut
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx, dy = y - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > r) continue;
      let ang = Math.atan2(dy, dx) - rot + Math.PI / 2;
      ang = ((ang % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const seg = Math.PI / 5;
      const k = Math.floor(ang / seg);
      const t = (ang % seg) / seg;
      const rEdge = k % 2 === 0 ? r - (r - r * 0.45) * t : r * 0.45 + (r - r * 0.45) * t;
      if (d <= rEdge) px(x, y, c[0], c[1], c[2]);
    }
}
function vgrad(top, bot) {
  for (let y = 0; y < H; y++) {
    const t = y / (H - 1);
    const r = Math.round(top[0] + (bot[0] - top[0]) * t);
    const g = Math.round(top[1] + (bot[1] - top[1]) * t);
    const b = Math.round(top[2] + (bot[2] - top[2]) * t);
    for (let x = 0; x < W; x++) px(x, y, r, g, b);
  }
}
// teks: huruf besar semua, skala s (lebar huruf 5s, tinggi 7s, spasi 1s)
function textWidth(str, s) { return str.length * 6 * s - s; }
function drawText(str, x, y, s, c, align = "left") {
  str = str.toUpperCase();
  if (align === "center") x -= textWidth(str, s) / 2;
  if (align === "right") x -= textWidth(str, s);
  x |= 0; y |= 0;
  for (let ci = 0; ci < str.length; ci++) {
    const g = FONT[str[ci]] || FONT[" "];
    for (let row = 0; row < 7; row++)
      for (let col = 0; col < 5; col++)
        if (g[row][col] === "1")
          fillRect(x + ci * 6 * s + col * s, y + row * s, s, s, c);
  }
}
function wrapText(str, s, maxW) {
  const words = str.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (textWidth(t, s) <= maxW) cur = t;
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ---- Palet ----
const INK = [25, 20, 25];       // #191419
const MAGENTA = [233, 30, 140]; // #e91e8c
const PINK = [255, 93, 177];
const GOLD = [255, 214, 10];
const WHITE = [255, 255, 255];
const DIM = [255, 255, 255];
const GREEN = [48, 209, 88];
const SKY_TOP = [18, 14, 42];
const SKY_BOT = [43, 16, 85];

function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

// ---- Scene A (frame 0-71): hook "SATU PROMPT. SATU GAME." ----
function sceneHook(f) {
  fillRect(0, 0, W, H, INK);
  fillRect(0, 0, W, 14, MAGENTA);
  const a1 = clamp01(f / 12);                    // "SATU PROMPT." masuk
  const a2 = clamp01((f - 24) / 12);             // "SATU GAME." menyusul
  const a3 = clamp01((f - 48) / 12);             // subteks
  if (a1 > 0) {
    const slide = Math.round((1 - a1) * 60);
    drawText("SATU", 60, 430 - slide, 12, WHITE);
    drawText("PROMPT.", 60, 540 - slide, 12, MAGENTA);
  }
  if (a2 > 0) {
    const slide = Math.round((1 - a2) * 60);
    drawText("SATU", 60, 700 - slide, 12, WHITE);
    drawText("GAME.", 60, 810 - slide, 12, GOLD);
  }
  if (a3 > 0) {
    drawText("AI AGENT SAYA YANG BIKIN.", 60, 1010, 4, PINK);
    drawText("SAMBIL SAYA NONTON.", 60, 1060, 4, PINK);
  }
  fillRect(60, 1200, Math.round((f / 71) * 600), 8, MAGENTA); // progress bar
}

// ---- Scene B (frame 72-179): prompt diketik ----
const PROMPT_TEXT = "Buatkan game browser kecil: tangkap bintang jatuh. 60 detik, makin cepat makin seru.";
function scenePrompt(f) {
  const lf = f - 72;
  fillRect(0, 0, W, H, INK);
  fillRect(0, 0, W, 14, MAGENTA);
  drawText("PROMPTNYA CUMA SATU:", 60, 120, 4, PINK);
  // gelembung chat
  fillRect(48, 220, W - 96, 420, [42, 34, 48]);
  fillRect(48, 220, W - 96, 8, MAGENTA);
  fillCircle(110, 290, 26, MAGENTA);
  drawText("K", 110, 268, 6, WHITE, "center");
  drawText("KAMU", 152, 268, 5, WHITE);
  const chars = Math.min(PROMPT_TEXT.length, Math.floor(lf * 1.4));
  const shown = PROMPT_TEXT.slice(0, chars);
  const lines = wrapText(shown, 5, W - 96 - 80);
  lines.forEach((ln, i) => drawText(ln, 88, 350 + i * 48, 5, WHITE));
  if (lf % 24 < 12 && chars < PROMPT_TEXT.length)
    fillRect(88 + textWidth(lines[lines.length - 1] || "", 5), 350 + (lines.length - 1) * 48, 4, 34, GOLD);
  if (chars >= PROMPT_TEXT.length) {
    fillRect(440, 560, 180, 56, MAGENTA);
    drawText("KIRIM >", 530, 578, 5, WHITE, "center");
  }
  drawText("TANPA KODE. TANPA RIBET.", 60, 760, 4, GOLD);
  drawText("SATU KALIMAT JADI GAME.", 60, 820, 4, WHITE);
}

// ---- Scene C (frame 180-299): agent bekerja di terminal ----
const TERM_LINES = [
  "$ hark build --prompt 1-prompt",
  "[OK] prompt dibaca",
  "[OK] game.html ditulis",
  "[OK] playtest: skor naik",
  "[OK] video.mp4 dirender",
  "> game siap. posting?",
];
function sceneTerminal(f) {
  const lf = f - 180;
  fillRect(0, 0, W, H, INK);
  fillRect(0, 0, W, 14, MAGENTA);
  drawText("AGENT BEKERJA:", 60, 120, 4, PINK);
  fillRect(48, 200, W - 96, 560, [13, 13, 18]);
  fillCircle(90, 232, 10, [255, 95, 86]);
  fillCircle(122, 232, 10, [255, 189, 46]);
  fillCircle(154, 232, 10, [39, 201, 63]);
  drawText("HARK - AGENT", 190, 220, 4, [160, 160, 170]);
  for (let i = 0; i < TERM_LINES.length; i++) {
    const start = 8 + i * 18;
    if (lf < start) break;
    const typed = Math.min(TERM_LINES[i].length, Math.floor((lf - start) * 1.6));
    const line = TERM_LINES[i].slice(0, typed);
    const col = TERM_LINES[i].startsWith("[OK]") ? GREEN : TERM_LINES[i].startsWith(">") ? GOLD : WHITE;
    drawText(line, 80, 280 + i * 48, 3, col);
  }
  drawText("0 MENIT NGODING MANUAL.", 60, 860, 4, GOLD);
  drawText("AGENT YANG NGETIK SEMUA.", 60, 920, 4, WHITE);
}

// ---- Scene D (frame 300-491): gameplay berjalan ----
const game = { stars: [], parts: [], basketX: 360, score: 0, combo: 0, lives: 3, spawnIn: 0, rng: null, bgStars: [] };
function gameReset() {
  game.stars = []; game.parts = []; game.basketX = 360;
  game.score = 0; game.combo = 0; game.lives = 3; game.spawnIn = 0;
  game.rng = mulberry32(20261123);
  game.bgStars = [];
  for (let i = 0; i < 60; i++) game.bgStars.push([(game.rng() * W) | 0, (game.rng() * 1000) | 0, game.rng()]);
}
function gameStep() {
  const rng = game.rng;
  game.spawnIn--;
  if (game.spawnIn <= 0) {
    const bomb = rng() < 0.15;
    game.stars.push({ x: 50 + rng() * (W - 100), y: -30, vy: 11 + rng() * 5, rot: rng() * 6, vr: (rng() - 0.5) * 0.2, bomb });
    game.spawnIn = 14 + ((rng() * 8) | 0);
  }
  // keranjang mengejar bintang terendah
  let target = null, bestY = -1;
  for (const s of game.stars) if (!s.bomb && s.y > bestY) { bestY = s.y; target = s; }
  if (target) {
    const dx = target.x - game.basketX;
    game.basketX += Math.max(-11, Math.min(11, dx));
  }
  for (let i = game.stars.length - 1; i >= 0; i--) {
    const s = game.stars[i];
    s.y += s.vy; s.rot += s.vr;
    const nearBasket = s.y > 1100 && s.y < 1180 && Math.abs(s.x - game.basketX) < 100;
    if (nearBasket) {
      if (s.bomb) {
        game.lives = Math.max(0, game.lives - 1); game.combo = 0;
        for (let k = 0; k < 14; k++) game.parts.push({ x: s.x, y: s.y, vx: (rng() - 0.5) * 16, vy: -rng() * 12, life: 14, c: [255, 59, 48] });
      } else {
        game.score++; game.combo++;
        for (let k = 0; k < 12; k++) game.parts.push({ x: s.x, y: s.y, vx: (rng() - 0.5) * 14, vy: -rng() * 10, life: 12, c: GOLD });
      }
      game.stars.splice(i, 1); continue;
    }
    if (s.y > H + 40) { if (!s.bomb) game.combo = 0; game.stars.splice(i, 1); }
  }
  for (let i = game.parts.length - 1; i >= 0; i--) {
    const p = game.parts[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.9; p.life--;
    if (p.life <= 0) game.parts.splice(i, 1);
  }
}
function sceneGameplay(f) {
  if (f === 300) gameReset();
  gameStep();
  vgrad(SKY_TOP, SKY_BOT);
  for (const [sx, sy, ph] of game.bgStars) {
    const tw = 0.35 + 0.65 * Math.abs(Math.sin(f * 0.08 + ph * 6));
    if (tw > 0.6) fillRect(sx, sy, 3, 3, [255, 255, 255]);
  }
  fillCircle(600, 130, 46, GOLD);
  fillCircle(578, 112, 40, SKY_TOP);
  for (const s of game.stars) {
    if (s.bomb) {
      fillCircle(s.x, s.y, 26, [255, 59, 48]);
      drawText("!", s.x - 8, s.y - 22, 6, WHITE);
    } else {
      fillStar(s.x, s.y, 28, s.rot, GOLD);
      fillStar(s.x, s.y, 14, s.rot, [255, 243, 176]);
    }
  }
  for (const p of game.parts) fillCircle(p.x, p.y, 5, p.c);
  // keranjang
  const bx = game.basketX;
  fillRect(bx - 85, 1120, 170, 12, PINK);
  fillRect(bx - 78, 1132, 156, 12, MAGENTA);
  fillRect(bx - 68, 1144, 136, 12, MAGENTA);
  fillRect(bx - 56, 1156, 112, 12, [200, 20, 120]);
  // HUD
  drawText("SKOR " + game.score, 28, 26, 7, WHITE);
  const secLeft = 60 - Math.floor((f - 300) / FPS);
  drawText("0:" + String(secLeft).padStart(2, "0"), W - 28, 26, 7, WHITE, "right");
  for (let i = 0; i < 3; i++) {
    if (i < game.lives) fillCircle(W - 48 - i * 44, 175, 13, MAGENTA);
    else fillCircle(W - 48 - i * 44, 175, 13, [90, 80, 95]);
  }
  if (game.combo >= 3) {
    const pop = 7 + Math.min(3, (f % 12) / 4);
    drawText("COMBO x" + game.combo + "!", W / 2, 170, pop, GOLD, "center");
  }
  drawText("GAME ASLI. BISA DIMAINKAN.", 48, 1220, 4, WHITE);
}

// ---- Scene E (frame 492-575): CTA + tahan untuk end card ----
function sceneCTA(f) {
  fillRect(0, 0, W, H, MAGENTA);
  fillRect(0, 0, W, 14, WHITE);
  drawText("MAU BIKIN", 60, 480, 11, WHITE);
  drawText("GAME JUGA?", 60, 610, 11, GOLD);
  drawText("MAKE.FUN - AGENTMU YANG", 60, 830, 4, WHITE);
  drawText("BANGUN, KAMU YANG MENANG.", 60, 880, 4, WHITE);
  drawText("HADIAH USDC UNTUK ENTRI TERBAIK.", 60, 940, 3, [255, 220, 240]);
}

// ---- Main: render semua frame ----
mkdirSync("frames", { recursive: true });
for (let f = 0; f < TOTAL; f++) {
  if (f < 72) sceneHook(f);
  else if (f < 180) scenePrompt(f);
  else if (f < 300) sceneTerminal(f);
  else if (f < 492) sceneGameplay(f);
  else sceneCTA(f);
  const name = "frames/f" + String(f).padStart(4, "0") + ".png";
  writeFileSync(name, encodePNG(fb));
  if (f % 96 === 0 || f === TOTAL - 1) console.log(`frame ${f + 1}/${TOTAL} -> ${name}`);
}
console.log(`DONE ${TOTAL} frames @ ${W}x${H} ${FPS}fps`);
