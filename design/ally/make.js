// ============================================================
//  동료 생김새 미리보기
//
//    node design/ally/make.js [시작 번호]
//      → design/ally/preview.png   맨 왼쪽 위는 주인공(앞 · 뒤 — 크기 · 그림체 비교), 나머지는 무작위 동료 앞 · 뒤 (4배)
//      → design/ally/preview-1x.png 같은 것을 실제 크기로
// ============================================================
'use strict';
const fs = require('fs');
const path = require('path');
const { decodePng, png } = require('./png.js');
const Look = require('../../js/allylook.js');

const start = +(process.argv[2] || 1);
const N = 35, COLS = 6, Z = 4, PAD = 6;
const FW = Look.W, FH = Look.H;
const hero = decodePng(fs.readFileSync(path.join(__dirname, '../hero/hero-edit.png')));
const heroFrame = n => { const o = new Uint8ClampedArray(FW * FH * 4); for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { const s = (y * hero.width + n * FW + x) * 4, d = (y * FW + x) * 4; for (let k = 0; k < 4; k++) o[d + k] = hero.data[s + k]; } return o; };

const cells = [[heroFrame(0), heroFrame(1)]];
for (let i = 0; i < N; i++) { const L = Look.rollLook(start + i); cells.push([Look.drawLook(L, 'front'), Look.drawLook(L, 'back')]); }

function sheet(z) {
  const cw = (FW * 2 + 2) * z + PAD * 2, ch = FH * z + PAD * 2, rows = Math.ceil(cells.length / COLS);
  const Wd = cw * COLS, Hd = ch * rows, px = new Uint8Array(Wd * Hd * 4);
  for (let k = 0; k < Wd * Hd; k++) { px[k * 4] = 112; px[k * 4 + 1] = 110; px[k * 4 + 2] = 122; px[k * 4 + 3] = 255; }
  cells.forEach((pair, n) => {
    const ox = (n % COLS) * cw + PAD, oy = ((n / COLS) | 0) * ch + PAD;
    if (n === 0) for (let y = oy - PAD + 2; y < oy + FH * z + PAD - 2; y++) for (let x = ox - PAD + 2; x < ox + cw - PAD - 2; x++) { const i = (y * Wd + x) * 4; px[i] = 92; px[i + 1] = 90; px[i + 2] = 104; }
    pair.forEach((f, side) => {
      const bx = ox + side * (FW + 2) * z;
      for (let y = 0; y < FH * z; y++) for (let x = 0; x < FW * z; x++) {
        const s = (((y / z) | 0) * FW + ((x / z) | 0)) * 4;
        if (!f[s + 3]) continue;
        const d = ((oy + y) * Wd + bx + x) * 4;
        px[d] = f[s]; px[d + 1] = f[s + 1]; px[d + 2] = f[s + 2]; px[d + 3] = 255;
      }
    });
  });
  return png(Wd, Hd, px);
}
fs.writeFileSync(path.join(__dirname, 'preview.png'), sheet(Z));
fs.writeFileSync(path.join(__dirname, 'preview-1x.png'), sheet(1));
for (let i = 0; i < 6; i++) console.log(start + i, Look.describe(Look.rollLook(start + i)));
console.log(`경우의 수 약 ${Look.COUNT.toExponential(2)} 가지 — 미리보기 ${N}명 (${start}번부터)`);
