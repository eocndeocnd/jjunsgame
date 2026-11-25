// ============================================================
//  주인공 조합 그림 시안 — 네 방향 · 걷기
//
//    node design/ally/hero.js [시작 번호]
//      → design/ally/hero-preview.png  첫 줄: 예전 주인공(assets/hero/walk.png 의 서기 칸) · 둘째 줄: 기본 조합(HERO_LOOK) · 그 아래: 무작위 조합
//                                       한 줄에 앞 · 뒤 · 오른쪽을 봄 · 왼쪽을 봄 (4배)
//      → design/ally/hero-walk.png     걷는 움직이는 PNG — 기본 조합과 무작위 셋, 네 방향 (4배, 0.16초마다)
// ============================================================
'use strict';
const fs = require('fs');
const path = require('path');
const { decodePng, png, apng } = require('./png.js');
const Look = require('../../js/allylook.js');

const start = +(process.argv[2] || 1), Z = 4, GAP = 8, FW = Look.W, FH = Look.H;
const old = decodePng(fs.readFileSync(path.join(__dirname, '../../assets/hero/walk.png')));
const cut = (img, col, row) => { const o = new Uint8ClampedArray(FW * FH * 4); for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { const s = ((row * FH + y) * img.width + col * FW + x) * 4, d = (y * FW + x) * 4; for (let k = 0; k < 4; k++) o[d + k] = img.data[s + k]; } return o; };
const looks = [Look.HERO_LOOK, ...Array.from({ length: 6 }, (_, i) => Look.rollLook(start + i))];
const sheets = looks.map(L => Look.walkSheet(L));

function canvas(cols, rows) {
  const Wd = cols * (FW * Z + GAP) + GAP, Hd = rows * (FH * Z + GAP) + GAP, px = new Uint8Array(Wd * Hd * 4);
  for (let k = 0; k < Wd * Hd; k++) { px[k * 4] = 112; px[k * 4 + 1] = 110; px[k * 4 + 2] = 122; px[k * 4 + 3] = 255; }
  const put = (f, c, r) => { for (let y = 0; y < FH * Z; y++) for (let x = 0; x < FW * Z; x++) { const s = (((y / Z) | 0) * FW + ((x / Z) | 0)) * 4; if (!f[s + 3]) continue; const d = ((GAP + r * (FH * Z + GAP) + y) * Wd + GAP + c * (FW * Z + GAP) + x) * 4; px[d] = f[s]; px[d + 1] = f[s + 1]; px[d + 2] = f[s + 2]; } };
  return { Wd, Hd, px, put };
}
{
  const c = canvas(4, looks.length + 1);
  for (let d = 0; d < 4; d++) c.put(cut(old, 0, d), d, 0);
  sheets.forEach((s, r) => { for (let d = 0; d < 4; d++) c.put(cut(s, 0, d), d, r + 1); });
  fs.writeFileSync(path.join(__dirname, 'hero-preview.png'), png(c.Wd, c.Hd, c.px));
}
{
  const pick = sheets.slice(0, 4), frames = [0, 1, 2, 3].map(n => { const c = canvas(4, pick.length); pick.forEach((s, r) => { for (let d = 0; d < 4; d++) c.put(cut(s, n, d), d, r); }); return c; });
  fs.writeFileSync(path.join(__dirname, 'hero-walk.png'), apng(frames[0].Wd, frames[0].Hd, frames.map(c => c.px), 160));
}
console.log(`주인공 시안 — 기본 + 무작위 ${looks.length - 1}명 (${start}번부터)`);
