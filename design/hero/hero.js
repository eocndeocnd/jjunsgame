// ============================================================
//  주인공 — 앞 · 뒤 · 옆(오른쪽 보기) 각 세 칸 (서 있기 · 걷기 둘). 한 칸 24×32, 몸은 약 18×26
//
//    node design/hero/hero.js
//      → design/hero/hero.png          (72×96, 바탕 투명 — 줄: 앞 · 뒤 · 옆 / 칸: 서 있기 · 걷기 A · 걷기 B)
//      → design/hero/hero-preview.png  (6배 확대)
//      → design/hero/hero-onmap.png    (지도 시안의 한 칸 16px 위에 그대로 올려 4배 — 지도와의 비율)
//
//  걷기는 서 있기 → A → 서 있기 → B 로 번갈아. 왼쪽을 볼 때는 옆모습을 좌우로 뒤집어 씁니다.
//  아래 글자 그림은 속만 칠한 것이고, 테두리는 코드가 둘레에 두릅니다 (닿은 색보다 짙게).
//  글자 하나 = 픽셀 하나, . 은 비움.
// ============================================================
'use strict';
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');
const { encodePng } = require('../../tools/map-gen.js');

const PALETTE = {
  h: '#4a3426', H: '#6e4e38', d: '#2e2018',   // 머리카락 · 빛 · 그늘
  s: '#f2c49a', t: '#d49a70', u: '#a8684a',   // 살 · 그늘 · 입
  e: '#2a1e26',                               // 눈
  w: '#e6e6de',                               // 턱 밑으로 내린 방진 마스크
  j: '#56667a', J: '#3e4a5a',                 // 작업 점퍼 · 그늘
  i: '#3a383e',                               // 안에 입은 티
  n: '#e8e8e0',                               // 명찰
  y: '#d6c45a',                               // 반사띠
  g: '#cdb27c',                               // 목장갑
  p: '#6c6858', P: '#524e42',                 // 작업 바지 · 그늘
  b: '#3c2e26'                                // 작업화
};

// ---------- 앞 ----------
const FRONT_HEAD = [
  '..................',
  '.......hH..Hh.....',
  '.....hHHhhhHhh....',
  '....hHHhhhhhhh....',
  '...hHhhhhhhhhhd...',
  '..hHhhhhhhhhhhhd..',
  '..hhhhhhhhhhhhhd..',
  '..hhdhhhdhhdhhdd..',
  '..hhshhhsshhhshd..',
  '..hssssssssssssd..',
  '..hsseesssseessd..',
  '..tsseesssseesst..',
  '...tssssuusssst...',
  '....tssssssssst...',
  '......wwwwww......'
];
const FRONT_BODY = [
  '...jjjjiiiijjjj...',
  '..jjjnniiiijjjjj..',
  '..jyyyyyiiyyyyyj..',
  '..jjjjjjiijjjjjj..',
  '..JjjjjjiijjjjjJ..',
  '..gJjjjjjjjjjjJg..',
  '..gg.pppppppp.gg..'
];
// ---------- 뒤 ----------
const BACK_HEAD = [
  '..................',
  '.......hH..Hh.....',
  '.....hHHhhhHhh....',
  '....hHHhhhhhhh....',
  '...hHhhhhhhhhhd...',
  '..hHhhhhhhhhhhhd..',
  '..hhhhhhhhhhhhhd..',
  '..hhhhhhHhhhhhhd..',
  '..hhhhhhhhhhhhhd..',
  '..hhdhhhhhhhhhdd..',
  '..hhhhhhhhhhhhhd..',
  '..thhhhhhhhhhhht..',
  '...hhdhhhhhhdhh...',
  '....hhhhhhhhhh....',
  '......tttttt......'
];
const BACK_BODY = [
  '...jjjjjjjjjjjj...',
  '..jjjjjjjjjjjjjj..',
  '..jyyyyyyyyyyyyj..',
  '..jjjjjjjjjjjjjj..',
  '..JjjjjjjjjjjjjJ..',
  '..gJjjjjjjjjjjJg..',
  '..gg.pppppppp.gg..'
];
const LEGS = {
  stand: ['.....pppPPppp.....', '.....ppp..ppp.....', '.....bbb..bbb.....', '....bbbb..bbbb....'],
  stepA: ['.....pppPPppp.....', '.....bbb..ppp.....', '....bbbb..bbb.....', '..........bbbb....']    // 한 발을 들고 (B 는 좌우로 뒤집음)
};
// ---------- 옆 (오른쪽을 봄) ----------
const SIDE_HEAD = [
  '..................',
  '......Hh.hH.......',
  '.....hHHhhHh......',
  '....hHHhhhhhhh....',
  '...hHhhhhhhhhhh...',
  '...hhhhhhhhhhhhh..',
  '...hhhhhhhhhhhdh..',
  '...hhhhhhhhhhdhs..',
  '...hhhhhhhhhssss..',
  '...hhhhhhhtssses..',
  '...hhhhhhhtssses..',
  '....hhhhhhssssus..',
  '.....hhhhssssst...',
  '......hhhtttt.....',
  '........wwww......'
];
const SIDE_BODY = ['......jjjjjj......', '.....jjjjjjjj.....', '.....yyyyyyyy.....', '.....jjJjjJjj.....', '.....jjJjjJjj.....', '.....jjJjjJjj.....'];
const SIDE_HAND = { stand: '.....ppJggJpp.....', stepA: '.....pppJggJp.....', stepB: '.....pJggJppp.....' };   // 손이 앞 · 뒤로
const SIDE_LEGS = {
  stand: ['......pppppp......', '......pppppp......', '......bbbbbbb.....', '......bbbbbbbb....'],
  step:  ['.....pppppppp.....', '....ppp....ppp....', '...bbbb....bbbb...', '...bbbbb...bbbbb..']
};

const flip = rows => rows.map(r => [...r].reverse().join(''));
const VIEWS = [
  ['앞', [[...FRONT_HEAD, ...FRONT_BODY, ...LEGS.stand], [...FRONT_HEAD, ...FRONT_BODY, ...LEGS.stepA], [...FRONT_HEAD, ...FRONT_BODY, ...flip(LEGS.stepA)]]],
  ['뒤', [[...BACK_HEAD, ...BACK_BODY, ...LEGS.stand], [...BACK_HEAD, ...BACK_BODY, ...LEGS.stepA], [...BACK_HEAD, ...BACK_BODY, ...flip(LEGS.stepA)]]],
  ['옆', [[...SIDE_HEAD, ...SIDE_BODY, SIDE_HAND.stand, ...SIDE_LEGS.stand], [...SIDE_HEAD, ...SIDE_BODY, SIDE_HAND.stepA, ...SIDE_LEGS.step],
          [...SIDE_HEAD, ...SIDE_BODY, SIDE_HAND.stepB, ...SIDE_LEGS.step]]]
];
const FW = 24, FH = 32, GW = 18;
for (const [name, frames] of VIEWS) frames.forEach((rows, k) => {
  if (rows.some(r => r.length !== GW)) throw new Error(`${name} ${k} — 폭이 ${GW} 가 아닌 줄`);
  for (const r of rows) for (const ch of r) if (ch !== '.' && !PALETTE[ch]) throw new Error(`${name} ${k} — 모르는 글자 ${ch}`);
});

const hex = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
const INK = [16, 10, 16];

// 한 칸 → 24×32 RGBA (발끝이 아래에서 둘째 줄에 오게, 테두리는 닿은 색을 짙게)
function frameRGBA(rows) {
  const px = new Uint8Array(FW * FH * 4), ox = (FW - GW) >> 1, oy = FH - 2 - (rows.length - 1);
  const at = (x, y) => { const gx = x - ox, gy = y - oy; return gy >= 0 && gy < rows.length && gx >= 0 && gx < GW ? rows[gy][gx] : '.'; };
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    const ch = at(x, y), i = (y * FW + x) * 4;
    let c = null;
    if (ch !== '.') c = hex(PALETTE[ch]);
    else {
      const nb = [[0, -1], [-1, 0], [1, 0], [0, 1]].map(([dx, dy]) => at(x + dx, y + dy)).find(n => n !== '.');
      if (nb) c = hex(PALETTE[nb]).map((v, k) => Math.round(v * 0.28 + INK[k] * 0.72));
    }
    if (c) { px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = 255; }
  }
  return px;
}
const FRAMES = VIEWS.map(([, frames]) => frames.map(frameRGBA));

// 1) 한 장 — 줄: 앞 · 뒤 · 옆, 칸: 서 있기 · 걷기 A · 걷기 B
{
  const W = FW * 3, H = FH * 3, px = new Uint8Array(W * H * 4);
  FRAMES.forEach((row, r) => row.forEach((f, c) => {
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) for (let k = 0; k < 4; k++) px[((r * FH + y) * W + c * FW + x) * 4 + k] = f[(y * FW + x) * 4 + k];
  }));
  fs.writeFileSync(path.join(__dirname, 'hero.png'), encodePng(W, H, px));
}

// 2) 미리보기 — 6배, 레퍼런스처럼 회색 바탕
{
  const Z = 6, GAP = 12, W = 3 * (FW * Z + GAP) + GAP, H = 3 * (FH * Z + GAP) + GAP, px = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) { px[i * 4] = 158; px[i * 4 + 1] = 156; px[i * 4 + 2] = 168; px[i * 4 + 3] = 255; }
  FRAMES.forEach((row, r) => row.forEach((f, c) => {
    const ox = GAP + c * (FW * Z + GAP), oy = GAP + r * (FH * Z + GAP);
    for (let y = 0; y < FH * Z; y++) for (let x = 0; x < FW * Z; x++) {
      const s = ((y / Z | 0) * FW + (x / Z | 0)) * 4;
      if (!f[s + 3]) continue;
      const d = ((oy + y) * W + ox + x) * 4;
      px[d] = f[s]; px[d + 1] = f[s + 1]; px[d + 2] = f[s + 2];
    }
  }));
  fs.writeFileSync(path.join(__dirname, 'hero-preview.png'), encodePng(W, H, px));
}

// 3) 지도 위 — 맵 시안(한 칸 16px)의 숲 수문 앞을 잘라 주인공을 그대로 올리고 4배
{
  const png = fs.readFileSync(path.join(__dirname, '../map-concept/overworld.png'));   // encodePng 가 쓴 것 — 8비트 RGBA · 줄마다 필터 0
  const MW = png.readUInt32BE(16), chunks = [];
  for (let p = 8; p < png.length;) { const len = png.readUInt32BE(p), type = png.toString('ascii', p + 4, p + 8); if (type === 'IDAT') chunks.push(png.subarray(p + 8, p + 8 + len)); p += 12 + len; }
  const raw = zlib.inflateSync(Buffer.concat(chunks)), stride = MW * 4 + 1;
  const T = 16, cx = 33 * T, cy = 52 * T, CW = 12 * T, CH = 9 * T, Z = 4;   // 숲 · 수문 위 갈림목
  const base = new Uint8Array(CW * CH * 4);
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) for (let k = 0; k < 4; k++) base[(y * CW + x) * 4 + k] = raw[(cy + y) * stride + 1 + (cx + x) * 4 + k];
  // 길 위에 셋 — 앞 서 있기 · 옆 걷기 · 뒤 서 있기 (발이 칸 아래쪽에)
  for (const [f, tx, ty] of [[FRAMES[0][0], 3, 4], [FRAMES[2][1], 5, 5], [FRAMES[1][0], 7, 4]]) {
    const ox = tx * T - (FW - T) / 2, oy = (ty + 1) * T - FH;
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
      const s = (y * FW + x) * 4, X = ox + x, Y = oy + y;
      if (!f[s + 3] || X < 0 || Y < 0 || X >= CW || Y >= CH) continue;
      for (let k = 0; k < 3; k++) base[(Y * CW + X) * 4 + k] = f[s + k];
    }
  }
  const W = CW * Z, px = new Uint8Array(W * CH * Z * 4);
  for (let y = 0; y < CH * Z; y++) for (let x = 0; x < W; x++) { const s = ((y / Z | 0) * CW + (x / Z | 0)) * 4, d = (y * W + x) * 4; px[d] = base[s]; px[d + 1] = base[s + 1]; px[d + 2] = base[s + 2]; px[d + 3] = 255; }
  fs.writeFileSync(path.join(__dirname, 'hero-onmap.png'), encodePng(W, CH * Z, px));
}
console.log(`주인공 — ${VIEWS.map(v => v[0]).join(' · ')} × 서 있기 · 걷기 A · 걷기 B (${FW}×${FH}) → ${path.relative(process.cwd(), __dirname)}`);
