// 나무 후보 미리보기 — node design/trees/preview.js → design/trees/candidates.png
// 게임과 같은 그림 코드(js/mapart.js 의 paintTree · texture)로 후보 A~G 를 그 나무가 설 땅 위에 그립니다.
// 칸마다 한 그루씩 작은 숲 하나와, 오른쪽 위에 혼자 선 한 그루. 글자는 후보 이름.
'use strict';
const fs = require('fs'), path = require('path');
const A = require('../../js/mapart.js');
const { encodePng } = require('../../tools/map-gen.js');

const P = A.P, SCALE = 2, PW = 9 * P, PH = 7 * P, K = P / 8;   // 판 하나 = 9×7칸 (K — 칸 하나가 8점이던 때의 몇 배)
const PANELS = [
  ['A', 'kingdom', A.GRASS, 3, '뭉게 나무'], ['B', 'kingdom', A.GRASS, 3, '동그란 나무'], ['C', 'kingdom', A.GRASS, 3, '키 큰 나무'],
  ['D', 'forest', A.GRASS, 2, '3단 전나무'], ['E', 'forest', A.GRASS, 2, '가는 측백'], ['D', 'snow', A.SNOW, 4, '3단 전나무 · 눈'],
  ['F', 'necro', A.GRASS, 5, '앙상한 나무'], ['G', 'abyss', A.OBSID, 6, '뒤틀린 마목']
];
const COLS = 4, GAP = 4, W = COLS * (PW + GAP) + GAP, H = Math.ceil(PANELS.length / COLS) * (PH + GAP) + GAP;
const buf = new Uint8Array(W * H * 3).fill(20);
const put = (x, y, c) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 3; buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; };
const get = (x, y) => { const i = (y * W + x) * 3; return [buf[i], buf[i + 1], buf[i + 2]]; };
const FONT = { A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['.##', '#..', '#..', '#..', '.##'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'], E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'], G: ['.##', '#..', '#.#', '#.#', '.##'] };

PANELS.forEach(([style, pal, ter, bio], n) => {
  const px0 = GAP + (n % COLS) * (PW + GAP), py0 = GAP + Math.floor(n / COLS) * (PH + GAP);
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) put(px0 + x, py0 + y, A.texture(ter, bio, x + n * 97, y + n * 61));
  // 작은 숲 — 칸마다 한 그루 (뒤에서 앞으로), 오른쪽 위에는 한 그루만
  const spots = [];
  for (let cy = 2; cy <= 6; cy++) for (let cx = 0; cx <= 4; cx++) if ((cx + cy) % 2 === 0 || cy >= 4) spots.push([cx, cy]);
  spots.push([7, 3]);
  spots.sort((p, q) => p[1] - q[1]);
  spots.forEach(([cx, cy], k) => {
    const ox = px0 + cx * P - P / 2 + Math.round((((k * 37) % 10) / 10 - 0.5) * 3 * K), oy = py0 + cy * P - (A.TH - P);
    for (let y = -K; y <= K; y++) for (let x = -5 * K; x <= 5 * K; x++) {       // 땅 그림자
      const gx = ox + A.TW / 2 + x, gy = oy + A.TH - K + y;
      if (x * x / (25 * K * K) + y * y / (K * K) <= 1 && gx >= px0 && gy >= py0 && gx < px0 + PW && gy < py0 + PH) put(gx, gy, get(gx, gy).map(v => v * 0.6));
    }
    A.paintTree((x, y, c) => { const gx = ox + x, gy = oy + y; if (gx >= px0 && gy >= py0 && gx < px0 + PW && gy < py0 + PH) put(gx, gy, c); }, style, pal, ((k * 0.618) % 1));
  });
  // 후보 글자 — 왼쪽 위, 흰 글씨에 검은 테
  FONT[style].forEach((row, y) => [...row].forEach((c, x) => {
    if (c !== '#') return;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) put(px0 + 2 + x * 2 + dx, py0 + 2 + y * 2 + dy, [0, 0, 0]);
  }));
  FONT[style].forEach((row, y) => [...row].forEach((c, x) => { if (c === '#') { put(px0 + 2 + x * 2, py0 + 2 + y * 2, [255, 255, 255]); put(px0 + 3 + x * 2, py0 + 2 + y * 2, [255, 255, 255]); put(px0 + 2 + x * 2, py0 + 3 + y * 2, [255, 255, 255]); put(px0 + 3 + x * 2, py0 + 3 + y * 2, [255, 255, 255]); } }));
});

// 크게 (한 점 = SCALE×SCALE) → PNG
const OW = W * SCALE, OH = H * SCALE, out = Buffer.alloc(OW * OH * 4);
for (let y = 0; y < OH; y++) for (let x = 0; x < OW; x++) {
  const i = ((y / SCALE | 0) * W + (x / SCALE | 0)) * 3, o = (y * OW + x) * 4;
  out[o] = buf[i]; out[o + 1] = buf[i + 1]; out[o + 2] = buf[i + 2]; out[o + 3] = 255;
}
const file = path.join(__dirname, 'candidates.png');
fs.writeFileSync(file, encodePng(OW, OH, out));
console.log('나무 후보 →', file, `${OW}×${OH}`);
console.log(PANELS.map(p => `${p[0]} ${p[4]} (${p[1]})`).join(' · '));
