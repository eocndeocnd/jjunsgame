// ============================================================
//  map-gen.js — 임시 지도를 Tiled 형식(.tmj)으로 뽑는 도구 (node tools/cli.js maps)
//
//  지도는 나중에 사람이 Tiled 로 손으로 짭니다. 그 전까지 규칙을 시험할 수 있게
//  「들판 하나 = 구역 하나」인 단순한 배치로 뽑아 둡니다 (docs/MAP-REFERENCE-PLAN.md 2번).
//  그래도 오픈월드처럼 — 같은 격 들판 사이는 넓게 트이고, 가장자리는 들쭉날쭉, 들판 안에 나무 · 바위가 흩어집니다.
//  이미 있는 지도는 덮어쓰지 않습니다 — 손으로 고친 것을 지우지 않게 (--force 로만).
//
//  buildTmj 는 시험(tests/map.test.js)에서 작은 지도를 만들 때도 씁니다.
// ============================================================
'use strict';
const zlib = require('zlib');
const { mulberry } = require('../js/map.js');

const TILE = 16;
// 타일셋 tiles.png 의 칸 순서. 벽 · 물 · 나무 · 바위는 못 지나갑니다 (Tiled 타일 속성 solid).
const FLOOR = 0, WALL = 1, WATER = 2, TREE = 3, ROCK = 4, ROAD = 5;
const TILE_KINDS = 6;
const SOLID = [WALL, WATER, TREE, ROCK];
// 겉모습 층(look) — 칸마다 땅의 종류(아래 네 비트) · 격(위 네 비트). 그림(js/mapart.js)이 이걸로 무늬를 고릅니다 (막히는지는 바닥 층이 정함).
// 땅의 종류 번호는 tools/overworld-layout.js 의 것. 타일셋 looks.png 는 16×16 = 256칸 (Tiled 에서 보기용 색 견본)
const OL = require('./overworld-layout.js');
const LOOK_GID = 1 + TILE_KINDS;
const look = (ter, bio) => ((bio & 15) << 4) | (ter & 15);

// ---------- Tiled JSON ----------
function tiledProps(o) {
  return Object.entries(o).filter(([, v]) => v !== undefined).map(([name, value]) => ({
    name, value, type: typeof value === 'boolean' ? 'bool' : Number.isInteger(value) ? 'int' : typeof value === 'number' ? 'float' : 'string'
  }));
}

// spec: { w, h, tiles(칸마다 위의 타일 번호), areas, posts, ports, secrets, npcs, chests } — 좌표는 칸 단위 (chests 는 점, 속성 chest = 상자 id)
// posts 는 w · h 가 있으면 사각형(큰 보스), 없으면 점(한 칸)으로 적습니다.
// areas 는 polygon(x · y 에서 잰 꼭짓점들, 칸 단위)이 있으면 다각형, 없으면 사각형으로 적습니다.
function buildTmj(spec) {
  let nextId = 1;
  const rectObj = ({ name = '', x, y, w, h, ...p }) =>
    ({ id: nextId++, name, type: '', x: x * TILE, y: y * TILE, width: w * TILE, height: h * TILE, rotation: 0, visible: true, properties: tiledProps(p) });
  const pointObj = ({ name = '', x, y, ...p }) =>
    ({ id: nextId++, name, type: '', point: true, x: (x + 0.5) * TILE, y: (y + 0.5) * TILE, width: 0, height: 0, rotation: 0, visible: true, properties: tiledProps(p) });
  const postObj = o => (o.w ? rectObj(o) : pointObj(o));
  const polyObj = ({ name = '', x, y, polygon, ...p }) =>
    ({ id: nextId++, name, type: '', x: x * TILE, y: y * TILE, width: 0, height: 0, rotation: 0, visible: true,
       polygon: polygon.map(q => ({ x: q.x * TILE, y: q.y * TILE })), properties: tiledProps(p) });
  const group = (id, name, objects) => ({ id, name, type: 'objectgroup', draworder: 'topdown', opacity: 1, visible: true, x: 0, y: 0, objects });
  const layers = [
    { id: 1, name: 'ground', type: 'tilelayer', width: spec.w, height: spec.h, x: 0, y: 0, opacity: 1, visible: true, data: Array.from(spec.tiles, t => t + 1) },
    ...(spec.look ? [{ id: 8, name: 'look', type: 'tilelayer', width: spec.w, height: spec.h, x: 0, y: 0, opacity: 0.6, visible: false, data: Array.from(spec.look, c => LOOK_GID + c) }] : []),
    group(2, 'areas', (spec.areas || []).map(o => (o.polygon ? polyObj(o) : rectObj(o)))),
    group(3, 'posts', (spec.posts || []).map(postObj)),
    group(4, 'ports', (spec.ports || []).map(rectObj)),
    group(5, 'secrets', (spec.secrets || []).map(rectObj)),
    group(6, 'npc', (spec.npcs || []).map(pointObj)),
    group(7, 'chests', (spec.chests || []).map(pointObj))
  ];
  return {
    compressionlevel: -1, type: 'map', version: '1.10', tiledversion: '1.10.2', orientation: 'orthogonal', renderorder: 'right-down', infinite: false,
    width: spec.w, height: spec.h, tilewidth: TILE, tileheight: TILE, nextlayerid: 9, nextobjectid: nextId, layers,
    properties: tiledProps(spec.props || {}),
    tilesets: [{
      firstgid: 1, name: 'draft', image: 'tiles.png', imagewidth: TILE * TILE_KINDS, imageheight: TILE, tilewidth: TILE, tileheight: TILE,
      tilecount: TILE_KINDS, columns: TILE_KINDS, margin: 0, spacing: 0,
      tiles: SOLID.map(id => ({ id, properties: tiledProps({ solid: true, water: id === WATER || undefined }) }))
    }, ...(spec.look ? [{
      firstgid: LOOK_GID, name: 'looks', image: 'looks.png', imagewidth: TILE * 16, imageheight: TILE * 16, tilewidth: TILE, tileheight: TILE,
      tilecount: 256, columns: 16, margin: 0, spacing: 0
    }] : [])]
  };
}

// 겉모습 타일셋 그림 — 칸마다 그 땅의 종류 · 격의 대표 색 (Tiled 에서 겉모습 층을 칠할 때 보기용)
function looksPng() {
  const W = TILE * 16, H = TILE * 16, px = Buffer.alloc(W * H * 4);
  const base = { [OL.GRASS]: [111, 160, 74], [OL.DIRT]: [180, 138, 90], [OL.COBBLE]: [141, 138, 130], [OL.TILES]: [185, 173, 148], [OL.WATER]: [31, 90, 150],
    [OL.LAVA]: [194, 48, 26], [OL.OBSID]: [44, 34, 50], [OL.SNOW]: [232, 238, 244], [OL.ROCKY]: [142, 138, 112], [OL.PAVE]: [110, 108, 120], [OL.CANAL]: [95, 176, 192] };
  for (let code = 0; code < 256; code++) {
    const ter = code & 15, bio = code >> 4, c = base[ter] || [12, 10, 18], k = 0.7 + (bio % 8) * 0.06;
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const i = (((code >> 4) * TILE + y) * W + (code & 15) * TILE + x) * 4, edge = x === 0 || y === 0;
      px[i] = Math.min(255, c[0] * (edge ? 0.6 : k)); px[i + 1] = Math.min(255, c[1] * (edge ? 0.6 : k)); px[i + 2] = Math.min(255, c[2] * (edge ? 0.6 : k)); px[i + 3] = 255;
    }
  }
  return encodePng(W, H, px);
}

// 타일셋 그림 — 바닥 · 벽 · 물 · 나무 · 바위 · 길 (Tiled 가 지도를 열 때 필요합니다)
function tilesPng() {
  const W = TILE * TILE_KINDS, H = TILE;
  const px = Buffer.alloc(W * H * 4);
  const put = (x, y, [r, g, b]) => { const i = (y * W + x) * 4; px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255; };
  const PAPER = [234, 214, 166];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const t = Math.floor(x / TILE), lx = x % TILE;
    const r = Math.hypot(lx - 7.5, y - 7.5);
    if (t === FLOOR) put(x, y, lx === 0 || y === 0 ? [227, 204, 149] : PAPER);
    else if (t === WALL) put(x, y, y < 2 ? [92, 56, 26] : [63, 36, 15]);
    else if (t === WATER) put(x, y, (y + (lx >> 2)) % 6 === 0 ? [74, 128, 184] : [31, 90, 150]);
    else if (t === TREE) put(x, y, r < 6.5 ? (r < 3 ? [92, 116, 52] : [74, 94, 42]) : PAPER);
    else if (t === ROCK) put(x, y, r < 6.5 && y > 2 ? (y < 7 ? [150, 140, 124] : [122, 112, 98]) : PAPER);
    else put(x, y, (lx + y) % 7 === 0 ? [224, 200, 150] : [242, 226, 184]);
  }
  return encodePng(W, H, px);
}

// RGBA 버퍼 → PNG (그림 도구들이 같이 씁니다 — design/map-concept 도)
function encodePng(W, H, px) {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = buf => { let c = 0xFFFFFFFF; for (const b of buf) c = crcTable[(c ^ b) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, sum]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((W * 4 + 1) * H);
  const src = Buffer.from(px.buffer, px.byteOffset, px.byteLength);
  for (let y = 0; y < H; y++) src.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// ---------- 들판 배치로 지도 짜기 ----------
// 들판 하나는 20×14칸, 들판 사이 틈은 4칸. 아래 그림에서 들판은 두 글자, 그 사이의 한 글자가 잇는 방법입니다.
//   들판    S. 어귀 · .. 지나가는 곳 · Nn N격 구역 · NE N격 정예의 홀 · NB N격 보스의 자리 · NH N격 숨은 곳
//           (N 은 그 지도가 품은 격 목록에서 몇 번째인가)
// 7~20격 일곱 장이 씁니다 — 1~6격(overworld)은 시안 배치를 그대로 옮긴 것이라 아래 overworld() 가 따로 짭니다.
//   잇기    - | 트인 길(8~10칸) · ~ 강(건너편이 보이기만) · ? 숨은 샛길 · b 보스가 막은 고갯길 · e 정예가 막은 고갯길 · = 들판을 터서 하나로
// 좁은 곳은 고갯길뿐입니다 — 막고 선 보스(또는 길막 정예)의 크기(n × n, data.js ENEMY_SIZE)만큼 넓고, 그 몸이 꼭 맞게 막습니다.
const FIELD_W = 20, FIELD_H = 14, GAP = 4, PITCH_X = FIELD_W + GAP, PITCH_Y = FIELD_H + GAP;
const OPEN = 10, CLUMPS = 6;

function layoutFromPlan(plan) {
  // 들판 줄은 짝수 줄, 그 아래 홀수 줄은 세로 잇기. 들판은 3글자 간격, 가로 잇기는 들판 바로 뒤 글자.
  const rooms = [], links = [];
  const at = new Map();
  for (let r = 0; r < plan.length; r += 2) {
    const line = plan[r];
    for (let c = 0; c * 3 < line.length; c++) {
      const tok = line.slice(c * 3, c * 3 + 2);
      if (!tok.trim()) continue;
      const room = { c, r: r / 2, tok, slot: /^\d/.test(tok) ? Number(tok[0]) : 0, kind: /^\d/.test(tok) ? tok[1] : tok };
      rooms.push(room);
      at.set(`${c},${r / 2}`, room);
    }
  }
  for (const room of rooms) {
    const line = plan[room.r * 2], below = plan[room.r * 2 + 1] || '';
    const h = line[room.c * 3 + 2], v = below[room.c * 3];
    const east = at.get(`${room.c + 1},${room.r}`), south = at.get(`${room.c},${room.r + 1}`);
    if (h && h !== ' ' && east) links.push({ a: room, b: east, how: h, dir: 'h' });
    if (v && v !== ' ' && south) links.push({ a: room, b: south, how: v, dir: 'v' });
  }
  return { rooms, links, cols: Math.max(...rooms.map(o => o.c)) + 1, rows: Math.max(...rooms.map(o => o.r)) + 1 };
}

// 부드러운 값 잡음 (0~1) — 들판 가장자리를 들쭉날쭉하게
function valueNoise(seed) {
  const hash = (x, y) => {
    let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ seed;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const s = t => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), tx = s(x - xi), ty = s(y - yi);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
  };
}

// data: js/data.js 에서 꺼낸 { ENEMIES, ZONES }
// ranks: 그림의 N 번째 = 몇 격인가 · opts: { seed, plaza(어귀 이름), obstacle(rank) → 그 격 들판에 흩어질 장애물 타일, entry(어귀) → 문의 광장으로 가는 문,
//   square(모든 방을 반듯하게) · open(트인 길의 폭 — 주면 맞닿은 변 가운데에) · order({ 격: ['칸,줄', …] } — 그 격 일반을 약한 것부터 세울 들판 차례),
//   exit({ name, label, to } — 마지막 격 보스 방 위쪽 막다른 틈 안의 구멍. 보스가 그 앞을 꼭 맞게 막고 섬),
//   look((그 칸의 방 | null, 바닥 타일) → 겉모습 번호 — 주면 겉모습 층을 적음, 그림 js/mapart.js),
//   chests([{ id, room: '칸,줄', corner: nw | ne | sw | se, big }] — 그 방 구석(가장자리에서 두 칸 안)의 보물상자),
//   autoChests(격마다 큰 상자 하나 · 작은 상자 둘을 알아서 — 큰 것은 숨은 방 → 보스 방 → 가장 먼 들판, 작은 것은 남은 가장 먼 들판과 가운데쯤 들판) }
function generate(plan, ranks, data, opts) {
  const { rooms, links, cols, rows } = layoutFromPlan(plan);
  const rng = mulberry(opts.seed);
  const noise = valueNoise(opts.seed);
  const w = GAP + cols * PITCH_X, h = GAP + rows * PITCH_Y;
  const tiles = new Uint8Array(w * h).fill(WALL);
  const keep = new Uint8Array(w * h);   // 장애물을 두지 않을 칸 — 길목 · 정해진 자리 곁 · 시작점
  const idx = (x, y) => y * w + x;
  const inside = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
  const fill = (x, y, rw, rh, t, guard) => {
    for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) {
      if (!inside(x + i, y + j)) continue;
      if (t !== null) tiles[idx(x + i, y + j)] = t;
      if (guard) keep[idx(x + i, y + j)] = 1;
    }
  };
  const origin = room => ({ x: GAP + room.c * PITCH_X, y: GAP + room.r * PITCH_Y });
  const center = room => { const o = origin(room); return { x: o.x + (FIELD_W >> 1), y: o.y + (FIELD_H >> 1) }; };
  for (const room of rooms) room.rank = room.slot ? ranks[room.slot - 1] : 0;

  // 1) 들판 — 가장자리는 0~2칸 들쭉날쭉, 모서리는 둥글게. 정예의 홀(E)은 반듯한 방 (네 귀퉁이 칸만 깎음 — 큰 정예가 벽을 따라 늘어서게)
  for (const room of rooms) {
    const o = origin(room);
    for (let y = 0; y < FIELD_H; y++) for (let x = 0; x < FIELD_W; x++) {
      const ex = Math.min(x, FIELD_W - 1 - x), ey = Math.min(y, FIELD_H - 1 - y);
      const sq = room.kind === 'E' || opts.square;
      const m = sq ? 0 : Math.floor(noise((o.x + x) * 0.22, (o.y + y) * 0.22) * 3);
      if (ex >= m && ey >= m && ex + ey >= (sq ? 1 : 3)) tiles[idx(o.x + x, o.y + y)] = FLOOR;
    }
  }
  // 고갯길을 막고 설 것 — b 는 그 격의 보스, e 는 그 격의 묶음 밖 정예를 차례로 (아래 3) 에서 같은 차례로 세움)
  const foesOf = rank => { const zi = data.ZONES.findIndex(z => z.rank === rank); return data.ENEMIES.filter(e => e.zoneIndex === zi); };
  const eUsed = new Map();
  const blockerOf = (how, rank) => {
    if (how === 'b') return foesOf(rank).find(e => e.kind === 'boss');
    const k = eUsed.get(rank) || 0;
    eUsed.set(rank, k + 1);
    return foesOf(rank).filter(e => e.kind === 'elite' && !e.set)[k];
  };

  // 2) 잇기 — 틈(4칸)을 뚫고 양쪽 들판 안으로 몇 칸 더 파서 들쭉날쭉한 가장자리에 막히지 않게
  const posts = [], secrets = [], gates = [];
  for (const l of links) {
    const o = origin(l.a), H = l.dir === 'h';
    const len = H ? FIELD_H : FIELD_W;                       // 맞닿은 변의 길이
    const g0 = H ? o.x + FIELD_W : o.y + FIELD_H;            // 틈이 시작하는 칸
    const span = (from, width, depth, t, guard) => H        // 맞닿은 변을 따라 from 부터 width 칸, 틈 양쪽으로 depth 칸 더
      ? fill(g0 - depth, o.y + from, GAP + depth * 2, width, t, guard)
      : fill(o.x + from, g0 - depth, width, GAP + depth * 2, t, guard);
    if (l.how === '~') {
      span(1, len - 2, 0, WATER);                            // 강 — 틈을 다 메우고
      if (H) { fill(g0 - 2, o.y + 1, 2, len - 2, FLOOR); fill(g0 + GAP, o.y + 1, 2, len - 2, FLOOR); }   // 양쪽은 곧은 강둑
      else { fill(o.x + 1, g0 - 2, len - 2, 2, FLOOR); fill(o.x + 1, g0 + GAP, len - 2, 2, FLOOR); }
    } else if (l.how === '=') {
      span(1, len - 2, 3, FLOOR, true);
    } else if (l.how === '?') {
      const from = (len - 2) >> 1;
      span(from, 2, 3, FLOOR, true);
      span(from, 2, 0, WALL);                                // 틈 안은 벽으로 그려 두고 지나갈 수 있게
      secrets.push(H ? { name: '숨은 샛길', x: g0, y: o.y + from, w: GAP, h: 2 } : { name: '숨은 샛길', x: o.x + from, y: g0, w: 2, h: GAP });
    } else if (l.how === 'b' || l.how === 'e') {
      const rank = l.a.rank || l.b.rank, foe = blockerOf(l.how, rank);
      if (!foe) throw new Error(`${rank}격 — 고갯길(${l.how})을 막을 ${l.how === 'b' ? '보스' : '정예'}가 없음`);
      const n = foe.size, from = (len - n) >> 1, along = g0 + Math.floor((GAP - n) / 2);   // 틈(4칸)의 가운데 — 5칸이면 양쪽 들판으로 반 칸씩
      span(from, n, 3, FLOOR, true);
      span(from, n, 0, ROAD);
      gates.push({ how: l.how, rank, foe, x: H ? along : o.x + from, y: H ? o.y + from : along });
    } else {
      const open = Math.min(opts.open || OPEN, len - 4);
      const from = opts.open ? (len - open) >> 1 : 2 + Math.floor(rng() * (len - 4 - open + 1));
      span(from, open, 3, FLOOR, true);
    }
  }

  // 3) 첫 공간에서 걸어서 몇 번째 들판인가 — 약한 일반부터 가까운 들판에 세웁니다
  const start = rooms.find(o => o.kind === 'S.');
  const dist = new Map([[start, 0]]);
  for (const q = [start]; q.length;) {
    const a = q.shift();
    for (const l of links) {
      if (l.how === '~') continue;
      const b = l.a === a ? l.b : l.b === a ? l.a : null;
      if (b && !dist.has(b)) { dist.set(b, dist.get(a) + 1); q.push(b); }
    }
  }
  const byDist = list => list.slice().sort((p, q) => dist.get(p) - dist.get(q) || p.r - q.r || p.c - q.c);

  const areas = [], npcs = [], ports = [];
  const so = origin(start), sc = center(start);
  // 어귀(S.) — 몬스터 없는 이름뿐인 곳. 그 지도 첫 격의 지역으로 칩니다
  const firstZone = data.ZONES.find(z => z.rank === ranks[0]);
  areas.push({ name: opts.plaza || '첫 공간', x: so.x, y: so.y, w: FIELD_W, h: FIELD_H, zone: firstZone.id });
  npcs.push({ name: 'start', x: sc.x, y: sc.y }, { name: 'avatarDoor', x: sc.x + 5, y: sc.y - 4 });
  fill(sc.x - 2, sc.y - 2, 5, 5, null, true);
  if (opts.entry) {                                          // 문의 광장으로 돌아가는 문 — 어귀 서쪽 가장자리
    const e = opts.entry(so);
    ports.push(e);
    fill(e.x - 2, e.y - 2, e.w + 4, e.h + 4, null, true);
  }

  // 정해진 자리 — 그 적의 크기(n × n)만큼. at(c) 는 칸 c 를 가운데로 한 n × n 의 왼쪽 위
  const post = (e, x, y, blocks) => {
    const n = e.size;
    posts.push(n > 1 ? { name: e.name, x, y, w: n, h: n, enemy: e.id, blocks } : { name: e.name, x, y, enemy: e.id, blocks });
    fill(x - 2, y - 2, n + 4, n + 4, null, true);
  };
  const at = (e, c) => [c.x - ((e.size - 1) >> 1), c.y - ((e.size - 1) >> 1)];
  for (const rank of ranks) {
    const zi = data.ZONES.findIndex(z => z.rank === rank);
    const zone = data.ZONES[zi];
    const foes = data.ENEMIES.filter(e => e.zoneIndex === zi);
    const normals = foes.filter(e => e.kind === 'normal');
    const mine = kind => byDist(rooms.filter(o => o.rank === rank && o.kind === kind));
    const order = opts.order && opts.order[rank];
    const fields = order ? order.map(key => {
      const room = rooms.find(o => `${o.c},${o.r}` === key && o.rank === rank && o.kind === 'n');
      if (!room) throw new Error(`${rank}격 — 차례에 적은 들판 ${key} 이(가) 그림에 없음`);
      return room;
    }) : mine('n');
    if (fields.length !== normals.length || fields.length !== mine('n').length) throw new Error(`${rank}격 — 구역 ${mine('n').length}개, 차례 ${fields.length}개, 일반 ${normals.length}종`);
    fields.forEach((room, i) => {
      const o = origin(room), c = center(room);
      areas.push({ name: normals[i].name, x: o.x, y: o.y, w: FIELD_W, h: FIELD_H, rank, monster: normals[i].id, zone: zone.id });
      fill(c.x - 1, c.y - 1, 3, 3, null, true);             // 한가운데는 비워 둠 — 불러오면 그 지역 들머리(첫 구역 한가운데)에 섭니다
    });
    const fo = origin(fields[0]);
    npcs.push({ name: 'merchant', x: fo.x + 3, y: fo.y + 3, zone: zone.id });
    fill(fo.x + 2, fo.y + 2, 3, 3, null, true);

    // 정해진 자리 — 묶음 정예는 홀 벽을 따라 두 줄로, 묶음 밖 정예는 길막(e)부터 채우고 남으면 들판 한가운데
    const sets = foes.filter(e => e.kind === 'elite' && e.set);
    const loose = foes.filter(e => e.kind === 'elite' && !e.set);
    const boss = foes.find(e => e.kind === 'boss'), hidden = foes.find(e => e.kind === 'hidden');
    const mineGates = gates.filter(g => g.rank === rank);
    for (const g of mineGates.filter(g => g.how === 'e')) { const e = loose.shift(); if (e !== g.foe) throw new Error(`${rank}격 — 길막 정예 차례가 어긋남`); post(e, g.x, g.y, true); }
    loose.forEach((e, i) => {
      let k = Math.round((i + 1) * fields.length / (loose.length + 1)) - 1;
      if (k === 0 && fields.length > 1) k = 1;               // 첫 들판 한가운데는 그 지역 들머리 — 비워 둠
      post(e, ...at(e, center(fields[k])), false);
    });
    const halls = mine('E');
    if (sets.length) {
      // 홀 위 · 아래 벽을 따라 한 줄씩 — 두 줄 중 긴 쪽이 가장 짧아지게 나누고, 줄 안에서는 원래 차례대로 고르게 띄움.
      // 가운데 두 줄(6 · 7번째 줄)은 비워 지나가는 길, 둘레 한 칸과 서로의 사이 한 칸도 비움 (들판 둘을 튼 큰 홀이면 그 너비 전부)
      const o = origin(halls.reduce((a, b) => (b.c < a.c ? b : a))), W = halls.length > 1 ? FIELD_W * 2 + GAP : FIELD_W;
      const width = row => row.reduce((t, e) => t + e.size + 1, -1);
      let rows = null, best = Infinity;
      for (let mask = 0; mask < 1 << sets.length; mask++) {
        const split = [sets.filter((e, i) => !(mask >> i & 1)), sets.filter((e, i) => mask >> i & 1)];
        const score = Math.max(...split.map(width)) * 100 + Math.abs(split[0].length - split[1].length);
        if (score < best) { best = score; rows = split; }
      }
      rows.forEach((row, r) => {
        const room = W - 2 - width(row);                       // 사이 한 칸씩 띄우고 남는 칸 — 고르게 나눔
        if (room < 0) throw new Error(`${rank}격 — 묶음 정예가 홀 한 줄(${W - 2}칸)에 다 안 들어감`);
        let x = o.x + 1;
        row.forEach((e, i) => {
          x += Math.floor(room * (i + 1) / (row.length + 1)) - Math.floor(room * i / (row.length + 1));
          post(e, x, r ? o.y + 8 : o.y + 6 - e.size, false);  // 위 줄은 아래 끝을 · 아래 줄은 위 끝을 맞춤
          x += e.size + 1;
        });
      });
    }
    const bossGate = mineGates.find(g => g.how === 'b');
    if (bossGate) post(boss, bossGate.x, bossGate.y, true);
    else if (opts.exit && rank === ranks[ranks.length - 1]) {
      // 보스 방 위쪽 벽에 판 막다른 틈 (보스 크기만큼 넓게) — 맨 안쪽이 구멍, 그 앞을 보스 몸이 꼭 맞게 막음
      const o = origin(mine('B')[0]), n = boss.size, nx = o.x + ((FIELD_W - n) >> 1);
      fill(o.x, o.y, FIELD_W, n + 1, WALL);
      fill(nx, o.y, n, n + 1, FLOOR, true);
      ports.push({ ...opts.exit, x: nx, y: o.y, w: n, h: 1, hole: true });
      post(boss, nx, o.y + 1, true);
    }
    else post(boss, ...at(boss, center(mine('B')[0])), false);
    for (const room of mine('B')) {                          // 보스의 방도 그 격의 지역 — 몬스터 없는 이름뿐인 곳 (구멍으로 거꾸로 들어와도 지역이 맞게)
      const o = origin(room);
      areas.push({ name: `${boss.name}의 방`, x: o.x, y: o.y, w: FIELD_W, h: FIELD_H, zone: zone.id });
    }
    if (hidden) post(hidden, ...at(hidden, center(mine('H')[0])), false);
  }

  // 보물상자 — 방 구석, 가장자리에서 두 칸 안. 길(잇기)이 난 변의 구석은 피함 — 길목을 막지 않게
  const chests = [];
  const linkSides = room => {
    const sides = new Set();
    for (const l of links) {
      if (l.a === room) sides.add(l.dir === 'h' ? 'e' : 's');
      if (l.b === room) sides.add(l.dir === 'h' ? 'w' : 'n');
    }
    return sides;
  };
  const quietCorner = (room, avoid) => {
    const sides = linkSides(room);
    return ['se', 'sw', 'ne', 'nw'].map(c => ({ c, p: sides.has(c[0]) + sides.has(c[1]) + (avoid === c ? 2 : 0) })).sort((p, q) => p.p - q.p)[0].c;
  };
  const chestItem = rank => (data.ITEMS.find(i => i.chest && i.rank.n === rank) || {}).id;
  const placeChest = (room, corner, id, rank, big) => {
    const o = origin(room), x = o.x + (corner[1] === 'w' ? 2 : FIELD_W - 3), y = o.y + (corner[0] === 'n' ? 2 : FIELD_H - 3);
    fill(x - 1, y - 1, 3, 3, FLOOR, true);
    const item = big ? chestItem(rank) : undefined;
    if (big && !item) throw new Error(`${rank}격 큰 상자 — 상자 전용 장비(CHEST_ITEMS)가 없음`);
    chests.push({ name: '보물상자', x, y, chest: id, rank, big: big || undefined, item });
  };
  for (const c of opts.chests || []) {
    const room = rooms.find(o => `${o.c},${o.r}` === c.room);
    if (!room) throw new Error(`보물상자 ${c.id} — 방 ${c.room} 이(가) 그림에 없음`);
    placeChest(room, c.corner, c.id, room.rank || ranks[0], !!c.big);
  }
  if (opts.autoChests) for (const rank of ranks) {
    const of = kind => byDist(rooms.filter(o => o.rank === rank && o.kind === kind));
    const far = of('n').reverse();                           // 첫 공간에서 걸어서 먼 들판부터
    const first = of('n')[0];                                // 그 격 첫 들판 — 북서쪽 구석은 상인 자리
    const bigRoom = of('H')[0] || of('B')[0] || far[0];
    placeChest(bigRoom, quietCorner(bigRoom, bigRoom === first ? 'nw' : null), `r${rank}-big`, rank, true);
    // 작은 상자 — 가장 먼 들판 하나, 그 격 가운데쯤 들판 하나 (곳곳에 — 끝에 몰리지 않게)
    const rest = far.filter(o => o !== bigRoom), smalls = [rest[0], rest[Math.floor(rest.length / 2)]].filter((o, i, all) => o && all.indexOf(o) === i);
    smalls.forEach((room, i) => placeChest(room, quietCorner(room, room === first ? 'nw' : null), `r${rank}-${i + 1}`, rank, false));
  }

  // 4) 장애물 — 지나가는 곳과 구역 들판에만, 작은 덤불처럼 몇 무더기
  for (const room of rooms) {
    if (room.kind !== 'n' && room.kind !== '..') continue;
    const o = origin(room), t = opts.obstacle(room.rank);
    for (let k = 0; k < CLUMPS; k++) {
      let x = o.x + 2 + Math.floor(rng() * (FIELD_W - 4)), y = o.y + 2 + Math.floor(rng() * (FIELD_H - 4));
      const size = 1 + Math.floor(rng() * 4);
      for (let s = 0; s < size; s++) {
        if (inside(x, y) && tiles[idx(x, y)] === FLOOR && !keep[idx(x, y)]) tiles[idx(x, y)] = t;
        if (rng() < 0.5) x += rng() < 0.5 ? 1 : -1; else y += rng() < 0.5 ? 1 : -1;
      }
    }
  }

  // 5) 시작점에서 닿지 않는 칸은 벽으로 — 갇힌 빈칸에 몬스터가 서지 않게
  const secretAt = new Uint8Array(w * h);
  for (const s of secrets) for (let j = 0; j < s.h; j++) for (let i = 0; i < s.w; i++) secretAt[idx(s.x + i, s.y + j)] = 1;
  const open = k => tiles[k] === FLOOR || tiles[k] === ROAD || secretAt[k];
  const seen = new Uint8Array(w * h), q = [idx(sc.x, sc.y)];
  seen[q[0]] = 1;
  for (let n = 0; n < q.length; n++) {
    const k = q[n], x = k % w, y = (k / w) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const j = idx(x + dx, y + dy);
      if (inside(x + dx, y + dy) && !seen[j] && open(j)) { seen[j] = 1; q.push(j); }
    }
  }
  for (let k = 0; k < w * h; k++) if (!seen[k] && (tiles[k] === FLOOR || tiles[k] === ROAD)) tiles[k] = WALL;

  // 겉모습 — 칸마다 가까운 방(틈 · 길은 반씩 나눔)의 것
  let lookLayer;
  if (opts.look) {
    const at = new Map(rooms.map(o => [`${o.c},${o.r}`, o]));
    lookLayer = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const room = at.get(`${Math.floor((x - (GAP >> 1)) / PITCH_X)},${Math.floor((y - (GAP >> 1)) / PITCH_Y)}`) || null;
      lookLayer[idx(x, y)] = opts.look(room, tiles[idx(x, y)]);
    }
  }
  return buildTmj({ w, h, tiles, areas, posts, ports, secrets, npcs, chests, look: lookLayer });
}

// ---------- 처음 + 1격 — 지하수로 (sewer) ----------
// 바깥(overworld)과 떨어진 지하 던전 한 장 (사용자 스케치) — 맨 아래 첫 공간에서 위로 레벨 순으로 1 → 9번 방, 맨 위에 보스 방.
// 방은 모두 같은 크기의 반듯한 방, 이웃한 방끼리는 짧은 길로 다 이어짐. 보스(던전 가디언) 뒤 막다른 틈 안의 구멍으로 들어가면
// 화면이 까매졌다가 바깥 숲(overworld 의 sewer 구멍 앞)에 섭니다. 바깥의 그 구멍으로 들어오면 보스 방 구멍 앞으로.
//   스케치의 방 번호 = order 의 차례 ('칸,줄' — 그림의 몇 번째 칸 · 몇 번째 줄). 1격 일반을 약한 것부터 그 차례로 세웁니다.
const SEWER = {
  plan: [
    '   1B',
    '   |',
    '1n-1n-1n',
    '|  |  |',
    '1n-1n-1n',
    '   |  |',
    '   1n-1n',
    '   |',
    '   1n',
    '   |',
    '   S.'
  ],
  order: ['1,4', '1,3', '1,2', '2,3', '2,2', '0,2', '2,1', '0,1', '1,1'],  // 1 ~ 9번 방
  // 보물상자 (든 것은 data.js 의 chestLoot — 격 · 크기로) — 첫 공간 · 갈림길 끝의 4 · 6번 방 · 길에서 가장 먼 8번 방(큰 상자)
  chests: [
    { id: 'sewer-1', room: '1,5', corner: 'sw' },
    { id: 'sewer-2', room: '2,3', corner: 'se' },
    { id: 'sewer-3', room: '0,2', corner: 'sw' },
    { id: 'sewer-4', room: '0,1', corner: 'nw', big: true }
  ]
};
function sewer(data) {
  return generate(SEWER.plan, [1], data, {
    seed: 5,
    plaza: '첫 공간',
    obstacle: () => WATER,                                   // 고인 물웅덩이
    square: true,
    open: 4,
    order: { 1: SEWER.order },
    chests: SEWER.chests,
    look: (room, t) => t === WATER ? look(OL.WATER, 1)
      : room && room.kind === 'S.' ? look(OL.COBBLE, 7) : room && room.kind === 'B' ? look(OL.TILES, 8) : look(OL.COBBLE, 1),
    exit: { name: 'out', label: '바깥', to: 'overworld.sewer' }
  });
}

// ---------- 2~6격 한 장 (overworld) — design/map-concept 시안 배치 그대로, OVERWORLD_SCALE 배로 크게 ----------
// 시안의 맨 아래 처음 · 1격 지하수로 자리는 비워 두고(어둠), 따로 뽑은 지하수로(sewer) 지도와 숲 남쪽 끝의 구멍으로 오갑니다.
// 땅 모양 · 격 나누기 · 물 · 흙길 · 다리 · 성벽은 tools/overworld-layout.js 가 정하고 (시안 그림과 같이 씀),
// 여기서는 그 칸을 게임 칸으로 바꾸고 구역 · 정해진 자리 · 상인 · 문을 시안 그림의 같은 자리에 둡니다.
//   어둠 → 벽 · 물 · 수로 · 용암 → 물 · 바위 등성이 · 흑요석 벼랑 · 바위턱 → 바위 · 처음의 방을 두른 통바위 → 벽
// 다음 격은 보스가 제 크기만큼의 틈을 막고 서서 엽니다 — 1 → 2 (지하수로 보스 방의 던전 가디언 — sewer) · 2 → 3 · 4 (숲에서 그대로 이어짐, 3격은 막다른 곳)
// · 4 → 5 (쐐기돌 아치의 거인왕) · 5 → 6 (대성당 뒤 묘실 통로의 불사의 왕) · 왕좌의 방 (벌레의 굴). 트롤 킹은 숲 속 굴에서 막지 않고 기다림
// 아래 좌표는 모두 시안 칸 (176×112) — 배율을 바꿔도 그대로 둡니다.
const OVERWORLD_SCALE = 2.5;
// 구역은 네모가 아니라 땅 모양대로 — 아래 자리의 한가운데에서 그 격의 땅을 따라 퍼집니다 (나무 · 물 · 벼랑을 넘지 않고 늘 한 덩어리).
// 이웃 구역 자리와의 사이(땅을 따라 잰 거리)의 AREA_SHARE 까지만 차지하고(그 사이는 몬스터 없는 쉴 땅, 사용자 결정),
// 막다른 곳에서도 AREA_REACH 칸 넘게는 퍼지지 않습니다. 가장자리는 AREA_WOBBLE 칸쯤 들쭉날쭉하게.
const AREA_SHARE = 0.4, AREA_REACH = 18, AREA_WOBBLE = 3;

// 구역의 자리 [x0, y0, x1, y1] (끝 칸 포함 — 이 네모의 한가운데가 그 구역이 퍼져 나가는 곳) — 어느 몬스터가 어디 서는지는 길을 따라 정합니다:
// 그 격에 들어오는 곳(OVERWORLD_ENTRY)에서 멀어지고 보스에 가까워질수록 센 몬스터 (보스 쪽으로 갈수록 강하게, 사용자 결정).
// 다만 가장 약한 몬스터는 들어오는 곳에서 걸어서 가장 먼저 닿는 구역에 — 처음 만나는 것이 가장 약한 것 (1격은 슬라임).
// 가장 약한 몬스터의 구역 들머리(구역 한가운데에 가장 가까운 걸을 수 있는 칸 — js/map.js 의 areaMid)가 그 지역 들머리입니다 (불러오면 거기 섭니다).
const OVERWORLD_AREAS = {
  2: [[26, 52, 45, 61], [6, 52, 25, 61], [46, 52, 62, 61], [26, 42, 45, 51], [6, 42, 25, 51],      // 수문 앞에서 왕국 성벽 쪽으로
      [46, 42, 62, 51], [6, 32, 25, 41], [46, 32, 62, 41], [26, 32, 45, 41]],
  3: [[31, 21, 46, 28], [47, 21, 64, 28], [9, 21, 30, 28], [37, 12, 50, 20], [23, 12, 36, 20],     // 성문 앞에서 성 쪽으로 (성 안은 구역 밖)
      [51, 12, 64, 20], [37, 3, 50, 11], [51, 3, 64, 11], [23, 3, 36, 11]],
  4: [[66, 40, 80, 58], [68, 59, 86, 74], [81, 40, 100, 56], [72, 22, 86, 39], [87, 22, 100, 39],  // 숲 가장자리 → 남쪽 · 가운데 → 북쪽 눈밭 → 동쪽 아치 앞
      [87, 57, 109, 74], [101, 36, 109, 56]],
  5: [[116, 44, 132, 58], [116, 59, 132, 73], [116, 74, 132, 89], [133, 74, 149, 89], [133, 59, 149, 73],   // 아치 앞에서 대성당 쪽으로
      [150, 74, 167, 89], [150, 59, 167, 73], [150, 44, 167, 58], [133, 44, 149, 58]],
  6: [[131, 33, 146, 40], [114, 33, 130, 40], [113, 5, 123, 32], [124, 19, 143, 32], [124, 5, 146, 18]]   // 묘실 입구 → 용암 강 → 칠죄종 홀 → 북쪽
};
// 정해진 자리 — 시안 그림의 그 그림 조각 자리 (앞에 서는 것은 한 칸 아래)
//   [이름, x, y] 그 칸을 가운데로 그 적의 크기(n × n, data.js ENEMY_SIZE)만큼
//   [이름, 'gate'] 길을 막는 자리 — overworld-layout.js 의 GATES (그 크기만큼 넓힌 틈을 꼭 맞게 막도록)
const OVERWORLD_POSTS = [
  ['트롤 킹', 12, 38],                                               // 숲 북서쪽 시내 상류의 굴 앞 (길은 막지 않음)
  ['오크 장군', 13, 46], ['숲의 마녀', 54, 41],                         // 야영지 · 오두막
  ['몰락한 왕', 14, 13],                                             // 성 안 왕좌
  ['그리핀 로드', 56, 15], ['히드라', 28, 25],                         // 탑 자리 · 물에 잠긴 안뜰 (카벙클은 몰락한 왕 곁의 숨은 굴 — SECRET_ROOMS)
  ['돌 거인', 98, 39], ['서리 거인', 101, 41], ['불의 거인', 98, 43], ['구름 거인', 95, 41],   // 돌 고리
  ['거인왕', 'gate'],                                                   // 쐐기돌 아치
  ['흰 말의 기사', 128, 60], ['붉은 말의 기사', 132, 60], ['검은 말의 기사', 128, 63], ['창백한 말의 기사', 132, 63],   // 네 말의 기사 광장
  ['데스 나이트', 122, 77], ['리치', 160, 55], ['까마귀 왕', 158, 81],  // 영묘 둘 · 숨은 묘실
  ['불사의 왕', 'gate'],                                                // 대성당 — 그 뒤 벼랑의 묘실 통로
  ['칠죄종 · 탐욕', 127, 21], ['칠죄종 · 질투', 133, 21], ['칠죄종 · 색욕', 139, 21], ['칠죄종 · 폭식', 127, 30],
  ['칠죄종 · 오만', 133, 30], ['칠죄종 · 분노', 139, 30], ['칠죄종 · 나태', 142, 25],          // 홀의 불꽃 받침
  ['세계수를 먹는 벌레', 'gate'],                                       // 왕좌의 방으로 가는 굴
  ['마왕', 155, 23], ['관측자', 157, 30]                             // 왕좌 · 문 곁 (왕좌의 방을 줄이며 한 칸 안쪽으로)
];
const OVERWORLD_ENTRY = { 2: [38, 60], 3: [44, 28], 4: [66, 50], 5: [116, 48], 6: [136, 39] };   // 구멍 앞 · 옛 성문 자리 · 숲 가장자리 · 아치 너머 · 묘실 입구
// 숨은 굴 — 보스를 꺾으면 그 보스 바로 뒤(위로 한 칸 띄워)에 구멍이 나타나고(appears), 들어가면 히든 하나만 있는 작은 굴 (사용자 결정 — 3격만).
// 구멍은 열리기 전엔 보이지도 막히지도 않는 그냥 땅. 굴의 구멍으로 나오면 다시 그 구멍 앞
const SECRET_ROOMS = [
  { id: 'grotto', title: '숨은 굴', boss: '몰락한 왕', hidden: '카벙클', bigChest: true }   // 3격 — 성 안 왕좌 뒤, 바위턱 폭포 밑 물웅덩이의 굴 · 3격의 큰 상자도 여기
];
const OVERWORLD_MERCHANTS = { forest: [34, 58], ruins: [40, 26], giantpass: [70, 46], necropolis: [120, 50], abyss: [128, 37] };

// 칸 모음(구멍 없는 한 덩어리) → 둘레를 시계 방향으로 도는 다각형. 꼭짓점은 칸 모서리 (칸 단위, x · y 에서 잰 값).
// 둘레의 변마다 「구역이 오른쪽」 방향으로 잇고, 곧게 이어지는 꼭짓점은 뺍니다
function outline(mine, box) {
  const W = box.w + 1, key = (x, y) => (y - box.y) * W + (x - box.x), next = new Map();
  const has = (x, y) => mine.has(y * OUT_W + x);
  for (const k of mine) {
    const x = k % OUT_W, y = (k / OUT_W) | 0;
    if (!has(x, y - 1)) next.set(key(x, y), [x + 1, y]);
    if (!has(x + 1, y)) next.set(key(x + 1, y), [x + 1, y + 1]);
    if (!has(x, y + 1)) next.set(key(x + 1, y + 1), [x, y + 1]);
    if (!has(x - 1, y)) next.set(key(x, y + 1), [x, y]);
  }
  const k0 = next.keys().next().value, pts = [];
  let k = k0, guardN = 0;
  do {
    const [x, y] = next.get(k);
    pts.push([x, y]);
    k = key(x, y);
    if (++guardN > next.size) throw new Error('구역 둘레가 한 바퀴로 이어지지 않음');
  } while (k !== k0);
  if (pts.length !== next.size) throw new Error('구역 둘레가 둘 이상 — 구멍이 남았거나 떨어진 조각');
  const corner = pts.filter((p, i) => {
    const a = pts[(i + pts.length - 1) % pts.length], b = pts[(i + 1) % pts.length];
    return (p[0] - a[0]) * (b[1] - p[1]) !== (p[1] - a[1]) * (b[0] - p[0]);
  });
  const x0 = Math.min(...corner.map(p => p[0])), y0 = Math.min(...corner.map(p => p[1]));
  return { x: x0, y: y0, polygon: corner.map(([x, y]) => ({ x: x - x0, y: y - y0 })) };
}
let OUT_W = 0;   // outline 이 칸 번호를 x · y 로 풀 때 쓰는 지도 너비 (overworld 가 정함)

function overworld(data) {
  // 길을 막는 것의 크기만큼 틈을 넓혀 땅을 짭니다
  const gateSize = Object.fromEntries(OVERWORLD_POSTS.filter(([, x]) => x === 'gate').map(([name]) => {
    const e = data.ENEMIES.find(f => f.name === name && f.rank.n >= 2 && f.rank.n <= 6);
    if (!e) throw new Error(`정해진 자리 — ${name} 이(가) 2~6격에 없음`);
    return [e.id, e.size];
  }));
  const L = require('./overworld-layout.js').build(OVERWORLD_SCALE, gateSize);
  const w = L.W, h = L.H, idx = L.idx;
  OUT_W = w;
  const inside = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
  const tiles = new Uint8Array(w * h);
  const keep = new Uint8Array(w * h);                        // 장애물을 두지 않을 칸 — 정해진 자리 곁 · 들머리 · 상인 · 시작점 · 문 · 길가
  const guard = (x, y, rw, rh, pad) => { for (let j = -pad; j < rh + pad; j++) for (let i = -pad; i < rw + pad; i++) if (inside(x + i, y + j)) keep[idx(x + i, y + j)] = 1; };
  const rectOf = (x0, y0, x1, y1) => { const [a, b] = L.span(x0, x1), [c, d] = L.span(y0, y1); return { x: a, y: c, w: b - a + 1, h: d - c + 1 }; };

  // 1) 땅 → 칸
  for (let i = 0; i < w * h; i++) {
    const t = L.ter[i];
    tiles[i] = t === L.VOID || L.wallMask[i] ? WALL
      : t === L.WATER || t === L.CANAL || t === L.LAVA ? WATER
      : L.hgt[i] === 3 ? ROCK
      : t === L.ROCKY && L.bio[i] === 7 ? WALL
      : FLOOR;
  }
  // 흙길 — 시안 길의 폭 그대로 (숲 시내를 건너는 곳은 통나무 다리). ROADS 는 시안 픽셀 좌표
  for (const r of L.ROADS) {
    const pad = r.hw + 2, px = v => (v - 8) / L.T;            // 시안 픽셀 → 시안 칸
    const x0 = Math.max(0, Math.floor(L.fc(px(Math.min(r.ax, r.bx) - pad)))), x1 = Math.min(w - 1, Math.ceil(L.fc(px(Math.max(r.ax, r.bx) + pad))));
    const y0 = Math.max(0, Math.floor(L.fc(px(Math.min(r.ay, r.by) - pad)))), y1 = Math.min(h - 1, Math.ceil(L.fc(px(Math.max(r.ay, r.by) + pad))));
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const X = L.toC(tx) * L.T + 8, Y = L.toC(ty) * L.T + 8, vx = r.bx - r.ax, vy = r.by - r.ay, l2 = vx * vx + vy * vy || 1;
      const k = Math.max(0, Math.min(1, ((X - r.ax) * vx + (Y - r.ay) * vy) / l2));
      const i = idx(tx, ty);
      if (Math.hypot(X - (r.ax + vx * k), Y - (r.ay + vy * k)) <= pad && (tiles[i] === FLOOR || tiles[i] === WATER)) { tiles[i] = ROAD; keep[i] = 1; }
    }
  }
  const fillRect = (r, t) => { for (let j = 0; j < r.h; j++) for (let i = 0; i < r.w; i++) tiles[idx(r.x + i, r.y + j)] = t; };
  for (const b of L.BRIDGES) fillRect(b.vertical ? rectOf(b.x, b.y, b.x + b.wide - 1, b.y + b.len - 1) : rectOf(b.x, b.y, b.x + b.len - 1, b.y + b.wide - 1), ROAD);
  for (const [x, y] of L.CASTLE.columns) fillRect(rectOf(x, y, x, y), ROCK);
  // 처음 · 1격 자리는 어둠으로 — 따로 뽑은 지하수로(sewer) 지도
  for (let i = 0; i < w * h; i++) if ([1, 7].includes(L.zoneAt(i % w, (i / w) | 0))) tiles[i] = WALL;

  // 2) 구역 · 정해진 자리 · 상인 · 시작점 · 문
  const areas = [], posts = [], npcs = [], ports = [], seeds = {};
  // 지하수로로 가는 구멍 — 옛 수문 자리, 숲 남쪽 끝 (그 아래는 어둠). 지도의 시작점은 그 구멍 바로 위
  const hx = Math.round(L.fc(38)) - 1;
  let hy = 0;
  while (L.zoneAt(hx + 1, hy + 1) !== 1) hy++;                 // 1격(지하수로 벽)이 시작하는 줄 바로 위
  ports.push({ name: 'sewer', label: '지하수로', x: hx, y: hy, w: 3, h: 1, to: 'sewer.out', hole: true });
  fillRect({ x: hx, y: hy, w: 3, h: 1 }, FLOOR);
  const sx = hx + 1, sy = hy - 1;
  npcs.push({ name: 'start', x: sx, y: sy });
  guard(hx, hy - 2, 3, 3, 2);
  const foes = data.ENEMIES.filter(e => e.rank.n >= 2 && e.rank.n <= 6 && e.kind !== 'normal');
  for (const [name, x, y] of OVERWORLD_POSTS) {
    const e = foes.find(f => f.name === name);
    if (!e) throw new Error(`정해진 자리 — ${name} 이(가) 2~6격에 없음`);
    const blocks = x === 'gate', n = e.size;
    if (blocks && !L.GATES[e.id]) throw new Error(`길막 자리 — ${name}(${e.id}) 이(가) GATES 에 없음`);
    const [px, py] = blocks ? L.GATES[e.id] : L.spotN(x, y, n);
    posts.push(n > 1 ? { name, x: px, y: py, w: n, h: n, enemy: e.id, blocks } : { name, x: px, y: py, enemy: e.id, blocks });
    guard(px, py, n, n, 2);
  }
  // 숨은 굴로 가는 구멍 — 그 보스 바로 뒤 (보스 몸 위로 한 칸 띄워, 보스 폭만큼)
  for (const s of SECRET_ROOMS) {
    const boss = foes.find(e => e.name === s.boss), bp = posts.find(p => p.enemy === boss.id);
    const hole = { name: s.id, label: s.title, x: bp.x, y: bp.y - 2, w: bp.w, h: 1, to: `${s.id}.out`, opensAfter: boss.id, appears: true, hole: true };
    ports.push(hole);
    fillRect(hole, FLOOR);
    fillRect({ x: hole.x, y: hole.y + 1, w: hole.w, h: 1 }, FLOOR);
    guard(hole.x, hole.y, hole.w, 2, 1);
  }
  const hiddenElsewhere = new Set(SECRET_ROOMS.map(s => s.hidden));
  const missing = foes.filter(e => !hiddenElsewhere.has(e.name) && !posts.some(p => p.enemy === e.id));
  if (missing.length) throw new Error(`정해진 자리가 없는 정예 · 보스 — ${missing.map(e => e.name).join(', ')}`);
  const walkFrom = cells => {
    const d = new Int32Array(w * h).fill(-1), q = [];
    for (const k of cells) if (d[k] < 0) { d[k] = 0; q.push(k); }
    for (let n = 0; n < q.length; n++) {
      const k = q[n], x = k % w, y = (k / w) | 0;
      for (const [ex, ey] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const j = idx(x + ex, y + ey);
        if (inside(x + ex, y + ey) && d[j] < 0 && (tiles[j] === FLOOR || tiles[j] === ROAD)) { d[j] = d[k] + 1; q.push(j); }
      }
    }
    return d;
  };
  // 구역이 퍼져 나갈 곳 — 시안의 구역 자리 한가운데 (나무가 덮지 않게 비워 둠). 구역 모양은 나무까지 다 둔 뒤 5) 에서
  for (let rank = 2; rank <= 6; rank++) {
    const zi = data.ZONES.findIndex(z => z.rank === rank), zone = data.ZONES[zi];
    const normals = data.ENEMIES.filter(e => e.zoneIndex === zi && e.kind === 'normal');
    if (OVERWORLD_AREAS[rank].length !== normals.length) throw new Error(`${rank}격 — 구역 ${OVERWORLD_AREAS[rank].length}개, 일반 ${normals.length}종`);
    seeds[rank] = OVERWORLD_AREAS[rank].map(([x0, y0, x1, y1]) => {
      const r = rectOf(x0, y0, x1, y1), c = { x: r.x + (r.w >> 1), y: r.y + (r.h >> 1), rect: [x0, y0, x1, y1] };
      guard(c.x - 1, c.y - 1, 3, 3, 0);
      return c;
    });
    const [mx, my] = L.spot1(...OVERWORLD_MERCHANTS[zone.id]);
    npcs.push({ name: 'merchant', x: mx, y: my, zone: zone.id });
    guard(mx, my, 1, 1, 1);
  }
  // 마왕 뒤 — 관측자 곁에 문의 광장으로 가는 문 (마왕을 꺾어야 열림) · 시안의 문 그림은 155 · 156 칸 사이가 가운데
  const king = foes.find(e => e.rank.n === 6 && e.kind === 'boss');
  const hub = { name: 'hub', label: '문의 광장', x: Math.round(L.fc(155.5)) - 1, y: L.spot1(0, 31)[1], w: 2, h: 1, to: 'hub.overworld', opensAfter: king.id };
  ports.push(hub);
  guard(hub.x, hub.y, 2, 1, 2);

  // 3) 나무 · 바위 무더기 — 시안의 숲덩이 잡음이 짙은 자리에만 (덩어리 숲 — 사이는 넓게 트임)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = idx(x, y);
    if (tiles[i] !== FLOOR || keep[i]) continue;
    const b = L.bio[i], grove = L.fbm(L.toC(x) * 0.16, L.toC(y) * 0.16, 83), r = L.hash(x, y, 80);
    if ((b === 2 && grove > 0.6 && r < 0.8) || ((b === 3 || b === 9) && grove > 0.64 && r < 0.6) || (b === 4 && grove > 0.6 && r < 0.55) || (b === 5 && grove > 0.62 && r < 0.3)) tiles[i] = TREE;
    else if ((b === 4 && r < 0.012) || (b === 6 && r < 0.035)) tiles[i] = ROCK;
  }

  // 4) 시작점에서 닿는 칸 — 나무 · 바위 무더기에 갇힌 정해진 자리 · 들머리 · 상인은 가까운 길까지 나무를 베어 이음
  const STEP = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const open = k => tiles[k] === FLOOR || tiles[k] === ROAD;
  const seen = new Uint8Array(w * h);
  const flood = from => {
    const q = [from];
    seen[from] = 1;
    for (let n = 0; n < q.length; n++) {
      const k = q[n], x = k % w, y = (k / w) | 0;
      for (const [ex, ey] of STEP) {
        const j = idx(x + ex, y + ey);
        if (inside(x + ex, y + ey) && !seen[j] && open(j)) { seen[j] = 1; q.push(j); }
      }
    }
  };
  flood(idx(sx, sy));
  const carve = from => {                                    // 나무 · 바위만 지나 가장 가까운 닿는 칸까지 — 그 길의 나무 · 바위를 바닥으로
    const back = new Int32Array(w * h).fill(-2), q = [from];
    back[from] = -1;
    for (let n = 0; n < q.length; n++) {
      const k = q[n], x = k % w, y = (k / w) | 0;
      if (seen[k]) { for (let c = back[k]; c >= 0; c = back[c]) if (tiles[c] === TREE || tiles[c] === ROCK) tiles[c] = FLOOR; return; }
      for (const [ex, ey] of STEP) {
        const j = idx(x + ex, y + ey);
        if (inside(x + ex, y + ey) && back[j] === -2 && [FLOOR, ROAD, TREE, ROCK].includes(tiles[j])) { back[j] = k; q.push(j); }
      }
    }
  };
  const cellsOf = p => { const out = []; for (let j = 0; j < (p.h || 1); j++) for (let i = 0; i < (p.w || 1); i++) out.push([p.name, p.x + i, p.y + j]); return out; };
  const stand = [...posts.flatMap(cellsOf), ...ports.filter(p => p.appears).flatMap(cellsOf), ...npcs.map(n => [n.name, n.x, n.y])];
  for (const [, x, y] of stand) {
    const k = idx(x, y);
    if (seen[k] || !open(k)) continue;
    carve(k);
    flood(k);
  }
  for (let k = 0; k < w * h; k++) {                         // 그래도 갇힌 빈칸은 둘레의 나무 · 바위로 메움 — 몬스터가 서지 않게
    if (seen[k] || !open(k)) continue;
    const nb = [k - 1, k + 1, k - w, k + w].map(j => tiles[j]);
    tiles[k] = nb.includes(TREE) ? TREE : nb.includes(ROCK) ? ROCK : WALL;
  }
  // 서는 자리는 모두 걸을 수 있는 칸이어야 — 시안을 고쳐 어긋나면 여기서 알림
  const bad = stand.filter(([, x, y]) => !seen[idx(x, y)]);
  if (bad.length) throw new Error(`걸을 수 없는 자리 — ${bad.map(([n, x, y]) => `${n}(${x},${y})`).join(', ')}`);

  // 5) 구역 — 땅 모양대로 (AREA_SHARE · AREA_REACH · AREA_WOBBLE). 그 격의 걸을 수 있는 땅(성 안은 뺌) 위에서, 구역 자리마다 땅을 따라 잰 거리
  //    (대각선은 1.41 — 트인 곳에서 둥글게)로 나눔: 가장 가까운 자리의 구역이 되, 그 자리까지가 둘째로 가까운 자리까지와 합친 거리의
  //    AREA_SHARE 이하 · AREA_REACH 칸 이하인 칸만 (가장자리는 잡음으로 들쭉날쭉). 그 가운데 자리에서 걸어서 이어지는 한 덩어리만 남기고,
  //    구역 속에 갇힌 나무 · 바위는 구역에 넣어 구멍 없이.
  //    약한 것부터 길을 따라: 들어오는 곳에서의 거리 − 보스까지의 거리가 작은 구역부터, 가장 약한 것은 들어오는 곳에서 걸어서 가장 먼저 닿는 구역
  const mids = [];                                           // 구역 들머리 [x, y] — 보물상자를 그 곁에 두지 않게
  for (let rank = 2; rank <= 6; rank++) {
    const zi = data.ZONES.findIndex(z => z.rank === rank), zone = data.ZONES[zi];
    const normals = data.ENEMIES.filter(e => e.zoneIndex === zi && e.kind === 'normal');
    const land = k => seen[k] && open(k) && L.zoneAt(k % w, (k / w) | 0) === rank && L.bio[k] !== 8;
    const walkLand = from => {                                // 땅을 따라 잰 거리 — 대각선은 1.41 (두 옆 칸이 다 땅일 때만), 못 가면 -1
      const d = new Float64Array(w * h).fill(-1), heap = [[0, from]];
      const push = it => { heap.push(it); for (let i = heap.length - 1; i > 0;) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
      const pop = () => {
        const top = heap[0], last = heap.pop();
        if (heap.length) {
          heap[0] = last;
          for (let i = 0; ;) {
            const l = i * 2 + 1, r = l + 1; let m = i;
            if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
            if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
            if (m === i) break;
            [heap[m], heap[i]] = [heap[i], heap[m]]; i = m;
          }
        }
        return top;
      };
      while (heap.length) {
        const [dk, k] = pop();
        if (d[k] >= 0) continue;
        d[k] = dk;
        const x = k % w, y = (k / w) | 0;
        for (let ey = -1; ey <= 1; ey++) for (let ex = -1; ex <= 1; ex++) {
          if (!ex && !ey) continue;
          const nx = x + ex, ny = y + ey, j = idx(nx, ny);
          if (!inside(nx, ny) || d[j] >= 0 || !land(j)) continue;
          if (ex && ey && (!land(idx(x + ex, y)) || !land(idx(x, y + ey)))) continue;
          push([dk + (ex && ey ? Math.SQRT2 : 1), j]);
        }
      }
      return d;
    };
    const starts = seeds[rank].map(c => {                     // 자리 한가운데에서 가장 가까운 그 격의 땅
      let best = -1, bestD = Infinity;
      for (let y = c.y - 12; y <= c.y + 12; y++) for (let x = c.x - 12; x <= c.x + 12; x++) {
        if (!inside(x, y) || !land(idx(x, y))) continue;
        const dd = (x - c.x) ** 2 + (y - c.y) ** 2;
        if (dd < bestD) { bestD = dd; best = idx(x, y); }
      }
      if (best < 0) throw new Error(`${rank}격 구역 자리 [${c.rect}] — 가까이에 그 격의 걸을 수 있는 땅이 없음`);
      return best;
    });
    const dist = starts.map(walkLand);
    const near = new Int16Array(w * h).fill(-1);               // 잡음을 얹은 조건을 지키는 칸의 가장 가까운 자리
    for (let k = 0; k < w * h; k++) {
      let a = -1, d1 = Infinity, d2 = Infinity;
      dist.forEach((d, i) => { const v = d[k]; if (v < 0) return; if (v < d1) { d2 = d1; d1 = v; a = i; } else if (v < d2) d2 = v; });
      if (a < 0) continue;
      const e = d1 + (L.fbm((k % w) * 0.12, ((k / w) | 0) * 0.12, 90 + rank) - 0.5) * 2 * AREA_WOBBLE;
      if (e <= AREA_REACH && (d2 === Infinity || e <= AREA_SHARE * (d1 + d2))) near[k] = a;
    }
    const owner = new Int16Array(w * h).fill(-1);              // 그 자리에서 걸어서(네 방향) 이어지는 것만 — 늘 한 덩어리
    starts.forEach((s0, i) => {
      if (near[s0] !== i) near[s0] = i;
      const q = [s0];
      owner[s0] = i;
      while (q.length) {
        const k = q.pop(), x = k % w, y = (k / w) | 0;
        for (const [ex, ey] of STEP) {
          const j = idx(x + ex, y + ey);
          if (inside(x + ex, y + ey) && owner[j] < 0 && near[j] === i) { owner[j] = i; q.push(j); }
        }
      }
    });
    const fromEntry = walkFrom([idx(...L.spot1(...OVERWORLD_ENTRY[rank]))]);
    const boss = posts.find(q => q.enemy === data.ENEMIES.find(e => e.zoneIndex === zi && e.kind === 'boss').id);
    const toBoss = walkFrom([...Array(boss.w * boss.h).keys()].map(k => idx(boss.x + k % boss.w, boss.y + ((k / boss.w) | 0))));
    const regions = starts.map((s0, i) => {
      const cells = [];
      for (let k = 0; k < w * h; k++) if (owner[k] === i) cells.push(k);
      const xs = cells.map(k => k % w), ys = cells.map(k => (k / w) | 0);
      const box = { x: Math.min(...xs) - 1, y: Math.min(...ys) - 1, w: Math.max(...xs) - Math.min(...xs) + 3, h: Math.max(...ys) - Math.min(...ys) + 3 };
      const mine = new Set(cells);
      // 구멍 메우기 — 둘레 밖에서 구역이 아닌 칸을 따라 퍼져 닿지 않는 칸은 구역에 갇힌 것
      const outsideCell = new Set(), q = [];
      for (let y = box.y; y < box.y + box.h; y++) for (let x = box.x; x < box.x + box.w; x++)
        if ((x === box.x || y === box.y || x === box.x + box.w - 1 || y === box.y + box.h - 1) && !mine.has(idx(x, y))) { outsideCell.add(idx(x, y)); q.push([x, y]); }
      while (q.length) {
        const [x, y] = q.pop();
        for (const [ex, ey] of STEP) {
          const nx = x + ex, ny = y + ey, j = idx(nx, ny);
          if (nx < box.x || ny < box.y || nx >= box.x + box.w || ny >= box.y + box.h || mine.has(j) || outsideCell.has(j)) continue;
          outsideCell.add(j); q.push([nx, ny]);
        }
      }
      for (let y = box.y + 1; y < box.y + box.h - 1; y++) for (let x = box.x + 1; x < box.x + box.w - 1; x++) {
        const j = idx(x, y);
        if (mine.has(j) || outsideCell.has(j)) continue;
        if (owner[j] >= 0) throw new Error(`${rank}격 — 한 구역이 다른 구역을 감쌈`);
        mine.add(j);
      }
      let sum = 0, n = 0, near = Infinity;
      for (const k of mine) if (fromEntry[k] >= 0 && toBoss[k] >= 0) { sum += fromEntry[k] - toBoss[k]; n++; near = Math.min(near, fromEntry[k]); }
      if (!n) throw new Error(`${rank}격 구역 자리 [${seeds[rank][i].rect}] — 들어오는 곳이나 보스에서 걸어서 닿지 않음`);
      return { mine, box, score: sum / n, near };
    }).sort((p, q) => p.score - q.score);
    // 가장 약한 것은 들어오자마자 만나게 — 들어오는 곳에서 걸어서 가장 먼저 닿는 구역 (나머지는 위 순서대로)
    const first = regions.reduce((b, r) => (r.near < b.near ? r : b));
    regions.splice(regions.indexOf(first), 1);
    regions.unshift(first);
    regions.forEach((r, k) => {
      const mid = clearMid(r);
      mids.push([mid % w, (mid / w) | 0]);
      const { x, y, polygon } = outline(r.mine, r.box);
      areas.push({ name: normals[k].name, x, y, polygon, rank, monster: normals[k].id, zone: zone.id });
    });
  }

  // 구역 들머리(js/map.js 의 areaMid 와 같은 셈 — 구역 칸들의 무게중심에 가장 가까운 걸을 수 있는 칸, 같으면 위 · 왼쪽) 둘레 나무를 베어 비워 둠.
  // 벤 칸이 더 가까우면 들머리가 그리로 옮겨 가니, 들머리가 더 안 바뀔 때까지 되풀이합니다
  function clearMid(r) {
    let sx = 0, sy = 0;
    for (const k of r.mine) { sx += k % w; sy += (k / w) | 0; }
    const tx = sx / r.mine.size, ty = sy / r.mine.size;
    const nearest = () => {
      let best = -1, bestD = Infinity;
      for (let y = r.box.y; y < r.box.y + r.box.h; y++) for (let x = r.box.x; x < r.box.x + r.box.w; x++) {
        const k = idx(x, y);
        if (!r.mine.has(k) || !open(k)) continue;
        const d = (x - tx) ** 2 + (y - ty) ** 2;
        if (d < bestD) { bestD = d; best = k; }
      }
      return best;
    };
    for (let mid = nearest(), guardN = 0; guardN < 20; guardN++) {
      const x = mid % w, y = (mid / w) | 0;
      for (let j = y - 1; j <= y + 1; j++) for (let i = x - 1; i <= x + 1; i++) { const k = idx(i, j); if (r.mine.has(k) && tiles[k] === TREE) tiles[k] = FLOOR; }
      const next = nearest();
      if (next === mid) return mid;
      mid = next;
    }
    return nearest();
  }

  // 6) 보물상자 — 격마다 작은 상자 둘 · 큰 상자 하나 (숨은 굴에 큰 상자가 있는 격은 작은 것 둘만).
  //    그 격에 들어오는 곳에서 보스까지의 지름길에서 가장 멀리 벗어나야 닿는 곳부터 (막다른 곳 · 구석) —
  //    들어오는 곳까지 + 보스까지 − 지름길 걸음 수가 큰 칸. 가장 먼 곳이 큰 상자.
  //    둘레 여덟 칸이 다 걸을 수 있는 바닥(길목을 막지 않게) · 정해진 자리 · 문 · 상인 · 들머리에서 4칸 넘게 · 상자끼리 40칸 넘게
  const chests = [];
  const bigElsewhere = new Set(SECRET_ROOMS.filter(s => s.bigChest).map(s => data.ENEMIES.find(e => e.name === s.hidden).rank.n));
  const cellsOfRect = r => { const out = []; for (let j = 0; j < (r.h || 1); j++) for (let i = 0; i < (r.w || 1); i++) out.push([r.x + i, r.y + j]); return out; };
  const busy = [...posts.flatMap(cellsOfRect), ...ports.flatMap(cellsOfRect), ...npcs.map(n => [n.x, n.y])];
  busy.push(...mids);                                         // 구역 들머리
  for (let rank = 2; rank <= 6; rank++) {
    const zi = data.ZONES.findIndex(z => z.rank === rank);
    const boss = posts.find(q => q.enemy === data.ENEMIES.find(e => e.zoneIndex === zi && e.kind === 'boss').id);
    const fromEntry = walkFrom([idx(...L.spot1(...OVERWORLD_ENTRY[rank]))]);
    const toBoss = walkFrom(cellsOfRect(boss).map(([x, y]) => idx(x, y)));
    const D = Math.min(...cellsOfRect(boss).map(([x, y]) => fromEntry[idx(x, y)]).filter(v => v >= 0));
    const cand = [];
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const k = idx(x, y);
      if (tiles[k] !== FLOOR || L.zoneAt(x, y) !== rank || L.bio[k] === 8 || fromEntry[k] < 0 || toBoss[k] < 0) continue;
      let ring = true;
      for (let j = -1; j <= 1 && ring; j++) for (let i = -1; i <= 1; i++) if (!open(idx(x + i, y + j))) { ring = false; break; }
      if (!ring || busy.some(([bx, by]) => Math.max(Math.abs(bx - x), Math.abs(by - y)) <= 4)) continue;
      cand.push({ x, y, d: fromEntry[k] + toBoss[k] - D });
    }
    cand.sort((p, q) => q.d - p.d || p.y - q.y || p.x - q.x);
    const want = bigElsewhere.has(rank) ? 2 : 3, picked = [];
    for (const c of cand) {
      if (picked.length >= want) break;
      if (picked.some(q => Math.hypot(q.x - c.x, q.y - c.y) < 40)) continue;
      picked.push(c);
    }
    if (picked.length < want) throw new Error(`${rank}격 보물상자 — 둘 자리가 ${picked.length}곳뿐`);
    const item = (data.ITEMS.find(i => i.chest && i.rank.n === rank) || {}).id;
    picked.forEach((c, i) => {
      const big = !bigElsewhere.has(rank) && i === 0;
      if (big && !item) throw new Error(`${rank}격 큰 상자 — 상자 전용 장비(CHEST_ITEMS)가 없음`);
      chests.push({ name: '보물상자', x: c.x, y: c.y, chest: big ? `r${rank}-big` : `r${rank}-${bigElsewhere.has(rank) ? i + 1 : i}`, rank, big: big || undefined, item: big ? item : undefined });
    });
  }

  // 겉모습 — 시안의 땅 종류 · 격 그대로 (흙길 칸은 흙, 물을 건너는 흙길 칸은 물 그대로 — 그림이 널판 다리로 그림)
  const lookLayer = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const wet = L.ter[i] === OL.WATER || L.ter[i] === OL.CANAL;
    lookLayer[i] = look(tiles[i] === ROAD && !wet ? OL.DIRT : L.ter[i], L.bio[i]);
  }
  return buildTmj({ w, h, tiles, areas, posts, ports, npcs, chests, look: lookLayer });
}

// ---------- 숨은 굴 (SECRET_ROOMS) — 히든 하나만 있는 작은 굴 ----------
// 둥근 굴 한가운데에 히든, 양옆에 고인 물, 맨 아래 가장자리에 바깥(overworld 의 그 구멍)으로 나가는 구멍. 지역은 없음 — 들어와도 지역은 그대로
function secretRoom(data, s) {
  const W = 26, H = 20, cx = W >> 1, cy = (H >> 1) - 1;
  const noise = valueNoise(17);
  const tiles = new Uint8Array(W * H).fill(WALL);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = ((x + 0.5 - cx) / 10.5) ** 2 + ((y + 0.5 - cy) / 7.5) ** 2;
    if (d < 1 - noise(x * 0.3, y * 0.3) * 0.18) tiles[y * W + x] = FLOOR;
  }
  for (const px of [cx - 7, cx + 6]) for (let y = cy - 2; y <= cy + 1; y++) for (let x = px; x < px + 2; x++) {   // 고인 물 — 굴 양옆
    if (Math.hypot(x + 0.5 - (px + 1), (y + 0.5 - cy) * 0.8) < 2) tiles[y * W + x] = WATER;
  }
  const foe = data.ENEMIES.find(e => e.name === s.hidden);
  if (!foe || foe.kind !== 'hidden') throw new Error(`숨은 굴 — ${s.hidden} 이(가) 히든이 아님`);
  const n = foe.size, post = { name: foe.name, x: cx - (n >> 1), y: cy - (n >> 1), w: n, h: n, enemy: foe.id, blocks: false };
  let oy = H - 1;
  while (tiles[oy * W + cx] !== FLOOR) oy--;                 // 한가운데 줄의 맨 아래 바닥 칸
  for (let x = cx - 1; x <= cx + 1; x++) { tiles[oy * W + x] = FLOOR; tiles[(oy - 1) * W + x] = FLOOR; }
  const out = { name: 'out', label: '나가기', x: cx - 1, y: oy, w: 3, h: 1, to: `overworld.${s.id}`, hole: true };
  // 그 격의 큰 상자 — 굴 안쪽 오른쪽 위 (사용자 결정: 격마다 큰 상자 하나, 3격은 이 굴에)
  const chests = [];
  if (s.bigChest) {
    const x = cx + 5, y = cy - 4, item = (data.ITEMS.find(i => i.chest && i.rank.n === foe.rank.n) || {}).id;
    for (let j = y - 1; j <= y + 1; j++) for (let i = x - 1; i <= x + 1; i++) if (tiles[j * W + i] !== FLOOR) throw new Error(`숨은 굴 — 상자 둘레가 바닥이 아님 (${i},${j})`);
    chests.push({ name: '보물상자', x, y, chest: `r${foe.rank.n}-big`, rank: foe.rank.n, big: true, item });
  }
  const lookLayer = Uint8Array.from(tiles, t => (t === WATER ? look(OL.WATER, 7) : look(OL.ROCKY, 7)));
  return buildTmj({ w: W, h: H, tiles, posts: [post], ports: [out], npcs: [{ name: 'start', x: cx, y: oy - 1 }], chests, look: lookLayer, props: { title: s.title } });
}

// ---------- 7~20격 — 비슷한 것끼리 일곱 장 (docs/MAP-REFERENCE-PLAN.md 2-2) ----------
// 어귀(S.)에 문의 광장으로 돌아가는 문이 있고, 광장의 그 장 문으로 들어오면 그 앞에 섭니다.
// 바로 앞 격이 같은 장에 있으면 그 보스가 고갯길(b)을 막고, 앞 격이 다른 장에 있는 먼 격(①의 13격 · ②의 12격)은
// 어귀 아래 지나가는 곳(..)으로 처음부터 들어갈 수 있되, 지금 격의 들판과는 강(~)으로 갈려 보이기만 합니다.
const REALMS = [
  { name: 'legends', title: '인간의 전설', ranks: [7, 13], obstacle: ROCK, plan: [
    '         1E          1H',
    '         |           ?',
    'S.-1n-1n-1n-1n-1n-1n-1n-1n-1n-1B',
    '|  ~  ~  ~  ~  ~  ~  ~  ~  ~',
    '..-2n-2n-2n-2n-2n-2n-2n-2n-2n',
    '                           |',
    '                           2n-2B'
  ] },
  { name: 'arthurian', title: '원탁과 마법', ranks: [8, 9, 12], obstacle: TREE, plan: [
    '         1E       1H                   2E',
    '         |        ?                    |',
    'S.-1n-1n-1n-1n-1n-1n-1n-1n-1nb2n-2n-2n-2n-2n-2n-2n-2n-2n-2B',
    '|  ~  ~  ~  ~  ~  ~',
    '..-3n-3n-3n-3n-3E-3B'
  ] },
  { name: 'east', title: '동방', ranks: [10, 11], obstacle: TREE, plan: [
    '      1E                         2E       2H',
    '      |                          |        ?',
    'S.-1n-1n-1n-1n-1n-1n-1nb2n-2n-2n-2n-2n-2n-2n-2n-2n-2B'
  ] },
  { name: 'heavenhell', title: '천국과 지옥', ranks: [14, 15], obstacle: ROCK, plan: [
    '            1E',
    '            |',
    'S.-1n-1n-1n-1n-1n-1n-1n-1n-1n',
    '         ~  ~  ~  ~  ~  ~  b',
    '   2B-2E-2n-2n-2n-2n-2n-2n-2n'
  ] },
  { name: 'gods', title: '신들의 시대', ranks: [16, 17, 18], obstacle: ROCK, plan: [
    '      1E=1E                2E                   3E',
    '      |                    |                    |',
    'S.-1n-1n-1n-1n-1n-1nb2n-2n-2n-2n-2n-2nb3n-3n-3n-3n-3n-3n-3n-3B'
  ] },
  { name: 'oldones', title: '르뤼에', ranks: [19], obstacle: ROCK, plan: [
    '            1E',
    '            |',
    'S.-1n-1n-1n-1n-1n-1n-1n-1B'
  ] },
  { name: 'outer', title: '바깥', ranks: [20], obstacle: ROCK, plan: [
    'S.-1n-1n-1n-1n-1n-1n-1n-1n-1n-1B'
  ] }
];
function realm(data, r, i) {
  return generate(r.plan, r.ranks, data, {
    seed: 11 + i * 7,
    plaza: `${r.title} 어귀`,
    obstacle: () => r.obstacle,
    entry: o => ({ name: 'in', label: '문의 광장', x: o.x + 2, y: o.y + (FIELD_H >> 1) - 1, w: 1, h: 2, to: `hub.${r.name}` }),
    autoChests: true
  });
}

// ---------- 문의 광장 (hub) ----------
// 지도끼리 오가는 넓은 광장. 북쪽 가장자리에 7~20격 일곱 장의 문, 남쪽에 마왕의 성(overworld)으로 돌아가는 문.
// 장마다 문은 그 앞 격의 보스를 꺾으면 열립니다 (docs/MAP-REFERENCE-PLAN.md 2-2 표).
// first — 그 장이 시작하는 격 (그 지도가 아직 없으면 그 격의 지역으로 지도 밖에 나섭니다) · after — 그 격의 보스를 꺾어야 열림
const HUB_DOORS = [
  { name: 'legends',    label: '① 인간의 전설', first: 7,  after: 6 },
  { name: 'arthurian',  label: '② 원탁과 마법', first: 8,  after: 7 },
  { name: 'east',       label: '③ 동방',        first: 10, after: 9 },
  { name: 'heavenhell', label: '④ 천국과 지옥', first: 14, after: 13 },
  { name: 'gods',       label: '⑤ 신들의 시대', first: 16, after: 15 },
  { name: 'oldones',    label: '⑥ 르뤼에',      first: 19, after: 18 },
  { name: 'outer',      label: '⑦ 바깥',        first: 20, after: 19 }
];
function hub(data) {
  const W = 84, H = 44, cx = W >> 1, cy = (H >> 1) + 2, rx = 38, ry = 17;
  const noise = valueNoise(7);
  const tiles = new Uint8Array(W * H).fill(WALL);
  const set = (x, y, t) => { tiles[y * W + x] = t; };
  // 둥근 광장 — 가장자리만 살짝 들쭉날쭉
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
    if (d < 1 - noise(x * 0.25, y * 0.25) * 0.12) set(x, y, FLOOR);
  }
  // 가운데 샘과 그 둘레 길, 남쪽 문에서 샘까지 길
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const r = Math.hypot((x - cx) / 1.6, y - cy);
    if (r < 3) set(x, y, WATER);
    else if (r < 5) set(x, y, ROAD);
  }
  for (let y = cy + 5; y < cy + ry; y++) for (let x = cx - 1; x <= cx + 1; x++) if (tiles[y * W + x] === FLOOR) set(x, y, ROAD);

  const boss = rank => data.ENEMIES.find(e => e.rank.n === rank && e.kind === 'boss');
  const zoneOf = rank => data.ZONES.find(z => z.rank === rank);
  const ports = HUB_DOORS.map((d, i) => {
    const x = Math.round(cx - rx * 0.78 + (rx * 1.56) * i / (HUB_DOORS.length - 1)) - 1;
    let y = 0;
    while (tiles[y * W + x] !== FLOOR || tiles[y * W + x + 1] !== FLOOR) y++;   // 북쪽 가장자리의 첫 바닥 칸
    for (let j = y; j < y + 4; j++) { set(x, j, ROAD); set(x + 1, j, ROAD); }   // 문 앞 짧은 길
    return { name: d.name, label: d.label, x, y, w: 2, h: 1, to: `${d.name}.in`, opensAfter: boss(d.after).id, zone: zoneOf(d.first).id };
  });
  // 남쪽 — 마왕의 성으로 돌아가는 문 (늘 열림)
  let sy = H - 1;
  while (tiles[sy * W + cx] !== ROAD && tiles[sy * W + cx] !== FLOOR) sy--;
  ports.push({ name: 'overworld', label: '마왕의 성으로', x: cx - 1, y: sy, w: 3, h: 1, to: 'overworld.hub' });
  const npcs = [{ name: 'start', x: cx, y: sy - 2 }];
  return buildTmj({ w: W, h: H, tiles, ports, npcs, props: { title: '문의 광장' } });
}

// 뽑을 지도 전부 — { 파일 이름: 만드는 함수 }
function allMaps(data) {
  const out = { sewer: sewer(data), overworld: overworld(data), hub: hub(data) };
  for (const s of SECRET_ROOMS) out[s.id] = secretRoom(data, s);
  REALMS.forEach((r, i) => { out[r.name] = realm(data, r, i); });
  return out;
}

module.exports = { TILE, FLOOR, WALL, WATER, TREE, ROCK, ROAD, buildTmj, tilesPng, looksPng, encodePng, generate, sewer, overworld, hub, secretRoom, allMaps, layoutFromPlan, HUB_DOORS, REALMS, SEWER, SECRET_ROOMS };
