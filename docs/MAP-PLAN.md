# 맵 이동으로 바꿀 때의 계획

> 목표: Inflation RPG / Resolute Hero RPG 처럼 **캐릭터를 직접 움직이며** 플레이.
> 지금은 「길을 떠난다」 버튼 하나지만, 구조는 이미 맵을 받을 수 있게 잡아뒀습니다.

## 지금 구조가 이미 맵에 맞는 이유

| 지금 | 맵이 들어오면 |
|---|---|
| 「길을 떠난다」 = 에너지 1 | 한 칸 이동 = 에너지 1 |
| 무작위 화신 등장 | 발 딛은 칸에 서 있는 화신 |
| **보스는 정해진 자리에 늘 있음** | 그대로 — 보스 칸으로 걸어가면 됨 |
| 「물러선다」 | 뒤로 물러남 (칸 이동 없이 조우만 취소) |
| 보스 격파 → 「다음 지역으로」 | 출구 칸이 열림 |
| 지역 = 격 | 맵 한 장 = 격 하나 |

**전투 파이프라인은 하나도 안 바뀝니다.** `beginEncounter → engage / retreat` 그대로.

## 손댈 곳은 세 군데뿐

`js/game.js` 의 "맵 이동으로 바꿀 때의 이음매" 주석 블록:

### 1. `pickEncounter(zoneIndex)` — 교체

```js
// 지금
function pickEncounter(zoneIndex) {
  const pool = zoneNormals(zoneIndex);
  return pool[Math.floor(Math.random() * pool.length)];
}

// 나중
function pickEncounter(zoneIndex, x, y) {
  const tile = ZONES[zoneIndex].map.tiles[y][x];
  return tile.enemyId ? getEnemy(tile.enemyId) : null;  // null = 빈 칸
}
```

### 2. `travel()` — 방향 인자를 받게

```js
function travel(dir) {           // 'up' | 'down' | 'left' | 'right'
  if (!canAct()) return;
  const run = State.run;
  const next = step(run.pos, dir);
  if (!walkable(run.zoneIndex, next)) return;   // 벽이면 에너지도 안 씀

  run.energy -= RULES.TRAVEL_COST;
  run.pos = next;

  const foe = pickEncounter(run.zoneIndex, next.x, next.y);
  if (!foe) { save(); return; }                 // 빈 칸이면 이동만
  const aura = beginEncounter(foe, foe.boss);
  ...
}
```

### 3. `canAct()` — 그대로

## 추가할 것

### 지역 데이터에 맵 붙이기 (`js/data.js`)

```js
{
  id: 'rank1', rank: 1,
  name: '알렉산드리아 대도서관',
  map: {
    w: 9, h: 7,
    start: { x: 0, y: 3 },
    exit:  { x: 8, y: 3 },          // 보스를 꺾어야 열림
    walls: [ '..#......', ... ],     // 또는 좌표 배열
    spawns: [                        // 화신이 서 있는 칸
      { x: 2, y: 3, id: 'storyteller' },
      { x: 4, y: 1, id: 'archimedes' },
      { x: 4, y: 5, id: 'joan' },
      { x: 7, y: 3, id: 'yisunsin' }   // 보스 — 출구 바로 앞
    ]
  },
  enemies: [ ... ]   // 그대로 유지
}
```

### 회차 상태에 위치 (`js/game.js` 의 `startRun`)

```js
pos: { ...ZONES[0].map.start },
visited: {},        // 이미 잡은 칸 — 다시 밟아도 안 나오게 할지는 선택
```

`run` 은 저장되지 않으므로(저장은 `meta` 만) 세이브 호환성 문제는 없습니다.

### 화면 (`js/ui.js` 의 `renderJourney`)

`crossroads()` 를 맵 격자로 교체. 조우 카드(`encounterCard`)와 도감은 그대로.
방향키 / WASD 는 `document.addEventListener('keydown', ...)` 로 `travel(dir)` 호출.

## 설계상 미리 정해둘 것

**한 번 잡은 화신은 그 회차 동안 사라지나?**
- 사라짐 → 맵을 훑는 퍼즐이 됨. 에너지 관리가 빡빡해짐
- 남음 → 지금처럼 같은 상대를 반복해서 잡을 수 있음. 겹치기(스택) 파밍이 편함

지금 밸런스는 **남는 쪽**을 전제로 잡혀 있습니다 (한 지역에서 20~30번 싸움).
사라지게 하려면 지역당 화신 수를 늘리거나 리스폰을 넣어야 합니다.

**빈 칸을 밟아도 에너지를 쓰나?**
- Inflation RPG / Resolute Hero 는 **조우할 때만** 소모합니다.
- 그렇게 하면 지금의 "에너지 = 전투 횟수" 밸런스가 그대로 유지됩니다. 권장.
