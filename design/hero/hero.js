// ============================================================
//  주인공 — 부품(머리 · 몸통 · 팔 · 다리 · 가방)을 한 번만 찍고, 동작마다 자리만 옮겨 맞춰 끼웁니다.
//  그래서 모든 칸이 같은 픽셀 격자에 맞고, 색 하나를 바꾸면 모든 칸이 같이 바뀝니다.
//
//    node design/hero/hero.js
//      → design/hero/hero.png          (한 칸 32×36, 바탕 투명 — 줄: 동작 × 방향(앞 · 뒤 · 왼쪽 · 오른쪽), 칸: 프레임)
//      → design/hero/hero-preview.png  (모든 칸 3배 — 줄: 동작, 묶음: 방향)
//      → design/hero/hero-anim.png     (움직이는 PNG 3배 — 줄: 동작, 칸: 방향)
//      → design/hero/hero-onmap.png    (지도 시안 한 칸 16px 위에 4배 — 지도와의 비율)
//
//  동작(프레임) — 정지 4 · 대기 2 · 걷기 4 · 달리기 4 · 공격 4 · 피격 3 · 대화 4 · 사망 4
//  왼쪽은 오른쪽을 좌우로 뒤집은 것. 발끝은 칸 아래에서 셋째 줄(y 33).
//  부품 글자 그림은 속만 칠한 것이고, 테두리는 부품마다 둘레에 닿은 색을 짙게 두릅니다 (겹치는 곳은 안쪽 선이 됨).
// ============================================================
'use strict';
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');
const { encodePng } = require('../../tools/map-gen.js');

const PALETTE = {
  h: '#4a362c', H: '#6e5240', d: '#2c201a',   // 곱슬머리 · 빛 · 그늘
  s: '#f2cfb2', t: '#d8a888', u: '#b88068',   // 살 · 그늘 · 입
  e: '#2a2026', E: '#5a3a2c',                 // 눈꺼풀 · 갈색 눈동자
  k: '#2c2a32', K: '#403e48', x: '#1c1a22',   // 검은 후드 집업 · 빛 · 그늘
  c: '#dcdce0', C: '#a8a8b4',                 // 흰 티 · 그늘 (고양이 키링도)
  z: '#141218',                               // 가방끈
  m: '#26252a', M: '#3a3940', l: '#a8885a',   // 검은 백팩 · 빛 · 갈색 패치
  p: '#30303a', P: '#24242c',                 // 짙은 바지 · 그늘
  f: '#ececf0', F: '#b8b8c4', o: '#4a4a52'    // 흰 운동화 · 그늘 · 밑창
};

// ---------- 부품 (격자 18칸 폭 기준 자리) ----------
const HEAD = {
  front: [
    '.....hH..Hh.hH....',
    '...hhHHhHHhhHHh...',
    '..hHhhdhHhhdhHhd..',
    '.hHhdhhHHhdhhHhhd.',
    '.hhdhHHhhdhHHhdhd.',
    '.hHhhhhdhHhhhdhHd.',
    '.hhdhHhhdhhHhhdhd.',
    '.hdhhhdhhhdhhhdhd.',
    '.hhhshhhsshhhshhd.',
    '.dhsssshsssshsssd.',
    '..hsseesssseessh..',
    '..hssEEssssEEssh..',
    '..dssssssssssssd..',
    '...tssssuusssst...',
    '....tsssssssst....',
    '.......tttt.......'
  ],
  back: [
    '.....hH..Hh.hH....',
    '...hhHHhHHhhHHh...',
    '..hHhhdhHhhdhHhd..',
    '.hHhdhhHHhdhhHhhd.',
    '.hhdhHHhhdhHHhdhd.',
    '.hHhhhhdhHhhhdhHd.',
    '.hhdhHhhdhhHhhdhd.',
    '.hHhhdhHhhdhHhhdd.',
    '.hhdhhhhdhhhhdhhd.',
    '.dhhHhhdhhHhhdhhd.',
    '..hhdhhhhdhhhhdh..',
    '..thhhHhhhhHhhht..',
    '..thhdhhhhhhdhht..',
    '...hhdhhhhhhdhh...',
    '....hhhhhhhhhh....',
    '.......tttt.......'
  ],
  side: [
    '.....hH..Hh.......',
    '...hhHHhHHhhh.....',
    '..hHhhdhHhhdhh....',
    '.hHhdhhHHhdhhHh...',
    '.hhdhHHhhdhHHhhh..',
    '.hHhhhhdhHhhhdhhd.',
    '.hhdhHhhdhhHhhdhh.',
    '.hdhhhdhhhhhdhshs.',
    '.hhHhhdhhhssssss..',
    '.dhhdhHhhtssssss..',
    '..hHhhdhhtsssees..',
    '..hhdhhHhtsssEEs..',
    '...hHhdhhsssssss..',
    '....hhdhhsssssus..',
    '.....hhhtttttt....',
    '........tttt......'
  ]
};
// 얼굴 바꾸기 — 눈 감음 · 입 벌림 (줄 번호, 칸, 글자)
const FACE = {
  front: { closed: [[10, 5, 'ss'], [10, 11, 'ss'], [11, 5, 'ee'], [11, 11, 'ee']], open: [[14, 8, 'uu']] },
  side:  { closed: [[10, 13, 'ss'], [11, 13, 'ee']], open: [[13, 13, 'uu']] },
  back:  { closed: [], open: [] }
};
const TORSO = {
  front: [
    '.....kKccccKk.....',
    '....kzkcccckzk....',
    '....kzxccccxzk....',
    '....kzxcCCcxzk....',
    '....kzxccccxzk....',
    '....xzxCccCxzx....',
    '....xkxCCCCxkx....'
  ],
  back: [
    '.....kKKKKKKk.....',
    '....kkKkkkkKkk....',
    '....kkkkkkkkkk....',
    '....kkkkkkkkkk....',
    '....kkkkkkkkkk....',
    '....xkkkkkkkkx....',
    '....xxkkkkkkxx....'
  ],
  side: [
    '.......kkKk.......',
    '......kkkkkzc.....',
    '......kkkkkzc.....',
    '......kkKkkzC.....',
    '......kkkkkzC.....',
    '......xkkkkzC.....',
    '......xxkkkxx.....'
  ]
};
const PACK_BACK = ['.mmmmmmmm.', 'mMMMMMMMMm', 'mMmmmmmmMm', 'mMmmllmmMm', 'mMmmmmmmMm', 'mmmmmmmmmm', '.mmmmmmmm.'];
const PACK_SIDE = ['.mm.', 'mMMm', 'mMmm', 'mMmm', 'mMmm', 'mmmm', '.mm.'];
const KEYRING = ['c', 'c'];                                     // 가방에 단 고양이 키링
const ARM_L = ['Kk', 'Kk', 'kk', 'kk', 'kx', 'kx', 'ts'];       // 앞 · 뒤에서 본 왼팔 (오른팔은 뒤집음)
const ARM_S = ['kk', 'kK', 'kk', 'kk', 'kx', 'xx', 'st'];       // 옆에서 본 팔
const ARM_REACH = ['kkkKss', 'xxxxst'];                          // 옆 — 앞으로 뻗은 팔 (공격)
const HIPS = { front: ['pppPPppp'], side: ['pppppp'] };
const LEG_L = ['.ppp', '.ppp', '.pPp', '.ppp', '.fff', 'fFff', 'oooo'];   // 앞 · 뒤 (오른다리는 뒤집음)
const LEG_S = ['.pp..', '.pp..', '.pp..', '.pP..', '.pp..', '.ffff', '.oooo'];

const flipRows = rows => rows.map(r => [...r].reverse().join(''));
const ARM_R = flipRows(ARM_L), LEG_R = flipRows(LEG_L);

function headRows(view, o) {
  const rows = HEAD[view].map(r => [...r]);
  for (const key of [o.eyes === 'closed' && 'closed', o.mouth === 'open' && 'open'].filter(Boolean))
    for (const [y, x, s] of FACE[view][key]) [...s].forEach((ch, i) => { rows[y][x + i] = ch; });
  return rows.map(r => r.join(''));
}

// ---------- 칸 맞추기 ----------
const FW = 32, FH = 36, GX = 7, GY = 4;        // 격자 (0,0) 이 칸의 (7,4) — 발끝 격자 29줄 = 칸 33줄
const hex = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
const INK = [14, 10, 16];
const v = (a, k) => (a && a[k]) || 0;

function compose(view, o = {}) {
  const px = new Uint8Array(FW * FH * 4);
  const part = (rows, gx, gy, far) => {                         // 부품 하나 — 속을 칠하고 둘레에 짙은 테두리
    const mine = new Set(), at = new Map();
    rows.forEach((r, y) => [...r].forEach((ch, x) => {
      if (ch === '.') return;
      const X = GX + gx + x, Y = GY + gy + y;
      if (X < 0 || Y < 0 || X >= FW || Y >= FH) return;
      let c = hex(PALETTE[ch]);
      if (far) c = c.map(q => Math.round(q * 0.72));
      mine.add(Y * FW + X); at.set(Y * FW + X, c);
    }));
    for (const [k, c] of at) {
      const X = k % FW, Y = (k / FW) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = X + dx, ny = Y + dy, j = ny * FW + nx;
        if (nx < 0 || ny < 0 || nx >= FW || ny >= FH || mine.has(j)) continue;
        const ink = c.map((q, i) => Math.round(q * 0.28 + INK[i] * 0.72));
        px[j * 4] = ink[0]; px[j * 4 + 1] = ink[1]; px[j * 4 + 2] = ink[2]; px[j * 4 + 3] = 255;
      }
    }
    for (const [k, c] of at) { px[k * 4] = c[0]; px[k * 4 + 1] = c[1]; px[k * 4 + 2] = c[2]; px[k * 4 + 3] = 255; }
  };
  const up = o.bob || 0, lean = o.lean || 0, head = headRows(view, o);
  if (view === 'side') {
    part(ARM_S, 9 + lean + v(o.aF, 'x'), 16 + up + v(o.aF, 'y'), true);           // 저쪽 팔
    part(PACK_SIDE, 3 + lean, 17 + up);
    part(KEYRING, 4 + lean, 24 + up);
    part(LEG_S, 6 + v(o.lF, 'x'), 23 - v(o.lF, 'lift'), true);                    // 저쪽 다리
    part(LEG_S, 7 + v(o.lN, 'x'), 23 - v(o.lN, 'lift'));
    part(HIPS.side, 6 + lean, 23 + up);
    part(TORSO.side, lean, 16 + up);
    if (o.reach) part(ARM_REACH, 10 + lean, 19 + up);
    else part(ARM_S, 9 + lean + v(o.aN, 'x'), 16 + up + v(o.aN, 'y'));
    part(head, lean + (o.hx || 0), up + (o.hy || 0));
  } else {
    part(LEG_L, 4, 23 - v(o.lL, 'lift'));
    part(LEG_R, 10, 23 - v(o.lR, 'lift'));
    part(HIPS.front, 5, 23 + up);
    part(TORSO[view], 0, 16 + up);
    part(ARM_L, 2 + v(o.aL, 'x'), 16 + up + v(o.aL, 'y'));
    part(ARM_R, 14 + v(o.aR, 'x'), 16 + up + v(o.aR, 'y'));
    if (view === 'back') part(PACK_BACK, 4, 17 + up);
    part(head, o.hx || 0, up + (o.hy || 0));
  }
  if (o.flash) for (let i = 0; i < FW * FH; i++) if (px[i * 4 + 3]) for (let k = 0; k < 3; k++) px[i * 4 + k] += (255 - px[i * 4 + k]) * 0.6;
  return px;
}
// 쓰러져 누운 모습 — 옆모습(눈 감음)을 돌려 눕히고 바닥에 붙임 (등을 대고, 머리는 뒤쪽)
function lying() {
  const src = compose('side', { eyes: 'closed' }), out = new Uint8Array(FW * FH * 4);
  let x0 = FW, x1 = -1, y0 = FH, y1 = -1;
  const rot = new Map();
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    const i = (y * FW + x) * 4;
    if (!src[i + 3]) continue;
    const rx = y, ry = FW - 1 - x;                              // 시계 반대 방향으로 90도
    rot.set(`${rx},${ry}`, [src[i], src[i + 1], src[i + 2]]);
    x0 = Math.min(x0, rx); x1 = Math.max(x1, rx); y0 = Math.min(y0, ry); y1 = Math.max(y1, ry);
  }
  const ox = ((FW - (x1 - x0 + 1)) >> 1) - x0, oy = 34 - y1;
  for (const [key, c] of rot) {
    const [rx, ry] = key.split(',').map(Number), X = rx + ox, Y = ry + oy;
    if (X < 0 || Y < 0 || X >= FW || Y >= FH) continue;
    const i = (Y * FW + X) * 4; out[i] = c[0]; out[i + 1] = c[1]; out[i + 2] = c[2]; out[i + 3] = 255;
  }
  return out;
}
const mirror = px => { const out = new Uint8Array(px.length); for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) for (let k = 0; k < 4; k++) out[(y * FW + x) * 4 + k] = px[(y * FW + FW - 1 - x) * 4 + k]; return out; };

// ---------- 동작 — 앞 · 뒤(같은 몸짓) / 옆 ----------
const FRONT = {
  idle:   [{}, {}, { bob: -1 }, { bob: -1, eyes: 'closed' }],                                         // 숨쉬기 · 눈 깜빡
  wait:   [{ hx: -1 }, { hx: 1 }],                                                                    // 두리번
  walk:   [{ lL: { lift: 1 }, aL: { y: 1 }, aR: { y: -1 } }, { bob: -1 }, { lR: { lift: 1 }, aL: { y: -1 }, aR: { y: 1 } }, { bob: -1 }],
  run:    [{ lL: { lift: 3 }, aL: { y: 2 }, aR: { y: -2 }, bob: -1 }, { bob: -2, lL: { lift: 1 }, lR: { lift: 1 } },
           { lR: { lift: 3 }, aL: { y: -2 }, aR: { y: 2 }, bob: -1 }, { bob: -2, lL: { lift: 1 }, lR: { lift: 1 } }],
  attack: [{ aR: { x: 1, y: -2 } }, { aR: { x: -4, y: 3 }, bob: 1 }, { aR: { x: -4, y: 3 }, bob: 1, lR: { lift: 1 } }, { aR: { y: -1 } }],   // 주먹을 앞으로
  hit:    [{ eyes: 'closed', flash: true, hy: -1 }, { eyes: 'closed', bob: -1, hy: -1 }, {}],
  talk:   [{}, { mouth: 'open', aR: { x: -2, y: -3 } }, { aR: { x: -2, y: -3 } }, { mouth: 'open' }],     // 손짓하며 말하기
  death:  [{ eyes: 'closed', bob: 1, hx: 1 }, { eyes: 'closed', bob: 3 }, { eyes: 'closed', bob: 5, aL: { y: 3 }, aR: { y: 3 } }, { lying: true }]
};
const BACK = { ...FRONT, attack: [{ aR: { x: 1, y: -1 } }, { aR: { x: -2, y: -4 }, bob: 1 }, { aR: { x: -2, y: -4 }, bob: 1, lR: { lift: 1 } }, {}] };   // 뒤에서는 팔이 저쪽으로
const SIDE = {
  idle:   [{}, {}, { bob: -1 }, { bob: -1, eyes: 'closed' }],
  wait:   [{}, { bob: 1, hy: 1 }],                                                                    // 한숨 — 어깨가 처짐
  walk:   [{ lN: { x: 2 }, lF: { x: -2 }, aN: { x: -1 }, aF: { x: 1 } }, { bob: -1 }, { lN: { x: -2 }, lF: { x: 2 }, aN: { x: 1 }, aF: { x: -1 } }, { bob: -1 }],
  run:    [{ lN: { x: 3, lift: 1 }, lF: { x: -3 }, aN: { x: -2, y: -1 }, aF: { x: 2 }, lean: 1, bob: -1 }, { lean: 1, bob: -2, lN: { lift: 2 }, lF: { lift: 1 } },
           { lN: { x: -3 }, lF: { x: 3, lift: 1 }, aN: { x: 2, y: -1 }, aF: { x: -2 }, lean: 1, bob: -1 }, { lean: 1, bob: -2, lN: { lift: 1 }, lF: { lift: 2 } }],
  attack: [{ aN: { x: -2, y: -1 }, lean: -1 }, { reach: true, lean: 1, lN: { x: 2 } }, { reach: true, lean: 1, lN: { x: 2 }, lF: { x: -1 } }, {}],
  hit:    [{ eyes: 'closed', flash: true, lean: -1 }, { eyes: 'closed', lean: -2, hy: -1 }, { lean: -1 }],
  talk:   [{}, { mouth: 'open', aN: { x: 1, y: -3 } }, { aN: { x: 1, y: -3 } }, { mouth: 'open' }],
  death:  [{ eyes: 'closed', bob: 1, lean: -1 }, { eyes: 'closed', bob: 3, lean: 1 }, { eyes: 'closed', bob: 5, lean: 2 }, { lying: true }]
};
const STATES = [['idle', '정지'], ['wait', '대기'], ['walk', '걷기'], ['run', '달리기'], ['attack', '공격'], ['hit', '피격'], ['talk', '대화'], ['death', '사망']];
const DIRS = ['앞', '뒤', '왼쪽', '오른쪽'];
const frame = (view, o) => (o.lying ? lying() : compose(view, o));
// SHEET[상태][방향][프레임] = RGBA
const SHEET = STATES.map(([key]) => {
  const right = SIDE[key].map(o => frame('side', o));
  return [FRONT[key].map(o => frame('front', o)), BACK[key].map(o => frame('back', o)), right.map(mirror), right];
});

// ---------- 그림 파일 ----------
const blit = (dst, W, src, ox, oy, Z = 1) => {
  for (let y = 0; y < FH * Z; y++) for (let x = 0; x < FW * Z; x++) {
    const s = ((y / Z | 0) * FW + (x / Z | 0)) * 4;
    if (!src[s + 3]) continue;
    const d = ((oy + y) * W + ox + x) * 4;
    dst[d] = src[s]; dst[d + 1] = src[s + 1]; dst[d + 2] = src[s + 2]; dst[d + 3] = 255;
  }
};
const fill = (px, W, H, [r, g, b]) => { for (let i = 0; i < W * H; i++) { px[i * 4] = r; px[i * 4 + 1] = g; px[i * 4 + 2] = b; px[i * 4 + 3] = 255; } };

// 1) 한 장 (게임용) — 줄: 동작 × 방향, 칸: 프레임 (모자란 칸은 비움)
{
  const MAXF = 4, W = FW * MAXF, H = FH * STATES.length * 4, px = new Uint8Array(W * H * 4);
  SHEET.forEach((dirs, s) => dirs.forEach((frames, d) => frames.forEach((f, i) => blit(px, W, f, i * FW, (s * 4 + d) * FH))));
  fs.writeFileSync(path.join(__dirname, 'hero.png'), encodePng(W, H, px));
}
// 2) 미리보기 — 3배, 줄: 동작 / 묶음: 앞 · 뒤 · 왼쪽 · 오른쪽 (묶음마다 프레임 넷 자리)
{
  const Z = 3, CW = FW * Z, CH = FH * Z, GAP = 6, GROUP = 4 * CW + 3 * 2 + 18, W = GROUP * 4 + GAP, H = STATES.length * (CH + GAP) + GAP;
  const px = new Uint8Array(W * H * 4);
  fill(px, W, H, [22, 20, 28]);
  SHEET.forEach((dirs, s) => dirs.forEach((frames, d) => frames.forEach((f, i) => {
    const ox = GAP + d * GROUP + i * (CW + 2), oy = GAP + s * (CH + GAP);
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const k = ((oy + y) * W + ox + x) * 4; px[k] = 44; px[k + 1] = 42; px[k + 2] = 54; }
    blit(px, W, f, ox, oy, Z);
  })));
  fs.writeFileSync(path.join(__dirname, 'hero-preview.png'), encodePng(W, H, px));
}
// 3) 움직이는 PNG — 3배, 줄: 동작, 칸: 앞 · 뒤 · 왼쪽 · 오른쪽. 12장을 돌며 동작마다 제 프레임 수로 되풀이
function encodeApng(W, H, frames, delayMs) {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = buf => { let c = 0xFFFFFFFF; for (const b of buf) c = crcTable[(c ^ b) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]), len = Buffer.alloc(4), sum = Buffer.alloc(4);
    len.writeUInt32BE(data.length); sum.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, sum]);
  };
  const u32 = n => { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b; };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6;
  const out = [Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('acTL', Buffer.concat([u32(frames.length), u32(0)]))];
  let seq = 0;
  frames.forEach((px, i) => {
    const fc = Buffer.alloc(26);
    fc.writeUInt32BE(seq++, 0); fc.writeUInt32BE(W, 4); fc.writeUInt32BE(H, 8); fc.writeUInt32BE(0, 12); fc.writeUInt32BE(0, 16);
    fc.writeUInt16BE(delayMs, 20); fc.writeUInt16BE(1000, 22); fc[24] = 0; fc[25] = 0;
    out.push(chunk('fcTL', fc));
    const raw = Buffer.alloc((W * 4 + 1) * H), src = Buffer.from(px.buffer, px.byteOffset, px.byteLength);
    for (let y = 0; y < H; y++) src.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4);
    const data = zlib.deflateSync(raw, { level: 9 });
    out.push(i === 0 ? chunk('IDAT', data) : chunk('fdAT', Buffer.concat([u32(seq++), data])));
  });
  out.push(chunk('IEND', Buffer.alloc(0)));
  return Buffer.concat(out);
}
{
  const Z = 3, CW = FW * Z, CH = FH * Z, GAP = 6, W = 4 * (CW + GAP) + GAP, H = STATES.length * (CH + GAP) + GAP;
  const frames = [];
  for (let t = 0; t < 12; t++) {
    const px = new Uint8Array(W * H * 4);
    fill(px, W, H, [22, 20, 28]);
    SHEET.forEach((dirs, s) => dirs.forEach((fr, d) => {
      const ox = GAP + d * (CW + GAP), oy = GAP + s * (CH + GAP);
      for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const k = ((oy + y) * W + ox + x) * 4; px[k] = 44; px[k + 1] = 42; px[k + 2] = 54; }
      blit(px, W, fr[t % fr.length], ox, oy, Z);
    }));
    frames.push(px);
  }
  fs.writeFileSync(path.join(__dirname, 'hero-anim.png'), encodeApng(W, H, frames, 160));
}
// 4) 지도 위 — 맵 시안(한 칸 16px)의 숲 수문 앞에 앞 · 옆(걷기) · 뒤를 그대로 올리고 4배
{
  const png = fs.readFileSync(path.join(__dirname, '../map-concept/overworld.png'));   // encodePng 가 쓴 것 — 8비트 RGBA · 줄마다 필터 0
  const MW = png.readUInt32BE(16), chunks = [];
  for (let p = 8; p < png.length;) { const len = png.readUInt32BE(p), type = png.toString('ascii', p + 4, p + 8); if (type === 'IDAT') chunks.push(png.subarray(p + 8, p + 8 + len)); p += 12 + len; }
  const raw = zlib.inflateSync(Buffer.concat(chunks)), stride = MW * 4 + 1;
  const T = 16, cx = 33 * T, cy = 52 * T, CW = 12 * T, CH = 9 * T, Z = 4;
  const base = new Uint8Array(CW * CH * 4);
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) for (let k = 0; k < 4; k++) base[(y * CW + x) * 4 + k] = raw[(cy + y) * stride + 1 + (cx + x) * 4 + k];
  for (const [f, tx, ty] of [[SHEET[0][0][0], 3, 4], [SHEET[2][3][0], 5, 5], [SHEET[0][1][0], 7, 4]]) {
    const ox = tx * T + T / 2 - FW / 2, oy = (ty + 1) * T - 34;
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
console.log(`주인공 — ${STATES.map(([k, n]) => `${n} ${FRONT[k].length}`).join(' · ')} × ${DIRS.join(' · ')} (${FW}×${FH}) → ${path.relative(process.cwd(), __dirname)}`);
