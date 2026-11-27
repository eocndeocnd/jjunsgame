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
// 지하수로(sewer)가 씁니다 — 2~6격(overworld · abyss)과 7격부터(handMap — 손으로 짠 지도)는 따로 짭니다.
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
// ranks: 그림의 N 번째 = 몇 격인가 · opts: { seed, plaza(어귀 이름), obstacle(rank) → 그 격 들판에 흩어질 장애물 타일, entry(어귀) → 어귀 가장자리의 문,
//   square(모든 방을 반듯하게) · open(트인 길의 폭 — 주면 맞닿은 변 가운데에) · order({ 격: ['칸,줄', …] } — 그 격 일반을 약한 것부터 세울 들판 차례),
//   exit({ name, label, to } — 마지막 격 보스 방 위쪽 막다른 틈 안의 구멍. 보스가 그 앞을 꼭 맞게 막고 섬),
//   look((그 칸의 방 | null, 바닥 타일) → 겉모습 번호 — 주면 겉모습 층을 적음, 그림 js/mapart.js),
//   chests([{ id, room: '칸,줄', corner: nw | ne | sw | se, big }] — 그 방 구석(가장자리에서 두 칸 안)의 보물상자) }
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
  if (opts.entry) {                                          // 어귀 가장자리의 문 (지하수로 — 도시로 나가는 이상한 게이트)
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
  // 7격(대도서관)으로 가는 문은 마왕성 안 왕좌 뒤 (DEMON_CASTLE — abyss 지도)

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
// 마왕성 안(DEMON_CASTLE — 3격 성처럼 들어가는 큰 방)에 마왕 · 관측자 · 7격 대도서관으로 가는 문
const ABYSS = {                                                // 처음 시안(141 × 280)을 88% 로 줄이고 빈 가장자리를 좁힘 (사용자 결정 2026-11-23 — 웅장하되 쓰지 않는 땅이 많았음)
  W: 124, H: 240, cx: 62, half: [50, 57],                      // half — 땅의 반폭 (마왕성 줄 · 그 아래), 잡음으로 ±5
  road: [[62, 234], [58, 222], [51, 209], [67, 195], [57, 180], [71, 164], [55, 148], [69, 132], [55, 116], [71, 100], [57, 84], [67, 69], [62, 51], [62, 44]],
  rivers: [{ y: 190, amp: 3.5, ph: 0.3, gaps: [57, 92] }, { y: 150, amp: 4.4, ph: 1.7, gaps: [27, 62] }, { y: 118, amp: 3.5, ph: 3.1, gaps: [62, 97] }, { y: 70, amp: 2.6, ph: 4.4, gaps: [27, 64] }],
  areas: [['아크데몬', 46, 222, 26, 10], ['심연의 촉수', 78, 202, 26, 10], ['고대룡', 50, 171, 26, 12], ['마신장', 51, 86, 26, 11], ['종말의 짐승', 74, 56, 26, 10]],
  sins: [['칠죄종 · 나태', 23, 197], ['칠죄종 · 질투', 95, 185], ['칠죄종 · 색욕', 94, 160], ['칠죄종 · 폭식', 27, 141], ['칠죄종 · 오만', 94, 128], ['칠죄종 · 분노', 29, 107], ['칠죄종 · 탐욕', 97, 99]],
  ledge: { rx: 8, ry: 6 },                                     // 칠죄종 턱 윗면 — 16 × 12 칸 (꾸밀 자리, 줄이지 않음)
  castle: { x0: 30, x1: 94, y0: 7, y1: 40, door: 4 },         // 마왕성 바깥 (문은 아래 가운데, 벌레가 그 앞을 막음)
  mound: [62, 231],                                            // 지하 묘실로 내려가는 바위 둔덕의 문 (아래 가운데)
  merchant: [73, 234], chests: [[13, 164], [113, 113], [16, 63, 'big']]
};
const DEMON_CASTLE = { id: 'demoncastle', title: '마왕성', boss: '마왕', map: 'abyss', hidden: '관측자', next: { label: '알렉산드리아 대도서관', to: 'library.in', place: '인간의 땅' },
  hall: { w: 26, h: 34, aisle: 4, bossY: 5, pillarX: 4, pillarRows: [12, 19, 26], pillar: 2 } };
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
  const posts = [], ledges = [];
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
    posts.push({ name: e.name, x: px, y: py, w: n, h: n, enemy: e.id, blocks: false });
    let foot = ly; while (high[idx(lx, foot + 1)] || stairs[idx(lx, foot + 1)]) foot++;
    ledges.push({ x: lx, y: foot + 1 });                       // 계단 밑 — 곁길이 닿는 곳
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
  const ports = [{ name: DEMON_CASTLE.id, label: DEMON_CASTLE.title, x: dx0, y: C.y1 - 1, w: C.door, h: 1, to: `${DEMON_CASTLE.id}.out`, door: true }];
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
  const highRuns = cellRuns(high), stairRuns = cellRuns(stairs);
  OUT_W = saveW; OUT_H = saveH;
  return buildTmj({ w: W, h: H, tiles, areas, posts, ports, npcs, chests, look: lk, props: { title: zone.name, high: highRuns, stairs: stairRuns } });
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
  if (!foe || foe.kind !== 'boss') throw new Error(`건물 ${b.id} — ${b.boss} 이(가) 보스가 아님`);
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
  // 다음 격으로 가는 문 (b.next — 마왕성: 왕좌 뒤 맨 위 줄 가운데, 보스를 꺾어야 열림 · 7격 대도서관 들머리로)
  if (b.next) ports.push({ name: 'next', label: b.next.label, x: cx - 1, y: TOP, w: 2, h: 1, to: b.next.to, opensAfter: foe.id, ...(b.next.place ? { place: b.next.place } : {}) });
  return buildTmj({ w: W, h: H, tiles, posts, ports, npcs: [{ name: 'start', x: out.x + (out.w >> 1), y: out.y - 1 }], look: lk, props: { title: b.title, interior: true } });
}

// ---------- 7격부터 — 격 하나에 지도 한 장, 모두 손으로 짠 지도 (docs/MAP-7PLUS-PLAN.md) ----------
// 앞 격 보스 뒤 문으로 들어와 이 격 보스 뒤 문으로 나가므로 되돌아 걷지 않습니다 (사용자 결정 2026-11-24 — 문의 광장 없앰).
const RANK_MAPS = [
  { id: 'library', rank: 7, custom: data => alexandriaMap(data) },   // 손으로 짠 지도 (ALEX)
  { id: 'camelot', rank: 8, custom: data => camelotMap(data) },     // 손으로 짠 지도 (CAMELOT)
  { id: 'avalon', rank: 9, custom: data => avalonMap(data) },       // 손으로 짠 지도 (AVALON)
  { id: 'murim', rank: 10, custom: data => murimMap(data) },        // 손으로 짠 지도 (MURIM)
  { id: 'tianshan', rank: 11, custom: data => tianshanMap(data) },  // 손으로 짠 지도 (TIANSHAN)
  { id: 'sanctuary', rank: 12, custom: data => sanctuaryMap(data) }, // 손으로 짠 지도 (SANCTUARY)
  { id: 'elysium', rank: 13, custom: data => elysiumMap(data) },     // 손으로 짠 지도 (ELYSIUM)
  { id: 'heaven', rank: 14, custom: data => heavenMap(data) },       // 손으로 짠 지도 (HEAVEN)
  { id: 'inferno', rank: 15, custom: data => infernoMap(data) },     // 손으로 짠 지도 (INFERNO)
  { id: 'yggdrasil', rank: 16, custom: data => yggdrasilMap(data) }, // 손으로 짠 지도 (YGGDRASIL)
  { id: 'primordial', rank: 17, custom: data => primordialMap(data) }, // 손으로 짠 지도 (PRIMORDIAL)
  { id: 'olympus', rank: 18, custom: data => olympusMap(data) },       // 손으로 짠 지도 (OLYMPUS)
  { id: 'rlyeh', rank: 19, custom: data => rlyehMap(data) },           // 손으로 짠 지도 (RLYEH)
  { id: 'chaos', rank: 20, custom: data => chaosMap(data) }            // 손으로 짠 지도 (CHAOS)
];
const rankMapId = rank => (RANK_MAPS.find(m => m.rank === rank) || {}).id;
// 장소 — 7~20격을 한 줄로 내리 잇지 않고 장소가 바뀌는 곳에서 나눔 (사용자 결정 2026-11-25). 한 장소 안의 격은 보스 뒤 문으로 바로,
// 장소가 바뀌는 문(마지막 격 보스 뒤 문 · 마왕성 왕좌 뒤 문)도 그대로 한 회차에 이어 가되 넘어갈 때 장소 이름이 뜸 (port.place, ui 의 fadeThrough)
const PLACES = [
  { name: '인간의 땅', ranks: [7, 8, 9] },
  { name: '동방', ranks: [10, 11] },
  { name: '신화의 땅', ranks: [12, 13] },
  { name: '하늘과 지옥', ranks: [14, 15] },
  { name: '신들의 시대', ranks: [16, 17, 18] },
  { name: '르뤼에', ranks: [19] },
  { name: '바깥', ranks: [20] }
];
const placeOf = rank => PLACES.find(p => p.ranks.includes(rank)) || null;

// ---------- 손으로 짠 지도 (7격부터 — 컨셉 논리대로, docs/MAP-7PLUS-PLAN.md 2-0) ----------
// 지도마다 땅은 paint(칠하기 도구) 로 직접 칠하고, 나머지(자리 · 구역 · 문 · 사람 · 보물상자 · 검사)는 여기서 같이 합니다.
//   A.foes     이름 → 몸 왼쪽 위 칸 — 정예 · 히든 · 보스 · 하나뿐인 일반 모두. 보스만 길을 막고(blocks), 나머지는 흙길에서 2칸 넘게 비켜 섬
//   A.sections [이름, 네모] — 구간(상징 공간, 들어서면 이름이 뜸). 겹치면 뒤의 것
//   A.zones    [돌아다니는 일반 이름, 네모] — 그 무리가 사는 곳
//   A.in · A.next [x, y, 폭] — 앞 격(또는 마왕성)에서 들어오는 문 · 보스 뒤 다음 격으로 가는 문. A.start · A.merchant [x, y]
//   A.chests   [x, y, 'big'?] — 작은 상자 둘 · 큰 상자 하나
// 좌표는 칸 (x 오른쪽 · y 아래쪽), 네모는 [x0, y0, x1, y1) 반열린.
function handMap(data, rank, A, paint) {
  const W = A.W, H = A.H, idx = (x, y) => y * W + x;
  const zi = data.ZONES.findIndex(z => z.rank === rank), zone = data.ZONES[zi];
  const foes = data.ENEMIES.filter(e => e.zoneIndex === zi);
  const named = name => { const e = foes.find(q => q.name === name); if (!e) throw new Error(`${rank}격 — ${name} 이(가) 없음`); return e; };
  const tiles = new Uint8Array(W * H).fill(WALL);
  const box = (r, t) => { for (let y = r[1]; y < r[3]; y++) for (let x = r[0]; x < r[2]; x++) tiles[idx(x, y)] = t; };
  const ring = (r, t) => { for (let y = r[1]; y < r[3]; y++) for (let x = r[0]; x < r[2]; x++) if (x === r[0] || y === r[1] || x === r[2] - 1 || y === r[3] - 1) tiles[idx(x, y)] = t; };
  const road = r => { for (let y = r[1]; y < r[3]; y++) for (let x = r[0]; x < r[2]; x++) if (tiles[idx(x, y)] === FLOOR) tiles[idx(x, y)] = ROAD; };
  const rectOf = k => (Array.isArray(k) ? k : A[k]);
  const secrets = [], shapes = [];                             // shapes — [이름, 칸 모음] 땅 모양대로 그린 구간 (구멍 없는 한 덩어리 — 동그란 고리는 반씩 나눠서)
  paint({ tiles, idx, box, ring, road, rectOf, secrets, shapes });

  // 자리 — 모두 트인 땅에, 보스 말고는 흙길에서 2칸 넘게 (지나가며 닿지 않게)
  const posts = Object.entries(A.foes).map(([name, [x, y]]) => {
    const e = named(name), n = e.size;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const t = tiles[idx(x + i, y + j)]; if (t !== FLOOR && t !== ROAD) { if (handMap.loose) { handMap.problems.push(`${name} 빈 땅 아님`); j = i = 99; continue; } throw new Error(`${rank}격 — ${name} (${x + i}, ${y + j}) 이(가) 빈 땅이 아님`); } }
    if (e.kind !== 'boss') for (let j = -2; j < n + 2; j++) for (let i = -2; i < n + 2; i++) if (tiles[idx(x + i, y + j)] === ROAD) { if (handMap.loose) { handMap.problems.push(`${name} 흙길 곁`); j = i = 99; continue; } throw new Error(`${rank}격 — ${name} 이(가) 흙길에서 2칸 안`); }   // loose — 지도를 짤 때 문제를 모아 보기만 (개발용)
    return { name: e.name, x, y, w: n, h: n, enemy: e.id, blocks: e.kind === 'boss' };
  });
  const boss = foes.find(e => e.kind === 'boss');
  for (const e of foes) if ((e.kind !== 'normal' || e.solo) && !posts.some(p => p.enemy === e.id)) throw new Error(`${rank}격 — ${e.name} 자리가 없음`);

  // 구역 — 구간(상징 공간, 이름이 뜸)을 먼저, 돌아다니는 일반의 구역을 뒤에 (겹치면 뒤의 것)
  const areas = A.sections.map(([name, k]) => { const r = rectOf(k); return { name, x: r[0], y: r[1], w: r[2] - r[0], h: r[3] - r[1], zone: zone.id, section: true }; });
  for (const [name, cells] of shapes) {
    const xs = [...cells].map(q => q % W), ys = [...cells].map(q => (q / W) | 0);
    const bb = { x: Math.min(...xs) - 1, y: Math.min(...ys) - 1, w: Math.max(...xs) - Math.min(...xs) + 3, h: Math.max(...ys) - Math.min(...ys) + 3 };
    const saveW = OUT_W, saveH = OUT_H; OUT_W = W; OUT_H = H;
    const { x, y, polygon } = outline(cells, bb);
    OUT_W = saveW; OUT_H = saveH;
    areas.push({ name, x, y, polygon, zone: zone.id, section: true });
  }
  for (const [name, k] of A.zones) {
    const e = named(name), r = rectOf(k), rect = { x: r[0] + 1, y: r[1] + 1, w: r[2] - r[0] - 2, h: r[3] - r[1] - 2 };
    // 네모 안 걸을 수 있는 땅이 한 덩어리가 아니면(구름 섬 가장자리처럼 들쭉날쭉한 땅) 가장 큰 덩어리를 땅 모양대로(다각형) — 구멍은 품음
    const open = (x, y) => { const t = tiles[idx(x, y)]; return t === FLOOR || t === ROAD; };
    const inR = (x, y) => x >= rect.x && y >= rect.y && x < rect.x + rect.w && y < rect.y + rect.h;
    const seen = new Set(), parts = [];
    for (let y = rect.y; y < rect.y + rect.h; y++) for (let x = rect.x; x < rect.x + rect.w; x++) {
      if (!open(x, y) || seen.has(idx(x, y))) continue;
      const part = [idx(x, y)]; seen.add(part[0]);
      for (let n = 0; n < part.length; n++) { const q = part[n], qx = q % W, qy = (q / W) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = qx + dx, ny = qy + dy, j = idx(nx, ny); if (inR(nx, ny) && open(nx, ny) && !seen.has(j)) { seen.add(j); part.push(j); } } }
      parts.push(part);
    }
    if (parts.length <= 1) { areas.push({ name, ...rect, rank, monster: e.id, zone: zone.id }); continue; }
    const mine = new Set(parts.sort((p, q) => q.length - p.length)[0]);
    const xs = [...mine].map(q => q % W), ys = [...mine].map(q => (q / W) | 0);
    const bb = { x: Math.min(...xs) - 1, y: Math.min(...ys) - 1, w: Math.max(...xs) - Math.min(...xs) + 3, h: Math.max(...ys) - Math.min(...ys) + 3 };
    const outside = new Set(), st = [];                        // 구멍 메우기 — 둘레에서 바깥을 따라 퍼져 닿지 않는 칸은 품음
    for (let y = bb.y; y < bb.y + bb.h; y++) for (let x = bb.x; x < bb.x + bb.w; x++) if ((x === bb.x || y === bb.y || x === bb.x + bb.w - 1 || y === bb.y + bb.h - 1) && !mine.has(idx(x, y))) { outside.add(idx(x, y)); st.push([x, y]); }
    while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, j = idx(nx, ny); if (nx < bb.x || ny < bb.y || nx >= bb.x + bb.w || ny >= bb.y + bb.h || mine.has(j) || outside.has(j)) continue; outside.add(j); st.push([nx, ny]); } }
    for (let y = bb.y + 1; y < bb.y + bb.h - 1; y++) for (let x = bb.x + 1; x < bb.x + bb.w - 1; x++) if (!mine.has(idx(x, y)) && !outside.has(idx(x, y))) mine.add(idx(x, y));
    const saveW = OUT_W, saveH = OUT_H; OUT_W = W; OUT_H = H;
    const { x, y, polygon } = outline(mine, bb);
    OUT_W = saveW; OUT_H = saveH;
    areas.push({ name, x, y, polygon, rank, monster: e.id, zone: zone.id });
  }
  const roam = foes.filter(e => e.kind === 'normal' && !e.solo);
  if (roam.length !== A.zones.length) throw new Error(`${rank}격 — 돌아다니는 일반 ${roam.length}종, 구역 ${A.zones.length}개`);

  // 문 · 사람 · 보물상자
  const prevZone = data.ZONES.find(z => z.rank === rank - 1), nextZone = data.ZONES.find(z => z.rank === rank + 1);
  const place = placeOf(rank), nextPlace = placeOf(rank + 1);
  const ports = [{ name: 'in', label: rank === 7 ? DEMON_CASTLE.title : prevZone.name, x: A.in[0], y: A.in[1], w: A.in[2], h: 1, to: `${rank === 7 ? DEMON_CASTLE.id : rankMapId(rank - 1)}.next` }];
  if (nextZone) ports.push({ name: 'next', label: nextZone.name, x: A.next[0], y: A.next[1], w: A.next[2], h: 1, to: `${rankMapId(rank + 1)}.in`, opensAfter: boss.id, ...(nextPlace !== place ? { place: nextPlace.name } : {}) });
  const npcs = [{ name: 'start', x: A.start[0], y: A.start[1] }, { name: 'entry', x: A.start[0], y: A.start[1], zone: zone.id }, { name: 'merchant', x: A.merchant[0], y: A.merchant[1], zone: zone.id }];
  const item = (data.ITEMS.find(i => i.chest && i.rank.n === rank) || {}).id;
  if (!item) throw new Error(`${rank}격 큰 상자 — 상자 전용 장비(CHEST_ITEMS)가 없음`);
  const chests = A.chests.map(([x, y, big], i) => ({ name: '보물상자', x, y, chest: big ? `r${rank}-big` : `r${rank}-${i + 1}`, rank, ...(big ? { big: true, item } : {}) }));
  for (const q of [...npcs, ...chests]) for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const t = tiles[idx(q.x + i, q.y + j)];
    if (t !== FLOOR && t !== ROAD) { if (handMap.loose) { handMap.problems.push(`${q.name} (${q.x}, ${q.y}) 둘레`); break; } throw new Error(`${rank}격 — ${q.name} (${q.x}, ${q.y}) 둘레가 빈 땅이 아님`); }
  }
  for (const p of ports) for (let i = 0; i < p.w; i++) if (tiles[idx(p.x + i, p.y)] !== FLOOR && tiles[idx(p.x + i, p.y)] !== ROAD) throw new Error(`${rank}격 — 문 ${p.name} 자리가 빈 땅이 아님`);
  return buildTmj({ w: W, h: H, tiles, areas, posts, ports, npcs, chests, secrets, props: { title: zone.name, place: place.name } });
}
// 칸 모음 → 그 가운데 가장 큰 한 덩어리, 구멍은 품어 메움 (땅 모양대로 그린 구간 — handMap 의 shapes). W 는 지도 너비
function solidShape(cells, W) {
  const seen = new Set(); let best = [];
  for (const q0 of cells) {
    if (seen.has(q0)) continue;
    const part = [q0]; seen.add(q0);
    for (let n = 0; n < part.length; n++) for (const d of [1, -1, W, -W]) { const j = part[n] + d; if (cells.has(j) && !seen.has(j)) { seen.add(j); part.push(j); } }
    if (part.length > best.length) best = part;
  }
  const mine = new Set(best), xs = best.map(q => q % W), ys = best.map(q => (q / W) | 0);
  const bb = { x: Math.min(...xs) - 1, y: Math.min(...ys) - 1, w: Math.max(...xs) - Math.min(...xs) + 3, h: Math.max(...ys) - Math.min(...ys) + 3 };
  const idx = (x, y) => y * W + x, outside = new Set(), st = [];
  for (let y = bb.y; y < bb.y + bb.h; y++) for (let x = bb.x; x < bb.x + bb.w; x++) if ((x === bb.x || y === bb.y || x === bb.x + bb.w - 1 || y === bb.y + bb.h - 1) && !mine.has(idx(x, y))) { outside.add(idx(x, y)); st.push([x, y]); }
  while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, j = idx(nx, ny); if (nx < bb.x || ny < bb.y || nx >= bb.x + bb.w || ny >= bb.y + bb.h || mine.has(j) || outside.has(j)) continue; outside.add(j); st.push([nx, ny]); } }
  for (let y = bb.y + 1; y < bb.y + bb.h - 1; y++) for (let x = bb.x + 1; x < bb.x + bb.w - 1; x++) if (!mine.has(idx(x, y)) && !outside.has(idx(x, y))) mine.add(idx(x, y));
  return mine;
}
// 자연의 땅을 들쭉날쭉하게 (사용자 결정 2026-11-27 — 반듯함은 사람이 지은 것에만)
// naturalize — 네모 rect 의 sides('n' · 's' · 'w' · 'e') 가장자리 빈 땅을 amp 칸까지 잡음 따라 tile(바다 · 벼랑)로 깎음. keep(x, y) 이 참이면 그대로
function naturalize(c, rect, sides, amp, tile, seed, keep) {
  const noise = valueNoise(seed), [x0, y0, x1, y1] = rect;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const k = c.idx(x, y);
    if (c.tiles[k] !== FLOOR || (keep && keep(x, y))) continue;
    let d = Infinity;
    if (sides.includes('w')) d = Math.min(d, x - x0);
    if (sides.includes('e')) d = Math.min(d, x1 - 1 - x);
    if (sides.includes('n')) d = Math.min(d, y - y0);
    if (sides.includes('s')) d = Math.min(d, y1 - 1 - y);
    if (d < amp * (0.35 + noise(x * 0.13, y * 0.13) * 0.9)) c.tiles[k] = tile;
  }
}
// wavyBand — 곧은 등성이 · 시내 대신 구불구불한 띠. vertical 이면 y 를 따라(from → to) x = at + 흔들림, 아니면 x 를 따라. gaps — 띠를 끊어 둘 구간(건너는 곳)
// 물가 · 바위 테를 들쭉날쭉하게 — rect 안의 바닥 중 tile에 가까운 칸을 소음에 따라 tile로 (가까울수록 잘 먹힘)
function erodeShore(c, rect, tile, amp, seed, keep) {
  const noise = valueNoise(seed), [x0, y0, x1, y1] = rect, R = Math.ceil(amp);
  const hit = [];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    if (c.tiles[c.idx(x, y)] !== FLOOR || (keep && keep(x, y))) continue;
    let d = Infinity;
    for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) if (c.tiles[c.idx(x + i, y + j)] === tile) d = Math.min(d, Math.hypot(i, j));
    if (d < amp * (0.3 + noise(x * 0.11, y * 0.11) * 0.9)) hit.push(c.idx(x, y));
  }
  for (const k of hit) c.tiles[k] = tile;
}
function wavyBand(c, o) {
  const noise = valueNoise(o.seed || 1);
  for (let s = o.from; s < o.to; s++) {
    if ((o.gaps || []).some(([a, b]) => s >= a && s < b)) continue;
    const mid = o.at + o.amp * Math.sin(s / o.period + (o.phase || 0)) + (noise(s * 0.15, 3) - 0.5) * o.amp * 0.6;
    for (let t = Math.floor(mid - o.half); t <= mid + o.half; t++) { const [x, y] = o.vertical ? [t, s] : [s, t]; c.tiles[c.idx(x, y)] = o.tile; }
  }
}
const nearTile = (c, t, x, y, d) => { for (let j = -d; j <= d; j++) for (let i = -d; i <= d; i++) if (c.tiles[c.idx(x + i, y + j)] === t) return true; return false; };
// 숲 — 네모 안 빈 땅에 나무를 듬성듬성 (홀로 선 나무만 — 구역을 가르지 않게). keep(x, y) 이 참인 칸은 비움
function scatterTrees(c, r, keep, seed, density) {
  const hash = (x, y) => { const v = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453; return v - Math.floor(v); };
  for (let y = r[1] + 1; y < r[3] - 1; y++) for (let x = r[0] + 1; x < r[2] - 1; x++) {
    if (c.tiles[c.idx(x, y)] !== FLOOR || keep(x, y) || hash(x, y) >= density) continue;
    let alone = true;
    for (let j = -1; j <= 1 && alone; j++) for (let i = -1; i <= 1; i++) if ((i || j) && c.tiles[c.idx(x + i, y + j)] !== FLOOR && c.tiles[c.idx(x + i, y + j)] !== ROAD) { alone = false; break; }
    if (alone) c.tiles[c.idx(x, y)] = TREE;
  }
}
const nearFoe = (A, x, y, d) => Object.values(A.foes).some(([fx, fy]) => x >= fx - d && x < fx + 4 + d && y >= fy - d && y < fy + 4 + d);

// ---------- 7격 — 알렉산드리아 (손으로 짠 지도, 사용자 결정 2026-11-25 「맵도 컨셉에 관련된 논리가 있어야」) ----------
// 대도서관 두루마리 속 위인들이 살아난 바둑판 계획도시. 남쪽 성문에서 북쪽 대항구로 — 세 갈래 큰길을 따라 파벌마다 제 상징 공간에 모여 있고,
// 이름난 사람은 구석이 아니라 트인 광장 · 뜰에 섭니다. 파벌 안에서는 센 사람이 가운데나 뒤(북쪽)에 — 어느 파벌을 따라가도 북쪽으로 갈수록 셈.
//   서쪽 (반란자 → 정복자)  세라페움 언덕(손자 — 싸우지 않고 이기는 은둔한 병법가라 구석, 이야기가 있는 예외) · 원형극장(앞 광장의 화형대에 잔 다르크, 검투장 한가운데 스파르타쿠스)
//                           · 소마 — 알렉산드로스의 무덤 (앞뜰 게르 진영에 칭기즈 칸, 한가운데 알렉산드로스 — 이 도시를 세운 자)
//   가운데 (학자)           필사실(필경사) · 무세이온 뜰(아르키메데스 → 대도서관 정문 앞 히파티아 — 마지막 도서관장) · 대도서관 본관(작업실의 다 빈치 → 맨 안 기록 서고의 헤로도토스)
//                           · 본관 안 숨은 비밀 서고 (벽 속 숨은 샛길, 큰 보물상자)
//   동쪽 (촉한의 오호대장군) 목책 두른 군영이 남북으로 길게 — 영채 정문 관우 → 운하의 다리(장판교) 장비 → 한가운데 조운 → 본진의 마초 · 가운데 황충
//   남쪽 성문 안 시장(이야기꾼, 돌아다님 · 상인) · 북쪽 대항구 부두에서 세 갈래가 만나고, 파로스 등대 섬으로 가는 둑길을 이순신(수군)이 막음.
//   등대 섬에 헤르메스 트리스메기스투스(히든 — 보스를 꺾으면) · 8격으로 가는 배.
// 가로 거리 둘(시장 북쪽 · 가운데)로 갈래끼리 오갑니다. 좌표는 칸 (x 오른쪽 · y 아래쪽), [x0, y0, x1, y1) 반열린 네모.
const ALEX = {
  W: 140, H: 150,
  island: [58, 3, 82, 14], water: [6, 14, 134, 22], causeway: 69, quay: [6, 22, 134, 30],
  streets: [[24, 30, 33, 120], [6, 114, 134, 121], [6, 58, 134, 67]],   // 서쪽 큰길 · 시장 북쪽 거리 · 가운데 거리
  market: [36, 121, 104, 143], gate: 69,
  serapeum: [8, 92, 23, 113], serapeumRamp: [23, 100, 24, 105],
  theater: { cx: 45, cy: 84, r: 12, seat: [9, 10.6] }, theaterSquare: [34, 98, 57, 114],
  soma: [34, 30, 60, 57],
  scriptorium: [54, 98, 87, 114], museion: [54, 68, 87, 96],
  library: [54, 30, 87, 58], vault: [77, 31, 86, 38],
  camp: [90, 30, 133, 115], canal: [91, 84, 132, 88], bridge: [103, 118], campRoad: [109, 112, 30],
  foes: {                                                      // 이름 → 몸 왼쪽 위 칸
    '손자': [13, 99], '잔 다르크': [39, 105], '스파르타쿠스': [49, 82], '칭기즈 칸': [41, 50], '알렉산드로스': [51, 37],
    '아르키메데스': [61, 87], '히파티아': [75, 71], '레오나르도 다 빈치': [59, 47], '헤로도토스': [62, 33],
    '관우': [97, 106], '장비': [103, 85], '조운': [98, 70], '마초': [122, 46], '황충': [114, 37],
    '이순신': [69, 19], '헤르메스 트리스메기스투스': [61, 5]
  },
  sections: [['세라페움 언덕', 'serapeum'], ['원형극장', [32, 71, 59, 114]], ['소마 — 알렉산드로스의 무덤', 'soma'], ['무세이온', 'museion'],
    ['대도서관', 'library'], ['비밀 서고', 'vault'], ['촉한 진영', 'camp'], ['대항구', 'quay'], ['파로스 등대 섬', 'island']],
  zones: [['이름 없는 이야기꾼', 'market'], ['필경사', 'scriptorium']],
  merchant: [40, 124], chests: [[10, 94], [129, 90], [81, 34, 'big']],
  in: [69, 144, 3], next: [68, 2, 4], start: [70, 140]
};
function alexandriaMap(data) {
  const A = ALEX;
  return handMap(data, 7, A, ({ tiles, idx, box, ring, road, secrets }) => {
    // 땅 — 바다 · 등대 섬 · 둑길 · 부두 · 거리 · 시장 · 성문
    box(A.water, WATER);
    box(A.island, FLOOR);
    box([A.causeway, A.water[1], A.causeway + 3, A.water[3]], ROAD);
    box([A.island[0] + 10, A.island[1] - 1, A.island[0] + 14, A.island[1]], FLOOR);        // 북쪽 부두 — 8격으로 가는 배
    box(A.quay, FLOOR);
    for (const s of A.streets) box(s, FLOOR);
    box(A.market, FLOOR);
    box([A.gate, A.market[3], A.gate + 3, A.market[3] + 2], FLOOR);                          // 남쪽 성문
    // 서쪽 — 세라페움 언덕(바위 테, 동쪽 비탈길) · 원형극장(돌 관람석 고리, 남북으로 트임) · 극장 앞 광장 · 소마(담, 남 · 서 · 북 문)
    box(A.serapeum, FLOOR); ring(A.serapeum, ROCK); box([A.serapeum[2] - 1, A.serapeumRamp[1], A.streets[0][0], A.serapeumRamp[3]], FLOOR);
    const T = A.theater;
    for (let y = T.cy - T.r; y <= T.cy + T.r; y++) for (let x = T.cx - T.r; x <= T.cx + T.r; x++) {
      const d = Math.hypot(x + 0.5 - (T.cx + 0.5), y + 0.5 - (T.cy + 0.5));
      if (d < T.r) tiles[idx(x, y)] = d >= T.seat[0] && d < T.seat[1] && Math.abs(x - T.cx) > 2 ? ROCK : FLOOR;
    }
    box([T.cx - 2, T.cy - T.r - 1, T.cx + 3, T.cy - T.r + 1], FLOOR);                        // 극장 북쪽 길 → 가운데 거리
    box(A.theaterSquare, FLOOR); box([A.streets[0][2], A.theaterSquare[1] + 4, A.theaterSquare[0], A.theaterSquare[3] - 4], FLOOR);
    box(A.soma, FLOOR); ring(A.soma, WALL);
    const S = A.soma, sx = (S[0] + S[2]) >> 1;
    box([sx - 2, S[3] - 1, sx + 3, S[3] + 1], FLOOR); box([S[0] - 1, 40, S[0] + 1, 45], FLOOR); box([sx - 2, S[1] - 1, sx + 3, S[1] + 1], FLOOR);
    // 가운데 — 필사실 · 무세이온 뜰 · 대도서관 본관(담, 남 · 북 문, 기둥 줄) · 비밀 서고(본관 안 막힌 방)
    box(A.scriptorium, FLOOR); box(A.museion, FLOOR);
    box([64, A.museion[3], 77, A.scriptorium[1]], FLOOR);                                    // 필사실 ↔ 무세이온
    box([64, A.streets[2][3], 77, A.museion[1]], FLOOR);                                     // 무세이온 ↔ 가운데 거리
    const L = A.library;
    box(L, FLOOR); ring(L, WALL);
    box([66, L[3] - 1, 75, L[3]], FLOOR); box([66, L[1], 75, L[1] + 1], FLOOR);
    for (const px of [58, 64, 76, 82]) for (const py of [41, 52]) box([px, py, px + 2, py + 2], ROCK);
    const V = A.vault;
    for (let y = V[1]; y <= V[3]; y++) tiles[idx(V[0] - 1, y)] = WALL;
    for (let x = V[0] - 1; x < V[2]; x++) tiles[idx(x, V[3])] = WALL;
    secrets.push({ name: '숨은 샛길', x: V[0] + 3, y: V[3], w: 2, h: 1 });
    // 동쪽 — 목책 두른 촉한 진영 (남 · 북 · 서 문), 운하와 다리
    const C = A.camp, mid = 110;
    box(C, FLOOR); ring(C, ROCK);
    box([mid - 4, C[3] - 1, mid + 5, C[3]], FLOOR); box([mid - 4, C[1], mid + 5, C[1] + 1], FLOOR); box([C[0], A.streets[2][1], C[0] + 1, A.streets[2][3]], FLOOR);
    box(A.canal, WATER); box([A.bridge[0], A.canal[1], A.bridge[1], A.canal[3]], FLOOR);
    // 흙길 — 서쪽 큰길 · 가로 거리 둘 · 부두 · 진영 안 · 구역마다 지나가는 길(극장 · 소마 · 가운데 학자의 길). 이름난 사람은 이 길에서 두 칸 넘게 비켜 섬
    road([27, 30, 30, 121]); road([6, 116, 134, 119]); road([6, 61, 134, 64]); road([6, 25, 134, 28]);
    road([A.campRoad[0], A.campRoad[2], A.campRoad[1], C[3]]); road([A.gate, 119, A.gate + 3, A.market[3] + 2]);
    road([A.gate, A.quay[3], A.gate + 3, A.streets[1][1]]); road([T.cx - 1, T.cy - T.r - 1, T.cx + 2, A.theaterSquare[3]]); road([sx - 1, S[1], sx + 2, S[3]]);
  });
}

// ---------- 8격 — 원탁의 성 카멜롯 (손으로 짠 지도, 사용자 결정 2026-11-25) ----------
// 「검에 이름을 붙인 자들이 원탁에 모인다. 빈자리 하나는 아직 주인이 없다.」 — 유럽 곳곳의 기사들이 원탁의 빈자리(위험한 자리)를 노리고 모여든 곳.
// 알렉산드리아에서 배로 남쪽 나루에 닿아 북쪽 호수로 — 바위의 검 광장(아서가 검을 뽑은 빈 바위) → 마상 시합장 → 세 갈래가 원탁의 홀 앞에서 만남.
//   떠돌이 기사단(돌아다님)  나루 마을 천막촌 — 오러 기사(서) · 성기사(동)
//   원탁의 기사(묶음 정예) 모두 성 쪽 한 갈래 (사용자 지적 2026-11-27 — 바닷가 · 숲에 흩어져 있었음): 마상 시합장 랜슬롯(우승자) → 성 안뜰 동쪽 가웨인(해가 높을수록)
//                            → 성배 예배당 갤러해드 → 안뜰 동쪽 탑 아래 트리스탄 → 안뜰 퍼시벌 → 원탁의 홀 문 베디비어(마지막까지 왕 곁) → 홀 안 위험한 자리의 모드레드(반역자)
//   거친 땅의 무리(돌아다님) 서쪽 숲 야영지 광전사 · 녹색 예배당 녹색 기사 · 동쪽 용의 둥지 용기사 · 성 앞 성당 템플 기사
//   원탁 밖의 전설들(하나뿐) 동쪽 고개 롤랑(뿔나팔) → 동문 밖 들판 엘 시드(말에 올라) · 서쪽 숲 깊은 곳 로빈 후드(숲에 숨은 의적 — 이야기가 있는 구석, 뒤에 은신처)
//   바깥 두 갈래(서쪽 숲 · 동쪽 고개와 해안)에는 원탁 밖의 무리만.
//   보스 아서왕 — 원탁의 홀 맨 안 왕좌, 호수로 나가는 뒷문을 막음. 호숫가에 호수의 여인(히든) · 안개 너머 아발론(9격)으로 가는 배.
//   숨은 곳 — 로빈 후드의 은신처(나무 울타리 속 숨은 샛길, 부자에게서 턴 보물 — 큰 상자). 작은 상자는 시합장(우승 상품) · 해안 절벽.
const CAMELOT = {
  W: 138, H: 174,
  lake: [6, 4, 132, 28], shore: [46, 20, 95, 28], pier: [68, 12, 72, 20],
  castle: [44, 28, 96, 82], hall: [56, 29, 85, 52], table: [70.5, 40.5, 4], chapel: [46, 64, 61, 81],
  cathedral: [52, 84, 89, 103], lists: [48, 106, 93, 129], fence: [70.5, 117.5, 18, 9],
  town: [20, 132, 121, 164], stone: [62, 140], sea: [6, 166, 132, 172], dock: [68, 164, 72, 171],
  forest: [6, 28, 44, 132], hideout: [6, 29, 21, 40],
  east: [96, 28, 130, 132], eastSea: [130, 28, 136, 132], ridge: [96, 66, 130, 72], pass: [106, 118],
  in: [69, 170, 3], next: [68, 11, 4], start: [70, 160], merchant: [75, 156],
  foes: {
    '랜슬롯': [78, 116], '가웨인': [86, 76], '갤러해드': [51, 70], '트리스탄': [84, 66], '퍼시벌': [77, 62], '베디비어': [76, 53], '모드레드': [60, 39],   // 원탁의 기사 일곱은 모두 성 쪽 (사용자 지적 2026-11-27)
    '롤랑': [119, 62], '엘 시드': [104, 48], '로빈 후드': [16, 44],
    '아서왕': [69, 30], '호수의 여인': [58, 23]
  },
  sections: [['남쪽 나루 · 바위의 검 광장', [20, 132, 121, 172]], ['마상 시합장', 'lists'], ['성당', 'cathedral'], ['카멜롯 성', 'castle'], ['성배 예배당', 'chapel'],
    ['원탁의 홀', 'hall'], ['호숫가', [46, 11, 95, 28]], ['서쪽 숲', 'forest'], ['로빈 후드의 은신처', 'hideout'],
    ['동문 밖 들판', [96, 28, 130, 60]], ['롤랑의 고개', [96, 60, 130, 74]], ['동쪽 해안 절벽', [96, 74, 136, 132]]],
  zones: [['오러 기사', [22, 134, 62, 162]], ['성기사', [78, 134, 120, 162]], ['템플 기사', 'cathedral'], ['광전사', [8, 100, 40, 128]], ['녹색 기사', [8, 66, 40, 96]], ['용기사', [98, 104, 128, 128]]],
  chests: [[58, 117], [126, 92], [13, 33, 'big']]
};
function camelotMap(data) {
  const A = CAMELOT;
  return handMap(data, 8, A, c => {
    const { tiles, idx, box, ring, road, secrets } = c;
    const ellipse = (cx, cy, rx, ry, fn) => { for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) fn(x, y, Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry)); };
    // 호수 · 호숫가(성벽에 둘러싸여 왕좌 뒷문으로만) · 부두 — 아발론으로 가는 배
    box(A.lake, WATER); box(A.shore, FLOOR); box(A.pier, FLOOR); box([A.next[0], A.next[1], A.next[0] + A.next[2], A.next[1] + 1], FLOOR);
    // 성 — 바깥 성벽(남 · 서 · 동 문), 원탁의 홀(남문 · 왕좌 뒷문, 가운데 둥근 원탁), 성배 예배당(동쪽 문)
    box(A.castle, FLOOR); ring(A.castle, WALL);
    ring(A.hall, WALL); box([67, A.hall[3] - 1, 74, A.hall[3]], FLOOR); box([69, A.castle[1], 72, A.hall[1] + 1], FLOOR);
    ellipse(A.table[0], A.table[1], A.table[2], A.table[2], (x, y, d) => { if (d < 1) tiles[idx(x, y)] = ROCK; });
    ring(A.chapel, WALL); box([A.chapel[2] - 1, 70, A.chapel[2], 74], FLOOR);
    box([66, A.castle[3] - 1, 75, A.castle[3]], FLOOR); box([A.castle[0], 56, A.castle[0] + 1, 61], FLOOR); box([A.castle[2] - 1, 56, A.castle[2], 61], FLOOR);
    // 성 앞 — 성당 뜰 · 마상 시합장(타원 울타리, 남북으로 트임) · 나루 마을 · 바위의 검 · 남쪽 바다와 나루
    box(A.cathedral, FLOOR); box([66, A.castle[3], 75, A.cathedral[1]], FLOOR);
    box(A.lists, FLOOR); box([64, A.cathedral[3], 77, A.lists[1]], FLOOR); box([64, A.lists[3], 77, A.town[1]], FLOOR);
    const [fx, fy, frx, fry] = A.fence;
    ellipse(fx, fy, frx, fry, (x, y, d) => { if (d >= 0.93 && d < 1.07 && Math.abs(x + 0.5 - fx) > 3) tiles[idx(x, y)] = ROCK; });
    box(A.town, FLOOR); box([A.stone[0], A.stone[1], A.stone[0] + 2, A.stone[1] + 2], ROCK);
    box(A.sea, WATER); box(A.dock, FLOOR);
    // 서쪽 숲 — 로빈 후드의 은신처(나무 울타리, 남쪽 숨은 샛길)
    box(A.forest, FLOOR);
    const Hd = A.hideout;
    ring(Hd, TREE); box([Hd[0], Hd[1], Hd[0] + 1, Hd[3]], WALL); box([Hd[0], Hd[1], Hd[2], Hd[1] + 1], WATER);
    secrets.push({ name: '숨은 샛길', x: 12, y: Hd[3] - 1, w: 2, h: 1 });
    // 동쪽 — 들판 · 롤랑의 고개(바위 등성이의 좁은 길) · 해안 절벽과 바다
    box(A.east, FLOOR); box(A.eastSea, WATER);
    wavyBand(c, { vertical: false, from: A.ridge[0], to: A.ridge[2], at: (A.ridge[1] + A.ridge[3]) / 2, half: 2.5, amp: 1.6, period: 5, tile: ROCK, seed: 81, gaps: [A.pass] });   // 롤랑의 고개 — 구불구불한 바위 등성이, 고갯길만 트임
    // 흙길 — 가운데 큰길(나루 → 원탁의 홀 문) · 서쪽 숲길 · 동쪽 고갯길 · 성 안 가로 길(서문 ↔ 동문) · 마을 가로 길
    road([69, A.hall[3], 72, A.in[1] + 1]);
    road([24, 57, 27, 151]); road([24, 57, A.castle[2] + 18, 60]); road([110, 57, 113, 151]); road([24, 148, 113, 151]);
    // 나무 — 숲에 듬성듬성 (길 · 자리 · 상자 · 은신처 둘레는 비움)
    const keep = (x, y) => nearFoe(A, x, y, 3) || (x >= 22 && x < 29) || (y >= 55 && y < 62) || (x < Hd[2] + 2 && y < Hd[3] + 2) || A.chests.some(([cx, cy]) => Math.abs(x - cx) <= 2 && Math.abs(y - cy) <= 2);
    scatterTrees(c, A.forest, keep, 8, 0.14);
    // 자연의 땅은 들쭉날쭉 — 숲의 서쪽 끝 · 호숫가 · 동쪽 바닷가 · 남쪽 나루의 물가 (성 · 마을 · 시합장은 사람이 지은 것이라 그대로)
    const wild = (x, y) => nearFoe(A, x, y, 3) || nearTile(c, ROAD, x, y, 1) || A.chests.some(([cx, cy]) => Math.abs(x - cx) <= 2 && Math.abs(y - cy) <= 2) || (x < Hd[2] + 3 && y < Hd[3] + 3);
    naturalize(c, A.forest, 'wn', 6, WALL, 82, wild);
    naturalize(c, [A.east[0], A.east[1], A.east[2], A.east[3]], 'ne', 6, WATER, 83, wild);
    naturalize(c, [A.town[0], A.town[1], A.town[2], A.town[3]], 'we', 5, WALL, 84, wild);
    naturalize(c, [A.town[0], A.town[1], A.dock[0], A.town[3]], 's', 4, WATER, 85, wild); naturalize(c, [A.dock[2], A.town[1], A.town[2], A.town[3]], 's', 4, WATER, 86, wild);
  });
}

// ---------- 9격 — 안개 너머의 아발론 (손으로 짠 지도, 사용자 결정 2026-11-25) ----------
// 「안개 너머의 사과 섬. 마나가 짙어 숨만 쉬어도 주문이 된다.」 — 마법을 쫓는 자들 · 원소의 정령 · 마녀들이 모여 사는 섬.
// 카멜롯 호수에서 배로 남쪽 안개 나루에 닿아 북쪽 수정 동굴로 — 마탑 마을에서 세 갈래가 시내 둘로 갈려 오르다 사과 과수원에서 만남.
//   마법사 학파(돌아다님) 마탑 마을 대마법사(서) · 원소술사(동) · 환상열석 소환술사 · 룬 언덕 룬 마법사 · 떡갈나무 숲 드루이드
//   4대 정령(묶음 정예)   서쪽 원소의 길 — 불의 제단 샐러맨더 → 물의 샘 운디네 → 바람 절벽 실프 → 땅굴 노움 (땅속 보물을 지킴 — 뒤에 숨은 보물방)
//   금지된 지식          가운데 — 연금 공방 거리 연금술사(돌아다님) → 파우스트의 서재 파우스트 → 금서의 탑 흑마법사(돌아다님)
//   마녀들               동쪽 — 숲 속 닭다리 오두막 바바 야가(숲의 마녀 — 이야기가 있는 구석) → 호수 위 작은 섬 키르케(여울로 건넘) → 사과 과수원 너머 궁의 모르간 르 페이
//   보스 멀린 — 궁 뒤 수정 동굴(전설에서 멀린이 갇힌 곳) 안쪽 길을 막음. 그 너머 멀린이 열어 둔 「다른 세계로 가는 문」 — 장소가 동방으로 바뀜.
//   숨은 곳 — 노움의 땅굴 안 보물방(바위 속 숨은 샛길, 큰 상자). 작은 상자는 환상열석 한가운데 · 파우스트의 서재.
const AVALON = {
  W: 142, H: 174,
  sea: [6, 0, 136, 172], land: [10, 28, 132, 166], dock: [68, 164, 72, 171],
  town: [20, 132, 121, 164], tower: [56, 140],
  westStream: [46, 64, 48, 132], eastStream: [96, 64, 98, 132],
  altarPool: [36, 114, 40, 118], circle: [35, 94, 6], spring: [38.5, 72.5, 3], crags: [[11, 46], [11, 56], [12, 47]],
  cave: [11, 29, 41, 42], hoard: [11, 29, 21, 38],
  study: [50, 74, 66, 90], tomes: [74, 64, 94, 82],
  orchard: [44, 40, 106, 64], palace: [52, 24, 88, 40], crystal: [54, 9, 86, 25], portal: [62, 2, 80, 7],
  lake: [106, 40, 132, 64], islet: [114, 44, 128, 56], ford: [119, 56, 123, 64], wood: [98, 64, 132, 134],
  in: [69, 170, 3], next: [68, 1, 4], start: [70, 160], merchant: [75, 156],
  foes: {
    '샐러맨더': [30, 118], '운디네': [30, 68], '실프': [14, 50], '노움': [32, 33],
    '파우스트': [56, 80], '바바 야가': [122, 84], '키르케': [119, 48], '모르간 르 페이': [58, 30], '멀린': [69, 7]
  },
  sections: [['안개 나루 · 마탑 마을', [20, 132, 121, 174]], ['불의 제단', [10, 106, 46, 132]], ['환상열석', [10, 82, 46, 106]], ['물의 샘', [10, 62, 46, 82]],
    ['바람 절벽', [10, 42, 44, 62]], ['노움의 땅굴', 'cave'], ['노움의 보물방', 'hoard'], ['룬 언덕', [48, 106, 96, 132]], ['연금 공방 거리', [48, 90, 96, 106]],
    ['파우스트의 서재', 'study'], ['금서의 탑', 'tomes'], ['떡갈나무 숲', [98, 104, 132, 134]], ['바바 야가의 숲', [98, 64, 132, 104]], ['키르케의 섬', 'lake'],
    ['사과 과수원', 'orchard'], ['모르간의 궁', 'palace'], ['멀린의 수정 동굴', [54, 2, 86, 25]]],
  zones: [['대마법사', [22, 136, 62, 162]], ['원소술사', [78, 136, 120, 162]], ['소환술사', [10, 84, 44, 104]], ['룬 마법사', [50, 108, 94, 130]],
    ['연금술사', [50, 92, 94, 104]], ['드루이드', [104, 104, 132, 132]], ['흑마법사', [75, 65, 93, 81]]],
  chests: [[35, 94], [53, 77], [15, 32, 'big']]
};
function avalonMap(data) {
  const A = AVALON;
  return handMap(data, 9, A, c => {
    const { tiles, idx, box, ring, road, secrets } = c;
    const disk = (cx, cy, r, t) => { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) < r) tiles[idx(x, y)] = t; };
    // 바다로 둘러싼 섬 · 남쪽 안개 나루 · 마탑 마을(가운데 서쪽에 마탑)
    box(A.sea, WATER); box(A.land, FLOOR); box(A.dock, FLOOR);
    box([A.cave[2], A.land[1], A.palace[0], 38], WATER); box([A.palace[2], A.land[1], A.land[2], A.orchard[1]], WATER);   // 궁 양옆 북쪽 물가
    box([A.tower[0], A.tower[1], A.tower[0] + 4, A.tower[1] + 4], ROCK);
    // 세 갈래를 가르는 시내 둘 (마을 · 과수원에서만 이어짐)
    wavyBand(c, { vertical: true, from: A.westStream[1], to: A.westStream[3], at: 47, half: 1.2, amp: 1.2, period: 6, tile: WATER, seed: 91 });
    wavyBand(c, { vertical: true, from: A.eastStream[1], to: A.eastStream[3], at: 97, half: 1.2, amp: 1.2, period: 7, tile: WATER, seed: 92, phase: 2 });
    // 서쪽 원소의 길 — 불의 제단(용암 웅덩이) · 환상열석(선돌 여덟) · 물의 샘 · 바람 절벽(바위) · 땅굴(바위 테, 남문 · 동문, 안쪽 보물방)
    box(A.altarPool, WATER);
    const [ccx, ccy, cr] = A.circle;
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; tiles[idx(Math.round(ccx + Math.cos(a) * cr), Math.round(ccy + Math.sin(a) * cr))] = ROCK; }
    disk(A.spring[0], A.spring[1], A.spring[2], WATER);
    for (const [x, y] of A.crags) tiles[idx(x, y)] = ROCK;
    const Cv = A.cave;
    box([Cv[0], Cv[1] - 1, Cv[2] + 4, Cv[1]], WATER);
    ring(Cv, ROCK); box([24, Cv[3] - 1, 28, Cv[3]], FLOOR); box([Cv[2] - 1, 38, A.orchard[0] + 2, 42], FLOOR);
    const Hd = A.hoard;
    for (let y = Hd[1]; y < Hd[3]; y++) tiles[idx(Hd[2] - 1, y)] = ROCK;
    for (let x = Hd[0]; x < Hd[2]; x++) tiles[idx(x, Hd[3] - 1)] = ROCK;
    secrets.push({ name: '숨은 샛길', x: 15, y: Hd[3] - 1, w: 2, h: 1 });
    // 가운데 금지된 지식 — 룬 언덕(룬 돌) · 연금 공방 거리 · 파우스트의 서재(담, 동문) · 금서의 탑(담, 서문)
    for (let y = 112; y < 130; y += 8) for (let x = 54; x < 94; x += 8) if (x < 64 || x > 76) tiles[idx(x, y)] = ROCK;
    ring(A.study, WALL); box([A.study[2] - 1, 80, A.study[2], 85], FLOOR);
    ring(A.tomes, WALL); box([A.tomes[0], 70, A.tomes[0] + 1, 75], FLOOR);
    // 동쪽 마녀의 숲 — 호수와 작은 섬(여울로 건넘)
    box(A.lake, WATER); box(A.islet, FLOOR); box(A.ford, FLOOR);
    // 북쪽 — 사과 과수원 · 모르간의 궁(담, 남 · 북 문) · 멀린의 수정 동굴(바위 테, 수정 기둥) · 다른 세계로 가는 문의 방
    box(A.crystal, FLOOR); ring(A.crystal, ROCK);
    for (const [x, y] of [[59, 13], [80, 13], [61, 20], [78, 19], [64, 16], [75, 16]]) box([x, y, x + 2, y + 2], ROCK);
    box(A.palace, FLOOR); ring(A.palace, WALL);
    box([66, A.palace[3] - 1, 75, A.palace[3]], FLOOR); box([69, A.palace[1], 72, A.palace[1] + 1], FLOOR);
    box(A.portal, FLOOR); box([69, A.portal[3], 72, A.crystal[1] + 1], FLOOR); box([A.next[0], A.next[1], A.next[0] + A.next[2], A.next[1] + 1], FLOOR);
    // 흙길 — 가운데 큰길(나루 → 수정 동굴) · 서쪽 원소의 길(→ 땅굴 남문) · 동쪽 숲길 · 마을 가로 길 · 과수원 가로 길
    road([69, A.crystal[1] + 1, 72, A.in[1] + 1]); road([24, 41, 28, 152]); road([24, 148, 104, 152]); road([100, 52, 104, 152]); road([24, 51, 104, 55]);
    // 나무 — 과수원은 줄 맞춘 사과나무, 동쪽 숲은 듬성듬성 (길 · 자리 · 상자 곁은 비움)
    const nearRoad = (x, y) => { for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (tiles[idx(x + i, y + j)] === ROAD) return true; return false; };
    const keep = (x, y) => nearFoe(A, x, y, 3) || nearRoad(x, y) || A.chests.some(([cx, cy]) => Math.abs(x - cx) <= 2 && Math.abs(y - cy) <= 2);
    const O = A.orchard;
    for (let y = O[1] + 2; y < O[3] - 1; y++) for (let x = O[0] + 2; x < O[2] - 1; x++) if (x % 4 === 1 && y % 4 === 2 && tiles[idx(x, y)] === FLOOR && !keep(x, y)) tiles[idx(x, y)] = TREE;
    scatterTrees(c, A.wood, keep, 9, 0.14);
    // 마지막 손질 — 바닷가 · 호숫가 · 시냇가를 들쭉날쭉하게 (나루 · 여울 · 길 · 자리 · 상자 · 땅굴 곁은 그대로)
    const inR = (r, x, y, m) => x >= r[0] - m && x < r[2] + m && y >= r[1] - m && y < r[3] + m;
    const wild = (x, y) => keep(x, y) || nearTile(c, ROAD, x, y, 2) || inR(A.cave, x, y, 1) || inR([60, 150, 82, 172], x, y, 0) || inR(A.ford, x, y, 2)
      || inR(A.palace, x, y, 1) || inR(A.crystal, x, y, 1) || inR(A.study, x, y, 1) || inR(A.tomes, x, y, 1) || inR([A.tower[0], A.tower[1], A.tower[0] + 4, A.tower[1] + 4], x, y, 2);
    naturalize(c, [A.land[0], A.land[1], A.land[2], A.land[3]], 'wes', 9, WATER, 94, wild);   // 바닷가 — 만 · 곶
    erodeShore(c, A.land, WATER, 3, 93, wild);                                            // 호숫가 · 시냇가 · 궁 양옆 물가
  });
}

// ---------- 10격 — 천하제일 비무대 (손으로 짠 지도, 사용자 결정 2026-11-25) ----------
// 「강호에 이름 석 자를 남기려는 자들이 오른다. 걸어서 내려간 자는 손에 꼽는다.」 — 산꼭대기 비무대의 무림대회, 문파 · 세가가 오르는 길목마다 자리를 잡음.
// 멀린의 문으로 산 아래 객잔 마을에 닿아 북쪽 산꼭대기로 — 바위 등성이 둘로 갈린 세 갈래가 비무대 앞 관전석에서 만남.
//   강호의 밑바닥(돌아다님) 객잔 마을 — 뒷골목 흑도 낭인 · 장터 개방 장로
//   불가(서쪽)              아미산 암자 아미파 사태 → 소림사 소림 나한(돌아다님) → 뒷산 면벽 동굴 달마(벽을 보고 아홉 해 — 이야기가 있는 구석)
//   오대세가(가운데)         세가 거리의 장원들 — 남궁세가 가주 → 독 연못의 사천당가 독수 → 모용세가 공자 → 진법 정원의 제갈세가 군사(기관 미로 속) → 비무대 바로 아래 하북팽가 도객
//   도가(동쪽)              무당산 도관 무당 도사 → 화산 매화 숲 매화검수(돌아다님) → 태극 마당 장삼봉 (도가의 큰 스승 — 뒤)
//   북해빙궁(도가 아님)      도가의 길 끝 눈 덮인 능선에 머문 사절단의 야영지 — 북해빙궁 무사(돌아다님)
//   보스 천마 — 비무대 위, 천산으로 가는 북쪽 눈길을 막음 (11격 만년설 덮인 천산 — 장소는 그대로 동방).
//   숨은 곳 — 능선 절벽의 숨은 동굴(기연 — 옛 고수가 남긴 비급, 큰 상자). 작은 상자는 객잔 · 당가 독 연못가.
const MURIM = {
  W: 142, H: 174,
  low: [10, 46, 134, 166], plaza: [32, 28, 100, 46], ridgeTop: [98, 28, 134, 46],
  ridges: [[46, 60, 50, 134], [94, 56, 98, 134]],
  inn: [48, 136, 64, 148], hermitage: [16, 110, 28, 120], shaolin: [14, 74, 34, 100], dharma: [12, 40, 32, 58],
  manors: { namgung: [50, 112, 66, 128], tang: [74, 96, 92, 112], murong: [50, 80, 66, 96], zhuge: [74, 62, 92, 80], peng: [50, 46, 66, 62] },
  pond: [86, 98, 90, 102], wudang: [108, 108, 126, 126], plum: [98, 76, 134, 104], cave: [123, 35, 135, 49],
  stage: [58, 10, 82, 28], snow: [62, 2, 80, 7],
  in: [69, 166, 3], next: [68, 1, 4], start: [70, 160], merchant: [74, 156],
  foes: {
    '남궁세가 가주': [55, 119], '사천당가 독수': [80, 104], '모용세가 공자': [56, 87], '제갈세가 군사': [81, 63], '하북팽가 도객': [56, 52],
    '달마': [14, 44], '장삼봉': [114, 64], '천마': [69, 11]
  },
  sections: [['객잔 마을', [20, 134, 121, 168]], ['객잔', 'inn'], ['아미산 암자', [10, 102, 46, 134]], ['소림사', [10, 70, 46, 102]], ['달마의 면벽 동굴', 'dharma'],
    ['세가 거리', [50, 46, 94, 134]], ['남궁세가', [50, 112, 66, 128]], ['사천당가', [74, 96, 92, 112]], ['모용세가', [50, 80, 66, 96]], ['제갈세가 진법 정원', [74, 62, 92, 80]], ['하북팽가', [50, 46, 66, 62]],
    ['무당산 도관', [98, 104, 134, 134]], ['화산 매화 숲', 'plum'], ['태극 마당', [98, 56, 134, 76]], ['눈 덮인 능선 — 북해빙궁 사절단의 야영지', [98, 28, 134, 56]], ['기연의 동굴', 'cave'],   // 북해빙궁은 도가가 아님 — 능선에 머문 사절단
    ['비무대 앞 관전석', 'plaza'], ['천하제일 비무대', [58, 2, 82, 28]]],
  zones: [['흑도 낭인', [22, 150, 66, 164]], ['개방 장로', [76, 136, 120, 162]], ['아미파 사태', [12, 104, 44, 132]], ['소림 나한', [12, 72, 44, 102]],
    ['무당 도사', [100, 104, 130, 132]], ['화산파 매화검수', [100, 78, 130, 102]], ['북해빙궁 무사', [100, 30, 122, 54]]],
  chests: [[52, 140], [87, 108], [129, 41, 'big']]
};
function murimMap(data) {
  const A = MURIM;
  return handMap(data, 10, A, c => {
    const { tiles, idx, box, ring, road, secrets } = c;
    // 산 — 아래 땅 · 비무대 앞 관전석 · 동쪽 능선 꼭대기, 세 갈래를 가르는 바위 등성이 둘
    box(A.low, FLOOR); box(A.plaza, FLOOR); box(A.ridgeTop, FLOOR);
    const [rw, re] = A.ridges;                                                             // 굽이치는 바위 등성이 (세가 장원 담과 길 사이)
    wavyBand(c, { vertical: true, from: rw[1], to: rw[3], at: 45.5, half: 2, amp: 1.5, period: 7, tile: ROCK, seed: 101 });
    wavyBand(c, { vertical: true, from: re[1], to: re[3], at: 96.5, half: 2, amp: 1.5, period: 6, tile: ROCK, seed: 102, phase: 1.5 });
    box([A.in[0], A.low[3], A.in[0] + 3, A.in[1] + 1], FLOOR);                               // 멀린의 문으로 들어서는 곳
    // 객잔 마을 — 객잔(담, 동문)
    ring(A.inn, WALL); box([A.inn[2] - 1, 141, A.inn[2], 145], FLOOR);
    // 서쪽 불가 — 아미산 암자(작은 담) · 소림사(담, 남북 문) · 면벽 동굴(바위, 동쪽 입구)
    ring(A.hermitage, WALL); box([A.hermitage[2] - 1, 113, A.hermitage[2], 117], FLOOR);
    ring(A.shaolin, WALL); box([22, A.shaolin[3] - 1, 27, A.shaolin[3]], FLOOR); box([22, A.shaolin[1], 27, A.shaolin[1] + 1], FLOOR);
    box(A.dharma, FLOOR); ring(A.dharma, ROCK); box([A.dharma[2] - 1, 50, A.dharma[2], 55], FLOOR);
    // 가운데 세가 거리 — 장원마다 담, 큰길 쪽 문 · 당가 독 연못 · 제갈 진법 정원(바위 미로, 맨 안쪽에 군사)
    for (const [k, m] of Object.entries(A.manors)) {
      ring(m, WALL);
      const west = m[0] < 69, dy = k === 'zhuge' ? m[3] - 4 : ((m[1] + m[3]) >> 1) - 2;
      box(west ? [m[2] - 1, dy, m[2], dy + 4] : [m[0], dy, m[0] + 1, dy + 4], FLOOR);
    }
    box(A.pond, WATER);
    const Z = A.manors.zhuge;
    box([Z[0] + 1, 67, Z[2] - 5, 68], ROCK); box([Z[0] + 5, 71, Z[2] - 1, 72], ROCK); box([Z[0] + 1, 75, Z[2] - 5, 76], ROCK);
    // 동쪽 도가 — 무당산 도관(담, 남북 문) · 매화 숲 · 기연의 동굴(바위 테, 서쪽 벽 속 숨은 샛길)
    ring(A.wudang, WALL); box([115, A.wudang[3] - 1, 120, A.wudang[3]], FLOOR); box([115, A.wudang[1], 120, A.wudang[1] + 1], FLOOR);
    box(A.cave, FLOOR); ring(A.cave, ROCK);
    secrets.push({ name: '숨은 샛길', x: A.cave[0], y: 41, w: 1, h: 2 });
    // 산꼭대기 비무대 — 돌 테두리, 남쪽 오르는 계단 · 북쪽 천산으로 가는 눈길
    box(A.stage, FLOOR); ring(A.stage, ROCK);
    box([66, A.stage[3] - 1, 75, A.stage[3]], FLOOR); box([69, A.snow[3], 72, A.stage[1] + 1], FLOOR);
    box(A.snow, FLOOR); box([A.next[0], A.next[1], A.next[0] + A.next[2], A.next[1] + 1], FLOOR);
    // 흙길 — 가운데 세가 거리(마을 → 비무대) · 서쪽 불가의 길 · 동쪽 도가의 길 · 마을 가로 길 · 관전석 가로 길
    road([69, A.stage[3] - 1, 72, A.in[1] + 1]); road([36, 44, 40, 152]); road([102, 30, 106, 152]); road([24, 148, 106, 152]); road([36, 43, 106, 46]);
    // 매화나무 — 화산 매화 숲에 듬성듬성
    const nearRoad = (x, y) => { for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (tiles[idx(x + i, y + j)] === ROAD) return true; return false; };
    scatterTrees(c, A.plum, (x, y) => nearFoe(A, x, y, 3) || nearRoad(x, y), 10, 0.12);
    // 마지막 손질 — 산비탈 가장자리를 들쭉날쭉하게 (장원 · 절 · 도관 · 동굴 · 비무대 · 길 · 자리 · 상자 곁은 그대로)
    const inR = (r, x, y, m) => x >= r[0] - m && x < r[2] + m && y >= r[1] - m && y < r[3] + m;
    const built = [A.inn, A.hermitage, A.shaolin, A.dharma, ...Object.values(A.manors), A.wudang, A.cave, A.stage, [60, 150, 82, 172]];
    const wild = (x, y) => nearFoe(A, x, y, 3) || nearTile(c, ROAD, x, y, 2) || built.some(r => inR(r, x, y, 2))
      || A.chests.some(([cx, cy]) => Math.abs(x - cx) <= 2 && Math.abs(y - cy) <= 2);
    const L = [A.low[0] - 7, A.low[1], A.low[2] + 6, A.low[3]];                                  // 비탈을 바깥으로 넓혔다가 깎음
    box([L[0], L[1], A.low[0], L[3]], FLOOR); box([A.low[2], A.cave[3] + 1, L[2], L[3]], FLOOR);   // 동쪽은 기연 동굴 바위 테 아래부터
    naturalize(c, L, 'wes', 12, WALL, 103, wild);
    naturalize(c, A.plaza, 'nw', 5, WALL, 104, wild);
    naturalize(c, A.ridgeTop, 'ne', 5, WALL, 105, wild);
  });
}

// ---------- 11격 — 만년설 덮인 천산 (손으로 짠 지도, 사용자 결정 2026-11-25) ----------
// 「무림인이 평생을 걸고 찾는 내단의 주인들이 산다. 대개는 찾는 쪽이 먹힌다.」 — 천 년 묵은 것들이 높이마다 나뉘어 사는 산 하나.
// 사신수는 방위가 정체성이라(청룡 동 · 백호 서 · 주작 남 · 현무 북) 남 → 북 한 방향으로는 레벨과 방위가 안 맞아서, 산을 빙빙 돌며 오르는 나선 길로 짬.
//   바깥 고리(산허리)  남쪽 기슭(백년 영사 · 금잠고) → 동쪽(청룡 제단 · 금두꺼비 연못) → 북쪽(산삼 숲 · 여우 고개의 구미호) → 서쪽(빙하 빙잠 · 백호 제단
//                      · 곰 동굴의 웅녀 — 쑥과 마늘로 백 일, 이야기가 있는 구석 · 산군 — 그 산의 주인) → 남서쪽에서 한 단 올라
//   안쪽 고리(높은 비탈) 남쪽(주작 제단) → 남동쪽 절벽 둥지(금시조 — 용을 노림) → 동쪽 불 밟는 온천(화린) → 북쪽(현무 제단) → 서쪽 만 년 호수(금강영구) → 정상 어귀
//   정상 천지          이무기가 하늘로 오르는 둑을 막음 (12격 잊혀진 성역 — 장소가 신화의 땅으로). 꺾어 태평해지면 봉황(히든)이 내려앉음.
// 갈림길 대신 산 반대편이 안 보이는 맛 — 모퉁이를 돌 때마다 새 방위가 열림. 바깥 · 안쪽 고리는 제 길목 바로 옆을 막아 한 방향으로만 돎.
//   숨은 곳 — 산을 뚫은 얼음 동굴(바깥 서쪽 ↔ 안쪽 북서쪽, 양쪽 바위 속 숨은 샛길 — 찾으면 한 바퀴 반을 건너뜀, 만년 한철 — 큰 상자). 작은 상자는 산삼 숲 · 금시조 둥지 아래.
// 둥근 산 — 가운데(C)에서 잰 거리(ρ, 방위마다 조금씩 출렁임)로 고리를 나눔. 각도는 동 0° · 남 90° · 서 180° · 북 -90°(화면 아래가 남).
// 바깥 고리는 남 → 동 → 북 → 서로 돌고(시계 반대), 남서쪽 비탈(step)로 한 단 올라 안쪽 고리도 같은 쪽으로 돌아 서쪽 정상 어귀(gate)로.
const TIANSHAN = {
  W: 150, H: 150, C: [75, 75],
  rho: { summit: 21, summitWall: 25, divider: 42, outer: 46, edge: 68 },   // 정상 < 21 · 바위 띠 < 25 · 안쪽 고리 < 42 · 바위 띠 < 46 · 바깥 고리 < 68
  roads: { outer: 54, inner: 30 },
  step: 130, outerBlock: 117, innerBlock: 150, gate: 190,                    // 각도 — 한 단 오르는 비탈 · 들머리 서쪽 막이 · 올라선 곳 서쪽 막이 · 정상 어귀
  bear: [160, 47], ice: [-140, 44],                                          // 곰 동굴 · 얼음 동굴 (바위 띠를 파고든 굴, [각도, ρ])
  lake: [75.5, 72, 12], pier: [73, 65, 78, 85],
  frog: [-25, 62, 3], tarn: [-150, 37, 3], springs: [2, 37, 2.5], nest: [48, 37],
  at: { '청룡': [8, 61.5], '구미호': [-100, 61.5], '백호': [180, 61.5], '웅녀': [160, 47], '산군': [142, 61.5], '주작': [95, 36.5], '금시조': [48, 38.5], '현무': [-90, 36.5], '봉황': [40, 15.5] },
  zoneAt: { '백년 영사': [68, 61, 8], '금잠고': [38, 61, 8], '세 발 금두꺼비': [-25, 61, 9], '천년 산삼 동자': [-68, 61, 9], '빙잠': [-125, 61, 8], '화린': [0, 36, 7], '금강영구': [-148, 36, 7] },
  in: [74, 146, 3], next: [73, 65, 4],
  chestAt: [[-74, 64], [40, 27]]
};
function tianshanMap(data) {
  const A = TIANSHAN, [cx, cy] = A.C, R = A.rho, rad = d => d * Math.PI / 180, W = A.W, H = A.H;
  const zi = data.ZONES.findIndex(z => z.rank === 11), foes = data.ENEMIES.filter(e => e.zoneIndex === zi);
  const wob = a => 1 + 0.035 * Math.sin(2 * a + 0.7) + 0.025 * Math.sin(3 * a + 2.1) + 0.015 * Math.sin(5 * a);   // 방위마다 산자락이 조금씩 나고 듦
  const at = (deg, r) => [cx + Math.cos(rad(deg)) * r * wob(rad(deg)), cy + Math.sin(rad(deg)) * r * wob(rad(deg))];
  const noise = valueNoise(11);
  const polar = (x, y) => { const dx = x + 0.5 - cx, dy = y + 0.5 - cy, a = Math.atan2(dy, dx); return [Math.hypot(dx, dy) / wob(a) * (1 + (noise(x * 0.09, y * 0.09) - 0.5) * 0.06), a * 180 / Math.PI]; };
  const angDiff = (a, b) => Math.abs(((a - b) % 360 + 540) % 360 - 180);
  const cell = ([x, y]) => [Math.round(x), Math.round(y)];
  const spot = {};
  for (const [name, [deg, r]] of Object.entries(A.at)) { const n = foes.find(e => e.name === name).size, [x, y] = at(deg, r); spot[name] = [Math.round(x - n / 2), Math.round(y - n / 2)]; }
  spot['이무기'] = [73, 80];                                                   // 천지 둑 위 — 하늘로 오르는 길을 몸으로 막음
  const zrect = ([deg, r, h]) => { const [x, y] = cell(at(deg, r)); return [x - h, y - h, x + h, y + h]; };
  const iceC = cell(at(...A.ice)), bearC = cell(at(...A.bear));
  const iceR = [iceC[0] - 6, iceC[1] - 6, iceC[0] + 7, iceC[1] + 7], bearR = [bearC[0] - 6, bearC[1] - 6, bearC[0] + 7, bearC[1] + 7];
  const start = cell(at(90, 62)), merchant = cell(at(82, 62));
  const spec = { ...A, foes: spot, start, merchant, sections: [['웅녀의 곰 동굴', bearR], ['얼음 동굴', iceR]],
    zones: Object.entries(A.zoneAt).map(([n, z]) => [n, zrect(z)]),
    chests: [...A.chestAt.map(([d, r]) => cell(at(d, r))), [iceC[0], iceC[1], 'big']] };
  return handMap(data, 11, spec, c => {
    const { tiles, idx, box, road, secrets, shapes } = c;
    const disk = (x0, y0, r0, t) => { for (let y = Math.floor(y0 - r0); y <= y0 + r0; y++) for (let x = Math.floor(x0 - r0); x <= x0 + r0; x++) if (Math.hypot(x + 0.5 - x0, y + 0.5 - y0) < r0) tiles[idx(x, y)] = t; };
    // 산 — 바깥 고리 · 바위 띠 · 안쪽 고리 · 바위 띠 · 정상. 한 방향으로만 돌게 막이 둘, 한 단 오르는 비탈 · 정상 어귀
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const [r, d] = polar(x, y);
      if (r >= R.edge) continue;
      let t = r < R.summit ? FLOOR : r < R.summitWall ? ROCK : r < R.divider ? FLOOR : r < R.outer ? ROCK : FLOOR;
      if (r >= R.outer - 1 && angDiff(d, A.outerBlock) < 2.6) t = ROCK;                         // 바깥 — 들머리 서쪽을 막는 바위 줄기
      if (r >= R.summitWall - 1 && r < R.divider + 1 && angDiff(d, A.innerBlock) < 4) t = ROCK;   // 안쪽 — 올라선 곳 서쪽
      if (r >= R.divider - 1 && r < R.outer + 1 && angDiff(d, A.step) < 3.2) t = FLOOR;          // 남서쪽 한 단 오르는 비탈
      if (r >= R.summit - 1 && r < R.summitWall + 1 && angDiff(d, A.gate) < 5) t = FLOOR;         // 정상 서쪽 어귀
      tiles[idx(x, y)] = t;
    }
    box([A.in[0], cy + 60, A.in[0] + A.in[2], A.in[1] + 1], FLOOR);                              // 들머리 (남쪽 기슭)
    // 물 — 정상 천지(하늘로 오르는 둑), 금두꺼비 연못, 만 년 호수, 불 밟는 온천
    disk(A.lake[0], A.lake[1], A.lake[2], WATER); box(A.pier, FLOOR);
    for (const [d, r, rr] of [A.frog, A.tarn, A.springs]) { const [x, y] = at(d, r); disk(x, y, rr, WATER); }
    // 금시조의 절벽 둥지 — 둥지 둘레 바위
    { const [x, y] = spot['금시조']; for (const [i, j] of [[-2, -1], [-2, 0], [5, 2], [5, 3], [1, -2], [2, -2]]) tiles[idx(x + i, y + j)] = ROCK; }
    // 굴 — 바위 띠를 파고든 둥근 굴 (바위 테). 곰 동굴은 바깥 길 쪽으로 입구, 얼음 동굴은 양쪽 바위 속 숨은 샛길 (바깥 서쪽 ↔ 안쪽 북서쪽)
    const cave = ([x0, y0], t0) => { for (let y = y0 - 6; y <= y0 + 6; y++) for (let x = x0 - 6; x <= x0 + 6; x++) { const h = Math.hypot(x - x0, y - y0); if (h < 4.6) tiles[idx(x, y)] = FLOOR; else if (h < 5.8) tiles[idx(x, y)] = t0; } };
    cave(bearC, ROCK); cave(iceC, ROCK);
    const toward = ([x0, y0], deg, k) => [Math.round(x0 + Math.cos(rad(deg)) * k), Math.round(y0 + Math.sin(rad(deg)) * k)];
    for (let k = 4; k <= 7; k++) { const [x, y] = toward(bearC, A.bear[0], k); box([x - 1, y - 1, x + 2, y + 2], FLOOR); }
    const iceDoor = sgn => { const cells = []; for (let k = 4; k <= 7; k++) { const [x, y] = toward(iceC, A.ice[0], sgn * k); for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) if (tiles[idx(x + i, y + j)] !== FLOOR && tiles[idx(x + i, y + j)] !== ROAD) cells.push([x + i, y + j]); } return cells; };
    for (const sgn of [1, -1]) for (const [x, y] of iceDoor(sgn)) { tiles[idx(x, y)] = ROCK; secrets.push({ name: '숨은 샛길', x, y, w: 1, h: 1 }); }
    // 구간 — 고리마다 네 방위 (땅 모양대로)
    const sector = (x, y) => {
      const [r, d] = polar(x, y); if (r >= R.edge) return null;
      if (r < R.summit) return '정상 천지';
      if (r >= R.summitWall && r < R.divider) return angDiff(d, 102) < 48 ? '남쪽 높은 비탈 — 주작의 제단' : angDiff(d, 5) < 49 ? '동쪽 높은 비탈 — 불 밟는 온천' : angDiff(d, -90) < 45 ? '북쪽 높은 비탈 — 현무의 제단' : '서쪽 높은 비탈 — 만 년 호수';
      if (r >= R.outer) return angDiff(d, 95) < 40 ? '천산 기슭' : angDiff(d, 5) < 50 ? '동쪽 산허리 — 청룡의 제단' : angDiff(d, -90) < 45 ? '북쪽 산허리 — 여우 고개' : '서쪽 산허리 — 백호의 제단';
      return null;
    };
    const groups = {};
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const s0 = sector(x, y); if (s0 && tiles[idx(x, y)] !== WALL) (groups[s0] = groups[s0] || new Set()).add(idx(x, y)); }
    for (const [n, cells] of Object.entries(groups)) shapes.push([n, solidShape(cells, W)]);
    // 흙길 — 바깥 고리(남 → 동 → 북 → 서 → 남서 비탈) · 비탈 오름 · 안쪽 고리(남 → 동 → 북 → 서 → 정상 어귀)
    const seg = (p0, p1) => { const n = Math.ceil(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) * 2); for (let k = 0; k <= n; k++) { const x = p0[0] + (p1[0] - p0[0]) * k / n, y = p0[1] + (p1[1] - p0[1]) * k / n; road([Math.round(x) - 1, Math.round(y) - 1, Math.round(x) + 2, Math.round(y) + 2]); } };
    const arc = (r, a0, a1) => { const n = Math.ceil(Math.abs(a1 - a0) / 1.5); let prev = at(a0, r); for (let k = 1; k <= n; k++) { const cur = at(a0 + (a1 - a0) * k / n, r); seg(prev, cur); prev = cur; } };
    seg([A.in[0] + 1, A.in[1]], at(90, A.roads.outer));
    arc(A.roads.outer, 90, A.step - 360);
    seg(at(A.step, A.roads.outer), at(A.step, A.roads.inner));
    arc(A.roads.inner, A.step, A.gate - 360);
    seg(at(A.gate, A.roads.inner), at(A.gate, R.summit - 2));
    // 나무 — 북동쪽 산삼 숲 (길 · 자리 · 상자 곁은 비움)
    const chest = spec.chests;
    const keep = (x, y) => { const [r, d] = polar(x, y); return r < R.outer + 1 || angDiff(d, -68) > 22 || nearFoe(spec, x, y, 3) || nearTile(c, ROAD, x, y, 1) || chest.some(([qx, qy]) => Math.abs(x - qx) <= 2 && Math.abs(y - qy) <= 2); };
    scatterTrees(c, [70, 0, 140, 50], keep, 11, 0.16);
  });
}

// ---------- 12격 — 잊혀진 성역 (손으로 짠 지도, 사용자 결정 2026-11-25) ----------
// 「신화에 이름이 실린 짐승들이 여기 숨어 있다.」 — 13격 보스가 헤라클레스라, 그가 아직 오지 않은 열두 과업의 짐승들이 기다리는 땅.
// 이무기가 오르려던 하늘길 끝 구름 계단을 내려와 남쪽 성스러운 숲에 닿아 북쪽 잊혀진 신전으로 — 바위 등성이 둘로 갈린 세 갈래가 세상 끝 광장에서 만남.
//   서쪽 바다의 과업   크레타 섬(여울로 건넘)의 황소 → 해협 모래톱에 도사린 크라켄 → 세상 서쪽 끝 섬 에리테이아의 게리온 (게리온 · 헤스페리데스는 전설에서 서쪽 끝)
//   가운데 신성한 짐승 성스러운 숲 유니콘(돌아다님) → 히포크레네 샘의 페가수스(하나뿐) → 테베 성문 옆 수수께끼의 스핑크스 → 재의 제단 피닉스(하나뿐) → 바람 절벽 히포그리프(돌아다님)
//   동쪽 땅의 과업     네메아의 사자 굴 → 케리네이아 숲의 사슴 → 에리만토스 설산의 멧돼지 → 스팀팔로스 늪의 새 → 북동쪽 트라키아 마구간의 디오메데스의 말
//   세상 끝 광장       북동쪽 저승 어귀(타이나론 동굴) 앞 케르베로스 → 북서쪽 헤스페리데스 정원의 황금 사과나무를 감은 라돈 → 가운데 잊혀진 신전의 성역의 수호룡(천 년을 한 자리에서 — 뒷문을 막음)
//   보스 뒤 엘리시온으로 가는 문 (13격 — 장소는 그대로 신화의 땅). 열두 과업의 짐승은 실제 과업 차례와 거의 같게 — 헤라클레스를 만나기 전에 그가 꺾을 짐승들을 먼저 봄.
//   숨은 곳 — 크레타 섬의 다이달로스의 미궁 (바위 벽 속 숨은 샛길, 두 겹 미로 한가운데 큰 상자). 작은 상자는 네메아의 사자 굴 · 헤스페리데스 정원.
const SANCTUARY = {
  W: 150, H: 176,
  south: [8, 136, 142, 166], plaza: [8, 20, 142, 50], ridges: [[48, 50, 52, 136], [98, 50, 102, 136]],
  westSea: [4, 50, 48, 136], crete: [8, 96, 46, 128], labyrinth: [10, 100, 28, 126], maze: [13, 103, 25, 123], creteFord: [34, 128, 38, 136],
  strait: [34, 80, 38, 96], shoal: [38, 80, 46, 92], erytheia: [8, 52, 46, 80], westShore: [8, 50, 46, 52],
  center: [52, 50, 98, 136], spring: [88, 120, 3], thebes: [52, 100, 98, 103], thebesGate: [66, 100, 85, 103], altar: [64, 82], crags: [[58, 58], [90, 56], [80, 66]],
  east: [102, 50, 142, 136], lionDen: [120, 112, 140, 130], marsh: [[104, 54, 110, 60], [128, 62, 134, 67], [104, 64, 108, 68]],
  stable: [118, 36, 140, 50], hades: [104, 18, 124, 28], apple: [30, 26], temple: [58, 8, 92, 34], elysion: [64, 2, 86, 8],
  in: [74, 170, 3], next: [73, 1, 4], start: [75, 160], merchant: [80, 156],
  foes: {
    '크레타의 황소': [40, 104], '크라켄': [41, 84], '게리온': [14, 60],
    '페가수스': [60, 118], '스핑크스': [88, 105], '피닉스': [60, 82],
    '네메아의 사자': [130, 120], '케리네이아의 사슴': [120, 98], '에리만토스의 멧돼지': [130, 76], '스팀팔로스의 새': [120, 58], '디오메데스의 말': [128, 42],
    '케르베로스': [112, 29], '라돈': [24, 24], '성역의 수호룡': [73, 9]
  },
  sections: [['구름 계단 끝 · 성스러운 숲', [8, 136, 142, 172]], ['크레타 섬', [8, 96, 48, 130]], ['다이달로스의 미궁', 'labyrinth'], ['해협', [8, 80, 48, 96]], ['에리테이아 — 세상 서쪽 끝 섬', [8, 50, 48, 80]],
    ['히포크레네 샘', [52, 110, 98, 136]], ['테베 성문', [52, 90, 98, 110]], ['재의 제단', [52, 72, 98, 90]], ['바람 절벽', [52, 50, 98, 72]],
    ['네메아 골짜기', [102, 110, 142, 136]], ['네메아의 사자 굴', 'lionDen'], ['케리네이아 숲', [102, 90, 142, 110]], ['에리만토스 설산', [102, 70, 142, 90]], ['스팀팔로스 늪', [102, 50, 142, 70]],
    ['세상 끝 광장', 'plaza'], ['헤스페리데스의 정원', [8, 20, 48, 50]], ['트라키아 마구간', 'stable'], ['저승 어귀 — 타이나론 동굴', [102, 18, 126, 36]], ['잊혀진 신전', [58, 1, 92, 34]]],   // 저승 어귀 — 16격 하데스의 「돌아온 자가 없는 문」과 겹치지 않게 (케르베로스가 지키던 저승 입구)
  zones: [['유니콘', [54, 138, 96, 162]], ['히포그리프', [54, 52, 96, 72]]],
  chests: [[135, 115], [36, 30], [18, 112, 'big']]
};
function sanctuaryMap(data) {
  const A = SANCTUARY;
  return handMap(data, 12, A, c => {
    const { tiles, idx, box, ring, road, secrets } = c;
    const disk = (cx, cy, r, t) => { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) < r) tiles[idx(x, y)] = t; };
    // 땅 — 남쪽 성스러운 숲 · 북쪽 세상 끝 광장, 세 갈래를 가르는 바위 등성이 둘. 구름 계단으로 들어섬
    box(A.south, FLOOR); box(A.plaza, FLOOR); box(A.center, FLOOR); box(A.east, FLOOR);
    const [rw, re] = A.ridges;                                                             // 굽이치는 바위 등성이 (곁 틈은 땅으로 메우고)
    box(rw, FLOOR); box(re, FLOOR);
    wavyBand(c, { vertical: true, from: rw[1], to: rw[3], at: 50, half: 1.6, amp: 2, period: 5, tile: ROCK, seed: 121 });
    wavyBand(c, { vertical: true, from: re[1], to: re[3], at: 100, half: 1.6, amp: 2, period: 6, tile: ROCK, seed: 122, phase: 2 });
    box([A.in[0], A.south[3], A.in[0] + A.in[2], A.in[1] + 1], FLOOR);
    // 서쪽 바다의 과업 — 바다 위 섬들을 여울 · 모래톱으로 건넘. 크레타 섬 서쪽에 다이달로스의 미궁 (바깥 벽 동쪽 숨은 샛길, 안쪽 고리는 북쪽만 트임)
    box(A.westSea, WATER); box(A.crete, FLOOR); box(A.creteFord, FLOOR); box(A.strait, FLOOR); box(A.shoal, FLOOR); box(A.erytheia, FLOOR); box(A.westShore, FLOOR);
    ring(A.labyrinth, ROCK); ring(A.maze, ROCK); box([18, A.maze[1], 20, A.maze[1] + 1], FLOOR);
    secrets.push({ name: '숨은 샛길', x: A.labyrinth[2] - 1, y: 112, w: 1, h: 2 });
    // 가운데 신성한 짐승 — 히포크레네 샘 · 테베 성벽과 성문 · 재의 제단 · 바람 절벽 바위
    disk(A.spring[0], A.spring[1], A.spring[2], WATER);
    box(A.thebes, WALL); box(A.thebesGate, FLOOR);
    for (let y = A.thebes[1]; y < A.thebes[3]; y++) for (const [x0, dx] of [[A.thebes[0] - 1, -1], [A.thebes[2], 1]]) for (let x = x0; tiles[idx(x, y)] === FLOOR; x += dx) tiles[idx(x, y)] = WALL;   // 성벽은 등성이에 닿게
    box([A.altar[0], A.altar[1], A.altar[0] + 2, A.altar[1] + 2], ROCK);
    for (const [x, y] of A.crags) box([x, y, x + 2, y + 2], ROCK);
    // 동쪽 땅의 과업 — 네메아의 사자 굴(바위 테, 서쪽 입구) · 스팀팔로스 늪 웅덩이 · 트라키아 마구간(담, 서문)
    ring(A.lionDen, ROCK); box([A.lionDen[0], 119, A.lionDen[0] + 1, 124], FLOOR);
    for (const [x0, y0, x1, y1] of A.marsh) { const ex = (x0 + x1) / 2, ey = (y0 + y1) / 2, rx = (x1 - x0) / 2 + 0.5, ry = (y1 - y0) / 2 + 0.5;   // 늪 웅덩이 — 둥글게
      for (let y = y0 - 1; y <= y1; y++) for (let x = x0 - 1; x <= x1; x++) if (((x + 0.5 - ex) / rx) ** 2 + ((y + 0.5 - ey) / ry) ** 2 < 1) tiles[idx(x, y)] = WATER; }
    ring(A.stable, WALL); box([A.stable[0], 41, A.stable[0] + 1, 46], FLOOR);
    // 세상 끝 — 저승 어귀(타이나론 동굴의 바위 절벽) · 황금 사과나무 · 잊혀진 신전(담, 남문 · 뒷문, 기둥) · 엘리시온으로 가는 문의 방
    box(A.hades, ROCK); tiles[idx(A.apple[0], A.apple[1])] = TREE;
    box(A.temple, FLOOR); ring(A.temple, WALL);
    box([70, A.temple[3] - 1, 81, A.temple[3]], FLOOR); box([73, A.temple[1], 78, A.temple[1] + 1], FLOOR);
    for (const [x, y] of [[62, 14], [86, 14], [62, 24], [86, 24]]) box([x, y, x + 2, y + 2], ROCK);
    box(A.elysion, FLOOR); box([A.next[0], A.next[1], A.next[0] + A.next[2], A.next[1] + 1], FLOOR);
    // 흙길 — 가운데(구름 계단 → 신전) · 서쪽 바다의 길(여울 · 모래톱) · 동쪽 땅의 길 · 숲 가로 길 · 광장 가로 길
    road([73, A.temple[1] + 1, 77, A.in[1] + 1]); road([34, 40, 38, 152]); road([112, 40, 116, 152]); road([34, 148, 116, 152]); road([34, 40, 116, 44]);
    // 나무 — 성스러운 숲 · 케리네이아 숲 (길 · 자리 · 상자 곁은 비움)
    const nearRoad = (x, y) => { for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (tiles[idx(x + i, y + j)] === ROAD) return true; return false; };
    const keep = (x, y) => nearFoe(A, x, y, 3) || nearRoad(x, y) || A.chests.some(([cx, cy]) => Math.abs(x - cx) <= 2 && Math.abs(y - cy) <= 2) || Math.abs(y - A.in[1]) < 12 && Math.abs(x - 75) < 8;
    scatterTrees(c, [54, 138, 96, 162], keep, 12, 0.1); scatterTrees(c, [102, 90, 142, 110], keep, 13, 0.16);
    // 마지막 손질 — 섬 바닷가 · 늪가 · 땅 가장자리를 들쭉날쭉하게 (미궁 · 신전 · 마구간 · 사자 굴 · 길 · 자리 · 상자 · 여울 곁은 그대로)
    const inR = (r, x, y, m) => x >= r[0] - m && x < r[2] + m && y >= r[1] - m && y < r[3] + m;
    const built = [A.labyrinth, A.temple, A.stable, A.lionDen, A.creteFord, A.strait, A.shoal, A.westShore, [A.in[0] - 8, A.south[3] - 14, A.in[0] + 11, A.in[1] + 1]];
    const wild = (x, y) => keep(x, y) || nearTile(c, ROAD, x, y, 2) || built.some(r => inR(r, x, y, 2));
    const isle = (x, y) => keep(x, y) || inR(A.labyrinth, x, y, 1) || inR(A.creteFord, x, y, 1) || inR(A.strait, x, y, 1) || inR(A.shoal, x, y, 1) || inR(A.westShore, x, y, 1);   // 섬은 길 곁까지 깎임
    naturalize(c, A.erytheia, 'ws', 8, WATER, 129, isle); naturalize(c, A.erytheia, 'e', 3, WATER, 130, isle);
    naturalize(c, A.crete, 'wns', 7, WATER, 131, isle); naturalize(c, A.crete, 'e', 3, WATER, 132, isle);
    erodeShore(c, [A.westSea[0], A.westSea[1], A.ridges[0][0], A.westSea[3]], WATER, 2.5, 124, isle);
    { const n = valueNoise(133); for (let y = A.westSea[1]; y < A.westSea[3]; y++) for (let x = A.westSea[0]; x < A.crete[0]; x++) if (tiles[idx(x, y)] === WATER && x - A.westSea[0] < 3.5 * n(x * 0.2, y * 0.1)) tiles[idx(x, y)] = WALL; }   // 바다 서쪽 끝
    naturalize(c, [A.south[0], A.south[1], A.ridges[0][0], A.south[1] + 6], 'n', 4, WATER, 134, wild);                       // 숲의 북쪽 바닷가
    erodeShore(c, A.east, WATER, 2, 125, wild);
    naturalize(c, A.south, 'wes', 7, WALL, 126, wild);
    naturalize(c, A.plaza, 'nwe', 6, WALL, 127, wild);
    naturalize(c, A.east, 'e', 6, WALL, 128, wild);
  });
}

// ---------- 13격 — 엘리시온 평원 (손으로 짠 지도, 사용자 결정 2026-11-25) ----------
// 「죽어서도 영웅인 자들만 이 들판을 걷는다.」 — 여러 신화의 영웅들이 저마다 제 이야기의 무대를 들판에 다시 세워 놓고 지냄. 돌아다니는 일반이 없는 격 (영웅 열 모두 하나뿐).
// 성역 신전 뒷문을 나와 남쪽 레테 강을 건너 북쪽 하늘로 오르는 계단으로 — 언덕 둘로 갈린 세 갈래가 켈트의 여울(냇물)을 건너 북쪽 먼 땅에서 만남.
//   서쪽 그리스 영웅  실타래가 걸린 돌 미로 어귀 테세우스 → 메두사 석상 정원 페르세우스 → 바닷가 배 오디세우스 → 경주로 아탈란테
//   동쪽 우루크        삼나무 숲 엔키두(흙으로 빚어진 벗) → 우루크 성벽 안 영생의 풀 웅덩이 곁 길가메시 — 벗이 앞, 왕이 뒤
//   가운데 트로이 평원 트로이 성문 앞 헥토르 ↔ 들판 건너 그리스 진영 깊숙이 아킬레우스 (두 적수가 마주 봄)
//   북쪽 먼 땅의 영웅  켈트의 여울 쿠 훌린(여울을 홀로 지킨) → 헤오로트 연회장 베오울프 → 쿠루크셰트라 전장 아르주나(전차) → 용의 둥지 지그프리트
//   보스 헤라클레스 — 북쪽 끝 하늘로 오르는 계단을 막음 (열두 과업 끝에 신이 되어 올림포스로 오른 영웅). 14격 일곱 번째 하늘 — 장소가 하늘과 지옥으로.
//   숨은 곳 — 트로이 평원의 트로이 목마 (숨은 샛길로 목마 속, 큰 상자). 작은 상자는 경주로(황금 사과) · 용의 둥지(니벨룽의 보물).
const ELYSIUM = {
  W: 146, H: 176,
  river: [8, 150, 140, 156], bridge: [72, 78], bank: [40, 156, 108, 172], plain: [8, 20, 140, 150], ridges: [[46, 68, 50, 146], [96, 68, 100, 146]],
  stream: [8, 64, 140, 68], fords: [[34, 42], [70, 81], [110, 119]],
  maze: [12, 128, 30, 146], statues: [[14, 110], [32, 110], [16, 120], [30, 120], [12, 116]], sea: [4, 88, 10, 106], ship: [5, 93, 10, 99], track: [22, 79, 9, 6],
  cedars: [100, 108, 140, 146], uruk: [104, 80, 136, 104], pool: [124, 84, 130, 88],
  troyWall: [52, 128, 94, 131], troyGate: [66, 84], camp: [52, 70, 94, 98], tents: [[80, 74], [86, 80], [80, 88], [56, 92], [90, 92]], horse: [80, 104, 92, 114],
  hall: [10, 34, 32, 54], chariot: [126, 38], lair: [52, 21, 68, 29], stairs: [73, 4, 76, 20],
  in: [73, 171, 3], next: [73, 3, 3], start: [75, 164], merchant: [82, 162],
  foes: {
    '테세우스': [32, 136], '페르세우스': [22, 114], '오디세우스': [16, 96], '아탈란테': [21, 78],
    '엔키두': [118, 126], '길가메시': [106, 86], '헥토르': [64, 122], '아킬레우스': [60, 84],
    '쿠 훌린': [84, 56], '베오울프': [16, 44], '아르주나': [122, 36], '지그프리트': [58, 23], '헤라클레스': [73, 17]
  },
  sections: [['레테 강가', [40, 150, 108, 174]], ['북쪽 먼 땅', [8, 20, 140, 64]], ['우루크 들판', [100, 68, 140, 106]],
    ['미로 어귀', [8, 126, 46, 150]], ['메두사 석상 정원', [8, 106, 46, 126]], ['오디세우스의 바닷가', [8, 90, 46, 106]], ['경주로', [8, 68, 46, 90]],
    ['삼나무 숲', [100, 106, 140, 150]], ['우루크', 'uruk'], ['트로이 성', [50, 131, 96, 150]], ['트로이 평원', [50, 98, 96, 131]], ['트로이 목마', 'horse'], ['그리스 진영', [50, 68, 96, 98]],
    ['켈트의 여울', [8, 54, 140, 68]], ['헤오로트 연회장', 'hall'], ['쿠루크셰트라 전장', [98, 30, 140, 54]], ['용의 둥지', 'lair'], ['하늘로 오르는 계단', [66, 2, 84, 20]]],
  zones: [],
  chests: [[25, 80], [64, 24], [86, 108, 'big']]
};
function elysiumMap(data) {
  const A = ELYSIUM;
  return handMap(data, 13, A, c => {
    const { tiles, idx, box, ring, road, secrets } = c;
    // 들판 — 남쪽 레테 강과 다리 · 강가, 세 갈래를 가르는 언덕 둘, 북쪽 먼 땅과 가르는 켈트의 여울(냇물 — 갈래마다 건너는 곳)
    box(A.plain, FLOOR); box(A.river, WATER); box([A.bridge[0], A.river[1], A.bridge[1], A.river[3]], FLOOR); box(A.bank, FLOOR);
    box([A.in[0], A.bank[3], A.in[0] + A.in[2], A.in[1] + 1], FLOOR);
    for (const r of A.ridges) box(r, ROCK);
    box(A.stream, WATER); for (const [x0, x1] of A.fords) box([x0, A.stream[1], x1, A.stream[3]], FLOOR);
    // 서쪽 그리스 — 돌 미로(동쪽 어귀) · 메두사의 석상들 · 바닷가와 배 · 타원 경주로(동서로 트임)
    ring(A.maze, ROCK); box([A.maze[2] - 1, 135, A.maze[2], 140], FLOOR);
    for (const [x, y] of A.statues) tiles[idx(x, y)] = ROCK;
    box(A.sea, WATER); box(A.ship, ROCK);
    const [tx, ty, trx, tryy] = A.track;
    for (let y = ty - tryy - 1; y <= ty + tryy + 1; y++) for (let x = tx - trx - 1; x <= tx + trx + 1; x++) {
      const d = Math.hypot((x + 0.5 - tx) / trx, (y + 0.5 - ty) / tryy);
      if (d >= 0.9 && d < 1.1 && Math.abs(y + 0.5 - ty) > 1.5) tiles[idx(x, y)] = ROCK;
    }
    // 동쪽 우루크 — 삼나무 숲 · 성벽(남북 문)과 영생의 풀 웅덩이
    ring(A.uruk, WALL); box([110, A.uruk[3] - 1, 119, A.uruk[3]], FLOOR); box([110, A.uruk[1], 119, A.uruk[1] + 1], FLOOR); box(A.pool, WATER);
    // 가운데 트로이 — 성벽과 성문(남쪽은 트로이 성, 북쪽은 평원) · 그리스 진영 막사 · 트로이 목마(나무 몸통, 남쪽 숨은 샛길)
    box(A.troyWall, WALL); box([A.troyGate[0], A.troyWall[1], A.troyGate[1], A.troyWall[3]], FLOOR);
    for (const [x, y] of A.tents) box([x, y, x + 2, y + 2], ROCK);
    ring(A.horse, ROCK); secrets.push({ name: '숨은 샛길', x: 85, y: A.horse[3] - 1, w: 2, h: 1 });
    // 북쪽 먼 땅 — 헤오로트 연회장(담, 동문) · 전차 · 용의 둥지(바위, 남쪽 어귀) · 하늘로 오르는 계단
    ring(A.hall, WALL); box([A.hall[2] - 1, 42, A.hall[2], 47], FLOOR);
    box([A.chariot[0], A.chariot[1], A.chariot[0] + 2, A.chariot[1] + 2], ROCK);
    ring(A.lair, ROCK); box([58, A.lair[3] - 1, 63, A.lair[3]], FLOOR);
    box(A.stairs, FLOOR); box([A.next[0], A.next[1], A.next[0] + A.next[2], A.next[1] + 1], FLOOR);
    // 흙길 — 가운데(다리 → 하늘 계단) · 서쪽 · 동쪽 · 강가 가로 길 · 북쪽 가로 길
    road([73, A.stairs[3] - 3, 77, A.in[1] + 1]); road([36, 30, 40, 150]); road([112, 30, 116, 150]); road([36, 146, 116, 150]); road([36, 30, 116, 34]);
    // 삼나무 — 엔키두의 숲 (길 · 자리 곁은 비움)
    const nearRoad = (x, y) => { for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (tiles[idx(x + i, y + j)] === ROAD) return true; return false; };
    scatterTrees(c, A.cedars, (x, y) => nearFoe(A, x, y, 3) || nearRoad(x, y), 14, 0.15);
  });
}

// ---------- 14격 — 일곱 번째 하늘 (손으로 짠 지도, 사용자 결정 2026-11-27) ----------
// 「노래가 한 번도 멈춘 적 없는 곳. 아홉 겹의 성가대가 문을 지킨다.」 — 전승의 일곱 겹 하늘, 겹마다 대천사 하나가 다스림 (대천사도 일곱 — 정예 여섯 + 보스 미카엘).
// 헤라클레스의 하늘 계단으로 진주 문 섬에 닿아 구름 섬을 하나씩 오름 — 아홉 품계 성가대를 낮은 품계부터 층마다 나누면 그 층 대천사가 그 층에서 가장 셈.
//   첫째 하늘 수호천사 · 권천사 + 라파엘(치유의 샘)    둘째 하늘 능천사 · 나팔의 천사 + 우리엘(불꽃 제단)    셋째 하늘 역천사 · 주천사 + 라구엘(심판석)
//   넷째 하늘 좌천사 + 가브리엘(하늘 문 기둥)          다섯째 하늘 지품천사 + 사리엘(달빛 관측대)          여섯째 하늘 치품천사 + 레미엘(부활의 정원)
//   일곱째 하늘 미카엘 — 왕좌 섬 뒤의 「하늘의 갈라진 틈」(루시퍼가 떨어진 곳)을 막음 → 15격 얼어붙은 코키토스 (장소는 그대로 하늘과 지옥).
// 하늘이라 반듯하게 쌓지 않음 (사용자 지적 2026-11-27 「하늘인데 왤케 대칭적이야」) — 층마다 크기가 다른 들쭉날쭉한 구름 섬이 좌우로 엇갈려 떠 있고,
// 섬 사이는 텅 빈 하늘, 휘어진 빛의 다리 두 줄(층마다 놓인 자리가 다름)로 이어져 어느 다리로 오를지 고름. 대천사는 저마다 상징 곁, 섬의 뒤(북쪽)에.
//   숨은 곳 — 다섯째 하늘 동쪽에 따로 떠 있는 에덴동산 (보이지 않는 다리 — 숨은 샛길, 생명나무 열매 — 큰 상자). 작은 상자는 둘째 하늘(일곱 나팔) · 넷째 하늘(바퀴 곁).
const HEAVEN = {
  W: 170, H: 256,
  islands: [ // [이름, 가운데 x, y, 반폭, 반높이, 대천사, 다리 두 줄이 이 섬에서 위 섬으로 떠나는 자리(가운데에서 x), 휨]
    ['진주 문', 80, 245, 17, 7, null, [[0, 0]]],
    ['첫째 하늘', 76, 214, 52, 15, '라파엘', [[-38, -14], [30, 12]]],
    ['둘째 하늘', 100, 180, 46, 12, '우리엘', [[-30, -12], [34, 14]]],
    ['셋째 하늘', 70, 146, 54, 13, '라구엘', [[-26, -10], [40, 12]]],
    ['넷째 하늘', 102, 112, 42, 12, '가브리엘', [[-32, -14], [26, 10]]],
    ['다섯째 하늘', 66, 78, 48, 12, '사리엘', [[-20, -12], [36, 14]]],
    ['여섯째 하늘', 98, 46, 44, 12, '레미엘', [[-30, -12], [28, 12]]],
    ['일곱째 하늘 — 왕좌', 84, 20, 34, 8, null, []]],
  bridge: 5, rift: [80, 1, 84, 13], top: 13,
  spring: [104, 208, 3], altar: [74, 172], seat: [96, 140], arch: [[90, 104], [108, 104]], observatory: [74, 68, 83, 77], eden: [144, 78, 13, 8], edenGap: [106, 77, 136, 79],
  in: [79, 254, 3], next: [80, 1, 4], start: [80, 246], merchant: [87, 245],
  foes: { '라파엘': [96, 203], '우리엘': [80, 170], '라구엘': [88, 137], '가브리엘': [98, 104], '사리엘': [64, 68], '레미엘': [110, 38], '미카엘': [80, 8] },
  zones: [['수호천사', [32, 208, 74, 224]], ['권천사', [80, 208, 122, 224]], ['능천사', [60, 175, 98, 188]], ['나팔의 천사', [104, 175, 140, 188]],
    ['역천사', [24, 141, 66, 155]], ['주천사', [72, 141, 116, 155]], ['좌천사', [66, 108, 138, 120]], ['지품천사', [26, 74, 108, 86]], ['치품천사', [60, 42, 136, 54]]],
  chests: [[132, 180], [70, 116], [144, 78, 'big']]
};
HEAVEN.sections = [...HEAVEN.islands.map(([n, cx, cy, rx, ry]) => [n, [cx - rx - 3, cy - ry - 3, cx + rx + 3, cy + ry + 3]]), ['에덴동산', [131, 68, 158, 88]]];
HEAVEN.sections[HEAVEN.sections.length - 2][1][1] = 0;            // 왕좌 섬 구간은 위 틈까지
// 빛의 다리 — 아래 섬 위쪽 가장자리에서 위 섬 아래쪽 가장자리로 휘어 오르는 길 (시험도 이 점들로 봄)
HEAVEN.bridges = HEAVEN.islands.slice(0, -1).flatMap(([, cx, cy, rx, ry, , legs], i) => {
  const [, ux, uy, urx, ury] = HEAVEN.islands[i + 1];
  return legs.map(([dx, bend]) => {
    const p0 = [cx + dx, cy - ry * 0.45], p1 = [ux + dx * (urx / rx) * 0.8, uy + ury * 0.45];   // 두 끝 모두 섬 안쪽 — 들쭉날쭉한 가장자리에 걸려 끊기지 않게
    return { from: i, p0, c: [(p0[0] + p1[0]) / 2 + bend, (p0[1] + p1[1]) / 2], p1 };
  });
});
function heavenMap(data) {
  const A = HEAVEN;
  return handMap(data, 14, A, c => {
    const { tiles, idx, box, ring, road, secrets } = c;
    const disk = (cx, cy, r, t) => { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) < r) tiles[idx(x, y)] = t; };
    const noise = valueNoise(14);
    const cloud = (cx, cy, rx, ry) => {                        // 들쭉날쭉한 구름 섬
      for (let y = Math.floor(cy - ry * 1.3); y <= cy + ry * 1.3; y++) for (let x = Math.floor(cx - rx * 1.3); x <= cx + rx * 1.3; x++) {
        if (x < 1 || y < 1 || x >= A.W - 1 || y >= A.H - 1) continue;
        const d = Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry), wob = 1 + (noise(x * 0.11, y * 0.11) - 0.5) * 0.4;
        if (d < wob) tiles[idx(x, y)] = FLOOR;
      }
    };
    const curve = (b, fn) => { const n = 80; for (let k = 0; k <= n; k++) { const t = k / n, u = 1 - t; fn(u * u * b.p0[0] + 2 * u * t * b.c[0] + t * t * b.p1[0], u * u * b.p0[1] + 2 * u * t * b.c[1] + t * t * b.p1[1]); } };
    // 구름 섬 · 빛의 다리
    for (const [, cx, cy, rx, ry] of A.islands) cloud(cx, cy, rx, ry);
    for (const b of A.bridges) curve(b, (x, y) => disk(x, y, A.bridge / 2, FLOOR));
    box([A.in[0], A.in[1] - 4, A.in[0] + A.in[2], A.in[1] + 1], FLOOR);
    // 층마다 상징 — 치유의 샘 · 불꽃 제단 · 심판석 · 하늘 문 기둥 · 달빛 관측대(바위 고리) · 부활의 정원(나무)
    disk(A.spring[0], A.spring[1], A.spring[2], WATER);
    box([A.altar[0], A.altar[1], A.altar[0] + 2, A.altar[1] + 2], ROCK);
    box([A.seat[0], A.seat[1], A.seat[0] + 2, A.seat[1] + 2], ROCK);
    for (const [x, y] of A.arch) box([x, y, x + 2, y + 2], ROCK);
    ring(A.observatory, ROCK); box([A.observatory[0], 71, A.observatory[0] + 1, 74], FLOOR);
    // 에덴동산 — 다섯째 하늘 동쪽에 따로 뜬 섬, 보이지 않는 다리(숨은 샛길)로만
    cloud(A.eden[0], A.eden[1], A.eden[2], A.eden[3]);
    const G = A.edenGap; secrets.push({ name: '숨은 샛길', x: G[0], y: G[1], w: G[2] - G[0], h: G[3] - G[1] });
    for (let y = G[1]; y < G[3]; y++) for (let x = G[0]; x < G[2]; x++) if (tiles[idx(x, y)] !== FLOOR) tiles[idx(x, y)] = WALL;
    // 일곱째 하늘 — 왕좌 섬의 기둥, 뒤의 하늘의 갈라진 틈 (미카엘이 막음 — 섬 위쪽은 반듯이 잘라 비켜 가지 못하게)
    for (let y = 0; y < A.top; y++) for (let x = 0; x < A.W; x++) tiles[idx(x, y)] = WALL;
    box(A.rift, FLOOR);
    for (const [x, y] of [[64, 18], [102, 18], [70, 24], [96, 24]]) box([x, y, x + 2, y + 2], ROCK);
    // 흙길 — 빛의 다리마다 가운데 한 줄 · 왕좌 섬에서 틈까지
    for (const b of A.bridges) curve(b, (x, y) => { for (let j = -1; j <= 0; j++) for (let i = -1; i <= 0; i++) { const k = idx(Math.round(x) + i, Math.round(y) + j); if (tiles[k] === FLOOR) tiles[k] = ROAD; } });
    road([A.rift[0], A.rift[1], A.rift[2], A.top + 6]);
    // 부활의 정원 나무 (길 · 자리 곁은 비움)
    const nearRoad = (x, y) => { for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (tiles[idx(x + i, y + j)] === ROAD) return true; return false; };
    scatterTrees(c, [70, 36, 132, 56], (x, y) => nearFoe(A, x, y, 3) || nearRoad(x, y), 15, 0.08);
  });
}

// ---------- 15격 — 얼어붙은 코키토스 (손으로 짠 지도, 사용자 결정 2026-11-27) ----------
// 「지옥의 맨 밑바닥은 불이 아니라 얼음이다. 등을 돌린 자들이 거기 얼어 있다.」 — 단테의 지옥처럼 깔때기로 꺼져 내려가는 원 일곱, 맨 밑 한가운데가 얼어붙은 호수.
// 하늘의 갈라진 틈에서 떨어져 맨 바깥 지옥문에 닿음. 원은 동굴 테라스 — 폭이 다르고 가장자리가 무너졌음, 내려가는 비탈은 원마다 제각각의 자리라
// 원마다 왼쪽으로 돌지 오른쪽으로 돌지 고름 (두 반쪽에 사는 자가 다름). 반듯한 것은 사람이 지은 디스의 불타는 무덤 줄뿐.
//   1 지옥문 · 림보       레기온(지옥문 앞 들판의 군대 — 유일하게 돌아다님) · 바엘(지옥의 첫 왕) · 몰록(림보와 갈라 둔 제 불타는 제단)   — 숨은 「고귀한 이교도들의 성」
//   2 색욕의 폭풍         바람에 깎인 바위 — 바포메트 · 아스모데우스(색욕의 마신) · 아자젤(사람을 꾀어 치장을 가르친)
//   3 탐식의 진흙         진흙 웅덩이 — 벨레트 · 벨제부브(파리 떼의 왕, 탐식의 마신) · 메피스토펠레스
//   4 분노와 나태의 늪     원을 끊는 검은 늪(스틱스)을 나룻배 자리로 건넘 — 파이몬 · 아스타로트(나태의 마신)
//   5 불타는 도시 디스     줄지은 불타는 무덤 — 푸르손 · 벨리알(무가치한 자)
//   6 피의 강 플레게톤     원을 따라 휘어 흐르는 피의 강(여울 둘) — 릴리스 · 바인(탑을 허무는 폭력)
//   7 말레볼제            바큇살처럼 패인 열 개의 도랑과 돌다리 — 발람(점쟁이의 구렁) · 자간(연금 사기꾼의 구렁)
//   한가운데 코키토스     얼음 둑 끝에 얼어붙은 루시퍼 — 그 너머 지구 반대편으로 빠져나가는 구멍 → 16격 이그드라실의 가지 (장소가 신들의 시대로).
// 원 안에서는 약한 자가 그 원에 들어선 자리 근처, 센 자가 다음 비탈 쪽에. 좌표는 깔때기 한가운데에서 잰 반지름 · 각도(도, 0 동 · 90 남 — 화면 아래가 남).
const INFERNO = {
  W: 212, H: 212, C: [106, 106],
  rings: [ // [이름, 안쪽 반지름, 바깥 반지름, 이 원에서 다음 원으로 내려가는 비탈의 각도]
    ['첫째 원 — 지옥문 · 림보', 80, 90, -60], ['둘째 원 — 색욕의 폭풍', 68, 78, 130], ['셋째 원 — 탐식의 진흙', 57, 66, -20],
    ['넷째 원 — 분노와 나태의 늪', 46, 55, 160], ['다섯째 원 — 불타는 도시 디스', 35, 44, 10], ['여섯째 원 — 피의 강 플레게톤', 24, 33, -150], ['일곱째 원 — 말레볼제', 15, 22, 0]],
  lake: 13, entry: 90, ramp: 4,
  foes: { // 이름 → [각도, 반지름(없으면 그 원 가운데)]
    '바엘': [180], '몰록': [-35], '바포메트': [-150], '아스모데우스': [40], '아자젤': [105],
    '벨레트': [80], '벨제부브': [-120], '메피스토펠레스': [5], '파이몬': [-70], '아스타로트': [130],
    '푸르손': [100], '벨리알': [-20], '릴리스': [-40, 31.5], '바인': [-170, 25.5], '발람': [-80], '자간': [50], '루시퍼': [0, 5.5]
  },
  legion: [60, 120], styx: [[60, 12], [-120, 12]], phlegethon: [28.5, 0.8, [100, -100]], ditches: 10, castle: [150, 14],
  chestAt: { styx: [75, 50.5], malebolge: [70, 18.5] },
  in: [105, 205, 3], start: [107, 192], merchant: [112, 192]
};
function infernoMap(data) {
  const A = INFERNO, [cx, cy] = A.C, rad = d => d * Math.PI / 180;
  const at = (deg, r) => [Math.round(cx + Math.cos(rad(deg)) * r), Math.round(cy + Math.sin(rad(deg)) * r)];
  const zi = data.ZONES.findIndex(z => z.rank === 15), foes = data.ENEMIES.filter(e => e.zoneIndex === zi);
  // 자리 — 각도 · 반지름(그 원 가운데) → 몸 왼쪽 위
  const ringOfFoe = {};
  [['바엘', '몰록'], ['바포메트', '아스모데우스', '아자젤'], ['벨레트', '벨제부브', '메피스토펠레스'], ['파이몬', '아스타로트'], ['푸르손', '벨리알'], ['릴리스', '바인'], ['발람', '자간']]
    .forEach((list, k) => list.forEach(n => { ringOfFoe[n] = k; }));
  A.ringOfFoe = ringOfFoe;
  const spot = {};
  for (const [name, [deg, r0]] of Object.entries(A.foes)) {
    const e = foes.find(q => q.name === name), k = ringOfFoe[name];
    const r = r0 !== undefined ? r0 : (A.rings[k][1] + A.rings[k][2]) / 2;
    const [x, y] = at(deg, r);
    spot[name] = [x - (e.size >> 1), y - (e.size >> 1)];
  }
  const lucifer = foes.find(e => e.kind === 'boss');
  spot['루시퍼'] = [cx + 4, cy - 2];                            // 얼음 둑(동쪽에서 한가운데로) 끝을 몸으로 꼭 막음
  const [lx, ly] = at(A.legion[0], 85);
  const chest = (deg, r) => at(deg, r);
  const castle = (() => { const [x, y] = at(A.castle[0], 100); return [x - 8, y - 7, x + 7, y + 8]; })();
  const spec = {
    ...A, foes: spot,
    next: [cx - 4, cy - 1, 3],
    sections: [['지옥문', [92, 192, 122, 212]], ['고귀한 이교도들의 성', castle], ['코키토스 — 얼어붙은 호수', [cx - A.lake, cy - A.lake, cx + A.lake + 1, cy + A.lake + 1]]],
    zones: [['레기온', [lx - 26, ly - 10, lx + 6, ly + 8]]],
    chests: [chest(...A.chestAt.styx), chest(...A.chestAt.malebolge), [castle[0] + 7, castle[1] + 7, 'big']]
  };
  return handMap(data, 15, spec, c => {
    const { tiles, idx, box, ring, road, secrets, shapes } = c;
    const noise = valueNoise(15), W = A.W, H = A.H;
    const wob = (deg, k) => (noise(Math.cos(rad(deg)) * 2.6 + k * 3.1, Math.sin(rad(deg)) * 2.6 + k * 1.7) - 0.5) * 5.5;   // 가장자리 무너짐 (±2.7칸 — 원마다 폭이 들쭉날쭉)
    const polar = (x, y) => { const dx = x + 0.5 - cx, dy = y + 0.5 - cy; return [Math.hypot(dx, dy), Math.atan2(dy, dx) * 180 / Math.PI]; };
    const angDiff = (a, b) => { let d = ((a - b) % 360 + 540) % 360 - 180; return Math.abs(d); };
    // 원 사이 바위 벽은 한가운데 반지름만 흔들고 두께(2.4칸)는 지킴 — 벽이 끊겨 비탈을 거치지 않고 건너가지 않게
    const edges = d => { const out = [A.rings[0][2] + wob(d, 0)]; for (let k = 1; k < A.rings.length; k++) { const mid = (A.rings[k - 1][1] + A.rings[k][2]) / 2 + wob(d, k); out.push(mid + 1.2, mid - 1.2); } out.push(A.rings[A.rings.length - 1][1] + wob(d, 12)); return out; };
    const bandOf = (x, y) => { const [r, d] = polar(x, y), e = edges(d); for (let k = 0; k < A.rings.length; k++) if (r < e[k * 2] && r >= e[k * 2 + 1]) return k; return -1; };
    // 원 일곱 — 동굴 테라스 (나머지는 바위)
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (bandOf(x, y) >= 0) tiles[idx(x, y)] = FLOOR;
    // 비탈 — 지옥문에서 첫째 원으로, 원마다 다음 원으로 (바위 벽을 뚫는 흙길)
    const ramp = (deg, r0, r1) => { for (let r = r0; r <= r1; r += 0.5) { const [x, y] = at(deg, r); for (let j = -2; j <= 1; j++) for (let i = -2; i <= 1; i++) tiles[idx(x + i, y + j)] = FLOOR; } };
    ramp(A.entry, A.rings[0][2] - 2, 101);
    box([A.in[0], 196, A.in[0] + A.in[2], A.in[1] + 1], FLOOR); box([92, 192, 122, 200], FLOOR);
    for (let k = 0; k < A.rings.length - 1; k++) ramp(A.rings[k][3], A.rings[k + 1][2] - 3, A.rings[k][1] + 3);
    // 둘째 원 — 바람에 깎인 바위 · 셋째 원 — 진흙 웅덩이
    const hash = (x, y, s) => { const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); };
    const clearOf = (x, y, d) => Object.values(spot).some(([fx, fy]) => x >= fx - d && x < fx + 4 + d && y >= fy - d && y < fy + 4 + d);
    const nearRamp = (x, y) => { const [, d] = polar(x, y); return A.rings.some(r => angDiff(d, r[3]) < 9) || angDiff(d, A.entry) < 9; };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const k = bandOf(x, y);
      if (tiles[idx(x, y)] !== FLOOR || clearOf(x, y, 3) || nearRamp(x, y)) continue;
      if (k === 1 && hash(x, y, 2) < 0.03) tiles[idx(x, y)] = ROCK;
    }
    for (const deg of [-90, -10, 75, 160, 215]) { const [x, y] = at(deg, 61.5); for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (Math.hypot(i, j) < 2.3 && bandOf(x + i, y + j) === 2) tiles[idx(x + i, y + j)] = WATER; }
    // 넷째 원 — 원을 끊는 검은 늪(스틱스), 가운데 나룻배 자리로만 건넘
    for (const [deg, span] of A.styx) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (bandOf(x, y) !== 3) continue;
      const [r, d] = polar(x, y);
      if (angDiff(d, deg) < span / 2 && Math.abs(r - 50.5) > 1.6) tiles[idx(x, y)] = WATER;
    }
    // 다섯째 원 — 불타는 도시 디스의 무덤 줄 (사람이 지은 것 — 반듯하게)
    for (let deg = -180; deg < 180; deg += 15) {
      if (A.rings.some(r => angDiff(deg, r[3]) < 14) || Object.entries(spot).some(([n, [fx, fy]]) => ringOfFoe[n] === 4 && Math.hypot(fx - at(deg, 39.5)[0], fy - at(deg, 39.5)[1]) < 7)) continue;
      for (const r of [37, 42]) { const [x, y] = at(deg, r); if (bandOf(x, y) === 4 && bandOf(x + 1, y + 1) === 4) box([x, y, x + 2, y + 2], ROCK); }
    }
    // 여섯째 원 — 원을 따라 흐르는 피의 강, 여울 둘
    const [pr, pw, fords] = A.phlegethon;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (bandOf(x, y) !== 5) continue;
      const [r, d] = polar(x, y);
      if (Math.abs(r - pr) < pw && !fords.some(f => angDiff(d, f) < 5)) tiles[idx(x, y)] = WATER;
    }
    // 일곱째 원 — 바큇살 도랑 열 개, 저마다 가운데 돌다리
    for (let k = 0; k < A.ditches; k++) {
      const deg = k * 36 + 18;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (bandOf(x, y) !== 6) continue;
        const [r, d] = polar(x, y);
        if (angDiff(d, deg) < 2.4 && Math.abs(r - 18.5) > 1.1) tiles[idx(x, y)] = WATER;
      }
    }
    // 한가운데 — 얼어붙은 호수, 동쪽에서 한가운데로 얼음 둑, 끝에 루시퍼, 그 너머 지구 반대편으로 나가는 구멍
    for (let y = cy - A.lake; y <= cy + A.lake; y++) for (let x = cx - A.lake; x <= cx + A.lake; x++) if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) < A.lake) tiles[idx(x, y)] = WATER;
    box([cx - 5, cy - 2, cx + A.rings[6][1] + 3, cy + 2], FLOOR);
    for (let y = cy - A.lake - 3; y <= cy + A.lake + 3; y++) for (let x = cx - A.lake - 3; x <= cx + A.lake + 3; x++) {
      const r = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (r >= A.lake && r < A.rings[6][1] + wob(polar(x, y)[1], 12) && !(y >= cy - 2 && y < cy + 2 && x > cx)) tiles[idx(x, y)] = ROCK;
    }
    // 숨은 곳 — 첫째 원 바깥 「고귀한 이교도들의 성」 (반듯한 성벽, 원 쪽 바위 속 숨은 샛길)
    box(spec.sections[1][1], FLOOR); ring(spec.sections[1][1], WALL);
    { const [sx, sy] = at(A.castle[0], 88.5), [tx, ty] = at(A.castle[0], 95);
      const x0 = Math.min(sx, tx), x1 = Math.max(sx, tx), y0 = Math.min(sy, ty), y1 = Math.max(sy, ty);
      for (let y = y0; y <= y1 + 1; y++) for (let x = x0; x <= x1 + 1; x++) if (tiles[idx(x, y)] !== FLOOR) tiles[idx(x, y)] = WALL;
      secrets.push({ name: '숨은 샛길', x: x0, y: y0, w: x1 - x0 + 2, h: y1 - y0 + 2 }); }
    // 구간 — 원마다 북 · 남 반쪽 (땅 모양대로)
    for (let k = 0; k < A.rings.length; k++) for (const south of [true, false]) {
      const cells = new Set();
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (bandOf(x, y) === k && (y >= cy) === south) cells.add(idx(x, y));
      shapes.push([A.rings[k][0], cells]);
    }
    // 몰록의 불타는 제단 — 림보(세례 못 받은 선한 이교도의 곳)와 어울리지 않아 첫째 원 안에 따로 갈라 둔 자리 (제단 바위 · 구간 이름)
    { const [mx, my] = spot['몰록'], cells = new Set();
      for (let y = my - 6; y <= my + 7; y++) for (let x = mx - 6; x <= mx + 7; x++) if (Math.hypot(x - mx - 0.5, y - my - 0.5) < 6.5 && bandOf(x, y) === 0) cells.add(idx(x, y));
      for (const [ax, ay] of [[mx + 4, my - 1], [mx - 3, my - 1]]) if (bandOf(ax, ay) === 0 && bandOf(ax + 1, ay + 1) === 0) { box([ax, ay, ax + 1, ay + 2], ROCK); break; }
      shapes.push(['몰록의 불타는 제단', solidShape(cells, W)]); }
    // 흙길 — 비탈마다 · 얼음 둑
    const rampRoad = (deg, r0, r1) => { for (let r = r0; r <= r1; r += 0.5) { const [x, y] = at(deg, r); for (let j = -1; j <= 0; j++) for (let i = -1; i <= 0; i++) if (tiles[idx(x + i, y + j)] === FLOOR) tiles[idx(x + i, y + j)] = ROAD; } };
    rampRoad(A.entry, A.rings[0][1], 101);
    for (let k = 0; k < A.rings.length - 1; k++) rampRoad(A.rings[k][3], A.rings[k + 1][1] + 1, A.rings[k][2] - 1);
    road([cx + 10, cy - 1, cx + A.rings[6][1] + 3, cy + 1]);
  });
}

// ---------- 16격 — 이그드라실의 가지 (손으로 짠 지도, 사용자 결정 2026-11-27) ----------
// 「아홉 세계가 이 나무 하나에 매달려 있다. 어느 신화든 여기서 만난다.」 — 세계수에 여러 신화의 신들이 가지마다 매달려 삶.
// 루시퍼를 지나 지구 반대편으로 빠져나오면 나무 꼭대기(우듬지) — 위에서 아래로 가지를 타고 뿌리까지 내려감 (위쪽이 약하고 뿌리 쪽이 셈).
// 굽은 줄기 하나와 늘어진 큰 가지 둘, 아래로 넓게 퍼진 뿌리 — 반듯한 데 없이 휘어진 나무. 가지와 줄기가 중간에 맞닿는 잔가지로 갈래를 바꿀 수 있음.
//   서쪽 늘어진 가지(이집트)        바스테트(가지 끝 고양이 신전) → 아누비스(심장의 저울) → 이시스(뿌리 — 흩어진 것을 다시 모음)
//   가운데 줄기(올림포스 12신)       헤라(우듬지의 신들의 왕좌) → 헤르메스(가지가 갈리는 갈림목) → 아테나 → 포세이돈 → 아폴론(볕 드는 줄기) → 아르테미스(그늘진 줄기의 달빛)
//                                   → 아프로디테 → 헤파이스토스(줄기 속 대장간) → 아레스 → 데메테르(뿌리 위 밭) → 디오니소스(가장 깊은 뿌리의 포도밭) — 열한 신이 한 줄기에 (사용자 지적 2026-11-27)
//   동쪽 늘어진 가지(일본)           스사노오(가지 끝 폭풍) → 아마테라스(가지 속 바위 동굴 아마노이와토에서 나온 해)
//   북유럽 가지 (줄기 가운데에서)     토르(천둥 치는 가지) → 로키(뿌리 밑 동굴에 묶인 — 이야기가 있는 구석). 뿌리에 우르드의 샘
//   뿌리 밑 하데스 — 「돌아온 자가 없는 문」을 막음, 그 너머 모든 것 아래의 태초의 바다(17격, 장소는 그대로 신들의 시대).
//   숨은 곳 — 뿌리 밑 미미르의 샘(지혜의 샘, 숨은 샛길 — 큰 상자). 작은 상자는 헤르메스의 갈림목 · 헤파이스토스의 대장간.
const YGGDRASIL = {
  W: 176, H: 244,
  canopy: [88, 30, 62, 20], roots: [88, 196, 66, 17], trunkTop: 40, trunkBottom: 190, trunkHalf: 11, limbHalf: 8.5,
  limbs: { west: [[48, 40], [2, 78], [6, 152], [52, 190]], east: [[128, 40], [172, 92], [160, 146], [124, 190]], norse: [[98, 94], [130, 112], [116, 152], [118, 188]] },
  twigs: [[[16, 112], [50, 102], [80, 118]], [[160, 116], [126, 104], [96, 120]]],
  gate: [85, 210, 89, 238], well: [108, 202, 3],
  in: [86, 2, 3], next: [85, 238, 4], start: [87, 12], merchant: [94, 14],
  place: { // 이름 → [갈래, 갈래 위 자리(가지는 0~1, 줄기는 y), 비켜 선 쪽(-1 왼쪽 · 1 오른쪽)]
    '바스테트': ['west', 0.14, 1], '아누비스': ['west', 0.4, -1], '이시스': ['west', 0.93, 1],                         // 이집트 — 서쪽 가지
    '헤라': ['canopy', [74, 16]], '헤르메스': ['trunk', 50, 1], '아테나': ['trunk', 64, -1], '포세이돈': ['trunk', 78, 1], '아폴론': ['trunk', 90, -1],   // 올림포스 — 줄기 (열한 신 모두, 사용자 지적 2026-11-27)
    '아르테미스': ['trunk', 104, 1], '아프로디테': ['trunk', 130, -1], '헤파이스토스': ['trunk', 142, 1], '아레스': ['trunk', 156, -1], '데메테르': ['trunk', 172, 1], '디오니소스': ['roots', [70, 198]],
    '스사노오': ['east', 0.14, -1], '아마테라스': ['east', 0.6, -1],                                                   // 일본 — 동쪽 가지
    '토르': ['norse', 0.35, 1], '로키': ['roots', [132, 204]],                                                          // 북유럽 — 줄기 가운데에서 갈라진 가지, 뿌리 밑 로키의 동굴
    '하데스': ['gate', [87, 216]]
  }
};
function yggdrasilMap(data) {
  const Y = YGGDRASIL, zi = data.ZONES.findIndex(z => z.rank === 16), foes = data.ENEMIES.filter(e => e.zoneIndex === zi);
  const bez = (P, t) => { const u = 1 - t; return [u * u * u * P[0][0] + 3 * u * u * t * P[1][0] + 3 * u * t * t * P[2][0] + t * t * t * P[3][0], u * u * u * P[0][1] + 3 * u * u * t * P[1][1] + 3 * u * t * t * P[2][1] + t * t * t * P[3][1]]; };
  const tangent = (P, t) => { const a = bez(P, Math.max(0, t - 0.01)), b = bez(P, Math.min(1, t + 0.01)), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return [dx / l, dy / l]; };
  const trunkX = y => 88 + 6 * Math.sin(y / 24);
  const spot = {};
  for (const [name, [kind, at, side]] of Object.entries(Y.place)) {
    const e = foes.find(q => q.name === name), n = e.size;
    let x, y;
    if (kind === 'west' || kind === 'east' || kind === 'norse') { const P = Y.limbs[kind], [px, py] = bez(P, at), [tx, ty] = tangent(P, at); x = px + -ty * side * 5.6; y = py + tx * side * 5.6; }
    else if (kind === 'trunk') { x = trunkX(at) + side * 6; y = at; }
    else [x, y] = at;
    spot[name] = [Math.round(x - n / 2), Math.round(y - n / 2)];
  }
  const sec = { canopy: [], west: [], trunk: [], east: [], norse: [], roots: [] };
  const spec = {
    ...Y, foes: spot, zones: [],
    sections: [['미미르의 샘', [8, 204, 34, 226]], ['돌아온 자가 없는 문', [76, 212, 98, 244]]],
    chests: [[spot['헤르메스'][0] + 6, spot['헤르메스'][1] + 1], [spot['헤파이스토스'][0] - 4, spot['헤파이스토스'][1] + 1], [20, 214, 'big']]
  };
  return handMap(data, 16, spec, c => {
    const { tiles, idx, box, ring, road, secrets, shapes } = c;
    const W = Y.W, H = Y.H, noise = valueNoise(16), owner = new Int8Array(W * H).fill(-1);
    const keys = Object.keys(sec);
    const put = (x, y, who) => { x = Math.round(x); y = Math.round(y); if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) return; const k = idx(x, y); tiles[k] = FLOOR; if (owner[k] < 0) owner[k] = keys.indexOf(who); };
    const blob = (cx, cy, rx, ry, who) => { for (let y = Math.floor(cy - ry * 1.3); y <= cy + ry * 1.3; y++) for (let x = Math.floor(cx - rx * 1.3); x <= cx + rx * 1.3; x++) if (Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry) < 1 + (noise(x * 0.1, y * 0.1) - 0.5) * 0.45) put(x, y, who); };
    const thick = (P, half, who) => { for (let k = 0; k <= 400; k++) { const t = k / 400, [x, y] = bez(P, t), h = half * (0.85 + noise(t * 6, half) * 0.3); for (let j = -h; j <= h; j += 0.5) for (let i = -h; i <= h; i += 0.5) if (Math.hypot(i, j) <= h) put(x + i, y + j, who); } };
    // 나무 — 우듬지 · 굽은 줄기 · 늘어진 큰 가지 둘 · 줄기와 맞닿는 잔가지 · 넓게 퍼진 뿌리
    blob(...Y.canopy, 'canopy');
    for (let y = Y.trunkTop; y <= Y.trunkBottom; y += 0.5) { const h = Y.trunkHalf * (0.9 + noise(3, y * 0.08) * 0.25); for (let x = -h; x <= h; x += 0.5) put(trunkX(y) + x, y, 'trunk'); }
    thick(Y.limbs.west, Y.limbHalf, 'west'); thick(Y.limbs.east, Y.limbHalf, 'east'); thick(Y.limbs.norse, Y.limbHalf * 0.85, 'norse');
    for (const tw of Y.twigs) { const P = [tw[0], tw[1], tw[1], tw[2]]; for (let k = 0; k <= 200; k++) { const [x, y] = bez(P, k / 200); for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (Math.hypot(i, j) <= 2.5) put(x + i, y + j, x < 88 ? 'west' : 'east'); } }
    blob(...Y.roots, 'roots');
    for (const [x0, y0, x1, y1] of [[136, 200, 154, 226], [70, 206, 58, 232], [106, 206, 118, 232]]) for (let k = 0; k <= 60; k++) { const t = k / 60; for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (Math.hypot(i, j) <= 2.6 - t * 1.4) put(x0 + (x1 - x0) * t + i, y0 + (y1 - y0) * t + j, 'roots'); }
    box([Y.in[0], 1, Y.in[0] + Y.in[2], 10], FLOOR);
    // 상징 — 우르드의 샘(뿌리, 북유럽의 운명의 샘) · 아마노이와토(바위 동굴, 남쪽 입구) · 대장간 모루 · 로키의 동굴(바위, 북쪽 입구)
    for (let y = Y.well[1] - Y.well[2]; y <= Y.well[1] + Y.well[2]; y++) for (let x = Y.well[0] - Y.well[2]; x <= Y.well[0] + Y.well[2]; x++) if (Math.hypot(x + 0.5 - Y.well[0], y + 0.5 - Y.well[1]) < Y.well[2]) tiles[idx(x, y)] = WATER;
    const [ax, ay] = spot['아마테라스']; ring([ax - 3, ay - 3, ax + 5, ay + 5], ROCK); box([ax, ay + 4, ax + 2, ay + 5], FLOOR);
    const [hx, hy] = spot['헤파이스토스']; box([hx + 3, hy - 3, hx + 5, hy - 1], ROCK);
    const [lx, ly] = spot['로키']; ring([lx - 3, ly - 3, lx + 5, ly + 5], ROCK); box([lx, ly - 3, lx + 2, ly - 2], FLOOR);
    // 뿌리 밑 — 돌아온 자가 없는 문(하데스가 꼭 맞게 막음)과 그 너머 · 미미르의 샘(바위 방, 숨은 샛길)
    box(Y.gate, FLOOR); box([Y.next[0], Y.next[1], Y.next[0] + Y.next[2], Y.next[1] + 2], FLOOR);   // 문 너머 한 칸 더 — 내려가는 어둠
    for (let y = Y.gate[1]; y < Y.gate[3]; y++) for (const x of [Y.gate[0] - 1, Y.gate[2]]) tiles[idx(x, y)] = WALL;
    const M = spec.sections[0][1];
    box(M, FLOOR); ring(M, ROCK); for (let y = 210; y < 220; y++) for (let x = 12; x < 18; x++) if (Math.hypot(x - 14.5, y - 218.5) < 3) tiles[idx(x, y)] = WATER;
    for (let y = M[1] - 3; y <= M[1]; y++) for (let x = 27; x < 31; x++) if (tiles[idx(x, y)] !== FLOOR) tiles[idx(x, y)] = WALL;
    secrets.push({ name: '숨은 샛길', x: 27, y: M[1] - 3, w: 4, h: 4 });   // 뿌리에서 방 위쪽 벽으로
    // 구간 — 우듬지 · 서쪽 가지 · 줄기 · 동쪽 가지 · 뿌리 (나무 모양대로)
    const names = { canopy: '우듬지 — 신들의 왕좌', west: '서쪽 가지 — 이집트', trunk: '줄기 — 올림포스', east: '동쪽 가지 — 해가 숨은 바위 동굴', norse: '북유럽 가지 — 천둥과 묶인 신', roots: '뿌리와 우르드의 샘' };
    for (const [k, i] of keys.map((k, i) => [k, i])) {
      const cells = new Set(); for (let q = 0; q < W * H; q++) if (owner[q] === i && tiles[q] !== WALL) cells.add(q);
      const mine = solidShape(cells, W);                         // 가장 큰 덩어리만 (잔가지 끝 조각 빼고), 구멍은 품음
      shapes.push([names[k], mine]);
    }
    // 흙길 — 줄기 가운데 · 큰 가지 가운데 · 우듬지에서 가지로 · 뿌리에서 문으로
    const mark = (x, y) => { for (let j = -1; j <= 0; j++) for (let i = -1; i <= 0; i++) { const q = idx(Math.round(x) + i, Math.round(y) + j); if (tiles[q] === FLOOR) tiles[q] = ROAD; } };
    for (let y = 10; y <= Y.trunkBottom + 6; y += 0.5) mark(y < Y.trunkTop ? 88 : trunkX(y), y);
    for (const P of Object.values(Y.limbs)) for (let k = 0; k <= 400; k++) mark(...bez(P, k / 400));
    for (const [k0, P] of Object.entries(Y.limbs)) for (let k = 0; k <= 30; k++) { const t = k / 30; if (k0 !== 'norse') mark(88 + (P[0][0] - 88) * t, 14 + (P[0][1] - 14) * t); mark(P[3][0] + (88 - P[3][0]) * t, P[3][1] + (196 - P[3][1]) * t); }   // 북유럽 가지는 줄기 가운데에서 갈라짐
    road([86, 196, 88, Y.gate[1] + 2]);
  });
}

// ---------- 17격 — 태초의 바다 (손으로 짠 지도, 사용자 결정 2026-11-27) ----------
// 「신들이 처음으로 칼을 뽑은 곳. 여기서 진 것들의 몸으로 땅과 하늘이 지어졌다.」 — 끝없는 태초의 바다, 섬은 신에게 진 것들의 몸이 굳어 생긴 땅.
// 하데스의 문을 지나 남쪽 타르타로스 해안(신에게 진 타이탄들이 갇힌 곳)에 닿아 북쪽으로 — 들쭉날쭉한 섬들을 모래톱 · 여울로 건너는 세 갈래가 이미르의 땅에서 만남.
//   서쪽 묶이고 깔린 것 묶인 섬 링비의 펜리르 → 화산 밑에 깔린 티폰 → 물을 가두다 마른 골짜기에 갇힌 브리트라
//   가운데 세 짐승      땅 — 짓눌린 대지 베히모스 → 바다 — 소용돌이 한가운데 리바이어던 → 하늘 — 하늘에 닿는 바위 기둥의 지즈 (묶음 정예는 한 갈래, 사용자 지적 2026-11-27)
//   동쪽 뱀의 섬들    제 꼬리를 문 산호 띠 요르문간드 → 해가 지는 수평선 끝 아포피스 → 여덟 골짜기 섬 야마타노오로치
//   이미르의 땅        이미르(주검으로 세계가 지어진 거인 — 그 땅 한가운데) — 숨은 이미르의 해골 동굴(그 해골로 하늘을 지음, 큰 상자)
//   갈라진 바다        바다가 양쪽 벽처럼 갈라진 길 끝의 티아마트 → 그녀의 위쪽 반이 하늘이 된 길로 18격 올림포스 정상 (장소는 그대로 신들의 시대).
// 작은 상자는 리바이어던 소용돌이의 난파선 · 브리트라의 마른 골짜기. 갈래 사이에도 모래톱이 놓여 섬을 건너는 길이 하나로 정해져 있지 않음.
const PRIMORDIAL = {
  W: 184, H: 232,
  islands: { // 이름 → [가운데 x, y, 반폭, 반높이]
    shore: [92, 208, 72, 15], lyngvi: [40, 170, 18, 11], volcano: [28, 130, 19, 12], dry: [40, 90, 21, 13],          // 서쪽 — 신에게 묶이고 깔린 것들
    behemoth: [92, 164, 22, 13], whirl: [94, 122, 18, 12], pillar: [90, 84, 14, 10],                                    // 가운데 — 땅 · 바다 · 하늘의 세 짐승 (묶음 정예 한 갈래, 사용자 지적 2026-11-27)
    sunset: [152, 114, 17, 11], orochi: [140, 82, 21, 13], ymir: [92, 46, 54, 16]
  },
  reef: [[128, 176], [176, 156], [168, 128], [140, 136]],
  shoals: [['shore', 'lyngvi'], ['lyngvi', 'volcano'], ['volcano', 'dry'], ['dry', 'ymir'], ['shore', 'behemoth'], ['behemoth', 'whirl'], ['whirl', 'pillar'], ['pillar', 'ymir'],
    ['shore', 'reef0'], ['reef1', 'sunset'], ['sunset', 'orochi'], ['orochi', 'ymir'], ['lyngvi', 'behemoth'], ['whirl', 'sunset'], ['volcano', 'whirl']],
  path: [88, 1, 93, 33], skull: [44, 38, 62, 54],
  in: [91, 226, 3], next: [89, 1, 4], start: [92, 214], merchant: [100, 214],
  foes: {
    '베히모스': [100, 166], '펜리르': [32, 172], '브리트라': [38, 86], '리바이어던': [100, 126], '티폰': [16, 132], '지즈': [79, 82],
    '요르문간드': [164, 148], '아포피스': [158, 118], '야마타노오로치': [139, 81], '이미르': [104, 42], '티아마트': [88, 12]
  },
  zones: [['타이탄', [40, 196, 150, 220]]],
  chests: [[84, 124], [50, 94], [52, 45, 'big']]
};
function primordialMap(data) {
  const A = PRIMORDIAL;
  const names = { shore: '타르타로스 해안', behemoth: '짓눌린 대지', lyngvi: '묶인 섬 링비', dry: '물이 갇혀 마른 골짜기', whirl: '소용돌이', volcano: '티폰이 깔린 화산섬', pillar: '하늘에 닿는 바위 기둥',
    reef: '제 꼬리를 문 산호 띠', sunset: '해가 지는 수평선', orochi: '여덟 골짜기 섬', ymir: '이미르의 땅' };
  return handMap(data, 17, { ...A, sections: [['이미르의 해골 동굴', A.skull], ['갈라진 바다', [80, 0, 101, 30]]] }, c => {
    const { tiles, idx, box, ring, road, secrets, shapes } = c;
    const W = A.W, H = A.H, noise = valueNoise(17), owner = new Map();
    const put = (x, y, who) => { x = Math.round(x); y = Math.round(y); if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) return; const k = idx(x, y); tiles[k] = FLOOR; if (who && !owner.has(k)) owner.set(k, who); };
    const disk = (cx, cy, r, t) => { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) < r) tiles[idx(x, y)] = t; };
    const bez = (P, t) => { const u = 1 - t; return P.length === 4
      ? [u * u * u * P[0][0] + 3 * u * u * t * P[1][0] + 3 * u * t * t * P[2][0] + t * t * t * P[3][0], u * u * u * P[0][1] + 3 * u * u * t * P[1][1] + 3 * u * t * t * P[2][1] + t * t * t * P[3][1]]
      : [u * u * P[0][0] + 2 * u * t * P[1][0] + t * t * P[2][0], u * u * P[0][1] + 2 * u * t * P[1][1] + t * t * P[2][1]]; };
    // 바다 — 들쭉날쭉한 섬(진 것들의 몸이 굳은 땅) · 산호 띠
    for (let k = 0; k < W * H; k++) tiles[k] = WATER;
    for (const [who, [cx, cy, rx, ry]] of Object.entries(A.islands))
      for (let y = Math.floor(cy - ry * 1.35); y <= cy + ry * 1.35; y++) for (let x = Math.floor(cx - rx * 1.35); x <= cx + rx * 1.35; x++)
        if (Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry) < 1 + (noise(x * 0.12, y * 0.12) - 0.5) * 0.5) put(x, y, who);
    for (let k = 0; k <= 300; k++) { const t = k / 300, [x, y] = bez(A.reef, t), h = 5 + noise(t * 5, 3) * 2; for (let j = -h; j <= h; j += 0.5) for (let i = -h; i <= h; i += 0.5) if (Math.hypot(i, j) <= h) put(x + i, y + j, 'reef'); }
    // 모래톱 · 여울 — 섬 가장자리에서 가장자리로 휘어 건너는 얕은 길 (흙길이 가운데로)
    const end = (who, toward) => {
      if (who.startsWith('reef')) return bez(A.reef, who === 'reef0' ? 0.12 : 0.92);
      const [cx, cy, rx, ry] = A.islands[who], [tx, ty] = toward, dx = tx - cx, dy = ty - cy, l = Math.hypot(dx / rx, dy / ry);
      return [cx + dx / l * 0.55, cy + dy / l * 0.55];
    };
    const centerOf = w => (w.startsWith('reef') ? bez(A.reef, w === 'reef0' ? 0.12 : 0.92) : A.islands[w].slice(0, 2));
    const shoalCurves = A.shoals.map(([a, b], i) => {
      const p0 = end(a, centerOf(b)), p1 = end(b, centerOf(a)), bend = (noise(i * 1.7, 9) - 0.5) * 24;
      return [p0, [(p0[0] + p1[0]) / 2 + bend, (p0[1] + p1[1]) / 2 + bend * 0.3], p1];
    });
    for (const P of shoalCurves) for (let k = 0; k <= 200; k++) { const [x, y] = bez(P, k / 200); for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (Math.hypot(i, j) <= 2.3) put(x + i, y + j); }
    // 섬마다 상징 — 소용돌이(가운데 물) · 화산(바위 고리와 불구덩이) · 바위 기둥들 · 링비의 묶은 바위 · 여덟 골짜기(바위 등성이 여덟) · 마른 골짜기의 둑
    disk(94, 126, 4, WATER);
    for (let a = 0; a < 360; a += 8) { if (a > 200 && a < 250) continue; const [x, y] = [Math.round(32 + Math.cos(a * Math.PI / 180) * 5.5), Math.round(128 + Math.sin(a * Math.PI / 180) * 5.5)]; tiles[idx(x, y)] = ROCK; }
    disk(32, 128, 3.2, WATER);
    for (const [x, y] of [[98, 80], [100, 88], [86, 92], [94, 92]]) box([x, y, x + 2, y + 2], ROCK);
    tiles[idx(37, 170)] = ROCK;                               // 펜리르를 묶은 바위
    for (let k = 0; k < 8; k++) { const a = k * 45 + 22.5; for (let r = 5; r < 14; r++) { const x = Math.round(141 + Math.cos(a * Math.PI / 180) * r * 1.3), y = Math.round(82 + Math.sin(a * Math.PI / 180) * r * 0.8); if (tiles[idx(x, y)] === FLOOR) tiles[idx(x, y)] = ROCK; } }
    for (let x = 26; x < 54; x++) { const y = 100 + Math.round(Math.sin(x / 4)); if (tiles[idx(x, y)] === FLOOR && (x < 36 || x > 40)) tiles[idx(x, y)] = ROCK; }
    // 이미르의 해골 동굴 (바위 테, 남쪽 벽 속 숨은 샛길) · 갈라진 바다 (티아마트가 꼭 맞게 막음) · 타르타로스 해안 남쪽 들어서는 곳
    box(A.skull, FLOOR); ring(A.skull, ROCK);
    secrets.push({ name: '숨은 샛길', x: 52, y: A.skull[3] - 1, w: 2, h: 1 });
    box(A.path, FLOOR); box([A.in[0], 214, A.in[0] + A.in[2], A.in[1] + 1], FLOOR);
    // 구간 — 섬마다 땅 모양대로
    const byWho = {};
    for (const [k, who] of owner) if (tiles[k] !== WATER) (byWho[who] = byWho[who] || new Set()).add(k);
    for (const [who, cells] of Object.entries(byWho)) shapes.push([names[who], solidShape(cells, W)]);
    // 흙길 — 모래톱 가운데 · 갈라진 바다
    for (const P of shoalCurves) for (let k = 0; k <= 200; k++) { const [x, y] = bez(P, k / 200); for (let j = -1; j <= 0; j++) for (let i = -1; i <= 0; i++) { const q = idx(Math.round(x) + i, Math.round(y) + j); if (tiles[q] === FLOOR) tiles[q] = ROAD; } }
    road([90, A.path[1] + 14, 92, A.path[3]]);
  });
}

// ---------- 18격 — 올림포스 정상 (손으로 짠 지도, 사용자 결정 2026-11-27) ----------
// 「어느 신화의 주신이든, 결국 정상에서는 마주치게 된다.」 — 산 하나를 여러 면에서 저마다 오르다 정상에서 마주침. 티아마트의 몸이 하늘이 된 길로 남쪽 기슭 구름바다에 닿음.
// 위에서 내려다본 산 — 들쭉날쭉한 등고선처럼 층층이 계단 진 비탈(층 사이 바위턱, 면마다 오르는 계단 자리가 다름), 깊은 골짜기 둘이 산허리를 세 면으로 가름.
// 북쪽 면은 깎아지른 벼랑 — 꼭대기 뒤로만 내려감. 정상에 가까울수록(가운데로 갈수록) 셈.
//   서쪽 면 — 죽음과 해(이집트)       사자의 들판 오시리스 → 해가 떠오르는 바위턱 라
//   가운데 면 — 트리무르티와 인드라    연꽃 못 브라흐마 → 비슈누 → 천 개의 눈 인드라 → 카일라스처럼 솟은 바위의 시바 (트리무르티는 한 면에)
//   동쪽 면 — 하늘 관청(동아시아)      하늘에 걸린 다리 아메노우키하시의 이자나기 → 하늘에서 내려다보는 벼랑의 환인 → 구름 위 관청의 옥황상제
//   정상 둘레 — 주신들의 자리          높은 옥좌 흘리드스캴프의 오딘 → 계단 피라미드의 케찰코아틀 → 꺼지지 않는 불의 제단 아후라 마즈다
//   꼭대기 — 제우스의 왕좌, 그 뒤 북쪽 벼랑으로 내려가는 「별의 길」 → 19격 가라앉은 르뤼에 (장소가 르뤼에로 — 구름 사이로 별이 제자리에 온 바다)
//   숨은 곳 — 정상 북서쪽 바위틈의 암브로시아 저장고 (숨은 샛길, 큰 상자). 작은 상자는 브라흐마의 연꽃 못 · 이자나기의 하늘 다리.
const OLYMPUS = {
  W: 184, H: 196, C: [92, 82], R: [82, 66],
  contours: [0.77, 0.55, 0.35, 0.16], ravines: [135, 45], north: [225, 315],
  stairs: { 0.77: [205, 95, -25], 0.55: [150, 68, 28], 0.35: [192, 112, -8], 0.16: [90] },
  foot: [56, 146, 128, 182],
  place: { // 이름 → [각도(0 동 · 90 남), 가운데에서의 거리(1 = 산기슭)]
    '오시리스': [168, 0.95], '라': [176, 0.72],                                     // 층 가운데 줄은 흙길 — 층의 바깥쪽 · 안쪽 가장자리로 비켜 섬
    '브라흐마': [116, 0.70], '비슈누': [56, 0.62], '인드라': [104, 0.51], '시바': [126, 0.40],      // 가운데 면 — 오르막이 돌지 않는 쪽에
    '이자나기': [12, 0.95], '환인': [-8, 0.72], '옥황상제': [16, 0.51],
    '오딘': [-38, 0.30], '케찰코아틀': [207, 0.27], '아후라 마즈다': [-16, 0.20]
  },
  in: [91, 192, 3], next: [90, 1, 4], start: [92, 178], merchant: [98, 178]
};
function olympusMap(data) {
  const A = OLYMPUS, [cx, cy] = A.C, [rx, ry] = A.R, rad = d => d * Math.PI / 180;
  const zi = data.ZONES.findIndex(z => z.rank === 18), foes = data.ENEMIES.filter(e => e.zoneIndex === zi);
  const at = (deg, f) => [cx + Math.cos(rad(deg)) * rx * f, cy + Math.sin(rad(deg)) * ry * f];
  const spot = {};
  for (const [name, [deg, f]] of Object.entries(A.place)) { const n = foes.find(e => e.name === name).size, [x, y] = at(deg, f); spot[name] = [Math.round(x - n / 2), Math.round(y - n / 2)]; }
  spot['제우스'] = [cx - 2, cy - Math.round(ry * 0.16) + 1];                // 꼭대기 북쪽 끝 — 별의 길 어귀를 몸으로 꼭 막음
  const [bx, by] = at(116, 0.78);                                  // 브라흐마의 연꽃 못
  const store = [cx - 34, cy - 40, cx - 20, cy - 28];
  const spec = { ...A, foes: spot, zones: [], sections: [['구름바다 기슭', A.foot], ['암브로시아 저장고', store], ['제우스의 왕좌', [cx - 12, cy - 12, cx + 12, cy + 12]], ['별의 길', [cx - 6, 0, cx + 6, cy - 10]]],
    chests: [[Math.round(bx) + 0, Math.round(by) + 5], [spot['이자나기'][0], spot['이자나기'][1] - 6], [store[0] + 7, store[1] + 4, 'big']] };
  return handMap(data, 18, spec, c => {
    const { tiles, idx, box, ring, road, secrets, shapes } = c;
    const W = A.W, H = A.H, noise = valueNoise(18);
    const polar = (x, y) => { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; return [Math.hypot(dx, dy) * (1 + (noise(x * 0.09, y * 0.09) - 0.5) * 0.12), Math.atan2(dy, dx) * 180 / Math.PI]; };   // 각도는 at() 과 같은 타원 각도
    const angDiff = (a, b) => Math.abs(((a - b) % 360 + 540) % 360 - 180);
    const inNorth = d => angDiff(d, 270) < 45;
    // 산 — 등고선 바위턱(면마다 계단 자리), 골짜기 둘, 북쪽 벼랑 · 남쪽 구름바다 기슭
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const [r, d] = polar(x, y);
      if (r >= 1) continue;
      let t = FLOOR;
      for (const c0 of A.contours) if (Math.abs(r - c0) < 0.016 && !(A.stairs[c0] || []).some(s => angDiff(d, s) < (c0 === 0.16 ? 14 : 4.5))) t = ROCK;
      if (r > A.contours[2] - 0.01 && r < A.contours[0] && A.ravines.some(a => angDiff(d, a) < 2.2)) t = ROCK;   // 골짜기 — 산허리를 세 면으로
      if (inNorth(d) && r > A.contours[3] - 0.01) t = ROCK;                 // 북쪽 벼랑 — 꼭대기 뒤로만
      tiles[idx(x, y)] = t;
    }
    box(A.foot, FLOOR); box([A.in[0], A.foot[3], A.in[0] + A.in[2], A.in[1] + 1], FLOOR);
    // 별의 길 — 꼭대기에서 북쪽 벼랑을 내려감 (제우스가 어귀를 막음)
    box([cx - 2, 1, cx + 2, cy - Math.round(ry * 0.16) + 2], FLOOR);
    // 상징 — 연꽃 못 · 해 뜨는 바위 · 카일라스 바위 · 하늘 다리(골 위) · 구름 관청(담) · 높은 옥좌 · 계단 피라미드 · 불의 제단 · 왕좌 기둥
    const disk = (x0, y0, r0, t) => { for (let y = Math.floor(y0 - r0); y <= y0 + r0; y++) for (let x = Math.floor(x0 - r0); x <= x0 + r0; x++) if (Math.hypot(x + 0.5 - x0, y + 0.5 - y0) < r0) tiles[idx(x, y)] = t; };
    disk(bx - 6, by - 4, 3, WATER);
    const near = (name, dx, dy, w, h, t) => { const [x, y] = spot[name]; box([x + dx, y + dy, x + dx + w, y + dy + h], t); };
    near('라', -4, -1, 2, 2, ROCK); near('시바', 4, -2, 2, 2, ROCK); near('오딘', -1, -3, 4, 1, ROCK); near('아후라 마즈다', -4, 0, 2, 2, ROCK);
    { const [x, y] = spot['케찰코아틀']; ring([x + 5, y - 2, x + 11, y + 4], ROCK); ring([x + 6, y - 1, x + 10, y + 3], ROCK); }
    { const [x, y] = spot['옥황상제']; ring([x - 5, y - 5, x + 7, y + 7], WALL); box([x - 5, y, x - 4, y + 3], FLOOR); }
    { const [x, y] = spot['이자나기']; for (let k = -6; k <= 6; k++) if (Math.abs(k) > 1) tiles[idx(x - 4, y + k)] = WATER; }   // 하늘 다리 곁 구름 틈
    for (const [x, y] of [[cx - 8, cy - 6], [cx + 6, cy - 6], [cx - 8, cy + 4], [cx + 6, cy + 4]]) box([x, y, x + 2, y + 2], ROCK);
    // 숨은 곳 — 정상 북서쪽 바위틈의 암브로시아 저장고 (정상 둘레에서 숨은 샛길)
    box(store, FLOOR); ring(store, ROCK);
    { const [, sy] = at(215, 0.26), x0 = store[2] - 4, y0 = store[3] - 1, y1 = Math.round(sy);   // 저장고 아래 벽에서 정상 둘레 서북쪽까지 바위 속 좁은 길
      for (let y = y0; y <= y1; y++) for (let x = x0; x < x0 + 2; x++) if (tiles[idx(x, y)] !== FLOOR) tiles[idx(x, y)] = WALL;
      secrets.push({ name: '숨은 샛길', x: x0, y: y0, w: 2, h: y1 - y0 + 1 }); }
    // 구간 — 면마다 · 정상 둘레 (땅 모양대로)
    const sector = (x, y) => { const [r, d] = polar(x, y); if (r >= 1) return null; if (r < A.contours[3]) return null; if (r < A.contours[2]) return '정상 둘레 — 주신들의 자리';
      if (angDiff(d, 180) < 45) return '서쪽 면 — 죽음과 해'; if (angDiff(d, 90) < 45) return '가운데 면 — 트리무르티와 인드라'; if (angDiff(d, 0) < 45) return '동쪽 면 — 하늘 관청'; return null; };
    const groups = {};
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const s0 = sector(x, y); if (s0 && tiles[idx(x, y)] !== WALL) (groups[s0] = groups[s0] || new Set()).add(idx(x, y)); }
    for (const [n, cells] of Object.entries(groups)) shapes.push([n, solidShape(cells, W)]);
    // 흙길 — 층을 따라 돌다가 그 면의 계단 자리에서 한 단 오름 (기슭 → 세 면 → 정상 둘레 → 꼭대기)
    const seg = (p0, p1) => { const n = Math.ceil(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) * 2); for (let k = 0; k <= n; k++) { const x = p0[0] + (p1[0] - p0[0]) * k / n, y = p0[1] + (p1[1] - p0[1]) * k / n; for (let j = -1; j <= 0; j++) for (let i = -1; i <= 0; i++) { const q = idx(Math.round(x) + i, Math.round(y) + j); if (tiles[q] === FLOOR) tiles[q] = ROAD; } } };
    const arc = (f, a0, a1) => { let d = ((a1 - a0) % 360 + 540) % 360 - 180; const n = Math.max(2, Math.ceil(Math.abs(d) / 2)); let prev = at(a0, f); for (let k = 1; k <= n; k++) { const cur = at(a0 + d * k / n, f); seg(prev, cur); prev = cur; } };
    const mids = [0.88, 0.66, 0.45, 0.26];
    seg([cx, A.foot[1] + 4], at(90, mids[0]));
    for (let f = 0; f < 3; f++) {
      let ang = 90;
      [0.77, 0.55, 0.35].forEach((c0, k) => { const s0 = A.stairs[c0][f]; arc(mids[k], ang, s0); seg(at(s0, mids[k]), at(s0, mids[k + 1])); ang = s0; });
      arc(mids[3], ang, 90);
    }
    seg(at(90, mids[3]), at(90, 0.1));
  });
}

// ---------- 19격 — 가라앉은 르뤼에 (손으로 짠 지도, 사용자 결정 2026-11-27) ----------
// 「별이 제자리에 올 때까지 이 도시는 물 밑에서 꿈을 꾼다.」 — 별이 제자리에 와 반쯤 떠오른 가라앉은 도시. 제우스 뒤 별의 길로 남쪽 물가에 닿음.
// 각도가 틀린 도시 — 사람이 지은 것이지만 바둑판이 아니라 비스듬히 기운 덩어리 건물들, 군데군데 물에 잠김. 굽이치는 물길 둘이 도시를 세 갈래로 가름.
//   서쪽 원소별 옛 지배자(묶음 넷 — 한 갈래)  잠긴 만 물의 탑 다곤 → 바람의 탑 하스터 → 불의 탑 크투가 → 땅속으로 꺼진 흙의 탑 츠아토구아
//   가운데 홀로 깨어 있는 옛 지배자들          뱀 굴 이그 → 기운 첨탑 이타콰 → 동굴의 코끼리 신 차우그나르 파우근 → 잠긴 호수의 글라아키
//   동쪽 옛 것들의 종과 손님(돌아다님)        잠긴 지하 수로 쇼고스 → 유고스에서 온 균류 정원 미-고
//   무덤 앞 광장 — 심연에 거미줄을 치는 아틀락-나챠(레벨이 크게 뛰어 세 갈래가 만난 뒤에) → 심연 위 다리 → 거대한 무덤 속 좁은 길을 막고 잠든 크툴루
//   그 너머 별 바깥으로 열린 틈 → 20격 궁극의 혼돈 (장소가 바깥으로). 숨은 곳 — 반쯤 잠긴 신전 밑 네크로노미콘(숨은 샛길, 큰 상자). 작은 상자는 다곤의 잠긴 만 · 미-고의 균류 정원.
const RLYEH = {
  W: 176, H: 200,
  city: [12, 42, 164, 176], shore: [30, 176, 146, 196], abyss: [12, 36, 164, 42], tomb: [66, 6, 110, 36], gate: [86, 91],
  canals: [[58, 5, 14, 0], [118, 5, 11, 1]], lanes: [[34, 4, 17], [88, 5, 13], [140, 4, 15]],
  bay: [8, 138, 21, 158], lake: [108, 70, 5], temple: [64, 84, 79, 97],
  foes: {
    '다곤': [22, 146], '하스터': [44, 118], '크투가': [16, 86], '츠아토구아': [44, 58],
    '이그': [70, 160], '이타콰': [100, 134], '차우그나르 파우근': [70, 112], '글라아키': [96, 74],
    '아틀락-나챠': [100, 43], '크툴루': [86, 26]
  },
  zones: [['쇼고스', [122, 116, 164, 170]], ['미-고', [122, 56, 164, 104]]],
  chests: [[24, 160], [152, 62], [71, 90, 'big']],
  in: [87, 196, 3], next: [86, 7, 4], start: [88, 188], merchant: [96, 188]
};
function rlyehMap(data) {
  const A = RLYEH;
  const spec = { ...A, sections: [['남쪽 물가', A.shore], ['원소의 탑 거리', [12, 52, 57, 176]], ['옛 지배자들의 기운 거리', [61, 52, 116, 176]], ['종들의 잠긴 구역', [121, 52, 164, 176]],
    ['반쯤 잠긴 신전 밑', A.temple], ['무덤 앞 광장', [12, 42, 164, 52]], ['심연', A.abyss], ['크툴루의 무덤', [66, 0, 110, 36]]] };
  return handMap(data, 19, spec, c => {
    const { tiles, idx, box, ring, road, secrets } = c;
    const W = A.W, H = A.H, noise = valueNoise(19);
    const hash = (x, y, s) => { const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); };
    const disk = (x0, y0, r0, t) => { for (let y = Math.floor(y0 - r0); y <= y0 + r0; y++) for (let x = Math.floor(x0 - r0); x <= x0 + r0; x++) if (Math.hypot(x + 0.5 - x0, y + 0.5 - y0) < r0) tiles[idx(x, y)] = t; };
    const laneX = ([x0, a, p], y) => x0 + a * Math.sin(y / p);
    // 바다 위로 반쯤 떠오른 도시 · 남쪽 물가 · 무덤 앞 심연 (다리 하나) · 거대한 무덤 (가운데 좁은 길만)
    for (let k = 0; k < W * H; k++) tiles[k] = WATER;
    box(A.city, FLOOR);
    { const [x0, y0, x1, y1] = A.shore, scx = (x0 + x1) / 2, scy = (y0 + y1) / 2, srx = (x1 - x0) / 2, sry = (y1 - y0) / 2 + 2;   // 남쪽 물가 — 들쭉날쭉한 모래톱
      for (let y = y0 - 4; y < y1 + 2; y++) for (let x = x0 - 6; x < x1 + 6; x++) if (Math.hypot((x + 0.5 - scx) / srx, (y + 0.5 - scy) / sry) < 1 + (noise(x * 0.13 + 9, y * 0.13) - 0.5) * 0.35 || y < y0 + 2 && x >= x0 && x < x1) tiles[idx(x, y)] = FLOOR; }
    box([A.in[0], A.shore[1], A.in[0] + A.in[2], A.in[1] + 1], FLOOR);
    const nearFoeOrChest = (x, y, d) => Object.values(A.foes).some(([fx, fy]) => x >= fx - d && x < fx + 5 + d && y >= fy - d && y < fy + 5 + d) || A.chests.some(([cx, cy]) => Math.abs(x - cx) <= d && Math.abs(y - cy) <= d);
    for (let y = A.city[1] + 10; y < A.city[3]; y++) for (let x = A.city[0]; x < A.city[2]; x++) {
      const edge = Math.min(x - A.city[0], A.city[2] - 1 - x);   // 들쭉날쭉한 물가 — 도시 동 · 서 가장자리가 바다에 먹힘 (네모가 아니게, 남쪽 물가 쪽은 이어 둠)
      if (!nearFoeOrChest(x, y, 4) && (noise(x * 0.07, y * 0.07) > 0.82 || edge < 7 * noise(x * 0.11 + 5, y * 0.11 + 5) - 1)) tiles[idx(x, y)] = WATER;   // 군데군데 잠긴 곳
    }
    box(A.abyss, WATER); box([A.gate[0], A.abyss[1], A.gate[1], A.abyss[3]], FLOOR);
    box(A.tomb, WALL); box([A.gate[0], A.next[1], A.gate[1], A.tomb[3]], FLOOR);
    // 굽이치는 물길 둘 — 도시를 세 갈래로 (남쪽 물가 · 무덤 앞 광장에서만 이어짐)
    for (const [x0, a, p, ph] of A.canals) for (let y = 52; y < A.city[3]; y++) { const cx = x0 + a * Math.sin(y / p + ph); for (let x = Math.floor(cx - 2); x <= cx + 2; x++) tiles[idx(x, y)] = WATER; }
    // 갈래마다 상징 — 잠긴 만 · 원소의 탑(기운 사각) · 꺼진 흙의 탑 · 뱀 굴 · 기운 첨탑 · 코끼리 신의 동굴 · 잠긴 호수 · 반쯤 잠긴 신전
    box(A.bay, WATER);
    const skew = (x0, y0, w, h, sh, t) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) tiles[idx(Math.round(x0 + i + j * sh), y0 + j)] = t; };   // 비스듬히 기운 덩어리
    const by = n => A.foes[n];
    { const [x, y] = by('하스터'); skew(x + 5, y - 5, 4, 6, 0.5, WALL); }
    { const [x, y] = by('크투가'); skew(x + 7, y - 2, 5, 5, -0.6, WALL); }
    { const [x, y] = by('츠아토구아'); for (let k = 0; k < 360; k += 12) { if (k > 60 && k < 120) continue; tiles[idx(Math.round(x + 1 + Math.cos(k * Math.PI / 180) * 6), Math.round(y + 1 + Math.sin(k * Math.PI / 180) * 5))] = ROCK; } }
    { const [x, y] = by('다곤'); skew(x + 6, y - 6, 4, 5, 0.4, WALL); }
    { const [x, y] = by('이그'); for (const [i, j] of [[-3, -2], [4, -3], [-3, 3], [4, 3]]) tiles[idx(x + i, y + j)] = ROCK; }
    { const [x, y] = by('이타콰'); skew(x - 7, y - 4, 3, 8, 0.7, WALL); }
    { const [x, y] = by('차우그나르 파우근'); for (let k = 0; k < 360; k += 10) { if (k > 330 || k < 30) continue; tiles[idx(Math.round(x + 1 + Math.cos(k * Math.PI / 180) * 5), Math.round(y + 1 + Math.sin(k * Math.PI / 180) * 4))] = ROCK; } }
    disk(A.lake[0], A.lake[1], A.lake[2], WATER);
    box(A.temple, FLOOR); ring(A.temple, WALL);
    secrets.push({ name: '숨은 샛길', x: A.temple[2] - 1, y: 90, w: 1, h: 2 });
    // 흙길 — 갈래마다 굽은 큰길 · 물가 가로 길 · 광장 가로 길 · 심연 위 다리에서 무덤 속으로
    const mark = (x, y) => { for (let j = -1; j <= 0; j++) for (let i = -1; i <= 0; i++) { const q = idx(Math.round(x) + i, Math.round(y) + j); if (tiles[q] === FLOOR) tiles[q] = ROAD; } };
    for (const L of A.lanes) for (let y = 49; y <= 184; y += 0.5) mark(laneX(L, y), y);
    for (let x = 32; x <= 144; x += 0.5) { mark(x, 184); mark(x, 50); }
    road([A.gate[0] + 1, A.next[1] + 1, A.gate[0] + 3, A.abyss[3]]); road([A.in[0], 184, A.in[0] + 2, A.in[1] + 1]);
    // 비스듬히 기운 건물 덩어리들 — 길 · 자리 · 상자 곁은 비움 (갈래 안에서만)
    const clear = (x, y, d) => Object.values(A.foes).some(([fx, fy]) => x >= fx - d && x < fx + 5 + d && y >= fy - d && y < fy + 5 + d) || A.chests.some(([cx, cy]) => Math.abs(x - cx) <= d && Math.abs(y - cy) <= d)
      || (x >= A.temple[0] - 2 && x < A.temple[2] + 2 && y >= A.temple[1] - 2 && y < A.temple[3] + 2);
    const roadNear = (x, y, d) => { for (let j = -d; j <= d; j++) for (let i = -d; i <= d; i++) { const t = tiles[idx(x + i, y + j)]; if (t === ROAD) return true; } return false; };
    for (let y = 56; y < 172; y += 7) for (let x = 14; x < 162; x += 9) {
      if (hash(x, y, 3) < 0.45) continue;
      const w = 3 + Math.floor(hash(x, y, 4) * 4), h = 3 + Math.floor(hash(x, y, 5) * 3), sh = (hash(x, y, 6) - 0.5) * 1.4, ox = x + Math.floor(hash(x, y, 7) * 4);
      let ok = true;
      for (let j = -1; j <= h && ok; j++) for (let i = -1; i <= w; i++) { const xx = Math.round(ox + i + j * sh), yy = y + j; if (tiles[idx(xx, yy)] !== FLOOR || clear(xx, yy, 3) || roadNear(xx, yy, 2)) { ok = false; break; } }
      if (ok) skew(ox, y, w, h, sh, WALL);
    }
  });
}

// ---------- 20격 — 궁극의 혼돈 (손으로 짠 지도, 사용자 결정 2026-11-27) ----------
// 「여기엔 위도 아래도 없다. 신화도 없다. 신화는 인간의 것이니까.」 — 우주 한가운데, 눈먼 백치 신 아자토스의 궁정. 크툴루 무덤 너머 틈으로 혼돈의 바깥 가장자리에 떨어짐.
// 땅이 없는 어둠 속 크고 작은 조각들, 가는 실 같은 길로 이어짐. 위아래 없이 가장자리에서 중심으로 — 세 소용돌이가 같은 방향으로 휘감기며 빨려 들어감.
//   첫째 소용돌이(처음의 웅덩이들 — 가장 약함)  슈브니구라스(천 마리 새끼의 검은 염소) → 우보-사틀라(모든 것의 처음이자 끝) → 아브호스(새것을 게워내는 웅덩이)
//   둘째 소용돌이(시간과 공간 바깥)            다올로스(장막을 찢는 자) → 요그소토스(문이자 열쇠이며 문지기 — 곁에 숨은 은열쇠의 방) → 이브-츠틀(시간 바깥에서 기다리는)
//   셋째 소용돌이(궁정으로 가는 길 — 가장 셈)  공허의 군주(하나뿐) → 툴주샤(궁정의 초록 불꽃) → 니알라토텝(바깥 신들의 사자) → 그로스(별을 깨우며 떠도는 행성)
//   중심 — 백치 신의 궁정: 둘레를 돌며 피리를 멈추지 않는 아자토스의 피리꾼(돌아다님) · 한가운데 아자토스 (마지막 — 뒤 문 없음)
// 바깥 가장자리 실 길이 떨어진 조각에서 둘째 · 셋째 소용돌이 들머리로, 뒤 소용돌이 들머리에서 앞 소용돌이 허리로 실 다리 — 갈래를 바꿀 수 있음.
// 작은 상자는 아브호스의 웅덩이 가 · 그로스가 떠도는 조각.
const CHAOS = {
  W: 204, H: 204, C: [102, 100],
  arms: [[90, '첫째 소용돌이 — 처음의 웅덩이들'], [210, '둘째 소용돌이 — 시간과 공간 바깥'], [330, '셋째 소용돌이 — 궁정으로 가는 길']],
  turn: 240, r0: 82, r1: 31, court: 28, strand: 3.2,
  place: { // 이름 → [소용돌이, 0~1 자리]
    '슈브니구라스': [0, 0.18], '우보-사틀라': [0, 0.42], '아브호스': [0, 0.82],                  // 실 다리(210 · 330도)가 붙는 허리는 비켜서
    '다올로스': [1, 0.16], '요그소토스': [1, 0.58], '이브-츠틀': [1, 0.84],
    '공허의 군주': [2, 0.12], '툴주샤': [2, 0.38], '니알라토텝': [2, 0.64], '그로스': [2, 0.9]
  },
  in: [101, 200, 3], start: [102, 190], merchant: [108, 190]
};
function chaosMap(data) {
  const A = CHAOS, [cx, cy] = A.C, rad = d => d * Math.PI / 180;
  const zi = data.ZONES.findIndex(z => z.rank === 20), foes = data.ENEMIES.filter(e => e.zoneIndex === zi);
  const armAt = (k, t) => { const th = A.arms[k][0] + A.turn * t, r = A.r0 - (A.r0 - A.r1) * t; return [cx + Math.cos(rad(th)) * r, cy + Math.sin(rad(th)) * r, th, r]; };
  const polarAt = (th, r) => [cx + Math.cos(rad(th)) * r, cy + Math.sin(rad(th)) * r];
  const spot = {};
  for (const [name, [k, t]] of Object.entries(A.place)) { const n = foes.find(e => e.name === name).size, [, , th, r] = armAt(k, t), [x, y] = polarAt(th, r + 6.5); spot[name] = [Math.round(x - n / 2), Math.round(y - n / 2)]; }
  spot['아자토스'] = [cx - 2, cy - 2];
  const [kx, ky] = (() => { const [, , th, r] = armAt(1, 0.5); return polarAt(th - 9, r + 15); })();   // 은열쇠의 방 — 요그소토스 곁 바깥쪽
  const keyRoom = [Math.round(kx) - 6, Math.round(ky) - 5, Math.round(kx) + 6, Math.round(ky) + 5];
  const chestOff = (k, t) => { const [, , th, r] = armAt(k, t); const [x, y] = polarAt(th, r + 6); return [Math.round(x), Math.round(y)]; };
  const spec = { ...A, foes: spot, next: null,
    sections: [['혼돈의 가장자리 — 떨어진 조각', [86, 180, 120, 204]], ['은열쇠의 방', keyRoom]],
    zones: [['아자토스의 피리꾼', [cx - A.court, cy - A.court, cx + A.court, cy + A.court]]],
    chests: [chestOff(0, 0.7), chestOff(2, 0.78), [keyRoom[0] + 6, keyRoom[1] + 4, 'big']] };
  return handMap(data, 20, spec, c => {
    const { tiles, idx, box, ring, road, secrets, shapes } = c;
    const W = A.W, H = A.H, noise = valueNoise(20), owner = new Map();
    const put = (x, y, who) => { x = Math.round(x); y = Math.round(y); if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) return; const q = idx(x, y); tiles[q] = FLOOR; if (who !== undefined && !owner.has(q)) owner.set(q, who); };
    const blob = (x0, y0, rx, ry, who) => { for (let y = Math.floor(y0 - ry * 1.4); y <= y0 + ry * 1.4; y++) for (let x = Math.floor(x0 - rx * 1.4); x <= x0 + rx * 1.4; x++) if (Math.hypot((x + 0.5 - x0) / rx, (y + 0.5 - y0) / ry) < 1 + (noise(x * 0.17, y * 0.17) - 0.5) * 0.6) put(x, y, who); };
    const thread = (pts, who) => { for (let k = 0; k + 1 < pts.length; k++) { const [a, b] = [pts[k], pts[k + 1]], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2); for (let i = 0; i <= n; i++) { const x = a[0] + (b[0] - a[0]) * i / n, y = a[1] + (b[1] - a[1]) * i / n; for (let j = -A.strand / 2; j <= A.strand / 2; j += 0.5) for (let ii = -A.strand / 2; ii <= A.strand / 2; ii += 0.5) if (Math.hypot(ii, j) <= A.strand / 2) put(x + ii, y + j, who); } } };
    const spiral = (k, t0, t1) => { const pts = []; for (let i = 0; i <= 60; i++) pts.push(armAt(k, t0 + (t1 - t0) * i / 60)); return pts; };
    const arc = (r, th0, th1) => { const pts = []; for (let i = 0; i <= 50; i++) pts.push(polarAt(th0 + (th1 - th0) * i / 50, r)); return pts; };
    // 떨어진 조각(들머리) · 세 소용돌이(조각 사슬과 실 길) · 바깥 가장자리 실 길 · 뒤 소용돌이 들머리에서 앞 소용돌이 허리로 실 다리 · 중심 궁정
    blob(cx, 188, 15, 8, 'edge'); box([A.in[0], 192, A.in[0] + A.in[2], A.in[1] + 1], FLOOR);
    for (let k = 0; k < 3; k++) {
      thread(spiral(k, 0, 1), k);
      for (let i = 0; i <= 6; i++) { const t = i / 6, [x, y, th, r] = armAt(k, t), [bx, by] = polarAt(th, r + 3); blob(bx, by, 9 - t * 2, 8 - t * 2, k); }
      for (const [n, [kk, t]] of Object.entries(A.place)) if (kk === k) { const [, , th, r] = armAt(k, t), [bx, by] = polarAt(th, r + 6); blob(bx, by, 8, 7, k); }   // 사는 자마다 제 조각
      for (const t of [k === 0 ? 0.7 : -1, k === 2 ? 0.78 : -1]) if (t >= 0) { const [, , th, r] = armAt(k, t), [bx, by] = polarAt(th, r + 6); blob(bx, by, 6, 5, k); }
    }
    thread(arc(A.r0 + 4, 90, 210), 'edge'); thread(arc(A.r0 + 4, 90, -30), 'edge');
    thread([polarAt(210, A.r0), polarAt(210, A.r0 - (A.r0 - A.r1) * 0.5)], 1); thread([polarAt(330, A.r0), polarAt(330, A.r0 - (A.r0 - A.r1) * 0.5)], 2);
    blob(cx, cy, A.court, A.court * 0.95, 'court');
    // 은열쇠의 방 — 요그소토스 곁 바깥쪽에 떠 있는 닫힌 조각, 보이지 않는 실 다리(숨은 샛길)
    box(keyRoom, FLOOR); ring(keyRoom, WALL);
    { const [sx, sy] = spot['요그소토스'], x0 = Math.min(sx, keyRoom[0] + 6), x1 = Math.max(sx, keyRoom[0] + 6), ty = keyRoom[3] - 1;
      const cells = []; for (let y = Math.min(ty, sy - 1); y <= Math.max(ty, sy - 1); y++) cells.push([keyRoom[0] + 6, y]);
      for (const [x, y] of cells) if (tiles[idx(x, y)] !== FLOOR) tiles[idx(x, y)] = WALL;
      secrets.push({ name: '숨은 샛길', x: keyRoom[0] + 6, y: Math.min(ty, sy - 1), w: 1, h: Math.abs(sy - 1 - ty) + 1 }); }
    // 구간 — 소용돌이마다 · 궁정 (조각 모양대로)
    const names = ['첫째 소용돌이 — 처음의 웅덩이들', '둘째 소용돌이 — 시간과 공간 바깥', '셋째 소용돌이 — 궁정으로 가는 길'];
    const byWho = {};
    for (const [q, who] of owner) if (tiles[q] === FLOOR) (byWho[who] = byWho[who] || new Set()).add(q);
    for (const [who, cells] of Object.entries(byWho)) if (who !== 'edge') shapes.push([who === 'court' ? '백치 신의 궁정' : names[who], solidShape(cells, W)]);
    // 흙길 — 소용돌이 가운데 실 · 바깥 가장자리 실 · 실 다리 · 들머리에서 첫째 소용돌이로
    const mark = (x, y) => { for (let j = -1; j <= 0; j++) for (let i = -1; i <= 0; i++) { const q = idx(Math.round(x) + i, Math.round(y) + j); if (tiles[q] === FLOOR) tiles[q] = ROAD; } };
    const markPts = pts => { for (let k = 0; k + 1 < pts.length; k++) { const [a, b] = [pts[k], pts[k + 1]], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2); for (let i = 0; i <= n; i++) mark(a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n); } };
    for (let k = 0; k < 3; k++) markPts(spiral(k, 0, 1));
    markPts(arc(A.r0 + 4, 90, 210)); markPts(arc(A.r0 + 4, 90, -30));
    markPts([polarAt(210, A.r0), polarAt(210, A.r0 - (A.r0 - A.r1) * 0.5)]); markPts([polarAt(330, A.r0), polarAt(330, A.r0 - (A.r0 - A.r1) * 0.5)]);
    markPts([[cx, 192], polarAt(90, A.r0)]);
  });
}

// ---------- 관리자 방 (adminroom) — 관리자 창(시험 모드)에서만 들어가는 방, 격마다 문 하나 (사용자 결정 2026-11-27) ----------
// 문으로 들어서면 그 격의 지역으로 건너가 그 격 지도의 들머리에 섬 (ui.js 의 goThroughPort — 문 속성 adminZone). 일반 지도와는 이어지지 않음.
// 위 벽에 1~10격, 아래 벽에 11~20격.
function adminRoom(data) {
  const W = 48, H = 28, tiles = new Uint8Array(W * H).fill(WALL);
  for (let y = 3; y < H - 3; y++) for (let x = 2; x < W - 2; x++) tiles[y * W + x] = FLOOR;
  const ports = data.ZONES.map((z, i) => {
    const top = i < 10, k = top ? i : i - 10, x = 4 + k * 4, y = top ? 2 : H - 3;
    tiles[y * W + x] = FLOOR; tiles[y * W + x + 1] = FLOOR;
    return { name: `r${z.rank}`, label: `${z.rank}격 ${z.name}`, x, y, w: 2, h: 1, to: `zone.${z.id}`, adminZone: z.id };
  });
  return buildTmj({ w: W, h: H, tiles, ports, npcs: [{ name: 'start', x: W >> 1, y: H >> 1 }], props: { title: '관리자 방', interior: true } });
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
  const out = { sewer: sewer(data), overworld: overworld(data), oldtown: oldtown(), city: city(), dept: deptInterior(), dept2: dept2Interior(), assoc: assocInterior(), guild: guildInterior(), guild2: guild2Interior(), home: homeInterior(), arena: arenaInterior(), bm: bmInterior(), home2: home2Interior(), gatein: gateinInterior(), chief: chiefInterior(), raid: raidInterior(), w1: storeInterior(W1), w2: storeInterior(W2), w3: storeInterior(W3), sky: storeInterior(SKY) };
  for (const s of SECRET_ROOMS) out[s.id] = secretRoom(data, s);
  for (const c of CAVES) out[c.id] = caveMap(data, c);
  for (const u of UNDERS) out[u.id] = cryptMap(data, u);
  for (const g of BIG_GUILD_ROOMS) out[g.id] = storeInterior(g, data);
  out.abyss = abyssMap(data);
  out[DEMON_CASTLE.id] = buildingInterior(data, DEMON_CASTLE);
  for (const b of BUILDINGS) out[b.id] = b.room ? storeInterior(ROOMS[b.room], data) : buildingInterior(data, b);
  for (const m of RANK_MAPS) out[m.id] = m.custom(data);
  out.adminroom = adminRoom(data);
  return out;
}

module.exports = { erodeShore, TILE, FLOOR, WALL, WATER, TREE, ROCK, ROAD, buildTmj, tilesPng, looksPng, encodePng, generate, sewer, overworld, oldtown, city, deptInterior, dept2Interior, assocInterior, guildInterior, guild2Interior, homeInterior, home2Interior, arenaInterior, bmInterior, gateinInterior, chiefInterior, raidInterior, storeInterior, OLDTOWN, CITY, DEPT, DEPT2, ASSOC, GUILD, GUILD2, HOME, HOME2, ARENA, BM, GATEIN, CHIEF, RAID, W1, W2, W3, SKY, CITY_BIO, secretRoom, buildingInterior, allMaps, layoutFromPlan, RANK_MAPS, rankMapId, adminRoom, PLACES, placeOf, ALEX, alexandriaMap, CAMELOT, camelotMap, AVALON, avalonMap, MURIM, murimMap, TIANSHAN, tianshanMap, naturalize, wavyBand, SANCTUARY, sanctuaryMap, ELYSIUM, elysiumMap, HEAVEN, heavenMap, INFERNO, infernoMap, YGGDRASIL, yggdrasilMap, PRIMORDIAL, primordialMap, OLYMPUS, olympusMap, RLYEH, rlyehMap, CHAOS, chaosMap, handMap, solidShape, SEWER, SECRET_ROOMS, CAVES, caveMap, BUILDINGS, BUILD, DOORWAY, CARPET, RUIN, UNDERS, ABYSS, DEMON_CASTLE, abyssMap };
