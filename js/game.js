// ============================================================
//  game.js  —  게임 규칙과 상태
//  화면 그리는 코드는 전혀 없습니다. 순수 로직만.
// ============================================================

// ---------- 세이브 슬롯 ----------
// 슬롯 두 개를 따로 씁니다. 슬롯을 고르기 전에는 아무것도 저장되지 않습니다.
const SAVE_SLOTS = 2;
const saveKey = n => `jjunsgame.rpg.v3.slot${n}`;
const runKey  = n => `${saveKey(n)}.run`;   // 진행 중인 회차 — 아래 「진행 중인 회차」

let currentSlot = 0;               // 0 = 아직 안 고름 (초기화면)

// 각 슬롯에 뭐가 들었는지 — 초기화면에 보여줄 요약
function slotSummary(n) {
  try {
    const raw = localStorage.getItem(saveKey(n));
    if (!raw) return null;
    const s = summarizeMeta(JSON.parse(raw));
    s.run = runSummary(n);
    return s;
  } catch (e) { return null; }
}

// 그 칸에 이어서 할 회차가 있으면 어디까지 왔는지 — 끝난 회차는 없는 것으로 칩니다
function runSummary(n) {
  try {
    const d = JSON.parse(localStorage.getItem(runKey(n)) || 'null');
    if (!d || d.v !== RUN_SAVE_VERSION || d.over || !ZONES[d.zoneIndex]) return null;
    return { zone: d.zoneIndex + 1, level: d.level, energy: d.energy };
  } catch (e) { return null; }
}

// 저장 내용 한 덩이를 초기화면에 보여줄 요약으로 — 가져오기 전에 미리 보여줄 때도 씁니다
function summarizeMeta(d) {
  const owned = d.owned && !Array.isArray(d.owned) ? Object.keys(d.owned).length : (d.owned || []).length;
  return {
    runCount: d.runCount || 0,
    bestLevel: d.bestLevel || 1,
    bestZone: d.bestZone || 1,
    owned,
    bosses: (d.bossesBeaten || []).length,
    cleared: !!d.cleared
  };
}

// ---------- 세이브 내보내기 / 가져오기 ----------
// 세이브는 브라우저마다 따로 저장돼서 폰 ↔ PC, 파일로 연 것 ↔ 주소로 연 것 사이에 옮겨지지 않습니다.
// 저장 내용을 글자 한 줄(세이브 코드)로 바꿔서 복사하거나 파일로 옮깁니다.
//   JJG1.<base64(gzip(json))>   압축한 것 — 요즘 브라우저는 다 됩니다
//   JJG0.<base64(json)>         압축을 못 하는 브라우저용
// 안의 json 은 { game, v, at, slot, meta } 이고, meta 가 localStorage 에 들어가는 그대로입니다.
// 가져온 뒤 그 슬롯을 열 때 load() 를 거치므로, 예전 형식(겹 시스템 등)도 알아서 옮겨집니다.
// 진행 중인 회차(레벨·에너지)는 코드에 들어가지 않습니다 — 가져간 쪽에서는 새 회차로 시작합니다.
const SAVE_CODE_GAME = 'jjunsgame';

function bytesToB64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function b64ToBytes(b64) {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function pipeBytes(bytes, transform) {
  const stream = new Blob([bytes]).stream().pipeThrough(transform);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function exportSaveCode(n) {
  const raw = localStorage.getItem(saveKey(n));
  if (!raw) return null;
  const json = JSON.stringify({ game: SAVE_CODE_GAME, v: 3, at: Date.now(), slot: n, meta: JSON.parse(raw) });
  const bytes = new TextEncoder().encode(json);
  if (typeof CompressionStream === 'function') {
    try { return 'JJG1.' + bytesToB64(await pipeBytes(bytes, new CompressionStream('gzip'))); } catch (e) {}
  }
  return 'JJG0.' + bytesToB64(bytes);
}

// 세이브 코드를 풀어서 meta 를 돌려줍니다. 못 쓰는 코드면 이유를 담아 throw 합니다.
// localStorage 에 든 날것의 json 을 그대로 붙여넣어도 받아줍니다.
async function parseSaveCode(text) {
  const code = String(text || '').trim();
  if (!code) throw new Error('붙여넣은 내용이 없습니다.');

  let obj;
  if (!code.startsWith('JJG')) {
    // 날것의 저장 내용(json)을 그대로 붙여넣은 경우
    try { obj = JSON.parse(code); } catch (e) { obj = null; }
    if (!obj || typeof obj !== 'object') {
      throw new Error('세이브 코드가 아닙니다. JJG 로 시작하는 글자 전체를 붙여넣어 주세요.');
    }
    if (!obj.game) obj = { game: SAVE_CODE_GAME, meta: obj };
  } else {
    const m = /^JJG([01])\.([A-Za-z0-9+/=\s]+)$/.exec(code);
    if (!m) throw new Error('코드가 잘렸거나 망가졌습니다.');
    let bytes;
    try { bytes = b64ToBytes(m[2].replace(/\s+/g, '')); } catch (e) { throw new Error('코드가 잘렸거나 망가졌습니다.'); }
    if (m[1] === '1') {
      if (typeof DecompressionStream !== 'function') throw new Error('이 브라우저는 압축된 세이브 코드를 열 수 없습니다.');
      try { bytes = await pipeBytes(bytes, new DecompressionStream('gzip')); }
      catch (e) { throw new Error('코드가 잘렸거나 망가졌습니다.'); }
    }
    try { obj = JSON.parse(new TextDecoder().decode(bytes)); } catch (e) { throw new Error('코드가 잘렸거나 망가졌습니다.'); }
  }

  const meta = obj && obj.meta;
  if (obj.game !== SAVE_CODE_GAME || !meta || typeof meta !== 'object' || Array.isArray(meta)) {
    throw new Error('이 게임의 세이브가 아닙니다.');
  }
  if (!('owned' in meta) && !('runCount' in meta)) throw new Error('저장 내용이 비어 있습니다.');
  return meta;
}

// 가져온 저장 내용을 그 슬롯에 씁니다 (있던 기록은 덮어씁니다).
// 그 칸에서 하던 회차는 버립니다 — 다른 기록 위에서 이어지면 안 되니까요.
function importSave(n, meta) {
  localStorage.setItem(saveKey(n), JSON.stringify(meta));
  try { localStorage.removeItem(runKey(n)); } catch (e) {}
}

function hasAnySave() {
  for (let n = 1; n <= SAVE_SLOTS; n++) if (slotSummary(n)) return true;
  return false;
}

// 슬롯을 열고 게임을 시작합니다. fresh 면 그 슬롯을 비우고 새로 시작.
// 하던 회차가 저장돼 있으면 그 자리에서 이어갑니다.
function openSlot(n, fresh) {
  currentSlot = n;
  State.meta = freshMeta();
  if (fresh) wipeSlot(n);
  else load();
  if (fresh || !loadRun()) startRun();
}

function wipeSlot(n) {
  try {
    localStorage.removeItem(saveKey(n));
    localStorage.removeItem(runKey(n));
  } catch (e) {}
}

// ---------- 상태 ----------
// meta  = 회차가 끝나도 살아남는 것 (전리품, 기록)
// run   = 이번 여정에만 존재하는 것 (레벨, 경험치, 에너지, 위치)
// 모든 부위를 비워둔 착용표 — 특수장비 칸 넷도 들어 있습니다 (닫혀 있어도 자리는 있습니다)
function emptyEquipped() {
  return Object.fromEntries(ALL_SLOT_IDS.map(s => [s, null]));
}

// 부위마다 0 — 강화 단계가 이 모양입니다
function slotZeros() {
  return Object.fromEntries(SLOT_IDS.map(s => [s, 0]));
}

// 강화석은 열세 부위에 「특수장비」 하나가 더 붙습니다 — 특수장비를 분해하면 여기로 모입니다
function stoneZeros() {
  return { ...slotZeros(), special: 0 };
}

// 분배 비율의 기본값. STAT_KEYS 를 따라가야 스탯이 늘어도 NaN 이 안 샙니다.
// (행운을 추가했을 때 여기를 안 고쳐서 생명까지 NaN 이 됐던 적이 있습니다.)
function defaultWeights() {
  return Object.fromEntries(STAT_KEYS.map(k => [k, 1]));
}

// ---------- 설정 ----------
// 한 판을 끝까지 시뮬레이션해보고 **실제로 반복되는 조작**을 세어서 골랐습니다.
// 76회차 동안:
//   장비 갈아입기 4085번 (회차당 54번)  → autoEquip
//   전투 2339번 중 패배는 71번(3%)뿐    → autoContinue (거의 언제나 "계속한다"만 누름)
//   물러남 224번
// 숫자가 큰 것부터 덜어주는 것이 설정의 값어치입니다.
function defaultSettings() {
  return {
    autoContinue: 0,    // 전투 결과를 스스로 넘기기까지의 시간(ms). 0 이면 안 넘김
    autoEquip: false,   // 새로 얻은 것이 지금 낀 것보다 나으면 알아서 갈아끼우기
    dropFx: true,       // 전리품이 뒤늦게 튀어나오는 연출
    showLocked: false,  // 아직 못 얻은 ???? 를 기본으로 펼쳐둘 것인가
    battleSpeed: 2      // 전투 보기 — 0 끔 · 1 빠르게 · 2 보통
  };
}

// 화면에서 뺀 설정 — 열 때마다 기본값으로 돌려둡니다.
// 예전에 바꿔둔 값이 고칠 수 없는 채로 남아 있으면 안 되니까요.
// 알아서 갈아끼우기 · 결과 자동 넘기기는 아예 뺐습니다(꺼짐).
// 보기 셋(전투 보기 · 전리품 등장 연출 · 못 얻은 것 펼쳐두기)은 관리자 창에서 바꿉니다 — 그래서 여기 없습니다.
const FIXED_SETTINGS = ['autoContinue', 'autoEquip'];

const State = {
  meta: {
    owned: {},                        // 전리품 id → 1 (가진 것만 들어 있습니다)
    stones: stoneZeros(),             // 부위 → 강화석. 이미 가진 전리품을 분해해서 모읍니다 (특수장비 포함)
    enhance: slotZeros(),             // 부위 → 강화 단계 (0 ~ ENHANCE_MAX)
    equipped: emptyEquipped(),
    weights: defaultWeights(),        // 앞으로 들어올 포인트의 분배 규칙
    autoAlloc: true,                  // 레벨업 때 알아서 찍어줄 것인가
    seen: [],                         // 한 번이라도 마주친 적 id
    tutorialDone: false,         // 튜토리얼을 봤는가
    sets: [null, null, null],    // 세 벌의 차림. equipped 는 늘 sets[activeSet] 과 같습니다
    activeSet: 0,                // 지금 입고 있는 세트 번호
    settings: defaultSettings(),
    fresh: {},                   // 부위 → 아직 안 열어본 새 전리품 id 목록 — 이름이 드러납니다
    bossesBeaten: [],                 // 지금까지 꺾어본 보스 id — 영구 경험치 배수의 근거
    banked: [],                       // 격을 삼켜 에너지를 영구 적립한 적 id
    specialOpened: [],                // 특수장비 칸을 열어준 히든 id — 이 수만큼 칸이 열려 있습니다
    runCount: 0,
    bestLevel: 1,
    bestKill: 0,                      // 지금까지 꺾은 가장 높은 레벨
    bestZone: 1,                      // 지금까지 도달한 가장 깊은 지역 (1부터)
    cleared: false                    // 아자토스를 꺾은 적이 있는가
  },
  run: null,
  log: []
};

// 가졌는가
function owns(itemId) { return !!(itemId && State.meta.owned[itemId]); }
function ownedIds() { return Object.keys(State.meta.owned); }

// ---------- 특수장비 칸 ----------
// 열린 칸 수 = 처음 꺾어본 히든(칸을 여는 것) 수. 넷이 끝입니다.
function specialOpenCount() { return Math.min(SPECIAL_SLOT_MAX, State.meta.specialOpened.length); }

// 이 칸에 무언가를 끼울 수 있는가. 일반 부위는 늘 열려 있습니다.
function isSlotOpen(slot) {
  return !isSpecialSlot(slot) || SPECIAL_SLOT_IDS.indexOf(slot) < specialOpenCount();
}

// 그 전리품이 지금 어느 칸에 끼워져 있는가 (없으면 null).
// 특수장비는 넷 중 어느 칸에든 들어갈 수 있어서 item.slot 만으로는 모릅니다.
function equippedSlotOf(itemId) {
  for (const s of ALL_SLOT_IDS) if (State.meta.equipped[s] === itemId) return s;
  return null;
}

// NEW! 표시는 부위별로 셉니다. 특수장비 칸 넷은 한 묶음입니다.
function freshKey(slot) { return isSpecialSlot(slot) ? 'special' : slot; }

// ---------- 세트 효과 ----------
// 지금 낀 일반 부위 열셋을 성격별로 셉니다
function setCounts(equipped = State.meta.equipped) {
  const c = {};
  for (const s of SLOT_IDS) {
    const it = getItem(equipped[s]);
    if (it && it.arch) c[it.arch] = (c[it.arch] || 0) + 1;
  }
  return c;
}

// 개수 → 몇 단계가 켜졌는가 (0 · 1 · 2)
function setStep(count) {
  let step = 0;
  SET_STEPS.forEach((n, i) => { if (count >= n) step = i + 1; });
  return step;
}

// 켜진 세트 효과를 특수 능력치별로 더한 것
function setBonuses(equipped = State.meta.equipped) {
  const out = {};
  for (const [arch, n] of Object.entries(setCounts(equipped))) {
    const step = setStep(n);
    if (!step || !SET_BONUS[arch]) continue;
    for (const [k, vals] of Object.entries(SET_BONUS[arch])) out[k] = (out[k] || 0) + vals[step - 1];
  }
  return out;
}

// ---------- 도감 ----------
// 그 격의 전리품을 몇 개 모았는가
function rankCollection(n) {
  const all = RANK_ITEMS[n] || [];
  return { have: all.filter(owns).length, total: all.length };
}

// 다 모은 격의 수 — 이만큼 핵심 스탯이 COLLECTION_BONUS 씩 오릅니다
function completedRanks() {
  let n = 0;
  for (const r of RANKS) {
    const c = rankCollection(r.n);
    if (c.total > 0 && c.have >= c.total) n++;
  }
  return n;
}

// ---------- 부위 강화 ----------
// 표와 강화석 공식은 data.js 의 ENHANCE_TABLE · stoneYield 에 있습니다.
function enhanceLevel(slot) { return State.meta.enhance[slot] || 0; }
function stonesOf(slot) { return State.meta.stones[slot] || 0; }

// 그 부위에 낀 장비의 핵심 스탯에 곱해지는 값
function slotMult(slot) { return 1 + enhanceBonus(enhanceLevel(slot)); }

// 다음 단계의 표 한 줄. 이미 끝까지 올렸으면 null
function nextEnhance(slot) {
  const lv = enhanceLevel(slot);
  return lv < ENHANCE_MAX ? ENHANCE_TABLE[lv] : null;
}

// 이번 시도의 성공 확률. 실패해도 오르지 않습니다.
function enhanceChance(slot) {
  const nx = nextEnhance(slot);
  return nx ? nx.rate : 0;
}

function canEnhance(slot) {
  const nx = nextEnhance(slot);
  return !!nx && stonesOf(slot) >= nx.cost;
}

// 한 번 시도합니다. 실패하면 강화석만 사라지고 단계는 그대로입니다.
function tryEnhance(slot) {
  if (!canEnhance(slot)) return null;
  const meta = State.meta;
  const nx = nextEnhance(slot);
  const chance = enhanceChance(slot);
  meta.stones[slot] -= nx.cost;

  const success = Math.random() < chance;
  if (success) meta.enhance[slot] = enhanceLevel(slot) + 1;

  const lv = enhanceLevel(slot);
  pushLog(success ? 'enhance' : 'info', success
    ? `⚒ ${SLOT_NAMES[slot]} 강화 성공 — +${lv} (핵심 스탯 +${Math.round(enhanceBonus(lv) * 100)}%)`
    : `${SLOT_NAMES[slot]} 강화 실패 — 강화석 ${fmt(nx.cost)}개가 부서졌다`);
  save();
  return { success, level: lv, cost: nx.cost, chance };
}

// 꺾어본 보스 수만큼 경험치가 영구히 곱해집니다.
// 이게 "다음 회차엔 초반 지역을 훅 지나간다" 는 감각의 정체입니다.
function bossXpMult() {
  return Math.pow(RULES.BOSS_XP_MULT, State.meta.bossesBeaten.length);
}

// ---------- 삼킨 격 ----------
// 『격을 삼키는 검』으로 적립해둔 에너지. 회차 시작부터 얹혀 있습니다.
function bankedEnergy() {
  return State.meta.banked.reduce((n, id) => {
    const e = getEnemy(id);
    return n + (e ? KINDS[e.kind].energy : 0);
  }, 0);
}

function startEnergy() { return RULES.START_ENERGY + bankedEnergy(); }

// 지금 『격을 삼키는 검』을 들고 있는가
function hasDevourer() { return State.meta.equipped.weapon === DEVOURER_ID; }

// ---------- 벽 ----------
// 마왕이 떠받친 벽. 그 너머(7격부터)는 마왕을 처음 꺾기 전까지 화면 어디에도 비치지 않습니다 —
// 도감 · 기록의 분모 · 내 격의 다음 단계 · 못 얻은 전리품 목록까지. 마왕 다음을 미리 알 수 없게.
// 마왕이 쓰러지는 순간 벽이 무너지고, 그 회차는 분위기가 바뀝니다 (ui.js 의 atmosphere).
const WALL_BOSS = 'demonking';
const WALL_ZONE = ZONES.findIndex(z => z.enemies.some(e => e.id === WALL_BOSS));   // 마계의 왕좌

// 마왕을 한 번이라도 꺾었나 — 그 너머를 본 적이 있나 (영구).
// 관리자 도구로 지역을 건너뛴 저장본도 본 것으로 칩니다.
function wallSeen() {
  const m = State.meta;
  return m.bossesBeaten.includes(WALL_BOSS) || m.bestZone > WALL_ZONE + 1;
}

// 이번 회차에 벽 너머에 있나 — 그 공간은 회차마다 되돌아가니, 마왕을 다시 꺾어야 다시 너머다.
function beyondWall() {
  const run = State.run;
  return !!run && (run.zoneIndex > WALL_ZONE || run.downed.includes(WALL_BOSS));
}

// 지금까지 알고 있는 지역 수. 벽 너머는 닿은 데까지만 — 그 뒤는 몇 개 남았는지도 모르게.
function knownZoneCount() {
  return wallSeen() ? Math.min(ZONES.length, Math.max(WALL_ZONE + 1, State.meta.bestZone)) : WALL_ZONE + 1;
}
// 지역 하나에 격 하나라, 아는 격도 같은 수입니다
function knownRank(n) { return n <= knownZoneCount(); }
function knownItems() { return ITEMS.filter(i => knownRank(i.rank.n)); }

// 히든이 모습을 드러냈는가 — 그 지역 보스를 한 번이라도 꺾은 뒤.
// 관측자도 마찬가지로 마왕이 쓰러진 뒤에야 나타납니다 (예전엔 보스 다섯을 꺾으면 마왕보다 먼저 나왔습니다).
function isRevealed(foe) {
  if (foe.kind !== 'hidden') return true;
  const boss = zoneBoss(foe.zoneIndex);
  return !!boss && State.meta.bossesBeaten.includes(boss.id);
}

// 이 지역에서 지금 찾아갈 수 있는 자리들 (아직 안 나타난 히든은 뺍니다)
function visiblePosts(zi) {
  return zonePosts(zi).filter(isRevealed);
}

// ---------- 스탯 분배 ----------
//
// run.spent   이미 찍어 넣은 포인트. 되돌릴 수 없고, 비율을 바꿔도 안 움직입니다.
// run.unspent 레벨업으로 받았지만 아직 안 찍은 포인트.
// meta.weights 앞으로 들어올 포인트를 어떻게 나눌지에 대한 규칙.
//
// 비율은 "지금부터" 에만 적용됩니다. 초반에 생명에 몰아줬다가 나중에 공격으로
// 틀면, 그동안 쌓인 생명은 그대로 남고 새 포인트만 공격으로 갑니다.

// STAT_KEYS 를 따라갑니다. 손으로 적어두면 스탯이 늘 때마다 NaN 이 새어나옵니다.
function emptySpent() { return Object.fromEntries(STAT_KEYS.map(k => [k, 0])); }

// 찍어둔 포인트를 실제 스탯 보너스로 환산
function allocatedStats() {
  const sp = State.run ? State.run.spent : emptySpent();
  const out = emptySpent();
  for (const k of STAT_KEYS) out[k] = sp[k] * POINT_VALUE[k];
  return out;
}

// 안 찍은 포인트를 지금 비율대로 전부 밀어 넣습니다. 돌아올 수 없습니다.
function commitPoints() {
  const run = State.run;
  const w = State.meta.weights;
  const sum = STAT_KEYS.reduce((n, k) => n + (w[k] || 0), 0);
  const pool = run.unspent;
  if (pool <= 0 || sum <= 0) return 0;

  let used = 0, topKey = STAT_KEYS[0], topW = -1;
  for (const k of STAT_KEYS) {
    const give = Math.floor(pool * w[k] / sum);
    run.spent[k] += give;
    used += give;
    if (w[k] > topW) { topW = w[k]; topKey = k; }
  }
  run.spent[topKey] += pool - used;   // 나눠떨어지지 않은 나머지는 비중이 큰 쪽으로
  run.unspent = 0;
  save();
  return pool;
}

// 자동 분배를 켜두면 레벨이 오를 때마다 알아서 들어갑니다.
// 레벨이 한 번에 수천씩 오르는 게임이라 매번 손으로 찍는 건 고역이니까요.
function setAutoAlloc(on) {
  State.meta.autoAlloc = !!on;
  if (on) commitPoints();
  save();
}

// 비율은 "칸" 으로 셉니다. 한 칸 더 넣으면 그만큼 지분이 커지고,
// 나머지 스탯의 지분은 알아서 줄어듭니다.
//   생명만 1칸        → 생명 100%
//   + 공격 1칸        → 50 / 50
//   + 방어 1칸        → 33 / 33 / 33
//   + 생명 1칸 (총 2) → 생명 50 · 공격 25 · 방어 25
function addWeight(stat, n = 1) {
  const w = State.meta.weights;
  w[stat] = Math.max(0, Math.min(99, (w[stat] || 0) + n));
  save();
}

// STAT_KEYS 순서대로 받습니다 — 생명 · 공격력 · 방어력 · 민첩 · 행운
function setWeights(...vals) {
  State.meta.weights = Object.fromEntries(STAT_KEYS.map((k, i) => [k, vals[i] ?? 0]));
  save();
}

function clearWeights() { setWeights(...STAT_KEYS.map(() => 0)); }

// ---------- 저장 / 불러오기 ----------
// 관리자 창의 「시험 모드」를 켜면 그 뒤로는 아무것도 저장하지 않습니다 — 다시 불러오면 원래대로.
let saveBlocked = false;
function blockSaving() { saveBlocked = true; }

function save() {
  try {
    if (!currentSlot || saveBlocked) return;
    localStorage.setItem(saveKey(currentSlot), JSON.stringify(State.meta));
    saveRun();
  } catch (e) {
    console.warn('저장 실패:', e);
  }
}

// ---------- 진행 중인 회차 ----------
// 폰은 다른 앱에 갔다 오면 페이지를 새로 불러오는 일이 잦습니다. 예전엔 그때마다 회차가 날아가고
// 새 회차가 시작됐습니다. 이제 회차도 저장 칸 옆(runKey)에 따로 두어, 다시 열면 그 자리에서 이어집니다.
//
// 결과 화면(lastResult)은 저장하지 않습니다. 승패 · 경험치 · 전리품은 「맞선다」를 누른 순간 반영되고
// 저장되므로, 다시 열면 결과를 닫은 자리(갈림길)에서 이어집니다 — 진 판을 되돌릴 수 없습니다.
// 마주한 상대와 그 기운은 그대로 돌아옵니다 — 다시 열어서 다른 상대를 뽑을 수도 없습니다.
// 끝난 회차도 저장해 둡니다. 다시 열면 끝 화면이 뜨고, 거기서 새 회차를 시작합니다.
const RUN_SAVE_VERSION = 1;

function saveRun() {
  const run = State.run;
  if (!currentSlot || !run) return;
  const data = { ...run, v: RUN_SAVE_VERSION, aura: run.aura ? run.aura.id : null, lastResult: null };
  localStorage.setItem(runKey(currentSlot), JSON.stringify(data));
}

// 저장된 회차를 되살립니다. 없거나 지금 게임과 맞지 않으면 false — 그때는 새 회차로 시작합니다.
function loadRun() {
  try {
    const raw = currentSlot ? localStorage.getItem(runKey(currentSlot)) : null;
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (!d || d.v !== RUN_SAVE_VERSION || !ZONES[d.zoneIndex]) return false;
    if (d.encounter && !getEnemy(d.encounter)) return false;

    const run = { ...freshRun(), ...d };
    delete run.v;
    run.aura = d.aura ? (AURAS.find(a => a.id === d.aura) || null) : null;
    run.lastResult = null;
    run.spent = { ...emptySpent(), ...(d.spent || {}) };
    run.downed = Array.isArray(d.downed) ? d.downed : [];
    run.spentOn = (d.spentOn && typeof d.spentOn === 'object') ? d.spentOn : {};
    State.run = run;

    State.log = [];
    pushLog('info', run.over
      ? `${State.meta.runCount}회차는 이미 끝났다.`
      : `${State.meta.runCount}회차를 이어서 한다 — ${ZONES[run.zoneIndex].name} · Lv.${fmtLevel(run.level)} · 에너지 ${run.energy}.`);
    return true;
  } catch (e) {
    return false;
  }
}

function load() {
  try {
    const raw = currentSlot ? localStorage.getItem(saveKey(currentSlot)) : null;
    if (!raw) return;
    const data = JSON.parse(raw);
    State.meta = { ...freshMeta(), ...data };
    State.meta.equipped = { ...emptyEquipped(), ...(data.equipped || {}) };
    State.meta.bossesBeaten = Array.isArray(data.bossesBeaten) ? data.bossesBeaten : [];
    State.meta.banked = Array.isArray(data.banked) ? data.banked : [];
    State.meta.specialOpened = Array.isArray(data.specialOpened) ? data.specialOpened : [];
    State.meta.gold = Math.max(0, Math.floor(num(data.gold)));
    State.meta.seen = Array.isArray(data.seen) ? data.seen : [];
    State.meta.fresh = (data.fresh && typeof data.fresh === 'object') ? data.fresh : {};
    State.meta.sets = Array.isArray(data.sets) ? data.sets : [null, null, null];
    State.meta.settings = { ...defaultSettings(), ...(data.settings || {}) };
    for (const k of FIXED_SETTINGS) State.meta.settings[k] = defaultSettings()[k];
    State.meta.tutorialDone = !!data.tutorialDone;
    State.meta.weights = { ...defaultWeights(), ...(data.weights || {}) };
    State.meta.autoAlloc = data.autoAlloc !== false;
    State.meta.stones = { ...stoneZeros(), ...(data.stones || {}) };
    State.meta.enhance = { ...slotZeros(), ...(data.enhance || {}) };
    delete State.meta.enhanceFails;   // 실패 보정은 뺐습니다 — 그때 저장된 실패 횟수는 버립니다
    for (const s of SLOT_IDS) State.meta.enhance[s] = Math.min(ENHANCE_MAX, Math.max(0, num(State.meta.enhance[s])));

    // 예전 저장본은 owned 가 배열이었습니다. 개수 맵으로 옮겨줍니다.
    let owned = data.owned || {};
    if (Array.isArray(owned)) {
      const map = {};
      for (const id of owned) map[id] = (map[id] || 0) + 1;
      owned = map;
    }

    // 겹 시스템 시절 저장본은 owned 가 "겹친 개수" 였습니다.
    // 장비는 하나만 남기고, 겹쳐 있던 나머지는 지금 분해한 셈 치고 강화석으로 돌려드립니다.
    // 특수장비에 자리를 내주고 빠진 전리품은 통째로 그 부위의 강화석이 됩니다.
    // 그 밖에 사라진 아이템 id 가 남아 있으면 여기서 걸러냅니다.
    State.meta.owned = {};
    for (const [id, n] of Object.entries(owned)) {
      const it = getItem(id);
      if (!it) {
        const gone = RETIRED_ITEMS[id];
        if (gone) State.meta.stones[gone.slot] += Math.max(1, num(n)) * stoneYield(gone);
        continue;
      }
      State.meta.owned[id] = 1;
      if (n > 1 && !it.unique) State.meta.stones[it.slot] += (n - 1) * stoneYield(it);
    }
    for (const slot of ALL_SLOT_IDS) {
      if (!owns(State.meta.equipped[slot])) State.meta.equipped[slot] = null;
    }

    // 예전 저장본에는 activeSet 이 없습니다. 그때는 세트가 "저장해뒀다 꺼내 쓰는"
    // 물건이라 입고 있던 것이 어느 세트인지가 없었습니다.
    // 지금 입은 것을 0번 세트로 삼고, 나머지는 있던 그대로 둡니다.
    const n = Number(data.activeSet);
    State.meta.activeSet = (Number.isInteger(n) && n >= 0 && n < SET_COUNT) ? n : 0;
    syncActiveSet();
  } catch (e) {
    console.warn('불러오기 실패:', e);
  }
}

function freshMeta() {
  return {
    owned: {},
    stones: stoneZeros(),
    enhance: slotZeros(),
    equipped: emptyEquipped(),
    weights: defaultWeights(),
    autoAlloc: true,
    seen: [],
    tutorialDone: false,
    sets: [null, null, null],
    activeSet: 0,
    settings: defaultSettings(),
    fresh: {},
    bossesBeaten: [],
    banked: [],
    specialOpened: [],
    gold: 0,                          // 골드 — 회차가 끝나도 남습니다
    runCount: 0,
    bestLevel: 1,
    bestKill: 0,
    bestZone: 1,
    cleared: false
  };
}

function wipeSave() {
  if (currentSlot) wipeSlot(currentSlot);
  State.meta = freshMeta();
  startRun();
}

// ---------- 영웅 스탯 계산 ----------
// 레벨에서 오는 기본 스탯 + 착용 중인 전리품 보너스
function heroStats() {
  const level = State.run ? State.run.level : 1;
  const base = heroBaseStats(level);
  const alloc = allocatedStats();
  const total = {};
  for (const k of STAT_KEYS) total[k] = base[k] + alloc[k];
  for (const k of SPECIAL_KEYS) total[k] = 0;

  for (const slot of ALL_SLOT_IDS) {
    const id = State.meta.equipped[slot];
    if (!id || !isSlotOpen(slot)) continue;   // 닫힌 특수장비 칸에 남은 것은 안 셉니다
    const item = getItem(id);
    if (!item) continue;
    const m = slotMult(slot);   // 그 부위를 강화한 만큼 강해집니다 (특수장비 칸은 ×1)
    // 강화는 **핵심 스탯만** 키웁니다.
    // 특수 능력치까지 배수를 먹이면 보스 장비 하나로 크리 +18% 가 나오고,
    // 열두 부위를 채우면 상한에 그냥 닿아버립니다. 그러면 공격·생명·민첩이
    // 아니라 특수 쪽이 주인공이 됩니다. 특수는 장비의 **성격**이지 위력이 아닙니다.
    for (const k of STAT_KEYS)    total[k] += (item[k] || 0) * m;
    for (const k of SPECIAL_KEYS) total[k] += (item[k] || 0);
  }

  // 같은 성격을 여러 부위에 끼면 붙는 세트 효과
  for (const [k, v] of Object.entries(setBonuses())) total[k] += v;

  // 다 모은 격 하나마다 핵심 스탯 전체가 조금씩 — 레벨·분배·장비를 다 합친 뒤에 곱합니다
  const collect = 1 + COLLECTION_BONUS * completedRanks();
  for (const k of STAT_KEYS) total[k] = Math.round(total[k] * collect);
  // 특수 능력치는 상한을 둡니다 — 막기 100% 같은 게 나오면 전투가 성립 안 합니다
  for (const k of SPECIAL_KEYS) total[k] = Math.min(SPECIAL_INFO[k].cap, total[k]);
  return total;
}

// ---------- 전투 ----------
//
// 한 턴에 일어나는 일:
//   1. 명중 판정  — 빗나가면 그 턴은 그냥 날아갑니다 (민첩 같으면 75% 명중)
//   2. 피해량 굴림 — ±15% 편차
//   3. 크리 판정  — 터지면 2배 이상 (민첩이 높을수록 확률·배수 상승)
//
// 1번과 3번이 이 게임에서 승률을 0%/100% 로 굳지 않게 하는 장치입니다.
// 피해량 편차만 있으면 긴 전투에서 평균으로 수렴해버려 승패가 미리 정해집니다.
// 빗나감과 크리는 발동/불발이 뚜렷해서 열 턴쯤 되는 전투를 실제로 뒤집습니다.
// log 에 배열을 넘기면 한 번 한 번의 공격을 적어둡니다 — 전투 화면이 그걸 보고 다시 틀어줍니다.
// 승률을 잴 때는 수백 번 돌리므로 적지 않습니다 (log 없이 부릅니다).
//   { t: 턴, who: 'hero'|'foe', k: 'hit'|'miss'|'block'|'regen'|'steal'|'reflect'|'extra'|'survive',
//     v: 피해·회복량, crit, harm, hp: 내 생명, fhp: 상대 생명 }
const BATTLE_LOG_MAX = 600;

function simulateBattle(hero, enemy, rng = Math.random, log = null) {
  let heroHp = hero.life;
  let foeHp = enemy.life;
  const MAX_TURNS = 3000; // 무한루프 방지

  // 전투 내내 바뀌지 않는 값들은 미리 계산해둡니다
  const hHit = hitChance(hero.dex, enemy.dex);
  const fHit = hitChance(enemy.dex, hero.dex);
  const hCrit = critChance(hero.dex, hero.luck, hero.critRate), hCritDmg = critDamage(hero.dex);
  const fCrit = critChance(enemy.dex, enemy.luck, 0),           fCritDmg = critDamage(enemy.dex);
  const hBase = damageFormula(hero.damage, piercedDefense(enemy.defense, hero.pierce));
  const fBase = damageFormula(enemy.damage, hero.defense);

  const hDouble  = num(hero.doubleHit);    // 한 턴에 두 번
  const hSteal   = num(hero.lifesteal);    // 준 피해의 일부 회복
  const hBlock   = num(hero.block);        // 통째로 흘리기
  const hThorn   = num(hero.reflect);      // 맞은 만큼 되돌리기
  const hRegen   = num(hero.regen);        // 내 턴마다 생명의 일부 회복
  const hHarm    = num(hero.harmTouch);    // 가끔 10배 — 그 한 방은 크리가 안 터집니다
  const hTurn    = num(hero.doubleTurn);   // 상대가 움직이기 전에 한 번 더
  const hSurvive = num(hero.survive);      // 쓰러질 한 방을 1 남기고 버팀 (전투당 한 번)
  let survived = false;

  const roll = () => 0.85 + rng() * 0.30;
  let turn = 0;
  const note = log
    ? (who, k, v = 0, extra = null) => {
        if (log.length < BATTLE_LOG_MAX) log.push({ t: turn, who, k, v, ...extra, hp: Math.max(0, heroHp), fhp: Math.max(0, foeHp) });
      }
    : () => {};

  // 영웅이 한 번 움직입니다. 상대가 쓰러지면 true.
  function heroAct() {
    if (hRegen > 0 && heroHp < hero.life) {
      const heal = Math.min(hero.life - heroHp, hero.life * hRegen);
      heroHp += heal;
      note('hero', 'regen', heal);
    }
    const swings = 1 + (rng() < hDouble ? 1 : 0);
    for (let s = 0; s < swings; s++) {
      if (rng() >= hHit) { note('hero', 'miss', 0, { second: s > 0 }); continue; }   // 빗나감
      let out = hBase * roll();
      const harm = hHarm > 0 && rng() < hHarm;
      const crit = !harm && rng() < hCrit;
      if (harm) out *= HARM_TOUCH_MULT;
      else if (crit) out *= hCritDmg;
      out = Math.max(1, out);
      foeHp -= out;
      note('hero', 'hit', out, { crit, harm, second: s > 0 });
      if (hSteal > 0 && heroHp < hero.life) {
        const heal = Math.min(hero.life - heroHp, out * hSteal);
        heroHp += heal;
        if (heal >= 1) note('hero', 'steal', heal);
      }
      if (foeHp <= 0) return true;
    }
    return false;
  }

  for (turn = 1; turn <= MAX_TURNS; turn++) {
    // ── 영웅의 턴 ── (연속 턴이 터지면 한 번 더 — 한 턴에 한 번까지)
    if (heroAct()) return { win: true, turns: turn, heroHpLeft: heroHp };
    if (hTurn > 0 && rng() < hTurn) {
      note('hero', 'extra');
      if (heroAct()) return { win: true, turns: turn, heroHpLeft: heroHp };
    }

    // ── 화신의 턴 ──
    if (rng() >= fHit) { note('foe', 'miss'); continue; }
    if (rng() < hBlock) { note('foe', 'block'); continue; }   // 막기에 걸리면 통째로 흘립니다
    let inc = fBase * roll();
    const crit = rng() < fCrit;
    if (crit) inc *= fCritDmg;
    inc = Math.max(1, inc);

    // 생존 — 이 한 방에 쓰러질 때만, 전투당 한 번
    if (heroHp - inc <= 0 && !survived && hSurvive > 0 && rng() < hSurvive) {
      survived = true;
      inc = heroHp - 1;
      heroHp = 1;
      note('foe', 'hit', inc, { crit });
      note('hero', 'survive');
    } else {
      heroHp -= inc;
      note('foe', 'hit', inc, { crit });
    }

    // 반사는 상대 방어를 무시하고 그대로 돌려줍니다
    if (hThorn > 0) {
      foeHp -= inc * hThorn;
      note('hero', 'reflect', inc * hThorn);
      if (foeHp <= 0) return { win: true, turns: turn, heroHpLeft: Math.max(0, heroHp) };
    }
    if (heroHp <= 0) return { win: false, turns: turn, heroHpLeft: 0 };
  }
  return { win: false, turns: MAX_TURNS, heroHpLeft: heroHp };
}

// 같은 전투를 여러 번 돌려서 승률을 추정합니다.
// 승패가 정말 뻔한 경우만 시뮬레이션을 건너뜁니다.
function winChance(hero, enemy, samples = 200) {
  const heroDps = Math.max(0.001, expectedTurnDamage(hero, enemy));
  const foeDps  = Math.max(0.001, expectedTurnDamage(enemy, hero));
  const turnsToKill = enemy.life / heroDps;
  const turnsToDie  = hero.life  / foeDps;

  // 운으로도 못 뒤집을 만큼 차이가 크면 굴리지 않습니다.
  // 크리와 빗나감이 있어서 예전보다 훨씬 넉넉하게(3배) 잡아야 합니다.
  if (turnsToKill * 3 < turnsToDie) return 1;
  if (turnsToDie  * 3 < turnsToKill) return 0;

  let wins = 0;
  for (let i = 0; i < samples; i++) if (simulateBattle(hero, enemy).win) wins++;
  return wins / samples;
}

// ---------- 회차 ----------
// 갓 시작한 회차의 모양. 저장된 회차를 되살릴 때도 이 모양 위에 덮어써서, 나중에 칸이 늘어도 비지 않게 합니다.
function freshRun() {
  return {
    level: 1,
    xp: 0,
    spent: emptySpent(),          // 이미 찍은 포인트 (되돌릴 수 없음)
    unspent: POINTS_PER_LEVEL,    // Lv.1 몫부터 지급
    energy: startEnergy(),   // 기본 + 지금까지 삼켜둔 격
    kills: 0,
    zoneIndex: 0,        // 지금 있는 지역
    zoneCleared: false,  // 이 지역 보스를 꺾어서 길이 열렸는가
    spentOn: {},         // 정예·히든·보스별로 도전에 쓴 에너지 — 꺾으면 그만큼 돌려받습니다
    downed: [],          // 이 여정에서 이미 꺾은 정예·보스 id — 다시 못 만납니다
    progress: 0,         // 이 지역에서 이긴 횟수
    encounter: null,     // 지금 마주한 적 id (없으면 null)
    aura: null,          // 그 화신이 두른 기운 (없으면 null)
    lastResult: null,    // 방금 끝난 전투의 결과 — 결과 화면이 이걸 보고 그립니다
    onBoss: false,       // 그 조우가 보스전인가
    merchant: null,      // 이번 회차의 떠돌이 상인 — { zone, wares, bought } (없으면 null)
    over: false,
    victory: false,
    reason: ''
  };
}

function startRun() {
  State.meta.runCount += 1;
  State.run = freshRun();
  State.run.merchant = rollMerchant(0);
  if (State.meta.autoAlloc) commitPoints();

  State.log = [];
  const z = ZONES[0];
  const banked = bankedEnergy();
  pushLog('info', `${State.meta.runCount}회차 — 아무것도 아닌 상태로 ${z.name}에 선다. 에너지 ${State.run.energy}.`);
  if (banked > 0) pushLog('devour', `이미 삼켜둔 격이 ${State.meta.banked.length}. 에너지 +${banked}를 들고 시작한다.`);
  save();
}

function endRun(reason) {
  const run = State.run;
  run.over = true;
  run.reason = reason;
  run.encounter = null;
  if (run.level > State.meta.bestLevel) State.meta.bestLevel = run.level;

  if (run.victory) {
    pushLog('rank', `━━ 여정의 끝 — ${State.meta.runCount}회차에 모든 격을 넘어섰다 ━━`);
  } else {
    const r = rankOf(run.level);
    pushLog('death', `격이 무너졌다 — ${reason}  (${knownRank(r.n) ? `제${r.n}격 ${r.name}` : '???'} · Lv.${fmtLevel(run.level)} · ${run.kills}명을 꺾음)`);
    pushLog('info', '격은 사라졌지만 빼앗은 것은 남는다.');
  }
  save();
}

// 에너지가 바닥났고 아직 마주한 적이 없으면 여정이 끝납니다.
function checkEnergy() {
  const run = State.run;
  if (run.over || run.encounter) return;
  if (run.energy <= 0) endRun('에너지 고갈');
}

// ---------- 경험치 / 레벨업 ----------
// 레벨이 수백만까지 올라가므로 한 칸씩 빼는 반복문으로는 감당이 안 됩니다.
// 누적 경험치 ↔ 레벨을 닫힌 식으로 바로 환산합니다.
//   누적(L) ≈ (100 / 1.9) * L^1.9   →   L ≈ (누적 * 1.9 / 100)^(1/1.9)
// totalXpFor / levelFromTotalXp 는 data.js 에 있습니다 —
// xpToNext 가 같은 식에서 뽑혀야 해서 수식끼리 한곳에 모았습니다.

function gainXp(amount) {
  const run = State.run;
  const before = run.level;
  const total = totalXpFor(run.level) + run.xp + amount;
  const after = levelFromTotalXp(total);
  run.level = after;
  run.xp = Math.max(0, total - totalXpFor(after));

  const gained = after - before;
  if (gained > 0) {
    run.unspent += gained * POINTS_PER_LEVEL;
    if (State.meta.autoAlloc) commitPoints();
  }
  return gained;
}

// ---------- 여정 ----------
function currentZone() { return ZONES[State.run.zoneIndex]; }

// ─────────────────────────────────────────────────────────────
//  ※ 맵 이동으로 바꿀 때의 이음매 (docs/MAP-PLAN.md 참고)
//
//  나중에 캐릭터를 직접 움직이게 만들 예정입니다. 그때 손댈 곳은
//  아래 세 함수뿐이고, 전투 파이프라인(beginEncounter → engage/retreat)은
//  그대로 씁니다.
//
//    canAct()        — 움직일 수 있는 상태인가          (그대로)
//    pickEncounter() — 누구를 만나는가                  ← 타일 조회로 교체
//    travel()        — 한 걸음 = 에너지 1               ← 방향 인자를 받게 교체
// ─────────────────────────────────────────────────────────────

// 움직일 수 있는 상태인지 확인하고, 에너지가 없으면 여정을 끝냅니다.
function canAct() {
  const run = State.run;
  if (run.over || run.encounter) return false;
  if (run.energy < RULES.TRAVEL_COST) { endRun('에너지 고갈'); return false; }
  return true;
}

// 이 지역에서 다음으로 마주칠 적을 고릅니다.
//
// 완전 무작위로 뽑으면 Lv.1 인데 Lv.18 짜리가 1/9 확률로 튀어나옵니다.
// 그래서 **내 레벨 근처가 자주 뜨도록** 가중치를 겁니다.
//
// 가중치는 레벨 비율(상대/나)에 대한 종 모양 곡선입니다. 로그 축에서 재기 때문에
// 레벨이 1이든 100억이든 체감이 같습니다. 중심을 0.9 에 둬서 살짝 아래쪽,
// 즉 "이길 만한 상대"가 조금 더 자주 나오게 했습니다.
const ENCOUNTER_CENTER = 0.9;   // 내 레벨의 몇 배가 제일 자주 나오는가
const ENCOUNTER_SPREAD = 0.8;   // 클수록 폭넓게 섞여 나옵니다

function encounterWeight(enemyLevel, heroLevel) {
  const z = (Math.log(enemyLevel / Math.max(1, heroLevel)) - Math.log(ENCOUNTER_CENTER)) / ENCOUNTER_SPREAD;
  return Math.exp(-z * z);
}

function pickEncounter(zoneIndex) {
  const pool = zoneNormals(zoneIndex);
  const level = State.run.level;
  const weights = pool.map(e => encounterWeight(e.level, level));
  const total = weights.reduce((a, b) => a + b, 0);

  // 내 레벨이 이 지역을 한참 넘어섰다면 전부 0 에 수렴합니다 — 그땐 제일 센 놈
  if (!(total > 1e-9)) return pool[pool.length - 1];

  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

// 조우 시작. 누구를 만나든 여기를 거칩니다.
function beginEncounter(foe, isBoss) {
  const run = State.run;
  run.encounter = foe.id;
  run.onBoss = isBoss;
  run.aura = rollAura();   // 보스도 기운을 두를 수 있습니다
  markSeen(foe.id);        // 직접 마주쳐야 이름이 드러납니다
  return run.aura;
}

// ---------- 목격 ----------
// 한 번이라도 마주친 적만 이름이 보입니다. 나머지는 ??? 입니다 —
// 목록에 전부 적어두면 만나는 재미가 없으니까요. 회차가 바뀌어도 기억은 남습니다.
function isSeen(id) { return State.meta.seen.includes(id); }

function markSeen(id) {
  if (!State.meta.seen.includes(id)) {
    State.meta.seen.push(id);
    save();
  }
}

// 길을 떠난다 — 에너지를 쓰고 이 지역의 화신 하나를 만납니다.
function travel() {
  if (!canAct()) return;
  const run = State.run;

  run.energy -= RULES.TRAVEL_COST;
  const foe = pickEncounter(run.zoneIndex);
  const aura = beginEncounter(foe, false);

  if (aura) {
    pushLog('aura', `✦ ${aura.name} ${foe.name}${josa(foe.name, '이', '가')} 나타났다 — ${aura.desc} ✦`);
  } else {
    pushLog('travel', `길을 떠났다 — ${foe.icon} ${foe.name}${josa(foe.name, '이', '가')} 앞을 막아섰다`);
  }
  save();
}

// 정해진 자리의 상대(정예·히든·보스) 도전에 쓴 에너지를 기록합니다 (접근 비용 + 패배 페널티)
function addSpentOn(id, n) {
  const run = State.run;
  if (!run.spentOn) run.spentOn = {};
  run.spentOn[id] = (run.spentOn[id] || 0) + n;
}

// ---------- 떠돌이 상인 ----------
// 3지역의 숨은 것(카벙클)을 처음 꺾은 뒤부터, 회차마다 1~6지역 중 한 곳에 나타납니다.
// 싸우지 않습니다 — 들르면 물건을 팝니다. 들르는 데 에너지는 들지 않습니다.
function merchantUnlocked() { return State.meta.specialOpened.includes(MERCHANT_UNLOCK); }

// fromZone 이후(포함) ~ 마계의 왕좌 사이 한 곳. 파는 것은 아직 안 가진 것 중 셋까지 (그 지역 격 +1 까지).
function rollMerchant(fromZone) {
  if (!merchantUnlocked()) return null;
  const lo = Math.min(fromZone, WALL_ZONE);
  const zone = lo + Math.floor(Math.random() * (WALL_ZONE - lo + 1));
  const rank = ZONES[zone].rank;
  const pool = ITEMS.filter(i => i.ware && !owns(i.id) && i.rank.n <= rank + 1);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return { zone, wares: pool.slice(0, 3).map(i => i.id), bought: [] };
}

// 지금 이 지역에 상인이 있나
function merchantHere() {
  const run = State.run;
  return !!(run && run.merchant && run.merchant.zone === run.zoneIndex && !run.over);
}

// 산다. 성공하면 true.
function buyWare(id) {
  const run = State.run;
  const it = getItem(id);
  if (!merchantHere() || !it || !it.ware) return false;
  const m = run.merchant;
  if (!m.wares.includes(id) || m.bought.includes(id) || owns(id)) return false;
  if (num(State.meta.gold) < it.price) return false;
  State.meta.gold -= it.price;
  State.meta.owned[id] = 1;
  markFresh(it);
  m.bought.push(id);
  pushLog('drop', `떠돌이 상인에게서 『${it.name}』${josa(it.name, '을', '를')} 샀다 — ${fmt(it.price)} 골드`);
  save();
  return true;
}

// 이 여정에서 이미 꺾었는가 (정예·보스 전용)
function isDowned(enemyId) { return State.run.downed.includes(enemyId); }

// 정해진 자리에 선 것(정예 또는 보스)에게 향한다.
// 늘 그 자리에 있으므로 언제든 갈 수 있지만, 마주하면 물러설 수 없습니다.
// 그리고 한 번 꺾으면 이 여정에선 다시 만날 수 없습니다.
function approachPost(enemyId) {
  if (!canAct()) return;
  const foe = getEnemy(enemyId);
  if (!foe || !foe.once || isDowned(enemyId)) return;

  const run = State.run;
  run.energy -= RULES.TRAVEL_COST;
  addSpentOn(foe.id, RULES.TRAVEL_COST);
  const aura = beginEncounter(foe, true);

  pushLog('rank', foe.kind === 'boss'
    ? `━ ${foe.icon} ${foe.name}${josa(foe.name, '이', '가')} 길을 막았다. 물러설 수 없다 ━`
    : `━ ${foe.icon} ${foe.name} 앞에 섰다. 물러설 수 없다 ━`);
  if (aura) pushLog('aura', `✦ 게다가 ${aura.name} 기운을 두르고 있다 — ${aura.desc} ✦`);
  save();
}

// 보스에게 향한다 (approachPost 의 편의 래퍼)
function approachBoss() {
  const boss = zoneBoss(State.run.zoneIndex);
  if (boss) approachPost(boss.id);
}

// 물러선다 — 에너지는 이미 썼으니 그냥 날아갑니다. 보스한테는 못 씁니다.
function retreat() {
  const run = State.run;
  if (run.over || !run.encounter || run.onBoss) return;
  const foe = getEnemy(run.encounter);
  pushLog('info', `${foe.name} 앞에서 물러섰다. 발걸음만 축냈다.`);
  run.encounter = null;
  run.aura = null;
  checkEnergy();
  save();
}

// 맞선다 — 실제 전투.
function engage() {
  const run = State.run;
  if (run.over || !run.encounter) return null;

  const enemy = getEnemy(run.encounter);
  const wasBoss = run.onBoss;
  const aura = run.aura;
  const hero = heroStats();
  const battleLog = [];   // 전투 화면이 한 방씩 다시 틀어줄 기록
  const result = simulateBattle(hero, enemy, Math.random, battleLog);
  const replay = { log: battleLog, heroMax: hero.life, foeMax: enemy.life };

  run.encounter = null;
  run.onBoss = false;
  run.aura = null;

  // ----- 패배 -----
  // 여정이 바로 끝나지는 않습니다. 대신 에너지를 크게 잃습니다.
  // 일반 -2, 정예 -3, 보스 -5. 큰 자리를 노릴수록 실패가 비쌉니다.
  if (!result.win) {
    const penalty = lossPenaltyFor(enemy.kind);
    run.energy -= penalty;
    if (enemy.once) addSpentOn(enemy.id, penalty);
    pushLog('battle',
      `${enemy.icon} ${enemy.name} 앞에 무릎 꿇었다 — ${result.turns}턴, 에너지 -${penalty}`);
    run.lastResult = { win: false, enemy, turns: result.turns, penalty, aura, drops: [], levelsGained: 0, xp: 0, replay };
    if (run.energy <= 0) {
      run.energy = 0;
      endRun(`${enemy.name}에게 무너졌다`);
    }
    save();
    return run.lastResult;
  }

  // ----- 승리 -----
  run.kills += 1;
  if (enemy.level > State.meta.bestKill) State.meta.bestKill = enemy.level;

  // 경험치 = 기본 × 격차보너스 × 기운 × 꺾은 보스 배수 × 장비의 경험치 보너스
  const gap = underlevelBonus(run.level, enemy.level);
  const auraXp = aura ? aura.xpMult : 1;
  const bossM = bossXpMult();
  const gearXp = xpGearMult();
  const rankXp = rankXpMult(enemy.rank ? enemy.rank.n : 1);
  const xp = Math.round(enemy.xp * gap * auraXp * bossM * gearXp * rankXp);
  const levelBefore = run.level;
  const levelsGained = gainXp(xp);
  const drops = rollDrops(enemy.id, aura ? aura.dropMult : 1);
  // 골드 — 기운이 두른 상대일수록, 행운과 골드 획득 장비가 많을수록. 조금씩 흔들립니다.
  const gold = Math.max(1, Math.round(goldFor(enemy) * (aura ? aura.dropMult : 1) * goldMult() * (0.85 + Math.random() * 0.3)));
  State.meta.gold = num(State.meta.gold) + gold;

  const bits = [];
  if (gap > 1.01) bits.push(`격차 ×${gap.toFixed(2)}`);
  if (auraXp > 1) bits.push(`${aura.name} ×${auraXp}`);
  if (bossM > 1.01) bits.push(`보스 ×${bossM.toFixed(2)}`);
  if (gearXp > 1.01) bits.push(`성장 ×${gearXp.toFixed(2)}`);
  const multText = bits.length ? `  (${bits.join(' · ')})` : '';

  pushLog('battle',
    `${enemy.icon} ${enemy.name}${josa(enemy.name, '을', '를')} 꺾었다 (Lv.${fmtLevel(enemy.level)}) — ${result.turns}턴, +${fmt(xp)} EXP · +${fmt(gold)} 골드${multText}`);

  if (levelsGained > 0) {
    const before = rankOf(run.level - levelsGained);
    const after = rankOf(run.level);
    pushLog('level', `Lv.${fmtLevel(run.level)}  (+${fmtLevel(levelsGained)} 레벨)`);
    if (after.n > before.n) {
      // 아직 모르는 격(마왕 너머)이면 이름을 밝히지 않습니다
      pushLog('rank', knownRank(after.n)
        ? `━ 제${after.n}격 · ${after.name}(${after.hanja})에 올랐다 — ${after.desc} ━`
        : '━ 알 수 없는 격에 올랐다 ━');
    }
  }
  for (const d of drops) {
    const g = d.item.grade === 'normal' ? '' : `[${KINDS[d.item.grade].name}] `;
    pushLog('drop', d.isNew
      ? `${g}『${d.item.name}』${josa(d.item.name, '을', '를')} 빼앗았다`
      : `${g}『${d.item.name}』 — 이미 가진 것이라 분해했다. ${SLOT_NAMES[d.item.slot]} 강화석 +${fmt(d.stones)}`);
  }

  if (run.level > State.meta.bestLevel) State.meta.bestLevel = run.level;

  // 정예·히든·보스는 이 여정에서 다시 만날 수 없습니다 — 그래서 그 전리품이 귀합니다
  if (enemy.once) run.downed.push(enemy.id);

  // 『격을 삼키는 검』을 들고 있으면 그 격을 삼켜 에너지로 바꿉니다.
  // 한 번 삼킨 격은 영구히 적립되어, 다음 회차부터 시작 에너지에 얹힙니다.
  let devoured = 0;
  if (enemy.once && hasDevourer() && !State.meta.banked.includes(enemy.id)) {
    devoured = KINDS[enemy.kind].energy;
    State.meta.banked.push(enemy.id);
    run.energy += devoured;
    pushLog('devour',
      `⟡ ${enemy.name}의 격을 삼켰다 — 에너지 +${devoured} (지금 ${run.energy}) · 앞으로 매 회차 시작부터 내 것 ⟡`);
  }

  // 결과 화면이 보고 그릴 내용
  run.lastResult = {
    win: true, enemy, turns: result.turns, aura,
    xp, gap, auraXp, bossM, levelBefore, levelsGained, drops, devoured, gold,
    openedPath: false, replay
  };

  // 정예·히든·보스를 꺾으면 그 상대에게 쓴 에너지를 전부 돌려받습니다.
  // 시작 에너지를 넘어서도 됩니다.
  if (enemy.once) {
    const refund = (run.spentOn && run.spentOn[enemy.id]) || 0;
    if (refund > 0) {
      run.energy += refund;
      run.lastResult.refund = refund;
      pushLog('devour', `⟡ ${enemy.name}에게 쓴 에너지 +${refund} 되찾았다 (지금 ${run.energy}) ⟡`);
    }
  }

  // 칸을 여는 히든을 처음 꺾으면 특수장비 칸이 하나 열립니다 (넷까지)
  if (enemy.opens && !State.meta.specialOpened.includes(enemy.id)) {
    State.meta.specialOpened.push(enemy.id);
    const n = specialOpenCount();
    run.lastResult.openedSpecial = n;
    // 3지역의 숨은 것을 처음 꺾으면 떠돌이 상인이 나타나기 시작합니다 — 이번 회차는 지금 이후의 지역 어딘가에
    if (enemy.id === MERCHANT_UNLOCK && !run.merchant) run.merchant = rollMerchant(run.zoneIndex);
    pushLog('rank', `━━ 특수장비 칸이 열렸다 (${n}/${SPECIAL_SLOT_MAX}) — 보석이나 유물을 끼울 수 있다 ━━`);
    fillSpecialSlots();
  }

  if (enemy.kind === 'boss') {
    // 처음 꺾은 보스라면 영구 경험치 배수가 하나 늘어납니다
    if (!State.meta.bossesBeaten.includes(enemy.id)) {
      State.meta.bossesBeaten.push(enemy.id);
      pushLog('rank', `━━ ${enemy.name}의 격을 빼앗았다 — 앞으로 모든 경험치 ×${bossXpMult().toFixed(1)} ━━`);
      // 이 지역에 숨어 있던 것이 이제 모습을 드러냅니다.
      // 관측자는 아무 말 없이 나타납니다 — 글로 알리지 않습니다 (벽이 무너지는 연출에 눈만 스칩니다).
      const lurker = zonePosts(enemy.zoneIndex).find(p => p.opens);
      if (lurker && !State.meta.specialOpened.includes(lurker.id)) {
        pushLog('devour', `⟡ ${enemy.zoneName} 어딘가에서 숨어 있던 것이 눈을 떴다 ⟡`);
      }
    }

    if (enemy.final) {
      State.meta.cleared = true;
      State.meta.bestZone = ZONES.length;
      run.victory = true;
      endRun('모든 격을 넘어섰다');
      return run.lastResult;
    }

    // 길만 열어둡니다. 넘어갈지 더 머무를지는 본인이 정합니다 —
    // 준비 안 된 채로 다음 지역에 떨어지면 아무것도 못 하고 여정이 끝나니까.
    run.zoneCleared = true;
    run.lastResult.openedPath = true;
    pushLog('rank', `━ 길이 열렸다. 준비되면 다음 지역으로 ━`);
  } else {
    run.progress += 1;
  }

  checkEnergy();
  save();
  return run.lastResult;
}

// 결과 화면을 닫고 다시 갈림길로
function dismissResult() {
  if (State.run) State.run.lastResult = null;
}

// 다음 격으로 넘어간다. 에너지 ZONE_MOVE_COST 가 듭니다.
// 넘어가기 전까지는 이 지역에 머물며 얼마든지 더 사냥할 수 있습니다.
//
// 모자라면 넘어가지 못할 뿐, 여정이 끝나지는 않습니다 —
// 한 걸음(1)은 아직 남아 있을 수 있으니 이 지역에서 더 사냥하면 됩니다.
function moveToNextZone() {
  const run = State.run;
  if (run.over || run.encounter || !run.zoneCleared) return;
  if (run.zoneIndex + 1 >= ZONES.length) return;
  if (run.energy < RULES.ZONE_MOVE_COST) return;

  run.energy -= RULES.ZONE_MOVE_COST;
  run.zoneIndex += 1;
  run.progress = 0;
  run.zoneCleared = false;
  if (run.zoneIndex + 1 > State.meta.bestZone) State.meta.bestZone = run.zoneIndex + 1;

  const z = currentZone();
  const r = RANKS.find(x => x.n === z.rank);
  pushLog('rank', `━━ 제${r.n}격 · ${r.name}(${r.hanja}) — ${z.name}에 들어섰다 ━━`);
  pushLog('info', z.flavor);
  save();
}

// 처치하면 1~3개(기운이 붙으면 그 배수만큼)를 빼앗습니다.
// 이미 가진 것이 또 나오면 **자동으로 분해되어** 그 부위의 강화석이 됩니다 —
// 그래서 드롭이 죽지 않습니다. 다 모은 상대도 잡을 이유가 남습니다.
// **전리품 하나하나에 따로 확률을 굴립니다.**
// 그래서 한 번 잡아 같은 종류가 두 개 나오는 일은 없고, 빈손으로 끝나기도 합니다.
// 빈손이 있어야 행운에 투자할 이유가 생깁니다.
function rollDrops(enemyId, auraMult = 1) {
  const foe = getEnemy(enemyId);

  // 관측자는 검을 한 번 내주면 그걸로 할 일이 끝납니다. 그 뒤로는 경험치만.
  // (다른 히든은 특수장비를 계속 남깁니다 — 겹치면 분해됩니다)
  if (foe && foe.id === 'observer' && owns(DEVOURER_ID)) return [];

  const chance = dropChanceFor(foe, auraMult);
  const stoneMult = 1 + num(heroStats().stoneRate);   // 『세공사의 돋보기』 같은 유물
  const result = [];

  for (const it of dropTable(enemyId)) {
    if (Math.random() >= chance) continue;               // 이번엔 안 나왔다

    if (owns(it.id)) {
      // 이미 가진 것 — 분해해서 그 부위의 강화석으로.
      // 특수장비는 「특수장비 강화석」이 됩니다. 강화할 칸이 없으니 바꾸기로만 씁니다.
      const stones = Math.round(stoneYield(it) * stoneMult);
      State.meta.stones[it.slot] = stonesOf(it.slot) + stones;
      result.push({ item: it, isNew: false, stones });
      continue;
    }

    State.meta.owned[it.id] = 1;
    // NEW! 는 처음 얻은 것에만 켜집니다. 분해된 것은 이미 아는 물건입니다.
    markFresh(it);
    const worn = autoEquipIfBetter(it);
    result.push({ item: it, isNew: true, autoWorn: worn });
  }
  return result;
}

// ---------- 알아서 갈아끼우기 ----------
// 기본은 꺼져 있습니다. 장비마다 성격이 달라서 "가장 강한 것" 이라는 게
// 딱 떨어지지 않고, 그 고민이 이 게임의 재미이기 때문입니다.
//
// 다만 한 회차에 쉰 번 넘게 갈아끼우는 걸 손으로 다 하긴 고됩니다. 그래서
// **켜면** 새로 얻은 것이 지금 낀 것보다 나을 때만 조용히 바꿔줍니다.
// 판단 기준은 "지금 내 레벨의 적을 상대로 몇 턴 버티며 몇 턴 만에 눕히는가" —
// 승률과 같은 잣대라, 성격이 다른 물건끼리도 견줄 수 있습니다.
function gearScore() {
  const ref = enemyStats(State.run ? State.run.level : 1);
  const h = heroStats();
  const mine = expectedTurnDamage(h, ref);
  const theirs = Math.max(0.001, expectedTurnDamage(ref, h));
  return mine * (h.life / theirs);
}

function autoEquipIfBetter(item) {
  if (!State.meta.settings.autoEquip) return false;
  if (!State.run || !item || item.id === DEVOURER_ID) return false;   // 삼키는 검은 스스로 고르게 둡니다
  if (equippedSlotOf(item.id)) return false;

  // 특수장비는 열린 칸 넷 중 어디든 들어갈 수 있습니다 — 가장 나아지는 칸을 고릅니다
  const slots = item.slot === 'special'
    ? SPECIAL_SLOT_IDS.filter(isSlotOpen)
    : [item.slot];
  const before = gearScore();
  let best = null, bestScore = before;
  for (const slot of slots) {
    const cur = State.meta.equipped[slot];
    State.meta.equipped[slot] = item.id;
    const after = gearScore();
    State.meta.equipped[slot] = cur;    // 일단 되돌려 두고 비교만 합니다
    if (after > bestScore) { best = slot; bestScore = after; }
  }
  if (!best) return false;
  State.meta.equipped[best] = item.id;
  syncActiveSet();
  return true;
}

// 특수장비 칸이 새로 열렸을 때, 알아서 갈아끼우기를 켜두었다면 가진 것 중 나은 것으로 채웁니다
function fillSpecialSlots() {
  if (!State.meta.settings.autoEquip || !State.run) return;
  for (const it of itemsInSlot('special')) if (owns(it.id)) autoEquipIfBetter(it);
}

// ---------- 강화석 바꾸기 ----------
// from 의 강화석 spend 개를 내고 to 의 강화석을 STONE_EXCHANGE_RATE 만큼 받습니다 (지금은 2:1).
// from 은 열세 부위 또는 'special', to 는 열세 부위 중 하나입니다.
// 받을 몫이 나눠떨어지지 않으면 남는 만큼은 내지 않습니다 — 버려지는 강화석이 없게.
function exchangeStones(from, to, spend) {
  if (from === to || !SLOT_IDS.includes(to)) return null;
  if (from !== 'special' && !SLOT_IDS.includes(from)) return null;
  const gain = Math.floor(Math.min(num(spend), stonesOf(from)) * STONE_EXCHANGE_RATE);
  if (gain <= 0) return null;
  const paid = Math.ceil(gain / STONE_EXCHANGE_RATE);
  State.meta.stones[from] = stonesOf(from) - paid;
  State.meta.stones[to] = stonesOf(to) + gain;
  pushLog('info', `${SLOT_NAMES[from]} 강화석 ${fmt(paid)}개를 ${SLOT_NAMES[to]} 강화석 ${fmt(gain)}개로 바꿨다`);
  save();
  return { from, to, paid, gain };
}

// to 의 강화석을 gain 개 얻으려면 다른 강화석이 몇 개 드는가
function exchangeCost(gain) { return Math.ceil(Math.max(0, gain) / STONE_EXCHANGE_RATE); }

// ---------- NEW! 표시 ----------
// 새로 얻은 전리품은 **그 부위를 직접 열어볼 때까지** 표시가 남습니다.
// 전투 결과 화면을 스쳐 지나가도 놓치지 않게 하려는 장치입니다.
function markFresh(item) {
  const f = State.meta.fresh;
  if (!f[item.slot]) f[item.slot] = [];
  if (!f[item.slot].includes(item.id)) f[item.slot].push(item.id);
}

function freshCount(slot) { return (State.meta.fresh[slot] || []).length; }
function isFresh(itemId, slot) { return (State.meta.fresh[slot] || []).includes(itemId); }
function totalFresh() { return SLOT_IDS.concat(['special']).reduce((n, s) => n + freshCount(s), 0); }

// 그 부위를 열어봤으면 표시를 끕니다
function clearFresh(slot) {
  if (State.meta.fresh[slot] && State.meta.fresh[slot].length) {
    State.meta.fresh[slot] = [];
    save();
  }
}

// ---------- 행운 ----------
// 드롭 확률에 곱해지는 배수입니다.
//
// 레벨에서 저절로 따라오는 행운은 빼고 **내가 일부러 넣은 만큼**만 셉니다.
// 분배를 행운에 몰았거나 반지·목걸이·팔찌를 챙겨 끼웠을 때만 올라갑니다.
// 그래야 "이번 여정은 싸우러 가는 게 아니라 캐러 간다" 는 선택이 성립합니다.
// 행운 배수는 **찍은 포인트의 비율**만 봅니다.
//
// 두 번 헛짚고 나서 고른 기준입니다.
//   처음엔 "총 행운 − 레벨 기본 행운" 으로 쟀는데, 장비에 붙은 행운이 기본값을
//   수백 배로 압도해서 누가 뭘 찍든 상한에 붙었습니다. 다음엔 행운/민첩 비율로
//   바꿨는데, 그 비율이 레벨과 장비에 따라 0.29~1.45 사이를 오가서 "중립"
//   자리를 잡을 수가 없었습니다.
//
// 찍은 포인트의 비율은 레벨에도 장비에도 흔들리지 않습니다. 역할도 깨끗이
// 갈립니다 — **분배**가 배수를 올리고, **장비**가 전리품 확률(+%)을 올립니다.
//   한 점도 안 줌 ×1.0   ·   균등(1/5) ×1.4   ·   몰빵(6/10) ×2.2
function luckMult() {
  const sp = State.run ? State.run.spent : null;
  if (!sp) return 1;
  let total = 0;
  for (const k of STAT_KEYS) total += num(sp[k]);
  if (total <= 0) return 1;
  const share = num(sp.luck) / total;      // 0 = 한 점도 안 줌, 1 = 전부 행운
  return Math.min(RULES.LUCK_CAP, 1 + RULES.LUCK_POWER * share);
}

// 격이 높을수록 좀처럼 내주지 않습니다 — 단, 다시 만날 수 있는 상대만.
//
//   일반 화신 (몇 번이고 다시 만남)  ×0.93/격  → 제15격에서 ×0.36
//   정예·보스 (회차당 한 번뿐)       ×0.986/격 → 제15격에서 ×0.82
//
// 정예와 보스를 같은 비율로 깎았더니, 회차를 통째로 써서 도착한 자리에서
// 굴림 한 번에 빈손으로 돌아서는 일이 생겼습니다. 저기까지 가는 것 자체가
// 이미 대가라서, 그 위에 확률까지 깎으면 희소성이 아니라 벌이 됩니다.
// 여기에 초반 보너스(1 + EARLY/격)를 곱합니다. 격이 오르면 빠르게 사그라들어서,
// 제1격은 후하고 제15격은 인색한 곡선이 됩니다 (일반 화신 기준 68% → 8%).
function rankDropMult(rank, once) {
  const r = Math.max(1, rank || 1);
  const f = once ? RULES.RANK_DROP_FALLOFF_ONCE : RULES.RANK_DROP_FALLOFF;
  return Math.pow(f, r - 1) * (1 + RULES.RANK_DROP_EARLY / r);
}

// 낮은 격에서 경험치를 얹어줍니다. 격의 제곱으로 나누기 때문에
// 제1격 ×3.0, 제2격 ×1.5, 제3격 ×1.22 로 금방 사그라듭니다 —
// 배우는 구간만 빨리 지나가게 하고, 본편 길이는 건드리지 않으려는 모양입니다.
function rankXpMult(rank) {
  const r = Math.max(1, rank || 1);
  return 1 + RULES.RANK_XP_EARLY / (r * r);
}

// 이 적에게서 전리품 하나가 떨어질 확률
//   기본(등급) × 격에 따른 인색함 × 행운 배수 × 장비의 전리품 확률 × 기운
function dropChanceFor(foe, auraMult = 1, stats = null) {
  const base = KINDS[foe ? foe.kind : 'normal'].dropChance;
  const h = stats || heroStats();
  const rank = foe && foe.rank ? foe.rank.n : 1;
  const once = !!(foe && foe.once);   // 정예·히든·보스 — 회차당 한 번뿐인 상대
  return Math.min(RULES.DROP_CAP,
    base * rankDropMult(rank, once) * luckMult() * (1 + num(h.findRate)) * auraMult);
}

// 전리품을 얼마나 잘 캐는 몸인가 — 세트끼리 비교할 때 씁니다
function findPower(stats = null) {
  const h = stats || heroStats();
  return luckMult() * (1 + num(h.findRate));
}

// 골드 배수 — 행운 분배(전리품과 같은 배수) × 장비의 골드 획득
function goldMult(stats = null) {
  const h = stats || heroStats();
  return luckMult() * (1 + num(h.goldRate));
}

// 장비가 얹어주는 경험치 배수.
// 전리품 확률과 달리 행운 같은 걸 타지 않고, 오직 착용한 『성장』 장비만 봅니다.
function xpGearMult(stats = null) {
  const h = stats || heroStats();
  return 1 + num(h.xpRate);
}

// ---------- 전리품 ----------
// 특수장비는 어느 칸에 낄지(slot)를 받습니다. 다른 특수장비 칸에 끼워져 있었다면 그쪽에서 빼서 옮깁니다.
function equip(itemId, slot) {
  const item = getItem(itemId);
  if (!item || !owns(itemId)) return;
  const to = item.slot === 'special' ? slot : item.slot;
  if (!to || !isSlotOpen(to) || (item.slot === 'special') !== isSpecialSlot(to)) return;
  const from = equippedSlotOf(itemId);
  if (from && from !== to) State.meta.equipped[from] = null;
  State.meta.equipped[to] = itemId;
  syncActiveSet();
  save();
}

function unequip(slot) {
  State.meta.equipped[slot] = null;
  syncActiveSet();
  save();
}

// ---------- 장비 세트 ----------
// 열두 부위를 매번 손으로 갈아끼우는 건 고역입니다.
// 싸우러 갈 때의 차림과 전리품을 캐러 갈 때의 차림을 따로 입혀두고 갈아입습니다 —
// Inflation RPG 와 Resolute Hero 에도 있는 기능입니다.
//
// **저장하고 꺼내 쓰는 게 아닙니다.** 세 벌을 각각 입혀두고 그중 하나를 입고
// 다니는 것에 가깝습니다. 그래서 「저장」 버튼이 없습니다 —
// 지금 입은 세트를 고치면 그 세트가 곧바로 그렇게 바뀝니다.
//
//   meta.activeSet  지금 입고 있는 세트 번호
//   meta.equipped   지금 몸에 걸친 것. 늘 sets[activeSet] 과 같습니다.
//   meta.sets[n]    n번 세트에 입혀둔 것

// 지금 입은 것을 현재 세트에 그대로 새겨둡니다.
// equip/unequip 뒤에 반드시 불러야 둘이 어긋나지 않습니다.
function syncActiveSet() {
  const n = State.meta.activeSet || 0;
  State.meta.sets[n] = { ...State.meta.equipped };
}

// 다른 세트로 갈아입습니다.
function switchSet(n) {
  if (n === State.meta.activeSet) return;
  syncActiveSet();                       // 입고 있던 것을 먼저 새겨두고
  State.meta.activeSet = n;
  const s = State.meta.sets[n] || {};
  for (const slot of ALL_SLOT_IDS) {
    const id = s[slot];
    // 그 사이에 초기화했거나 없는 물건이면 그냥 비웁니다
    State.meta.equipped[slot] = owns(id) ? id : null;
  }
  save();
}
const SET_COUNT = 3;

// 그 세트에 몇 부위가 채워져 있는가. 비어 있으면 0.
function setFilled(n) {
  const s = (n === State.meta.activeSet) ? State.meta.equipped : State.meta.sets[n];
  if (!s) return 0;
  return ALL_SLOT_IDS.filter(k => owns(s[k]) && isSlotOpen(k)).length;
}

// 지금 입고 있는 세트인가
function isSetActive(n) {
  return n === (State.meta.activeSet || 0);
}

// 각 슬롯에서 가장 좋은 것을 자동으로 착용합니다.
// 자동 착용은 일부러 없앴습니다.
// 장비마다 성격이 달라진 뒤로는 "가장 강한 것" 이라는 게 정의되지 않습니다 —
// 크리 몰빵 무기와 방어형 무기 중 뭐가 나은지는 스탯을 어떻게 찍었느냐에 달렸으니까요.
// 그 고민이 이 게임의 재미라서, 대신 골라주지 않습니다.

// ---------- 로그 ----------
// 줄마다 번호를 붙입니다 — 전투를 보여주는 동안, 그 전투가 남긴 줄은 화면에서 잠깐 숨기려고 (ui.js 의 renderLog)
let logSeq = 0;
function pushLog(kind, text) {
  State.log.push({ kind, text, n: ++logSeq });
  if (State.log.length > 200) State.log.shift();
}

// ---------- 유틸 ----------

// 한글 조사 자동 선택. "그람을", "아자토스를" 처럼 받침에 맞춰 골라줍니다.
//   한글 음절 코드 = 0xAC00 + (초성*21 + 중성)*28 + 종성
//   → (코드 - 0xAC00) % 28 이 0 이 아니면 받침이 있다는 뜻.
function josa(word, withJong, withoutJong) {
  const c = word.charCodeAt(word.length - 1);
  if (c < 0xAC00 || c > 0xD7A3) return withoutJong; // 한글이 아니면 기본값
  return ((c - 0xAC00) % 28) !== 0 ? withJong : withoutJong;
}

// 큰 숫자를 읽기 쉽게. 레벨이 1,000만까지 가고 경험치는 그보다 훨씬 커집니다.
// 레벨 100조의 누적 경험치가 10²⁸ 쯤이라 Oc(10²⁷)까지 둡니다.
const UNITS = [[1e30, 'No'], [1e27, 'Oc'], [1e24, 'Sp'], [1e21, 'Sx'], [1e18, 'Qi'],
               [1e15, 'Qa'], [1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']];

function fmt(n) {
  if (n === null || n === undefined || !isFinite(n)) return '-';
  const abs = Math.abs(n);
  if (abs < 10000) return Math.round(n).toLocaleString('ko-KR');
  for (const [v, s] of UNITS) if (abs >= v) return (n / v).toFixed(2) + s;
  return Math.round(n).toLocaleString('ko-KR');
}

// 레벨은 자릿수를 그대로 보여줍니다 — 1,000만은 눈으로 봐야 맛이 나니까.
function fmtLevel(n) {
  if (!isFinite(n)) return '-';
  return Math.round(n).toLocaleString('ko-KR');
}
