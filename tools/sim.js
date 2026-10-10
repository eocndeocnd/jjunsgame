// ============================================================
//  sim.js  —  자동 플레이 시뮬레이션 (개발용)
//  게임 빌드(jjunsgame.html)에는 들어가지 않습니다.
//
//  tools/sim.html 을 열면 data.js · game.js 를 그대로 불러와서
//  사람이 하듯 회차를 반복하고, 몇 회차에 어디까지 갔는지 적습니다.
//  밸런스를 손댄 뒤 "게임이 몇 회차짜리가 됐나" 를 숫자로 보는 도구입니다.
//
//  사람의 판단을 단순한 규칙으로 흉내 냅니다:
//    - 레벨업 포인트는 자동 분배(기본 비율), 장비는 알아서 갈아끼우기
//    - 정해진 자리(정예·히든·보스)는 승률이 POST_MIN 이상일 때만 간다
//    - 『격을 삼키는 검』이 있으면 아직 안 삼킨 자리에서는 검으로 바꿔 든다
//    - 길에서 만난 상대는 승률이 ROAD_MIN 미만이면 물러선다
//    - 보스를 꺾었으면 다음 지역 첫 상대에게 MOVE_MIN 이상일 때 넘어간다
//    - 강화가 있으면 강화석이 모이는 대로 가장 낮은 부위부터 강화한다
//      (특수장비 강화석과 +15 를 다 채운 부위의 강화석은 가장 낮은 부위로 바꿔 몰아준다)
// ============================================================

const SIM = {
  POST_MIN: 0.75,
  ROAD_MIN: 0.5,
  MOVE_MIN: 0.6,
  SAMPLES: 120,        // 판단용 승률 추정 횟수 (실제 전투는 한 번만 굴립니다)
  MAX_RUNS: 400,
  MAX_STEPS: 5000      // 한 회차에서 무한루프 방지
};

// 같은 시드면 같은 결과가 나와야 비교가 됩니다. Math.random 을 통째로 바꿔 끼웁니다.
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function simWin(foe) { return winChance(heroStats(), foe, SIM.SAMPLES); }

// 겹 시스템(stackOf) 시절 코드에서도 돌아가야 이전/이후를 비교할 수 있습니다
function simOwns(id) { return typeof owns === 'function' ? owns(id) : stackOf(id) > 0; }

// 강화 시스템이 있을 때만 — 모인 강화석으로 낮은 부위부터 올립니다
function simEnhance() {
  if (typeof tryEnhance !== 'function') return;
  // 강화석 바꾸기 — 따로 쓸 데가 없는 강화석(특수장비 강화석, +15 를 다 채운 부위의 것)만
  // 가장 낮은 부위로 몰아줍니다. 손해가 절반이라 멀쩡한 부위의 것은 건드리지 않습니다.
  if (typeof exchangeStones === 'function') {
    const low = SLOT_IDS.filter(s => State.meta.equipped[s])
      .sort((a, b) => enhanceLevel(a) - enhanceLevel(b))[0];
    if (low) {
      exchangeStones('special', low, stonesOf('special'));
      for (const s of SLOT_IDS) {
        if (s !== low && enhanceLevel(s) >= ENHANCE_MAX) exchangeStones(s, low, stonesOf(s));
      }
    }
  }
  for (let guard = 0; guard < 500; guard++) {
    const slots = SLOT_IDS
      .filter(s => State.meta.equipped[s] && canEnhance(s))
      .sort((a, b) => enhanceLevel(a) - enhanceLevel(b));
    if (!slots.length) return;
    tryEnhance(slots[0]);
  }
}

// 정해진 자리 하나와 싸웁니다. 삼키는 검이 있고 아직 안 삼킨 자리면 검으로 바꿔 듭니다.
function simFightPost(foe) {
  const meta = State.meta;
  const prevWeapon = meta.equipped.weapon;
  let swapped = false;
  if (simOwns(DEVOURER_ID) && !meta.banked.includes(foe.id) && prevWeapon !== DEVOURER_ID) {
    meta.equipped.weapon = DEVOURER_ID;
    if (simWin(foe) >= SIM.POST_MIN) swapped = true;
    else meta.equipped.weapon = prevWeapon;
  }
  approachPost(foe.id);
  const r = engage();
  if (swapped) meta.equipped.weapon = prevWeapon;
  syncActiveSet();
  return r;
}

// 이 회차를 끝까지 둡니다
function simPlayRun(stat) {
  const run = State.run;
  for (let step = 0; step < SIM.MAX_STEPS && !run.over; step++) {
    simEnhance();

    // 1. 길이 열렸고 다음 지역이 감당할 만하면 넘어갑니다
    if (run.zoneCleared && ZONES[run.zoneIndex + 1] && run.energy >= RULES.ZONE_MOVE_COST) {
      const first = zoneNormals(run.zoneIndex + 1)[0];
      if (simWin(first) >= SIM.MOVE_MIN) { moveToNextZone(); continue; }
    }

    // 2. 이길 만한 정해진 자리가 있으면 그쪽부터 (정예 → 히든 → 보스 순)
    if (run.energy >= RULES.TRAVEL_COST) {
      const order = { elite: 0, hidden: 1, boss: 2 };
      const posts = visiblePosts(run.zoneIndex)
        .filter(p => !isDowned(p.id))
        .sort((a, b) => order[a.kind] - order[b.kind]);
      let fought = false;
      for (const p of posts) {
        if (simWin(p) < SIM.POST_MIN) continue;
        const r = simFightPost(p);
        stat.fights++;
        if (r && !r.win) stat.losses++;
        fought = true;
        break;
      }
      if (fought) continue;
    }

    // 3. 길을 떠납니다
    if (!canAct()) break;
    travel();
    const foe = getEnemy(run.encounter);
    if (simWin(foe) < SIM.ROAD_MIN) { retreat(); stat.retreats++; continue; }
    const r = engage();
    stat.fights++;
    if (r && !r.win) stat.losses++;
  }
}

// 처음부터 클리어할 때까지 (또는 MAX_RUNS 까지) 돌립니다.
// 회차 하나를 setTimeout 한 번에 돌려서 브라우저가 멈추지 않게 합니다.
function simStart(seed = 1, onDone) {
  Math.random = mulberry32(seed);
  currentSlot = 0;                    // 아무것도 저장하지 않습니다
  State.meta = freshMeta();
  State.meta.settings.autoEquip = true;
  State.meta.tutorialDone = true;

  const out = { seed, runs: [], firstZone: {}, cleared: null, done: false, t0: Date.now() };
  window.SIM_RESULT = out;

  function oneRun() {
    startRun();
    const stat = { fights: 0, losses: 0, retreats: 0 };
    simPlayRun(stat);
    const run = State.run;
    const zone = run.zoneIndex + 1;
    if (!out.firstZone[zone]) out.firstZone[zone] = State.meta.runCount;
    // 마지막 지역에 처음 닿았을 때 부위 강화가 평균 몇이었나
    if (zone === ZONES.length && out.enhAtLast == null && typeof enhanceLevel === 'function') {
      out.enhAtLast = SLOT_IDS.reduce((n, s) => n + enhanceLevel(s), 0) / SLOT_IDS.length;
    }
    // 특수장비 칸이 n개째 열린 회차
    if (typeof specialOpenCount === 'function') {
      out.specialAt = out.specialAt || {};
      for (let k = 1; k <= specialOpenCount(); k++) if (!out.specialAt[k]) out.specialAt[k] = State.meta.runCount;
    }
    out.runs.push({
      n: State.meta.runCount, zone, level: run.level, kills: run.kills,
      fights: stat.fights, losses: stat.losses, retreats: stat.retreats,
      bosses: State.meta.bossesBeaten.length, owned: ownedIds().length,
      energy: startEnergy(),
      enh: typeof enhanceLevel === 'function' ? SLOT_IDS.map(enhanceLevel).join(',') : ''
    });
    if (State.meta.cleared) out.cleared = State.meta.runCount;

    if (State.meta.cleared || State.meta.runCount >= SIM.MAX_RUNS) {
      out.done = true;
      out.secs = Math.round((Date.now() - out.t0) / 1000);
      if (onDone) onDone(out);
      return;
    }
    setTimeout(oneRun, 0);
  }
  setTimeout(oneRun, 0);
  return out;
}

// 시드 여러 개를 차례로 돌려 모아 봅니다. 한 판은 운에 따라 크게 흔들려서
// (같은 규칙에서도 56~93회차) 시드 하나로는 판단이 안 됩니다.
// 시드 여덟 개가 20초 남짓 걸립니다.
//
// 기록 (시드 1~8, 클리어 회차 평균):
//   겹 시스템 · 격 11개                         67  (56~93)
//   부위 강화 · 격 15개 · 격 보정 없음           40  (36~47)   ← 제7격부터 질주
//   부위 강화 · 격 15개 · 격 보정 0.15           96  (88~104)
//   + 실패 보정 없앰 · +11~+15 비싸고 세게        85  (77~94)
//   + 특수장비 칸 넷 · 격 보정 0.18                82  (74~86)
//   + 강화석 바꾸기 (2:1) · 특수장비는 자기 강화석  82  (74~92)
//   + 격 보정 0.19 · 전리품 배수 1.4/1.6/1.8      136 (124~145, 시드 1~4)
//   + 격 보정 0.16                                 104 (95~110, 시드 1~4)
//   + 격 보정 0.17 · 제3~6격 10% 약하게            101 (99~104, 시드 1~4)
//   + 세트 · 도감(+2%) · 재생/생존/일격/연속 턴      64  (59~69)
//   + 도감 +1% · 경험치 계수 0.8                   93  (83~98, 시드 1~4)
//   + 초반 약화 15% (지금)                          90  (83~94, 시드 1~4)
async function simBatch(seeds = [1, 2, 3, 4, 5, 6, 7, 8]) {
  const res = [];
  for (const seed of seeds) {
    await new Promise(done => simStart(seed, done));
    const o = window.SIM_RESULT;
    const last = o.runs[o.runs.length - 1];
    res.push({ seed, cleared: o.cleared, z: o.firstZone, enh: last.enh, enhAtLast: o.enhAtLast,
               specialAt: o.specialAt || {},
               fights: o.runs.reduce((n, r) => n + r.fights, 0) });
  }
  const mean = a => Math.round(a.reduce((x, y) => x + y, 0) / a.length);
  const cleared = res.map(r => r.cleared ?? 999).sort((a, b) => a - b);
  const lastZone = ZONES.length;
  const reach = res.map(r => r.z[lastZone] ?? 999).sort((a, b) => a - b);
  // 지역마다 처음 닿은 회차의 평균 — 어디서 막히는지 봅니다
  const zoneMean = {};
  for (let z = 2; z <= lastZone; z++) {
    const v = res.map(r => r.z[z]).filter(Boolean);
    if (v.length) zoneMean[z] = mean(v);
  }
  return {
    cleared, clearedMean: mean(cleared), clearedMedian: cleared[Math.floor(cleared.length / 2)],
    reachLast: reach, reachLastMean: mean(reach), zoneMean,
    fightsMean: mean(res.map(r => r.fights)),
    enhAtLast: res.map(r => r.enhAtLast == null ? null : +r.enhAtLast.toFixed(1)),
    // 특수장비 칸이 1·2·3·4개째 열린 회차 (평균)
    specialAt: [1, 2, 3, 4].map(k => {
      const v = res.map(r => r.specialAt[k]).filter(Boolean);
      return v.length ? mean(v) : null;
    }),
    enhAtEnd: res.map(r => r.enh)
  };
}

// 결과를 한눈에 — 지역에 처음 닿은 회차와 클리어 회차
function simSummary(out = window.SIM_RESULT) {
  const fights = out.runs.reduce((n, r) => n + r.fights, 0);
  const losses = out.runs.reduce((n, r) => n + r.losses, 0);
  return {
    seed: out.seed,
    cleared: out.cleared,
    runs: out.runs.length,
    firstZone: out.firstZone,
    fights, losses,
    secs: out.secs
  };
}
