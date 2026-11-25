// PNG 읽기 · 쓰기 — design/hero/walk.js 에서 옮겨 옴
'use strict';
const zlib = require('zlib');
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

module.exports = { decodePng, png, apng };
