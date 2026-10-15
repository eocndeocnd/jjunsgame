// ============================================================
//  loot-check.js — 「전리품이 고르게 퍼져 있는가」 검사.
//
//  격 재편 때 정한 규칙(docs/RANK-PLAN.md 5번)을 지키는지 봅니다. 하나라도 어기면 빌드를 멈춥니다.
//    · 몬스터마다 전리품 수 — 보스 3 · 일반 1~2 · 묶음 밖 정예 2 · 묶음 정예 1 · 히든 0~2 (특수장비 포함)
//    · 일반 중에 전리품이 하나뿐인 것은 격마다 둘까지 (대부분은 둘)
//    · 격마다 열세 부위가 모두 나오고, 한 부위는 많아야 셋 (특수장비 · 상인 물건은 빼고 셉니다)
//    · 전리품 전체가 예산(BUDGET)을 넘지 않는다 — 몬스터가 늘어도 전리품은 늘지 않게
//    · 같은 번호가 두 번 나오지 않는다
//
//  브라우저와 Node 양쪽에서 같은 파일이 돕니다 (node tools/cli.js check-loot).
// ============================================================
(function (root) {
  'use strict';

  const BUDGET = 528;            // 격 재편 전의 전리품 수 — 이보다 늘지 않게
  const SLOT_MIN = 1, SLOT_MAX = 3;
  const SINGLE_NORMALS_MAX = 2;  // 격마다 전리품 하나뿐인 일반의 수

  function expected(foe) {
    if (foe.kind === 'boss') return [3, 3];
    if (foe.kind === 'hidden') return [0, 2];
    if (foe.kind === 'elite') return foe.set ? [1, 1] : [2, 2];
    return [1, 2];
  }

  function check(d) {
    const errors = [], infos = [];
    const byFoe = {};
    const ids = new Set();
    for (const it of d.ITEMS) {
      if (ids.has(it.id)) errors.push(`${it.id} — 같은 번호가 두 번 나옵니다`);
      ids.add(it.id);
      if (it.ware) continue;
      (byFoe[it.from] = byFoe[it.from] || []).push(it);
    }
    if (d.ITEMS.length > BUDGET) errors.push(`전리품이 ${d.ITEMS.length}개 — 예산 ${BUDGET}개를 넘었습니다`);

    for (const r of d.RANKS) {
      const foes = d.ENEMIES.filter(e => e.rank.n === r.n);
      if (!foes.length) continue;
      let singles = 0;
      for (const f of foes) {
        const n = (byFoe[f.id] || []).length;
        const [lo, hi] = expected(f);
        if (n < lo || n > hi) errors.push(`${r.n}격 ${f.name} — 전리품 ${n}개 (${f.kind}${f.set ? ' · 묶음' : ''}은 ${lo === hi ? lo : `${lo}~${hi}`}개)`);
        if (f.kind === 'normal' && n === 1) singles++;
      }
      if (singles > SINGLE_NORMALS_MAX) errors.push(`${r.n}격 — 전리품이 하나뿐인 일반이 ${singles} (격마다 ${SINGLE_NORMALS_MAX}까지)`);

      const tally = Object.fromEntries(d.SLOT_IDS.map(s => [s, 0]));
      for (const it of d.ITEMS) if (!it.ware && it.slot !== 'special' && it.rank.n === r.n) tally[it.slot]++;
      for (const s of d.SLOT_IDS) {
        if (tally[s] < SLOT_MIN) errors.push(`${r.n}격 — ${s} 이(가) 하나도 없습니다`);
        if (tally[s] > SLOT_MAX) errors.push(`${r.n}격 — ${s} 이(가) ${tally[s]}개 (많아야 ${SLOT_MAX})`);
      }
    }
    const counts = Object.values(byFoe).map(l => l.length);
    const share = k => Math.round(counts.filter(n => n === k).length / Math.max(1, counts.length) * 100);
    infos.push(`전리품 ${d.ITEMS.length}/${BUDGET}개 · 몬스터마다 2개 ${share(2)}% · 1개 ${share(1)}% · 3개 ${share(3)}%`);
    return { ok: errors.length === 0, errors, infos };
  }

  const api = { check, BUDGET };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LootCheck = api;
})(typeof window !== 'undefined' ? window : globalThis);
