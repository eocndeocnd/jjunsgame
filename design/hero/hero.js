// ============================================================
//  주인공 — 앞 · 뒤 · 옆(오른쪽 보기) 각 두 칸 (서 있기 · 걷기). 한 칸 16×16, 지도 한 칸과 같은 크기
//
//    node design/hero/hero.js
//      → design/hero/hero.png          (96×16, 바탕 투명 — 앞0 앞1 뒤0 뒤1 옆0 옆1)
//      → design/hero/hero-preview.png  (8배 — 위는 어두운 돌바닥, 아래는 풀밭 위)
//
//  왼쪽을 볼 때는 옆모습을 좌우로 뒤집어 씁니다. 걷기는 서 있기와 걷기 두 칸을 번갈아.
//  아래 글자 그림을 고치면 됩니다 — 글자 하나가 픽셀 하나 (. 은 비움).
// ============================================================
'use strict';
const fs = require('fs');
const path = require('path');
const { encodePng } = require('../../tools/map-gen.js');

const PALETTE = {
  o: '#1e1a22',   // 테두리
  h: '#3b2a24', H: '#5a4234',   // 머리카락 · 빛
  s: '#e6b48a', S: '#c08860',   // 살 · 그늘
  e: '#1e1a22',   // 눈
  j: '#4c5a6a', J: '#38424e',   // 작업 점퍼 · 그늘
  y: '#c9b860',   // 반사띠
  n: '#d8d8d0',   // 명찰
  g: '#b09a6c',   // 목장갑
  p: '#5c584c',   // 작업 바지
  b: '#2e2622'    // 작업화
};

// 위 열두 줄은 서 있기 · 걷기가 같고, 다리(와 옆모습의 손)만 다릅니다
const FRONT_TOP = [
  '................',
  '.....oooooo.....',
  '....ohhHhhho....',
  '...ohhhhhhhho...',
  '...ohsshsssho...',
  '...ossessesso...',
  '....oSssssSo....',
  '....ojjssjjo....',
  '...ojjjnjjjjo...',
  '...ojyyyyyyjo...',
  '...oJjjjjjjJo...',
  '...ogJjjjjJgo...'
];
const BACK_TOP = [
  '................',
  '.....oooooo.....',
  '....ohhHhhho....',
  '...ohhhhhhhho...',
  '...ohhhHhhhho...',
  '...ohhhhhhhho...',
  '....ohhhhhho....',
  '....ojjhhjjo....',
  '...ojjjjjjjjo...',
  '...ojyyyyyyjo...',
  '...oJjjjjjjJo...',
  '...ogJjjjjJgo...'
];
const SIDE_TOP = [
  '................',
  '.....ooooo......',
  '....ohhHhho.....',
  '...ohhhhhhho....',
  '...ohhhhhhhso...',
  '...ohhhhhseso...',
  '....ohhhsssSo...',
  '.....ojjsso.....',
  '....ojjjjjjo....',
  '....oyyyyyyo....',
  '....ojjJJjjo....'
];
const LEGS_TOGETHER = ['....oppppppo....', '....oppooppo....', '....obboobbo....', '....oooooooo....'];
const LEGS_APART = ['....oppppppo....', '...oppo..oppo...', '...obbo..obbo...', '...oooo..oooo...'];

const FRAMES = [
  ['앞 · 서 있기', [...FRONT_TOP, ...LEGS_TOGETHER]],
  ['앞 · 걷기', [...FRONT_TOP, ...LEGS_APART]],
  ['뒤 · 서 있기', [...BACK_TOP, ...LEGS_TOGETHER]],
  ['뒤 · 걷기', [...BACK_TOP, ...LEGS_APART]],
  ['옆 · 서 있기', [...SIDE_TOP, '....oJjgjjJo....', '....oppppppo....', '.....oppppo.....', '.....obbbbbo....', '.....ooooooo....']],
  ['옆 · 걷기', [...SIDE_TOP, '....oJjjjjgo....', '....oppppppo....', '...oppo..oppo...', '..obbbo..obbbo..', '..ooooo..ooooo..']]   // 손이 앞으로, 앞발이 나감
];
const N = 16;
for (const [name, rows] of FRAMES) {
  if (rows.length !== N || rows.some(r => r.length !== N)) throw new Error(`${name} — 16×16 이 아님`);
  for (const r of rows) for (const ch of r) if (ch !== '.' && !PALETTE[ch]) throw new Error(`${name} — 모르는 글자 ${ch}`);
}

const hex = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];

// 1) 한 장 — 바탕 투명
{
  const W = N * FRAMES.length, H = N, px = new Uint8Array(W * H * 4);
  FRAMES.forEach(([, rows], f) => rows.forEach((r, y) => [...r].forEach((ch, x) => {
    if (ch === '.') return;
    const i = (y * W + f * N + x) * 4, [cr, cg, cb] = hex(PALETTE[ch]);
    px[i] = cr; px[i + 1] = cg; px[i + 2] = cb; px[i + 3] = 255;
  })));
  fs.writeFileSync(path.join(__dirname, 'hero.png'), encodePng(W, H, px));
}

// 2) 미리보기 — 8배, 어두운 돌바닥 줄과 풀밭 줄 (실제 바닥에서 얼마나 잘 보이나)
{
  const Z = 8, GAP = 8, CELL = N * Z, W = FRAMES.length * (CELL + GAP) + GAP, H = 2 * (CELL + GAP) + GAP;
  const px = new Uint8Array(W * H * 4);
  const put = (x, y, c) => { const i = (y * W + x) * 4; px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = 255; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) put(x, y, hex('#141016'));
  const grounds = [['#4e5256', '#43454a'], ['#5d8e3e', '#4f7f35']];
  grounds.forEach(([a, b], row) => FRAMES.forEach(([, rows], f) => {
    const ox = GAP + f * (CELL + GAP), oy = GAP + row * (CELL + GAP);
    for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) put(ox + x, oy + y, hex(((x >> 4) + (y >> 4)) % 2 ? a : b));   // 바닥 — 칸 무늬
    rows.forEach((r, y) => [...r].forEach((ch, x) => {
      if (ch === '.') return;
      for (let j = 0; j < Z; j++) for (let i = 0; i < Z; i++) put(ox + x * Z + i, oy + y * Z + j, hex(PALETTE[ch]));
    }));
  }));
  fs.writeFileSync(path.join(__dirname, 'hero-preview.png'), encodePng(W, H, px));
}
console.log(`주인공 — ${FRAMES.length}칸 (${FRAMES.map(f => f[0]).join(' · ')}) → ${path.relative(process.cwd(), __dirname)}`);
