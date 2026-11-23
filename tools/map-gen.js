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
// 땅의 종류 말고 그림만 쓰는 겉모습 — 건물(바깥 지도에서 막힌 건물 한 채, 그림이 통째로 그림) · 문간(안 지도의 나가는 문)
const BUILD = 12, DOORWAY = 13, CARPET = 14;   // CARPET — 건물 안 붉은 깔개
const RUIN = 15;                                 // 무너진 옛 성벽 · 옛 성문 탑 (막힌 칸 — 그림이 무너진 성벽으로, 옛 성문은 아치까지)

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
  const base = { [BUILD]: [120, 114, 104], [DOORWAY]: [230, 210, 160], [CARPET]: [120, 30, 36], [RUIN]: [150, 140, 120], [OL.GRASS]: [111, 160, 74], [OL.DIRT]: [180, 138, 90], [OL.COBBLE]: [141, 138, 130], [OL.TILES]: [185, 173, 148], [OL.WATER]: [31, 90, 150],
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
    if (sets.length && opts.spreadSets) {
      // 임시 — 홀에 몰려 있으면 한 화면에 큰 정예가 열 마리쯤 겹쳐 무거워서(사용자 지적), 그 격의 들판 곳곳에 흩어 둡니다.
      // 자리는 들판마다 가운데 줄의 왼쪽 · 오른쪽 둘(한가운데는 들머리 · 묶음 밖 정예 자리), 홀은 왼쪽 · 가운데 · 오른쪽 셋.
      // 가까운 들판부터 그 자리들을 고르게 골라 원래 차례대로 세웁니다 (나중에 지도를 자세히 만들 때 다시 놓을 것)
      const spots = [];
      for (const room of fields) { const o = origin(room), y = o.y + (FIELD_H >> 1); spots.push({ x: o.x + 5, y }, { x: o.x + 14, y }); }
      for (const room of halls) { const o = origin(room), y = o.y + (FIELD_H >> 1); spots.push({ x: o.x + 4, y }, { x: o.x + (FIELD_W >> 1), y }, { x: o.x + 15, y }); }
      if (spots.length < sets.length) throw new Error(`${rank}격 — 묶음 정예 ${sets.length}마리를 흩어 둘 자리가 ${spots.length}곳뿐`);
      sets.forEach((e, i) => post(e, ...at(e, spots[Math.floor((i + 0.5) * spots.length / sets.length)]), false));
    } else if (sets.length) {
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
      ports.push({ ...opts.exit, x: nx, y: o.y, w: n, h: 1, hole: true, art: 'ladder' });   // 벽에 박힌 쇠 사다리 — 위로 올라감
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
    // 도시로 나가는 이상한 게이트 — 첫 공간 아래 가장자리 가운데. 도시가 열린 뒤(첫 회차가 끝난 뒤)에만 나타남 (needsCity).
    // 들어서면 그 회차가 끝나고 도시로 (ui.js 의 askLeave → game.js 의 leaveSpace)
    entry: o => ({ name: 'city', label: '도시로', x: o.x + (FIELD_W >> 1) - 1, y: o.y + FIELD_H - 1, w: 2, h: 1, to: 'oldtown.gate', rift: true, appears: true, needsCity: true }),
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
  5: [[117, 44, 131, 55], [117, 60, 130, 72], [137, 52, 151, 63], [152, 45, 166, 56],   // 땅 곳곳에 (사용자 결정 2026-11-22 — 데몬 로드 · 발록이 지하로 가며 다시 놓음)
      [137, 64, 151, 77], [153, 60, 167, 73], [153, 76, 167, 88]],      // 밴시 · 서큐버스 · 뱀파이어 자리 (AREA_FIX) — 남서쪽 성당 터 둘레 · 남쪽 가운데는 빈 땅
};
// 정해진 자리 — 시안 그림의 그 그림 조각 자리 (앞에 서는 것은 한 칸 아래)
//   [이름, x, y] 그 칸을 가운데로 그 적의 크기(n × n, data.js ENEMY_SIZE)만큼
//   [이름, 'gate'] 길을 막는 자리 — overworld-layout.js 의 GATES (그 크기만큼 넓힌 틈을 꼭 맞게 막도록)
const OVERWORLD_POSTS = [
  ['트롤 킹', 12, 38, 'block'],                                      // 숲 북서쪽 바위산 앞 트롤 부락 — 뒤 골짜기의 2격 큰 상자로 가는 길을 막음 (TROLL_VILLAGE, 사용자 결정 2026-11-20)
  ['오크 장군', 43.3, 56.1],                                          // 오크 부락 한가운데 — 오크 전사 · 홉고블린 구역 사이 (ORC_VILLAGE, 사용자 결정 2026-11-20) · 숲의 마녀는 오두막 안 (BUILDINGS)
  ['그리핀 로드', 56, 15], ['히드라', 28, 23],                         // 탑 자리 · 물가의 히드라 둥지 (NESTS — 2026-11-21 두 칸 북쪽으로) (카벙클은 몰락한 왕 곁의 숨은 굴 — SECRET_ROOMS)
  // 4격 정예 거인 넷 — 저마다 제 땅에 (사용자 결정 2026-11-21): 돌 거인은 언덕 거인 곁 큰 바위들 사이 · 서리 거인은 북쪽 눈밭 ·
  // 불의 거인은 남쪽 거친 바위밭의 용암 곁 · 구름 거인은 가운데 길 북쪽의 높은 둔덕 (GIANT_GROUNDS · HIGH_GROUNDS)
  ['돌 거인', 77.7, 39.3], ['서리 거인', 84.9, 28.9], ['불의 거인', 84.1, 66.1], ['구름 거인', 103.3, 34.5],
  ['거인왕', 'gate'],                                                   // 쐐기돌 아치
  ['흰 말의 기사', 129, 61], ['붉은 말의 기사', 147, 48], ['검은 말의 기사', 160, 66], ['창백한 말의 기사', 143, 70],   // 네 기사는 서로 멀리 (사용자 결정 2026-11-22): 광장 · 대성당 동쪽 · 동쪽 가운데 · 남쪽 길가
  ['데스 나이트', 135.5, 77], ['리치', 160, 55], ['까마귀 왕', 158, 81],  // 남쪽 길 끝의 무너진 성당 터 (CHAPELS) · 영묘 · 숨은 묘실
                                                                       // 불사의 왕은 대성당 아래 지하의 신전에 (UNDERS)
                                                                       // 6격(칠죄종 · 벌레 · 마왕 · 관측자)은 따로 뽑는 지도 abyss 에 (ABYSS — 사용자 결정 2026-11-23)
];
const OVERWORLD_ENTRY = { 2: [38, 60], 3: [44, 28], 4: [66, 50], 5: [116, 48] };   // 구멍 앞 · 옛 성문 자리 · 숲 가장자리 · 아치 너머 · 묘실 입구
// 숨은 굴 — 보스를 꺾으면 그 보스 바로 뒤(위로 한 칸 띄워)에 구멍이 나타나고(appears), 들어가면 히든 하나만 있는 작은 굴 (사용자 결정 — 3격만).
// 구멍은 열리기 전엔 보이지도 막히지도 않는 그냥 땅. 굴의 구멍으로 나오면 다시 그 구멍 앞
// 동굴 (사용자 결정 2026-11-22 — 4격 큰 상자가 3격 만티코어 곁에 있어 3격에서 너무 쉽게 얻어서) — 그 격 땅 깊은 곳의 바위 턱 남쪽 절벽에 굴 입구(cave),
// 안은 따로 뽑은 굴 지도: 구불구불한 길 · 몬스터 방 둘(rooms 의 몬스터 — 그 격의 구역) · 맨 안쪽에 그 격의 큰 상자. mouth — 입구 가운데 칸(시안 좌표)
const CAVES = [
  { id: 'giantcave', title: '거인의 동굴', rank: 4, zone: 'giantpass', mouth: [106.5, 58.1], rooms: ['설인', '털매머드'] }   // 털매머드 · 로크 구역 사이, 동쪽 바위 등성이
];
// 지하 (사용자 결정 2026-11-22) — 5격 대성당 앞뜰의 묘실 계단(mouth — 시안 칸)으로 내려가면 따로 뽑은 지하 지도: 어둑한 굴 길 →
// 첫 방 · 둘째 방(rooms — 그 격의 일반 몬스터, 바깥 지도엔 없음) · 용암 웅덩이 → 신전(거대한 해골 · 파란 불꽃 횃불 · 기둥)의 보스 →
// 보스를 꺾어야 열리는 위로 가는 계단 → 바깥 지도 up(시안 칸 — 다음 격의 들머리)의 계단으로 올라옴
const UNDERS = [
  { id: 'crypt', title: '대성당 아래 묘실', rank: 5, zone: 'necropolis', boss: '불사의 왕', rooms: ['데몬 로드', '발록'], mouth: [136, 45.6], next: 'abyss.in' }   // next — 보스를 꺾으면 열리는 위로 가는 문이 닿는 곳 (6격 마계)
];
const CRYPT_BIO = 11;                                        // 지하 신전 바닥 — 그림(js/mapart.js)이 이 격 번호로 푸르스름한 어둔 돌바닥 · 뼈 장식을 고름
const underNormal = e => UNDERS.some(u => u.rank === e.rank.n && u.rooms.includes(e.name));   // 지하에만 사는 일반 몬스터 (바깥 지도엔 구역 없음)
const SECRET_ROOMS = [
  { id: 'grotto', title: '숨은 굴', boss: '몰락한 왕', hidden: '카벙클', bigChest: true, from: 'castle' }   // 3격 — 성 안 왕좌 뒤, 바위턱 폭포 밑 물웅덩이의 굴 · 3격의 큰 상자도 여기
];
// 건물 — 바깥 지도(overworld)에는 문이 하나 난 닫힌 건물, 문으로 들어가면 따로 뽑은 안 지도 (사용자 결정 — 3격 몰락한 왕의 성부터).
// 앞으로 건물이 있는 지도는 모두 이렇게. layout — overworld-layout.js 의 그 건물 (box 건물 자리 · hall 안의 큰 방 · gate 정면 가운데 문의 시안 x),
// boss — 안에 서는 보스, door — 바깥 문 폭, hall — 안의 큰 방 (칸): w · h 크기 · aisle 가운데 깔개(나가는 문)의 폭 ·
// bossY 위 벽에서 보스까지 · pillarX 옆 벽에서 기둥까지 · pillarRows 위 벽에서 기둥 줄마다 · pillar 기둥 한 변
const BUILDINGS = [
  { id: 'castle', title: '몰락한 왕의 성', layout: 'CASTLE', boss: '몰락한 왕', door: 4,   // 3격 — 남쪽 정면 가운데 성문 (사용자 결정)
    hall: { w: 27, h: 38, aisle: 3, bossY: 4, pillarX: 5, pillarRows: [9, 16, 23, 30], pillar: 2 } },   // 깔개 끝에 보스 · 기둥은 깔개 양옆으로 넷씩 (사용자 결정)
  // 2격 — 숲의 마녀의 오두막 (사용자 결정 2026-11-20). 안은 큰 방 대신 작은 방(room — storeInterior 틀, 아래 WITCH_ROOM)
  { id: 'witchhut', title: '마녀의 오두막', layout: 'HUT', boss: '숲의 마녀', door: 1, room: 'WITCH_ROOM' }
];
// 정해 둔 구역 — { 격: { 몬스터 id: 그 구역 자리(OVERWORLD_AREAS 의 네모) } }. 약한 차례로 정해지는 것보다 앞섬
// 2격: 서쪽 통나무 다리를 건너면 바로 트렌트(나무 사이), 그 뒤(남쪽) 가고일 (사용자 결정 2026-11-20)
const AREA_FIX = { 2: { treant: [6, 42, 25, 51], gargoyle: [6, 52, 25, 61] },
  // 5격: 밴시는 창백한 말의 기사 자리에 · 서큐버스는 검은 말의 기사 자리에 겹치게, 뱀파이어는 데스 나이트(성당 터)와 떨어진 동쪽 아래 (사용자 결정 2026-11-22)
  5: { banshee: [137, 64, 151, 77], succubus: [153, 60, 167, 73], vampire: [153, 76, 167, 88] } };
// 듬성듬성한 나무를 심는 구역 — { 몬스터 id: 나무 간격(칸) }. 트렌트는 나무 사이에서 생겨남 (사용자 결정 2026-11-20)
const SPARSE_TREES = { treant: 6 };
// 숲 솎기 — 시안 칸 네모 [x0, y0, x1, y1] 안의 빽빽한 숲을 gap 칸마다 한 그루로. 2격 서쪽 통나무 다리 앞 숲 — 트렌트가 그 나무 사이에 섬 (사용자 결정 2026-11-20)
const THIN_FOREST = [{ rect: [11, 46.2, 23.6, 52], gap: 4 }];
// 오크 부락 (2격, 사용자 결정 2026-11-20) — 오크 장군 자리를 가운데로 둥근 다진 흙 마당, 둘레에 뾰족한 통나무 울타리(서 · 동 · 남은 트인 입구),
// 안에 족장 움막 · 가죽 천막 넷 · 모닥불 · 토템 둘 · 무기 걸이 · 가죽 말림대. 모두 막힌 칸(그림은 js/mapart.js 의 orcPix — 지도 속성 blds),
// 들어갈 수 없는 소품 (건물로 들어가는 문은 없음). 자리는 장군 2 × 2 의 오른쪽 아래 칸(cx, cy)에서 잰 칸
const ORC_VILLAGE = {
  boss: '오크 장군', camp: true,                                  // camp — 가장 약한 구역(오크 전사)이 서쪽 반에 걸침
  // 2026-11-20 줄임 (사용자 결정 — 오크 전사 구역에 비해 너무 컸음: 17 × 20 → 11 × 13, 천막 넷 → 둘)
  rx: 5.6, ry: 6.4, oy: 0.5,                                    // 울타리 타원 (칸) · 가운데를 장군보다 반 칸 아래로
  gates: [Math.PI, 0, Math.PI / 2], gateW: 0.3,                 // 트인 입구 — 서(오크 전사 구역 · 길 쪽) · 동(홉고블린 쪽) · 남(지하수로 구멍 쪽)
  pieces: [
    { kind: 'orchut', x: -2, y: -5, w: 4, h: 3 }, { kind: 'totem', x: -3, y: -4, w: 1, h: 1 },
    { kind: 'fire', x: -1, y: 2, w: 1, h: 1 },
    { kind: 'tent', x: 1, y: 2, w: 3, h: 2 }, { kind: 'tent', x: -3, y: 3, w: 3, h: 2 },
    { kind: 'rack', x: 1, y: 4, w: 2, h: 1 }
  ]
};
// 트롤 부락 (2격, 사용자 결정 2026-11-20) — 숲 북서쪽 바위산 앞. 트롤 킹이 바위산에 판 좁은 골짜기(nook) 들머리를 몸으로 막고 서 있고,
// 골짜기 끝 웅덩이 같은 빈터에 2격 큰 보물상자 (트롤 킹을 꺾어야 닿음). 마당은 트롤 킹 아래로, 빛깔은 이끼 낀 잿빛(tone troll).
// 마당 · 골짜기는 어느 구역도 아님 — 바실리스크는 그 오른쪽(시냇물 쪽)에만. 자리는 트롤 킹 4 × 4 의 가운데(cx, cy)에서 잰 칸
const TROLL_VILLAGE = {
  boss: '트롤 킹', tone: 'troll', noArea: true, areaGap: 5,
  rx: 6.5, ry: 4.8, oy: 2.5,
  gates: [0, Math.PI, 0.83], gateW: 0.3,                        // 동(바실리스크 쪽) · 서 · 남동(흙길)
  nook: { x: -2, y: -7, w: 4, h: 5, wall: 2,                     // 트롤 킹 바로 위로 트롤 킹 폭의 골짜기 (양옆은 바위 벽 두 칸)
          pocket: { x: 0, y: -10, rx: 5, ry: 2.8 } },            // 골짜기 끝 빈터 — 가운데에 큰 상자
  pieces: [
    { kind: 'orchut', x: -4, y: 3, w: 4, h: 3 },
    { kind: 'totem', x: -3, y: 0, w: 1, h: 1 }, { kind: 'totem', x: 2, y: 0, w: 1, h: 1 },
    { kind: 'fire', x: 4, y: 2, w: 1, h: 1 }
  ]
};
const VILLAGES = [ORC_VILLAGE, TROLL_VILLAGE];
// 둥지 (사용자 결정 2026-11-21) — 보스 · 정예 자리 둘레에 다진 흙바닥, 둘레에 혼자 선 바위(서로 붙지 않게 — 붙으면 언덕이 됨) 몇 개,
// 안에 알 무더기 · 뼈 (막힌 소품 — 그림은 js/mapart.js 의 orcPix). 바닥 · 둘레는 어느 구역도 아님 (몬스터가 둥지 안에 생겨나지 않게).
// 자리는 그 몬스터 n × n 의 가운데(cx, cy)에서 잰 칸, 바위는 타원 둘레의 각도(라디안, 0 = 동쪽 · π/2 = 남쪽)
const NESTS = [
  { boss: '히드라', rx: 5.4, ry: 4.4, oy: 0.5,
    rocks: [-0.35, 0.3, 0.75, 2.55, 3.05, 3.6, 4.2, 4.75, 5.35],      // 남쪽(흙길 쪽)은 트임 — 각도 사이가 저마다 다르게
    pieces: [{ kind: 'bones', x: -2, y: 3 }, { kind: 'bones', x: 4, y: -2 }, { kind: 'bones', x: -4, y: 0 }] }   // 알은 뺌 (사용자 결정 2026-11-21)
];
// 무너진 성당 터 (사용자 결정 2026-11-22) — 지붕 없이 허물어진 작은 성당. 건물(문 · 안 지도)이 아니라 바깥 지도에 그냥 걸어 들어가는 폐허.
// plan 은 위가 북쪽인 칸 그림: K 그 몬스터가 선 칸 · . 금 간 판석 바닥(걸을 수 있음) · , 그냥 땅 · W 무너진 돌벽 · N 깨진 둥근 창이 난 벽(두 칸) ·
// A 제단(두 칸) · p 부러진 기둥 밑동 · r 돌무더기 · k 작은 해골들이 쌓인 무더기(이어진 k 네모 하나). 벽 · 기둥 · 제단 · 돌무더기는 막힌 소품(그림은 js/mapart.js 의 chapelPix — 지도 속성 blds),
// 바닥 · 소품 · 둘레 두 칸은 어느 구역도 아님 (몬스터가 성당 안 · 벽에 바짝 붙어 생겨나지 않게)
const CHAPELS = [
  { boss: '데스 나이트', plan: [                                       // 남쪽 길의 끝 — 길이 서쪽 벽의 무너진 입구로 들어옴 (사용자 결정 2026-11-22)
    'rWWWNNWWWWW,',     // 북쪽 벽 — 깨진 둥근 창 · 동쪽 끝은 무너져 없음
    'W..........W',
    'W...AA.....W',     // 제단
    'W.p......p.W',     // 부러진 기둥 밑동
    'W...KK.....W',     // 데스 나이트 — 제단 앞
    '....KK....rW',     // 서쪽 벽이 무너진 입구 (세 줄) — 남쪽 길이 여기서 끝남
    '...........W',
    '.......r...r',     // 동쪽 벽이 무너져 돌무더기로
    'W.p........W',
    'WWWr.WWWrWW,'      // 남쪽 벽 — 작은 틈 하나 · 동쪽 끝은 무너져 없음
  ] },
  { boss: '리치', plan: [                                               // 5격 북동쪽 — 데스 나이트의 작은 성당 터와 달리 십자 모양의 큰 성당 터, 제단방엔 작은 해골 무더기만 (사용자 결정 2026-11-22 — 거대한 해골은 너무 컸음)
    ',,,,WWWNNWWW,,,,',   // 북쪽 끝 좁은 제단방(앱스) — 깨진 둥근 창
    ',,,,W..kk..W,,,,',   // 작은 해골들이 쌓인 무더기 (k — 2 × 2, 깨진 창 밑)
    ',,,,W..kk..W,,,,',
    'rWWWW......WWWWr',   // 좌우로 넓은 날개(트랜셉트)의 북쪽 벽
    'W..p...KK...p..W',   // 리치 — 십자의 가운데, 해골 앞
    '.......KK.......',   // 날개 양 끝은 무너져 트임
    'W..............W',
    'rWWW.p....p.WWWr',   // 날개 남쪽 벽 · 아래로 긴 회랑(네이브)
    ',,,W........W,,,',
    ',,,W.p....p.r,,,',   // 회랑 기둥 밑동 · 동쪽 벽은 무너져 돌무더기
    ',,,.........W,,,',   // 서쪽 벽이 무너진 틈
    ',,,W.r....p.W,,,',   // 쓰러진 기둥
    ',,,W....r...W,,,',
    ',,,WWr....rWW,,,'    // 남쪽 정면 — 가운데가 트인 입구
  ] }
];
// 높은 땅 (사용자 결정 2026-11-21) — 걸어 올라갈 수 있는 언덕: 그 몬스터 자리를 가운데로 둥근 윗면(걸을 수 있음 · 그림은 한 층 높게),
// 둘레는 못 지나가는 바위 테(남쪽은 두 칸 — 절벽 면이 그려지는 자리), 남쪽 테 가운데에 바위 계단(stairs — 걸을 수 있음).
// 윗면 · 계단은 어느 구역도 아님. 지도 속성 high · stairs 로 그 칸들을 그림(js/mapart.js 의 cliffPix)에 알려 줌
const HIGH_GROUNDS = [
  { boss: '그리핀 로드', rx: 4.6, ry: 3.6, oy: 0, stairs: { x: -1, w: 3 } },   // 탑 자리 — 바위 계단으로 올라가는 높은 둔덕
  { boss: '구름 거인', rx: 5.2, ry: 4.2, oy: 0, stairs: { x: -1, w: 3 } }      // 4격 — 가운데 길 북쪽, 구름 위에 서 있는 듯 높은 둔덕
];
// 거인의 땅 (4격, 사용자 결정 2026-11-21) — 그 몬스터 n × n 의 왼쪽 위 칸에서 잰 자리에
//   rocks: [dx, dy, w, h] 바위 덩이 (붙은 바위 칸 — 그림은 작은 언덕 · 절벽, 1 × 1 은 혼자 선 바위), lava: [dx, dy] 용암 칸 (못 지나감 · 일렁이는 빛)
const GIANT_GROUNDS = [
  { boss: '돌 거인', rocks: [[-5, -1, 3, 2], [6, -3, 2, 2], [5, 3, 3, 3], [-4, 5, 2, 2], [1, -4, 2, 2], [-7, 3, 1, 1], [9, 1, 1, 1]] },
  { boss: '불의 거인', rocks: [[-2, -3, 1, 1], [-6, -1, 1, 1], [-2, 1, 1, 1], [-7, 1, 1, 1], [-4, 3, 1, 1], [-9, 3, 1, 1], [-6, 5, 1, 1],
                             [5, -2, 1, 1], [6, 1, 1, 1], [4, 5, 1, 1], [1, 6, 1, 1], [-3, 6, 1, 1], [-10, 6, 1, 1]],
    lava: [[-3, -2], [-3, -1], [-4, -1], [-4, 0], [-5, 0], [-5, 1], [-4, 1], [-5, 2], [-6, 2], [-6, 3], [-7, 3], [-7, 4], [-8, 4], [-8, 5], [-9, 5]] }   // 거인 서쪽으로 흘러내리는 용암 줄기
];
const OVERWORLD_MERCHANTS = { forest: [34, 58], ruins: [40, 26], giantpass: [70, 46], necropolis: [120, 50] };
const OW_RANKS = [2, 3, 4, 5];                                 // 바깥 지도(overworld)에 있는 격 — 6격은 따로 뽑는 지도 abyss (사용자 결정 2026-11-23)

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
let OUT_W = 0, OUT_H = 0;   // outline 이 칸 번호를 x · y 로 풀 때 쓰는 지도 너비 (overworld 가 정함)

function overworld(data) {
  // 길을 막는 것의 크기만큼 틈을 넓혀 땅을 짭니다
  const gateSize = Object.fromEntries(OVERWORLD_POSTS.filter(([, x]) => x === 'gate').map(([name]) => {
    const e = data.ENEMIES.find(f => f.name === name && f.rank.n >= 2 && f.rank.n <= 6);
    if (!e) throw new Error(`정해진 자리 — ${name} 이(가) 2~6격에 없음`);
    return [e.id, e.size];
  }));
  const L = require('./overworld-layout.js').build(OVERWORLD_SCALE, gateSize);
  const w = L.W, h = L.H, idx = L.idx;
  OUT_W = w; OUT_H = h;
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
  // 처음 · 1격 자리는 어둠으로 — 따로 뽑은 지하수로(sewer) 지도
  for (let i = 0; i < w * h; i++) if ([1, 7].includes(L.zoneAt(i % w, (i / w) | 0))) tiles[i] = WALL;
  // 6격 자리도 어둠으로 — 따로 뽑은 마계(abyss) 지도. 5격과 가르는 흑요석 벼랑(바위 칸)만 남겨 5격의 북쪽 끝이 벼랑 (사용자 결정 2026-11-23)
  for (let i = 0; i < w * h; i++) if (L.zoneAt(i % w, (i / w) | 0) === 6 && tiles[i] !== ROCK) { tiles[i] = WALL; L.ter[i] = L.VOID; }

  // 2) 구역 · 정해진 자리 · 상인 · 시작점 · 문
  const areas = [], posts = [], npcs = [], ports = [], seeds = {};
  // 지하수로로 가는 구멍 — 옛 수문 자리, 숲 남쪽 끝 (그 아래는 어둠). 지도의 시작점은 그 구멍 바로 위
  const hx = Math.round(L.fc(38)) - 1;
  let hy = 0;
  while (L.zoneAt(hx + 1, hy + 1) !== 1) hy++;                 // 1격(지하수로 벽)이 시작하는 줄 바로 위
  ports.push({ name: 'sewer', label: '지하수로', x: hx, y: hy, w: 3, h: 1, to: 'sewer.out', hole: true, art: 'pit' });   // art — 그림 (js/mapart.js 의 holeArt): 흙길 끝의 무너진 구덩이 · 사다리
  fillRect({ x: hx, y: hy, w: 3, h: 1 }, FLOOR);
  const sx = hx + 1, sy = hy - 1;
  npcs.push({ name: 'start', x: sx, y: sy });
  guard(hx, hy - 2, 3, 3, 2);
  const foes = data.ENEMIES.filter(e => e.rank.n >= 2 && e.rank.n <= 6 && e.kind !== 'normal');
  // 건물 — 자리 전체를 막고(그림은 겉모습 BUILD 로 한 채), 남쪽 정면 가운데에 문. 문 칸은 걸을 수 있고 닿으면 안 지도로
  const buildingCells = new Uint8Array(w * h);
  for (const b of BUILDINGS) {
    const C = L[b.layout], r = rectOf(...C.box);
    fillRect(r, WALL);
    for (let j = 0; j < r.h; j++) for (let i = 0; i < r.w; i++) buildingCells[idx(r.x + i, r.y + j)] = 1;
    const door = { name: b.id, label: b.title, x: L.spot1(C.gate, 0)[0] - (b.door >> 1), y: r.y + r.h - 1, w: b.door, h: 1, to: `${b.id}.out`, door: true };
    ports.push(door);
    fillRect(door, FLOOR);
    guard(door.x, door.y + 1, door.w, 2, 2);                   // 문 앞은 트여 있게
  }
  for (const [name, x, y, how] of OVERWORLD_POSTS) {
    const e = foes.find(f => f.name === name);
    if (!e) throw new Error(`정해진 자리 — ${name} 이(가) 2~6격에 없음`);
    if (BUILDINGS.some(b => b.boss === name)) throw new Error(`정해진 자리 — ${name} 은(는) 건물 안에 섬 (BUILDINGS)`);
    const blocks = x === 'gate' || how === 'block', n = e.size;     // block — 정해진 자리에 서서 그 뒤로 가는 길을 막음 (그 길은 VILLAGES 의 nook 이 팜)
    if (x === 'gate' && !L.GATES[e.id]) throw new Error(`길막 자리 — ${name}(${e.id}) 이(가) GATES 에 없음`);
    const [px, py] = x === 'gate' ? L.GATES[e.id] : L.spotN(x, y, n);
    posts.push(n > 1 ? { name, x: px, y: py, w: n, h: n, enemy: e.id, blocks } : { name, x: px, y: py, enemy: e.id, blocks });
    guard(px, py, n, n, 2);
  }
  // 부락 — 마당(흙) · 울타리 · 움막 · 천막 … (VILLAGES). 마당엔 나무가 안 섬
  const village = new Uint8Array(w * h), blds = [], VC = {};  // village: 1 마당 흙 · 2 막힌 소품 · VC 오크 부락 가운데 · 둘레 네모
  const noArea = new Uint8Array(w * h), bigAt = {};           // noArea — 어느 구역도 아닌 칸 (트롤 부락 마당 · 골짜기) · bigAt 격마다 정해 둔 큰 상자 자리
  for (const V of VILLAGES) {
    const og = posts.find(p => p.name === V.boss), cx = og.x + (og.w >> 1), cy = og.y + (og.h >> 1);
    if (V.camp) Object.assign(VC, { cx, cy, box: [cx - Math.ceil(V.rx), cy - Math.ceil(V.ry - V.oy), Math.ceil(V.rx) * 2 + 1, Math.ceil(V.ry) * 2 + 1] });
    // 골짜기 — 바위산을 파서 트롤 킹 폭의 길(양옆 바위 벽)과 끝의 둥근 빈터. 큰 상자는 빈터 가운데
    if (V.nook) {
      const N = V.nook, P = N.pocket;
      for (let y = cy + P.y - 4; y < cy + N.y + N.h; y++) for (let x = cx + N.x - N.wall - 4; x < cx + N.x + N.w + N.wall + 4; x++) {
        const k = idx(x, y), inPath = x >= cx + N.x && x < cx + N.x + N.w && y >= cy + N.y && y < cy + N.y + N.h;
        const inPocket = Math.hypot((x + 0.5 - (cx + P.x)) / P.rx, (y + 0.5 - (cy + P.y)) / P.ry) < 1;
        const nearOpen = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1], [2, 0], [-2, 0]].some(([ex, ey]) => {
          const xx = x + ex, yy = y + ey;
          return (xx >= cx + N.x && xx < cx + N.x + N.w && yy >= cy + N.y && yy < cy + N.y + N.h) || Math.hypot((xx + 0.5 - (cx + P.x)) / P.rx, (yy + 0.5 - (cy + P.y)) / P.ry) < 1;
        });
        if (inPath || inPocket) { tiles[k] = ROAD; keep[k] = 1; noArea[k] = 1; }   // 흙길 — 큰 상자까지 다져진 길
        else if (nearOpen) { tiles[k] = ROCK; keep[k] = 1; }       // 골짜기 둘레는 바위 벽 — 들머리(트롤 킹) 말고는 못 들어옴
      }
      bigAt[2] = { x: cx + P.x, y: cy + P.y };
    }
    const d = (x, y) => Math.hypot((x + 0.5 - cx) / V.rx, (y + 0.5 - (cy + V.oy)) / V.ry);
    const inGate = (x, y) => { const a = Math.atan2((y + 0.5 - (cy + V.oy)) / V.ry, (x + 0.5 - cx) / V.rx); return V.gates.some(g => Math.abs(Math.atan2(Math.sin(a - g), Math.cos(a - g))) < V.gateW); };
    const put = (x, y, ww, hh, kind, g) => {
      for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) {
        const k = idx(x + i, y + j);
        if (tiles[k] !== FLOOR) throw new Error(`${V.boss} 부락 — ${kind} (${x + i}, ${y + j}) 자리가 빈 땅이 아님`);
        tiles[k] = WALL; village[k] = 2;
      }
      blds.push({ x, y, w: ww, h: hh, kind, g, v: blds.length, ...(V.tone ? { tone: V.tone } : {}) });
    };
    for (let y = cy - 12; y <= cy + 13; y++) for (let x = cx - 11; x <= cx + 11; x++) {
      if (!inside(x, y) || d(x, y) >= 1 || (tiles[idx(x, y)] !== FLOOR && tiles[idx(x, y)] !== ROAD) || noArea[idx(x, y)]) continue;
      if (og && x >= og.x && x < og.x + og.w && y >= og.y && y < og.y + og.h) { keep[idx(x, y)] = 1; if (V.noArea) noArea[idx(x, y)] = 1; tiles[idx(x, y)] = ROAD; continue; }   // 보스가 선 칸 — 소품 · 울타리는 안 두고 바닥은 마당과 같은 흙
      village[idx(x, y)] = 1; keep[idx(x, y)] = 1;
      if (V.noArea) noArea[idx(x, y)] = 1;
    }
    for (const q of V.pieces) put(cx + q.x, cy + q.y, q.w, q.h, q.kind, 'dirt');   // 소품 먼저 — 울타리를 메울 때 그 자리를 비켜 가게
    // 울타리 — 마당 가장자리 칸 (네 방향 이웃 가운데 마당 밖이 있는 칸). 대각선으로만 닿는 두 칸 사이는 안쪽 칸을 하나 더 메워
    // 울타리가 끊기지 않고 이어지게 (사용자 지적 2026-11-20)
    const ring = new Set(), canStake = (x, y) => inside(x, y) && village[idx(x, y)] === 1 && tiles[idx(x, y)] === FLOOR && !inGate(x, y);
    for (let y = cy - 12; y <= cy + 13; y++) for (let x = cx - 11; x <= cx + 11; x++)
      if (canStake(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ex, ey]) => d(x + ex, y + ey) >= 1)) ring.add(idx(x, y));
    for (const k of [...ring]) {
      const x = k % w, y = (k / w) | 0;
      for (const [ex, ey] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
        if (!ring.has(idx(x + ex, y + ey)) || ring.has(idx(x + ex, y)) || ring.has(idx(x, y + ey))) continue;
        const a = [x + ex, y], b = [x, y + ey], [ix, iy] = d(...a) < d(...b) ? a : b, [ox, oy] = d(...a) < d(...b) ? b : a;   // 안쪽 · 바깥쪽 칸
        const outside = (xx, yy) => inside(xx, yy) && tiles[idx(xx, yy)] === FLOOR && !village[idx(xx, yy)] && !inGate(xx, yy) && !noArea[idx(xx, yy)];
        if (canStake(ix, iy)) ring.add(idx(ix, iy));
        else if (outside(ox, oy)) { ring.add(idx(ox, oy)); village[idx(ox, oy)] = 1; keep[idx(ox, oy)] = 1; }   // 안쪽이 소품이면 바깥쪽 칸으로 이음
      }
    }
    for (const k of ring) {                                     // 이웃 울타리 쪽 (n · s · e · w) — 그림이 가로 · 세로 · 꺾임으로 이어 그림
      const x = k % w, y = (k / w) | 0;
      put(x, y, 1, 1, 'stake', 'grass');
      blds[blds.length - 1].link = [[0, -1, 'n'], [0, 1, 's'], [1, 0, 'e'], [-1, 0, 'w']].filter(([ex, ey]) => ring.has(idx(x + ex, y + ey))).map(q => q[2]).join('');
    }
    // 둘레 V.areaGap 칸도 구역 밖 — 그 격 몬스터가 부락에 바짝 붙어 서지 않게 (바실리스크가 트롤 킹에 너무 붙어 있었음, 사용자 지적 2026-11-20)
    if (V.areaGap) for (let y = cy - 16; y <= cy + 16; y++) for (let x = cx - 16; x <= cx + 16; x++) {
      if (!inside(x, y) || noArea[idx(x, y)]) continue;
      let near = false;
      for (let j = -V.areaGap; j <= V.areaGap && !near; j++) for (let i = -V.areaGap; i <= V.areaGap; i++) if (inside(x + i, y + j) && village[idx(x + i, y + j)] && Math.hypot(i, j) <= V.areaGap) { near = true; break; }
      if (near) noArea[idx(x, y)] = 2;
    }
  }
  // 마당은 흙길 칸으로 — 그림이 흙길처럼 가장자리를 둥글게 이음 (칸 모양 계단이 아니게, 사용자 지적 2026-11-20)
  const high = new Uint8Array(w * h), stairs = new Uint8Array(w * h);
  for (const Hg of HIGH_GROUNDS) {
    const og = posts.find(p => p.name === Hg.boss), cx = og.x + og.w / 2, cy = og.y + og.h / 2 + Hg.oy;
    const d = (x, y) => Math.hypot((x + 0.5 - cx) / Hg.rx, (y + 0.5 - cy) / Hg.ry);
    const box = [Math.floor(cx - Hg.rx - 3), Math.floor(cy - Hg.ry - 3), Math.ceil(cx + Hg.rx + 3), Math.ceil(cy + Hg.ry + 4)];
    for (let y = box[1]; y <= box[3]; y++) for (let x = box[0]; x <= box[2]; x++) if (inside(x, y) && d(x, y) < 1) { const k = idx(x, y); tiles[k] = FLOOR; high[k] = 1; keep[k] = 1; noArea[k] = 1; }
    // 바위 테 — 윗면 둘레 한 칸(여덟 방향), 남쪽은 두 칸
    for (let y = box[1]; y <= box[3]; y++) for (let x = box[0]; x <= box[2]; x++) {
      if (!inside(x, y) || high[idx(x, y)]) continue;
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1], [0, -2], [1, -2], [-1, -2]].some(([ex, ey]) => inside(x + ex, y + ey) && high[idx(x + ex, y + ey)]);   // (0, -2) 줄 — 남쪽은 두 칸
      if (near) { const k = idx(x, y); tiles[k] = ROCK; keep[k] = 1; noArea[k] = 1; }
    }
    // 바위 계단 — 남쪽 테를 위에서 아래로 뚫음 (테 두 칸 + 그 아래 한 칸은 트인 땅)
    const sx = Math.floor(cx) + Hg.stairs.x;
    for (let x = sx; x < sx + Hg.stairs.w; x++) {
      let y = Math.floor(cy); while (high[idx(x, y + 1)]) y++;
      for (let j = y + 1; tiles[idx(x, j)] === ROCK; j++) { const k = idx(x, j); tiles[k] = FLOOR; stairs[k] = 1; keep[k] = 1; noArea[k] = 1; }
    }
    guard(sx, Math.floor(cy + Hg.ry) + 3, Hg.stairs.w, 2, 1);
  }
  // 동굴 입구 — 입구 위로 바위 턱(높은 땅 · 남쪽 절벽), 그 절벽 밑 가운데 세 칸이 굴로 들어가는 문 (cave — 그림은 절벽에 뚫린 굴 입구)
  for (const C of CAVES) {
    const mx = Math.round(L.fc(C.mouth[0])), my = Math.round(L.fc(C.mouth[1]));
    for (let y = my - 6; y < my; y++) for (let x = mx - 5; x <= mx + 7; x++) {             // 동쪽은 등성이에 붙임
      const edge = x === mx - 5 && (y === my - 6 || y === my - 1);   // 서쪽 귀퉁이는 깎아 둥글게
      if (inside(x, y) && !edge) tiles[idx(x, y)] = ROCK;
    }
    const port = { name: C.id, label: C.title, x: mx - 1, y: my, w: 3, h: 1, to: `${C.id}.out`, cave: true };
    ports.push(port);
    fillRect(port, FLOOR);
    fillRect({ x: mx - 2, y: my + 1, w: 5, h: 2 }, FLOOR);
    guard(mx - 2, my, 5, 3, 1);
  }
  // 지하로 드나드는 곳 (UNDERS) — 흑요석 바위턱(높은 땅) 밑동에 박힌 고딕 묘실 문 (gate — 뾰족한 돌 아치 · 양옆 돌기둥 · 해골을 새긴 문짝, 사용자 요청 2026-11-22).
  // 문은 5 × 4 칸, 아래 가운데 세 칸이 문. 그림은 js/mapview.js 가 바위 면(MapArt.rockWall — 문보다 한 칸 높게)과 문(MapArt.gothicGate)을 문 칸 위에 덮어 그림.
  //   mouth — 대성당 앞뜰: 바위턱이 위로 벼랑 쪽으로 넓게 퍼져(버팀벽처럼) 벼랑에 붙음. 늘 열려 계단이 내려감
  //   (attach 없이) — 홀로 솟은 바위 둔덕(위로 갈수록 좁아짐). 6격 마계(abyss) 남쪽 끝의 지하 묘실로 내려가는 문이 이 모양
  const GW = 5, GH = 4, RW = 9, RH = GH + 1;
  const rockGate = (u, at, attach, port) => {
    const mx = Math.round(L.fc(at[0])), my = Math.round(L.fc(at[1])), face0 = my - RH + 1;
    const free = (x0, y0, x1, y1, what) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!inside(x, y) || (tiles[idx(x, y)] !== FLOOR && tiles[idx(x, y)] !== ROAD)) throw new Error(`${u.title} ${what} — (${x}, ${y}) 자리가 빈 땅이 아님`); };
    free(mx - 1, my, mx + 1, my + 2, '묘실 문');
    free(mx - (RW >> 1) - 1, my + 1, mx + (RW >> 1) + 1, my + 2, '묘실 문 앞');
    // 바위턱 — 면 줄(문 · 그 위)은 RW 칸 폭. 그 위는 벼랑에 붙이면 넓게 퍼지고, 홀로 서면 좁아지며 둥글게 끝남. 줄마다 폭이 조금씩 달라 가장자리가 곧지 않게
    for (let x = mx - (RW >> 1) - 6; x <= mx + (RW >> 1) + 6; x++) {
      const core = Math.abs(x - mx) <= RW >> 1;
      let reached = !attach;
      for (let y = my; y >= face0 - 7; y--) {
        const k = idx(x, y), j = L.hash(x, y, 331) * 1.2;
        const hw = y >= face0 ? RW >> 1 : attach ? (RW >> 1) + (face0 - y) * 0.8 + j : (RW >> 1) - (face0 - y) * 1.4 + j;
        if (Math.abs(x - mx) > hw) continue;
        if (y === my && x >= mx - 1 && x <= mx + 1) continue;               // 문 — 걸어 들어가는 칸
        if (attach && y < face0 && (tiles[k] === ROCK || tiles[k] === WALL)) { reached = true; break; }   // 벼랑에 닿음
        if (tiles[k] !== FLOOR && tiles[k] !== ROAD && tiles[k] !== ROCK) { if (core) throw new Error(`${u.title} 바위턱 — (${x}, ${y}) 자리가 빈 땅이 아님`); break; }
        tiles[k] = ROCK; L.ter[k] = OL.OBSID; L.bio[k] = 6;
      }
      if (core && !reached) throw new Error(`${u.title} 바위턱 — ${x} 줄이 벼랑에 닿지 않음 (묘실 문 자리를 벼랑 쪽으로)`);
    }
    ports.push({ label: u.title, x: mx - 1, y: my, w: 3, h: 1, gate: true, gw: GW, gh: GH, ww: RW, wh: RH, ...port });
    guard(mx - (RW >> 1) - 1, my + 1, RW + 2, 2, 0);
  };
  for (const u of UNDERS) {
    const boss = data.ENEMIES.find(e => e.name === u.boss && e.kind === 'boss');
    if (!boss || boss.rank.n !== u.rank) throw new Error(`${u.title} — ${u.boss} 이(가) ${u.rank}격 보스가 아님`);
    rockGate(u, u.mouth, true, { name: u.id, to: `${u.id}.in` });
  }
  const lavaCells = new Uint8Array(w * h), bigRocks = [];
  for (const G of GIANT_GROUNDS) {
    const og = posts.find(p => p.name === G.boss);
    for (const [dx, dy, ww, hh] of G.rocks || []) {
      const x0 = og.x + dx, y0 = og.y + dy, cells = [];
      for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) cells.push([x0 + i, y0 + j]);
      if (!cells.every(([x, y]) => inside(x, y) && tiles[idx(x, y)] === FLOOR)) continue;   // 자리가 다 빈 땅일 때만
      for (const [x, y] of cells) { tiles[idx(x, y)] = ROCK; keep[idx(x, y)] = 1; }
      if (ww * hh > 1) bigRocks.push(`${x0},${y0},${ww},${hh}`);         // 큰 바위 하나 (그림은 언덕이 아니라 땅 위에 솟은 커다란 돌)
    }
    for (const [dx, dy] of G.lava || []) {
      const x = og.x + dx, y = og.y + dy, k = idx(x, y);
      if (inside(x, y) && tiles[k] === FLOOR) { tiles[k] = WATER; lavaCells[k] = 1; keep[k] = 1; }
    }
    guard(og.x - 1, og.y + og.h, og.w + 2, 2, 0);   // 그 거인 발치는 트여 있게
  }
  for (const N of NESTS) {
    const og = posts.find(p => p.name === N.boss), cx = og.x + og.w / 2, cy = og.y + og.h / 2;
    const d = (x, y) => Math.hypot((x + 0.5 - cx) / N.rx, (y + 0.5 - (cy + N.oy)) / N.ry);
    for (let y = Math.floor(cy - N.ry - 2); y <= cy + N.ry + 2; y++) for (let x = Math.floor(cx - N.rx - 2); x <= cx + N.rx + 2; x++) {
      if (!inside(x, y)) continue;
      const k = idx(x, y);
      if (d(x, y) < 1.25) noArea[k] = 1;
      if (d(x, y) < 1 && (tiles[k] === FLOOR || tiles[k] === ROAD)) { village[k] = 1; keep[k] = 1; }
    }
    for (const q of N.pieces) {
      const x = Math.floor(cx) + q.x, y = Math.floor(cy) + q.y, k = idx(x, y);
      if (tiles[k] !== FLOOR) throw new Error(`${N.boss} 둥지 — ${q.kind} (${x}, ${y}) 자리가 빈 땅이 아님`);
      tiles[k] = WALL; village[k] = 2;
      blds.push({ x, y, w: 1, h: 1, kind: q.kind, v: blds.length });
    }
    for (const a of N.rocks) {                                   // 둘레 바위 — 혼자 서게 (네 방향 이웃에 바위가 없을 때만)
      const x = Math.round(cx - 0.5 + Math.cos(a) * (N.rx + 0.4)), y = Math.round(cy + N.oy - 0.5 + Math.sin(a) * (N.ry + 0.4)), k = idx(x, y);
      if (!inside(x, y) || tiles[k] !== FLOOR || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ex, ey]) => tiles[idx(x + ex, y + ey)] === ROCK)) continue;
      tiles[k] = ROCK; keep[k] = 1; village[k] = 0;
    }
  }
  // 무너진 성당 터 (CHAPELS) — 바닥은 판석(겉모습 TILES), 벽 · 기둥 · 제단 · 돌무더기는 막힌 소품 (blds — kind chw · chp · cha · chr)
  const chapel = new Uint8Array(w * h);
  for (const C of CHAPELS) {
    const og = posts.find(p => p.name === C.boss), kr = C.plan.findIndex(r => r.includes('K')), kc = C.plan[kr].indexOf('K');
    const ox = og.x - kc, oy = og.y - kr, H = C.plan.length, W = C.plan[0].length;
    const ch = (c, r) => (r >= 0 && r < H && c >= 0 && c < W ? C.plan[r][c] : ',');
    const solidAt = (c, r) => 'WNAprk'.includes(ch(c, r)), wallAt = (c, r) => 'WN'.includes(ch(c, r));
    const inner = (c, r) => '.KAprk'.includes(ch(c, r)) && c > 0 && r > 0 && c < W - 1 && r < H - 1;   // 성당 안 (바닥 · 안쪽 소품)
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      const t = ch(c, r), x = ox + c, y = oy + r, k = idx(x, y);
      if (t === ',' || (t === 'A' && ch(c - 1, r) === 'A') || (t === 'k' && (ch(c - 1, r) === 'k' || ch(c, r - 1) === 'k'))) continue;   // 제단 · 해골 무더기의 나머지 칸 — 왼쪽 위 칸이 한꺼번에
      if (t === 'k') {                                                    // 해골 무더기 (k 네모 — 작은 해골들이 쌓임, 그림은 지하 신전의 skpile · 바닥은 이 성당 터의 판석)
        let sw = 0, sh = 0; while (ch(c + sw, r) === 'k') sw++; while (ch(c, r + sh) === 'k') sh++;
        for (let j = 0; j < sh; j++) for (let i = 0; i < sw; i++) {
          const q = idx(x + i, y + j);
          if (tiles[q] !== FLOOR && tiles[q] !== ROAD) throw new Error(`${C.boss} 성당 터 — 해골 무더기 (${x + i}, ${y + j}) 자리가 빈 땅이 아님`);
          tiles[q] = WALL; village[q] = 2; noArea[q] = 1; keep[q] = 1;
        }
        blds.push({ x, y, w: sw, h: sh, kind: 'skpile', fb: L.bio[k], v: blds.length });
        continue;
      }
      if (!inside(x, y) || (tiles[k] !== FLOOR && tiles[k] !== ROAD) || (t === 'A' && tiles[k + 1] !== FLOOR && tiles[k + 1] !== ROAD)) throw new Error(`${C.boss} 성당 터 — (${x}, ${y}) 자리가 빈 땅이 아님`);
      noArea[k] = 1; keep[k] = 1;
      if (t === 'A') { noArea[k + 1] = 1; keep[k + 1] = 1; }
      if (t === '.' || t === 'K') { tiles[k] = FLOOR; chapel[k] = 1; continue; }
      const n = t === 'A' ? 2 : 1, j = L.hash(c, r, 301), b = { x, y, w: n, h: 1, v: blds.length };
      for (let i = 0; i < n; i++) { tiles[k + i] = WALL; village[k + i] = 2; }
      // 성당 안쪽이 어느 쪽인지 (그림이 벽 너머의 바닥을 판석 · 바깥 땅으로 나눠 칠함) · 안쪽 소품은 바닥이 다 판석
      const ins = [[0, -1, 'n'], [0, 1, 's'], [1, 0, 'e'], [-1, 0, 'w']].filter(([ex, ey]) => inner(c + ex, r + ey) || (ch(c + ex, r + ey) === '.' && !wallAt(c + ex, r + ey))).map(q => q[2]).join('');
      if (t === 'W' || t === 'N') {
        // 남은 높이 — 북쪽 벽이 가장 높고, 남쪽으로 갈수록 낮게 허물어짐 (칸마다 조금씩 다르게) · 깨진 창은 가장 높게
        const hgt = t === 'N' ? 8 : r === 0 ? 6 + Math.floor(j * 3) : r === H - 1 ? 2 + Math.floor(j * 3) : Math.max(2, Math.round(7 - r * 0.4 + (j - 0.5) * 4));
        const link = [[0, -1, 'n'], [0, 1, 's'], [1, 0, 'e'], [-1, 0, 'w']].filter(([ex, ey]) => wallAt(c + ex, r + ey)).map(q => q[2]).join('');
        blds.push({ ...b, kind: 'chw', hgt: Math.min(8, hgt), link, ins, ...(t === 'N' ? { win: ch(c - 1, r) === 'N' ? 'r' : 'l' } : {}) });
      } else if (t === 'p') blds.push({ ...b, kind: 'chp', hgt: 5 + Math.floor(j * 6), fl: 1 });
      else if (t === 'A') blds.push({ ...b, kind: 'cha', fl: 1 });
      else blds.push({ ...b, kind: 'chr', ...(inner(c, r) ? { fl: 1 } : { ins }) });
      if (!solidAt(c, r)) throw new Error('성당 터 — 그림 글자 확인');
    }
    for (let y = oy - 2; y < oy + H + 2; y++) for (let x = ox - 2; x < ox + W + 2; x++) if (inside(x, y) && !noArea[idx(x, y)]) { noArea[idx(x, y)] = 2; keep[idx(x, y)] = 1; }   // 둘레 두 칸도 구역 밖 · 나무 없음 (키 큰 마른 나무가 벽을 덮었음)
  }
  for (let k = 0; k < w * h; k++) if (village[k] === 1 && tiles[k] === FLOOR) tiles[k] = ROAD;
  // 숨은 굴로 가는 구멍 — 그 보스 바로 뒤 (보스 몸 위로 한 칸 띄워, 보스 폭만큼)
  for (const s of SECRET_ROOMS) {
    if (s.from && s.from !== 'overworld') continue;            // 건물 안 보스 — 그 안 지도에 (buildingInterior)
    const boss = foes.find(e => e.name === s.boss), bp = posts.find(p => p.enemy === boss.id);
    const hole = { name: s.id, label: s.title, x: bp.x, y: bp.y - 2, w: bp.w, h: 1, to: `${s.id}.out`, opensAfter: boss.id, appears: true, hole: true, art: 'floor' };
    ports.push(hole);
    fillRect(hole, FLOOR);
    fillRect({ x: hole.x, y: hole.y + 1, w: hole.w, h: 1 }, FLOOR);
    guard(hole.x, hole.y, hole.w, 2, 1);
  }
  const hiddenElsewhere = new Set([...SECRET_ROOMS.map(s => s.hidden), ...BUILDINGS.map(b => b.boss), ...UNDERS.map(u => u.boss), ...foes.filter(e => e.rank.n === 6).map(e => e.name)]);   // 6격은 abyss 지도에
  const missing = foes.filter(e => !hiddenElsewhere.has(e.name) && !posts.some(p => p.enemy === e.id));
  // 그 격 보스가 서 있는 곳 — 건물 안이면 그 건물의 문 (구역 차례 · 보물상자 자리를 잴 때)
  const bossSpot = zi => {
    const boss = data.ENEMIES.find(e => e.zoneIndex === zi && e.kind === 'boss'), p = posts.find(q => q.enemy === boss.id);
    if (p) return p;
    const u = UNDERS.find(q => q.boss === boss.name);   // 지하의 보스 — 그 지하로 내려가는 계단
    if (u) return ports.find(q => q.name === u.id);
    const b = BUILDINGS.find(q => q.boss === boss.name);
    return ports.find(q => q.name === b.id);
  };
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
  for (const rank of OW_RANKS) {
    const zi = data.ZONES.findIndex(z => z.rank === rank), zone = data.ZONES[zi];
    const normals = data.ENEMIES.filter(e => e.zoneIndex === zi && e.kind === 'normal' && !underNormal(e));
    if (OVERWORLD_AREAS[rank].length !== normals.length) throw new Error(`${rank}격 — 구역 ${OVERWORLD_AREAS[rank].length}개, 일반 ${normals.length}종`);
    seeds[rank] = OVERWORLD_AREAS[rank].map(([x0, y0, x1, y1]) => {
      const r = rectOf(x0, y0, x1, y1), c = { x: r.x + (r.w >> 1), y: r.y + (r.h >> 1), rect: [x0, y0, x1, y1] };
      guard(c.x - 1, c.y - 1, 3, 3, 0);
      return c;
    });
    const [mx, my] = L.spot1(...OVERWORLD_MERCHANTS[zone.id]);
    npcs.push({ name: 'merchant', x: mx, y: my, zone: zone.id });
    guard(mx, my, 1, 1, 1);
    // 그 격에 처음 들어서는 자리 — 길잡이가 데려다 줄 때 닿는 곳 (사용자 결정 2026-11-23). 서는 칸은 ui.js 의 mapEntrance 가 곁의 빈 칸으로
    const [ex, ey] = L.spot1(...OVERWORLD_ENTRY[rank]);
    npcs.push({ name: 'entry', x: ex, y: ey, zone: zone.id });
  }
  // 문의 광장으로 가는 문은 마왕성 안 왕좌 뒤 (DEMON_CASTLE — abyss 지도)

  // 3) 나무 · 바위 무더기 — 시안의 숲덩이 잡음이 짙은 자리에만 (덩어리 숲 — 사이는 넓게 트임)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = idx(x, y);
    if (tiles[i] !== FLOOR || keep[i]) continue;
    if (L.ter[i] === OL.COBBLE || L.ter[i] === OL.TILES || L.ter[i] === OL.PAVE) continue;   // 돌을 깐 땅(옛 성문 · 광장 · 큰길 · 앞뜰)엔 나무가 안 섬 (옛 성문이 나무로 막혔었음)
    const b = L.bio[i], grove = L.fbm(L.toC(x) * 0.16, L.toC(y) * 0.16, 83), r = L.hash(x, y, 80);
    // 5격 시체의 도시 · 6격 마계는 듬성듬성 — 둘레 여덟 칸(이미 정한 위 · 왼쪽)에 나무가 없을 때만, 드물게 (사용자 결정 — 빽빽했음)
    const alone = () => ![i - 1, i - w - 1, i - w, i - w + 1, i - 2, i - 2 * w].some(j => tiles[j] === TREE);
    if ((b === 2 && grove > 0.6 && r < 0.8) || ((b === 3 || b === 9) && grove > 0.64 && r < 0.6) || (b === 4 && grove > 0.6 && r < 0.55)
      || (b === 5 && grove > 0.56 && r < 0.16 && alone())
      || (b === 6 && L.ter[i] === L.OBSID && grove > 0.6 && r < 0.14 && alone())) tiles[i] = TREE;
    else if ((b === 4 && r < 0.012) || (b === 6 && r < 0.006 && !nearHall(x, y))) tiles[i] = ROCK;   // 6격 낱바위는 드물게 · 홀 둘레엔 없게 (0.035 — 칠죄종 홀 둘레가 바위투성이라 걷기 불편했음, 사용자 지적)
  }
  function nearHall(x, y) {                                   // 6격 돌바닥(칠죄종 홀 · 왕좌의 방)에서 6칸 안
    for (let j = y - 6; j <= y + 6; j++) for (let i = x - 6; i <= x + 6; i++) if (inside(i, j) && L.ter[idx(i, j)] === OL.TILES && L.bio[idx(i, j)] === 6) return true;
    return false;
  }

  // 3-2) 숲 솎기 — THIN_FOREST 네모 안의 빽빽한 숲은 흔든 격자(gap)마다 한 그루만 남기고 베어 듬성듬성하게
  for (const f of THIN_FOREST) {
    const r = rectOf(...f.rect);
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) {
      const k = idx(x, y);
      if (tiles[k] !== TREE) continue;
      const gx = Math.floor(x / f.gap), gy = Math.floor(y / f.gap);
      const tx = gx * f.gap + Math.floor(L.hash(gx, gy, 143) * (f.gap - 1)), ty = gy * f.gap + Math.floor(L.hash(gx, gy, 144) * (f.gap - 1));
      if (!(x === tx && y === ty && L.hash(gx, gy, 145) < 0.85)) tiles[k] = FLOOR;
    }
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
  const stand = [...posts.flatMap(cellsOf), ...ports.filter(p => p.appears || p.door).flatMap(cellsOf), ...npcs.map(n => [n.name, n.x, n.y]),
    ...Object.values(seeds).flat().filter(c => open(idx(c.x, c.y))).map(c => [`구역 [${c.rect}]`, c.x, c.y])];   // 구역 자리 한가운데도 — 옛 오크 장군 자리로 판 길에 기대던 숲 서남쪽 구역이 갇히지 않게 (2026-11-20)
  for (const [, x, y] of stand) {
    const k = idx(x, y);
    if (seen[k] || !open(k)) continue;
    carve(k);
    flood(k);
  }
  for (let k = 0; k < w * h; k++) {                         // 그래도 갇힌 빈칸은 둘레의 나무 · 바위로 메움 — 몬스터가 서지 않게
    if (seen[k] || !open(k)) continue;
    // 5 · 6격은 그대로 빈 땅 (용암 · 벼랑 너머로 보이는 땅 — 나무로 메우면 통째로 빽빽한 숲이 됨, 구역 · 상자는 닿는 칸에만 서므로 몬스터도 안 섬)
    if (L.bio[k] === 5 || L.bio[k] === 6) continue;
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
  for (const rank of OW_RANKS) {
    const zi = data.ZONES.findIndex(z => z.rank === rank), zone = data.ZONES[zi];
    const normals = data.ENEMIES.filter(e => e.zoneIndex === zi && e.kind === 'normal' && !underNormal(e));
    const land = k => seen[k] && open(k) && L.zoneAt(k % w, (k / w) | 0) === rank && L.bio[k] !== 8 && !noArea[k];
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
    // 2격 — 가장 약한 구역(들어오는 곳에서 가장 가까운 자리 = 오크 전사)이 오크 부락의 서쪽 반에 걸침 (사용자 결정 2026-11-20):
    // 부락 마당의 서쪽 반 · 부락 서쪽 입구까지 비어 있는 땅을 그 구역으로
    if (rank === 2) {
      const entry = walkFrom([idx(...L.spot1(...OVERWORLD_ENTRY[rank]))]);
      const weak = starts.reduce((b, s0, i) => (entry[s0] >= 0 && (b < 0 || entry[s0] < entry[starts[b]]) ? i : b), -1);
      for (let y = VC.cy - 3; y <= VC.cy + 3; y++) for (let x = VC.cx - 10; x <= VC.cx; x++) {
        const k = idx(x, y);
        if (land(k) && (village[k] === 1 || near[k] < 0)) near[k] = weak;
      }
      for (let y = VC.box[1]; y < VC.box[1] + VC.box[3]; y++) for (let x = VC.box[0]; x <= VC.cx; x++) if (land(idx(x, y)) && village[idx(x, y)] === 1) near[idx(x, y)] = weak;
      VC.weak = weak;
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
    const boss = bossSpot(zi);
    const toBoss = walkFrom([...Array((boss.w || 1) * (boss.h || 1)).keys()].map(k => idx(boss.x + k % (boss.w || 1), boss.y + ((k / (boss.w || 1)) | 0))));
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
      return { mine, box, score: sum / n, near, seed: i };
    });
    const regionsBySeed = regions.slice();                       // 자리 차례 그대로 (오크 부락 검사)
    regions.sort((p, q) => p.score - q.score);
    // 가장 약한 것은 들어오자마자 만나게 — 들어오는 곳에서 걸어서 가장 먼저 닿는 구역 (나머지는 위 순서대로)
    const first = regions.reduce((b, r) => (r.near < b.near ? r : b));
    regions.splice(regions.indexOf(first), 1);
    regions.unshift(first);
    if (rank === 2 && regions[0] !== regionsBySeed[VC.weak]) throw new Error('오크 부락 — 걸친 구역이 가장 약한 구역(오크 전사)이 아님');
    // 정해 둔 자리 — 그 몬스터는 그 구역 자리에 (AREA_FIX). 차례로 정해진 자리와 맞바꿈
    for (const [id, rect] of Object.entries(AREA_FIX[rank] || {})) {
      const k = normals.findIndex(e => e.id === id), si = OVERWORLD_AREAS[rank].findIndex(q => q.join() === rect.join());
      if (k < 1 || si < 0) throw new Error(`${rank}격 정해 둔 구역 — ${id} [${rect}]`);
      const j = regions.findIndex(r => r.seed === si);
      [regions[k], regions[j]] = [regions[j], regions[k]];
    }
    regions.forEach((r, k) => {
      const mid = clearMid(r);
      if (SPARSE_TREES[normals[k].id]) sparseTrees(r, mid, normals[k].id);
      mids.push([mid % w, (mid / w) | 0]);
      const { x, y, polygon } = outline(r.mine, r.box);
      // 오크 부락에 걸친 구역 — camp(부락 네모): 이 구역의 몬스터 한두 마리는 부락 안에서 생겨남 (js/map.js 의 spawn)
      const camp = rank === 2 && k === 0 ? { camp: VC.box.join(',') } : {};
      areas.push({ name: normals[k].name, x, y, polygon, rank, monster: normals[k].id, zone: zone.id, ...camp });
    });
  }

  // 듬성듬성한 나무 — 그 구역 안 트인 땅에 흔든 격자(간격 SPARSE_TREES)로 한 그루씩. 둘레 여덟 칸이 다 트인 곳에만 · 들머리 둘레 · 길가 · 막으면 안 되는 칸은 비움,
  // 나무끼리는 세 칸 넘게 떨어져 길을 막지 않고 그 사이에 큰 몬스터(3 × 3)가 설 자리가 남음
  function sparseTrees(r, mid, id) {
    const gap = SPARSE_TREES[id], mx = mid % w, my = (mid / w) | 0, put = [];
    for (let gy = r.box.y; gy < r.box.y + r.box.h; gy += gap) for (let gx = r.box.x; gx < r.box.x + r.box.w; gx += gap) {
      if (L.hash(gx, gy, 140) > 0.8) continue;
      const x = gx + Math.floor(L.hash(gx, gy, 141) * (gap - 2)), y = gy + Math.floor(L.hash(gx, gy, 142) * (gap - 2)), k = idx(x, y);
      if (!r.mine.has(k) || tiles[k] !== FLOOR || keep[k] || Math.max(Math.abs(x - mx), Math.abs(y - my)) <= 2) continue;
      let ok = true;
      for (let j = -1; j <= 1 && ok; j++) for (let i = -1; i <= 1; i++) if (tiles[idx(x + i, y + j)] !== FLOOR) { ok = false; break; }
      if (!ok || put.some(([px, py]) => Math.max(Math.abs(px - x), Math.abs(py - y)) <= 3)) continue;
      put.push([x, y]);
      tiles[k] = TREE;
    }
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
  const bigElsewhere = new Set([...SECRET_ROOMS.filter(s => s.bigChest).map(s => data.ENEMIES.find(e => e.name === s.hidden).rank.n), ...CAVES.map(c => c.rank)]);
  const cellsOfRect = r => { const out = []; for (let j = 0; j < (r.h || 1); j++) for (let i = 0; i < (r.w || 1); i++) out.push([r.x + i, r.y + j]); return out; };
  const busy = [...posts.flatMap(cellsOfRect), ...ports.flatMap(cellsOfRect), ...npcs.map(n => [n.x, n.y])];
  busy.push(...mids);                                         // 구역 들머리
  for (const rank of OW_RANKS) {
    const zi = data.ZONES.findIndex(z => z.rank === rank);
    const boss = bossSpot(zi);
    const fromEntry = walkFrom([idx(...L.spot1(...OVERWORLD_ENTRY[rank]))]);
    const toBoss = walkFrom(cellsOfRect(boss).map(([x, y]) => idx(x, y)));
    const D = Math.min(...cellsOfRect(boss).map(([x, y]) => fromEntry[idx(x, y)]).filter(v => v >= 0));
    // 더 낮은 격 땅에서 걸어서 CHEST_FAR 칸 안쪽엔 두지 않음 — 낮은 격에서 몬스터를 안 지나고 집어 가지 않게 (사용자 결정 2026-11-22, 만티코어 곁의 4격 상자)
    const lower = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const z = L.zoneAt(x, y); if (z >= 2 && z < rank && (tiles[idx(x, y)] === FLOOR || tiles[idx(x, y)] === ROAD)) lower.push(idx(x, y)); }
    const fromLower = walkFrom(lower), CHEST_FAR = 40;
    const cand = [];
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const k = idx(x, y);
      if (tiles[k] !== FLOOR || L.zoneAt(x, y) !== rank || L.bio[k] === 8 || fromEntry[k] < 0 || toBoss[k] < 0 || (fromLower[k] >= 0 && fromLower[k] < CHEST_FAR)) continue;
      let ring = true;
      for (let j = -1; j <= 1 && ring; j++) for (let i = -1; i <= 1; i++) if (!open(idx(x + i, y + j))) { ring = false; break; }
      // 바로 아래 세 줄에 나무가 없을 것 — 키 큰 나무 그림이 위로 솟아 상자를 덮음 (사용자 지적 2026-11-22, 5격 마른 나무)
      let treeBelow = false;
      for (let j = 1; j <= 3 && !treeBelow; j++) for (let i = -1; i <= 1; i++) if (inside(x + i, y + j) && tiles[idx(x + i, y + j)] === TREE) { treeBelow = true; break; }
      if (!ring || treeBelow || busy.some(([bx, by]) => Math.max(Math.abs(bx - x), Math.abs(by - y)) <= 4)) continue;
      cand.push({ x, y, d: fromEntry[k] + toBoss[k] - D });
    }
    cand.sort((p, q) => q.d - p.d || p.y - q.y || p.x - q.x);
    const fixed = bigAt[rank], want = bigElsewhere.has(rank) || fixed ? 2 : 3, picked = [];   // fixed — 정해 둔 큰 상자 자리 (트롤 킹 뒤 골짜기)
    for (const c of cand) {
      if (picked.length >= want) break;
      if (picked.some(q => Math.hypot(q.x - c.x, q.y - c.y) < 40)) continue;
      picked.push(c);
    }
    if (picked.length < want) throw new Error(`${rank}격 보물상자 — 둘 자리가 ${picked.length}곳뿐`);
    const item = (data.ITEMS.find(i => i.chest && i.rank.n === rank) || {}).id;
    if (fixed) {
      if (!item) throw new Error(`${rank}격 큰 상자 — 상자 전용 장비(CHEST_ITEMS)가 없음`);
      chests.push({ name: '보물상자', x: fixed.x, y: fixed.y, chest: `r${rank}-big`, rank, big: true, item });
    }
    picked.forEach((c, i) => {
      const big = !bigElsewhere.has(rank) && !fixed && i === 0;
      if (big && !item) throw new Error(`${rank}격 큰 상자 — 상자 전용 장비(CHEST_ITEMS)가 없음`);
      chests.push({ name: '보물상자', x: c.x, y: c.y, chest: big ? `r${rank}-big` : `r${rank}-${bigElsewhere.has(rank) || fixed ? i + 1 : i}`, rank, big: big || undefined, item: big ? item : undefined });
    });
  }

  // 겉모습 — 시안의 땅 종류 · 격 그대로 (흙길 칸은 흙, 물을 건너는 흙길 칸은 물 그대로 — 그림이 널판 다리로 그림)
  // 옛 바깥 성벽(2격 | 3격)의 무너진 조각 · 옛 성문의 탑 — 겉모습 RUIN (그림이 무너진 성벽으로, 옛 성문은 탑 사이 길 위에 아치 — 사용자 그림)
  const [ry0, ry1] = L.span(L.RUINS.y0, L.RUINS.y1), ruin = i => !!L.wallMask[i] && !buildingCells[i] && ((i / w) | 0) >= ry0 && ((i / w) | 0) <= ry1;
  const lookLayer = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const wet = L.ter[i] === OL.WATER || L.ter[i] === OL.CANAL;
    lookLayer[i] = buildingCells[i] ? look(BUILD, 8) : village[i] === 2 ? look(BUILD, L.bio[i]) : lavaCells[i] ? look(OL.LAVA, L.bio[i]) : ruin(i) ? look(RUIN, L.bio[i]) : chapel[i] ? look(OL.TILES, L.bio[i]) : look(tiles[i] === ROAD && !wet ? OL.DIRT : L.ter[i], L.bio[i]);
  }
  // 옛 성문 — 두 탑을 감싸는 네모 (그림 js/mapart.js 의 drawOver 가 그 위에 아치를 덮어 그림)
  const gx0 = L.span(L.RUINS.towers[0], L.RUINS.towers[0])[0], gx1 = L.span(L.RUINS.towers[1], L.RUINS.towers[1])[1];
  return buildTmj({ w, h, tiles, areas, posts, ports, npcs, chests, look: lookLayer, props: { gate: `${gx0},${ry0},${gx1 - gx0 + 1},${ry1 - ry0 + 1}`, blds: JSON.stringify(blds), high: cellRuns(high), stairs: cellRuns(stairs), bigrocks: bigRocks.join(';') } });
}

// 칸 표시(0 · 1) → 「x,y,길이;…」 가로 줄 묶음 (지도 속성으로 넘길 때 — js/mapart.js 의 runCells 가 풂)
function cellRuns(mask) {
  const out = [];
  for (let y = 0; y < OUT_H; y++) for (let x = 0; x < OUT_W; x++) {
    if (!mask[y * OUT_W + x] || (x > 0 && mask[y * OUT_W + x - 1])) continue;
    let n = 1; while (x + n < OUT_W && mask[y * OUT_W + x + n]) n++;
    out.push(`${x},${y},${n}`);
  }
  return out.join(';');
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
  const out = { name: 'out', label: '나가기', x: cx - 1, y: oy, w: 3, h: 1, to: `${s.from || 'overworld'}.${s.id}`, hole: true, art: 'rock' };
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

// ---------- 동굴 안 (CAVES) — 구불구불한 길 · 몬스터 방 둘 · 맨 안쪽 큰 상자 ----------
// 아래 가운데 입구에서 위로: 길 → 첫 방(rooms[0]) → 길 → 둘째 방(rooms[1]) → 길 → 맨 안쪽 방(상자). 방마다 그 몬스터의 구역, 군데군데 고인 물
function caveMap(data, c) {
  const W = 40, H = 54, noise = valueNoise(23), at = (x, y) => y * W + x;
  const tiles = new Uint8Array(W * H).fill(WALL);
  // 뼈대 — 지나는 점 [x, y, 넓이(반지름)]: 입구 → 첫 방 → 둘째 방 → 맨 안쪽
  const path = [[20, 51, 2.2], [15, 45, 2.4], [19, 39, 2.6], [26, 34, 6.2], [20, 26, 2.6], [12, 20, 6.4], [16, 12, 2.6], [23, 7, 4.4]];
  const rooms = [path[3], path[5]], end = path[7];
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    let best = 9;
    for (let i = 0; i + 1 < path.length; i++) {
      const [ax, ay, ar] = path[i], [bx, by, br] = path[i + 1], dx = bx - ax, dy = by - ay;
      const t = Math.max(0, Math.min(1, ((x + 0.5 - ax) * dx + (y + 0.5 - ay) * dy) / (dx * dx + dy * dy)));
      const r = ar + (br - ar) * t, d = Math.hypot(x + 0.5 - (ax + dx * t), y + 0.5 - (ay + dy * t)) / r;
      best = Math.min(best, d);
    }
    if (best < 1 - (noise(x * 0.35, y * 0.35) - 0.5) * 0.5) tiles[at(x, y)] = FLOOR;
  }
  // 입구 — 맨 아래 줄까지 뚫고 세 칸
  let oy = H - 2;
  for (let y = path[0][1]; y <= oy; y++) for (let x = 19; x <= 21; x++) tiles[at(x, y)] = FLOOR;
  // 고인 물 — 방 가장자리에 하나씩 (길을 막지 않게 방 한가운데에서 비킨 자리)
  for (const [px, py] of [[rooms[0][0] + 4, rooms[0][1] - 3], [rooms[1][0] - 4, rooms[1][1] + 3]])
    for (let y = py - 1; y <= py + 1; y++) for (let x = px - 1; x <= px + 1; x++)
      if (tiles[at(x, y)] === FLOOR && Math.hypot(x - px, (y - py) * 1.2) < 1.6 && [-1, 0, 1].every(j => [-1, 0, 1].every(i => tiles[at(x + i, y + j)] !== WALL))) tiles[at(x, y)] = WATER;   // 벽에 붙지 않게 (물가가 벽과 곧게 맞닿지 않게)
  // 구역 — 방마다 그 몬스터 (방 둘레 네모 — 바닥 칸만 구역으로 셈)
  const areas = c.rooms.map((name, i) => {
    const foe = data.ENEMIES.find(e => e.name === name && e.kind === 'normal');
    if (!foe || foe.rank.n !== c.rank) throw new Error(`동굴 ${c.id} — ${name} 이(가) ${c.rank}격 일반 몬스터가 아님`);
    const [rx, ry, rr] = rooms[i], r = Math.ceil(rr) + 1;
    return { name, x: Math.max(1, Math.floor(rx - r)), y: Math.max(1, Math.floor(ry - r)), w: r * 2, h: r * 2, rank: c.rank, monster: foe.id, zone: c.zone, extra: true };   // extra — 바깥 지도에도 있는 몬스터를 한 번 더 (지역 · 도감 셈에서 빠짐)
  });
  // 맨 안쪽 — 그 격의 큰 상자 (둘레 한 칸이 모두 바닥)
  const item = (data.ITEMS.find(i => i.chest && i.rank.n === c.rank) || {}).id;
  if (!item) throw new Error(`동굴 ${c.id} — ${c.rank}격 상자 전용 장비가 없음`);
  const cx = Math.round(end[0]), cy = Math.round(end[1]) - 1;
  for (let j = cy - 1; j <= cy + 1; j++) for (let i = cx - 1; i <= cx + 1; i++) tiles[at(i, j)] = FLOOR;
  const chests = [{ name: '보물상자', x: cx, y: cy, chest: `r${c.rank}-big`, rank: c.rank, big: true, item }];
  const out = { name: 'out', label: '나가기', x: 19, y: oy, w: 3, h: 1, to: `overworld.${c.id}`, hole: true, art: 'rock' };
  const lookLayer = Uint8Array.from(tiles, t => (t === WATER ? look(OL.WATER, 7) : look(OL.ROCKY, 7)));
  return buildTmj({ w: W, h: H, tiles, areas, ports: [out], npcs: [{ name: 'start', x: 20, y: oy - 1 }], chests, look: lookLayer, props: { title: c.title } });
}

// ---------- 지하 (UNDERS) — 어둑한 굴 길 · 첫 방 · 용암의 둘째 방 · 신전 · 보스 · 위로 가는 계단 ----------
// 아래 가운데 계단(in — 바깥 지도로)에서 위로: 굴 길 → 첫 방(rooms[0]) → 굴 길 → 둘째 방(rooms[1], 용암 웅덩이가 여럿) → 굴 길 →
// 신전 문 → 신전 큰 방(판석 · 기둥 · 양옆 파란 불꽃 횃불 · 구석의 해골 무더기 · 안쪽 벽 앞의 거대한 해골 둘) → 두 해골 사이 조금 앞에 보스 →
// 그 뒤 안쪽 벽의 고딕 문(up — 보스를 꺾어야 열려 위로 가는 계단, 바깥 지도의 다음 격으로). 굴 벽은 구불구불, 신전 벽은 곧게
function cryptMap(data, u) {
  const W = 48, H = 116, OX = 4, noise = valueNoise(37), at = (x, y) => y * W + x;   // OX — 신전 · 문을 가운데로 (방을 넓히며 지도를 넓힘, 사용자 결정 2026-11-23)
  const tiles = new Uint8Array(W * H).fill(WALL), lk = new Uint8Array(W * H).fill(look(OL.OBSID, 6)), blds = [];   // 굴 — 흑요석 땅(어둑하고 군데군데 용암 금)
  const fill = (x, y, w, h, t, l) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { tiles[at(x + i, y + j)] = t; if (l !== undefined) lk[at(x + i, y + j)] = l; } };
  // 굴 — 지나는 점 [x, y, 넓이]: 계단 → 첫 방(데몬 로드) → 둘째 방(발록) → 신전 문. 두 방은 넓고 여유롭게 (반지름 10 안팎 — 사용자 결정 2026-11-23, 예전 6.5)
  const path = [[24, 112, 2.4], [18, 105, 2.6], [22, 98, 2.8], [29, 86, 10], [21, 73, 2.8], [14, 67, 2.8], [21, 53, 10.5], [25, 40, 3], [24, 36, 2.6]];
  const rooms = [path[3], path[6]];
  for (let y = 35; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    let best = 9;
    for (let i = 0; i + 1 < path.length; i++) {
      const [ax, ay, ar] = path[i], [bx, by, br] = path[i + 1], dx = bx - ax, dy = by - ay;
      const t = Math.max(0, Math.min(1, ((x + 0.5 - ax) * dx + (y + 0.5 - ay) * dy) / (dx * dx + dy * dy)));
      const r = ar + (br - ar) * t, d = Math.hypot(x + 0.5 - (ax + dx * t), y + 0.5 - (ay + dy * t)) / r;
      best = Math.min(best, d);
    }
    if (best < 1 - (noise(x * 0.35, y * 0.35) - 0.5) * 0.5) tiles[at(x, y)] = FLOOR;
  }
  for (let y = path[0][1]; y <= H - 2; y++) fill(19 + OX, y, 3, 1, FLOOR);      // 계단까지 — 맨 아래 줄 바로 위
  {                                                                              // 들어온 곳에서 걸어서 못 가는 외톨이 바닥은 벽으로 (몬스터가 갇혀 생겨나지 않게)
    const seen = new Uint8Array(W * H), q = [at(20 + OX, H - 2)];
    seen[q[0]] = 1;
    for (let n = 0; n < q.length; n++) for (const d of [1, -1, W, -W]) { const j = q[n] + d; if (!seen[j] && tiles[j] === FLOOR) { seen[j] = 1; q.push(j); } }
    for (let k = 0; k < W * H; k++) if (tiles[k] === FLOOR && !seen[k]) tiles[k] = WALL;
  }
  // 용암 웅덩이 — 둘째 방(발록)에 둘 · 첫 방(데몬 로드)에 하나, 크기가 다름. 둘레 한 칸이 모두 바닥인 칸만 (벽과 곧게 맞닿지 않게 · 길을 막지 않게 방 가장자리 쪽).
  // 너무 작으면(한두 칸) 네모로 보여서 반지름 2 안팎으로
  const lava = [[rooms[1][0] - 5, rooms[1][1] - 4, 3], [rooms[1][0] + 5, rooms[1][1] + 4, 2.4], [rooms[1][0] - 1, rooms[1][1] + 6.5, 1.8], [rooms[0][0] + 5, rooms[0][1] - 4, 2.3]];
  for (const [px, py, r] of lava) for (let y = Math.floor(py - r - 1); y <= py + r + 1; y++) for (let x = Math.floor(px - r - 1); x <= px + r + 1; x++)
    if (tiles[at(x, y)] === FLOOR && Math.hypot(x + 0.5 - px, (y + 0.5 - py) * 1.2) < r && [-1, 0, 1].every(j => [-1, 0, 1].every(i => tiles[at(x + i, y + j)] !== WALL))) { tiles[at(x, y)] = WATER; lk[at(x, y)] = look(OL.LAVA, 7); }
  // 신전 — 큰 방(x 11~36 · y 12~33), 아래 가운데 문(굴과 이음), 안쪽 벽 가운데 고딕 문(보스 폭) 너머가 위로 가는 계단
  const T6 = look(OL.TILES, CRYPT_BIO), hx = 7 + OX, hy = 12, hw = 26, hh = 22;
  fill(hx, hy, hw, hh, FLOOR, T6);
  fill(hx + 11, hy + hh, 4, 3, FLOOR, T6);                                     // 신전 문 — 굴 길로
  const foe = data.ENEMIES.find(e => e.name === u.boss && e.kind === 'boss'), n = foe.size;
  const cx = hx + (hw >> 1) - (n >> 1);                                         // 고딕 문 · 보스의 왼쪽 끝
  // 보스 — 거대한 해골 둘 사이, 조금 앞으로 (사용자 결정 2026-11-22 — 통로 안이 아니라 큰 방에). 그 뒤 안쪽 벽의 고딕 문(gate)은 보스를 꺾어야 열림
  const post = { name: foe.name, x: cx, y: hy + 1, w: n, h: n, enemy: foe.id, blocks: false };
  // 기둥 — 양옆 두 줄 (2 × 2 바위, 그림은 성 안 돌기둥)
  for (const y of [16, 22, 28]) for (const x of [hx + 2, hx + hw - 4]) fill(x, y, 2, 2, ROCK, look(OL.TILES, 8));
  // 소품 — 막힌 칸 (그림은 js/mapart.js 의 cryptPix — 지도 속성 blds)
  const put = (x, y, w, h, kind, extra = {}) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { if (tiles[at(x + i, y + j)] !== FLOOR) throw new Error(`${u.title} — ${kind} (${x + i}, ${y + j}) 자리가 바닥이 아님`); tiles[at(x + i, y + j)] = WALL; lk[at(x + i, y + j)] = look(BUILD, 6); }
    blds.push({ x, y, w, h, kind, v: blds.length, ...extra });
  };
  put(cx - 6, hy, 4, 3, 'gskull');                                              // 안쪽 벽 앞의 거대한 해골 둘 — 통로 양옆 (횃불 너머)
  put(cx + n + 2, hy, 4, 3, 'gskull', { flip: 1 });
  for (const [x, y] of [[hx, 18], [hx + hw - 1, 18], [hx, 25], [hx + hw - 1, 25], [cx - 2, hy], [cx + n + 1, hy], [hx + 10, hy + hh - 1], [hx + 15, hy + hh - 1]]) put(x, y, 1, 1, 'btorch');   // 파란 불꽃 횃불 — 벽을 따라 · 통로 어귀 · 신전 문 양옆
  for (const [x, y, w, h] of [[hx, hy + hh - 2, 2, 2], [hx + hw - 2, hy + hh - 3, 2, 2], [hx + 1, hy, 2, 1]]) put(x, y, w, h, 'skpile');   // 구석의 해골 무더기 (크기가 다름)
  // 구역 — 방마다 그 몬스터 (방 둘레 네모 — 바닥 칸만 구역으로 셈). 바깥 지도엔 없는 몬스터
  const areas = u.rooms.map((name, i) => {
    const e = data.ENEMIES.find(q => q.name === name && q.kind === 'normal');
    if (!e || e.rank.n !== u.rank) throw new Error(`지하 ${u.id} — ${name} 이(가) ${u.rank}격 일반 몬스터가 아님`);
    const [rx, ry, rr] = rooms[i], r = Math.ceil(rr) + 1;
    return { name, x: Math.max(1, Math.floor(rx - r)), y: Math.max(1, Math.floor(ry - r)), w: r * 2, h: r * 2, rank: u.rank, monster: e.id, zone: u.zone };   // extra 아님 — 지역 · 도감 셈에 들어감 (zoneMap 은 지도 이름 차례로 overworld 가 이김)
  });
  const ports = [
    { name: 'in', label: '나가기', x: 19 + OX, y: H - 1, w: 3, h: 1, to: `overworld.${u.id}`, stairs: true },
    { name: 'up', label: u.title, x: cx, y: hy - 1, w: n, h: 1, to: u.next, gate: true, gw: n + 4, gh: 6, opensAfter: foe.id }   // 안쪽 벽의 고딕 문 — 열리면 위로 가는 계단
  ];
  fill(19 + OX, H - 1, 3, 1, FLOOR); fill(cx, hy - 1, n, 1, FLOOR, T6);
  return buildTmj({ w: W, h: H, tiles, areas, posts: [post], ports, npcs: [{ name: 'start', x: 20 + OX, y: H - 2 }], look: lk, props: { title: u.title, blds: JSON.stringify(blds) } });
}

// ---------- 6격 마계 (abyss) — 따로 뽑는 세로로 긴 지도 (사용자 결정 2026-11-23, 시안 design/abyss-plan/preview.html) ----------
// 처음 시안(가로는 예전 6격 땅 폭 141칸 · 세로 280칸)을 88% 로 줄임 — 124 × 240. 남쪽 끝의 바위 둔덕 문(지하 묘실 출구가 닿는 곳)에서 북쪽으로 갈수록 센 상대:
// 일반 구역은 가운데 길을 품고 좌우로 번갈아 치우침 · 칠죄종은 길 옆 높은 턱(꾸밈은 나중에 — 턱 윗면은 그 꾸밈을 위해 비워 둠)에서
// 곁길로 찾아가야 만남 (길을 막지 않음) · 세기 층 사이를 용암 강이 가르고 건널 곳은 강마다 둘 · 북쪽 끝 마왕성 문을 세계수를 먹는 벌레가 막음,
// 마왕성 안(DEMON_CASTLE — 3격 성처럼 들어가는 큰 방)에 마왕 · 관측자 · 문의 광장으로 가는 문
const ABYSS = {                                                // 처음 시안(141 × 280)을 88% 로 줄이고 빈 가장자리를 좁힘 (사용자 결정 2026-11-23 — 웅장하되 쓰지 않는 땅이 많았음)
  W: 124, H: 240, cx: 62, half: [50, 57],                      // half — 땅의 반폭 (마왕성 줄 · 그 아래), 잡음으로 ±5
  road: [[62, 234], [58, 222], [51, 209], [67, 195], [57, 180], [71, 164], [55, 148], [69, 132], [55, 116], [71, 100], [57, 84], [67, 69], [62, 51], [62, 44]],
  rivers: [{ y: 190, amp: 3.5, ph: 0.3, gaps: [57, 92] }, { y: 150, amp: 4.4, ph: 1.7, gaps: [27, 62] }, { y: 118, amp: 3.5, ph: 3.1, gaps: [62, 97] }, { y: 70, amp: 2.6, ph: 4.4, gaps: [27, 64] }],
  areas: [['아크데몬', 46, 222, 26, 10], ['심연의 촉수', 78, 202, 26, 10], ['고대룡', 50, 171, 26, 12], ['마신장', 51, 86, 26, 11], ['종말의 짐승', 74, 56, 26, 10]],
  sins: [['칠죄종 · 나태', 23, 197], ['칠죄종 · 질투', 95, 185], ['칠죄종 · 색욕', 94, 160], ['칠죄종 · 폭식', 27, 141], ['칠죄종 · 오만', 94, 128], ['칠죄종 · 분노', 29, 107], ['칠죄종 · 탐욕', 97, 99]],
  ledge: { rx: 8, ry: 6 },                                     // 칠죄종 턱 윗면 — 16 × 12 칸 (꾸밀 자리, 줄이지 않음)
  // 칠죄종 턱마다 꾸밈 (사용자 결정 2026-11-23 — 하나씩 보여 주고 정함). 그림은 턱 윗면 16 × 12 칸 (위가 북쪽, 왼쪽 위 = 턱 가운데에서 (-8, -6)):
  // ' ' 턱 밖 · . 턱 윗면 · K 그 칠죄종이 선 칸 · 글자 네모 하나 = 막힌 소품 하나 (그림은 js/mapart.js 의 slothPix …)
  sites: {
    '칠죄종 · 나태': {                                         // 「끝내지 못한 것들」 — 하다 만 것이 그대로 남은 자리
      kinds: { T: 'slthr', S: 'slscf', B: ['slblk', 1], b: 'slblk', L: 'sllad', H: 'slhg', r: 'slscr' }, cool: true,   // cool — 이 턱은 용암 줄마저 식음 (그림 coolObs)
      pave: [0.5, -1.2, 4.5, 3.9],                             // 나태 둘레에 조금 깐 어두운 벽돌 — 턱 가운데에서 잰 타원 가운데 · 반지름 (칸, 사용자 결정 2026-11-23)
      plan: [
        '     ......     ',
        '   ....TTT...   ',
        '  ...B.TTT.r..  ',     // 쌓다 만 왕좌 · 곡괭이가 박힌 돌 · 미룬 책 더미
        ' .SS...KKK..H.. ',     // 짓다 만 기둥과 비계 · 멈춘 모래시계
        '..SS...KKK..H...',
        '.b.....KKK......',
        '..LL..........r.',     // 눕혀 둔 사다리 · 책 더미 하나 더
        '................',
        ' .............. ',
        '  ............  ',
        '   ..........   ',
        '     ......     '
      ]
    },
    '칠죄종 · 질투': {                                         // 「엿보는 자리」 — 남의 것을 들여다보고 훔쳐 모으는 곳
      kinds: { T: 'evtent', M: 'evmir', E: 'evtel', h: 'evhoard' }, lichen: true,   // lichen — 바닥에 초록 이끼가 번짐 (그림 lichenObs)
      plan: [
        '     ......     ',
        '   ...TTTT...   ',     // 훔친 천을 기운 천막
        '  ....TTTT..M.  ',     // 둘레에 반원으로 선 금 간 거울 셋
        ' ..M...KK...M.. ',
        '...M...KK.......',
        '.E..............',     // 길 쪽(서쪽)을 겨눈 망원경
        '.E.........M..h.',     // 훔쳐 온 물건 더미
        '....hh.....M....',
        ' .............. ',
        '  ............  ',
        '   ..........   ',
        '     ......     '
      ]
    },
    '칠죄종 · 색욕': {                                         // 작은 무도회장 건물 — 색욕은 안 지도(BALLROOM)에. 바깥 턱엔 문 앞 촛대 · 장미 덤불 · 가면 하나 (사용자 결정 2026-11-23)
      kinds: { H: 'luhall', C: 'lucand', r: 'lurose', m: 'lumask' }, petal: true,   // petal — 바닥에 검붉은 꽃잎이 흩어짐 (그림 petalObs)
      inside: { letter: 'H', id: 'ballroom', label: '무도회장', door: [2, 2] },     // 건물 아래 줄 왼쪽에서 2칸 · 폭 2 가 문
      plan: [
        '     HHHHHH     ',     // 무도회장 (6 × 4) — 턱 북쪽 끝의 좁은 줄까지 덮음
        '   ..HHHHHH..   ',
        '  .r.HHHHHH.r.  ',     // 장미 가시덤불
        ' ....HHHHHH.... ',
        '......C..C......',     // 문 앞 양옆 촛대
        '..r...C..C......',
        '...m.......r....',     // 떨어진 가면
        '................',
        ' .............. ',
        '  ............  ',
        '   ..........   ',
        '     ......     '
      ]
    },
    '칠죄종 · 폭식': {                                         // 「끝나지 않는 잔치」 — 먹어도 허기진 것의 자리
      kinds: { T: 'gltable', C: 'glcaul', S: 'glspit', B: 'glbones', b: 'glbones', k: 'glkeg', p: 'glplate', x: ['glslave', 1], y: ['glslave', 2] }, grease: true,   // x · y — 잡혀 온 일꾼 (솥 젓기 · 고기 굽기)   // grease — 흘린 국물 · 기름 얼룩 (그림 greaseObs)
      plan: [
        '     ......     ',
        '   .BB...p...   ',     // 갉아 먹은 뼈 무더기 · 쌓인 접시
        '  ....KKKK.CCx  ',     // 끓는 무쇠 솥 · 국자로 젓는 일꾼
        ' ..b..KKKK.CC.. ',
        '.k....KKKK....k.',     // 쓰러진 술통
        '......KKKK......',
        '.TTTT......SSSy.',     // 다 먹어 치운 긴 잔칫상 · 꼬챙이 구이 불자리 · 손잡이를 돌리는 일꾼
        '.TTTT...........',
        ' .............. ',
        '  ............  ',
        '   ..........   ',
        '     ......     '
      ]
    },
    '칠죄종 · 오만': {                                         // 작지만 화려한 제 성 — 오만은 안 지도(PRIDE_CASTLE)에. 바깥 턱엔 성문에서 계단까지 보라 융단 · 깃발 · 무릎 꿇린 조각상 · 쓰러뜨린 남의 석상 · 다른 왕의 머리 (사용자 결정 2026-11-23)
      kinds: { H: 'prcastle', b: 'prban', k: ['prkneel', 1], q: ['prkneel', 2], F: 'prfall', h: 'prhead' }, rug: true,   // rug — 성문에서 계단 끝까지 보라 융단 (그림 rugAt)
      inside: { letter: 'H', id: 'pridecastle', label: '오만의 성', door: [1, 3] },  // 성 아래 줄 왼쪽에서 1칸 · 폭 3 이 성문 (계단과 줄이 맞음)
      plan: [
        '     .HHHHH     ',     // 오만의 성 (5 × 4)
        '   ...HHHHH..   ',
        '  ...bHHHHHb..  ',     // 양옆 제 문장 깃발
        ' ....bHHHHHb... ',
        '.FF.............',     // 쓰러뜨려 동강 낸 남의 석상
        '.....k.....q....',     // 융단 양옆에 무릎 꿇린 돌 조각상 넷
        '.............h..',     // 다른 왕의 돌 머리
        '.....k.....q....',
        ' .............. ',
        '  ............  ',
        '   ..........   ',
        '     ......     '
      ]
    },
    '칠죄종 · 분노': {                                         // 「식지 않는 싸움터」 — 식지 않는 것이 다 부숴 놓은 자리
      kinds: { P: 'wrpil', o: 'wrbould', w: 'wrweap', f: 'wrfire', s: 'wrshield' }, rage: true,   // rage — 분노 발밑에서 사방으로 갈라져 빛나는 금 (그림 rageObs)
      plan: [
        '     ......     ',
        '   ..P.....P.   ',     // 끊어진 쇠사슬이 매달린 부서진 돌기둥 둘
        '  ...P.....P..  ',
        ' .o....KKK..... ',     // 쪼개진 바위
        '.......KKK...f..',     // 불붙어 타는 통나무
        '..ww...KKK......',     // 부러져 꽂힌 칼 · 도끼 · 창
        '...........o....',
        '.f....s.........',     // 그을린 채 쪼개진 방패
        ' ..o........... ',
        '  ............  ',
        '   ..........   ',
        '     ......     '
      ]
    },
    '칠죄종 · 탐욕': {                                         // 「아무리 쌓아도 모자란 곳」 — 가져도 모자란 것의 자리
      kinds: { G: 'grheap', p: 'grpile', c: 'grchest', o: ['grchest', 1], S: 'grscale', x: 'grskel', y: 'grskel' }, gold: true,   // gold — 탐욕 쪽으로 갈수록 빽빽한 흘린 금화 (그림 coinObs)
      plan: [
        '     ......     ',
        '   ...GGGGG..   ',     // 금화 산
        '  .c..GGGGG.c.  ',     // 쇠사슬 · 자물쇠로 감은 궤짝
        ' ....p.KKK..p.. ',     // 금화 더미
        '.S.....KKK......',     // 금화 쪽으로 기운 금 저울
        '.S.....KKK...xx.',     // 금화에 반쯤 묻힌 해골
        '...pp......o....',     // 금화가 넘치는 열린 궤짝
        '..........p.....',
        ' ..y........... ',     // 금화 밖으로 뻗은 뼈 손
        '  ............  ',
        '   ..........   ',
        '     ......     '
      ]
    }
  },
  castle: { x0: 30, x1: 94, y0: 7, y1: 40, door: 4 },         // 마왕성 바깥 (문은 아래 가운데, 벌레가 그 앞을 막음)
  mound: [62, 231],                                            // 지하 묘실로 내려가는 바위 둔덕의 문 (아래 가운데)
  merchant: [73, 234], chests: [[13, 164], [113, 113], [16, 63, 'big']]
};
const DEMON_CASTLE = { id: 'demoncastle', title: '마왕성', boss: '마왕', map: 'abyss', hidden: '관측자', hub: { label: '문의 광장', to: 'hub.overworld' },
  hall: { w: 26, h: 34, aisle: 4, bossY: 5, pillarX: 4, pillarRows: [12, 19, 26], pillar: 2 } };
// 색욕의 무도회장 안 (사용자 결정 2026-11-23) — 턱 위 작은 건물(ABYSS.sites 의 inside)로 들어가는 방. 문에서 붉은 깔개를 따라 맨 위 단의 색욕,
// 그 뒤 휘장을 걷은 정자 · 양옆 촛대, 기둥 두 줄, 벽가 촛대 · 떨어진 가면. 바닥 · 벽은 theme ballroom (대리석 체크 · 자줏빛 비단 벽 · 휘장 · 분홍 촛불 벽등)
const BALLROOM = { id: 'ballroom', title: '무도회장', boss: '칠죄종 · 색욕', elite: true, map: 'abyss', theme: 'ballroom',
  hall: { w: 18, h: 14, aisle: 4, bossY: 4, pillarX: 3, pillarRows: [7, 11], pillar: 2 },
  decor: [['lupav', 7, 1, 4, 2], ['lucand', 5, 3, 1, 2], ['lucand', 12, 3, 1, 2], ['lucand', 0, 0, 1, 2], ['lucand', 17, 0, 1, 2],
          ['lumask', 2, 4, 1, 1], ['lumask', 15, 9, 1, 1], ['lumask', 11, 12, 1, 1]] };
// 오만의 성 안 (사용자 결정 2026-11-23) — 턱 위 작은 성(ABYSS.sites 의 inside)으로 들어가는 방. 맨 위에 아주 큰 오만의 석상(5 × 6), 그 앞 단 위에 오만,
// 양옆 · 벽가에 흠 없는 금테 거울, 제 문장 깃발, 보라 깔개 양옆에 무릎 꿇린 돌 조각상. 바닥 · 벽 · 기둥 · 깔개는 theme pride
const PRIDE_CASTLE = { id: 'pridecastle', title: '오만의 성', boss: '칠죄종 · 오만', elite: true, map: 'abyss', theme: 'pride',
  hall: { w: 17, h: 16, aisle: 3, bossY: 6, pillarX: 2, pillarRows: [9, 13], pillar: 2 },
  decor: [['prbig', 6, 0, 5, 6], ['prmir', 4, 1, 1, 2], ['prmir', 12, 1, 1, 2], ['prban', 2, 0, 1, 2], ['prban', 14, 0, 1, 2],
          ['prmir', 0, 4, 1, 2], ['prmir', 16, 4, 1, 2], ['prmir', 0, 10, 1, 2], ['prmir', 16, 10, 1, 2],
          ['prkneel', 5, 11, 1, 1, 1], ['prkneel', 11, 11, 1, 1, 2], ['prkneel', 5, 14, 1, 1, 1], ['prkneel', 11, 14, 1, 1, 2]] };
function abyssMap(data) {
  const A = ABYSS, W = A.W, H = A.H, idx = (x, y) => y * W + x, inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const n1 = valueNoise(61), n2 = valueNoise(62), hash = (x, y, s) => { const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); };
  const tiles = new Uint8Array(W * H).fill(WALL), lk = new Uint8Array(W * H).fill(look(OL.OBSID, 6));
  const keep = new Uint8Array(W * H), noArea = new Uint8Array(W * H), high = new Uint8Array(W * H), stairs = new Uint8Array(W * H);
  const zi = data.ZONES.findIndex(z => z.rank === 6), zone = data.ZONES[zi], foes = data.ENEMIES.filter(e => e.zoneIndex === zi);
  const foeNamed = name => { const e = foes.find(q => q.name === name); if (!e) throw new Error(`6격 — ${name} 이(가) 없음`); return e; };
  // 땅 — 가운데에서 좌우로 들쭉날쭉한 폭, 아래 끝은 좁아짐
  const half = y => (y < A.castle.y1 + 4 ? A.half[0] : A.half[1]) + (n1(y * 0.06, 1) - 0.5) * 10 - (y > H - 8 ? (y - (H - 8)) * 4 : 0);
  for (let y = 3; y < H - 2; y++) for (let x = 1; x < W - 1; x++) if (Math.abs(x + 0.5 - A.cx) < half(y)) tiles[idx(x, y)] = FLOOR;
  const segDist = (pts, x, y) => { let best = 1e9; for (let i = 0; i + 1 < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy))); best = Math.min(best, Math.hypot(x - ax - dx * t, y - ay - dy * t)); } return best; };
  // 칠죄종 턱 — 윗면(걸을 수 있음 · 한 층 높게) · 둘레 바위 테(남쪽은 두 칸) · 남쪽 테 가운데에 바위 계단. 윗면 · 테 · 둘레는 구역 밖, 나무 없음
  const posts = [], ledges = [], sitePorts = [], blds = [], cool = new Uint8Array(W * H), lichen = new Uint8Array(W * H), petal = new Uint8Array(W * H), grease = new Uint8Array(W * H), rage = new Uint8Array(W * H), gold = new Uint8Array(W * H), pave = [], rug = [], rageAt = [], goldAt = [];
  for (const [name, lx, ly] of A.sins) {
    const e = foeNamed(name), { rx, ry } = A.ledge, d = (x, y) => Math.hypot((x + 0.5 - lx) / rx, (y + 0.5 - ly) / ry);
    for (let y = ly - ry - 4; y <= ly + ry + 4; y++) for (let x = lx - rx - 4; x <= lx + rx + 4; x++) {
      if (!inside(x, y) || d(x, y) >= 1) continue;
      const k = idx(x, y);
      if (tiles[k] !== FLOOR) throw new Error(`6격 ${name} 턱 — (${x}, ${y}) 자리가 빈 땅이 아님`);
      high[k] = 1; keep[k] = 1; noArea[k] = 1;
    }
    for (let y = ly - ry - 4; y <= ly + ry + 4; y++) for (let x = lx - rx - 4; x <= lx + rx + 4; x++) {
      if (!inside(x, y) || high[idx(x, y)]) continue;
      const k = idx(x, y), near = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1], [0, -2], [1, -2], [-1, -2]].some(([ex, ey]) => inside(x + ex, y + ey) && high[idx(x + ex, y + ey)]);
      if (near) { if (tiles[k] === FLOOR) tiles[k] = ROCK; keep[k] = 1; noArea[k] = 1; }
      else if (Math.hypot((x + 0.5 - lx) / (rx + 3), (y + 0.5 - ly) / (ry + 3)) < 1) { keep[k] = 1; noArea[k] = 1; }
    }
    const sx = lx - 1;                                         // 바위 계단 — 남쪽 테를 위에서 아래로 뚫음
    for (let x = sx; x < sx + 3; x++) { let y = ly; while (high[idx(x, y + 1)]) y++; for (let j = y + 1; tiles[idx(x, j)] === ROCK; j++) { tiles[idx(x, j)] = FLOOR; stairs[idx(x, j)] = 1; } }
    const n = e.size, px = Math.round(lx - n / 2), py = Math.round(ly - n / 2) - 2;   // 윗면 가운데에서 조금 북쪽 (남쪽 반은 꾸밀 자리 · 계단 앞)
    const site = A.sites && A.sites[name];
    if (!(site && site.inside)) posts.push({ name: e.name, x: px, y: py, w: n, h: n, enemy: e.id, blocks: false });   // inside — 건물 안 지도에 섬
    let foot = ly; while (high[idx(lx, foot + 1)] || stairs[idx(lx, foot + 1)]) foot++;
    if (site && site.gold) goldAt.push([Math.round((px + n / 2) * 16), (py + n) * 16 - 6].join(','));   // 흘린 금화가 가장 빽빽한 곳 — 탐욕의 발밑
    if (site && site.rage) rageAt.push([Math.round((px + n / 2) * 16), (py + n) * 16 - 4].join(','));   // 갈라진 금의 가운데 — 분노의 발밑 (점 단위)
    if (site && site.rug && !site.inside) rug.push([px * 16 + 2, (py + n) * 16 - 4, (px + n) * 16 - 2, (foot + 1) * 16].join(','));   // 융단 — 발밑에서 계단 끝까지 (점 단위)
    ledges.push({ x: lx, y: foot + 1 });                       // 계단 밑 — 곁길이 닿는 곳
    // 꾸밈 (A.sites) — 글자 네모마다 막힌 소품 하나 (칸은 벽 · 겉모습 BUILD, 그림은 지도 속성 blds)
    if (site) {
      for (const [flag, mask] of [['cool', cool], ['lichen', lichen], ['petal', petal], ['grease', grease], ['rage', rage], ['gold', gold]]) if (site[flag]) for (let y = ly - ry - 4; y <= ly + ry + 4; y++) for (let x = lx - rx - 4; x <= lx + rx + 4; x++) if (inside(x, y) && (high[idx(x, y)] || stairs[idx(x, y)] || (tiles[idx(x, y)] === ROCK && noArea[idx(x, y)]))) mask[idx(x, y)] = 1;   // 윗면 · 바위 테 · 계단 (절벽 면까지)   // 윗면 · 바위 테 · 계단 (절벽 면의 불줄기도)
      if (site.pave) { const [dx, dy, prx, pry] = site.pave; pave.push([(lx + dx) * 16, (ly + dy) * 16, prx * 16, pry * 16].map(Math.round).join(',')); }
      const { plan, kinds } = site, ox = lx - rx, oy = ly - ry, ch = (c, r) => (plan[r] || '')[c] || ' ';
      if (plan.length !== ry * 2 || plan.some(row => row.length !== rx * 2)) throw new Error(`6격 ${name} 꾸밈 — 그림이 ${rx * 2} × ${ry * 2} 가 아님`);
      for (let r = 0; r < plan.length; r++) for (let c = 0; c < plan[r].length; c++) {
        const t = ch(c, r), x = ox + c, y = oy + r, k = idx(x, y);
        if ((t === ' ') !== !high[k]) throw new Error(`6격 ${name} 꾸밈 — (${x}, ${y}) 턱 모양이 그림과 다름`);
        if (t === 'K') { if (x < px || x >= px + n || y < py || y >= py + n) throw new Error(`6격 ${name} 꾸밈 — K 가 그 자리가 아님`); continue; }
        if (t === ' ' || t === '.' || ch(c - 1, r) === t || ch(c, r - 1) === t) continue;   // 소품의 나머지 칸 — 왼쪽 위 칸이 한꺼번에
        const kd = kinds[t];
        if (!kd) throw new Error(`6격 ${name} 꾸밈 — 글자 ${t} 를 모름`);
        let w = 0, h = 0; while (ch(c + w, r) === t) w++; while (ch(c, r + h) === t) h++;
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = idx(x + i, y + j); tiles[q] = WALL; lk[q] = look(BUILD, 6); }
        const [kind, f] = Array.isArray(kd) ? kd : [kd, 0];
        blds.push({ x, y, w, h, kind, v: blds.length, ...(f ? { f } : {}) });
        if (site.inside && t === site.inside.letter) {                // 건물 문 — 아래 줄, 걸어 들어감
          const I = site.inside, dx = x + I.door[0], dy = y + h - 1;
          for (let i = 0; i < I.door[1]; i++) tiles[idx(dx + i, dy)] = FLOOR;
          sitePorts.push({ name: I.id, label: I.label, x: dx, y: dy, w: I.door[1], h: 1, to: `${I.id}.out`, door: true });
          if (site.rug) rug.push([dx * 16 + 2, (dy + 1) * 16, (dx + I.door[1]) * 16 - 2, (foot + 1) * 16].join(','));   // 융단 — 문 앞에서 계단 끝까지
        }
      }
    }
  }
  // 용암 강 — 건널 곳(gaps)은 둘레 땅 그대로 · 칠죄종 턱 둘레는 비켜 감
  for (const r of A.rivers) for (let x = 0; x < W; x++) {
    if (r.gaps.some(gx => Math.abs(x - gx) < 4)) continue;
    const ry = r.y + Math.sin(x * 0.07 + r.ph) * r.amp + (n2(x * 0.1, r.y) - 0.5) * 3;
    for (let y = Math.floor(ry - 2.2); y <= ry + 2.2; y++) if (inside(x, y) && tiles[idx(x, y)] === FLOOR && !noArea[idx(x, y)] && Math.abs(y + 0.5 - ry) < 2.2) { tiles[idx(x, y)] = WATER; lk[idx(x, y)] = look(OL.LAVA, 6); }
  }
  // 큰길 · 곁길 (흙길 칸) — 곁길은 큰길에서 가장 가까운 점부터 그 턱의 계단 밑까지
  const sides = ledges.map(L => {
    let bp = null, bd = 1e9;
    for (let i = 0; i + 1 < A.road.length; i++) for (let k = 0; k <= 20; k++) {
      const t = k / 20, px = A.road[i][0] + (A.road[i + 1][0] - A.road[i][0]) * t, py = A.road[i][1] + (A.road[i + 1][1] - A.road[i][1]) * t, dd = Math.hypot(px - L.x, py - L.y);
      if (dd < bd) { bd = dd; bp = [px, py]; }
    }
    return [bp, [L.x + 0.5, L.y + 0.5]];
  });
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = idx(x, y);
    if (high[k] || stairs[k]) continue;
    const onRoad = segDist(A.road, x + 0.5, y + 0.5) < 2.2, onSide = sides.some(p => segDist(p, x + 0.5, y + 0.5) < 1.2);
    if (!onRoad && !onSide) continue;
    if (tiles[k] === FLOOR || (tiles[k] === WATER && onRoad) || (tiles[k] === WATER && onSide)) { tiles[k] = ROAD; lk[k] = look(OL.DIRT, 5); keep[k] = 1; }   // 길 그림은 잿빛 진흙(5격 흙 빛) — 밝은 흙이 마계에 튐   // 강을 건너는 자리도 흙길 (용암을 메움)
  }
  // 마왕성 — 바깥은 건물 칸(그림은 성), 아래 가운데 문. 벌레가 문 바로 앞을 몸으로 막음
  const C = A.castle;
  for (let y = C.y0; y < C.y1; y++) for (let x = C.x0; x < C.x1; x++) { const k = idx(x, y); tiles[k] = WALL; lk[k] = look(BUILD, 8); noArea[k] = 1; }
  const dx0 = A.cx - (C.door >> 1);
  const ports = [{ name: DEMON_CASTLE.id, label: DEMON_CASTLE.title, x: dx0, y: C.y1 - 1, w: C.door, h: 1, to: `${DEMON_CASTLE.id}.out`, door: true }, ...sitePorts];
  for (let i = 0; i < C.door; i++) tiles[idx(dx0 + i, C.y1 - 1)] = FLOOR;
  const worm = foeNamed('세계수를 먹는 벌레');
  posts.push({ name: worm.name, x: dx0, y: C.y1, w: worm.size, h: worm.size, enemy: worm.id, blocks: true });
  for (let y = C.y1; y < C.y1 + worm.size + 3; y++) for (let x = dx0 - 3; x < dx0 + worm.size + 3; x++) {
    const k = idx(x, y);
    if (tiles[k] === WALL) throw new Error('6격 — 마왕성 문 앞이 빈 땅이 아님');
    if (tiles[k] === WATER) tiles[k] = FLOOR;
    keep[k] = 1; noArea[k] = 1;
  }
  // 지하 묘실로 내려가는 바위 둔덕의 문 (gate — 아래 가운데 세 칸이 문, 늘 열림 · 그림은 내려가는 계단)
  {
    const [mx, my] = A.mound, RW = 9, RH = 5;
    for (let y = my - RH - 3; y <= my; y++) for (let x = mx - (RW >> 1) - 2; x <= mx + (RW >> 1) + 2; x++) {
      const j = hash(x, y, 71) * 1.2, hw = y > my - RH ? RW >> 1 : (RW >> 1) - (my - RH + 1 - y) * 1.4 + j;
      if (Math.abs(x - mx) > hw || (y === my && Math.abs(x - mx) <= 1)) continue;
      const k = idx(x, y);
      if (tiles[k] === WALL) continue;
      tiles[k] = ROCK; keep[k] = 1; noArea[k] = 1;
    }
    for (let x = mx - 1; x <= mx + 1; x++) { tiles[idx(x, my)] = FLOOR; lk[idx(x, my)] = look(OL.OBSID, 6); }
    ports.push({ name: 'in', label: '대성당 아래 묘실', x: mx - 1, y: my, w: 3, h: 1, to: 'crypt.up', gate: true, gw: 5, gh: 4, ww: RW, wh: RH, gdir: 'down' });
    for (let y = my + 1; y <= my + 3; y++) for (let x = mx - 3; x <= mx + 3; x++) {
      const k = idx(x, y);
      if (tiles[k] === WALL) throw new Error('6격 — 묘실 문 앞이 빈 땅이 아님');
      if (tiles[k] === ROCK) tiles[k] = FLOOR;
      keep[k] = 1; noArea[k] = 1;
    }
  }
  // 상인 · 보물상자 · 들어서는 곳
  const npcs = [{ name: 'start', x: A.mound[0], y: A.mound[1] + 2 }, { name: 'entry', x: A.mound[0], y: A.mound[1] + 2, zone: zone.id }, { name: 'merchant', x: A.merchant[0], y: A.merchant[1], zone: zone.id }];
  const item = (data.ITEMS.find(i => i.chest && i.rank.n === 6) || {}).id;
  const clear3 = (x, y) => { for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const t = tiles[idx(x + i, y + j)]; if ((t !== FLOOR && t !== ROAD) || noArea[idx(x + i, y + j)]) return false; } return true; };
  const near = (x0, y0) => { for (let r = 0; r <= 10; r++) for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (Math.max(Math.abs(i), Math.abs(j)) === r && clear3(x0 + i, y0 + j)) return [x0 + i, y0 + j]; throw new Error(`6격 — (${x0}, ${y0}) 곁에 보물상자 둘 자리가 없음`); };
  const chests = A.chests.map(([x0, y0, big], i) => { const [x, y] = near(x0, y0); return { name: '보물상자', x, y, chest: big ? 'r6-big' : `r6-${i + 1}`, rank: 6, ...(big ? { big: true, item } : {}) }; });   // 정한 자리 곁의 트인 땅
  for (const q of [...npcs, ...chests]) for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const k = idx(q.x + i, q.y + j);
    if (tiles[k] !== FLOOR && tiles[k] !== ROAD) throw new Error(`6격 — ${q.name} (${q.x}, ${q.y}) 둘레가 빈 땅이 아님`);
    keep[k] = 1;
  }
  // 나무 · 바위 — 듬성듬성 (둘레가 비어 있을 때만, 길 · 턱 · 정해진 자리 곁은 비움)
  for (let y = 4; y < H - 4; y++) for (let x = 2; x < W - 2; x++) {
    const k = idx(x, y);
    if (tiles[k] !== FLOOR || keep[k]) continue;
    const g = n1(x * 0.16, y * 0.16), r = hash(x, y, 72);
    const alone = ![[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1], [-2, 0], [0, -2]].some(([ex, ey]) => tiles[idx(x + ex, y + ey)] === TREE || tiles[idx(x + ex, y + ey)] === ROCK);
    if (alone && g > 0.6 && r < 0.18) tiles[k] = TREE;
    else if (alone && r < 0.006) tiles[k] = ROCK;
  }
  // 걸어서 닿는가 — 들어서는 곳에서 (닫힌 마왕성 문 · 벌레 몸은 지나가지 못함, 턱 위 · 계단도 걸음)
  const open = k => tiles[k] === FLOOR || tiles[k] === ROAD;
  const seen = new Uint8Array(W * H), q = [idx(A.mound[0], A.mound[1] + 2)];
  seen[q[0]] = 1;
  for (let n = 0; n < q.length; n++) for (const d of [1, -1, W, -W]) { const j = q[n] + d; if (!seen[j] && open(j)) { seen[j] = 1; q.push(j); } }
  const touch = p => { for (let y = p.y - 1; y <= p.y + p.h; y++) for (let x = p.x - 1; x <= p.x + p.w; x++) { const inBody = x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h; if (!inBody && inside(x, y) && seen[idx(x, y)]) return true; } return false; };
  for (const p of posts) if (!touch(p)) throw new Error(`6격 — ${p.name} 에 걸어서 못 감`);
  for (const c of chests) if (!seen[idx(c.x, c.y)]) throw new Error(`6격 — 보물상자 (${c.x}, ${c.y}) 에 걸어서 못 감`);
  for (const p of sitePorts) if (!seen[idx(p.x, p.y)]) throw new Error(`6격 — ${p.label} 문에 걸어서 못 감`);
  for (let k = 0; k < W * H; k++) if ((high[k] || stairs[k]) && open(k) && !seen[k]) throw new Error(`6격 — 턱 위 (${k % W}, ${(k / W) | 0}) 칸이 소품에 갇힘 (꾸밈 그림을 고칠 것)`);
  for (let k = 0; k < W * H; k++) if (open(k) && !seen[k]) { tiles[k] = WALL; lk[k] = look(OL.OBSID, 6); }   // 갇힌 외톨이 땅은 벽으로
  // 구역 — 잡음 섞은 타원 안의 그 격 땅 (나무 · 바위 · 용암은 품어 구멍 없이, 턱 · 정해진 자리 둘레는 뺌), 걸어서 이어지는 한 덩어리
  const saveW = OUT_W, saveH = OUT_H; OUT_W = W; OUT_H = H;
  const normals = foes.filter(e => e.kind === 'normal' && !underNormal(e));
  if (normals.length !== A.areas.length) throw new Error(`6격 — 구역 ${A.areas.length}개, 일반 ${normals.length}종`);
  const areas = A.areas.map(([name, ax, ay, rx, ry]) => {
    const e = foeNamed(name), mine = new Set();
    for (let y = ay - ry - 3; y <= ay + ry + 3; y++) for (let x = ax - rx - 3; x <= ax + rx + 3; x++) {
      if (!inside(x, y)) continue;
      const k = idx(x, y), wob = 1 + (n2(x * 0.15, y * 0.15) - 0.5) * 0.25;
      if (Math.hypot((x + 0.5 - ax) / rx, (y + 0.5 - ay) / ry) < wob && tiles[k] !== WALL && !noArea[k] && !high[k] && !stairs[k]) mine.add(k);
    }
    let start = -1, bd = 1e9;
    for (const k of mine) if (open(k)) { const dd = Math.hypot(k % W - ax, ((k / W) | 0) - ay); if (dd < bd) { bd = dd; start = k; } }
    if (start < 0) throw new Error(`6격 — ${name} 구역에 걸을 땅이 없음`);
    const keepSet = new Set([start]), st = [start];
    while (st.length) { const k = st.pop(); for (const d of [1, -1, W, -W]) { const j = k + d; if (mine.has(j) && !keepSet.has(j)) { keepSet.add(j); st.push(j); } } }
    const xs = [...keepSet].map(k => k % W), ys = [...keepSet].map(k => (k / W) | 0);
    const box = { x: Math.min(...xs) - 1, y: Math.min(...ys) - 1, w: Math.max(...xs) - Math.min(...xs) + 3, h: Math.max(...ys) - Math.min(...ys) + 3 };
    const outside = new Set(), qq = [];                         // 구멍 메우기 — 네모 둘레에서 바깥을 따라 퍼져 닿지 않는 칸은 품음
    for (let y = box.y; y < box.y + box.h; y++) for (let x = box.x; x < box.x + box.w; x++) if ((x === box.x || y === box.y || x === box.x + box.w - 1 || y === box.y + box.h - 1) && !keepSet.has(idx(x, y))) { outside.add(idx(x, y)); qq.push([x, y]); }
    while (qq.length) { const [x, y] = qq.pop(); for (const [ex, ey] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + ex, ny = y + ey, j = idx(nx, ny); if (nx < box.x || ny < box.y || nx >= box.x + box.w || ny >= box.y + box.h || keepSet.has(j) || outside.has(j)) continue; outside.add(j); qq.push([nx, ny]); } }
    for (let y = box.y + 1; y < box.y + box.h - 1; y++) for (let x = box.x + 1; x < box.x + box.w - 1; x++) if (!keepSet.has(idx(x, y)) && !outside.has(idx(x, y))) keepSet.add(idx(x, y));
    const { x, y, polygon } = outline(keepSet, box);
    return { name: e.name, x, y, polygon, rank: 6, monster: e.id, zone: zone.id };
  });
  const highRuns = cellRuns(high), stairRuns = cellRuns(stairs), coolRuns = cellRuns(cool), lichenRuns = cellRuns(lichen), petalRuns = cellRuns(petal), greaseRuns = cellRuns(grease), rageRuns = cellRuns(rage), goldRuns = cellRuns(gold);   // cellRuns 는 OUT_W 로 칸을 풂 — 바꿔 둔 동안에
  OUT_W = saveW; OUT_H = saveH;
  return buildTmj({ w: W, h: H, tiles, areas, posts, ports, npcs, chests, look: lk, props: { title: zone.name, high: highRuns, stairs: stairRuns, cool: coolRuns, lichen: lichenRuns, petal: petalRuns, grease: greaseRuns, rage_cells: rageRuns, rage: rageAt.join(';'), gold_cells: goldRuns, gold: goldAt.join(';'), rug: rug.join(';'), pave: pave.join(';'), blds: JSON.stringify(blds) } });
}

// ---------- 건물 안 (BUILDINGS) — 왕좌의 큰 방 ----------
// 위는 세 칸 높이의 벽면(그림이 벽돌 벽 · 깃발 · 횃불로), 옆 · 아래는 벽 윗면. 아래 벽 가운데에 바깥 문으로 나가는 문간.
// 문간에서 붉은 깔개를 따라 곧장 올라가면 맨 위 가운데 단 위에 보스, 기둥은 깔개 양옆에 줄지어 (사용자 결정 — 예전 큰 방은 기둥이 한쪽에 몰려 있었음).
// 그 보스의 숨은 굴(SECRET_ROOMS 의 from)은 보스 바로 뒤에 구멍. 지역은 없음 — 들어와도 지역은 그대로
function buildingInterior(data, b) {
  const hall = b.hall, TOP = 3, SIDE = 2, BOTTOM = 2;
  const W = hall.w + SIDE * 2, H = TOP + hall.h + BOTTOM, cx = W >> 1;
  if ((hall.w - hall.aisle) % 2) throw new Error(`건물 ${b.id} — 방 폭 · 깔개 폭은 둘 다 홀수거나 둘 다 짝수여야 가운데가 맞음`);
  const tiles = new Uint8Array(W * H).fill(WALL), lk = new Uint8Array(W * H).fill(look(OL.TILES, 8));
  const fill = (r, t) => { for (let j = 0; j < r.h; j++) for (let i = 0; i < r.w; i++) tiles[(r.y + j) * W + r.x + i] = t; };
  fill({ x: SIDE, y: TOP, w: hall.w, h: hall.h }, FLOOR);
  for (const y of hall.pillarRows) for (const x of [SIDE + hall.pillarX, W - 1 - SIDE - hall.pillarX - (hall.pillar - 1)])   // 깔개 양옆 — 가운데에 맞춰 마주 보게
    fill({ x, y: TOP + y, w: hall.pillar, h: hall.pillar }, ROCK);
  const foe = data.ENEMIES.find(e => e.name === b.boss);
  if (!foe || (foe.kind !== 'boss' && !(b.elite && foe.kind === 'elite'))) throw new Error(`건물 ${b.id} — ${b.boss} 이(가) 보스가 아님`);   // b.elite — 정예가 서는 방 (색욕의 무도회장)
  if ((hall.w - foe.size) % 2) throw new Error(`건물 ${b.id} — 보스 크기와 방 폭이 홀짝이 달라 깔개 가운데에 못 섬`);
  const post = { name: foe.name, x: cx - (foe.size >> 1), y: TOP + hall.bossY, w: foe.size, h: foe.size, enemy: foe.id, blocks: false };
  const ports = [];
  for (const s of SECRET_ROOMS.filter(q => q.from === b.id && q.boss === b.boss)) {
    const hole = { name: s.id, label: s.title, x: post.x, y: post.y - 2, w: post.w, h: 1, to: `${s.id}.out`, opensAfter: foe.id, appears: true, hole: true, art: 'floor' };
    for (let j = 0; j < 2; j++) for (let i = 0; i < hole.w; i++) if (tiles[(hole.y + j) * W + hole.x + i] !== FLOOR) throw new Error(`건물 ${b.id} — 숨은 굴 구멍 자리가 바닥이 아님`);
    ports.push(hole);
  }
  // 나가는 문 — 아래 벽 첫 줄 가운데, 깔개와 같은 폭
  const out = { name: 'out', label: '나가기', x: cx - (hall.aisle >> 1), y: TOP + hall.h, w: hall.aisle, h: 1, to: `${b.map || 'overworld'}.${b.id}`, door: true };
  fill(out, FLOOR);
  for (let i = 0; i < out.w; i++) lk[out.y * W + out.x + i] = look(DOORWAY, 8);
  // 꾸밈 — 보스 발밑엔 한 칸 넓은 단(금테), 문간에서 그 단까지 가운데 붉은 깔개
  for (let y = post.y - 1; y <= post.y + post.h; y++) for (let x = post.x - 1; x <= post.x + post.w; x++) if (tiles[y * W + x] === FLOOR) lk[y * W + x] = look(OL.TILES, 6);
  for (let y = post.y + post.h + 1; y < out.y; y++) for (let x = out.x; x < out.x + out.w; x++) if (tiles[y * W + x] === FLOOR) lk[y * W + x] = look(CARPET, 8);
  ports.push(out);
  const posts = [post];
  // 히든 (b.hidden — 마왕성의 관측자): 보스 오른쪽 옆, 두 칸 띄워. 보스를 꺾어야 나타나는 것은 게임이 정함 (히든 규칙)
  if (b.hidden) {
    const h = data.ENEMIES.find(e => e.name === b.hidden && e.kind === 'hidden');
    if (!h) throw new Error(`건물 ${b.id} — ${b.hidden} 이(가) 히든이 아님`);
    const hp = { name: h.name, x: post.x + post.w + 3, y: post.y, w: h.size, h: h.size, enemy: h.id, blocks: false };
    for (let j = 0; j < h.size; j++) for (let i = 0; i < h.size; i++) if (tiles[(hp.y + j) * W + hp.x + i] !== FLOOR) throw new Error(`건물 ${b.id} — ${b.hidden} 자리가 바닥이 아님`);
    posts.push(hp);
  }
  // 다른 지도로 가는 문 (b.hub — 마왕성: 왕좌 뒤 맨 위 줄 가운데, 보스를 꺾어야 열림 · 문의 광장으로)
  if (b.hub) ports.push({ name: 'hub', label: b.hub.label, x: cx - 1, y: TOP, w: 2, h: 1, to: b.hub.to, opensAfter: foe.id });
  // 꾸밈 소품 (b.decor — [kind, 방 안 x, y, w, h]: 막힌 칸, 그림은 지도 속성 blds) · 테마 (b.theme — 바닥 · 벽 그림, js/mapart.js 의 ballFloor · ballWall)
  const blds = [];
  for (const [kind, hx, hy, w, h, f] of b.decor || []) {
    const x = SIDE + hx, y = TOP + hy;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const k = (y + j) * W + x + i;
      if (tiles[k] !== FLOOR || lk[k] === look(CARPET, 8)) throw new Error(`건물 ${b.id} — ${kind} (${x + i}, ${y + j}) 자리가 빈 바닥이 아님`);
      tiles[k] = WALL; lk[k] = look(BUILD, 8);
    }
    blds.push({ x, y, w, h, kind, v: blds.length, ...(f ? { f } : {}) });
  }
  const props = { title: b.title, interior: true, ...(b.theme ? { theme: b.theme } : {}), ...(blds.length ? { blds: JSON.stringify(blds) } : {}) };
  return buildTmj({ w: W, h: H, tiles, posts, ports, npcs: [{ name: 'start', x: out.x + (out.w >> 1), y: out.y - 1 }], look: lk, props });
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
    autoChests: true,
    spreadSets: true                                         // 묶음 정예는 홀 대신 들판 곳곳에 (임시 — 위 generate 의 3))
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
  ports.push({ name: 'overworld', label: '마왕의 성으로', x: cx - 1, y: sy, w: 3, h: 1, to: 'demoncastle.hub' });   // 마왕성 안 왕좌 뒤 (DEMON_CASTLE)
  const npcs = [{ name: 'start', x: cx, y: sy - 2 }];
  return buildTmj({ w: W, h: H, tiles, ports, npcs, props: { title: '문의 광장' } });
}

// ---------- 도시 — 옛 동네(oldtown) · 헌터들의 도시(city), 회차와 회차 사이에 머무는 곳 (docs/CITY-PLAN.md 1-가) ----------
// 두 장 (사용자 결정): 옛 동네에서 오른쪽으로 쭉 가면 미래 도시. 옛 동네 오른쪽 끝의 통로에 닿으면 도시 왼쪽 끝에서 나옵니다
// (그 사이의 길은 그리지 않음 — 지도 가장자리 통로 edge, 넘어가면 통로 안쪽에 섬 arrive).
// 첫 회차가 끝난 뒤부터 회차는 옛 동네의 집 앞에서 시작합니다. 옛 동네 골목 막다른 곳의 이상한 게이트(나에게만 보임)로 들어가면
// 지하수로 첫 공간, 지하수로 첫 공간의 같은 게이트로 나오면 그 회차가 끝나고 옛 동네로 (game.js 의 leaveSpace).
//   옛 동네       개발에서 비켜난 낡은 동네 — 위 줄에 집 · 빈 건물(나중에 내 길드가 될 곳) · 암시장이 들어설 골목 · 이상한 게이트의 골목,
//                 가운데 골목길, 아래 줄에 낡은 건물들
//   헌터들의 도시 헌터들이 몬스터라는 새 자원으로 훨씬 미래로 자란 서울 (사용자 결정) — 위에서 아래로
//                 협회 구역(가운데 가장 큰 헌터 협회, 양옆에 4대 길드 둘, 앞은 빛줄 광장) · 큰길 ·
//                 가운데 구역(헌터백화점 · 4대 길드 둘, 사이로 가운데 길) · 둘째 길 · 가림막 친 빈터 셋(나중에 들어설 것들의 자리)
// 건물끼리는 붙지 않게 띄웁니다 (골목 끝의 덧붙인 채 annex 만 빼고). 좌표는 걷는 곳(w × h) 기준 칸 — 둘레(pad)는 음수 · w 이상.
// 둘레에도 거리를 그려 화면 가장자리 너머가 까맣지 않게 하고, 걷지는 못합니다 (지도 속성 walk).
const CITY_BIO = 10;                                         // 도시 — 그림(js/mapart.js 의 CITY)이 이 격 번호로 도시 무늬를 고름
// 땅 [종류, x, y, w, h] — 뒤에 적은 것이 앞의 것을 덮음. 적지 않은 곳은 base(보도 · 낡은 바닥).
//   road 찻길 · cross 횡단보도 · plaza 광장 · lawn 잔디 · pave 보도 · old 낡은 바닥 · lot 가림막 친 빈터(못 들어감) · bar 찻길 끝 막음
// 건물 — kind(그림): hq 헌터 협회 · dept 헌터백화점 · guild 4대 길드(tone 0 홍염 붉은 불꽃 · 1 청해 푸른 파도 · 2 크라운 금빛 왕관 · 3 달 보랏빛 달 — 이름 사용자 결정 2026-11-19, data.js 의 BIG_GUILDS) ·
//   tower 둘레의 빌딩(tone 으로 빛깔) · villa 빨간 벽돌 빌라 · shabby 허름한 빈 건물 · store 낡은 가게 · back 낡은 뒤 건물
//   door { x, w, name, label } — 아래 줄의 문 (지금은 모두 닫혀 있음 — 안은 다음 조각들). annex — 골목 끝에 덧붙인 채 (옆 건물과 붙어도 됨)
// 나무 [x, y] — 잔디 · 광장 곁의 것은 벚나무가 섞임 (그림이 고름). 기둥 [x, y] — 몬스터 핵으로 빛나는 가로등
// edges — 지도 가장자리 통로 { name, x, y, w, h, to, label, arrive } (넘어가면 to 의 같은 이름 통로 안쪽 — arrive 쪽 — 에 섬)
// 크기 규칙 (2026-11-18 사용자 결정 — 「건물이 크고 반복적」): 길드 · 헌터 협회 말고는 한 줄에 반복되는 창이 8개 이하가 되게 가로를 줄이고
//   (빌라 · 가게 · 빈 건물 7칸 · 백화점 12칸 · 둘레 빌딩 7칸), 옥상이 덜 보이게 깊이(h)를 줄임. 창 간격은 js/mapart.js 의 oldFace · deptFace · glassWall.
const OLDTOWN = {
  title: '옛 동네', base: 'old',
  // 2026-11-19 가로 44 → 24 (사용자 결정 — 「옛 동네 맵 크기 줄이기」). 위 줄: 집 · 게이트 틈 · 내 길드가 될 건물 · 가게 · 암시장 골목 · 빌라, 아래 줄 넷
  w: 24, h: 19, pad: { t: 9, b: 5, l: 9, r: 9 },   // 2026-11-19 가운데 골목길 3 → 5칸 (y 7 ~ 11 — 사용자 결정 「내가 가는 길」)
  facade: { f: 3 },                                        // 벽면 높이 3칸 — 깊이가 「가로 + 3칸」이면 위에서 보이는 옥상이 정사각형 (사용자 결정 2026-11-18)
  ground: [],
  // 옥상은 대부분 정사각형(가로 4칸 · 깊이 7칸) — 직사각형 옥상은 위 줄 오른쪽 끝 한 채만. 생김새는 종류마다 매기는 번호 v 로 모두 다르게 (js/mapart.js 의 oldPal)
  buildings: [
    // 위 줄 — 문은 가운데 골목길(y 7 ~ 11)을 봄
    { kind: 'villa', roof: 'tank', x: 2, y: 0, w: 4, h: 7, door: { x: 3, w: 1, name: 'home', label: '집', to: 'home.out', unlock: 'home1' } },   // 안은 HOME (원룸) — 새 집을 사면 잠김 (이사)
    { kind: 'back', annex: true, x: 6, y: 0, w: 2, h: 2 },                                                              // 집 바로 옆 틈 — 이상한 게이트가 이 벽 앞에 섬 (사용자 결정)
    { kind: 'shabby', x: 8, y: 0, w: 4, h: 7, door: { x: 9, w: 2, name: 'myguild', label: '빈 건물', to: 'guild.out', unlock: 'guild' } },   // 사들여 내 길드로 키울 곳 (도시 계획 6번 — 1~3단계. 4단계부터는 미래 도시로 옮기고 「옛 사무실」 — 그림은 mapart)
    { kind: 'store', x: 13, y: 0, w: 4, h: 7 },
    { kind: 'back', annex: true, x: 17, y: 0, w: 2, h: 2, door: { x: 17, w: 2, name: 'blackmarket', to: 'bm.out', unlock: 'bm' } },   // 암시장 — 셔터 (이름표 없음). 9격 뒤 · 후드티가 와 있는 회차에만 반쯤 올라감
    { kind: 'villa', x: 19, y: 0, w: 5, h: 7 },                                                                         // 위 줄 오른쪽 끝 — 지도 끝까지
    // 아래 줄
    { kind: 'villa', roof: 'tank', x: 1, y: 12, w: 4, h: 7 }, { kind: 'back', x: 7, y: 12, w: 4, h: 7 }, { kind: 'store', x: 13, y: 12, w: 4, h: 7 },
    { kind: 'villa', x: 19, y: 12, w: 4, h: 7 },
    // 둘레 — 위 끝은 옥상이 지도 맨 위에 닿게, 아래 끝은 옥상만(roofOnly — 4 × 4 정사각형), 오른쪽 가운데는 골목길이 화면 밖으로 이어져 보이게 비움
    { kind: 'back', x: -9, y: -9, w: 4, h: 7 }, { kind: 'villa', x: -4, y: -9, w: 4, h: 7 }, { kind: 'store', x: 1, y: -9, w: 4, h: 7 },
    { kind: 'villa', x: 7, y: -9, w: 4, h: 7 }, { kind: 'back', x: 12, y: -9, w: 4, h: 7 }, { kind: 'store', x: 17, y: -9, w: 4, h: 7 },
    { kind: 'villa', x: 23, y: -9, w: 4, h: 7 }, { kind: 'back', x: 28, y: -9, w: 4, h: 7 },
    { kind: 'store', x: -9, y: 0, w: 4, h: 7 }, { kind: 'villa', x: -9, y: 12, w: 4, h: 7 },
    { kind: 'back', x: 29, y: 0, w: 4, h: 7 }, { kind: 'store', x: 29, y: 12, w: 4, h: 7 },
    { kind: 'villa', roofOnly: true, x: -9, y: 20, w: 4, h: 4 }, { kind: 'back', roofOnly: true, x: -4, y: 20, w: 4, h: 4 }, { kind: 'store', roofOnly: true, x: 1, y: 20, w: 4, h: 4 },
    { kind: 'back', roofOnly: true, x: 7, y: 20, w: 4, h: 4 }, { kind: 'villa', roofOnly: true, x: 12, y: 20, w: 4, h: 4 }, { kind: 'store', roofOnly: true, x: 17, y: 20, w: 4, h: 4 },
    { kind: 'back', roofOnly: true, x: 23, y: 20, w: 4, h: 4 }, { kind: 'villa', roofOnly: true, x: 28, y: 20, w: 4, h: 4 }
  ],
  // 자잘한 것 (사용자 결정 2026-11-18) — 막힌 칸 · 그림은 js/mapart.js 의 clutterSprite. 길을 막아 갇히는 칸이 생기면 뽑을 때 멈춤
  //   car 불법주차한 낡은 차(가로 w2 · 세로 h2 — tone 빛깔) · cone 라바콘 · trash 종량제 봉투 · planter 스티로폼 화분 · scooter 오토바이
  clutter: [
    // 가운데 골목길(y 7 ~ 11)엔 아무것도 두지 않음 — 내가 가는 길 (사용자 결정 2026-11-19 — 차 · 라바콘 · 오토바이를 치움)
    { kind: 'car', x: 17, y: 14, w: 1, h: 2, tone: 3 },
    { kind: 'cone', x: 12, y: 0 }, { kind: 'cone', x: 6, y: 12 },
    { kind: 'trash', x: 18, y: 5 }, { kind: 'trash', x: 0, y: 18 },
    { kind: 'planter', x: 1, y: 6 }, { kind: 'planter', x: 18, y: 18 }
  ],
  trees: [[11, 18]],
  pylons: [],
  start: [3, 7],                                             // 집 문 앞 골목길
  gate: [6, 2],                                              // 이상한 게이트 — 집 바로 옆 틈 (두 칸 폭)
  npcs: [{ x: 12, y: 9, shop: 'exboss0', label: '' }],      // EX — 골목길 한가운데 내려온 외신 (그 차례에만 섬)
  edges: [{ name: 'city', x: 23, y: 8, w: 1, h: 3, to: 'city.oldtown', label: '헌터들의 도시 →', arrive: 'left' }]   // 도착 · 이름표는 골목길 가운데 줄 (y 9)
};
const CITY = {
  title: '헌터들의 도시', base: 'pave',
  w: 46, h: 53, pad: { t: 6, b: 6, l: 9, r: 9 },
  facade: { f: 3, kinds: ['tower'] },                       // 둘레 빌딩만 벽면 3칸 — 옥상이 정사각형
  ground: [
    ['lot', 2, 45, 11, 7], ['lot', 16, 45, 14, 7], ['lot', 33, 45, 11, 7],
    ['plaza', 11, 14, 24, 6],
    ['road', -9, 20, 64, 4], ['road', -9, 38, 64, 4], ['road', 21, 24, 4, 14],
    ['cross', 15, 20, 3, 4], ['cross', 28, 20, 3, 4], ['cross', 21, 24, 4, 2], ['cross', 21, 36, 4, 2], ['cross', 8, 38, 4, 4], ['cross', 31, 38, 3, 4],
    ['lawn', 10, 2, 3, 12], ['lawn', 33, 2, 3, 12], ['lawn', 2, 1, 8, 3], ['lawn', 36, 1, 8, 3],
    ['lawn', 2, 26, 16, 1], ['lawn', 27, 26, 18, 1], ['lawn', 18, 27, 1, 9], ['lawn', 35, 27, 2, 9],
    ['bar', -1, 20, 1, 4], ['bar', 46, 20, 1, 4], ['bar', -1, 38, 1, 4], ['bar', 46, 38, 1, 4]
  ],
  buildings: [
    { kind: 'hq', x: 13, y: 1, w: 20, h: 13, door: { x: 21, w: 4, name: 'association', label: '헌터 협회', to: 'assoc.out' } },   // 안은 ASSOC (1층 로비 — 등록 창구)
    { kind: 'guild', tone: 0, x: 2, y: 5, w: 8, h: 9, door: { x: 5, w: 2, name: 'guild1', label: '홍염 길드', to: 'hongyeom.out' } },
    { kind: 'guild', tone: 1, x: 36, y: 5, w: 8, h: 9, door: { x: 39, w: 2, name: 'guild2', label: '청해 길드', to: 'cheonghae.out' } },
    { kind: 'dept', x: 4, y: 28, w: 12, h: 8, door: { x: 8, w: 4, name: 'dept', label: '헌터백화점', to: 'dept.out' } },   // 안은 DEPT (1층)
    { kind: 'guild', tone: 2, x: 27, y: 27, w: 8, h: 9, door: { x: 30, w: 2, name: 'guild3', label: '크라운 길드', to: 'crown.out' } },
    { kind: 'guild', tone: 3, x: 37, y: 27, w: 8, h: 9, door: { x: 40, w: 2, name: 'guild4', label: '달 길드', to: 'dal.out' } },
    // 가운데 빈터 — 내 길드가 4단계부터 여기에 (사용자 결정 2026-11-19). 그 전엔 빈터 그대로 (overLot — 겉모습은 빈터, 그림은 mapart 가 길드 단계대로)
    { kind: 'mineCity', overLot: true, f: 4, x: 16, y: 45, w: 14, h: 7, door: { x: 21, w: 4, name: 'myguild2', label: '', to: 'guild2.out', unlock: 'guildCity' } },
    // 오른쪽 빈터 — 새 집 (고급 아파트, 사용자 결정 2026-11-19). 사기 전엔 빈터 그대로 · 「분양」 (overLot — 그림은 mapart 가 산 뒤에 아파트로)
    { kind: 'aptCity', overLot: true, f: 4, x: 33, y: 45, w: 11, h: 7, door: { x: 37, w: 3, name: 'home2', label: '', to: 'home2.out', unlock: 'home2' } },
    // 둘레 — 걷지 못하는 곳의 빌딩들 (왼쪽 둘째 길 아래는 옛 동네로 가는 보도가 이어져 보이게 비움)
    // 둘레 빌딩 — 양옆만 (위아래 끝의 빌딩은 없앰 — 사용자 결정 2026-11-18). 옥상이 정사각형(가로 4칸 · 깊이 7칸 · 벽면 3칸 — facade), 지도 가장자리까지
    { kind: 'tower', tone: 0, x: -9, y: 2, w: 4, h: 7 }, { kind: 'tower', tone: 1, x: -9, y: 10, w: 4, h: 7 }, { kind: 'tower', tone: 2, x: -9, y: 26, w: 4, h: 7 },
    { kind: 'tower', tone: 0, x: -9, y: 42, w: 4, h: 7 }, { kind: 'tower', tone: 1, x: 51, y: 2, w: 4, h: 7 }, { kind: 'tower', tone: 2, x: 51, y: 10, w: 4, h: 7 },
    { kind: 'tower', tone: 0, x: 51, y: 26, w: 4, h: 7 }, { kind: 'tower', tone: 1, x: 51, y: 42, w: 4, h: 7 }
  ],
  trees: [[11, 3], [11, 6], [11, 9], [11, 12], [34, 3], [34, 6], [34, 9], [34, 12], [3, 2], [7, 2], [38, 2], [42, 2],
          [4, 26], [9, 26], [14, 26], [29, 26], [34, 26], [39, 26], [43, 26], [18, 29], [18, 33], [35, 30], [36, 33]],
  pylons: [[14, 15], [31, 15], [19, 19], [26, 19], [1, 24], [44, 24], [19, 37], [26, 37], [44, 43], [14, 48], [31, 48]],
  // 보도의 자잘한 것 (2026-11-18) — 버스 정류장 · 자판기 · 홀로그램 안내판 · 벤치 · 분리수거함 · 볼라드 · 전기자전거 (막힌 칸 — 그림은 mapart.js 의 clutterSprite)
  clutter: [
    { kind: 'bus', x: 6, y: 24, w: 3, h: 1 }, { kind: 'bus', x: 36, y: 42, w: 3, h: 1 },
    // 자판기 — 길을 막지 않게 건물 · 가림막에 붙여 (사용자 결정 2026-11-19): 백화점 오른쪽 벽 · 오른쪽 빈터 가림막 앞
    { kind: 'vend', x: 16, y: 34, tone: 0 }, { kind: 'vend', x: 16, y: 35, tone: 2 }, { kind: 'vend', x: 34, y: 44, tone: 1 },
    { kind: 'holo', x: 15, y: 17 }, { kind: 'holo', x: 30, y: 17 },
    { kind: 'bench', x: 17, y: 18, w: 2, h: 1 }, { kind: 'bench', x: 27, y: 18, w: 2, h: 1 }, { kind: 'bench', x: 10, y: 24, w: 2, h: 1 },
    { kind: 'bin', x: 20, y: 36 }, { kind: 'bin', x: 45, y: 36 },
    { kind: 'bollard', x: 19, y: 24 }, { kind: 'bollard', x: 26, y: 24 },
    { kind: 'bikes', x: 3, y: 43, w: 2, h: 1, tone: 1 }
  ],
  start: [1, 43],                                            // 옛 동네에서 넘어와 서는 곳 곁
  crisis: [22, 16],                                          // 광장 한가운데 — 위기 게이트 (SS급 이야기 · 협회장의 부탁을 받은 회차에만 나타남)
  npcs: [{ x: 22, y: 15, shop: 'exboss1', label: '' }],     // EX — 광장에 내려온 외신 (그 차례에만 섬 · game.js 의 deskHere)
  edges: [{ name: 'oldtown', x: 0, y: 42, w: 1, h: 3, to: 'oldtown.city', label: '← 옛 동네', arrive: 'right' }]
};
function townMap(C, name) {
  const PD = C.pad, W = C.w + PD.l + PD.r, H = C.h + PD.t + PD.b;
  const GROUND = { road: [FLOOR, OL.DIRT], cross: [FLOOR, OL.COBBLE], plaza: [FLOOR, OL.TILES], lawn: [FLOOR, OL.GRASS], pave: [FLOOR, OL.PAVE], old: [FLOOR, OL.ROCKY], lot: [WALL, OL.SNOW], bar: [WALL, OL.DIRT] };
  const tiles = new Uint8Array(W * H).fill(FLOOR), lk = new Uint8Array(W * H).fill(look(GROUND[C.base][1], CITY_BIO));
  const at = (x, y) => (y + PD.t) * W + x + PD.l, onMap = (x, y) => x + PD.l >= 0 && y + PD.t >= 0 && x + PD.l < W && y + PD.t < H;
  const inWalk = (x, y) => x >= 0 && y >= 0 && x < C.w && y < C.h;
  const each = (x, y, w, h, fn) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (onMap(i, j)) fn(at(i, j), i, j); };
  for (const [kind, x, y, w, h] of C.ground) {
    if (!GROUND[kind]) throw new Error(`${name} — 모르는 땅 「${kind}」`);
    each(x, y, w, h, k => { tiles[k] = GROUND[kind][0]; lk[k] = look(GROUND[kind][1], CITY_BIO); });
  }
  // 건물 — 서로 겹치지 않고, 붙지도 않게 (골목 끝의 덧붙인 채만 빼고)
  const owner = new Int16Array(W * H).fill(-1), ports = [], blds = [];
  const vNext = {};
  C.buildings.forEach((b, i) => {
    each(b.x, b.y, b.w, b.h, (k, x, y) => {
      if (owner[k] >= 0) throw new Error(`${name} — 건물 ${owner[k]} 와 ${i} 가 (${x}, ${y}) 에서 겹침`);
      owner[k] = i; tiles[k] = WALL;
      if (!b.overLot) lk[k] = look(BUILD, CITY_BIO);                                // overLot — 겉모습은 그 땅(빈터) 그대로, 그림이 때가 되면 건물로
    });
    const x0 = Math.max(0, b.x + PD.l), y0 = Math.max(0, b.y + PD.t), x1 = Math.min(W, b.x + PD.l + b.w), y1 = Math.min(H, b.y + PD.t + b.h);
    const v = b.v !== undefined ? b.v : (vNext[b.kind] = (vNext[b.kind] || 0) + 1) - 1;   // 생김새 번호 — 종류마다 차례로 (같은 지도의 건물이 모두 다르게)
    const f = b.f !== undefined ? b.f : C.facade && !b.annex && !b.roofOnly && (!C.facade.kinds || C.facade.kinds.includes(b.kind)) ? C.facade.f : undefined;   // 벽면 높이(칸)
    blds.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0, kind: b.kind, roof: b.roof, tone: b.tone, v, ...(b.roofOnly ? { roofOnly: true } : {}), ...(f !== undefined ? { f } : {}), ...(b.overLot ? { overLot: true } : {}) });
    if (b.door) {
      if (b.door.x < b.x || b.door.x + b.door.w > b.x + b.w) throw new Error(`${name} — ${b.door.name} 문이 건물 밖`);
      ports.push({ name: b.door.name, label: b.door.label, x: b.door.x + PD.l, y: b.y + PD.t + b.h - 1, w: b.door.w, h: 1, door: true, ...(b.door.to ? { to: b.door.to } : {}), ...(b.door.unlock ? { unlock: b.door.unlock } : {}) });   // to 가 없으면 닫힌 문 · unlock 이 있으면 게임이 열렸는지 봄
      if (b.door.to) for (let i = 0; i < b.door.w; i++) {
        tiles[at(b.door.x + i, b.y + b.h - 1)] = FLOOR;                             // 열린 문 — 문 칸으로 걸어 들어감 (겉모습은 건물 그대로)
        if (b.overLot) lk[at(b.door.x + i, b.y + b.h - 1)] = look(OL.PAVE, CITY_BIO);   // 빈터 위의 문 자리 — 그 전엔 가림막 틈(보도)
      }
    }
  });
  C.buildings.forEach((b, i) => each(b.x - 1, b.y - 1, b.w + 2, b.h + 2, (k, x, y) => {
    const o = owner[k];
    if (o >= 0 && o !== i && !b.annex && !C.buildings[o].annex && (x >= b.x && x < b.x + b.w || y >= b.y && y < b.y + b.h))
      throw new Error(`${name} — 건물 ${i}(${b.kind}) 와 ${o}(${C.buildings[o].kind}) 가 (${x}, ${y}) 에서 붙음`);
  }));
  // 자잘한 것 — 걷는 곳의 맨땅에만, 막힌 칸으로 (겉모습은 바닥 그대로)
  const clutter = [];
  for (const c of C.clutter || []) {
    const w = c.w || 1, h = c.h || 1;
    each(c.x, c.y, w, h, (k, x, y) => {
      if (!inWalk(x, y) || tiles[k] !== FLOOR || ROADISH_LOOK(lk[k])) throw new Error(`${name} — ${c.kind} (${x}, ${y}) 자리가 걷는 곳의 맨땅이 아님`);
      tiles[k] = WALL;
    });
    clutter.push({ kind: c.kind, x: c.x + PD.l, y: c.y + PD.t, w, h, tone: c.tone || 0 });
  }
  for (const [list, tile, what] of [[C.trees, TREE, '나무'], [C.pylons, ROCK, '기둥']]) for (const [x, y] of list) {
    const k = at(x, y);
    if (!onMap(x, y) || tiles[k] !== FLOOR || ROADISH_LOOK(lk[k])) throw new Error(`${name} — ${what} (${x}, ${y}) 자리가 맨땅이 아님`);
    tiles[k] = tile;
  }
  const [sx, sy] = C.start, spots = [[sx, sy, '시작점']];
  if (C.gate) spots.push([C.gate[0], C.gate[1], '게이트'], [C.gate[0] + 1, C.gate[1], '게이트']);
  for (const e of C.edges) for (let j = 0; j < e.h; j++) for (let i = 0; i < e.w; i++) spots.push([e.x + i, e.y + j, `${e.name} 통로`]);
  for (const [x, y, what] of spots) if (!inWalk(x, y) || tiles[at(x, y)] !== FLOOR) throw new Error(`${name} — ${what} (${x}, ${y}) 이(가) 걷는 곳의 맨땅이 아님`);
  for (const p of ports) if (!p.edge) for (let i = 0; i < p.w; i++) if (tiles[(p.y + 1) * W + p.x + i] !== FLOOR) throw new Error(`${name} — ${p.name} 문 앞이 막힘`);
  // 걷는 곳의 맨땅은 모두 시작점에서 걸어서 닿아야 함 (자잘한 것 · 나무가 틈을 막아 갇힌 칸이 생기지 않게)
  {
    const seen = new Uint8Array(W * H), q = [at(sx, sy)], open = k => tiles[k] === FLOOR;
    seen[q[0]] = 1;
    for (let n = 0; n < q.length; n++) {
      const k = q[n], x = (k % W) - PD.l, y = ((k / W) | 0) - PD.t;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (!inWalk(x + dx, y + dy)) continue;
        const j = at(x + dx, y + dy);
        if (!seen[j] && open(j)) { seen[j] = 1; q.push(j); }
      }
    }
    for (let y = 0; y < C.h; y++) for (let x = 0; x < C.w; x++) if (open(at(x, y)) && !seen[at(x, y)]) throw new Error(`${name} — (${x}, ${y}) 에 걸어서 못 감`);
  }
  // 건물을 당겨 길을 좁힘 (사용자 결정 2026-11-19) — 뒤(북쪽) 두 줄이 걷는 맨땅인 건물은 옥상을 한 칸 그 위로 늘림 (over).
  // 그 칸은 그대로 걸을 수 있고, 그림은 나보다 위에 그려 지나갈 때만 반투명 (mapart 의 drawOver). 벽면도 한 칸 높여(f + 1) 옥상은 정사각형 그대로
  const busy = new Set();
  for (const p of ports) for (let j = 0; j < (p.h || 1); j++) for (let i = 0; i < p.w; i++) busy.add((p.y + j) * W + p.x + i);
  for (const [x, y] of spots) busy.add(at(x, y));
  C.buildings.forEach((b, i) => {
    if (b.annex || b.roofOnly || b.overLot || b.noOver) return;
    let ok = true;
    for (let x = b.x; x < b.x + b.w && ok; x++) {                                  // 바로 뒤 줄은 빈 맨땅, 그 뒤 줄은 건물만 아니면 (길이 한 줄은 보이게)
      const k = at(x, b.y - 1), k2 = at(x, b.y - 2);
      if (!inWalk(x, b.y - 2) || tiles[k] !== FLOOR || owner[k] >= 0 || busy.has(k) || owner[k2] >= 0) ok = false;
    }
    if (!ok) return;
    const B = blds[i];
    B.y -= 1; B.h += 1; B.over = 1;
    if (B.f !== undefined) B.f += 1;
  });
  // 이상한 게이트 — 나에게만 보임 (그림은 mapview 의 rift). 들어가면 지하수로 첫 공간의 같은 게이트 앞
  // 광장 위기 게이트 (SS급 이야기 — 사용자 결정 2026-11-19) — 열리기 전엔 없는 문(appears), 그림은 이상한 게이트를 크게(big)
  if (C.crisis) ports.push({ name: 'crisis', label: '위기 게이트', x: C.crisis[0] + PD.l, y: C.crisis[1] + PD.t, w: 2, h: 1, to: 'raid.out', rift: true, appears: true, big: true, unlock: 'crisis' });
  if (C.gate) ports.push({ name: 'gate', x: C.gate[0] + PD.l, y: C.gate[1] + PD.t, w: 2, h: 1, to: 'sewer.city', rift: true, unlock: 'portalOld' });   // 길잡이가 새 집 안으로 옮기면 닫힘
  // 지도 가장자리 통로 — 그리지 않고 이름표만 (mapview 의 edge). 넘어가면 그 지도의 같은 이름 통로 안쪽(arrive 쪽)에 섬
  // 통로는 그 가장자리 한 줄 전체(위 끝 ~ 아래 끝) — 화면 끝 어느 줄에 닿아도 넘어감 (사용자 결정 2026-11-19). 도착하는 줄 · 이름표는 적어 둔 자리(e.y ~ e.h)의 가운데
  for (const e of C.edges) ports.push({ name: e.name, label: e.label, x: e.x + PD.l, y: PD.t, w: e.w, h: C.h, to: e.to, edge: true, arrive: e.arrive, arriveY: e.y + PD.t + (e.h >> 1) });
  const townNpcs = (C.npcs || []).map(n => {                                    // 때가 되어야 서는 사람 — 걷는 곳의 맨땅에만 (그 전엔 그냥 땅)
    if (!inWalk(n.x, n.y) || tiles[at(n.x, n.y)] !== FLOOR) throw new Error(`${name} — 사람 (${n.x}, ${n.y}) 자리가 빈 땅이 아님`);
    return { name: 'clerk', x: n.x + PD.l, y: n.y + PD.t, shop: n.shop, label: n.label };
  });
  return buildTmj({ w: W, h: H, tiles, look: lk, ports, npcs: [{ name: 'start', x: sx + PD.l, y: sy + PD.t }, ...townNpcs],
    props: { title: C.title, city: true, walk: `${PD.l},${PD.t},${C.w},${C.h}`, blds: JSON.stringify(blds), ...(clutter.length ? { clutter: JSON.stringify(clutter) } : {}) } });
}
const oldtown = () => townMap(OLDTOWN, '옛 동네');
const city = () => townMap(CITY, '도시');
const ROADISH_LOOK = c => (c & 15) === OL.DIRT || (c & 15) === OL.COBBLE;

// ---------- 헌터백화점 안 — 1층 (docs/CITY-PLAN.md 1-나) ----------
// 위 벽(세 칸 높이)에 왼쪽부터 무기 진열 벽 · 2층으로 가는 에스컬레이터 · 핵 창구(가져온 핵을 돈으로). 그 바로 앞줄에 계산대(가운데 빈 칸에 점원) · 막아 둔 줄.
// 가운데 통로(어두운 돌 띠) 양옆으로 유리 진열장이 두 줄씩. 아래 벽 가운데가 도시로 나가는 문.
// 칸은 바닥 기준 (왼쪽 위가 0, 0). 가구는 막힌 칸 — 지도 속성 blds 의 네모(kind)로 넘겨 그림은 mapart 의 storeProp 이, 위 벽 무늬는 속성 wall 로 storeWall 이.
// 점원은 npc 층의 점 (shop = 매장 이름 — data.js 의 DEPT_SECTIONS). 닿으면 상점 창 (map.js 의 shop 사건)
const DEPT = {
  title: '헌터백화점 1층', w: 21, h: 12, to: 'city.dept',
  wall: [{ x: 1, w: 7, kind: 'rack' }, { x: 9, w: 3, kind: 'esc' }, { x: 13, w: 7, kind: 'mats' }],
  props: [
    { kind: 'counter', x: 1, y: 0, w: 3 }, { kind: 'counter', x: 5, y: 0, w: 3 },          // 무기 매장 계산대 — 사이 (4, 0) 에 점원
    { kind: 'counter', x: 13, y: 0, w: 3 }, { kind: 'counter', x: 17, y: 0, w: 3 },        // 핵 창구 계산대 — 사이 (16, 0) 에 점원
    { kind: 'plant', x: 8, y: 0, w: 1 }, { kind: 'plant', x: 12, y: 0, w: 1 }, { kind: 'plant', x: 0, y: 11, w: 1 }, { kind: 'plant', x: 20, y: 11, w: 1 },
    { kind: 'case', x: 1, y: 3, w: 2, tone: 0 }, { kind: 'case', x: 5, y: 3, w: 2, tone: 1 }, { kind: 'case', x: 1, y: 6, w: 2, tone: 2 }, { kind: 'case', x: 5, y: 6, w: 2, tone: 3 },
    { kind: 'case', x: 14, y: 3, w: 2, tone: 4 }, { kind: 'case', x: 18, y: 3, w: 2, tone: 5 }, { kind: 'case', x: 14, y: 6, w: 2, tone: 6 }, { kind: 'case', x: 18, y: 6, w: 2, tone: 7 },
    { kind: 'bench', x: 3, y: 9, w: 3 }, { kind: 'bench', x: 15, y: 9, w: 3 }
  ],
  clerks: [{ x: 4, y: 0, shop: 'weapon', label: '무기 매장' }, { x: 16, y: 0, shop: 'mats', label: '핵 창구' }],
  signs: [],
  // 에스컬레이터 앞 — 2층 방어구 매장으로 (제1격 보스를 꺾기 전에는 잠김 · 줄이 쳐짐 — ui 의 portOpen · mapview 가 줄을 그림)
  links: [{ name: 'up', x: 9, y: 0, w: 3, to: 'dept2.out', label: '2층 방어구 매장', unlock: 'armor' }]
};
// ---------- 헌터백화점 2층 — 방어구 매장 (도시 계획 2번) ----------
// 위 벽에 방어구 진열 벽 · 큰 거울 · 방어구 진열 벽. 가운데 계산대 사이에 점원. 아래 가운데가 1층으로 내려가는 에스컬레이터(나가는 문 자리)
const DEPT2 = {
  title: '헌터백화점 2층', w: 21, h: 12, to: 'dept.up', outLabel: '1층으로',
  wall: [{ x: 1, w: 7, kind: 'armor' }, { x: 8, w: 5, kind: 'mirror' }, { x: 13, w: 7, kind: 'armor' }],
  props: [
    { kind: 'counter', x: 7, y: 0, w: 3 }, { kind: 'counter', x: 11, y: 0, w: 3 },         // 계산대 — 사이 (10, 0) 에 점원
    { kind: 'plant', x: 0, y: 0, w: 1 }, { kind: 'plant', x: 20, y: 0, w: 1 }, { kind: 'plant', x: 0, y: 11, w: 1 }, { kind: 'plant', x: 20, y: 11, w: 1 },
    { kind: 'case', x: 1, y: 3, w: 2, tone: 1 }, { kind: 'case', x: 5, y: 3, w: 2, tone: 5 }, { kind: 'case', x: 1, y: 6, w: 2, tone: 3 }, { kind: 'case', x: 5, y: 6, w: 2, tone: 7 },
    { kind: 'case', x: 14, y: 3, w: 2, tone: 4 }, { kind: 'case', x: 18, y: 3, w: 2, tone: 6 }, { kind: 'case', x: 14, y: 6, w: 2, tone: 2 }, { kind: 'case', x: 18, y: 6, w: 2, tone: 0 },
    { kind: 'bench', x: 3, y: 9, w: 3 }, { kind: 'bench', x: 15, y: 9, w: 3 }
  ],
  clerks: [{ x: 10, y: 0, shop: 'armor', label: '방어구 매장' }],
  signs: []
};
const dept2Interior = () => storeInterior(DEPT2);
function storeInterior(D, data) {
  const TOP = 3, SIDE = 2, BOTTOM = 2, AISLE = 3;
  const W = D.w + SIDE * 2, H = TOP + D.h + BOTTOM, cx = W >> 1;
  if (D.w % 2 === 0) throw new Error(`${D.title} — 바닥 폭은 홀수여야 통로가 가운데에 맞음`);
  const tiles = new Uint8Array(W * H).fill(WALL), lk = new Uint8Array(W * H).fill(look(OL.TILES, CITY_BIO));
  const at = (x, y) => (y + TOP) * W + x + SIDE, inFloor = (x, y) => x >= 0 && y >= 0 && x < D.w && y < D.h;
  for (let y = 0; y < D.h; y++) for (let x = 0; x < D.w; x++) tiles[at(x, y)] = FLOOR;
  const a0 = cx - SIDE - (AISLE >> 1);                                                      // 통로의 왼쪽 칸 (바닥 기준)
  for (let y = 1; y < D.h; y++) for (let x = a0; x < a0 + AISLE; x++) lk[at(x, y)] = look(OL.PAVE, CITY_BIO);
  // 가구 — 바닥 안, 서로 안 겹치게, 통로를 막지 않게
  const blds = [];
  for (const p of D.props) {
    const w = p.w || 1, h = p.h || 1;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const x = p.x + i, y = p.y + j;
      if (!inFloor(x, y) || tiles[at(x, y)] !== FLOOR) throw new Error(`${D.title} — ${p.kind} (${x}, ${y}) 자리가 빈 바닥이 아님`);
      if (y > 0 && x >= a0 && x < a0 + AISLE) throw new Error(`${D.title} — ${p.kind} (${x}, ${y}) 이(가) 가운데 통로를 막음`);
      tiles[at(x, y)] = WALL; lk[at(x, y)] = look(BUILD, CITY_BIO);
    }
    blds.push({ x: p.x + SIDE, y: p.y + TOP, w, h, kind: p.kind, tone: p.tone });
  }
  // 나가는 문 — 아래 벽 첫 줄 가운데, 통로와 같은 폭
  const out = { name: 'out', label: D.outLabel || '나가기', x: cx - (AISLE >> 1), y: TOP + D.h, w: AISLE, h: 1, to: D.to, door: true };
  for (let i = 0; i < out.w; i++) { tiles[out.y * W + out.x + i] = FLOOR; lk[out.y * W + out.x + i] = look(DOORWAY, CITY_BIO); }
  const ports = [out];
  for (const s of D.signs) ports.push({ name: s.name, label: s.label, x: s.x + SIDE, y: s.y + TOP, w: s.w, h: 1, door: true });   // 이름표만 — 들어갈 수 없음 (to 없음)
  // 안쪽 문 — 바닥 칸 위에 선 문 (에스컬레이터 앞 등). unlock 이 있으면 게임이 열렸는지 봄 (닫히면 벽처럼)
  for (const l of D.links || []) {
    for (let i = 0; i < l.w; i++) if (!inFloor(l.x + i, l.y) || tiles[at(l.x + i, l.y)] !== FLOOR) throw new Error(`${D.title} — ${l.name} 문 자리가 빈 바닥이 아님`);
    ports.push({ name: l.name, label: l.label, x: l.x + SIDE, y: l.y + TOP, w: l.w, h: 1, to: l.to, ...(l.rift ? { rift: true } : { door: true }), ...(l.unlock ? { unlock: l.unlock } : {}) });
  }
  const start = { name: 'start', x: out.x + (out.w >> 1), y: out.y - 1 };
  const npcs = [start];
  // 안에 서 있는 적 (마녀의 오두막) — 빈 바닥 위, 닿으면 싸움. 칸은 걸을 수 있는 그대로 (성 안 보스처럼)
  const posts = (D.foes || []).map(f => {
    const e = data.ENEMIES.find(q => q.name === f.name);
    if (!e) throw new Error(`${D.title} — ${f.name} 이(가) 없음`);
    for (let j = 0; j < e.size; j++) for (let i = 0; i < e.size; i++) if (!inFloor(f.x + i, f.y + j) || tiles[at(f.x + i, f.y + j)] !== FLOOR) throw new Error(`${D.title} — ${f.name} 자리가 빈 바닥이 아님`);
    return { name: e.name, x: f.x + SIDE, y: f.y + TOP, w: e.size, h: e.size, enemy: e.id, blocks: false };
  });
  (D.seats || []).forEach((s, i) => {                                               // 사무 자리 — 막지 않는 빈 바닥 (지도엔 앉은 동료만 그림)
    if (!inFloor(s.x, s.y) || tiles[at(s.x, s.y)] !== FLOOR) throw new Error(`${D.title} — 자리 (${s.x}, ${s.y}) 가 빈 바닥이 아님`);
    npcs.push({ name: 'seat', x: s.x + SIDE, y: s.y + TOP, seat: i });
  });
  for (const c of D.clerks) {
    if (!inFloor(c.x, c.y) || tiles[at(c.x, c.y)] !== FLOOR) throw new Error(`${D.title} — 점원 (${c.x}, ${c.y}) 자리가 빈 바닥이 아님`);
    npcs.push({ name: 'clerk', x: c.x + SIDE, y: c.y + TOP, shop: c.shop, label: c.label });
  }
  // 들어선 자리에서 걸어서 — 모든 빈 바닥에 닿고(갇힌 칸 없음), 점원마다 곁에 설 수 있어야 함 (점원 칸은 막힌 칸)
  const blocked = new Set(D.clerks.map(c => at(c.x, c.y))), seen = new Uint8Array(W * H), q = [start.y * W + start.x];
  seen[q[0]] = 1;
  for (let n = 0; n < q.length; n++) for (const d of [1, -1, W, -W]) {
    const j = q[n] + d;
    if (j < 0 || j >= W * H || seen[j] || tiles[j] !== FLOOR || blocked.has(j) || (Math.abs(d) === 1 && ((j / W) | 0) !== ((q[n] / W) | 0))) continue;
    seen[j] = 1; q.push(j);
  }
  for (let y = 0; y < D.h; y++) for (let x = 0; x < D.w; x++) if (tiles[at(x, y)] === FLOOR && !blocked.has(at(x, y)) && !seen[at(x, y)]) throw new Error(`${D.title} — (${x}, ${y}) 에 걸어서 못 감`);
  for (const c of D.clerks) if (![1, -1, W, -W].some(d => seen[at(c.x, c.y) + d])) throw new Error(`${D.title} — 점원 (${c.x}, ${c.y}) 곁에 설 자리가 없음`);
  return buildTmj({ w: W, h: H, tiles, look: lk, ports, npcs, posts,
    props: { title: D.title, interior: true, store: true, ...(D.wild ? { wild: true } : {}), ...(D.theme ? { theme: D.theme } : {}), blds: JSON.stringify(blds), wall: JSON.stringify(D.wall.map(s => ({ x: s.x + SIDE, w: s.w, kind: s.kind }))) } });
}

const deptInterior = () => storeInterior(DEPT);

// ---------- 헌터 협회 안 — 1층 로비 (docs/CITY-PLAN.md 3) ----------
// 위 벽에 왼쪽부터 의뢰 게시판 · 협회 문장 · 의뢰 게시판. 그 앞줄 가운데에 등록 창구(계산대 둘 사이에 직원), 양옆으로 화분 · 기다리는 긴 의자.
// 가게 안과 같은 틀(storeInterior)에 빛깔만 협회(theme 'hq' — 남색 · 청록 · 은빛, 그림은 js/mapart.js 의 STC_HQ)
// 2026-11-19 — 훨씬 넓게 (사용자 결정: 가로 · 세로 2배쯤 — 17×10 → 33×20). 도시에서 가장 큰 건물답게
// 위 벽: 의뢰 게시판 · 게이트 현황판 · 문장 · 게이트 현황판 · 의뢰 게시판. 창구 셋은 위 벽에 넓게 (동료 모집 · 등록 · 게이트).
// 가운데 깔개 양옆으로 기둥 두 줄, 그 바깥에 긴 의자, 들어오는 곳 양옆에 번호표 단말.
const ASSOC = {
  title: '헌터 협회 1층', w: 33, h: 20, to: 'city.association', theme: 'hq',
  wall: [{ x: 1, w: 7, kind: 'board' }, { x: 9, w: 5, kind: 'screen' }, { x: 14, w: 5, kind: 'crest' }, { x: 19, w: 5, kind: 'screen' }, { x: 25, w: 7, kind: 'board' }],
  props: [
    { kind: 'counter', x: 13, y: 0, w: 3 }, { kind: 'counter', x: 17, y: 0, w: 3 },        // 등록 창구 계산대 — 사이 (16, 0) 에 직원
    { kind: 'counter', x: 2, y: 0, w: 3 }, { kind: 'counter', x: 6, y: 0, w: 3 },          // 동료 모집 — 사이 (5, 0)
    { kind: 'counter', x: 24, y: 0, w: 3 }, { kind: 'counter', x: 28, y: 0, w: 3 },        // 게이트 창구 — 사이 (27, 0)
    { kind: 'plant', x: 0, y: 0, w: 1 }, { kind: 'plant', x: 32, y: 0, w: 1 }, { kind: 'plant', x: 10, y: 0, w: 1 }, { kind: 'plant', x: 22, y: 0, w: 1 },
    { kind: 'plant', x: 0, y: 19, w: 1 }, { kind: 'plant', x: 32, y: 19, w: 1 },
    { kind: 'pillar', x: 12, y: 4 }, { kind: 'pillar', x: 20, y: 4 }, { kind: 'pillar', x: 12, y: 9 }, { kind: 'pillar', x: 20, y: 9 }, { kind: 'pillar', x: 12, y: 14 }, { kind: 'pillar', x: 20, y: 14 },
    { kind: 'bench', x: 2, y: 5, w: 4 }, { kind: 'bench', x: 7, y: 5, w: 3 }, { kind: 'bench', x: 2, y: 10, w: 4 }, { kind: 'bench', x: 7, y: 10, w: 3 }, { kind: 'bench', x: 2, y: 15, w: 4 },
    { kind: 'bench', x: 23, y: 5, w: 3 }, { kind: 'bench', x: 27, y: 5, w: 4 }, { kind: 'bench', x: 23, y: 10, w: 3 }, { kind: 'bench', x: 27, y: 10, w: 4 }, { kind: 'bench', x: 27, y: 15, w: 4 },
    { kind: 'kiosk', x: 13, y: 18 }, { kind: 'kiosk', x: 19, y: 18 },
    { kind: 'kiosk', x: 8, y: 14 },                                                        // 길드 순위판 — 앞 (8, 15)
    { kind: 'counter', x: 22, y: 15, w: 2 }, { kind: 'counter', x: 25, y: 15, w: 2 }      // 게이트 찾기 — 사이 (24, 15)
  ],
  clerks: [{ x: 8, y: 15, shop: 'ranking', label: '길드 순위' }, { x: 24, y: 15, shop: 'gatefind', label: '게이트 찾기' }, { x: 16, y: 0, shop: 'assoc', label: '등록 창구' }, { x: 26, y: 4, shop: 'ally', label: '???' },   // ??? — 제4격 보스 뒤에만 서 있는 사람 (첫 동료)
           { x: 5, y: 0, shop: 'hire', label: '동료 모집' }, { x: 27, y: 0, shop: 'gate', label: '게이트 창구' }],   // 제5격 보스 뒤에 열림 (game.js 의 deskHere)
  signs: [],
  // 등록 창구 왼쪽 — 시험장 문 (시험 중에만 열림 · 들어가는 건 등록 창구의 「시험을 본다」로 — ui 의 enterArena)
  links: [{ name: 'arena', x: 11, y: 0, w: 2, to: 'arena.out', label: '시험장', unlock: 'arena' },
          { name: 'gatein', x: 20, y: 0, w: 2, to: 'gatein.out', label: '게이트', unlock: 'gatein' },
          { name: 'chief', x: 31, y: 0, w: 1, to: 'chief.out', label: '협회장실', unlock: 'chief' }]   // 협회장실 — S급 + 제14격 보스 뒤 (SS급 이야기)   // 게이트 찾기에서 고른 게이트 — 그때만 열림 (ui 의 enterFoundGate)
};
// ---------- 게이트 안 (게이트 찾기 — 사용자 결정 2026-11-19) — 어둑한 굴, 안쪽 끝에 게이트 보스 ----------
const GATEIN = {
  title: '게이트 안', w: 11, h: 9, to: 'assoc.gatein', theme: 'gate', outLabel: '협회로',
  wall: [],
  props: [
    { kind: 'pillar', x: 1, y: 1 }, { kind: 'pillar', x: 9, y: 1 }, { kind: 'pillar', x: 1, y: 5 }, { kind: 'pillar', x: 9, y: 5 },
    { kind: 'plant', x: 0, y: 8, w: 1 }, { kind: 'plant', x: 10, y: 8, w: 1 }
  ],
  clerks: [{ x: 5, y: 1, shop: 'gateboss', label: '보스' }],
  signs: []
};
const gateinInterior = () => storeInterior(GATEIN);
// ---------- 협회장실 (SS급 이야기 — 사용자 결정 2026-11-19) — 위 벽에 문장, 큰 책상 뒤 협회장, 양옆에 4대 길드 S급 넷 ----------
const CHIEF = {
  title: '헌터 협회 · 협회장실', w: 11, h: 7, to: 'assoc.chief', theme: 'hq', outLabel: '로비로',
  wall: [{ x: 0, w: 3, kind: 'board' }, { x: 3, w: 5, kind: 'crest' }, { x: 8, w: 3, kind: 'board' }],
  props: [
    { kind: 'counter', x: 3, y: 0, w: 2 }, { kind: 'counter', x: 6, y: 0, w: 2 },        // 협회장 책상 — 사이 (5, 0)
    { kind: 'plant', x: 0, y: 0, w: 1 }, { kind: 'plant', x: 10, y: 0, w: 1 },
    { kind: 'bench', x: 0, y: 5, w: 2 }, { kind: 'bench', x: 9, y: 5, w: 2 }
  ],
  clerks: [{ x: 5, y: 0, shop: 'chief', label: '협회장' },
           { x: 1, y: 2, shop: 'chiefS0', label: '' }, { x: 2, y: 4, shop: 'chiefS1', label: '' }, { x: 8, y: 4, shop: 'chiefS2', label: '' }, { x: 9, y: 2, shop: 'chiefS3', label: '' }],
  signs: []
};
const chiefInterior = () => storeInterior(CHIEF);
// ---------- 광장 게이트 안 (SS급 이야기) — 검붉은 굴. 안쪽 끝에 보스, 그 앞에 S급 넷(밀려나면 벽 쪽 자리로) ----------
const RAID = {
  title: '광장 게이트 안', w: 15, h: 11, to: 'city.crisis', theme: 'raid', outLabel: '광장으로',
  wall: [],
  props: [
    { kind: 'pillar', x: 2, y: 2 }, { kind: 'pillar', x: 12, y: 2 }, { kind: 'pillar', x: 2, y: 7 }, { kind: 'pillar', x: 12, y: 7 },
    { kind: 'plant', x: 0, y: 10, w: 1 }, { kind: 'plant', x: 14, y: 10, w: 1 }
  ],
  clerks: [{ x: 7, y: 1, shop: 'raidboss', label: '보스' },
           { x: 3, y: 5, shop: 'raidS0', label: '' }, { x: 5, y: 3, shop: 'raidS1', label: '' }, { x: 9, y: 3, shop: 'raidS2', label: '' }, { x: 11, y: 5, shop: 'raidS3', label: '' },
           { x: 0, y: 3, shop: 'raidD0', label: '' }, { x: 1, y: 8, shop: 'raidD1', label: '' }, { x: 13, y: 8, shop: 'raidD2', label: '' }, { x: 14, y: 3, shop: 'raidD3', label: '' }],
  signs: []
};
const raidInterior = () => storeInterior(RAID);
// ---------- 세계의 게이트 안 (SSS 이야기 — 사용자 결정 2026-11-19) — 뉴욕 · 파리 · 카이로. 안쪽 끝에 보스 하나, 나가면 협회 로비(협회장실 문 앞) ----------
const worldGate = (title, theme, to = 'assoc.chief', outLabel = '협회로', plants = true) => ({
  title, w: 13, h: 9, to, theme, outLabel,
  wall: [],
  props: [
    { kind: 'pillar', x: 2, y: 2 }, { kind: 'pillar', x: 10, y: 2 }, { kind: 'pillar', x: 2, y: 6 }, { kind: 'pillar', x: 10, y: 6 },
    ...(plants ? [{ kind: 'plant', x: 0, y: 8, w: 1 }, { kind: 'plant', x: 12, y: 8, w: 1 }] : [])
  ],
  clerks: [{ x: 6, y: 1, shop: 'raidboss', label: '보스' }],
  signs: []
});
const W1 = worldGate('뉴욕 게이트 안', 'gate'), W2 = worldGate('파리 게이트 안', 'raid'), W3 = worldGate('카이로 게이트 안', 'sand');
const SKY = worldGate('하늘의 금 너머', 'void', 'city.crisis', '광장으로', false);   // EX 마지막 — 요그소토스 (나가면 광장)
// ---------- 헌터 협회 · 시험장 (사용자 결정 2026-11-19) — 등록 시험의 시험관과 한 명씩 싸우는 곳 ----------
// 위 벽에 현황판 · 문장 · 현황판, 가운데 깔개 끝에 시험관(지금 차례 — 이기면 다음 등급이 섬), 둘레에 기둥 · 구경하는 의자
const ARENA = {
  title: '헌터 협회 · 시험장', w: 13, h: 9, to: 'assoc.arena', theme: 'hq', outLabel: '로비로',
  wall: [{ x: 1, w: 3, kind: 'screen' }, { x: 4, w: 5, kind: 'crest' }, { x: 9, w: 3, kind: 'screen' }],
  props: [
    { kind: 'pillar', x: 2, y: 1 }, { kind: 'pillar', x: 10, y: 1 }, { kind: 'pillar', x: 2, y: 6 }, { kind: 'pillar', x: 10, y: 6 },
    { kind: 'bench', x: 0, y: 3, w: 2 }, { kind: 'bench', x: 11, y: 3, w: 2 },
    { kind: 'plant', x: 0, y: 0, w: 1 }, { kind: 'plant', x: 12, y: 0, w: 1 }, { kind: 'plant', x: 0, y: 8, w: 1 }, { kind: 'plant', x: 12, y: 8, w: 1 }
  ],
  clerks: [{ x: 6, y: 2, shop: 'examiner', label: '시험관' }],
  signs: []
};
const arenaInterior = () => storeInterior(ARENA);
// ---------- 암시장 — 옛 동네 골목 셔터 안 (도시 계획 7번 · 9격, 사용자 결정 2026-11-19) ----------
// 어둑한 창고방: 벽에 지명수배 같은 종이 판 둘, 양옆에 빼돌린 무기 · 방패 진열장, 맨 안쪽 상자 사이에 후드티
const BM = {
  title: '골목 안', w: 9, h: 6, to: 'oldtown.blackmarket', theme: 'bm', outLabel: '골목으로',
  wall: [{ x: 0, w: 4, kind: 'board' }, { x: 5, w: 4, kind: 'board' }],
  props: [
    { kind: 'counter', x: 2, y: 0, w: 2 }, { kind: 'counter', x: 5, y: 0, w: 2 },        // 후드티 — 사이 (4, 0)
    { kind: 'case', x: 0, y: 2, w: 2, tone: 3 }, { kind: 'case', x: 7, y: 2, w: 2, tone: 6 },
    { kind: 'plant', x: 0, y: 5, w: 1 }
  ],
  clerks: [{ x: 4, y: 0, shop: 'bm', label: '???' }],
  signs: []
};
const bmInterior = () => storeInterior(BM);
// ---------- 4대 길드 안 (사용자 결정 2026-11-23) — 우선 접수 창구만 (안의 할 거리는 나중에) ----------
// 위 벽: 의뢰 게시판 · 길드 문장 깃발 · 의뢰 게시판. 가운데 위에 접수 창구(계산대 둘 사이에 직원 — 닿으면 그 길드다운 한마디, js/ui.js 의 guildDeskTalk),
// 양옆 긴 의자 · 네 귀퉁이 화분. 빛깔 · 문장은 길드마다 (theme bg0~3 — js/mapart.js 의 STC_BG: 홍염 붉은 불꽃 · 청해 푸른 물결 · 크라운 금빛 왕관 · 달 은빛 초승달)
const BIG_GUILD_ROOMS = [['hongyeom', '홍염'], ['cheonghae', '청해'], ['crown', '크라운'], ['dal', '달']].map(([id, name], i) => ({
  id, title: `${name} 길드`, w: 11, h: 7, to: `city.guild${i + 1}`, theme: `bg${i}`, outLabel: '도시로',
  wall: [{ x: 0, w: 3, kind: 'board' }, { x: 4, w: 3, kind: 'emblem' }, { x: 8, w: 3, kind: 'board' }],
  props: [
    { kind: 'counter', x: 3, y: 0, w: 2 }, { kind: 'counter', x: 6, y: 0, w: 2 },        // 접수 창구 — 사이 (5, 0) 에 직원
    { kind: 'plant', x: 0, y: 0, w: 1 }, { kind: 'plant', x: 10, y: 0, w: 1 }, { kind: 'plant', x: 0, y: 6, w: 1 }, { kind: 'plant', x: 10, y: 6, w: 1 },
    { kind: 'bench', x: 0, y: 3, w: 2 }, { kind: 'bench', x: 9, y: 3, w: 2 }
  ],
  clerks: [{ x: 5, y: 0, shop: `gdesk${i}`, label: `${name} 길드 접수` }],
  signs: []
}));
const assocInterior = () => storeInterior(ASSOC);
// ---------- 내 길드 (도시 계획 6번) — 옛 동네의 빈 건물 안 ----------
// 위 벽: 의뢰 게시판 · 길드 깃발(3단계부터) · 의뢰 게시판. 가운데 위에 길드 장부(창구), 양옆에 사무 책상 다섯 — 책상 아래 칸에 앉은 동료(seats).
// 단계마다 바닥 · 벽 빛깔이 바뀜 (mapart 의 STC_GUILD — 허름 → 멋짐)
const GUILD = {
  title: '내 길드', w: 17, h: 10, to: 'oldtown.myguild', theme: 'guild',
  wall: [{ x: 1, w: 5, kind: 'board' }, { x: 6, w: 5, kind: 'gbanner' }, { x: 11, w: 5, kind: 'board' }],
  props: [
    { kind: 'counter', x: 6, y: 0, w: 2 }, { kind: 'counter', x: 9, y: 0, w: 2 },          // 길드 장부 — 사이 (8, 0)
    { kind: 'desk', x: 1, y: 2, w: 2 }, { kind: 'desk', x: 1, y: 6, w: 2 }, { kind: 'desk', x: 4, y: 4, w: 2 },
    { kind: 'desk', x: 14, y: 2, w: 2 }, { kind: 'desk', x: 14, y: 6, w: 2 },
    { kind: 'plant', x: 0, y: 0, w: 1 }, { kind: 'plant', x: 16, y: 0, w: 1 }, { kind: 'plant', x: 0, y: 9, w: 1 }, { kind: 'plant', x: 16, y: 9, w: 1 },
    { kind: 'bench', x: 11, y: 8, w: 3 }
  ],
  clerks: [{ x: 8, y: 0, shop: 'guild', label: '길드 장부' }, { x: 11, y: 6, shop: 'ally2', label: '???' }, { x: 6, y: 7, shop: 'trainer', label: '교관' }],   // 교관 — 제12격 보스 뒤 (훈련소)   // ??? — 제8격 보스 뒤에 찾아오는 단우 (game.js 의 ally2Waiting)
  seats: [{ x: 1, y: 3 }, { x: 14, y: 3 }, { x: 4, y: 5 }, { x: 1, y: 7 }, { x: 14, y: 7 }],   // 사무 자리 — 앉힌 차례대로 (지도엔 앉은 동료만)
  signs: []
};
const guildInterior = () => storeInterior(GUILD);
// ---------- 우리 집 — 빨간 벽돌 빌라의 원룸 (사용자 결정 2026-11-19 — 분위기만, 이사는 나중에) ----------
// 위 벽에 창 둘(밖으로 옛 동네 지붕 · 하늘). 왼쪽 위 침대 · 오른쪽 위 책상 · 오른쪽 냉장고. 침대 곁에 닿으면 혼잣말 (ui 의 HOME_LINES)
const HOME = {
  title: '우리 집', w: 9, h: 6, to: 'oldtown.home', theme: 'home',
  wall: [{ x: 0, w: 3, kind: 'window' }, { x: 6, w: 3, kind: 'window' }],
  props: [
    { kind: 'bed', x: 0, y: 0, w: 2, h: 3 },
    { kind: 'desk', x: 7, y: 0, w: 2 },
    { kind: 'fridge', x: 8, y: 3, w: 1, h: 2 },
    { kind: 'plant', x: 0, y: 5, w: 1 }
  ],
  clerks: [{ x: 2, y: 1, shop: 'bed', label: '침대' }],
  signs: []
};
const homeInterior = () => storeInterior(HOME);
// ---------- 새 집 — 미래 도시의 고급 아파트 (도시 계획 7번 · 11격, 사용자 결정 2026-11-19) ----------
// 위 벽에 통유리창 셋(밖으로 미래 도시의 밤). 왼쪽 위 큰 침대 · 오른쪽 위 책상 · 가운데 소파 둘 · 냉장고 · 화분.
// 오른쪽 위 구석 — 길잡이가 옮겨 온 이상한 게이트 (portal — 옮긴 뒤에만 열림 · 그 뒤 회차는 여기서 시작)
const HOME2 = {
  title: '새 집', w: 13, h: 8, to: 'city.home2', theme: 'home2', outLabel: '도시로',
  wall: [{ x: 0, w: 4, kind: 'window' }, { x: 5, w: 3, kind: 'window' }, { x: 9, w: 4, kind: 'window' }],
  props: [
    { kind: 'bed', x: 0, y: 0, w: 2, h: 3 },
    { kind: 'desk', x: 8, y: 0, w: 2 },
    { kind: 'bench', x: 1, y: 5, w: 2 }, { kind: 'bench', x: 9, y: 5, w: 2 },
    { kind: 'fridge', x: 12, y: 3, w: 1, h: 2 },
    { kind: 'plant', x: 0, y: 7, w: 1 }, { kind: 'plant', x: 12, y: 7, w: 1 }
  ],
  clerks: [{ x: 2, y: 1, shop: 'bed2', label: '침대' }],
  links: [{ name: 'portal', x: 11, y: 0, w: 2, to: 'sewer.city', rift: true, unlock: 'portal' }],
  signs: []
};
const home2Interior = () => storeInterior(HOME2);
// 4단계부터 — 미래 도시 가운데 빈터의 새 건물 안. 더 넓게, 기둥 · 의자를 더 (자리는 그대로 다섯)
const GUILD2 = {
  title: '내 길드', w: 21, h: 12, to: 'city.myguild2', theme: 'guild',
  wall: [{ x: 1, w: 7, kind: 'board' }, { x: 8, w: 5, kind: 'gbanner' }, { x: 13, w: 7, kind: 'board' }],
  props: [
    { kind: 'counter', x: 7, y: 0, w: 3 }, { kind: 'counter', x: 11, y: 0, w: 3 },         // 길드 장부 — 사이 (10, 0)
    { kind: 'desk', x: 1, y: 2, w: 2 }, { kind: 'desk', x: 1, y: 6, w: 2 }, { kind: 'desk', x: 5, y: 4, w: 2 },
    { kind: 'desk', x: 17, y: 2, w: 2 }, { kind: 'desk', x: 17, y: 6, w: 2 },
    { kind: 'pillar', x: 8, y: 4 }, { kind: 'pillar', x: 12, y: 4 }, { kind: 'pillar', x: 8, y: 8 }, { kind: 'pillar', x: 12, y: 8 },
    { kind: 'plant', x: 0, y: 0, w: 1 }, { kind: 'plant', x: 20, y: 0, w: 1 }, { kind: 'plant', x: 0, y: 11, w: 1 }, { kind: 'plant', x: 20, y: 11, w: 1 },
    { kind: 'bench', x: 3, y: 10, w: 3 }, { kind: 'bench', x: 15, y: 10, w: 3 }
  ],
  clerks: [{ x: 10, y: 0, shop: 'guild', label: '길드 장부' }, { x: 14, y: 7, shop: 'ally2', label: '???' }, { x: 6, y: 9, shop: 'trainer', label: '교관' }],
  seats: [{ x: 1, y: 3 }, { x: 17, y: 3 }, { x: 5, y: 5 }, { x: 1, y: 7 }, { x: 17, y: 7 }],
  signs: []
};
const guild2Interior = () => storeInterior(GUILD2);
// ---------- 마녀의 오두막 안 (2격, 사용자 결정 2026-11-20) — 어둑한 통나무 방 ----------
// 위 벽: 약병 선반 · 말린 약초 · 약병 선반. 안쪽에 숲의 마녀(닿으면 싸움), 왼쪽에 끓는 가마솥, 오른쪽 구석에 낡은 침대, 구석에 책 더미 · 버섯.
// wild — 도시가 아님 (머리 위에 돈이 안 보임)
const WITCH_ROOM = {
  title: '마녀의 오두막', w: 9, h: 7, to: 'overworld.witchhut', theme: 'witch', wild: true, outLabel: '숲으로',
  wall: [{ x: 0, w: 3, kind: 'potions' }, { x: 3, w: 3, kind: 'herbs' }, { x: 6, w: 3, kind: 'potions' }],
  props: [
    { kind: 'cauldron', x: 1, y: 1, w: 2, h: 2 },
    { kind: 'bed', x: 7, y: 0, w: 2, h: 3 },
    { kind: 'books', x: 0, y: 6 }, { kind: 'shroom', x: 8, y: 6 }, { kind: 'shroom', x: 0, y: 4 }
  ],
  foes: [{ name: '숲의 마녀', x: 4, y: 0 }],
  clerks: [],
  signs: []
};
const ROOMS = { WITCH_ROOM };

// 뽑을 지도 전부 — { 파일 이름: 만드는 함수 }
function allMaps(data) {
  const out = { sewer: sewer(data), overworld: overworld(data), hub: hub(data), oldtown: oldtown(), city: city(), dept: deptInterior(), dept2: dept2Interior(), assoc: assocInterior(), guild: guildInterior(), guild2: guild2Interior(), home: homeInterior(), arena: arenaInterior(), bm: bmInterior(), home2: home2Interior(), gatein: gateinInterior(), chief: chiefInterior(), raid: raidInterior(), w1: storeInterior(W1), w2: storeInterior(W2), w3: storeInterior(W3), sky: storeInterior(SKY) };
  for (const s of SECRET_ROOMS) out[s.id] = secretRoom(data, s);
  for (const c of CAVES) out[c.id] = caveMap(data, c);
  for (const u of UNDERS) out[u.id] = cryptMap(data, u);
  for (const g of BIG_GUILD_ROOMS) out[g.id] = storeInterior(g, data);
  out.abyss = abyssMap(data);
  out[DEMON_CASTLE.id] = buildingInterior(data, DEMON_CASTLE);
  out[BALLROOM.id] = buildingInterior(data, BALLROOM);
  out[PRIDE_CASTLE.id] = buildingInterior(data, PRIDE_CASTLE);
  for (const b of BUILDINGS) out[b.id] = b.room ? storeInterior(ROOMS[b.room], data) : buildingInterior(data, b);
  REALMS.forEach((r, i) => { out[r.name] = realm(data, r, i); });
  return out;
}

module.exports = { TILE, FLOOR, WALL, WATER, TREE, ROCK, ROAD, buildTmj, tilesPng, looksPng, encodePng, generate, sewer, overworld, hub, oldtown, city, deptInterior, dept2Interior, assocInterior, guildInterior, guild2Interior, homeInterior, home2Interior, arenaInterior, bmInterior, gateinInterior, chiefInterior, raidInterior, storeInterior, OLDTOWN, CITY, DEPT, DEPT2, ASSOC, GUILD, GUILD2, HOME, HOME2, ARENA, BM, GATEIN, CHIEF, RAID, W1, W2, W3, SKY, CITY_BIO, secretRoom, buildingInterior, allMaps, layoutFromPlan, HUB_DOORS, REALMS, SEWER, SECRET_ROOMS, CAVES, caveMap, BUILDINGS, BUILD, DOORWAY, CARPET, RUIN, UNDERS, ABYSS, DEMON_CASTLE, BALLROOM, PRIDE_CASTLE, abyssMap };
