// ============================================================
//  id-check.js — 「옛 저장본이 있는 사람의 장비가 몰래 바뀌지 않는가」 검사.
//
//  전리품 번호(id)는 `적id_순번` 입니다. 적을 옮기거나 d 목록의 순서를 바꾸면
//  같은 번호에 다른 물건이 들어가거나(장비가 몰래 바뀜), 같은 물건의 성능이 하루아침에
//  수천 배가 됩니다 (타이탄 · 공허의 군주를 뒤쪽 격으로 옮겼을 때 실제로 있었던 일).
//
//  tools/item-snapshot.json 은 「지난번에 확정한 번호표」입니다. 지금 데이터를 거기에 견줍니다.
//    · 번호가 사라졌는데 RETIRED_ITEMS 에 없다            → 오류 (가진 사람의 장비가 그냥 사라짐)
//    · 같은 번호인데 부위나 이름이 다르다                    → 오류 (몰래 바뀜)
//    · 같은 번호인데 성능(레벨)이 3배 넘게 달라졌다         → 오류 (적을 옮겼거나 사다리가 크게 바뀜)
//    · 새 번호가 생겼다                                    → 괜찮음 (알려만 줍니다)
//  의도한 변경이면 데이터를 고친 뒤 「번호표 갱신」을 합니다 (node tools/cli.js snapshot, 또는 tools/check-ids.html).
//
//  브라우저와 Node 양쪽에서 같은 파일이 돕니다.
// ============================================================
(function (root) {
  'use strict';

  const LEVEL_JUMP = 3;   // 이 배수 넘게 달라지면 오류

  function snapshot(d) {
    const items = {};
    for (const it of d.ITEMS) items[it.id] = [it.slot, it.name, it.rank.n, it.level];
    return { note: '지난번에 확정한 전리품 번호표 — id: [부위, 이름, 격, 레벨]. 손으로 고치지 말고 「번호표 갱신」으로 만드세요.', count: Object.keys(items).length, items };
  }

  function compare(snap, d) {
    const errors = [], infos = [];
    const cur = Object.fromEntries(d.ITEMS.map(i => [i.id, i]));
    const retired = d.RETIRED_ITEMS || {};
    let removedOk = 0;
    for (const [id, [slot, name, rank, level]] of Object.entries(snap.items)) {
      const c = cur[id];
      if (!c) {
        if (retired[id]) removedOk++;
        else errors.push(`${id} (${name}) — 사라졌는데 RETIRED_ITEMS 에 없음: 가진 사람의 장비가 그냥 사라집니다`);
        continue;
      }
      if (c.slot !== slot || c.name !== name) {
        errors.push(`${id} — 같은 번호에 다른 물건: ${slot}/${name} → ${c.slot}/${c.name}`);
        continue;
      }
      const ratio = c.level / Math.max(1, level);
      if (ratio > LEVEL_JUMP || ratio < 1 / LEVEL_JUMP || c.rank.n !== rank) {
        errors.push(`${id} (${name}) — 성능이 ${ratio >= 1 ? ratio.toFixed(1) + '배' : '1/' + (1 / ratio).toFixed(1)} 로 바뀜 (${rank}격 Lv.${level} → ${c.rank.n}격 Lv.${c.level}): 적을 옮겼나요?`);
      }
    }
    const added = d.ITEMS.filter(i => !snap.items[i.id]).length;
    if (added) infos.push(`새 전리품 ${added}개 (번호표에 없음 — 괜찮습니다)`);
    if (removedOk) infos.push(`RETIRED_ITEMS 로 정리된 옛 전리품 ${removedOk}개 (가진 사람은 강화석으로 돌려받음)`);
    return { ok: errors.length === 0, errors, infos };
  }

  const api = { snapshot, compare };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.IdCheck = api;
})(typeof window !== 'undefined' ? window : globalThis);
