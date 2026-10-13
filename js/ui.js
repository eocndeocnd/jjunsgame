// ============================================================
//  ui.js  —  화면 그리기와 버튼 연결
//  게임 규칙은 여기 없습니다. game.js 의 함수를 부르기만 합니다.
// ============================================================

const $ = id => document.getElementById(id);

// ---------- 전체 다시 그리기 ----------
// 길을 떠나 상대를 마주한 때부터 싸움(다시 보기)이 끝날 때까지 — 차림 · 스탯 분배는 손댈 수 없습니다.
// 눈앞의 상대를 보고 갈아입는 건 마주하기 전까지만, 싸우는 도중에 바꿀 수 있으면 승패가 정해진 뒤에도 뒤집어 버립니다.
function fightLocked() {
  return !!((State.run && State.run.encounter) || battle);
}

function render() {
  const locked = fightLocked();
  document.body.classList.toggle('fight-locked', locked);
  if (locked) {
    if (isSlotModalOpen()) closeSlotModal();
    if (isEnhModalOpen()) closeEnhModal();
    if (isSwapModalOpen()) closeSwapModal();
    closeAllocModal();
    enhMode = false;      // 슬롯 강화 중이었다면 칸이 도로 장비 칸으로
  }
  withHeldSpoils(renderRecords);
  withHeldSpoils(renderHero);      // 레벨 · 경험치 · 스탯도 전투가 끝난 뒤에
  withHeldSpoils(renderJourney);
  withHeldSpoils(renderGear);
  renderLog();
  renderSettings();
  renderOverlay();
  withHeldSpoils(renderTabBadges);
  atmosphere();        // 배경음이 분위기를 따라가므로 먼저
  syncMusic();
  renderShop();
  renderSwap();
  if (isAdminOpen()) renderAdmin();
}

// ---------- 벽 너머의 분위기 ----------
// 마왕이 쓰러지면 그 회차는 벽 너머다 — 잿빛 종이, 보랏빛 잉크, 찢어진 틈으로 별이 보이는 지도, 다른 배경음.
// 그 공간은 회차마다 되돌아가므로, 다음 회차는 다시 이쪽에서 시작해 마왕을 다시 꺾어야 다시 너머로 간다.
//
// 바뀌는 순간은 연출 뒤로 미룹니다 — 마왕과 싸우는 동안, 그리고 결과가 뜬 뒤 벽이 무너지는 연출의
// 가장 어두운 때까지는 아직 이쪽입니다 (wallPending).
let wallPending = false;
function atmosphere() {
  const titleUp = !$('title').classList.contains('hidden');
  let on = !titleUp && beyondWall() && !wallPending;
  if (battle && battle.r.enemy.id === WALL_BOSS) on = false;
  document.body.classList.toggle('beyond', on);
  if (typeof Backdrop !== 'undefined') Backdrop.mode(on ? 'beyond' : 'map');
}

// 벽이 무너지는 순간 — 하얗게 번쩍 · 금이 간다 · 어두워진다 · 눈 하나가 깜빡 · 걷히면 다른 세상.
// 글로 설명하지 않습니다. 결과 화면의 「나가는 길도 열렸다.」 한 줄과 이 연출이 전부입니다.
const WALL_FX_DELAY = 600;   // 결과가 뜨고 승리 소리가 한 번 울린 뒤
const WALL_FX_DARK = 900;    // 연출 시작부터 가장 어두운 때까지 — 여기서 분위기가 바뀝니다
const WALL_FX_LEN = 2400;
const wallMoments = new WeakSet();
function wallMoment(r) {
  if (!r.win || r.enemy.id !== WALL_BOSS || wallMoments.has(r)) return;
  wallMoments.add(r);
  wallPending = true;
  const turn = () => { wallPending = false; atmosphere(); syncMusic(); };
  if (calmMotion()) { setTimeout(turn, WALL_FX_DELAY); return; }
  setTimeout(() => {
    const fx = document.createElement('div');
    fx.className = 'wall-break';
    fx.setAttribute('aria-hidden', 'true');
    fx.innerHTML = `<div class="wb-flash"></div>${wallCracks()}<div class="wb-dark"></div><div class="wb-eye">👁️</div>`;
    document.body.appendChild(fx);
    const stage = document.querySelector('.stage');
    if (stage) stage.animate(
      [{ transform: 'none' }, { transform: 'translate(-6px, 3px)' }, { transform: 'translate(5px, -4px)' },
       { transform: 'translate(-3px, 2px)' }, { transform: 'none' }],
      { duration: 420, easing: 'steps(5)' });
    setTimeout(turn, WALL_FX_DARK);
    setTimeout(() => fx.remove(), WALL_FX_LEN);
  }, WALL_FX_DELAY);
}

// 화면 한가운데서 뻗어 나가는 금 — 매번 조금씩 다르게. 각진 도트 선으로.
function wallCracks() {
  const W = 400, H = 700, cx = W / 2 + (Math.random() - 0.5) * 60, cy = H * 0.42 + (Math.random() - 0.5) * 60;
  let paths = '';
  const n = 9;
  for (let k = 0; k < n; k++) {
    let a = (k / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    let x = cx, y = cy, d = `M${x.toFixed(0)} ${y.toFixed(0)}`;
    const steps = 5 + Math.floor(Math.random() * 4);
    for (let s = 0; s < steps; s++) {
      a += (Math.random() - 0.5) * 0.9;
      const len = 30 + Math.random() * 45;
      x += Math.cos(a) * len; y += Math.sin(a) * len;
      d += ` L${x.toFixed(0)} ${y.toFixed(0)}`;
    }
    paths += `<path d="${d}" pathLength="1"/>`;
  }
  return `<svg class="wb-cracks" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${paths}</svg>`;
}

// ---------- 레벨이 올라가는 모습 ----------
// 경험치는 「맞선다」를 누르는 순간 들어오지만, 전투를 보여주는 동안은 싸우기 전 값으로 그립니다 (withHeldSpoils).
// 결과가 뜨면 싸우기 전 레벨에서 숫자가 굴러 올라가고, 경험치 막대가 차오르고(오른 만큼 몇 바퀴),
// 다 올라가면 「레벨 업」이 한 번 튑니다. 여정 창(폰에서도 보이는 곳)과 「나」 창이 같이 움직입니다.
const LEVEL_ANIM = 1000;     // 레벨이 올랐을 때 숫자가 다 올라가기까지
const XP_ANIM = 500;         // 레벨은 그대로이고 막대만 찰 때
const levelMoments = new WeakSet();
// 마왕을 꺾은 결과면 벽이 무너지는 연출이 걷힌 뒤에 시작합니다
function levelWait(r) {
  return r.enemy.id === WALL_BOSS && r.openedPath && !wallMoments.has(r) && !calmMotion()
    ? WALL_FX_DELAY + WALL_FX_LEN - 300 : 150;
}
// 막대는 굴러가는 동안 폭(width) 대신 transform 으로 늘립니다 — 폭을 바꾸면 매 프레임 화면 배치를 다시 잡아서 버벅입니다
let lastLvText = '';
function paintLevel(lv, pct, done) {
  const txt = fmtLevel(lv);
  if (txt !== lastLvText) {        // 숫자는 바뀔 때만 씁니다
    lastLvText = txt;
    const a = $('heroLevel'); if (a) a.textContent = 'Lv.' + txt;
    const b = $('jeLv'); if (b) b.textContent = txt;
  }
  const p = Math.max(0, Math.min(100, pct));
  for (const id of ['xpFill', 'jeXpFill']) {
    const el = $(id);
    if (!el) continue;
    if (done) { el.style.transform = ''; el.style.width = p + '%'; }
    else { el.style.width = '100%'; el.style.transform = `scaleX(${p / 100})`; }
  }
}
function levelMoment(r) {
  if (!r.win || !r.pre || levelMoments.has(r)) return;
  const wait = levelWait(r);
  levelMoments.add(r);
  const run = State.run;
  const from = r.pre.level, to = run.level, gained = to - from;
  const fromPct = r.pre.xp / xpToNext(from) * 100;
  const toPct = run.xp / xpToNext(to) * 100;
  if (calmMotion()) { if (gained > 0) levelPop(); return; }
  lastLvText = '';
  document.body.classList.add('lv-rolling');   // 막대의 짧은 전환 효과를 끕니다 — 매 프레임 직접 그리니까
  paintLevel(from, fromPct);
  setTimeout(() => {
    const dur = gained > 0 ? LEVEL_ANIM : XP_ANIM;
    const t0 = performance.now();
    const ease = t => t * t * (3 - 2 * t);     // 천천히 시작해 천천히 끝나는 곡선 — 숫자가 고르게 넘어갑니다
    const frame = now => {
      const t = Math.min(1, (now - t0) / dur);
      const e = ease(t);
      if (t >= 1) {
        paintLevel(to, toPct, true);
        document.body.classList.remove('lv-rolling');
        if (gained > 0) levelPop();
        return;
      }
      if (gained > 0) {
        // 막대는 한 바퀴만 — 앞 55% 동안 끝까지 차고, 뒤 45% 동안 새 레벨에서 지금 자리까지
        const pct = e < 0.55 ? fromPct + (100 - fromPct) * (e / 0.55) : toPct * ((e - 0.55) / 0.45);
        paintLevel(from + Math.floor(gained * e), pct);
      } else paintLevel(to, fromPct + (toPct - fromPct) * e);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, wait);
}
// 다 올라갔을 때 — 레벨 숫자가 한 번 튀고, 그 위로 「레벨 업」이 떠올랐다 사라집니다
function levelPop() {
  for (const el of [$('heroLevel'), document.querySelector('.je-lv')]) {
    if (!el) continue;
    el.classList.remove('lv-pop');
    void el.offsetWidth;
    el.classList.add('lv-pop');
  }
  const host = document.querySelector('.journey-energy');
  if (!host || calmMotion()) return;
  const pop = document.createElement('span');
  pop.className = 'lv-up-pop';
  pop.textContent = '레벨 업!';
  host.appendChild(pop);
  setTimeout(() => pop.remove(), 1500);
}

// ---------- 소리 ----------
// 지금 마주하거나 싸우고 있는 상대 — 결과 화면이나 갈림길이면 null
function facingFoe() {
  const run = State.run;
  if (!run) return null;
  if (battle && battle.r === run.lastResult) return run.lastResult.enemy;
  if (!run.lastResult && !run.over && run.encounter) return getEnemy(run.encounter);
  return null;
}

// 배경음 — 초기 화면 · 여정 · 보스(히든 포함)와 마주하거나 싸우는 동안. 여정이 끝나면 멈춥니다.
function syncMusic() {
  if (!$('title').classList.contains('hidden')) { Sound.music('title'); return; }
  const run = State.run;
  if (!run) return;
  if (run.over && !run.lastResult) { Sound.music(null); return; }
  const foe = facingFoe();
  if (foe && (foe.kind === 'boss' || foe.kind === 'hidden')) { Sound.music('boss'); return; }
  // 벽 너머에서는 여정의 노래가 바뀝니다
  Sound.music(document.body.classList.contains('beyond') ? 'beyond' : 'field');
}

// 상대가 나타났을 때 — 정예는 세 음, 보스 · 히든은 무겁게. 기운을 둘렀으면 반짝임을 덧붙입니다
function soundEncounter() {
  const run = State.run;
  if (!run || !run.encounter) return;
  const kind = getEnemy(run.encounter).kind;
  Sound.play(kind === 'normal' ? 'encounter' : kind === 'elite' ? 'encounterElite' : 'encounterBoss');
  if (run.aura) Sound.play('aura', { delay: 0.2 });
}

// 누르는 소리. 저마다 소리가 따로 있는 버튼은 뺍니다 (겹치면 지저분합니다)
const OWN_SOUND = '#travelBtn, #engageBtn, #nextZoneBtn, #retreatBtn, #commitBtn, '
  + '[data-post], [data-enhance], [data-enhslot], [data-equip], [data-unequip], [data-swap], [data-setpick], [data-jset]';
function wireClickSound() {
  document.addEventListener('click', ev => {
    const b = ev.target.closest('button');
    if (!b || b.disabled || b.matches(OWN_SOUND)) return;
    Sound.play('tick');
  }, true);
}

// ---------- 설정 ----------
// 화면에 남긴 건 포인트 자동 분배 하나입니다.
// 알아서 갈아끼우기 · 결과 자동 넘기기는 뺐습니다 (꺼진 채로 고정 — game.js 의 FIXED_SETTINGS).
// 소리 둘은 기기에 저장합니다(device) — 저장 칸을 바꿔도, 초기 화면에서도 그대로입니다.
const SETTINGS_UI = [
  { group: '반복 줄이기' },
  { id: 'autoAlloc', type: 'toggle', name: '포인트 자동 분배', meta: true,
    desc: '레벨이 오를 때마다 정해둔 비율대로 알아서 찍습니다.' },

  { group: '소리' },
  { id: 'sfx', type: 'toggle', name: '효과음', device: true,
    desc: '전투 · 전리품 · 강화 같은 소리.' },
  { id: 'bgm', type: 'toggle', name: '배경음', device: true,
    desc: '초기 화면 · 여정 · 보스전 음악.' }
];

// 관리자 창에서만 바꾸는 보기 설정 — 화면 설정에는 그리지 않습니다 (아래 「관리자」)
const ADMIN_SETTINGS_UI = [
  { id: 'battleSpeed', type: 'choice', name: '전투 보기',
    desc: '싸우는 과정을 체력 바와 글로 보여줍니다.',
    options: [[0, '끔'], [1, '빠르게'], [2, '보통']] },
  { id: 'dropFx', type: 'toggle', name: '전리품 등장 연출',
    desc: '빼앗은 것이 잠깐 뒤에 하나씩 튀어나옵니다.' },
  { id: 'showLocked', type: 'toggle', name: '못 얻은 것 펼쳐두기',
    desc: '부위 창을 열 때 아직 못 얻은 ???? 도 처음부터 보여줍니다.' }
];
const ALL_SETTINGS = [...SETTINGS_UI, ...ADMIN_SETTINGS_UI];

function settingValue(s) {
  if (s.device) return Sound.get(s.id);
  return s.meta ? State.meta[s.id] : State.meta.settings[s.id];
}

// 설정 줄들 — 화면 설정과 관리자 창이 같은 모양을 씁니다.
// 화면에는 이름만 둡니다(설명은 마우스를 올렸을 때만). 관리자 창은 설명까지 적습니다(withDesc).
function settingRowsHTML(list, withDesc) {
  return list.map(s => {
    if (s.group) return `<div class="set-group">${s.group}</div>`;
    const v = settingValue(s);
    const control = s.type === 'toggle'
      ? `<button class="btn tiny set-toggle ${v ? 'on' : ''}" data-set="${s.id}">${v ? '켜짐' : '꺼짐'}</button>`
      : `<div class="set-choice">${s.options.map(([val, label]) =>
          `<button class="btn tiny ${v === val ? 'on' : ''}" data-set="${s.id}" data-val="${val}">${label}</button>`).join('')}</div>`;
    return `
      <div class="set-row" title="${s.desc}">
        <div class="set-body">
          <span class="set-name">${s.name}</span>
          ${withDesc ? `<span class="set-desc">${s.desc}</span>` : ''}
        </div>
        ${control}
      </div>`;
  }).join('');
}

function wireSettingButtons(el) {
  for (const b of el.querySelectorAll('[data-set]')) {
    b.addEventListener('click', () => {
      const s = ALL_SETTINGS.find(x => x.id === b.dataset.set);
      if (s.type === 'choice') setSetting(s, Number(b.dataset.val));
      else setSetting(s, !settingValue(s));
    });
  }
}

function renderSettings() {
  const el = $('settings');
  if (!el) return;
  el.innerHTML = settingRowsHTML(SETTINGS_UI) + `
    <div class="set-group">저장</div>
    <div class="set-row">
      <div class="set-body">
        <span class="set-name">이 저장을 지웁니다</span>
        <span class="set-desc">되돌릴 수 없다</span>
      </div>
      <button class="btn tiny danger" id="wipeBtn">초기화</button>
    </div>`;
  wireSettingButtons(el);
  const wipe = $('wipeBtn');
  if (wipe) wipe.addEventListener('click', confirmWipe);
}

function setSetting(s, value) {
  if (s.device) Sound.set(s.id, value);
  else if (s.meta) State.meta[s.id] = value;
  else State.meta.settings[s.id] = value;
  if (s.id === 'showLocked') showLocked = value;
  save();
  render();
}

// 지우기는 한 번 더 묻습니다 — 되돌릴 수 없으니까요.
let wipeArmed = false;
function confirmWipe() {
  const b = $('wipeBtn');
  if (!wipeArmed) {
    wipeArmed = true;
    b.textContent = '정말 지웁니다';
    b.classList.add('armed');
    setTimeout(() => {
      if (!wipeArmed) return;
      wipeArmed = false;
      if ($('wipeBtn')) { $('wipeBtn').textContent = '초기화'; $('wipeBtn').classList.remove('armed'); }
    }, 4000);
    return;
  }
  wipeArmed = false;
  wipeSlot(currentSlot);    // 하던 회차까지 같이 지웁니다
  location.reload();
}

// ---------- 최고 기록 ----------
function renderRecords() {
  const m = State.meta;
  const deepest = ZONES[Math.min(m.bestZone, ZONES.length) - 1];
  const bm = bossXpMult();
  // 분모는 아는 데까지만 — 마왕 너머가 몇이나 남았는지 숫자로도 새지 않게 (game.js 의 knownZoneCount)
  const known = knownZoneCount();
  $('records').innerHTML = `
    ${record('회차', m.runCount)}
    ${record('최고 레벨', fmtLevel(m.bestLevel))}
    ${record('최심 도달', `${m.bestZone}지역 · ${deepest.name}`)}
    ${record('빼앗은 격', `${m.bossesBeaten.length}/${known}`, bm > 1.01 ? 'boost' : '')}
    ${bm > 1.01 ? record('영구 경험치', `×${bm.toFixed(1)}`, 'boost') : ''}
    ${record('골드', fmt(num(m.gold)))}
    ${record('전리품', `${ownedIds().length}/${knownItems().length}`)}
    ${record('도감 완성', `${completedRanks()}/${known}`, completedRanks() ? 'boost' : '')}
    ${m.cleared ? record('', '클리어', 'cleared') : ''}
  `;
}

function record(label, value, cls = '') {
  return `<div class="record ${cls}">
    <span class="record-label">${label}</span>
    <span class="record-value">${value}</span>
  </div>`;
}

// ---------- 나 ----------
function renderHero() {
  const run = State.run;
  const base = heroBaseStats(run.level);
  const total = heroStats();

  $('heroLevel').textContent = 'Lv.' + fmtLevel(run.level);
  // 회차는 바로 위 기록 칸에 있습니다 — 여기 또 적으면 한 패널에 같은 숫자가 두 번 찍힙니다

  // 내 격 — 레벨이 올라가면 격이 바뀝니다.
  // 아직 모르는 격(마왕 너머)은 이름도, 다음 단계가 있다는 것도 보이지 않습니다.
  const rank = rankOf(run.level);
  const next = RANKS.find(r => r.minLevel > run.level);
  const av = activeAvatar();
  $('heroRank').innerHTML = `
    ${av ? `<span class="avatar-tag">${avatarTitle(av)}</span>` : ''}
    ${knownRank(rank.n)
      ? `<span class="rank-chip r${rank.n}">제${rank.n}격 · ${rank.name}</span>`
      : `<span class="rank-chip unknown">???</span>`}
    ${next && knownRank(next.n) ? `<span class="rank-next">제${next.n}격까지 Lv.${fmtLevel(next.minLevel - run.level)}</span>` : ''}
  `;

  // 경험치 바
  const need = xpToNext(run.level);
  $('xpText').textContent = `${fmt(run.xp)} / ${fmt(need)}`;
  $('xpFill').style.width = Math.min(100, (run.xp / need) * 100) + '%';

  // 에너지
  const maxPips = Math.max(RULES.START_ENERGY, run.energy);
  $('energyText').textContent = `${run.energy} / ${RULES.START_ENERGY}`;
  let pips = '';
  for (let i = 0; i < maxPips; i++) {
    pips += `<div class="pip ${i < run.energy ? '' : 'spent'}"></div>`;
  }
  $('energyPips').innerHTML = pips;

  // 스탯 — 레벨에서 온 기본값 위에 분배와 전리품이 얼마나 얹혔는지
  $('heroStats').innerHTML = `
    ${statRow('생명', total.life, total.life - base.life)}
    ${statRow('공격력', total.damage, total.damage - base.damage)}
    ${statRow('방어력', total.defense, total.defense - base.defense)}
    ${statRow('민첩', total.dex, total.dex - base.dex)}
    ${statRow('행운', total.luck, total.luck - base.luck)}
    ${statRow('크리티컬', `${Math.round(critChance(total.dex, total.luck, total.critRate) * 100)}% · ×${critDamage(total.dex).toFixed(1)}`
        + (total.critRate > 0 ? ` <span class="stat-note">(장비 +${pctTxt(total.critRate)})</span>` : ''), 0)}
    ${completedRanks() ? statRow('도감 완성', `${completedRanks()}격 · 핵심 스탯 +${Math.round(completedRanks() * COLLECTION_BONUS * 100)}%`, 0) : ''}
    <li class="stat-head">특수 능력치</li>
    ${['doubleHit', 'pierce', 'lifesteal', 'block', 'reflect', 'regen', 'survive', 'harmTouch', 'doubleTurn']
      .map(k => specialRow(k, total[k])).join('')}
    <li class="stat-head">얻는 것</li>
    ${statRow('전리품 확률', total.findRate > 0
        ? `×${findPower(total).toFixed(2)} <span class="stat-note">(행운 ×${luckMult().toFixed(2)} · 장비 · 화신 +${Math.round(total.findRate * 100)}%)</span>`
        : `×${luckMult().toFixed(2)}`, 0)}
    ${statRow('경험치', total.xpRate !== 0
        ? `×${xpGearMult(total).toFixed(2)} <span class="stat-note">(장비 · 화신 ${total.xpRate > 0 ? "+" : "−"}${Math.round(Math.abs(total.xpRate) * 100)}%)</span>`
        : '×1.00', 0)}
    ${statRow('골드', total.goldRate > 0
        ? `×${goldMult(total).toFixed(2)} <span class="stat-note">(행운 ×${luckMult().toFixed(2)} · 장비 · 화신 +${Math.round(total.goldRate * 100)}%)</span>`
        : `×${luckMult().toFixed(2)}`, 0)}
    ${statRow('강화석', `+${Math.round(total.stoneRate * 100)}%`, 0)}
    ${statRow('꺾은 것', run.kills, 0)}
  `;

  renderAvatars();

  // 안 찍은 포인트가 있으면 버튼에 점을 찍습니다 — 창을 안 열어도 보이게.
  const pip = $('allocPip');
  if (pip) pip.classList.toggle('on', run.unspent > 0);
  const ob = $('openAllocBtn');
  if (ob) ob.classList.toggle('ready', run.unspent > 0);

  renderAlloc(run);
}

// ---------- 스탯 분배 ----------
function renderAlloc(run) {
  const w = State.meta.weights;
  const sum = STAT_KEYS.reduce((n, k) => n + (w[k] || 0), 0);
  const alloc = allocatedStats();
  const auto = State.meta.autoAlloc;

  $('pointCount').textContent = run.unspent > 0 ? `${fmt(run.unspent)}P 남음` : '';

  // 행 전체가 버튼입니다. 한 번 누르면 그 스탯이 한 칸 차지하고,
  // 비율은 칸 수대로 알아서 다시 나뉩니다.
  // 왼쪽 굵은 막대 = 이미 찍힌 것, 오른쪽 연한 막대 = 이번에 들어갈 몫.
  const spentSum = STAT_KEYS.reduce((n, k) => n + run.spent[k], 0);

  $('alloc').innerHTML = `
    <div class="alloc-top">
      <div class="alloc-pool ${run.unspent > 0 ? 'ready' : ''}">
        <span class="pool-k">안 찍은 포인트</span>
        <span class="pool-v">${fmt(run.unspent)}</span>
      </div>
      <button class="btn tiny auto-toggle ${auto ? 'on' : ''}" id="autoAllocBtn">
        자동 ${auto ? '켜짐' : '꺼짐'}
      </button>
    </div>
  ` + STAT_INFO.map(s => {
    const n = w[s.id] || 0;
    const share = sum > 0 ? Math.round(n / sum * 100) : 0;
    const held = spentSum > 0 ? run.spent[s.id] / spentSum * 100 : 0;
    const incoming = sum > 0 ? Math.floor(run.unspent * n / sum) : 0;
    return `
      <button class="alloc-row ${n ? 'has' : ''}" data-add="${s.id}">
        <div class="alloc-head">
          <span class="alloc-name">${s.name}</span>
          <span class="alloc-slots">${n ? `${n}칸 · ${share}%` : ''}</span>
          <span class="alloc-share">+${fmt(alloc[s.id])}</span>
        </div>
        <div class="alloc-bar">
          <div class="alloc-fill" style="width:${held}%"></div>
          <div class="alloc-next" style="width:${share}%"></div>
        </div>
        <div class="alloc-foot">
          ${s.desc ? `<span class="alloc-desc">${s.desc}</span>` : ''}
          ${incoming > 0 ? `<span class="alloc-incoming">이번에 ${fmt(incoming)}P</span>` : ''}
          ${n ? `<span class="alloc-sub" data-sub="${s.id}">−</span>` : ''}
        </div>
      </button>`;
  }).join('') + `
    ${sum === 0
      ? '<p class="hint alloc-empty">눌러서 비율을 정한다</p>'
      : ''}
    <button class="btn primary alloc-commit" id="commitBtn"
      ${run.unspent > 0 && sum > 0 ? '' : 'disabled'}>
      ${run.unspent > 0 ? `${fmt(run.unspent)}P 찍는다` : '찍을 포인트 없음'}
    </button>
    <p class="hint alloc-note">찍은 포인트는 되돌릴 수 없다</p>
    <div class="alloc-presets">
      <button class="btn tiny" data-preset="1,1,1,1,1">균형</button>
      <button class="btn tiny" data-preset="1,4,1,2,0">공격</button>
      <button class="btn tiny" data-preset="4,1,3,1,0">방어</button>
      <button class="btn tiny" data-preset="1,2,1,5,1">민첩</button>
      <button class="btn tiny" data-preset="1,1,1,1,4">행운</button>
      <button class="btn tiny" data-preset="0,0,0,0,0">비움</button>
    </div>`;

  for (const b of document.querySelectorAll('[data-add]')) {
    b.addEventListener('click', ev => {
      // 행 안의 − 를 눌렀으면 더하지 말고 빼야 합니다
      const minus = ev.target.closest('[data-sub]');
      if (minus) { addWeight(minus.dataset.sub, -1); render(); return; }
      addWeight(b.dataset.add, 1);
      render();
    });
  }
  for (const b of document.querySelectorAll('[data-preset]')) {
    b.addEventListener('click', () => {
      setWeights(...b.dataset.preset.split(',').map(Number));
      render();
    });
  }
  $('commitBtn').addEventListener('click', () => { commitPoints(); Sound.play('commit'); render(); });
  $('autoAllocBtn').addEventListener('click', () => { setAutoAlloc(!State.meta.autoAlloc); render(); });

  const ob = $('openAllocBtn');
  if (ob && !ob.dataset.wired) { ob.dataset.wired = '1'; ob.addEventListener('click', openAllocModal); }
  for (const b of document.querySelectorAll('[data-closealloc]')) {
    if (b.dataset.wired) continue;
    b.dataset.wired = '1';
    b.addEventListener('click', closeAllocModal);
  }
}

// value 가 문자열이면 그대로 씁니다 (크리티컬처럼 "27% · ×2.5" 같은 값)
// 0.078 → "7.8%"
function pctTxt(v) { return `${(num(v) * 100).toFixed(1)}%`; }

// 특수 능력치 한 줄 — 지금 값과 상한. 상한에 닿았으면 눈에 띄게.
// 0 이어도 보여줍니다 — 무엇을 더 모을 수 있는지가 보여야 하니까요.
function specialRow(key, value) {
  const info = SPECIAL_INFO[key];
  const v = num(value);
  const capped = v >= info.cap - 1e-9;
  return `<li class="${v > 0 ? '' : 'zero'} ${capped ? 'capped' : ''}" title="${info.desc}">
    <span class="stat-name">${info.name}</span>
    <span class="stat-value">${pctTxt(v)}<span class="stat-cap">${capped ? '상한' : `/ ${Math.round(info.cap * 100)}%`}</span></span>
  </li>`;
}

function statRow(name, value, bonus) {
  const bonusText = bonus > 0 ? `<span class="stat-bonus">+${fmt(bonus)}</span>` : '';
  const shown = typeof value === 'string' ? value : fmt(value);
  return `<li>
    <span class="stat-name">${name}</span>
    <span class="stat-value">${shown}${bonusText}</span>
  </li>`;
}

// ---------- 화신 ----------
// 얻은 화신이 있을 때만 「나」 창에 나옵니다. 한 번에 하나만 삼고, 언제든 바꿉니다 (싸우는 중에는 못 바꿈).
// 화신마다 무엇이 오르고(▲) 무엇이 깎이는지(▼) 그대로 보여줍니다 — 그걸 보고 고르는 게 이 칸의 재미입니다.
function avatarEffectHTML(foe) {
  const p = avatarProfile(foe);
  const name = k => (STAT_INFO.find(s => s.id === k) || SPECIAL_INFO[k] || { name: k }).name;
  const parts = [];
  for (const [k, v] of Object.entries(p.mul)) parts.push({ up: v > 1, t: `${name(k)} ×${v.toFixed(2)}` });
  for (const [k, v] of Object.entries(p.add)) parts.push({ up: v > 0, t: `${name(k)} ${v > 0 ? '+' : '−'}${pctTxt(Math.abs(v))}` });
  parts.sort((a, b) => b.up - a.up);
  return parts.map(x => `<span class="${x.up ? 'up' : 'down'}">${x.up ? '▲' : '▼'} ${x.t}</span>`).join('');
}
function renderAvatars() {
  const el = $('avatars');
  if (!el) return;
  const list = (State.meta.avatars || []).map(getEnemy).filter(Boolean);
  el.parentElement.hidden = !list.length;
  if (!list.length) { el.innerHTML = ''; return; }
  const cur = State.meta.avatar;
  el.innerHTML = `<div class="av-head">화신 <span class="count">${list.length}</span></div>` + list.map(f => `
    <div class="av-row ${f.id === cur ? 'on' : ''}">
      <div class="av-top">
        <span class="av-ic">${f.icon}</span>
        <span class="avatar-tag">${avatarTitle(f)}</span>
        ${AVATAR_POWERS[f.id] ? `<span class="av-power">${AVATAR_POWERS[f.id].name}</span>` : ''}
        ${f.id === cur
          ? '<button class="btn tiny" data-avatar="">벗는다</button>'
          : `<button class="btn tiny" data-avatar="${f.id}" ${battle ? 'disabled' : ''}>삼는다</button>`}
      </div>
      ${AVATAR_POWERS[f.id] ? `<div class="av-power-desc">${AVATAR_POWERS[f.id].desc}</div>` : ''}
      <div class="av-fx">${avatarEffectHTML(f)}</div>
    </div>`).join('');
  for (const b of el.querySelectorAll('[data-avatar]')) {
    b.addEventListener('click', () => {
      if (battle) return;
      setAvatar(b.dataset.avatar || null);
      Sound.play(b.dataset.avatar ? 'equip' : 'unequip');
      render();
    });
  }
}

// ---------- 여정 ----------
function renderJourney() {
  const run = State.run;
  const zone = ZONES[run.zoneIndex];
  const rank = RANKS.find(r => r.n === zone.rank);
  const boss = zoneBoss(run.zoneIndex);
  const hero = heroStats();

  // 폰에서는 탭을 옮기면 「나」 화면이 안 보이므로, 에너지는 여기에도 둡니다.
  const max = startEnergy();
  const low = run.energy <= 5;

  // 창 둘 — 지역 · 에너지 · 차림을 한 창에, 그 아래 무대. 창 사이로 맨 뒤의 지도가 보입니다.
  // (예전엔 지역과 에너지가 따로 창이었는데, 폰에서 무대가 한 화면에 안 들어와 합쳤습니다)
  // 지역 소개글(zone.flavor)은 data.js 에만 남겨두고 화면에는 안 씁니다 — 이름이면 충분합니다.
  let html = `
    <div class="frame zone-card ${low ? 'low' : ''}">
      <div class="zone-head">
        <span class="rank-chip r${rank.n}">제${rank.n}격 · ${rank.name}<span class="hanja">${rank.hanja}</span></span>
        <span class="zone-name">${zone.name}</span>
        <button class="zone-count" id="rosterBtn" title="이 지역에 있는 것">
          <span class="zc-k">도감</span>${run.zoneIndex + 1} / ${knownZoneCount()}
        </button>
      </div>
      <div class="journey-energy ${low ? 'low' : ''}">
        <span class="je-k">에너지</span>
        <span class="je-v">${run.energy}<span class="je-max">/${max}</span></span>
        <span class="je-lv"><span class="lv-k">Lv.</span><span id="jeLv">${fmtLevel(run.level)}</span></span>
      </div>
      <div class="je-xp"><div class="je-xp-fill" id="jeXpFill" style="width:${Math.min(100, run.xp / xpToNext(run.level) * 100)}%"></div></div>
      ${journeySets()}
    </div>
  `;

  // ----- 무대: 결과 · 조우 · 갈림길 중 하나 -----
  // 정예 · 보스 · 히든과 마주하거나 싸우는 동안은 무대 창의 테두리가 그 색이 됩니다
  const facing = facingFoe();
  html += `<div class="frame stage ${facing && facing.kind !== 'normal' ? `k-${facing.kind}` : ''}">`;
  // 결과 화면이 먼저입니다. 마지막 에너지로 잡은 전리품도 보고 나서 끝나야 하니까요.
  // (여정이 끝났어도 결과를 닫기 전까지는 종료 화면을 띄우지 않습니다 — renderOverlay 참고)
  if (battle && battle.r === run.lastResult) {
    html += battleCard(battle);
  } else if (run.lastResult) {
    html += resultCard(run.lastResult, run);
    resultSounds(run.lastResult, run);
    wallMoment(run.lastResult);
    levelMoment(run.lastResult);
  } else if (run.over) {
    html += `<p class="stage-msg">여정이 끝났다.</p>`;
  } else if (run.encounter) {
    html += encounterCard(getEnemy(run.encounter), run.onBoss, hero, run.aura);
  } else {
    html += crossroads(boss, hero, run);
  }
  html += `</div>`;

  $('journey').innerHTML = html;
  renderRoster();
  wireJourney();
  if (battle) { paintBattle(); return; }   // 전투가 끝나야 전리품이 튀어나오고 자동 넘기기가 돕니다
  revealDrops();
  scheduleAutoContinue();
}

// ---------- 이 지역에 있는 것 (도감) ----------
// 예전엔 여정 맨 아래에 길게 깔려 있어서, 누가 나오는지 보려면 스크롤을 한참
// 내려야 했습니다. 지역 이름 옆의 「1 / 11」 을 눌러 창으로 띄웁니다.
// 지금 지역만 볼 것인가, 열한 격 전부를 볼 것인가
let rosterAll = false;

function rosterRow(foe, hero, sims) {
  const chance = winChance(hero, foe, sims);
  const down = foe.once && isDowned(foe.id);
  const seen = isSeen(foe.id);
  return `
    <div class="roster-item ${foe.kind} ${down ? 'down' : ''} ${seen ? '' : 'unseen'}">
      <span class="r-icon">${seen ? foe.icon : '·'}</span>
      <span class="r-name">
        ${foe.kind !== 'normal' ? `<span class="grade-tag ${foe.kind}">${KINDS[foe.kind].name}</span>` : ''}
        ${seen ? foe.name : '???'}<span class="lv">Lv.${fmtLevel(foe.level)}</span>
      </span>
      ${rosterDrops(foe)}
      <span class="r-chance ${down ? '' : winFeelClass(chance)}">${down ? '꺾음' : winFeel(chance)}</span>
    </div>`;
}

function renderRoster() {
  const el = $('roster');
  if (!el) return;
  const run = State.run;
  const hero = heroStats();
  const title = $('rosterTitle');
  const sub = $('rosterSub');
  const btn = $('rosterAllBtn');
  if (btn) {
    btn.textContent = rosterAll ? '이 지역' : '전체 도감';
    btn.classList.toggle('on', rosterAll);
  }

  if (!rosterAll) {
    const zone = ZONES[run.zoneIndex];
    const rank = RANKS.find(r => r.n === zone.rank);
    if (title) title.textContent = zone.name;
    const col = rankCollection(rank.n);
    if (sub) sub.textContent = `제${rank.n}격 · ${rank.name} · 전리품 ${col.have}/${col.total}${col.have >= col.total ? ' · 완성' : ''}`;
    el.innerHTML = zoneRoster(run.zoneIndex).map(f => rosterRow(f, hero)).join('');
    return;
  }

  // 전체 — 격마다 묶어서 보여줍니다. 아는 지역까지만 (마왕 너머는 닿은 데까지만).
  // 승률 계산을 줄여 잡습니다(40판). 전부 제대로 돌리면 2만 판이 넘습니다.
  const zones = ZONES.slice(0, knownZoneCount());
  const known = ENEMIES.filter(f => f.zoneIndex < zones.length);
  const seenCount = known.filter(f => isSeen(f.id)).length;
  if (title) title.textContent = '전체 도감';
  if (sub) sub.textContent = `${seenCount}/${known.length} 마주침`;

  el.innerHTML = zones.map((zone, zi) => {
    const rank = RANKS.find(r => r.n === zone.rank);
    const list = zoneRoster(zi);
    const got = list.filter(f => isSeen(f.id)).length;
    const col = rankCollection(rank.n);
    const done = col.have >= col.total;
    return `
      <div class="roster-zone ${zi === run.zoneIndex ? 'here' : ''}">
        <span class="rank-chip r${rank.n}">제${rank.n}격 · ${rank.name}</span>
        <span class="rz-name">${zone.name}</span>
        <span class="rz-col ${done ? 'done' : ''}" title="이 격의 전리품을 다 모으면 핵심 스탯 +${Math.round(COLLECTION_BONUS * 100)}%">${done ? '완성' : `전리품 ${col.have}/${col.total}`}</span>
        <span class="rz-count">${got}/${list.length}</span>
      </div>
      ${list.map(f => rosterRow(f, hero, 40)).join('')}`;
  }).join('');
}

// 도감 줄에 끼워 넣는 전리품 칩.
// 이름은 뺐습니다 — 한 줄에 셋씩 들어가야 해서 자리가 없고,
// **뭘 아직 못 얻었는지**만 보면 되는 자리라 그림과 부위면 충분합니다.
function rosterDrops(foe) {
  const table = dropTable(foe.id);
  if (!table.length) return '<span class="r-drops"></span>';
  return `<span class="r-drops">${table.map(it => {
    const have = owns(it.id);
    return `<span class="rd ${have ? 'have' : 'miss'}" title="${SLOT_NAMES[it.slot]} · ${have ? it.name : '아직 못 얻음'}">
              <span class="rd-ic">${have ? it.fromIcon : '?'}</span>
              <span class="rd-k">${SLOT_NAMES[it.slot]}</span>
            </span>`;
  }).join('')}</span>`;
}

function openRosterModal() {
  renderRoster();
  const m = $('rosterModal');
  if (m) m.classList.remove('hidden');
}
function closeRosterModal() {
  const m = $('rosterModal');
  if (m) m.classList.add('hidden');
}
function isRosterModalOpen() {
  const m = $('rosterModal');
  return !!m && !m.classList.contains('hidden');
}

// ---------- 전리품 등장 ----------
// 0.45초 뒤부터 하나씩 튀어나옵니다.
// 결과 화면이 그려지는 순간 같이 떠 있으면 그냥 글자 한 줄인데,
// 한 박자 늦게 나오면 "떨어졌다" 가 됩니다. 그 한 박자를 위한 장치입니다.
// 예전엔 0.2초 · 0.14초 간격 · 0.34초 연출이라 무엇이 나왔는지 보기도 전에 끝났습니다.
// 연출 길이(DROP_ANIM)는 style.css 의 drop-pop · art-drop 과 맞춥니다.
const DROP_DELAY = 450;    // 첫 전리품까지
const DROP_STEP  = 450;    // 그다음부터 하나씩
const DROP_ANIM  = 1400;   // 하나가 다 튀어나오기까지 (빛살이 다 돌 때까지)

const dropsShown = new WeakMap();   // 결과 → 이미 튀어나온 전리품 수
let dropTimers = [];
function revealDrops() {
  for (const t of dropTimers) clearTimeout(t);
  dropTimers = [];
  const r = State.run && State.run.lastResult;
  // 마왕을 꺾은 결과면, 벽이 무너지는 연출이 걷힌 뒤에 튀어나옵니다 — 어둠 속에서 나와 버리면 못 보니까요
  const wait = r && r.enemy.id === WALL_BOSS && wallPending
    ? WALL_FX_DELAY + (calmMotion() ? 0 : WALL_FX_LEN - 300) : 0;
  const veiled = document.querySelectorAll('.res-drop.veiled');
  veiled.forEach((el, i) => {
    dropTimers.push(setTimeout(() => {
      el.classList.remove('veiled');
      el.classList.add('pop');
      if (r) dropsShown.set(r, Math.max(dropsShown.get(r) || 0, Number(el.dataset.drop) + 1));
      // 새 것은 반짝, 이미 가진 것(분해)은 짤랑
      Sound.play(el.classList.contains('is-new') ? 'drop' : 'stone');
    }, wait + DROP_DELAY + i * DROP_STEP));
  });
}

// ---------- 결과 자동 넘기기 ----------
// 시뮬에서 전투 2339번 중 패배는 71번(3%)뿐이었습니다. 나머지는 결과를 보고
// "계속한다" 만 누르고 지나갑니다. 그 반복을 덜어주되,
// **진 판은 절대 자동으로 넘기지 않습니다** — 그때는 멈춰서 봐야 하니까요.
let autoContinueTimer = null;
function scheduleAutoContinue() {
  if (autoContinueTimer) { clearTimeout(autoContinueTimer); autoContinueTimer = null; }
  const ms = State.meta.settings.autoContinue;
  const r = State.run && State.run.lastResult;
  if (!ms || !r || !r.win || State.run.over) return;

  // 전리품이 다 나온 뒤에 넘겨야 뭘 얻었는지 보입니다
  const shown = (r.drops && r.drops.length && State.meta.settings.dropFx)
    ? DROP_DELAY + (r.drops.length - 1) * DROP_STEP + DROP_ANIM
    : 0;
  autoContinueTimer = setTimeout(() => {
    autoContinueTimer = null;
    if (!State.run || !State.run.lastResult || !State.run.lastResult.win) return;
    dismissResult();
    render();
  }, ms + shown);
}

// ============================================================
//  전투 화면 — 싸우는 과정을 한 방씩 다시 틀어줍니다
// ============================================================
// 승패와 전리품은 「맞선다」를 누르는 순간 이미 정해져 있습니다 (engage).
// 여기서는 그 전투의 기록(lastResult.replay)을 보고 초상 · 체력 바 · 글로 다시 보여줄 뿐입니다.
// 초상은 지금은 이모지입니다 — 나중에 그림이 들어올 자리.
//
// 한 줄마다 화면 전체를 다시 그리지 않습니다 — 도감까지 다시 그리면 승률을 수백 번 다시 잽니다.
// 체력 바와 기록 줄만 바꿉니다.
// 건너뛰기는 없습니다 — 나중에 상대와 내 그림, 효과 연출이 들어올 자리라 끝까지 봅니다.
let battle = null;                       // { r: 그 결과, i: 지금까지 보여준 줄 수, step: 줄 간격(ms), timer }
const BATTLE_PACE = { 1: 90, 2: 260 };   // 빠르게 · 보통 — 한 줄에 몇 ms
const BATTLE_MAX_MS = 6000;              // 긴 전투도 이 안에 끝나게 줄 간격을 줄입니다
// 기록은 최근 여섯 줄만 — 위에 초상이 들어와서 줄였습니다. 폰은 한 화면에 들어오게 다섯 줄.
const battleLines = () => (window.innerWidth <= 860 ? 5 : 6);

// logFrom — engage 직전 기록의 마지막 번호. 그 뒤의 줄(이 전투가 남긴 것)은 전투가 끝날 때까지 숨깁니다.
function startBattle(r, logFrom) {
  stopBattle();
  const speed = State.meta.settings.battleSpeed;
  const log = r && r.replay && r.replay.log;
  if (!speed || !log || !log.length) return;
  const step = Math.max(30, Math.min(BATTLE_PACE[speed] || 260, BATTLE_MAX_MS / log.length));
  battle = { r, i: 0, step, logFrom: logFrom || 0, held: heldSpoils(r) };
  battle.timer = setTimeout(tickBattle, step);
}

// ---------- 전투가 끝나기 전엔 전리품을 보여주지 않습니다 ----------
// 승패와 전리품은 「맞선다」를 누르는 순간 이미 정해지고 저장됩니다. 그대로 그리면 싸움이 다 보이기도 전에
// 전리품 탭에 NEW · 새 물건 · 늘어난 강화석(▲강화)이 먼저 떠 버립니다.
// 그래서 전투를 보여주는 동안에는, 이 전투에서 얻은 것을 뺀 모습(held)으로 전리품 · 기록 쪽을 그립니다.
function heldSpoils(r) {
  const m = State.meta;
  const held = {
    owned: { ...m.owned },
    stones: { ...m.stones },
    fresh: Object.fromEntries(Object.entries(m.fresh).map(([k, v]) => [k, v.slice()])),
    gold: num(m.gold) - num(r && r.gold),
    avatars: (m.avatars || []).filter(id => !(r && id === r.avatarGained)),
    avatar: r && r.avatarGained && m.avatar === r.avatarGained ? null : m.avatar,
    run: r && r.pre ? { ...r.pre } : null
  };
  for (const d of (r && r.win && r.drops) || []) {
    if (d.isNew) {
      delete held.owned[d.item.id];
      const f = held.fresh[d.item.slot];
      if (f) held.fresh[d.item.slot] = f.filter(id => id !== d.item.id);
    } else if (d.stones) {
      held.stones[d.item.slot] = (held.stones[d.item.slot] || 0) - d.stones;
    }
  }
  return held;
}

// 전투 중이면 그 전투의 전리품을 잠깐 빼 둔 채로 fn 을 그립니다 (끝나면 바로 되돌립니다)
function withHeldSpoils(fn) {
  if (!battle || !battle.held) return fn();
  const m = State.meta, run = State.run, h = battle.held;
  const real = { owned: m.owned, stones: m.stones, fresh: m.fresh, gold: m.gold, avatars: m.avatars, avatar: m.avatar };
  const realRun = h.run ? Object.fromEntries(Object.keys(h.run).map(k => [k, run[k]])) : null;
  Object.assign(m, { owned: h.owned, stones: h.stones, fresh: h.fresh, gold: h.gold, avatars: h.avatars, avatar: h.avatar });
  if (h.run) Object.assign(run, h.run);
  try { return fn(); } finally {
    Object.assign(m, real);
    if (realRun) Object.assign(run, realRun);
  }
}

function stopBattle() {
  if (battle && battle.timer) clearTimeout(battle.timer);
  battle = null;
}

// 다 보여줬으면 결과 화면으로
function finishBattle() { stopBattle(); render(); }

function tickBattle() {
  if (!battle) return;
  const n = battle.r.replay.log.length;
  battle.i = Math.min(n, battle.i + 1);
  paintBattle();
  // 방금 보여준 줄의 연출과 소리. 마지막 줄 뒤에는 쓰러진 쪽이 바래고 승패를 알리는 소리
  const e = battle.r.replay.log[battle.i - 1];
  battleFx(e);
  const s = battleSound(e);
  if (s) Sound.play(s);
  if (battle.i >= n) {
    fxDown(battle.r.win ? $('btFoe') : $('btHero'));
    Sound.play(battle.r.win ? 'win' : 'lose', { delay: 0.15 });
    jingled.add(battle.r);
  }
  // 마지막 줄을 보여준 뒤 잠깐 멈췄다가 결과로
  battle.timer = setTimeout(battle.i >= n ? finishBattle : tickBattle, battle.i >= n ? 700 : battle.step);
}

// 기록 한 줄 → 효과음 이름
function battleSound(e) {
  if (!e) return null;
  if (e.who === 'hero') {
    switch (e.k) {
      case 'hit':     return e.harm ? 'harm' : e.crit ? 'crit' : 'hit';
      case 'reflect': return 'hit';
      case 'miss':    return 'miss';
      case 'regen':
      case 'steal':   return 'heal';
      case 'extra':
      case 'survive': return 'special';
      case 'power':   return e.p === 'zeus' || e.p === 'hades' ? 'harm' : 'special';
    }
  } else {
    switch (e.k) {
      case 'hit':   return e.crit ? 'foeCrit' : 'foeHit';
      case 'miss':  return 'miss';
      case 'block': return 'block';
    }
  }
  return null;
}

// 결과 화면이 처음 뜰 때 한 번. 전투 보기를 껐으면 승패 소리도 여기서 냅니다.
const jingled = new WeakSet();         // 전투 화면 끝에서 이미 승패 소리를 낸 결과
const soundedResults = new WeakSet();  // 결과 화면 소리를 이미 낸 결과
function resultSounds(r, run) {
  if (soundedResults.has(r)) return;
  soundedResults.add(r);
  if (!jingled.has(r)) Sound.play(r.win ? 'win' : 'lose');
  if (!r.win) return;
  if (r.levelsGained > 0) {
    const rankUp = rankOf(r.levelBefore).n !== rankOf(run.level).n;
    Sound.play(rankUp ? 'rankUp' : 'levelUp', { delay: (levelWait(r) + LEVEL_ANIM) / 1000 });   // 숫자가 다 올라간 때
  }
  // 마왕이면 길이 열리는 소리 대신 벽이 무너지는 소리 (연출과 같은 때 — wallMoment)
  if (r.openedPath) Sound.play(r.enemy.id === WALL_BOSS ? 'wallBreak' : 'pathOpen', { delay: r.enemy.id === WALL_BOSS ? WALL_FX_DELAY / 1000 : 0.9 });
  if (r.openedSpecial) Sound.play('unlock', { delay: 1.2 });
  if (r.avatarGained) Sound.play('rankUp', { delay: 0.5 });
}

// 기록 한 줄 → 글. 이름이 길어도 한 줄에 들어가게 짧게 씁니다.
// 보스 화신의 고유 능력이 터진 줄
function powerLine(e, foeName, v) {
  const n = (AVATAR_POWERS[e.p] || {}).name || '';
  switch (e.p) {
    case 'yisunsin': return `${n} — 물러설 곳이 없다`;
    case 'cheonma':  return `${n} —`;
    case 'imugi':    return `${n} — 용이 되었다`;
    case 'heracles': return `${n} — 다시 일어섰다 (${e.n}/12)`;
    case 'michael':  return `${n} — 큰 상대다`;
    case 'lucifer':  return `${n} — 지금이 가장 빛난다`;
    case 'hades':    return `${n} — ${foeName}${josa(foeName, '을', '를')} 데려갔다`;
    case 'zeus':     return `${n}! ${foeName}에게 ${v}`;
  }
  return n;
}
function battleLine(e, foeName) {
  const v = fmt(e.v);
  if (e.who === 'hero') {
    switch (e.k) {
      case 'hit': return { cls: e.harm ? 'b-harm' : e.crit ? 'b-crit' : 'b-hero',
        text: `${e.second ? '이중타격 — ' : ''}${e.harm ? '일격! ' : e.crit ? '치명타! ' : ''}${foeName}에게 ${v}` };
      case 'miss':    return { cls: 'b-miss', text: e.second ? '두 번째 공격이 빗나갔다' : '내 공격이 빗나갔다' };
      case 'regen':   return { cls: 'b-heal', text: `재생 — 생명 +${v}` };
      case 'steal':   return { cls: 'b-heal', text: `흡혈 — 생명 +${v}` };
      case 'reflect': return { cls: 'b-hero', text: `반사 — ${foeName}에게 ${v}` };
      case 'extra':   return { cls: 'b-special', text: '연속 턴 — 한 번 더 움직인다' };
      case 'survive': return { cls: 'b-special', text: '생존 — 생명 1을 남기고 버텼다' };
      case 'power':   return { cls: 'b-power', text: powerLine(e, foeName, v) };
    }
  } else {
    switch (e.k) {
      case 'hit':   return { cls: e.crit ? 'b-foecrit' : 'b-foe', text: `${e.crit ? '치명타! ' : ''}${foeName}의 공격 — ${v}` };
      case 'miss':  return { cls: 'b-miss', text: `${foeName}의 공격이 빗나갔다` };
      case 'block': return { cls: 'b-special', text: `${foeName}의 공격을 막았다` };
    }
  }
  return { cls: 'b-miss', text: '' };
}

function hpPct(hp, max) { return `${Math.max(0, Math.min(100, (hp / Math.max(1, max)) * 100))}%`; }

// 내 모습 — 지금은 이모지. 나중에 그림이 들어올 자리
const HERO_ICON = '🧍';

// 전투 카드 — 처음 그릴 때. 그다음부터는 paintBattle 이 바 · 숫자 · 줄만 바꿉니다.
// 위에서부터 상대 체력 · 상대 초상(크게) · 내 초상(작게) · 내 체력 · 기록.
function battleCard(b) {
  const { r } = b;
  const foe = r.enemy;
  return `
    <div class="battle k-${foe.kind}" id="battle">
      <div class="bt-side foe">
        <div class="bt-top"><span class="bt-name">${foe.kind !== 'normal' ? `<span class="grade-tag ${foe.kind}">${KINDS[foe.kind].name}</span>` : ''}${foe.name}<span class="lv">Lv.${fmtLevel(foe.level)}</span></span>
          <span class="bt-hp" id="btFoeHp"></span></div>
        <div class="bt-bar"><div class="bt-fill foe" id="btFoeFill"></div></div>
      </div>
      <div class="bt-arena" id="btArena">
        <div class="portrait bt-foe" id="btFoe"><span class="portrait-ic">${foe.icon}</span></div>
        <div class="portrait bt-hero" id="btHero"><span class="portrait-ic">${HERO_ICON}</span></div>
      </div>
      <div class="bt-side hero">
        <div class="bt-top"><span class="bt-name">${activeAvatar() ? `<span class="avatar-tag">${avatarTitle(activeAvatar())}</span>` : ''}나<span class="lv">Lv.${fmtLevel(r.levelBefore || State.run.level)}</span></span>
          <span class="bt-hp" id="btHeroHp"></span></div>
        <div class="bt-bar"><div class="bt-fill hero" id="btHeroFill"></div></div>
      </div>
      <div class="bt-log" id="btLog"></div>
    </div>`;
}

// ---------- 전투 연출 ----------
// 기록 한 줄마다 — 때리는 쪽이 앞으로 튀어나가고, 맞는 쪽이 하얗게 번쩍이며 흔들리고, 그 위로 숫자가 떠오릅니다.
// 치명타 · 일격은 숫자가 커지고, 일격과 아픈 치명타는 화면째 흔들립니다. 끝나면 쓰러진 쪽이 깜빡이며 바랩니다.
// 기기에서 「움직임 줄이기」를 켰으면 흔들림 · 튀어나감은 빼고 숫자만 띄웁니다.
const calmMotion = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const FX_SHAKE = [
  { transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' },
  { transform: 'translateX(-3px)' }, { transform: 'translateX(2px)' }, { transform: 'translateX(0)' }
];

function fxAnim(el, frames, ms, easing) {
  if (!el || !el.animate || calmMotion()) return;
  el.animate(frames, { duration: ms, easing: easing || 'ease-out' });
}

// 맞음 — 흔들리며 하얗게 번쩍
function fxHit(el, hard) {
  if (!el) return;
  fxAnim(el, FX_SHAKE, hard ? 320 : 240, 'steps(5, end)');
  fxAnim(el.querySelector('.portrait-ic'), [{ filter: 'brightness(2.4) saturate(0)' }, { filter: 'none' }], 220, 'steps(2, end)');
}

// 때림 — 상대 쪽으로 한 번 튀어나갔다 돌아옴 (dir: 위로 -1, 아래로 1)
function fxLunge(el, dir) {
  fxAnim(el, [{ transform: 'translateY(0)' }, { transform: `translateY(${dir * 14}px)` }, { transform: 'translateY(0)' }], 220);
}

// 초상 위로 떠오르는 숫자 · 글자.
// 내 초상은 작고 바로 위에 상대 그림이 있어서, 위로 띄우면 상대가 맞은 것처럼 보입니다 — 오른쪽 옆에 띄웁니다.
function fxFloat(el, text, cls) {
  if (!el) return;
  const side = el.classList.contains('bt-hero');
  const f = document.createElement('span');
  f.className = `bt-float ${side ? 'side' : ''} ${cls || ''}`;
  f.textContent = text;
  // 연달아 떠도 겹치지 않게 조금씩 비껴서
  if (side) f.style.top = `${8 + Math.random() * 34}%`;
  else f.style.left = `${50 + Math.random() * 24 - 12}%`;
  el.appendChild(f);
  if (!f.animate) { setTimeout(() => f.remove(), 800); return; }
  const x = side ? '0' : '-50%';
  const rise = side ? 18 : 38;
  f.animate([
    { transform: `translate(${x}, 0) scale(0.8)`, opacity: 0 },
    { transform: `translate(${x}, ${-rise * 0.26}px) scale(1.1)`, opacity: 1, offset: 0.2 },
    { transform: `translate(${x}, ${-rise * 0.74}px) scale(1)`, opacity: 1, offset: 0.7 },
    { transform: `translate(${x}, ${-rise}px) scale(1)`, opacity: 0 }
  ], { duration: 800, easing: 'ease-out' }).onfinish = () => f.remove();
}

// 두 초상 사이에 잠깐 뜨는 띠 — 연속 턴 · 생존 같은 특수 능력치
function fxBanner(text) {
  const arena = $('btArena');
  if (!arena) return;
  const b = document.createElement('span');
  b.className = 'bt-banner';
  b.textContent = text;
  arena.appendChild(b);
  if (!b.animate) { setTimeout(() => b.remove(), 900); return; }
  b.animate([
    { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 0 },
    { transform: 'translate(-50%, -50%) scale(1.05)', opacity: 1, offset: 0.2 },
    { transform: 'translate(-50%, -50%) scale(1)', opacity: 1, offset: 0.75 },
    { transform: 'translate(-50%, -50%) scale(1)', opacity: 0 }
  ], { duration: 900, easing: 'ease-out' }).onfinish = () => b.remove();
}

// 쓰러짐 — 깜빡이다 바랜 채로 남습니다
function fxDown(el) {
  if (!el) return;
  fxAnim(el, [{ opacity: 1 }, { opacity: 0.2 }, { opacity: 1 }, { opacity: 0.2 }, { opacity: 1 }, { opacity: 0.3 }], 600, 'steps(6, end)');
  el.classList.add('down');
}

// 그림 이펙트 길이 — 전투 빠르기에 맞춥니다 (빠르게면 짧게, 보통이면 0.4초 남짓)
function fxMs() { return Math.max(220, Math.min(480, ((battle && battle.step) || 260) * 1.6)); }

// 그림 이펙트 (fx.js) — 내 공격은 상대 초상 가운데, 상대 공격은 내 초상 위.
// 기기에서 「움직임 줄이기」를 켰으면 띄우지 않습니다.
// 그림 이펙트는 기기의 「움직임 줄이기」가 켜져 있어도 보여줍니다 — 맞고 때리는 걸 알아보는 핵심이라서요.
// (안드로이드의 「애니메이션 삭제」 · 절전 모드가 이걸 켜서 폰에서만 이펙트가 사라졌습니다.) 흔들림 · 튀어나감은 그대로 뺍니다.
function fxSprite(sheet, anim, el, scale) {
  if (typeof FX === 'undefined') return;
  FX.play(sheet, anim, el, { ms: fxMs(), scale });
}

// 기록 한 줄 → 연출
function battleFx(e) {
  if (!e) return;
  const foeEl = $('btFoe'), heroEl = $('btHero'), box = $('battle');
  const v = fmt(e.v);
  if (e.who === 'hero') {
    switch (e.k) {
      case 'hit':
        fxLunge(heroEl, -1);
        // 보통은 베기, 치명타는 초승달, 일격은 별빛 폭발, 이중타격의 두 번째는 세로 번개
        fxSprite('hero', e.harm ? 'star' : e.crit ? 'crescent' : e.second ? 'bolt' : 'slash', foeEl,
          e.harm ? 1.5 : e.crit ? 1.35 : 1.15);
        fxHit(foeEl, e.harm || e.crit);
        fxFloat(foeEl, e.harm ? `일격 ${v}` : e.crit ? `${v}!` : v, e.harm ? 'harm' : e.crit ? 'crit' : '');
        if (e.harm) fxAnim(box, FX_SHAKE, 360, 'steps(6, end)');
        break;
      case 'reflect':
        fxSprite('hero', 'ring', foeEl, 1.2);
        fxHit(foeEl, false); fxFloat(foeEl, `반사 ${v}`, 'reflect');
        break;
      case 'miss':    fxLunge(heroEl, -1); fxFloat(foeEl, '빗나감', 'miss'); break;
      case 'regen':
      case 'steal':   fxFloat(heroEl, `+${v}`, 'heal'); break;
      case 'extra':   fxBanner('연속 턴!'); break;
      case 'survive': fxHit(heroEl, false); fxBanner('버텼다!'); break;
      case 'power': {
        const n = (AVATAR_POWERS[e.p] || {}).name || '';
        if (e.p === 'zeus') {
          fxSprite('hero', 'bolt', foeEl, 1.5);
          fxHit(foeEl, true); fxFloat(foeEl, `벼락 ${v}`, 'harm');
          fxAnim(box, FX_SHAKE, 300, 'steps(5, end)');
        } else if (e.p === 'hades') {
          fxHit(foeEl, true); fxAnim(box, FX_SHAKE, 360, 'steps(6, end)');
        } else if (e.p === 'heracles') {
          fxFloat(heroEl, '다시', 'heal');
        }
        fxBanner(`${n}!`);
        break;
      }
    }
  } else {
    switch (e.k) {
      case 'hit':
        fxLunge(foeEl, 1);
        // 상대의 성격에 따라 할퀴기 · 타격 · 바위 · 흙먼지 · 반짝임 · 수정 가시 (fx.js 의 FOE_BY_ARCH)
        // 내 초상은 작아서 이펙트를 초상보다 크게 (폭의 2.4배, 치명타면 2.8배) 띄웁니다
        fxSprite('foe', typeof FX === 'undefined' ? '' : FX.foeAnimFor(battle && battle.r.enemy), heroEl, e.crit ? 2.8 : 2.4);
        fxHit(heroEl, e.crit);
        fxFloat(heroEl, e.crit ? `${v}!` : v, e.crit ? 'crit hurt' : 'hurt');
        if (e.crit) fxAnim(box, FX_SHAKE, 300, 'steps(5, end)');
        break;
      case 'miss':  fxLunge(foeEl, 1); fxFloat(heroEl, '빗나감', 'miss'); break;
      case 'block': fxLunge(foeEl, 1); fxFloat(heroEl, '막음', 'block'); break;
    }
  }
}

function paintBattle() {
  if (!battle) return;
  // 그 사이 결과를 닫았거나 다른 회차로 넘어갔으면 그만둡니다
  if (!State.run || State.run.lastResult !== battle.r) { stopBattle(); return; }
  if (!$('battle')) { renderJourney(); return; }     // 화면만 다시 그려졌으면 카드부터 다시
  const { r, i } = battle;
  const log = r.replay.log;
  const last = i > 0 ? log[i - 1] : null;
  const heroHp = last ? last.hp : r.replay.heroMax;
  const foeHp = last ? last.fhp : r.replay.foeMax;
  $('btFoeFill').style.width = hpPct(foeHp, r.replay.foeMax);
  $('btHeroFill').style.width = hpPct(heroHp, r.replay.heroMax);
  $('btFoeHp').textContent = `${fmt(Math.max(0, foeHp))} / ${fmt(r.replay.foeMax)}`;
  $('btHeroHp').textContent = `${fmt(Math.max(0, heroHp))} / ${fmt(r.replay.heroMax)}`;

  // 최근 몇 줄. 턴이 바뀌는 줄 앞에는 턴 번호를 붙입니다.
  const from = Math.max(0, i - battleLines());
  let html = '';
  for (let k = from; k < i; k++) {
    const e = log[k];
    const { cls, text } = battleLine(e, r.enemy.name);
    const newTurn = k === 0 || log[k - 1].t !== e.t;
    html += `<div class="bt-line ${cls} ${k === i - 1 ? 'fresh' : ''}">
      <span class="bt-turn">${newTurn ? `${e.t}턴` : ''}</span>${text}</div>`;
  }
  if (i >= log.length) {
    html += `<div class="bt-line ${r.win ? 'b-win' : 'b-lose'}"><span class="bt-turn"></span>${r.win
      ? `${r.enemy.name}${josa(r.enemy.name, '이', '가')} 쓰러졌다`
      : '쓰러졌다…'}</div>`;
  }
  $('btLog').innerHTML = html;
}

// ---------- 전투 결과 ----------
function resultCard(r, run) {
  const foe = r.enemy;
  const K = KINDS[foe.kind];

  // 경험치가 어디서 얼마나 불었는지
  const mults = [];
  if (r.gap > 1.01)   mults.push(`격차 ×${r.gap.toFixed(2)}`);
  if (r.auraXp > 1)   mults.push(`${r.aura.name} ×${r.auraXp}`);
  if (r.bossM > 1.01) mults.push(`삼킨 격 ×${r.bossM.toFixed(1)}`);

  const lines = [];
  if (r.win) {
    lines.push(row('경험치', `+${fmt(r.xp)}`, mults.length ? mults.join(' · ') : ''));
    if (r.gold) lines.push(row('골드', `+${fmt(r.gold)}`));
    lines.push(r.levelsGained > 0
      ? row('레벨', `Lv.${fmtLevel(r.levelBefore)} → Lv.${fmtLevel(run.level)}`, `+${fmtLevel(r.levelsGained)}`)
      : row('레벨', `Lv.${fmtLevel(run.level)}`));
    // 설명 글은 뺐습니다 — 값만 보고 알 수 있게 적습니다 (삼킨 격은 다음 회차부터 붙으니 「시작 에너지」)
    if (r.devoured > 0) lines.push(row('삼킨 격', `시작 에너지 +${r.devoured}`));
    if (r.refund > 0) lines.push(row('되찾은 에너지', `+${r.refund}`));
    if (r.openedSpecial) lines.push(row('특수장비 칸', `열렸다 ${r.openedSpecial}/${SPECIAL_SLOT_MAX}`));
  } else {
    lines.push(row('에너지', `−${r.penalty}`, `남은 ${run.energy}`));
  }

  // 전리품은 **결과가 뜬 다음에** 하나씩 튀어나옵니다.
  // 같이 떠버리면 그냥 글자 줄이지만, 한 박자 늦게 나오면 "뭔가 떨어졌다" 가 됩니다.
  // 늦추는 시간은 renderJourney 가 끝난 뒤 revealDrops() 가 붙여줍니다.
  // 이미 튀어나온 것은 결과 화면을 다시 그려도(분배 창을 열 때 등) 다시 튀지 않습니다.
  //
  // 글자만으로는 뭘 얻었는지 한눈에 안 들어와서 물건의 모습을 함께 둡니다 —
  // 전리품 탭과 같은 아이콘입니다 (지금은 이모지, 나중에 그림이 들어올 자리).
  // 조우 화면의 남은 전리품 칸처럼 가로로 늘어놓습니다 (한 줄에 셋까지) —
  // 한 줄에 하나씩 쌓으면 폰에서 셋째 것이 아래의 「계속한다」에 가려집니다.
  const fx = State.meta.settings.dropFx;
  const shown = dropsShown.get(r) || 0;
  const drops = r.win && r.drops.length
    ? `<div class="res-drops">
         <div class="res-sub">빼앗은 것 ${r.drops.length}</div>
         <div class="res-drop-list" style="grid-template-columns:repeat(${Math.min(3, r.drops.length)}, minmax(0, 1fr))">
         ${r.drops.map((d, i) => `
           <div class="res-drop ${fx && i >= shown ? 'veiled' : ''} ${d.isNew ? 'is-new' : 'is-stone'}" data-drop="${i}">
             <span class="res-art ${d.item.grade !== 'normal' ? `g-${d.item.grade}` : ''}"><span class="res-art-ic">${d.item.fromIcon}</span></span>
             <span class="res-body">
               <span class="res-name">${d.item.grade !== 'normal' ? `<span class="grade-tag ${d.item.grade}">${KINDS[d.item.grade].name}</span>` : ''}${d.item.name}</span>
               <span class="res-meta">
                 <span class="res-slot">${SLOT_NAMES[d.item.slot]}</span>
                 <span class="res-tag">${d.isNew ? '새로 얻음' : `분해 · 강화석 +${fmt(d.stones)}`}</span>
                 ${d.autoWorn ? '<span class="res-tag worn-now">바로 착용</span>' : ''}
               </span>
             </span>
           </div>`).join('')}
         </div>
       </div>`
    : '';

  return `
    <div class="result ${r.win ? 'win' : 'lose'}">
      <div class="res-head">${r.win ? '승리' : '패배'}</div>
      <div class="res-foe">
        <span class="res-icon">${foe.icon}</span>
        ${r.aura ? `<span class="aura-tag" style="--aura:${r.aura.color}">${r.aura.name}</span>` : ''}
        ${foe.kind !== 'normal' ? `<span class="grade-tag ${foe.kind}">${K.name}</span>` : ''}
        ${foe.name}<span class="lv">Lv.${fmtLevel(foe.level)}</span>
        <span class="res-turns">${r.turns}턴</span>
      </div>
      ${r.avatarGained ? `<div class="res-avatar"><span class="avatar-tag">${avatarTitle(foe)}</span>${josa(avatarTitle(foe), '이', '가')} 되었다</div>` : ''}
      ${r.openedPath ? `<div class="res-path">길이 열렸다</div>` : ''}
      ${r.openedPath && foe.id === WALL_BOSS
        ? `<div class="res-path exit ${wallMoments.has(r) ? '' : 'late'}">나가는 길도 열렸다.</div>` : ''}
      <div class="res-lines">${lines.join('')}</div>
      ${drops}
      <div class="res-actions">
        <button id="continueBtn" class="btn primary thumb">${run.over ? '여정을 마친다' : '계속한다'}${KEY_HINT}</button>
        ${gearJumpButton(r)}
        ${run.over ? '' : '<button id="toAllocBtn" class="btn">스탯을 다시 나눈다</button>'}
      </div>
    </div>`;
}

// 처음 보는 것을 얻었을 때만 나오는 버튼.
// 분해된 것은 이미 아는 물건이라 확인하러 갈 이유가 없으니 뺍니다
// (NEW! 표시를 켜는 기준과 같습니다 — rollDrops 의 isNew).
//
// 한 부위만 새로 얻었으면 그 부위 이름을 그대로 적어줍니다.
// 어디로 가는지 알고 누르는 편이, 눌러보고 아는 것보다 낫습니다.
function gearJumpButton(r) {
  if (!r.win || !r.drops) return '';
  const fresh = r.drops.filter(d => d.isNew);
  if (!fresh.length) return '';

  const slots = [...new Set(fresh.map(d => d.item.slot))];
  const label = slots.length === 1
    ? `새 ${SLOT_NAMES[slots[0]]} 보러 간다`
    : `새 전리품 ${fresh.length}개 보러 간다`;
  // 특수장비는 칸이 넷이라 열린 첫 칸으로 데려갑니다 (아직 하나도 안 열렸으면 첫 칸 — 닫힌 채로 보입니다)
  const go = slots[0] === 'special' ? (SPECIAL_SLOT_IDS.find(isSlotOpen) || SPECIAL_SLOT_IDS[0]) : slots[0];
  return `<button id="toGearBtn" class="btn" data-goslot="${go}">${label}</button>`;
}

function row(k, v, note) {
  return `<div class="res-row">
    <span class="res-k">${k}</span>
    <span class="res-v">${v}</span>
    <span class="res-note">${note || ''}</span>
  </div>`;
}

// 이 적에게서 뭘 더 빼앗을 게 남았는지.
// 승률 바로 아래에 가로로 늘어놓습니다 — 셋이면 3등분, 둘이면 2등분.
// 그림과 이름만 둡니다. 능력치는 어차피 전리품 탭에서 보니까요.
//
// "다 모았다" 를 알 수 있어야 **이 녀석을 또 잡을 이유가 있는지** 판단이 섭니다.
function dropStrip(foe) {
  const table = dropTable(foe.id);
  if (!table.length) return '';
  const left = table.filter(i => !owns(i.id)).length;
  // 글자로 설명하지 않습니다 — ???? 칸이 남아 있는지만 보면 됩니다.
  return `
    <div class="enc-drops ${left === 0 ? 'done' : ''}">
      <div class="ed-list" style="grid-template-columns:repeat(${table.length}, minmax(0, 1fr))">
        ${table.map(it => {
          const have = owns(it.id);
          return `
            <div class="ed-item ${have ? 'have' : 'miss'}">
              <span class="ed-ic">${have ? it.fromIcon : '?'}</span>
              <span class="ed-name">${have ? it.name : '????'}</span>
            </div>`;
        }).join('')}
      </div>
    </div>`;
}

// 마주한 적 카드 — 위에서부터 이름 · 레벨 · 느낌 한 줄, 초상(큰 그림), 남은 전리품, 맞선다 / 물러선다.
// 설명은 레벨과 「잡기 쉬울 것 같다」 같은 한 줄만 둡니다 — 스탯 · 경험치 · 전리품 확률 · 졌을 때의 에너지는 뺐습니다.
// 초상은 지금은 이모지입니다. 나중에 그림이 들어올 자리.
function encounterCard(foe, isBoss, hero, aura) {
  const chance = winChance(hero, foe);
  const style = aura ? `style="--aura:${aura.color}"` : '';

  return `
    ${aura ? `<div class="aura-banner" ${style}>✦ ${aura.name} 기운 — ${aura.desc} ✦</div>` : ''}
    <div class="encounter k-${foe.kind} ${aura ? 'auraed' : ''}" ${style}>
      <div class="enc-desc">
        <div class="enc-name">
          ${aura ? `<span class="aura-tag">${aura.name}</span>` : ''}${foe.kind !== 'normal' ? `<span class="grade-tag ${foe.kind}">${KINDS[foe.kind].name}</span>` : ''}${foe.name}<span class="lv">Lv.${fmtLevel(foe.level)}</span>
        </div>
        <div class="enc-chance chance-value ${winFeelClass(chance)}">${winFeel(chance)}</div>
      </div>
      <div class="portrait enc-portrait"><span class="portrait-ic">${foe.icon}</span></div>
      ${dropStrip(foe)}
    </div>
    <!-- 넓은 화면에서는 맞선다 위 · 물러선다 아래로 쌓고,
         폰에서는 화면 아래 붙박인 띠에 물러선다(왼쪽 작게) · 맞선다(오른쪽 크게)를 나란히 둡니다 -->
    <div class="enc-actions thumb-bar ${isBoss ? 'solo' : ''}">
      <button id="engageBtn" class="btn primary big"><span class="btn-line">맞선다${KEY_HINT}</span></button>
      ${isBoss ? '' : '<button id="retreatBtn" class="btn">물러선다</button>'}
    </div>`;
}

// 아무도 없을 때 — 떠날 것인가, 정해진 자리로 갈 것인가, 다음 지역으로 갈 것인가
function crossroads(boss, hero, run) {
  const max = startEnergy();
  const low = run.energy <= 5;
  const canMove = run.energy >= RULES.TRAVEL_COST;
  const nextZone = ZONES[run.zoneIndex + 1];

  // 정예·히든·보스 — 정해진 자리에 서 있고, 한 여정에 한 번뿐
  const posts = visiblePosts(run.zoneIndex).map(foe => {
    const down = isDowned(foe.id);
    const c = winChance(hero, foe);
    const left = dropTable(foe.id).filter(i => !owns(i.id)).length;
    const K = KINDS[foe.kind];
    const seen = isSeen(foe.id);
    // 설명 글은 뺐습니다. 남기는 건 아직 못 얻은 전리품의 수 하나 — 또 찾아갈지 정하는 데 쓰입니다.
    return `
      <div class="post ${foe.kind} ${down ? 'down' : ''} ${seen ? '' : 'unseen'}">
        <span class="post-icon">${seen ? foe.icon : '❓'}</span>
        <div class="post-body">
          <div class="post-name">
            <span class="grade-tag ${foe.kind}">${K.name}</span>${seen ? foe.name : '???'}<span class="lv">Lv.${fmtLevel(foe.level)}</span>
          </div>
          ${!down && seen && left > 0 ? `<div class="post-desc">못 얻은 것 ${left}</div>` : ''}
        </div>
        ${down
          ? `<span class="post-done">꺾음</span>`
          : `<span class="post-chance ${winFeelClass(c)}">${winFeel(c)}</span>
             <button class="btn post-btn ${foe.kind}" data-post="${foe.id}" ${canMove ? '' : 'disabled'}>향한다</button>`}
      </div>`;
  }).join('');

  // 떠돌이 상인 — 이 지역에 있으면 정해진 자리들 맨 위에. 싸우지 않고, 들르는 데 에너지도 들지 않습니다.
  const merchant = merchantHere() ? `
      <div class="post hidden merchant">
        <span class="post-icon">🎒</span>
        <div class="post-body">
          <div class="post-name"><span class="grade-tag hidden">${KINDS.hidden.name}</span>떠돌이 상인</div>
        </div>
        <button class="btn post-btn hidden" id="shopBtn">들른다</button>
      </div>` : '';

  return `
    <div class="crossroads">
      ${run.zoneCleared && nextZone ? `
        <button id="nextZoneBtn" class="btn next-btn">${nextZone.name}(으)로 넘어간다</button>` : ''}

      <button id="travelBtn" class="btn primary big thumb" ${canMove ? '' : 'disabled'}>
        <span class="btn-line">길을 떠난다${KEY_HINT}</span>
        <span class="travel-energy ${low ? 'low' : ''}">남은 에너지 <b>${run.energy}</b><em>/${max}</em><i>· 한 걸음 −${RULES.TRAVEL_COST}</i></span>
      </button>

      ${merchant}
      ${posts}
    </div>`;
}

// ---------- 승률은 숫자로 보여주지 않습니다 ----------
// 정확한 확률 대신 "느낌" 을 한 문장으로. 20% 구간마다 하나씩이고,
// 80% 위쪽만 둘로 나눴습니다 — 거의 이기는 싸움과 확실히 이기는 싸움은 갈려야 하니까요.
// 숫자가 보이면 계산을 하게 되고, 문장이 보이면 판단을 하게 됩니다.
// 속으로는 그대로 winChance 로 재고, 색(초록·노랑·빨강)도 그대로 갈립니다.
//   from — 이 값 이상이면 이 문장 (다음 줄의 from 미만까지)
//   cls  — 문장마다 다른 잉크 (빨강 → 주황 → 황토 → 올리브 → 초록 → 파랑). css 의 .feel-0 ~ .feel-5
const WIN_FEELS = [
  { from: 0.0, text: '불가능할 것 같다',     cls: 'feel-0' },   //  0~20%
  { from: 0.2, text: '이기기 힘들 것 같다',  cls: 'feel-1' },   // 20~40%
  // 40~80% 는 예전 문장(해볼 만하다 · 이길 수 있을 것 같다)이 확률에 비해 너무 쉬워 보여 한 칸씩 내렸습니다
  { from: 0.4, text: '쉽지 않을 것 같다',    cls: 'feel-2' },   // 40~60%
  { from: 0.6, text: '해볼 만하다',          cls: 'feel-3' },   // 60~80%
  { from: 0.8, text: '이길 수 있을 것 같다', cls: 'feel-4' },   // 80~90%
  { from: 0.9, text: '잡기 쉬울 것 같다',    cls: 'feel-5' }    // 90~100%
];

function winFeelOf(c) {
  const v = num(c);
  let feel = WIN_FEELS[0];
  for (const f of WIN_FEELS) if (v >= f.from) feel = f;
  return feel;
}
// 관리자 창에서 「정확한 승률」을 켜면 문장 뒤에 숫자가 붙습니다
function winFeel(c)      { return winFeelOf(c).text + (Admin.showOdds ? ` · ${Math.round(num(c) * 100)}%` : ''); }
function winFeelClass(c) { return winFeelOf(c).cls; }

// 여정 한복판에서 차림을 바꿉니다.
// 갈아입을 이유가 생기는 자리는 전리품 탭이 아니라 여기입니다 —
// 눈앞의 상대를 보고 정하는 일이라, 탭을 오가게 만들면 아무도 안 씁니다.
// 저장·덮어쓰기는 전리품 탭에 그대로 두고, 여기서는 입기만 합니다.
function journeySets() {
  if (fightLocked()) return '';     // 싸우는 동안은 세트 · 스탯 분배 버튼이 아예 없습니다
  return `
    <div class="journey-sets">
      ${Array.from({ length: SET_COUNT }, (_, n) => {
        const on = isSetActive(n);
        const filled = setFilled(n);
        // 이름만 — 입는 중인 것은 붉게. 한 줄에 넷(세트 셋 + 스탯 분배)이 폰에서도 들어가게
        return `<button class="js-set ${on ? 'on' : ''}" data-jset="${n}" ${on ? 'disabled' : ''}>
                  세트 ${n + 1}
                </button>`;
      }).join('')}
      <button class="js-set js-alloc ${State.run.unspent > 0 ? 'ready' : ''}" id="jAllocBtn">스탯 분배${State.run.unspent > 0 ? '<span class="alloc-pip on"></span>' : ''}</button>
    </div>`;
}

function wireJourney() {
  const on = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };
  for (const b of document.querySelectorAll('[data-jset]')) {
    b.addEventListener('click', () => { if (fightLocked()) return; switchSet(Number(b.dataset.jset)); Sound.play('equip'); render(); });
  }
  on('rosterBtn',    openRosterModal);
  on('jAllocBtn',    openAllocHere);   // 여정 화면 그대로 분배 창만 띄웁니다
  on('shopBtn',      () => { Sound.play('encounter'); openShop(); });
  const rab = $('rosterAllBtn');
  if (rab && !rab.dataset.wired) {
    rab.dataset.wired = '1';
    rab.addEventListener('click', () => {
      rosterAll = !rosterAll;
      renderRoster();
      const el = $('roster');
      if (el) el.scrollTop = 0;
    });
  }
  for (const b of document.querySelectorAll('[data-closeroster]')) {
    if (b.dataset.wired) continue;
    b.dataset.wired = '1';
    b.addEventListener('click', closeRosterModal);
  }
  on('travelBtn',    () => { travel();         soundEncounter();         render(); });
  on('nextZoneBtn',  () => { moveToNextZone(); Sound.play('zoneMove');   render(); });
  on('engageBtn',    () => {
    // 싸우기 직전의 레벨 · 경험치 · 에너지 — 전투를 보여주는 동안은 이 값으로 그리고, 끝나면 여기서부터 올라가는 모습을 보여줍니다
    const run = State.run;
    const pre = { level: run.level, xp: run.xp, unspent: run.unspent, spent: { ...run.spent }, energy: run.energy, kills: run.kills };
    const from = logSeq;
    const r = engage();
    if (r) r.pre = pre;
    startBattle(r, from);
    render();
  });   // 소리는 전투 화면이 한 줄씩 냅니다
  on('retreatBtn',   () => { retreat();        Sound.play('retreat');    render(); });
  on('continueBtn',  () => { dismissResult();  render(); });
  on('toAllocBtn',   () => { dismissResult();  render(); spotlightAlloc(); });
  on('toGearBtn',    () => {
    const slot = $('toGearBtn').dataset.goslot;
    dismissResult(); render(); spotlightGear(slot);
  });
  for (const btn of document.querySelectorAll('[data-post]')) {
    btn.addEventListener('click', () => { approachPost(btn.dataset.post); soundEncounter(); render(); });
  }
}

// 분배판을 바로 띄웁니다 — 결과 화면의 「스탯을 다시 나눈다」가 부릅니다.
function spotlightAlloc() {
  openAllocModal();
  const el = $('alloc');
  if (!el) return;
  el.classList.remove('spotlight');
  void el.offsetWidth;            // 애니메이션 재시작용
  el.classList.add('spotlight');
}

// 방금 얻은 전리품이 있는 부위의 창을 바로 열어줍니다.
// clearFresh 는 창을 닫을 때 일어나므로, 열린 목록에는 NEW! 가 그대로 붙어 있습니다.
function spotlightGear(slot) {
  showTab('gear');
  openSlotModal(slot || selectedSlot);
  const inv = $('inventory');
  if (!inv) return;
  inv.classList.remove('spotlight');
  void inv.offsetWidth;
  inv.classList.add('spotlight');
}

// ============================================================
//  단축키 — 스페이스 하나로 루프를 돌립니다
// ============================================================
// 「길을 떠난다 → 맞선다 → 계속한다」가 수십 번 반복되는 게임이라,
// 마우스로 매번 다른 자리를 찾아 누르는 건 손이 아픕니다.
// 그래서 **지금 화면에서 해야 할 주 행동**을 스페이스 하나에 몰았습니다.
//
// 「물러선다」와 정예·보스로 향하는 버튼에는 일부러 안 걸었습니다.
// 그건 고민해서 눌러야 하는 것들이라, 연타로 잘못 누르면 안 되니까요.
// 싸우는 동안에는 걸리는 버튼이 없어 스페이스가 아무 일도 하지 않습니다 (건너뛰기 없음).
const PRIMARY_ORDER = ['tutNext', 'continueBtn', 'engageBtn', 'newRunBtn', 'travelBtn'];

function primaryButton() {
  if (!$('title').classList.contains('hidden')) return null;   // 초기화면에서는 안 씁니다
  for (const id of PRIMARY_ORDER) {
    const el = $(id);
    if (!el || el.disabled) continue;
    // 지금 화면에 없는 버튼은 건너뜁니다. offsetParent 로 재면 좁은 화면에서 아래에 붙박인
    // (position: fixed) 버튼까지 없는 걸로 쳐서 스페이스가 안 먹혔습니다.
    if (!el.getClientRects().length) continue;
    return el;
  }
  return null;
}

function wireKeys() {
  document.addEventListener('keydown', ev => {
    if (ev.repeat) return;                                     // 꾹 눌러 연타는 막습니다

    // 창이 떠 있으면 Esc 로 닫고, 스페이스는 먹히지 않게 합니다 —
    // 장비를 고르거나 포인트를 찍는 중에 길을 떠나버리면 곤란하니까요.
    if (isAnyModalOpen()) {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        if (isSaveModalOpen()) closeSaveModal();
        else if (isAdminOpen()) closeAdmin();
        else if (isSwapModalOpen()) closeSwapModal();    // 교환 창은 강화 창 위에도 뜹니다
        else if (isEnhModalOpen()) closeEnhModal();      // 강화 창이 부위 창 위에 있으니 먼저
        else if (isShopOpen()) closeShop();
        else if (isSlotModalOpen()) closeSlotModal();
        else if (isRosterModalOpen()) closeRosterModal();
        else closeAllocModal();
      } else if (ev.code === 'Space') {
        // 세이브 코드 칸처럼 글을 쓰는 곳에서는 막지 않습니다
        const t = ev.target;
        if (!(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA'))) ev.preventDefault();
      }
      return;
    }

    if (ev.code !== 'Space' && ev.key !== 'Enter') return;
    const t = ev.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

    const btn = primaryButton();
    if (!btn) return;
    ev.preventDefault();          // 스페이스로 화면이 내려가는 것도 같이 막습니다
    btn.click();
  });
}

const KEY_HINT = '<kbd>Space</kbd>';

// ---------- 하단 탭 (좁은 화면 전용) ----------
// 넓은 화면에서는 탭 바가 숨겨져 있고 세 패널이 한꺼번에 보이므로,
// data-tab 을 바꿔도 아무 일도 일어나지 않습니다.
function showTab(name) {
  // 탭을 옮기면 열려 있던 부위 창은 닫습니다 (NEW! 도 그때 꺼집니다)
  if (name !== 'gear' && isSlotModalOpen()) closeSlotModal();
  document.body.dataset.tab = name;
  for (const b of document.querySelectorAll('#mobileTabs button')) {
    b.classList.toggle('on', b.dataset.tab === name);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 다른 탭에 있어도 새 전리품이 생긴 걸 알 수 있게 점을 찍습니다
function renderTabBadges() {
  const gear = document.querySelector('#mobileTabs [data-tab="gear"]');
  if (gear) gear.classList.toggle('has-new', totalFresh() > 0);
}

function wireTabs() {
  for (const b of document.querySelectorAll('#mobileTabs button')) {
    b.addEventListener('click', () => showTab(b.dataset.tab));
  }
  showTab('journey');
}

// ---------- 전리품 ----------
// 부위를 누르면 그 부위의 전리품 도감이 아래에 펼쳐집니다.
// 아직 못 얻은 것은 ???? 로만 보입니다 — 어느 격의 것인지만 알 수 있게.
let selectedSlot = 'weapon';
let showLocked = false;      // 못 얻은 ???? 를 펼쳐 볼 것인가

// ---------- 장비 세트 ----------
// 세 벌을 각각 입혀두고 갈아입습니다. 저장·덮어쓰기 버튼은 없습니다 —
// 카드를 누르면 그 세트로 갈아입고, 지금 입은 세트를 고치면 그 세트가 곧 그렇게 됩니다.
function renderSets() {
  $('gearSets').innerHTML = Array.from({ length: SET_COUNT }, (_, n) => {
    const filled = setFilled(n);
    const on = isSetActive(n);
    return `
      <button class="gset ${on ? 'on' : ''}" data-setpick="${n}" ${on ? 'disabled' : ''}>
        <span class="gset-n">세트 ${n + 1}</span>
        <span class="gset-info">${on ? '입는 중' : (filled ? `${filled}부위` : '비어 있음')}</span>
      </button>`;
  }).join('');

  for (const b of document.querySelectorAll('[data-setpick]')) {
    b.addEventListener('click', () => { if (fightLocked()) return; switchSet(Number(b.dataset.setpick)); Sound.play('equip'); render(); });
  }
}

// ---------- 사람 위의 열두 칸 ----------
// 예전엔 2열 격자로 그냥 나열했습니다. 어디가 어느 부위인지는 글자를 읽어야 알았고,
// 열두 줄이 똑같이 생겨서 훑기 어려웠습니다.
//
// 지금은 실루엣 위에 **그 부위의 자리**에 칸을 얹습니다. 칸은 반투명이라
// 몸을 가리지 않고, 위치 자체가 "여기가 투구 자리"라고 말해줍니다.
//
// 기둥마다 넉 장씩 나눠 담았습니다. 가운데에 다섯 장을 쌓으면 그것만으로
// 430px 이 되어 아래 목록이 한참 밀립니다. 각반을 오른쪽으로 보내 4·4·4 로
// 맞추니 173px 이 줄었습니다.
// 왼쪽 4 · 가운데 5 · 오른쪽 4.
// 견갑이 들어오면서 목걸이가 가운데 기둥의 갑옷 위로 올라갔습니다 —
// 목이 가슴 위라 해부학적으로도 이쪽이 맞고, 비어 있던 어깨 자리를 견갑이 받습니다.
//
//   왼쪽        가운데        오른쪽
//   망토        투구          견갑
//   팔찌        목걸이        반지
//   장갑        갑옷          허리띠
//   무기        각반          보조무기
//               신발
//
// 각반이 가운데로 온 건 정강이가 몸의 한가운데 선 위에 있어서입니다 —
// 갑옷과 신발 사이에 놓이니 다리가 이어져 보입니다.
// 허리띠는 갑옷과 나란히 놓여 허리 높이에 맞고,
// 무기와 보조무기는 같은 줄에서 좌우로 마주 봅니다 — 양손이니까요.
const DOLL_MID   = ['helm', 'necklace', 'armor', 'greaves', 'boots'];
const DOLL_LEFT  = ['cloak', 'bracelet', 'gloves', 'weapon'];
const DOLL_RIGHT = ['shoulder', 'ring', 'belt', 'offhand'];

const DOLL_CELL = 86;   // 칸 높이 (아이콘 46 + 두 줄 + 여백)
const DOLL_GAP  = 10;
const DOLL_W    = 31;   // 칸 폭 %. 가운데 칸과 옆 칸이 맞닿지 않는 한계가 32% 입니다
                        // (옆 칸 오른끝 2+w, 가운데 칸 왼끝 50−w/2).

function dollCell(slotId, style) {
  if (enhMode) return dollEnhCell(slotId, style);
  const s = SLOTS.find(x => x.id === slotId);
  const id = State.meta.equipped[slotId];
  const item = id ? getItem(id) : null;
  const nf = freshCount(slotId);
  // 강화 단계는 부위 이름 옆에.
  // 강화석이 모여 지금 올릴 수 있으면 칸 왼쪽 위에 초록 딱지가 붙습니다 (오른쪽 위는 NEW 자리).
  // 예전엔 이름 옆의 작은 ▲ 하나라 있는지도 몰랐습니다.
  const lv = enhanceLevel(slotId);
  const ready = canEnhance(slotId);
  const enh = lv > 0 ? `<span class="enh-lv">+${lv}</span>` : '';
  return `
    <button class="doll-slot ${selectedSlot === slotId ? 'sel' : ''} ${item ? 'worn' : 'empty'} ${ready ? 'can-enh' : ''}"
            data-slot="${slotId}" style="${style}" title="${s.name}${ready ? ' · 강화할 수 있다' : ''}">
      ${ready ? '<span class="enh-ready">▲강화</span>' : ''}
      ${nf ? `<span class="new-dot">${nf}</span>` : ''}
      <span class="doll-ic">${item ? item.fromIcon : ''}</span>
      <span class="doll-txt">
        <span class="doll-k">${s.name}${enh}</span>
        <span class="doll-item">${item ? item.name : '비어 있음'}</span>
      </span>
    </button>`;
}

// ---------- 슬롯 강화 ----------
// 사람 그림 오른쪽 위 「슬롯 강화」를 누르면 그림은 그대로, 칸들이 강화 버튼으로 바뀝니다 —
// 칸을 누를 때마다 그 부위를 한 번 강화합니다. 부위 창 · 강화 창을 오가지 않고 열두 칸을 한 화면에서.
// 이때만 왼쪽 위에 「강화석 교환」이 생깁니다 (교환은 전부 그 창 하나에서 — renderSwap).
let enhMode = false;
let dollFx = null;      // 방금 누른 칸의 결과 — 한 번 그리고 지웁니다 (다시 그릴 때마다 번쩍이지 않게)

function dollEnhCell(slotId, style) {
  const s = SLOTS.find(x => x.id === slotId);
  const item = getItem(State.meta.equipped[slotId]);
  const lv = enhanceLevel(slotId);
  const nx = nextEnhance(slotId);
  const st = stonesOf(slotId);
  const ready = canEnhance(slotId);
  const fx = dollFx && dollFx.slot === slotId ? dollFx : null;
  const sub = nx ? `${fmt(st)}/${fmt(nx.cost)} · ${Math.round(enhanceChance(slotId) * 100)}%` : '끝까지 올랐다';
  return `
    <button class="doll-slot enh-cell ${item ? 'worn' : 'empty'} ${ready ? 'ready' : ''} ${nx ? '' : 'maxed'} ${fx ? (fx.success ? 'fx-ok' : 'fx-fail') : ''}"
            data-enhslot="${slotId}" style="${style}" ${ready ? '' : 'disabled'}>
      ${fx ? `<span class="enh-float">${fx.success ? `성공 +${fx.level}` : '실패'}</span>` : ''}
      <span class="doll-ic">${item ? item.fromIcon : ''}</span>
      <span class="doll-txt">
        <span class="doll-k">${s.name} <b>+${lv}</b>${nx ? `<em>▶</em>+${lv + 1}` : ''}</span>
        <span class="doll-item">${sub}</span>
      </span>
    </button>`;
}

function renderDoll() {
  const top = i => 6 + i * (DOLL_CELL + DOLL_GAP);
  // 옆 기둥은 반 칸 내려 어긋나게 둡니다 — 몸이 덜 가려집니다
  const sideTop = i => 6 + Math.round((DOLL_CELL + DOLL_GAP) * 0.55) + i * (DOLL_CELL + DOLL_GAP);
  const h = Math.max(top(DOLL_MID.length - 1),
                     sideTop(Math.max(DOLL_LEFT.length, DOLL_RIGHT.length) - 1)) + DOLL_CELL + 8;
  const C = 'left:50%;transform:translateX(-50%)';

  let html = `<div class="doll-body">${dollSilhouette()}</div>`;
  DOLL_MID.forEach((id, i)   => html += dollCell(id, `${C};top:${top(i)}px;width:${DOLL_W}%`));
  DOLL_LEFT.forEach((id, i)  => html += dollCell(id, `left:2%;top:${sideTop(i)}px;width:${DOLL_W}%`));
  DOLL_RIGHT.forEach((id, i) => html += dollCell(id, `right:2%;top:${sideTop(i)}px;width:${DOLL_W}%`));

  // 옆 기둥이 반 칸 내려앉아 생긴 위쪽 빈자리 — 오른쪽은 「슬롯 강화」, 슬롯 강화 중이면 왼쪽에 「강화석 교환」
  const btnH = sideTop(0) - 6 - DOLL_GAP;
  const anyReady = SLOT_IDS.some(canEnhance);
  html += `<button class="doll-mode ${enhMode ? 'on' : ''} ${!enhMode && anyReady ? 'ready' : ''}" id="dollModeBtn"
             style="right:2%;top:6px;width:${DOLL_W}%;height:${btnH}px">${enhMode ? '강화 끝' : `${anyReady ? '▲' : ''}슬롯 강화`}</button>`;
  if (enhMode) {
    html += `<button class="doll-mode swap" id="dollSwapBtn"
               style="left:2%;top:6px;width:${DOLL_W}%;height:${btnH}px">강화석 교환</button>`;
  }

  const el = $('equipSlots');
  el.style.height = h + 'px';
  el.classList.toggle('enh-mode', enhMode);
  el.innerHTML = html;
  dollFx = null;
}

// 선으로만 그린 사람. 칸 뒤에 깔려 배경 노릇을 합니다.
function dollSilhouette() {
  return `<svg viewBox="0 0 100 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <g class="fig-fill">
      <ellipse cx="50" cy="24" rx="13.5" ry="15"/>
      <path d="M34 50 Q50 43 66 50 L72 108 L28 108 Z"/>
      <path d="M32 52 L19 96 L15 124 L23 126 L27 98 L37 60 Z"/>
      <path d="M68 52 L81 96 L85 124 L77 126 L73 98 L63 60 Z"/>
      <path d="M30 108 L34 152 L31 186 L43 186 L45 152 L50 120 L55 152 L57 186 L69 186 L66 152 L70 108 Z"/>
    </g>
    <g class="fig">
      <circle cx="50" cy="24" r="14"/>
      <path d="M50 38 L50 50"/>
      <path d="M34 50 Q50 43 66 50"/>
      <path d="M34 50 L28 108 L72 108 L66 50"/>
      <path d="M32 52 L19 96 L15 124"/>
      <path d="M68 52 L81 96 L85 124"/>
      <circle cx="14" cy="132" r="8"/>
      <circle cx="86" cy="132" r="8"/>
      <path d="M34 108 L31 152 L30 186"/>
      <path d="M66 108 L69 152 L70 186"/>
      <path d="M50 108 L50 120"/>
      <path d="M24 190 L38 190 M62 190 L76 190"/>
      <path d="M30 186 Q24 189 24 190"/>
      <path d="M70 186 Q76 189 76 190"/>
    </g>
  </svg>`;
}

// ---------- 특수장비 칸 ----------
// 사람 그림 아래에 네 칸을 한 줄로 둡니다. 닫힌 칸은 자물쇠만 보이고,
// 어디서 여는지는 알려주지 않습니다 — 숨어 있는 것을 찾아내는 것까지가 재미니까요.
// (그 지역 보스를 꺾으면 로그에 "숨어 있던 것이 눈을 떴다" 가 뜹니다.)
function renderSpecialSlots() {
  const open = specialOpenCount();
  const nf = freshCount('special');
  $('specialSlots').innerHTML = `
    <div class="sp-head">특수장비 <span class="count">${open}/${SPECIAL_SLOT_MAX}</span></div>
    <div class="sp-row">${SPECIAL_SLOT_IDS.map((id, i) => {
      if (i >= open) {
        return `<div class="sp-slot locked" title="숨어 있는 것을 꺾으면 열린다">
                  <span class="sp-ic">🔒</span><span class="sp-k">${SLOT_NAMES[id]}</span>
                  <span class="sp-item">닫혀 있음</span></div>`;
      }
      const item = getItem(State.meta.equipped[id]);
      return `<button class="sp-slot ${selectedSlot === id ? 'sel' : ''} ${item ? 'worn' : 'empty'}" data-slot="${id}">
                ${i === 0 && nf ? `<span class="new-dot">${nf}</span>` : ''}
                <span class="sp-ic">${item ? item.fromIcon : ''}</span>
                <span class="sp-k">${SLOT_NAMES[id]}</span>
                <span class="sp-item">${item ? item.name : '비어 있음'}</span>
              </button>`;
    }).join('')}</div>`;
}

// ---------- 세트 효과 ----------
// 사람 그림 아래, 특수장비 줄 밑. 두 부위 이상 낀 성격만 보여줍니다 —
// 하나뿐인 건 세트라고 하기 어렵고, 다 보여주면 열 줄이 넘습니다.
// 해당하는 게 없으면 칸째로 비웁니다 (설명 글을 두지 않습니다).
function renderSetBonus() {
  const el = $('setBonus');
  if (!el) return;
  const counts = Object.entries(setCounts()).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]);
  if (!counts.length) { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="sb-head">세트 효과</div>` + counts.map(([arch, n]) => {
    const a = ARCHETYPES[arch];
    const bonus = SET_BONUS[arch] || {};
    const step = setStep(n);
    const next = SET_STEPS[step];
    const text = Object.entries(bonus).map(([k, vals]) => {
      const now = step ? `${SPECIAL_INFO[k].name} +${pctTxt(vals[step - 1])}` : `${SPECIAL_INFO[k].name} 없음`;
      return next ? `${now} <em>· ${next}부위면 +${pctTxt(vals[step])}</em>` : now;
    }).join(' ');
    return `<div class="sb-row ${step ? 'on' : ''}">
      <span class="arch-tag" style="--arch:${a.color}">${a.name}</span>
      <span class="sb-n">${n}부위</span>
      <span class="sb-text">${text}</span>
    </div>`;
  }).join('');
}

// 특수장비 칸을 열었을 때 맨 위 — 강화 대신 열린 칸 수와 특수장비 강화석
function specialPanel(slot) {
  const open = isSlotOpen(slot);
  return `<div class="enh-panel sp-panel ${open ? '' : 'locked'}">
    <div class="enh-head"><span class="enh-title">${SLOT_NAMES[slot]}${open ? '' : ' · 닫혀 있음'}</span>
      <span class="enh-now">${specialOpenCount()}/${SPECIAL_SLOT_MAX} 열림</span></div>
    <div class="enh-info"><span>특수장비 강화석 <b>${fmt(stonesOf('special'))}</b></span></div>
  </div>`;
}

function renderGear() {
  renderSets();
  renderDoll();
  renderSpecialSlots();
  renderSetBonus();

  // 고른 부위에 끼운 것 — 여기만 능력치를 전부 펼칩니다.
  // 강화는 따로 창을 띄웁니다 (부위 창 위의 「강화」 버튼 — renderEnhance).
  const special = isSpecialSlot(selectedSlot);
  const wornId = State.meta.equipped[selectedSlot];
  const wornItem = wornId ? getItem(wornId) : null;
  renderEnhance(special, wornItem);
  $('equipDetail').innerHTML = (special ? specialPanel(selectedSlot) : '') + (wornItem
    ? `<div class="worn-card">
         <span class="worn-icon">${wornItem.fromIcon}</span>
         <div class="worn-body">
           <div class="worn-name">${itemTag(wornItem)}${wornItem.name}</div>
           <div class="worn-stats">${itemStatText(wornItem) || '—'}</div>
           ${itemSpecialText(wornItem) ? `<div class="inv-spec">${itemSpecialText(wornItem)}</div>` : ''}
           ${wornItem.note ? `<div class="inv-note">${wornItem.note}</div>` : ''}
         </div>
         ${fightLocked() ? '' : `<button class="btn" data-unequip="${selectedSlot}">해제</button>`}
       </div>`
    : `<p class="hint worn-empty">비어 있음</p>`);

  // 아래쪽: 고른 부위의 도감
  $('collectionTitle').textContent = SLOT_NAMES[selectedSlot];
  $('ownedCount').textContent = `${ownedIds().length}/${knownItems().length}`;

  // 목록이 길어지면 새로 얻은 게 저 밑에 묻힙니다.
  // NEW → 착용중 → 나머지는 높은 격부터. 못 얻은 ???? 는 맨 아래로 접어둡니다.
  // 특수장비 칸 넷은 같은 목록(특수장비 전부)을 봅니다.
  const fk = freshKey(selectedSlot);
  // 못 얻은 것 목록도 아는 격까지만 — 마왕 너머의 전리품은 몇 개인지조차 보이지 않습니다
  const all = itemsInSlot(special ? 'special' : selectedSlot).filter(i => owns(i.id) || (knownRank(i.rank.n) && !i.ware));
  const have = all.filter(i => owns(i.id));
  const lockedCount = all.length - have.length;

  have.sort((a, b) => {
    const fa = isFresh(a.id, fk) ? 1 : 0, fb = isFresh(b.id, fk) ? 1 : 0;
    if (fa !== fb) return fb - fa;                                   // 새 것 먼저
    const ea = equippedSlotOf(a.id) ? 1 : 0;
    const eb = equippedSlotOf(b.id) ? 1 : 0;
    if (ea !== eb) return eb - ea;                                   // 착용중 다음
    return b.level - a.level;                                        // 그다음 높은 격부터
  });
  const canWear = isSlotOpen(selectedSlot) && !fightLocked();

  const lockedBlock = lockedCount
    ? `<button class="btn tiny locked-toggle span2" id="lockedToggle">
         아직 못 얻은 것 ${lockedCount}종 ${showLocked ? '숨기기' : '보기'}
       </button>` + (showLocked ? all.filter(i => !owns(i.id)).map(item => `
        <div class="inv-item locked">
          <span class="inv-art">?</span>
          <div class="inv-body">
            <div class="inv-head">
              <span class="rank-dot r${item.rank.n}" title="제${item.rank.n}격 · ${item.rank.name}"></span>
              ${item.grade !== 'normal' ? `<span class="grade-tag ${item.grade}">${KINDS[item.grade].name}</span>` : ''}
              <span class="inv-name">????</span>
            </div>
            <div class="inv-stats">제${item.rank.n}격 · ${item.rank.name}</div>
          </div>
        </div>`).join('') : '')
    : '';

  // 지금 이 칸에 낀 것과 견줍니다 (비어 있으면 전부 오르는 쪽)
  const slotM = slotMult(special ? 'special' : selectedSlot);
  $('inventory').innerHTML = (have.length ? have.map(item => {
    const at = equippedSlotOf(item.id);
    const on = at === selectedSlot;
    const spec = itemSpecialText(item);
    const fresh = isFresh(item.id, fk);
    const diff = on ? '' : itemDiffText(item, wornItem, slotM);
    // 버튼은 없습니다 — 칸을 누르면 끼우고, 낀 것은 테두리로만 보입니다.
    // 특수장비는 다른 특수장비 칸에 끼워져 있을 수 있습니다 — 누르면 이리로 옮깁니다 (작은 글로 어디 끼웠는지만)
    const wearable = canWear && !on;
    const where = at && !on ? `<div class="inv-where">${SLOT_NAMES[at]}에 끼움</div>` : '';
    return `
      <div class="inv-item ${on ? 'on' : ''} ${fresh ? 'fresh' : ''} ${wearable ? 'pick' : ''}" ${wearable ? `data-equip="${item.id}"` : ''}>
        <span class="inv-art">${item.fromIcon}</span>
        <div class="inv-body">
          <div class="inv-head">
            ${fresh ? '<span class="new-badge">NEW</span>' : ''}${itemTag(item)}${item.grade !== 'normal' ? `<span class="grade-tag ${item.grade}">${KINDS[item.grade].name}</span>` : ''}
            <span class="inv-name">${item.name}</span>
          </div>
          <div class="inv-stats">${itemStatText(item) || '—'}${spec ? ` <span class="inv-spec">${spec}</span>` : ''}</div>
          ${diff ? `<div class="inv-diff">${diff}</div>` : ''}
          ${item.note ? `<div class="inv-note">${item.note}</div>` : ''}
          ${where}
        </div>
      </div>`;
  }).join('') : `<p class="hint span2">얻은 것이 없다</p>`) + lockedBlock;

  const lt = $('lockedToggle');
  if (lt) lt.addEventListener('click', () => { showLocked = !showLocked; render(); });

  for (const el of document.querySelectorAll('[data-slot]')) {
    el.addEventListener('click', () => openSlotModal(el.dataset.slot));
  }
  // 칸을 누르면 끼웁니다. 창은 열어 둡니다 — 테두리가 옮겨 가는 걸로 무엇을 꼈는지 보입니다.
  for (const row of document.querySelectorAll('#inventory [data-equip]')) {
    row.addEventListener('click', () => { if (fightLocked()) return; equip(row.dataset.equip, selectedSlot); Sound.play('equip'); render(); });
  }
  // 해제는 창을 열어둡니다. 벗은 김에 다른 걸 끼우려는 흐름이 자연스럽습니다.
  for (const btn of document.querySelectorAll('[data-unequip]')) {
    btn.addEventListener('click', ev => { ev.stopPropagation(); if (fightLocked()) return; unequip(btn.dataset.unequip); Sound.play('unequip'); render(); });
  }
  for (const btn of document.querySelectorAll('[data-enhance]')) {
    btn.addEventListener('click', ev => {
      ev.stopPropagation();
      if (fightLocked()) return;
      const slot = btn.dataset.enhance;
      const r = tryEnhance(slot);
      if (r) {
        lastEnhance = { slot, ...r };
        Sound.play(r.success ? 'enhanceOk' : 'enhanceFail');
      }
      render();
    });
  }
  // 슬롯 강화 — 칸을 누를 때마다 한 번
  for (const btn of document.querySelectorAll('[data-enhslot]')) {
    btn.addEventListener('click', () => {
      if (fightLocked()) return;
      const slot = btn.dataset.enhslot;
      const r = tryEnhance(slot);
      if (r) {
        dollFx = { slot, ...r };
        Sound.play(r.success ? 'enhanceOk' : 'enhanceFail');
      }
      render();
    });
  }
  const mb = $('dollModeBtn');
  if (mb) mb.addEventListener('click', () => { if (fightLocked()) return; enhMode = !enhMode; render(); });
  const sb = $('dollSwapBtn');
  if (sb) sb.addEventListener('click', () => openSwapModal(null));
  for (const btn of document.querySelectorAll('#enhBody [data-openswap]')) {
    btn.addEventListener('click', () => openSwapModal(btn.dataset.openswap));
  }
  for (const b of document.querySelectorAll('[data-closeslot]')) {
    b.addEventListener('click', closeSlotModal);
  }
}

// ---------- 부위 강화 ----------
// 따로 창을 띄웁니다 — 부위 창 머리의 「강화」 버튼으로 열고, 닫으면 부위 창으로 돌아갑니다.
// 예전엔 부위 창 맨 위에 붙어 있어서, 장비를 고르러 열 때마다 강화 패널이 목록을 밀어냈습니다.
// 강화는 그 칸에 붙으므로 무엇을 끼고 있든 같은 자리에서 합니다.
// 방금 누른 결과(성공/실패)는 강화 창을 보는 동안만 남겨둡니다.
let lastEnhance = null;

function renderEnhance(special, wornItem) {
  // 부위 창 머리의 버튼. 지금 올릴 수 있으면 초록에 ▲ — 사람 그림 칸의 딱지와 같은 뜻입니다.
  const btn = $('enhOpenBtn');
  if (btn) {
    const lv = special ? 0 : enhanceLevel(selectedSlot);
    const ready = !special && canEnhance(selectedSlot);
    btn.hidden = special;
    btn.classList.toggle('ready', ready);
    btn.textContent = `${ready ? '▲' : ''}강화${lv > 0 ? ` +${lv}` : ''}`;
  }
  // 특수장비 칸에는 강화가 없습니다
  if (special) { closeEnhModal(); return; }
  $('enhTitle').textContent = `${SLOT_NAMES[selectedSlot]} 강화`;
  $('enhBody').innerHTML = enhancePanel(selectedSlot, wornItem);
}

function enhancePanel(slot, item) {
  const lv = enhanceLevel(slot);
  const nx = nextEnhance(slot);
  const stones = stonesOf(slot);
  const now = Math.round(enhanceBonus(lv) * 100);
  const mine = lastEnhance && lastEnhance.slot === slot ? lastEnhance : null;

  const last = mine
    ? `<div class="enh-last ${mine.success ? 'ok' : 'fail'}">${mine.success
        ? `성공 — +${mine.level}`
        : `실패 — 강화석 ${fmt(mine.cost)}개가 부서졌다`}</div>`
    : '';

  // 맨 위 — 무엇을 올리는지(지금 이 칸에 낀 것)와 몇 단계에서 몇 단계로.
  // 강화는 칸에 붙으므로 비어 있어도 올릴 수 있습니다.
  // 그림은 방금 누른 결과에 따라 한 번 번쩍입니다 — 성공은 초록, 실패는 붉게 흔들림.
  const top = `<div class="enh-top">
      <span class="enh-art ${mine ? (mine.success ? 'ok' : 'fail') : ''}">${item ? item.fromIcon : ''}</span>
      <span class="enh-item ${item ? '' : 'empty'}">${item ? `${itemTag(item)}${item.name}` : '비어 있음'}</span>
      <span class="enh-step">+${lv}${nx ? `<em>▶</em>+${lv + 1}` : '<em>최대</em>'}</span>
    </div>`;

  if (!nx) {
    return `<div class="enh-panel maxed">${top}
      <div class="enh-info"><span>핵심 스탯 <b>+${now}%</b></span><span>강화석 ${fmt(stones)}</span></div>
      ${last}
    </div>`;
  }

  const chance = enhanceChance(slot);
  const can = stones >= nx.cost;
  return `<div class="enh-panel">${top}
    <div class="enh-info">
      <span>핵심 스탯 <b>+${now}%</b> → <b>+${Math.round(nx.bonus * 100)}%</b></span>
      <span>강화석 <b class="${can ? 'enough' : ''}">${fmt(stones)}</b> / ${fmt(nx.cost)}</span>
      <span>성공 ${Math.round(chance * 100)}%</span>
    </div>
    <button class="btn primary enh-btn" data-enhance="${slot}" ${can ? '' : 'disabled'}>
      ${can ? `강화한다 · 강화석 ${fmt(nx.cost)}` : `강화석이 ${fmt(nx.cost - stones)}개 모자라다`}
    </button>
    ${last}
    ${swapSources(slot).length ? `<button class="btn enh-swap-open" data-openswap="${slot}">강화석 교환</button>` : ''}
  </div>`;
}

// ---------- 강화석 교환 ----------
// 창 하나에서 전부 합니다 — 내는 것과 받는 것을 고르고, 모자란 만큼 · 절반 · 전부.
// 다른 부위(또는 특수장비)의 강화석을 받는 부위의 강화석으로 — 절반이 사라집니다.
// 아래 목록은 열세 부위의 강화석과 다음 강화에 드는 수 — 누르면 그 부위가 받는 쪽이 됩니다.
// 예전엔 강화 창 안에 붙어 있어서, 지금 고른 부위로 받는 것만 할 수 있었습니다.
let swapFrom = null;    // 내는 것. 창을 새로 열면 다시 고릅니다
let swapTo = null;      // 받는 것
let lastSwap = null;    // 방금 바꾼 결과 — 창을 보는 동안만 남겨둡니다

function swapSources(slot) {
  return ['special'].concat(SLOT_IDS)
    .filter(s => s !== slot && stonesOf(s) >= exchangeCost(1))
    .sort((a, b) => stonesOf(b) - stonesOf(a));
}

function openSwapModal(to) {
  if (fightLocked()) return;
  // 받는 쪽 — 강화 창에서 열면 그 부위, 사람 그림에서 열면 다음 강화까지 가장 덜 모자란 부위
  const lackOf = s => { const nx = nextEnhance(s); return nx ? Math.max(0, nx.cost - stonesOf(s)) : Infinity; };
  swapTo = SLOT_IDS.includes(to) ? to : SLOT_IDS.slice().sort((a, b) => lackOf(a) - lackOf(b))[0];
  swapFrom = null;
  lastSwap = null;
  $('swapModal').classList.remove('hidden');
  render();
}
function closeSwapModal() {
  const m = $('swapModal');
  if (m) m.classList.add('hidden');
  render();
}
function isSwapModalOpen() {
  const m = $('swapModal');
  return !!m && !m.classList.contains('hidden');
}

function renderSwap() {
  if (!isSwapModalOpen()) return;
  const to = swapTo;
  const src = swapSources(to);
  if (!src.includes(swapFrom)) swapFrom = src.includes('special') ? 'special' : (src[0] || null);
  $('swapRate').textContent = `${Math.round(1 / STONE_EXCHANGE_RATE)}개 → 1개`;

  const nx = nextEnhance(to);
  const lack = nx ? Math.max(0, nx.cost - stonesOf(to)) : 0;
  const have = swapFrom ? stonesOf(swapFrom) : 0;
  const gainOf = pay => Math.floor(pay * STONE_EXCHANGE_RATE);
  // 모자란 만큼 — 다음 강화에 딱 맞게. 내는 것이 모자라면 가진 만큼.
  const needPay = lack > 0 ? Math.min(have, exchangeCost(lack)) : 0;
  const halfPay = Math.floor(have / 2);
  const opts = (list, cur) => list.map(s =>
    `<option value="${s}" ${s === cur ? 'selected' : ''}>${SLOT_NAMES[s]} · ${fmt(stonesOf(s))}</option>`).join('');
  const last = lastSwap
    ? `<div class="swap-last">${SLOT_NAMES[lastSwap.from]} ${fmt(lastSwap.paid)} → ${SLOT_NAMES[lastSwap.to]} +${fmt(lastSwap.gain)}</div>`
    : '';

  const pick = `<div class="swap-pick">
      <label><span>내는 것</span>${src.length
        ? `<select class="swap-from" id="swapFromSel">${opts(src, swapFrom)}</select>`
        : '<div class="swap-none">바꿀 강화석이 없다</div>'}</label>
      <span class="swap-arrow">▶</span>
      <label><span>받는 것</span><select class="swap-from" id="swapToSel">${opts(SLOT_IDS, to)}</select></label>
    </div>
    <div class="swap-need">${SLOT_NAMES[to]} +${enhanceLevel(to)} · ${nx
      ? `다음 강화에 ${fmt(nx.cost)} · ${lack > 0 ? `<b>${fmt(lack)}</b> 모자라다` : '<b class="enough">모자라지 않다</b>'}`
      : '끝까지 올랐다'}</div>
    <div class="swap-btns three">
      <button class="btn" data-swap="${needPay}" ${gainOf(needPay) > 0 ? '' : 'disabled'}>
        <b>모자란 만큼</b><span>${lack > 0 ? `${fmt(needPay)} → +${fmt(gainOf(needPay))}` : '—'}</span></button>
      <button class="btn" data-swap="${halfPay}" ${gainOf(halfPay) > 0 ? '' : 'disabled'}>
        <b>절반</b><span>${fmt(halfPay)} → +${fmt(gainOf(halfPay))}</span></button>
      <button class="btn" data-swap="${have}" ${gainOf(have) > 0 ? '' : 'disabled'}>
        <b>전부</b><span>${fmt(have)} → +${fmt(gainOf(have))}</span></button>
    </div>
    ${last}`;

  // 열세 부위와 특수장비 강화석 한눈에 — 부위 줄을 누르면 받는 것이 됩니다
  const rows = SLOT_IDS.map(s => {
    const n = nextEnhance(s);
    const item = getItem(State.meta.equipped[s]);
    return `<button class="swap-row ${s === to ? 'to' : ''} ${s === swapFrom ? 'from' : ''} ${canEnhance(s) ? 'ready' : ''}" data-swapto="${s}">
      <span class="swap-ic">${item ? item.fromIcon : ''}</span>
      <span class="swap-k">${SLOT_NAMES[s]} <b>+${enhanceLevel(s)}</b></span>
      <span class="swap-n">${fmt(stonesOf(s))}${n ? ` / ${fmt(n.cost)}` : ' · 최대'}</span>
    </button>`;
  }).join('') + `<div class="swap-row sp ${swapFrom === 'special' ? 'from' : ''}">
      <span class="swap-ic">✦</span><span class="swap-k">${SLOT_NAMES.special}</span>
      <span class="swap-n">${fmt(stonesOf('special'))}</span></div>`;

  $('swapBody').innerHTML = pick + `<div class="swap-list">${rows}</div>`;

  const fs = $('swapFromSel');
  if (fs) fs.addEventListener('change', () => { swapFrom = fs.value; renderSwap(); });
  const ts = $('swapToSel');
  ts.addEventListener('change', () => { swapTo = ts.value; renderSwap(); });
  for (const b of document.querySelectorAll('#swapBody [data-swapto]')) {
    b.addEventListener('click', () => { swapTo = b.dataset.swapto; renderSwap(); });
  }
  for (const b of document.querySelectorAll('#swapBody [data-swap]')) {
    b.addEventListener('click', () => {
      const r = exchangeStones(swapFrom, swapTo, Number(b.dataset.swap));
      if (r) { lastSwap = r; lastEnhance = null; Sound.play('stone'); }
      render();
    });
  }
}

// ---------- 부위 창 ----------
// 예전엔 칸을 누르면 화면 아래 목록으로 스크롤해서 골랐습니다.
// 열두 칸을 오가며 비교할 때마다 화면이 위아래로 튀어서 창으로 바꿨습니다.
function openSlotModal(slotId) {
  selectedSlot = slotId;
  lastEnhance = null;
  lastSwap = null;
  swapFrom = null;
  showLocked = !!State.meta.settings.showLocked;   // 설정을 따릅니다
  closeEnhModal();
  render();
  const m = $('slotModal');
  if (m) m.classList.remove('hidden');
}

function closeSlotModal() {
  closeEnhModal();
  const m = $('slotModal');
  if (m) m.classList.add('hidden');
  // 창을 닫을 때 비로소 NEW! 를 끕니다 — 열어보는 동안에는 남아 있어야
  // 어느 것이 새것인지 보입니다.
  // 전투를 보는 중에 열었다 닫았으면, 아직 보여주지 않은 이번 전투의 새것은 NEW 를 남겨 둡니다.
  const key = freshKey(selectedSlot);
  const keep = battle && battle.held ? (State.meta.fresh[key] || []).filter(id => !(battle.held.fresh[key] || []).includes(id)) : [];
  clearFresh(key);
  if (keep.length) { State.meta.fresh[key] = keep; save(); }
  render();
}

function isSlotModalOpen() {
  const m = $('slotModal');
  return !!m && !m.classList.contains('hidden');
}

// ---------- 떠돌이 상인의 상점 ----------
// 지금은 강화석만 팝니다 — 부위를 고르고 10 · 100 · 1,000개 묶음으로. 어느 지역에서든 같은 상인, 같은 값입니다.
// 물건(MERCHANT_WARES)을 넣으면 아래에 같이 나옵니다 (지금은 비어 있음).
let shopSlot = null;   // 강화석을 살 부위. 창을 열 때 지금 고른 부위로 맞춥니다
function openShop() {
  if (!merchantHere()) return;
  shopSlot = SLOT_IDS.includes(selectedSlot) ? selectedSlot : SLOT_IDS[0];
  $('shopModal').classList.remove('hidden');
  renderShop();
}
function closeShop() {
  const m = $('shopModal');
  if (m) m.classList.add('hidden');
}
function isShopOpen() {
  const m = $('shopModal');
  return !!m && !m.classList.contains('hidden');
}
function renderShop() {
  if (!isShopOpen()) return;
  if (!merchantHere()) { closeShop(); return; }
  const m = State.run.merchant;
  const gold = num(State.meta.gold);
  $('shopGold').textContent = `골드 ${fmt(gold)}`;
  const cards = m.wares.map(id => {
    const item = getItem(id);
    if (!item) return '';
    // 산 물건은 상점에서 사라집니다
    if (m.bought.includes(id) || owns(id)) return '';
    const sold = false;
    const can = gold >= item.price;
    const worn = getItem(State.meta.equipped[item.slot]);
    const diff = itemDiffText(item, worn, slotMult(item.slot));
    const spec = itemSpecialText(item);
    return `
      <div class="inv-item ware">
        <span class="inv-art">${item.fromIcon}</span>
        <div class="inv-body">
          <div class="inv-head">${itemTag(item)}<span class="inv-name">${item.name}</span></div>
          <div class="inv-stats">${SLOT_NAMES[item.slot]} · ${itemStatText(item) || '—'}${spec ? ` <span class="inv-spec">${spec}</span>` : ''}</div>
          ${diff ? `<div class="inv-diff">${diff}</div>` : ''}
          ${item.note ? `<div class="inv-note">${item.note}</div>` : ''}
        </div>
        <div class="inv-act"><button class="btn" data-buy="${id}" ${can ? '' : 'disabled'}>${fmt(item.price)} 골드</button></div>
      </div>`;
  }).join('');
  // 강화석 — 부위를 고르면 그 부위의 지금 강화석 · 강화 단계와 다음 강화에 드는 수가 보입니다
  const nx = nextEnhance(shopSlot);
  const stones = `
    <div class="shop-stones">
      <div class="swap-head">강화석 <em>덤으로 판다</em></div>
      <select class="swap-from" id="shopSlot">${SLOT_IDS.map(s =>
        `<option value="${s}" ${s === shopSlot ? 'selected' : ''}>${SLOT_NAMES[s]} +${enhanceLevel(s)} · 강화석 ${fmt(stonesOf(s))}${nextEnhance(s) ? ` / ${fmt(nextEnhance(s).cost)}` : ' · 최대'}</option>`).join('')}</select>
      <div class="shop-packs">${STONE_PACKS.map(n => {
        const price = stonePriceFor(n);
        return `<button class="btn" data-stones="${n}" ${gold >= price ? '' : 'disabled'}><b>${fmt(n)}개</b><span>${fmt(price)} 골드</span></button>`;
      }).join('')}</div>
      ${nx ? '' : '<div class="adm-note">이 부위는 강화가 끝까지 올라 있다</div>'}
    </div>`;
  // 소지품이 먼저, 강화석은 그 아래 덤 — 산 물건은 사라지고, 다 팔렸으면 한 줄만 남습니다
  const wares = cards
    ? `<div class="swap-head shop-head">먼저 온 이들의 소지품</div><div class="inventory shop-wares">${cards}</div>`
    : (m.wares.length ? `<div class="shop-empty">더는 내놓을 것이 없다</div>` : '');
  $('shopBody').innerHTML = wares + stones;
  const sel = $('shopSlot');
  if (sel) sel.addEventListener('change', () => { shopSlot = sel.value; renderShop(); });
  for (const b of document.querySelectorAll('[data-stones]')) {
    b.addEventListener('click', () => {
      if (buyStones(shopSlot, Number(b.dataset.stones))) { Sound.play('stone'); render(); }
    });
  }
  for (const b of document.querySelectorAll('[data-buy]')) {
    b.addEventListener('click', () => {
      if (buyWare(b.dataset.buy)) { Sound.play('equip'); render(); }
    });
  }
}

// ---------- 강화 창 ----------
// 부위 창 위에 한 겹 더 뜹니다. 닫으면 밑에 있던 부위 창이 그대로 보입니다.
// 지난번 결과는 지우고 엽니다 — 다시 열었는데 아까의 「실패」가 남아 있으면 헷갈립니다.
function openEnhModal() {
  if (isSpecialSlot(selectedSlot) || fightLocked()) return;
  lastEnhance = null;
  lastSwap = null;
  $('enhModal').classList.remove('hidden');
  render();
}
function closeEnhModal() {
  const m = $('enhModal');
  if (m) m.classList.add('hidden');
}
function isEnhModalOpen() {
  const m = $('enhModal');
  return !!m && !m.classList.contains('hidden');
}

// ---------- 스탯 분배 창 ----------
// 분배판은 「나」 패널 맨 아래에 있어서 한 번 찍으려면 매번 스크롤해야 했습니다.
// 레벨 바로 옆 버튼으로 띄웁니다.
function openAllocModal() {
  if (fightLocked()) return;
  showTab('hero');
  render();
  const m = $('allocModal');
  if (m) m.classList.remove('hidden');
}
// 여정의 「스탯 분배」 — 탭을 「나」로 옮기지 않고 창만 띄웁니다
function openAllocHere() {
  if (fightLocked()) return;
  render();
  const m = $('allocModal');
  if (m) m.classList.remove('hidden');
}
function closeAllocModal() {
  const m = $('allocModal');
  if (m) m.classList.add('hidden');
}
function isAllocModalOpen() {
  const m = $('allocModal');
  return !!m && !m.classList.contains('hidden');
}
function isAnyModalOpen() { return isSlotModalOpen() || isEnhModalOpen() || isSwapModalOpen() || isShopOpen() || isAllocModalOpen() || isRosterModalOpen() || isSaveModalOpen() || isAdminOpen(); }

// 그 부위의 강화를 반영한 실제 수치를 보여줍니다 — 장부상 수치가 아니라 몸에 붙는 값.
// 강화는 부위에 붙으므로, 목록에 있는 것 무엇을 끼든 이 값이 됩니다.
function itemStatText(item) {
  const m = slotMult(item.slot);
  const parts = [];
  for (const s of STAT_INFO) {
    if (item[s.id]) parts.push(`${s.name} +${fmt(item[s.id] * m)}`);
  }
  return parts.join(' · ');
}

// 특수 능력치는 따로 보여줍니다 — 이게 장비의 성격이니까요.
// 강화를 타지 않습니다 (heroStats 와 같습니다).
// 예전엔 여기만 겹 배수를 곱해서 실제보다 크게 보였습니다.
function itemSpecialText(item) {
  return SPECIAL_KEYS
    .filter(k => item[k])
    .map(k => `${SPECIAL_INFO[k].name} +${(item[k] * 100).toFixed(1)}%`)
    .join(' · ');
}

// ---------- 장비 비교 ----------
// 목록의 물건을 지금 이 칸에 낀 것과 견줘서, 무엇이 얼마나 오르고 내리는지 ▲▼ 로 보여줍니다.
// 핵심 스탯은 이 부위의 강화가 반영된 값끼리 견줍니다 (어느 쪽을 끼든 같은 강화를 받으니까요).
// 승률이 어떻게 바뀌는지는 일부러 보여주지 않습니다 — 그건 직접 판단할 몫입니다.
function itemDiffText(item, worn, m) {
  const parts = [];
  for (const s of STAT_INFO) {
    const d = (num(item[s.id]) - num(worn && worn[s.id])) * m;
    if (Math.abs(d) < 0.5) continue;
    parts.push(`<span class="${d > 0 ? 'up' : 'down'}">${s.name} ${d > 0 ? '▲' : '▼'}${fmt(Math.abs(d))}</span>`);
  }
  for (const k of SPECIAL_KEYS) {
    const d = num(item[k]) - num(worn && worn[k]);
    if (Math.abs(d) < 0.0005) continue;
    parts.push(`<span class="${d > 0 ? 'up' : 'down'}">${SPECIAL_INFO[k].name} ${d > 0 ? '▲' : '▼'}${pctTxt(Math.abs(d))}</span>`);
  }
  return parts.length ? parts.join('') : '<span class="same">차이 없음</span>';
}

// 일반 장비는 성격 꼬리표, 특수장비는 보석/유물 꼬리표
function itemTag(item) {
  if (item.special) return `<span class="sp-tag ${item.special}">${item.special === 'gem' ? '보석' : '유물'}</span>`;
  return archTag(item);
}

function archTag(item) {
  if (!item.arch) return '';
  const a = ARCHETYPES[item.arch];
  return `<span class="arch-tag" style="--arch:${a.color}" title="${a.desc}">${a.name}</span>`;
}

// ---------- 기록 ----------
// 회차를 돌수록 길어져서 기본으로 접어둡니다. 「보기」를 눌러야 펼쳐집니다 (펼친 건 저장하지 않습니다).
let logOpen = false;

function renderLog() {
  const el = $('log');
  const btn = $('logToggle');
  if (btn) {
    btn.textContent = logOpen ? '접기' : '보기';
    btn.classList.toggle('on', logOpen);
  }
  el.hidden = !logOpen;
  // 접혀 있을 때는 그리지도 않습니다 — 200줄을 매번 다시 만들 이유가 없습니다
  if (!logOpen) { el.innerHTML = ''; return; }
  // CSS 가 column-reverse 라서, 오래된 것부터 넣으면 최신이 위에 보입니다.
  // 전투를 보여주는 동안엔 그 전투가 남긴 줄(획득 · 레벨업 …)을 아직 숨깁니다
  const cut = battle ? battle.logFrom : Infinity;
  el.innerHTML = State.log
    .filter(l => !(l.n > cut))
    .map(l => `<div class="log-line ${l.kind}">${l.text}</div>`)
    .join('');
}

// ---------- 여정 종료 화면 ----------
function renderOverlay() {
  const run = State.run;
  // 아직 안 본 전투 결과가 있으면 종료 화면을 미룹니다.
  // 마지막 한 방으로 얻은 전리품을 못 보고 넘어가면 허무하니까요.
  if (!run.over || run.lastResult) {
    $('overlay').classList.add('hidden');
    return;
  }
  const r = rankOf(run.level);
  const zone = ZONES[run.zoneIndex];
  const card = $('overlay').querySelector('.overlay-card');

  card.classList.toggle('victory', !!run.victory);
  // 마왕 너머를 본 뒤로는, 격이 무너지는 화면 구석에 눈 하나가 아주 옅게 스칩니다 (말은 없습니다)
  card.classList.toggle('watched', wallSeen() && !run.victory);
  $('overTitle').textContent = run.victory ? '모든 격을 넘어섰다' : '격이 무너졌다';
  // 깼을 때는 제목이 곧 사연이라 아래 줄을 비웁니다 (비면 CSS 가 숨깁니다)
  $('overReason').textContent = run.victory ? '' : run.reason;

  $('overStats').innerHTML = `
    <li><span class="k">도달한 지역</span><span class="v">${run.zoneIndex + 1}지역 · ${zone.name}</span></li>
    <li><span class="k">도달한 격</span><span class="v">${knownRank(r.n) ? `제${r.n}격 · ${r.name}` : '???'}</span></li>
    <li><span class="k">최종 레벨</span><span class="v">Lv.${fmtLevel(run.level)}</span></li>
    <li><span class="k">꺾은 화신</span><span class="v">${run.kills}</span></li>
    <li><span class="k">전리품</span><span class="v">${ownedIds().length}/${knownItems().length}</span></li>
    <li><span class="k">영구 경험치</span><span class="v">×${bossXpMult().toFixed(1)}</span></li>
  `;
  // 끝을 알리는 소리는 그 회차에 한 번만
  if (soundedOver !== run) {
    soundedOver = run;
    Sound.play(run.victory ? 'victory' : 'gameOver');
  }
  $('overlay').classList.remove('hidden');
}
let soundedOver = null;

// ============================================================
//  초기 화면
// ============================================================
function showTitle() {
  $('title').classList.remove('hidden');
  atmosphere();
  renderTitle();
  Sound.music('title');
}

function renderTitle() {
  const slots = [];
  for (let n = 1; n <= SAVE_SLOTS; n++) {
    const s = slotSummary(n);
    slots.push(`
      <div class="save-slot ${s ? 'used' : ''}">
        <div class="ss-head">
          <span class="ss-n">저장 ${n}</span>
          ${s && s.cleared ? '<span class="ss-clear">클리어</span>' : ''}
        </div>
        ${s
          ? `<div class="ss-info">
               <span>${s.runCount}회차</span>
               <span>${s.bestZone}지역까지</span>
               <span>전리품 ${s.owned}</span>
             </div>
             ${s.run ? `<div class="ss-run">진행 중 — ${s.run.zone}지역 · Lv.${fmtLevel(s.run.level)} · 에너지 ${s.run.energy}</div>` : ''}`
          : `<div class="ss-info empty">비어 있음</div>`}
        <div class="ss-actions">
          ${s ? `<button class="btn primary" data-continue="${n}">이어하기</button>` : ''}
          <button class="btn ${s ? '' : 'primary'}" data-new="${n}">${s ? '새로 시작' : '새 게임 시작'}</button>
          ${s ? `<button class="btn danger" data-wipe="${n}">초기화</button>` : ''}
        </div>
        <div class="ss-actions ss-transfer">
          ${s ? `<button class="btn small" data-export="${n}">내보내기</button>` : ''}
          <button class="btn small" data-import="${n}">가져오기</button>
        </div>
      </div>`);
  }
  $('titleMenu').innerHTML = slots.join('');

  for (const b of document.querySelectorAll('[data-export]')) {
    b.addEventListener('click', () => openExport(Number(b.dataset.export)));
  }
  for (const b of document.querySelectorAll('[data-import]')) {
    b.addEventListener('click', () => openImport(Number(b.dataset.import)));
  }

  for (const b of document.querySelectorAll('[data-continue]')) {
    b.addEventListener('click', () => enterGame(Number(b.dataset.continue), false));
  }
  for (const b of document.querySelectorAll('[data-new]')) {
    b.addEventListener('click', () => {
      const n = Number(b.dataset.new);
      if (slotSummary(n) && !confirm(`저장 ${n}의 기록을 지우고 새로 시작합니다. 계속할까요?`)) return;
      enterGame(n, true);
    });
  }
  for (const b of document.querySelectorAll('[data-wipe]')) {
    b.addEventListener('click', () => {
      const n = Number(b.dataset.wipe);
      if (!confirm(`저장 ${n}을(를) 지웁니다. 전리품도 전부 사라집니다. 되돌릴 수 없습니다.`)) return;
      wipeSlot(n);
      renderTitle();
    });
  }
}

// ---------- 세이브 내보내기 / 가져오기 ----------
// 초기 화면의 저장 칸마다 버튼이 있습니다. 코드는 game.js 의 exportSaveCode · parseSaveCode 가 만듭니다.
// 복사가 막힌 환경(파일로 연 html 등)도 있어서, 코드 칸을 직접 길게 눌러 복사할 수도 있게 둡니다.
function openSaveModal(title, body) {
  $('saveModalTitle').textContent = title;
  $('saveModalBody').innerHTML = body;
  $('saveModal').classList.remove('hidden');
}
function closeSaveModal() { $('saveModal').classList.add('hidden'); }
function isSaveModalOpen() { return !$('saveModal').classList.contains('hidden'); }
function saveStatus(text, kind = '') {
  const el = $('saveStatus');
  if (el) { el.textContent = text; el.className = `save-status ${kind}`; }
}
function summaryText(s) { return `${s.runCount}회차 · ${s.bestZone}지역까지 · 전리품 ${s.owned}${s.cleared ? ' · 클리어' : ''}`; }

async function openExport(n) {
  const code = await exportSaveCode(n);
  if (!code) return;
  openSaveModal(`저장 ${n} 내보내기`, `
    <p class="hint">다른 기기의 「가져오기」에 붙여넣는다</p>
    <textarea class="save-code" id="saveCode" readonly>${code}</textarea>
    <div class="save-actions">
      <button class="btn primary" id="saveCopy">복사</button>
      <button class="btn" id="saveDownload">파일로 저장</button>
    </div>
    <div class="save-status" id="saveStatus">${summaryText(slotSummary(n))} · ${fmt(code.length)}자</div>`);

  const ta = $('saveCode');
  ta.addEventListener('focus', () => ta.select());
  $('saveCopy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code);
      saveStatus('복사했습니다.', 'ok');
    } catch (e) {
      // 클립보드가 막힌 곳 — 선택해 두고 옛 방식으로 한 번 더 시도합니다
      ta.focus(); ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e2) {}
      saveStatus(ok ? '복사했습니다.' : '자동 복사가 막혀 있습니다. 선택된 글자를 길게 눌러 복사해 주세요.', ok ? 'ok' : 'warn');
    }
  });
  $('saveDownload').addEventListener('click', () => {
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([code], { type: 'text/plain' }));
    a.download = `jjunsgame-save${n}-${stamp}.txt`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    saveStatus('파일로 저장했습니다.', 'ok');
  });
}

function openImport(n) {
  openSaveModal(`저장 ${n}에 가져오기`, `
    ${slotSummary(n) ? `<p class="hint"><b>저장 ${n}의 기록은 덮어써진다</b></p>` : ''}
    <textarea class="save-code" id="saveInput" placeholder="JJG1. 로 시작하는 코드"></textarea>
    <div class="save-actions">
      <button class="btn" id="saveFile">파일에서 불러오기</button>
      <button class="btn primary" id="saveImport">가져온다</button>
    </div>
    <input type="file" id="saveFileInput" accept=".txt,.json,text/plain" hidden>
    <div class="save-status" id="saveStatus"></div>`);

  const fileInput = $('saveFileInput');
  $('saveFile').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const f = fileInput.files && fileInput.files[0];
    if (!f) return;
    $('saveInput').value = (await f.text()).trim();
    saveStatus(`「${f.name}」을(를) 읽었습니다. 「가져온다」를 누르세요.`);
  });
  $('saveImport').addEventListener('click', async () => {
    let meta;
    try { meta = await parseSaveCode($('saveInput').value); }
    catch (e) { saveStatus(e.message, 'warn'); return; }

    const incoming = summaryText(summarizeMeta(meta));
    const had = slotSummary(n);
    if (had && !confirm(`저장 ${n}의 기록(${summaryText(had)})을 지우고\n가져온 기록(${incoming})으로 바꿉니다. 계속할까요?`)) {
      saveStatus('가져오지 않았습니다.');
      return;
    }
    importSave(n, meta);
    renderTitle();
    saveStatus(`가져왔습니다 — ${incoming}`, 'ok');
    setTimeout(closeSaveModal, 1200);
  });
}

function enterGame(slot, fresh) {
  openSlot(slot, fresh);
  $('title').classList.add('hidden');
  showTab('journey');
  render();
  if (fresh || !State.meta.tutorialDone) startTutorial();
}

// ============================================================
//  튜토리얼 — 짧게. 나머지는 해보면서 알게 되는 게 낫습니다.
// ============================================================
const TUTORIAL = [
  { t: '격이 무너져도 남는 것',
    b: '에너지가 떨어지면 레벨은 1로 돌아갑니다. 하지만 <b>빼앗은 전리품은 영원히 남습니다.</b> 다음 여정은 더 강한 몸으로 시작합니다.' },
  { t: '길 끝에는 누가 서 있다',
    b: '「길을 떠난다」로 만나는 상대는 매번 다릅니다. 하지만 <b>정예와 보스는 정해진 자리</b>에 늘 서 있고, 한 여정에 한 번만 만날 수 있습니다. 대신 좋은 것을 남깁니다.' },
  { t: '이길 수 있을 것 같나',
    b: '싸우기 전에 <b>이길 만한지 예감</b>이 듭니다 — 「잡기 쉬울 것 같다」부터 「불가능할 것 같다」까지. 물러설 수도 있습니다 — 다만 이미 쓴 에너지는 돌아오지 않습니다. 정예와 보스 앞에서는 물러설 수 없습니다.' },
  { t: '같은 것이 또 나오면',
    b: '이미 가진 전리품은 <b>자동으로 분해되어 그 부위의 강화석</b>이 됩니다. 강화석으로 부위를 강화하면 그 칸에 무엇을 끼든 강해집니다. 높이 올릴수록 실패하기 쉽습니다.' }
];

let tutIndex = 0;

function startTutorial() {
  tutIndex = 0;
  $('tutorial').classList.remove('hidden');
  renderTutorial();
}

function renderTutorial() {
  const step = TUTORIAL[tutIndex];
  $('tutStep').textContent = `${tutIndex + 1} / ${TUTORIAL.length}`;
  $('tutTitle').textContent = step.t;
  $('tutBody').innerHTML = step.b;
  $('tutNext').innerHTML = (tutIndex === TUTORIAL.length - 1 ? '시작한다' : '다음') + KEY_HINT;
}

function endTutorial() {
  $('tutorial').classList.add('hidden');
  State.meta.tutorialDone = true;
  save();
}

// ============================================================
//  관리자 — 왼쪽 위 이름표(제목 명패)를 빠르게 다섯 번 누르면 열립니다
// ============================================================
// 화면 설정에서 뺀 보기 설정 셋, 정확한 승률, 소리 시험, 그리고 그림 · 효과 · 맵을 시험할 때 쓸 도구들.
// 진행을 바꾸는 도구는 「시험 모드」를 켜야 눌립니다. 시험 모드에서는 아무것도 저장되지 않아서
// 다시 불러오면 원래대로 돌아갑니다 — 실제 저장을 망가뜨리지 않으려는 안전장치입니다.
const Admin = { testMode: false, showOdds: false };
let brandTaps = [];

const SFX_LABELS = {
  tick: '누르기', encounter: '조우', encounterElite: '조우 · 정예', encounterBoss: '조우 · 보스', aura: '기운',
  retreat: '물러섬', zoneMove: '지역 이동', hit: '때림', crit: '치명타', harm: '일격', foeHit: '맞음',
  foeCrit: '크게 맞음', miss: '빗나감', block: '막기', heal: '회복', special: '특수', win: '승리', lose: '패배',
  drop: '새 전리품', stone: '분해', levelUp: '레벨업', rankUp: '격 상승', pathOpen: '길 열림', unlock: '칸 열림',
  enhanceOk: '강화 성공', enhanceFail: '강화 실패', equip: '장착', unequip: '해제', commit: '분배',
  gameOver: '여정의 끝', victory: '모두 깸'
};
const SONG_LABELS = { title: '초기 화면', field: '여정', boss: '보스' };

function wireAdmin() {
  const brand = document.querySelector('.topbar .brand');
  if (brand) {
    brand.addEventListener('click', () => {
      const now = Date.now();
      brandTaps = brandTaps.filter(t => now - t < 2500);
      brandTaps.push(now);
      if (brandTaps.length >= 5) { brandTaps = []; openAdmin(); }
    });
  }
  for (const b of document.querySelectorAll('[data-closeadmin]')) b.addEventListener('click', closeAdmin);
}

function openAdmin() {
  renderAdmin();
  $('adminModal').classList.remove('hidden');
}
function closeAdmin() {
  $('adminModal').classList.add('hidden');
  render();          // 소리 시험으로 바꾼 배경음도 제자리로
}
function isAdminOpen() {
  const m = $('adminModal');
  return !!m && !m.classList.contains('hidden');
}

function renderAdmin() {
  const el = $('adminBody');
  const run = State.run;
  if (!el || !run) return;
  const t = Admin.testMode;
  const off = t ? '' : 'disabled';
  const st = Sound.status();
  const zoneOpts = ZONES.map((z, i) =>
    `<option value="${i}" ${i === run.zoneIndex ? 'selected' : ''}>${i + 1}. ${z.name}</option>`).join('');
  const foeOpts = zoneRoster(run.zoneIndex).map(f =>
    `<option value="${f.id}">${f.kind !== 'normal' ? `[${KINDS[f.kind].name}] ` : ''}${f.name} · Lv.${fmtLevel(f.level)}</option>`).join('');

  el.innerHTML = `
    <section class="adm-sec">
      <div class="adm-k">시험 모드</div>
      ${t
        ? `<p class="adm-note warn">켜져 있다 — 지금부터 바꾼 것은 저장되지 않는다.</p>
           <div class="adm-row"><button class="btn small" data-adm="reload">끝내기 · 다시 불러오기</button></div>`
        : `<p class="adm-note">아래 도구는 시험 모드에서만 눌린다. 켜면 이 판은 저장되지 않고, 다시 불러오면 원래대로 돌아간다.</p>
           <div class="adm-row"><button class="btn small primary" data-adm="test">시험 모드 켜기</button></div>`}
    </section>

    <section class="adm-sec">
      <div class="adm-k">보기</div>
      <div class="settings">${settingRowsHTML(ADMIN_SETTINGS_UI, true)}</div>
      <div class="adm-row">
        <button class="btn tiny ${Admin.showOdds ? 'on' : ''}" data-adm="odds">정확한 승률 ${Admin.showOdds ? '켜짐' : '꺼짐'}</button>
      </div>
    </section>

    <section class="adm-sec">
      <div class="adm-k">회차 <span>Lv.${fmtLevel(run.level)} · 에너지 ${run.energy}</span></div>
      <div class="adm-row">
        <button class="btn tiny" data-adm="lv10" ${off}>레벨 +10</button>
        <button class="btn tiny" data-adm="lv2x" ${off}>레벨 ×2</button>
        <button class="btn tiny" data-adm="lv10x" ${off}>레벨 ×10</button>
      </div>
      <div class="adm-row">
        <button class="btn tiny" data-adm="en10" ${off}>에너지 +10</button>
        <button class="btn tiny" data-adm="en99" ${off}>에너지 99</button>
        <button class="btn tiny danger" data-adm="end" ${off}>회차 끝내기</button>
      </div>
    </section>

    <section class="adm-sec">
      <div class="adm-k">지역 · 상대</div>
      <div class="adm-row">
        <select class="swap-from" id="admZone" ${off}>${zoneOpts}</select>
        <button class="btn tiny" data-adm="zone" ${off}>이동</button>
      </div>
      <div class="adm-row">
        <select class="swap-from" id="admFoe" ${off}>${foeOpts}</select>
        <button class="btn tiny" data-adm="foe" ${off}>부르기</button>
      </div>
    </section>

    <section class="adm-sec">
      <div class="adm-k">주기</div>
      <div class="adm-row">
        <button class="btn tiny" data-adm="itemsZone" ${off}>이 지역 전리품</button>
        <button class="btn tiny" data-adm="itemsAll" ${off}>모든 전리품</button>
        <button class="btn tiny" data-adm="stones" ${off}>강화석 +1,000</button>
        <button class="btn tiny" data-adm="gold" ${off}>골드 +10,000</button>
        <button class="btn tiny" data-adm="merchant" ${off}>떠돌이 상인을 여기로</button>
        <button class="btn tiny" data-adm="avatar" ${off}>화신 하나 얻기</button>
        <button class="btn tiny" data-adm="special" ${off}>특수장비 칸 모두</button>
      </div>
    </section>

    <section class="adm-sec">
      <div class="adm-k">소리 <span>효과음 ${st.prefs.sfx ? '켜짐' : '꺼짐'} · 배경음 ${st.prefs.bgm ? '켜짐' : '꺼짐'}</span></div>
      <div class="adm-row">${Sound.names().sfx.map(n =>
        `<button class="btn tiny" data-sfx="${n}">${SFX_LABELS[n] || n}</button>`).join('')}</div>
      <div class="adm-row">${Sound.names().songs.map(n =>
        `<button class="btn tiny" data-song="${n}">♪ ${SONG_LABELS[n] || n}</button>`).join('')}
        <button class="btn tiny" data-song="">■ 멈춤</button>
      </div>
    </section>`;

  wireSettingButtons(el);
  for (const b of el.querySelectorAll('[data-adm]')) b.addEventListener('click', () => adminAction(b.dataset.adm));
  for (const b of el.querySelectorAll('[data-sfx]')) b.addEventListener('click', () => Sound.play(b.dataset.sfx));
  for (const b of el.querySelectorAll('[data-song]')) b.addEventListener('click', () => Sound.music(b.dataset.song || null));
}

function adminAction(a) {
  const run = State.run;
  const meta = State.meta;
  switch (a) {
    case 'test':
      Admin.testMode = true;
      blockSaving();
      document.body.classList.add('test-mode');
      break;
    case 'reload': location.reload(); return;
    case 'odds': Admin.showOdds = !Admin.showOdds; break;
    case 'lv10':  adminLevelTo(run.level + 10); break;
    case 'lv2x':  adminLevelTo(run.level * 2); break;
    case 'lv10x': adminLevelTo(run.level * 10); break;
    case 'en10': run.energy += 10; break;
    case 'en99': run.energy = 99; break;
    case 'end':
      stopBattle();
      run.lastResult = null;
      run.encounter = null;
      endRun('관리자가 끝냈다');
      break;
    case 'zone': adminJumpZone(Number($('admZone').value)); break;
    case 'foe':
      adminSummon($('admFoe').value);
      closeAdmin();
      showTab('journey');
      soundEncounter();
      return;
    case 'itemsZone': {
      const rank = ZONES[run.zoneIndex].rank;
      for (const it of ITEMS) if (it.rank.n === rank) meta.owned[it.id] = 1;
      for (const f of zoneRoster(run.zoneIndex)) if (!meta.seen.includes(f.id)) meta.seen.push(f.id);
      break;
    }
    case 'itemsAll':
      for (const it of ITEMS) meta.owned[it.id] = 1;
      for (const f of ENEMIES) if (!meta.seen.includes(f.id)) meta.seen.push(f.id);
      break;
    case 'stones':
      for (const k of Object.keys(meta.stones)) meta.stones[k] += 1000;
      break;
    case 'special':
      meta.specialOpened = ENEMIES.filter(f => f.opens).map(f => f.id);
      break;
    case 'gold':
      meta.gold = num(meta.gold) + 10000;
      break;
    case 'avatar': {
      // 아직 없는 화신 하나를 무작위로 — 처음이면 바로 삼습니다
      const pool = ENEMIES.filter(f => canBecomeAvatar(f) && !meta.avatars.includes(f.id));
      if (!pool.length) break;
      const f = pool[Math.floor(Math.random() * pool.length)];
      meta.avatars.push(f.id);
      if (!meta.avatar) meta.avatar = f.id;
      break;
    }
    case 'merchant': {
      // 조건(3지역 숨은 것)과 상관없이 지금 지역에 세웁니다. 파는 것은 아직 안 가진 것 중 셋
      const pool = ITEMS.filter(i => i.ware && !owns(i.id));
      run.merchant = { zone: run.zoneIndex, wares: pool.slice(0, 3).map(i => i.id), bought: [] };
      break;
    }
  }
  render();            // 관리자 창도 render 가 다시 그립니다
}

// 경험치를 부어 그 레벨까지 — 레벨업 포인트도 정상적으로 받습니다
function adminLevelTo(target) {
  const run = State.run;
  const goal = Math.min(LEVEL_CAP, Math.max(run.level + 1, Math.floor(target)));
  const need = totalXpFor(goal) - (totalXpFor(run.level) + run.xp);
  if (need > 0) gainXp(need * (1 + 1e-9) + 1);
}

function adminJumpZone(i) {
  const run = State.run;
  if (!ZONES[i]) return;
  stopBattle();
  run.zoneIndex = i;
  run.progress = 0;
  run.zoneCleared = false;
  run.encounter = null;
  run.onBoss = false;
  run.aura = null;
  run.lastResult = null;
}

// 고른 상대와 바로 마주합니다. 이미 꺾은 정예 · 보스도 다시 부를 수 있습니다.
function adminSummon(id) {
  const foe = getEnemy(id);
  if (!foe) return;
  const run = State.run;
  stopBattle();
  run.lastResult = null;
  run.downed = run.downed.filter(x => x !== foe.id);
  beginEncounter(foe, !!foe.once);
  render();
}

// ---------- 시작 ----------
function init() {
  wireTabs();
  wireKeys();
  wireClickSound();
  wireAdmin();

  $('newRunBtn').addEventListener('click', () => { startRun(); showTab('journey'); render(); });
  $('logToggle').addEventListener('click', () => { logOpen = !logOpen; renderLog(); });
  $('toTitleBtn').addEventListener('click', () => { currentSlot = 0; showTitle(); });
  for (const b of document.querySelectorAll('[data-closesave]')) b.addEventListener('click', closeSaveModal);
  $('enhOpenBtn').addEventListener('click', openEnhModal);
  for (const b of document.querySelectorAll('[data-closeenh]')) b.addEventListener('click', closeEnhModal);
  for (const b of document.querySelectorAll('[data-closeswap]')) b.addEventListener('click', closeSwapModal);
  for (const b of document.querySelectorAll('[data-closeshop]')) b.addEventListener('click', closeShop);

  $('tutNext').addEventListener('click', () => {
    if (tutIndex < TUTORIAL.length - 1) { tutIndex++; renderTutorial(); }
    else endTutorial();
  });
  $('tutSkip').addEventListener('click', endTutorial);

  // 아직 슬롯을 고르지 않았으므로 빈 상태로 한 번 그려두고 초기화면을 띄웁니다
  startRun();
  render();
  showTitle();
}

init();
