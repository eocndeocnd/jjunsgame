# 제8격 기사 — 장비 29개 · 시트 4장

> 자동으로 만든 파일입니다 (`node tools/cli.js images`). 손으로 고치지 마세요. 쓰는 법은 같은 폴더의 `README.md`.

## 시트 8-A — 무기 · 보조무기 · 투구 · 갑옷 (8개)

저장할 이름: `design/images/sheets/rank08-A.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 8 separate game item icons in a 3x3 grid.

HARD RULES — breaking any of these makes the image unusable:
1. NO TEXT ANYWHERE. Do not write item names, type names, captions, labels or numbers — not in Korean, not in English.
2. NO LINES. No grid lines, no cell borders, no frames, no dividers between items.
3. The whole background is one flat magenta (#FF00FF). Items float on it with empty space around each one.

STYLE — the same for every icon:
- 16-bit pixel art, crisp 1px dark outline, limited color palette, flat shading with one highlight
- one object per icon, a simple bold silhouette that still reads at 64 px
- no text, no letters, no numbers, no labels, no frames, no grid lines, no drop shadows

BACKGROUND: one flat solid magenta (#FF00FF) everywhere. No gradient, no checkerboard, no floor.
Do not use magenta or hot pink on the items themselves.

LAYOUT: an invisible 3 x 3 grid of equal square cells (do not draw it). Exactly one item per cell, centered, filling about 70% of its cell,
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed. Leave the last 1 cell empty (plain magenta).

TIER LOOK: high-tier gear — mythic and ornate: gold or silver trim, engraved patterns, gems, a soft glow.

FRAMING BY TYPE:
- WEAPON: whole weapon, diagonal, tip or head toward the upper right
- OFF-HAND (shield, book, lantern, orb ...): front view, slightly tilted
- HEADGEAR: 3/4 front view, empty (no head inside)
- BODY ARMOR / CLOTHING: front view, torso piece only, empty (no body inside)

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. WEAPON 「엑스칼리버」 — loot from the monster 「아서왕」. the most ornate and imposing piece of this set; mood: sturdy, protective.
2. WEAPON 「아론다이트」 — loot from the monster 「랜슬롯」. more refined and menacing; mood: pointed, piercing.
3. WEAPON 「뒤랑달」 — loot from the monster 「롤랑」. plain look; mood: sturdy, protective.
4. OFF-HAND (shield, book, lantern, orb ...) 「프리드웬」 — loot from the monster 「아서왕」. the most ornate and imposing piece of this set; mood: sturdy, protective.
5. OFF-HAND (shield, book, lantern, orb ...) 「기도문을 새긴 방패」 — loot from the monster 「성기사」. plain look; mood: reinforced, built to last.
6. HEADGEAR 「배신자의 투구」 — loot from the monster 「모드레드」. more refined and menacing; mood: sinister, a touch of blood red.
7. HEADGEAR 「붉은 십자 투구」 — loot from the monster 「템플 기사」. plain look; mood: sturdy, protective.
8. BODY ARMOR / CLOTHING 「펜드래건의 갑주」 — loot from the monster 「아서왕」. the most ornate and imposing piece of this set; mood: sturdy, protective.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 엑스칼리버 | 무기 | 아서왕 | `assets/items/arthur_0.png` |
| 2 | 아론다이트 | 무기 | 랜슬롯 | `assets/items/lancelot_0.png` |
| 3 | 뒤랑달 | 무기 | 롤랑 | `assets/items/roland_0.png` |
| 4 | 프리드웬 | 보조무기 | 아서왕 | `assets/items/arthur_2.png` |
| 5 | 기도문을 새긴 방패 | 보조무기 | 성기사 | `assets/items/paladin_0.png` |
| 6 | 배신자의 투구 | 투구 | 모드레드 | `assets/items/mordred_0.png` |
| 7 | 붉은 십자 투구 | 투구 | 템플 기사 | `assets/items/templar_0.png` |
| 8 | 펜드래건의 갑주 | 갑옷 | 아서왕 | `assets/items/arthur_1.png` |

## 시트 8-B — 갑옷 · 어깨 · 장갑 · 허리띠 (7개)

저장할 이름: `design/images/sheets/rank08-B.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 7 separate game item icons in a 3x3 grid.

HARD RULES — breaking any of these makes the image unusable:
1. NO TEXT ANYWHERE. Do not write item names, type names, captions, labels or numbers — not in Korean, not in English.
2. NO LINES. No grid lines, no cell borders, no frames, no dividers between items.
3. The whole background is one flat magenta (#FF00FF). Items float on it with empty space around each one.

STYLE — the same for every icon:
- 16-bit pixel art, crisp 1px dark outline, limited color palette, flat shading with one highlight
- one object per icon, a simple bold silhouette that still reads at 64 px
- no text, no letters, no numbers, no labels, no frames, no grid lines, no drop shadows

BACKGROUND: one flat solid magenta (#FF00FF) everywhere. No gradient, no checkerboard, no floor.
Do not use magenta or hot pink on the items themselves.

LAYOUT: an invisible 3 x 3 grid of equal square cells (do not draw it). Exactly one item per cell, centered, filling about 70% of its cell,
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed. Leave the last 2 cells empty (plain magenta).

TIER LOOK: high-tier gear — mythic and ornate: gold or silver trim, engraved patterns, gems, a soft glow.

FRAMING BY TYPE:
- BODY ARMOR / CLOTHING: front view, torso piece only, empty (no body inside)
- SHOULDER GUARD: one pauldron or a matching pair, 3/4 view
- GLOVES / GAUNTLETS: a pair, backs of the hands, fingers up
- BELT / SASH: laid in a loop, buckle or knot at the front

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. BODY ARMOR / CLOTHING 「오러가 밴 흉갑」 — loot from the monster 「오러 기사」. plain look; mood: aggressive, sharp.
2. SHOULDER GUARD 「곰가죽 어깨덮개」 — loot from the monster 「광전사」. plain look; mood: sinister, a touch of blood red.
3. SHOULDER GUARD 「용비늘 견갑」 — loot from the monster 「용기사」. plain look; mood: light, slim, built for speed.
4. GLOVES / GAUNTLETS 「오러를 쥔 건틀릿」 — loot from the monster 「오러 기사」. plain look; mood: aggressive, sharp.
5. GLOVES / GAUNTLETS 「검을 호수에 던진 손」 — loot from the monster 「베디비어」. more refined and menacing; mood: sturdy, protective.
6. BELT / SASH 「초록 허리띠」 — loot from the monster 「녹색 기사」. plain look; mood: modest, well used.
7. BELT / SASH 「론세스바예스의 허리띠」 — loot from the monster 「롤랑」. plain look; mood: sturdy, protective.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 오러가 밴 흉갑 | 갑옷 | 오러 기사 | `assets/items/auraknight_1.png` |
| 2 | 곰가죽 어깨덮개 | 어깨 | 광전사 | `assets/items/berserker_0.png` |
| 3 | 용비늘 견갑 | 어깨 | 용기사 | `assets/items/dragonknight_0.png` |
| 4 | 오러를 쥔 건틀릿 | 장갑 | 오러 기사 | `assets/items/auraknight_0.png` |
| 5 | 검을 호수에 던진 손 | 장갑 | 베디비어 | `assets/items/bedivere_0.png` |
| 6 | 초록 허리띠 | 허리띠 | 녹색 기사 | `assets/items/greenknight_0.png` |
| 7 | 론세스바예스의 허리띠 | 허리띠 | 롤랑 | `assets/items/roland_1.png` |

## 시트 8-C — 각반 · 신발 · 망토 (7개)

저장할 이름: `design/images/sheets/rank08-C.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 7 separate game item icons in a 3x3 grid.

HARD RULES — breaking any of these makes the image unusable:
1. NO TEXT ANYWHERE. Do not write item names, type names, captions, labels or numbers — not in Korean, not in English.
2. NO LINES. No grid lines, no cell borders, no frames, no dividers between items.
3. The whole background is one flat magenta (#FF00FF). Items float on it with empty space around each one.

STYLE — the same for every icon:
- 16-bit pixel art, crisp 1px dark outline, limited color palette, flat shading with one highlight
- one object per icon, a simple bold silhouette that still reads at 64 px
- no text, no letters, no numbers, no labels, no frames, no grid lines, no drop shadows

BACKGROUND: one flat solid magenta (#FF00FF) everywhere. No gradient, no checkerboard, no floor.
Do not use magenta or hot pink on the items themselves.

LAYOUT: an invisible 3 x 3 grid of equal square cells (do not draw it). Exactly one item per cell, centered, filling about 70% of its cell,
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed. Leave the last 2 cells empty (plain magenta).

TIER LOOK: high-tier gear — mythic and ornate: gold or silver trim, engraved patterns, gems, a soft glow.

FRAMING BY TYPE:
- LEG ARMOR: a pair of shin guards, front view
- BOOTS / SHOES: a pair, side view facing right
- CLOAK / CAPE: front view, hanging open, empty (no body inside)

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. LEG ARMOR 「원탁 기사의 정강이받이」 — old treasure that was buried in a chest for a long time. plain look; mood: sturdy, protective.
2. LEG ARMOR 「마지막 출정의 각반」 — loot from the monster 「엘 시드」. plain look; mood: aggressive, sharp.
3. LEG ARMOR 「숲에서 온 투박한 각반」 — loot from the monster 「퍼시벌」. more refined and menacing; mood: a lucky charm, a hint of gold.
4. BOOTS / SHOES 「하늘을 딛는 용의 등자」 — loot from the monster 「용기사」. plain look; mood: light, slim, built for speed.
5. BOOTS / SHOES 「바비에카를 몬 박차」 — loot from the monster 「엘 시드」. plain look; mood: aggressive, sharp.
6. CLOAK / CAPE 「링컨 그린 두건」 — loot from the monster 「로빈 후드」. plain look; mood: pointed, piercing.
7. CLOAK / CAPE 「흰 성전 망토」 — loot from the monster 「템플 기사」. plain look; mood: sturdy, protective.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 원탁 기사의 정강이받이 | 각반 | 보물상자 | `assets/items/chest_camelot_greaves.png` |
| 2 | 마지막 출정의 각반 | 각반 | 엘 시드 | `assets/items/elcid_1.png` |
| 3 | 숲에서 온 투박한 각반 | 각반 | 퍼시벌 | `assets/items/percival_0.png` |
| 4 | 하늘을 딛는 용의 등자 | 신발 | 용기사 | `assets/items/dragonknight_1.png` |
| 5 | 바비에카를 몬 박차 | 신발 | 엘 시드 | `assets/items/elcid_0.png` |
| 6 | 링컨 그린 두건 | 망토 | 로빈 후드 | `assets/items/robinhood_0.png` |
| 7 | 흰 성전 망토 | 망토 | 템플 기사 | `assets/items/templar_1.png` |

## 시트 8-D — 반지 · 목걸이 · 팔찌 · 특수장비 (7개)

저장할 이름: `design/images/sheets/rank08-D.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 7 separate game item icons in a 3x3 grid.

HARD RULES — breaking any of these makes the image unusable:
1. NO TEXT ANYWHERE. Do not write item names, type names, captions, labels or numbers — not in Korean, not in English.
2. NO LINES. No grid lines, no cell borders, no frames, no dividers between items.
3. The whole background is one flat magenta (#FF00FF). Items float on it with empty space around each one.

STYLE — the same for every icon:
- 16-bit pixel art, crisp 1px dark outline, limited color palette, flat shading with one highlight
- one object per icon, a simple bold silhouette that still reads at 64 px
- no text, no letters, no numbers, no labels, no frames, no grid lines, no drop shadows

BACKGROUND: one flat solid magenta (#FF00FF) everywhere. No gradient, no checkerboard, no floor.
Do not use magenta or hot pink on the items themselves.

LAYOUT: an invisible 3 x 3 grid of equal square cells (do not draw it). Exactly one item per cell, centered, filling about 70% of its cell,
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed. Leave the last 2 cells empty (plain magenta).

TIER LOOK: high-tier gear — mythic and ornate: gold or silver trim, engraved patterns, gems, a soft glow.

FRAMING BY TYPE:
- RING: single ring, 3/4 view so the band is visible
- NECKLACE / AMULET: chain in a loop, pendant at the bottom center
- BRACELET / BANGLE / WRISTWATCH: single band, 3/4 view
- SMALL PRECIOUS OBJECT (gem or relic): single small object, 3/4 view

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. RING 「정오의 고리」 — loot from the monster 「가웨인」. more refined and menacing; mood: heavy, blunt, massive.
2. RING 「화살을 가른 깍지」 — loot from the monster 「로빈 후드」. plain look; mood: pointed, piercing.
3. NECKLACE / AMULET 「성배의 한 줄기 빛」 — loot from the monster 「갤러해드」. more refined and menacing; mood: reinforced, built to last.
4. NECKLACE / AMULET 「축성된 성표」 — loot from the monster 「성기사」. plain look; mood: reinforced, built to last.
5. BRACELET / BANGLE / WRISTWATCH 「곰 발톱 팔찌」 — loot from the monster 「광전사」. plain look; mood: sinister, a touch of blood red.
6. BRACELET / BANGLE / WRISTWATCH 「이졸데의 팔찌」 — loot from the monster 「트리스탄」. more refined and menacing; mood: light, slim, built for speed.
7. SMALL PRECIOUS OBJECT (gem or relic) 「아발론의 칼집」 — loot from the monster 「호수의 여인」. a small ancient object; mysterious, faintly glowing.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 정오의 고리 | 반지 | 가웨인 | `assets/items/gawain_0.png` |
| 2 | 화살을 가른 깍지 | 반지 | 로빈 후드 | `assets/items/robinhood_1.png` |
| 3 | 성배의 한 줄기 빛 | 목걸이 | 갤러해드 | `assets/items/galahad_0.png` |
| 4 | 축성된 성표 | 목걸이 | 성기사 | `assets/items/paladin_1.png` |
| 5 | 곰 발톱 팔찌 | 팔찌 | 광전사 | `assets/items/berserker_1.png` |
| 6 | 이졸데의 팔찌 | 팔찌 | 트리스탄 | `assets/items/tristan_0.png` |
| 7 | 아발론의 칼집 | 특수장비 | 호수의 여인 | `assets/items/ladyofthelake_0.png` |

## 하나씩 뽑기 (시트가 잘 안 될 때)

아래 「앞에 붙일 말」 뒤에 장비 한 줄을 붙여 보냅니다. 나온 그림은 표의 「잘라서 둘 곳」 이름으로 저장합니다 (배경은 나중에 도구가 걷어냅니다).

앞에 붙일 말:

```text
Make ONE square image, 1024x1024: a single game item icon.

HARD RULES — breaking any of these makes the image unusable:
1. NO TEXT ANYWHERE. Do not write item names, type names, captions, labels or numbers — not in Korean, not in English.
2. NO LINES. No grid lines, no cell borders, no frames, no dividers between items.
3. The whole background is one flat magenta (#FF00FF). Items float on it with empty space around each one.

STYLE — the same for every icon:
- 16-bit pixel art, crisp 1px dark outline, limited color palette, flat shading with one highlight
- one object per icon, a simple bold silhouette that still reads at 64 px
- no text, no letters, no numbers, no labels, no frames, no grid lines, no drop shadows

BACKGROUND: one flat solid magenta (#FF00FF) everywhere. No gradient, no checkerboard, no floor.
Do not use magenta or hot pink on the items themselves.

LAYOUT: one object, centered, filling about 75% of the image, never touching the edges.

TIER LOOK: high-tier gear — mythic and ornate: gold or silver trim, engraved patterns, gems, a soft glow.

ITEM — the name is Korean. Draw what the name describes; never write the name in the image.
If the name describes a different kind of object than its type, draw the object from the name.
```

- **엑스칼리버** → `assets/items/arthur_0.png`

  ```text
  WEAPON 「엑스칼리버」 — loot from the monster 「아서왕」. the most ornate and imposing piece of this set; mood: sturdy, protective. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **아론다이트** → `assets/items/lancelot_0.png`

  ```text
  WEAPON 「아론다이트」 — loot from the monster 「랜슬롯」. more refined and menacing; mood: pointed, piercing. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **뒤랑달** → `assets/items/roland_0.png`

  ```text
  WEAPON 「뒤랑달」 — loot from the monster 「롤랑」. plain look; mood: sturdy, protective. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **프리드웬** → `assets/items/arthur_2.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「프리드웬」 — loot from the monster 「아서왕」. the most ornate and imposing piece of this set; mood: sturdy, protective. Framing: front view, slightly tilted.
  ```

- **기도문을 새긴 방패** → `assets/items/paladin_0.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「기도문을 새긴 방패」 — loot from the monster 「성기사」. plain look; mood: reinforced, built to last. Framing: front view, slightly tilted.
  ```

- **배신자의 투구** → `assets/items/mordred_0.png`

  ```text
  HEADGEAR 「배신자의 투구」 — loot from the monster 「모드레드」. more refined and menacing; mood: sinister, a touch of blood red. Framing: 3/4 front view, empty (no head inside).
  ```

- **붉은 십자 투구** → `assets/items/templar_0.png`

  ```text
  HEADGEAR 「붉은 십자 투구」 — loot from the monster 「템플 기사」. plain look; mood: sturdy, protective. Framing: 3/4 front view, empty (no head inside).
  ```

- **펜드래건의 갑주** → `assets/items/arthur_1.png`

  ```text
  BODY ARMOR / CLOTHING 「펜드래건의 갑주」 — loot from the monster 「아서왕」. the most ornate and imposing piece of this set; mood: sturdy, protective. Framing: front view, torso piece only, empty (no body inside).
  ```

- **오러가 밴 흉갑** → `assets/items/auraknight_1.png`

  ```text
  BODY ARMOR / CLOTHING 「오러가 밴 흉갑」 — loot from the monster 「오러 기사」. plain look; mood: aggressive, sharp. Framing: front view, torso piece only, empty (no body inside).
  ```

- **곰가죽 어깨덮개** → `assets/items/berserker_0.png`

  ```text
  SHOULDER GUARD 「곰가죽 어깨덮개」 — loot from the monster 「광전사」. plain look; mood: sinister, a touch of blood red. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **용비늘 견갑** → `assets/items/dragonknight_0.png`

  ```text
  SHOULDER GUARD 「용비늘 견갑」 — loot from the monster 「용기사」. plain look; mood: light, slim, built for speed. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **오러를 쥔 건틀릿** → `assets/items/auraknight_0.png`

  ```text
  GLOVES / GAUNTLETS 「오러를 쥔 건틀릿」 — loot from the monster 「오러 기사」. plain look; mood: aggressive, sharp. Framing: a pair, backs of the hands, fingers up.
  ```

- **검을 호수에 던진 손** → `assets/items/bedivere_0.png`

  ```text
  GLOVES / GAUNTLETS 「검을 호수에 던진 손」 — loot from the monster 「베디비어」. more refined and menacing; mood: sturdy, protective. Framing: a pair, backs of the hands, fingers up.
  ```

- **초록 허리띠** → `assets/items/greenknight_0.png`

  ```text
  BELT / SASH 「초록 허리띠」 — loot from the monster 「녹색 기사」. plain look; mood: modest, well used. Framing: laid in a loop, buckle or knot at the front.
  ```

- **론세스바예스의 허리띠** → `assets/items/roland_1.png`

  ```text
  BELT / SASH 「론세스바예스의 허리띠」 — loot from the monster 「롤랑」. plain look; mood: sturdy, protective. Framing: laid in a loop, buckle or knot at the front.
  ```

- **원탁 기사의 정강이받이** → `assets/items/chest_camelot_greaves.png`

  ```text
  LEG ARMOR 「원탁 기사의 정강이받이」 — old treasure that was buried in a chest for a long time. plain look; mood: sturdy, protective. Framing: a pair of shin guards, front view.
  ```

- **마지막 출정의 각반** → `assets/items/elcid_1.png`

  ```text
  LEG ARMOR 「마지막 출정의 각반」 — loot from the monster 「엘 시드」. plain look; mood: aggressive, sharp. Framing: a pair of shin guards, front view.
  ```

- **숲에서 온 투박한 각반** → `assets/items/percival_0.png`

  ```text
  LEG ARMOR 「숲에서 온 투박한 각반」 — loot from the monster 「퍼시벌」. more refined and menacing; mood: a lucky charm, a hint of gold. Framing: a pair of shin guards, front view.
  ```

- **하늘을 딛는 용의 등자** → `assets/items/dragonknight_1.png`

  ```text
  BOOTS / SHOES 「하늘을 딛는 용의 등자」 — loot from the monster 「용기사」. plain look; mood: light, slim, built for speed. Framing: a pair, side view facing right.
  ```

- **바비에카를 몬 박차** → `assets/items/elcid_0.png`

  ```text
  BOOTS / SHOES 「바비에카를 몬 박차」 — loot from the monster 「엘 시드」. plain look; mood: aggressive, sharp. Framing: a pair, side view facing right.
  ```

- **링컨 그린 두건** → `assets/items/robinhood_0.png`

  ```text
  CLOAK / CAPE 「링컨 그린 두건」 — loot from the monster 「로빈 후드」. plain look; mood: pointed, piercing. Framing: front view, hanging open, empty (no body inside).
  ```

- **흰 성전 망토** → `assets/items/templar_1.png`

  ```text
  CLOAK / CAPE 「흰 성전 망토」 — loot from the monster 「템플 기사」. plain look; mood: sturdy, protective. Framing: front view, hanging open, empty (no body inside).
  ```

- **정오의 고리** → `assets/items/gawain_0.png`

  ```text
  RING 「정오의 고리」 — loot from the monster 「가웨인」. more refined and menacing; mood: heavy, blunt, massive. Framing: single ring, 3/4 view so the band is visible.
  ```

- **화살을 가른 깍지** → `assets/items/robinhood_1.png`

  ```text
  RING 「화살을 가른 깍지」 — loot from the monster 「로빈 후드」. plain look; mood: pointed, piercing. Framing: single ring, 3/4 view so the band is visible.
  ```

- **성배의 한 줄기 빛** → `assets/items/galahad_0.png`

  ```text
  NECKLACE / AMULET 「성배의 한 줄기 빛」 — loot from the monster 「갤러해드」. more refined and menacing; mood: reinforced, built to last. Framing: chain in a loop, pendant at the bottom center.
  ```

- **축성된 성표** → `assets/items/paladin_1.png`

  ```text
  NECKLACE / AMULET 「축성된 성표」 — loot from the monster 「성기사」. plain look; mood: reinforced, built to last. Framing: chain in a loop, pendant at the bottom center.
  ```

- **곰 발톱 팔찌** → `assets/items/berserker_1.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「곰 발톱 팔찌」 — loot from the monster 「광전사」. plain look; mood: sinister, a touch of blood red. Framing: single band, 3/4 view.
  ```

- **이졸데의 팔찌** → `assets/items/tristan_0.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「이졸데의 팔찌」 — loot from the monster 「트리스탄」. more refined and menacing; mood: light, slim, built for speed. Framing: single band, 3/4 view.
  ```

- **아발론의 칼집** → `assets/items/ladyofthelake_0.png`

  ```text
  SMALL PRECIOUS OBJECT (gem or relic) 「아발론의 칼집」 — loot from the monster 「호수의 여인」. a small ancient object; mysterious, faintly glowing. Framing: single small object, 3/4 view.
  ```
