// ============================================================
//  주인공 걷기 — hero-edit.png(사용자가 고친 네 방향)에서 다리만 움직여 만든다
//
//    node design/hero/walk.js
//      → design/hero/hero-walk.png          (한 줄에 한 방향: 앞 · 뒤 · 왼쪽 · 오른쪽. 한 줄 4칸 = 서기 · 걸음 A · 서기 · 걸음 B, 한 칸 32×40)
//      → design/hero/hero-walk-preview.png  (움직이는 PNG, 4배 — 네 방향이 나란히 걷는 모습)
//
//  새로 그리는 픽셀은 없습니다. 원래 픽셀을 옮기기만 합니다 — 얼굴 · 몸 픽셀은 그대로고, 몸 전체가 1칸 위아래로만 움직입니다.
//    앞 · 뒤: 한쪽 다리가 들리고(LIFT 칸 짧아짐) 몸이 1칸 올라감. 땅에 닿은 다리는 바지 한 줄을 늘려 땅에 그대로
//    옆:     두 다리가 앞뒤로 벌어지고(먼 다리는 어둡게) 몸이 1칸 내려감
// ============================================================
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const FW = 32, FH = 40, VIEWS = ['front', 'back', 'left', 'right'];
const LIFT = 1;                                   // 앞 · 뒤에서 들린 다리가 짧아지는 칸 수
const FB = { front: { split: 15, dup: 34 }, back: { split: 16, dup: 34 } };   // split: 오른쪽 다리가 시작하는 칸 · dup: 늘리는 바지 줄
const SIDE = { left: { face: 1 }, right: { face: -1 } };          // AI 그림의 이름 그대로 — '왼쪽'은 왼옆이 보이는 모습이라 화면 오른쪽을 봄
const LEG_TOP = 33, SIDE_ROWS = [33, 35, 36, 37], SPREAD = [0, 1, 2, 2], FAR_SHADE = 0.72;

// ---------- PNG 읽기 (필터 0~4 · RGBA/RGB/팔레트/회색, 비월 없음) ----------
function decodePng(buf) {
  let p = 8, W = 0, H = 0, depth = 0, type = 0, plte = null, trns = null; const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), name = buf.toString('latin1', p + 4, p + 8), data = buf.subarray(p + 8, p + 8 + len);
    if (name === 'IHDR') { W = data.readUInt32BE(0); H = data.readUInt32BE(4); depth = data[8]; type = data[9]; if (data[12]) throw new Error('interlaced PNG'); }
    else if (name === 'PLTE') plte = data; else if (name === 'tRNS') trns = data; else if (name === 'IDAT') idat.push(data); else if (name === 'IEND') break;
    p += 12 + len;
  }
  const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type], bpp = Math.max(1, (ch * depth) >> 3), stride = (W * ch * depth + 7) >> 3;
  const raw = zlib.inflateSync(Buffer.concat(idat)), img = Buffer.alloc(stride * H);
  for (let y = 0; y < H; y++) {
    const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), o = y * stride;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? img[o + i - bpp] : 0, b = y ? img[o - stride + i] : 0, c = y && i >= bpp ? img[o - stride + i - bpp] : 0;
      let v = src[i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      img[o + i] = v & 255;
    }
  }
  const out = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = (y * W + x) * 4, o = y * stride;
    const sample = k => { if (depth === 8) return img[o + x * ch + k]; const per = 8 / depth, byte = img[o + ((x / per) | 0)]; return (byte >> (8 - depth * (x % per + 1))) & ((1 << depth) - 1); };
    if (type === 6) for (let k = 0; k < 4; k++) out[d + k] = sample(k);
    else if (type === 2) { for (let k = 0; k < 3; k++) out[d + k] = sample(k); out[d + 3] = 255; }
    else if (type === 3) { const i = sample(0); out[d] = plte[i * 3]; out[d + 1] = plte[i * 3 + 1]; out[d + 2] = plte[i * 3 + 2]; out[d + 3] = trns && i < trns.length ? trns[i] : 255; }
    else if (type === 0) { const v = depth === 8 ? sample(0) : sample(0) * 255 / ((1 << depth) - 1); out[d] = out[d + 1] = out[d + 2] = v; out[d + 3] = 255; }
    else if (type === 4) { out[d] = out[d + 1] = out[d + 2] = sample(0); out[d + 3] = sample(1); }
  }
  return { width: W, height: H, data: out };
}

// ---------- PNG · 움직이는 PNG 쓰기 ----------
const CRC = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = buf => { let c = 0xFFFFFFFF; for (const b of buf) c = CRC[(c ^ b) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
const chunk = (type, data) => { const t = Buffer.from(type, 'latin1'), len = Buffer.alloc(4), c = Buffer.alloc(4); len.writeUInt32BE(data.length); c.writeUInt32BE(crc(Buffer.concat([t, data]))); return Buffer.concat([len, t, data, c]); };
const u32 = (...v) => { const b = Buffer.alloc(v.length * 4); v.forEach((x, i) => b.writeUInt32BE(x, i * 4)); return b; };
const pixels = (W, H, px) => { const raw = Buffer.alloc((W * 4 + 1) * H); for (let y = 0; y < H; y++) Buffer.from(px.buffer, px.byteOffset + y * W * 4, W * 4).copy(raw, y * (W * 4 + 1) + 1); return zlib.deflateSync(raw, { level: 9 }); };
const ihdr = (W, H) => Buffer.concat([u32(W, H), Buffer.from([8, 6, 0, 0, 0])]);
const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const png = (W, H, px) => Buffer.concat([SIG, chunk('IHDR', ihdr(W, H)), chunk('IDAT', pixels(W, H, px)), chunk('IEND', Buffer.alloc(0))]);
function apng(W, H, frames, delayMs) {
  const parts = [SIG, chunk('IHDR', ihdr(W, H)), chunk('acTL', u32(frames.length, 0))];
  let seq = 0;
  frames.forEach((px, i) => {
    const fc = Buffer.concat([u32(seq++, W, H, 0, 0), Buffer.from([delayMs >> 8, delayMs & 255, 3, 232, 0, 0])]);   // 지연 = delayMs/1000 초
    parts.push(chunk('fcTL', fc));
    const data = pixels(W, H, px);
    parts.push(i === 0 ? chunk('IDAT', data) : chunk('fdAT', Buffer.concat([u32(seq++), data])));
  });
  parts.push(chunk('IEND', Buffer.alloc(0)));
  return Buffer.concat(parts);
}

// ---------- 걷기 ----------
const SRC = decodePng(fs.readFileSync(path.join(__dirname, 'hero-edit.png')));
const get = (n, x, y) => { if (x < 0 || y < 0 || x >= FW || y >= FH) return null; const i = (y * SRC.width + n * FW + x) * 4; return SRC.data[i + 3] ? [SRC.data[i], SRC.data[i + 1], SRC.data[i + 2]] : null; };
const blank = () => new Array(FW * FH).fill(null);
const standing = n => { const f = blank(); for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) f[y * FW + x] = get(n, x, y); return f; };

// 앞 · 뒤 — liftLeft: 화면 왼쪽 다리가 들림
function stepFB(n, { split, dup }, liftLeft) {
  const f = blank();
  for (let x = 0; x < FW; x++) {
    const planted = liftLeft ? x >= split : x < split;
    for (let y = 0; y < FH; y++) {
      let sy = y + 1;                                         // 몸 전체가 1칸 위로
      if (planted && y >= dup) sy = y;                        // 땅에 닿은 다리는 그 자리 (dup 줄이 한 번 더 나옴)
      if (!planted && y >= dup - 1) sy = y + 1 + LIFT;        // 들린 다리는 바지 줄을 빼서 짧게
      f[y * FW + x] = get(n, x, sy);
    }
  }
  return f;
}

// 옆 — nearForward: 가까운 다리가 앞으로
function stepSide(n, { face }, nearForward) {
  const f = blank();
  for (let y = 0; y < LEG_TOP; y++) for (let x = 0; x < FW; x++) f[(y + 1) * FW + x] = get(n, x, y);   // 몸 전체가 1칸 아래로
  const leg = (dir, shade) => SIDE_ROWS.forEach((sy, k) => {
    const ty = FH - SIDE_ROWS.length + k - (FH - 1 - SIDE_ROWS[SIDE_ROWS.length - 1]), dx = dir * SPREAD[k];
    for (let x = 0; x < FW; x++) {
      const c = get(n, x, sy); if (!c) continue;
      const tx = x + dx; if (tx < 0 || tx >= FW) continue;
      f[ty * FW + tx] = shade && Math.max(...c) > 30 ? c.map(v => Math.round(v * FAR_SHADE)) : c;
    }
  });
  const fwd = face * (nearForward ? 1 : -1);
  leg(-fwd, true);                                            // 먼 다리 먼저 (어둡게)
  leg(fwd, false);                                            // 가까운 다리를 위에
  return f;
}

const WALK = VIEWS.map((v, n) => {
  const stand = standing(n);
  return FB[v]
    ? [stand, stepFB(n, FB[v], true), stand, stepFB(n, FB[v], false)]
    : [stand, stepSide(n, SIDE[v], true), stand, stepSide(n, SIDE[v], false)];
});

// 얼굴 점검 — 걸음 칸의 머리 줄은 서기 칸을 1칸 옮긴 것과 같아야 함
WALK.forEach((frames, n) => frames.forEach((f, i) => {
  if (!(i % 2)) return;
  const bob = FB[VIEWS[n]] ? -1 : 1;
  for (let y = 1; y < 26; y++) for (let x = 0; x < FW; x++) {
    const a = f[(y + bob) * FW + x], b = frames[0][y * FW + x];
    if (String(a) !== String(b)) throw new Error(`${VIEWS[n]} ${i}번 칸의 머리(${x},${y})가 바뀜`);
  }
}));

const put = (buf, W, x0, y0, f, Z = 1) => { for (let y = 0; y < FH * Z; y++) for (let x = 0; x < FW * Z; x++) { const c = f[(y / Z | 0) * FW + (x / Z | 0)]; if (!c) continue; const i = ((y0 + y) * W + x0 + x) * 4; buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = 255; } };
{
  const W = FW * 4, H = FH * 4, px = new Uint8Array(W * H * 4);
  WALK.forEach((frames, n) => frames.forEach((f, i) => put(px, W, i * FW, n * FH, f)));
  fs.writeFileSync(path.join(__dirname, 'hero-walk.png'), png(W, H, px));
}
{
  const Z = 4, GAP = 8, W = 4 * (FW * Z + GAP) + GAP, H = FH * Z + GAP * 2;
  const frames = [0, 1, 2, 3].map(i => {
    const px = new Uint8Array(W * H * 4);
    for (let k = 0; k < W * H; k++) { px[k * 4] = 120; px[k * 4 + 1] = 118; px[k * 4 + 2] = 130; px[k * 4 + 3] = 255; }
    WALK.forEach((fr, n) => put(px, W, GAP + n * (FW * Z + GAP), GAP, fr[i], Z));
    return px;
  });
  fs.writeFileSync(path.join(__dirname, 'hero-walk-preview.png'), apng(W, H, frames, 160));
}
console.log(`주인공 걷기 — ${VIEWS.join(' · ')} × 4칸 (${FW}×${FH}) → ${path.relative(process.cwd(), __dirname)}`);
