// ============================================================
//  4대 길드 에이스 전용 머리 시안 — 데이터는 js/allylook.js 의 HAIR_ART, 생김새는 js/data.js 의 BIG_GUILDS[].look
//
//    node design/characters/hair.js
//      → design/characters/hair-preview.png  에이스 넷 × 앞 · 뒤 · 옆 (8배) — 손보는 동안 보는 시안
//
//  좌표는 32×40 칸 기준 (머리뼈 x 7~24 · y 7~24, 눈 y 17~20, 귀 x 6 · 25). 가닥은 p 뿌리 → 끝, w 는 그 점의 굵기.
//  빛은 왼쪽 위. 먼저 적은 가닥이 뒤, 나중 가닥이 앞. ring 은 빛 띠가 들어갈 구간(뿌리 0 ~ 끝 1). tone 은 그 가닥만 밝게(+) · 어둡게(−).
//  옆모습은 오른쪽을 봄 (왼쪽을 보는 모습은 게임이 뒤집음).
// ============================================================
'use strict';

// ---------- 시안 ----------
{
  const fs = require('fs'), path = require('path');
  const { png } = require('../ally/png.js');
  const Look = require('../../js/allylook.js');
  const vm = require('vm');
  const { BIG_GUILDS } = vm.runInNewContext(`${fs.readFileSync(path.join(__dirname, '../../js/data.js'), 'utf8')}\n;({ BIG_GUILDS })`, {}, { filename: 'data.js' });
  const LOOKS = BIG_GUILDS.map(B => B.look);
  const VIEWS = ['front', 'back', 'side'], Z = 8, G = 12, fw = Look.W * Z, fh = Look.H * Z;
  const Wd = VIEWS.length * (fw + G) + G, Hd = LOOKS.length * (fh + G) + G, px = new Uint8Array(Wd * Hd * 4);
  for (let k = 0; k < Wd * Hd; k++) { px[k * 4] = 112; px[k * 4 + 1] = 110; px[k * 4 + 2] = 122; px[k * 4 + 3] = 255; }
  LOOKS.forEach((L, r) => VIEWS.forEach((v, c) => {
    const f = Look.drawLook(L, v);
    for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) { const s = (((y / Z) | 0) * Look.W + ((x / Z) | 0)) * 4; if (!f[s + 3]) continue; const d = ((G + r * (fh + G) + y) * Wd + G + c * (fw + G) + x) * 4; px[d] = f[s]; px[d + 1] = f[s + 1]; px[d + 2] = f[s + 2]; }
  }));
  fs.writeFileSync(path.join(__dirname, 'hair-preview.png'), png(Wd, Hd, px));
  // 실루엣 시험 — 검게 칠한 앞 · 옆을 넷 나란히 (둘이 헷갈리면 안 됨)
  {
    const sw = 8 * (fw / Z) / 2 | 0;
    const Z2 = 4, fw2 = Look.W * Z2, fh2 = Look.H * Z2, W2 = 8 * (fw2 + G) + G, H2 = fh2 + G * 2, px2 = new Uint8Array(W2 * H2 * 4);
    for (let k = 0; k < W2 * H2; k++) { px2[k * 4] = 236; px2[k * 4 + 1] = 234; px2[k * 4 + 2] = 228; px2[k * 4 + 3] = 255; }
    LOOKS.forEach((L, i) => ['front', 'side'].forEach((v, j) => {
      const f = Look.drawLook(L, v), c = i * 2 + j;
      for (let y = 0; y < fh2; y++) for (let x = 0; x < fw2; x++) { const q = (((y / Z2) | 0) * Look.W + ((x / Z2) | 0)) * 4; if (!f[q + 3]) continue; const d = ((G + y) * W2 + G + c * (fw2 + G) + x) * 4; px2[d] = 24; px2[d + 1] = 20; px2[d + 2] = 28; }
    }));
    fs.writeFileSync(path.join(__dirname, 'hair-silhouette.png'), png(W2, H2, px2));
    void sw;
  }

  console.log('hair-preview.png');
}
