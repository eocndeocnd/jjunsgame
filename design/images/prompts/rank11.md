# 제11격 영물 — 장비 31개 · 시트 4장

> 자동으로 만든 파일입니다 (`node tools/cli.js images`). 손으로 고치지 마세요. 쓰는 법은 같은 폴더의 `README.md`.

## 시트 11-A — 무기 · 보조무기 · 투구 · 갑옷 (8개)

저장할 이름: `design/images/sheets/rank11-A.png`

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
1. WEAPON 「용을 찢는 발톱」 — loot from the monster 「금시조」. more refined and menacing; mood: light, slim, built for speed.
2. WEAPON 「화린 뿔창」 — loot from the monster 「화린」. plain look; mood: pointed, piercing.
3. WEAPON 「승천하지 못한 뿔」 — loot from the monster 「이무기」. the most ornate and imposing piece of this set; mood: heavy, blunt, massive.
4. OFF-HAND (shield, book, lantern, orb ...) 「금전표」 — loot from the monster 「세 발 금두꺼비」. plain look; mood: a lucky charm, a hint of gold.
5. OFF-HAND (shield, book, lantern, orb ...) 「만년 귀갑」 — loot from the monster 「금강영구」. plain look; mood: sturdy, protective.
6. HEADGEAR 「쑥 화관」 — loot from the monster 「웅녀」. plain look; mood: modest, well used.
7. HEADGEAR 「거북 등 투구」 — loot from the monster 「금강영구」. plain look; mood: sturdy, protective.
8. BODY ARMOR / CLOTHING 「천잠보의」 — loot from the monster 「빙잠」. plain look; mood: sturdy, protective.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 용을 찢는 발톱 | 무기 | 금시조 | `assets/items/geumsijo2_0.png` |
| 2 | 화린 뿔창 | 무기 | 화린 | `assets/items/hwarin2_0.png` |
| 3 | 승천하지 못한 뿔 | 무기 | 이무기 | `assets/items/imugi2_0.png` |
| 4 | 금전표 | 보조무기 | 세 발 금두꺼비 | `assets/items/geumseom2_1.png` |
| 5 | 만년 귀갑 | 보조무기 | 금강영구 | `assets/items/yeonggu2_0.png` |
| 6 | 쑥 화관 | 투구 | 웅녀 | `assets/items/ungnyeo2_0.png` |
| 7 | 거북 등 투구 | 투구 | 금강영구 | `assets/items/yeonggu2_1.png` |
| 8 | 천잠보의 | 갑옷 | 빙잠 | `assets/items/bingjam2_0.png` |

## 시트 11-B — 갑옷 · 어깨 · 장갑 · 허리띠 (8개)

저장할 이름: `design/images/sheets/rank11-B.png`

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
- BODY ARMOR / CLOTHING: front view, torso piece only, empty (no body inside)
- SHOULDER GUARD: one pauldron or a matching pair, 3/4 view
- GLOVES / GAUNTLETS: a pair, backs of the hands, fingers up
- BELT / SASH: laid in a loop, buckle or knot at the front

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. BODY ARMOR / CLOTHING 「역린 갑주」 — loot from the monster 「이무기」. the most ornate and imposing piece of this set; mood: heavy, blunt, massive.
2. SHOULDER GUARD 「만년설 여우털 어깨걸이」 — old treasure that was buried in a chest for a long time. plain look; mood: a lucky charm, a hint of gold.
3. SHOULDER GUARD 「금빛 깃 견갑」 — loot from the monster 「금시조」. more refined and menacing; mood: light, slim, built for speed.
4. SHOULDER GUARD 「산군의 어깨」 — loot from the monster 「산군」. plain look; mood: aggressive, sharp.
5. GLOVES / GAUNTLETS 「금사 장갑」 — loot from the monster 「금잠고」. plain look; mood: pointed, piercing.
6. GLOVES / GAUNTLETS 「흰 범의 발톱」 — loot from the monster 「백호」. more refined and menacing; mood: aggressive, sharp.
7. BELT / SASH 「청룡의 비늘 허리띠」 — loot from the monster 「청룡」. more refined and menacing; mood: spiked, thorny.
8. BELT / SASH 「산삼 뿌리 띠」 — loot from the monster 「천년 산삼 동자」. plain look; mood: reinforced, built to last.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 역린 갑주 | 갑옷 | 이무기 | `assets/items/imugi2_1.png` |
| 2 | 만년설 여우털 어깨걸이 | 어깨 | 보물상자 | `assets/items/chest_tianshan_shoulder.png` |
| 3 | 금빛 깃 견갑 | 어깨 | 금시조 | `assets/items/geumsijo2_1.png` |
| 4 | 산군의 어깨 | 어깨 | 산군 | `assets/items/sangun2_0.png` |
| 5 | 금사 장갑 | 장갑 | 금잠고 | `assets/items/geumjam2_1.png` |
| 6 | 흰 범의 발톱 | 장갑 | 백호 | `assets/items/whitetiger_0.png` |
| 7 | 청룡의 비늘 허리띠 | 허리띠 | 청룡 | `assets/items/azuredragon_0.png` |
| 8 | 산삼 뿌리 띠 | 허리띠 | 천년 산삼 동자 | `assets/items/sansam2_0.png` |

## 시트 11-C — 각반 · 신발 · 망토 · 반지 (8개)

저장할 이름: `design/images/sheets/rank11-C.png`

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
- LEG ARMOR: a pair of shin guards, front view
- BOOTS / SHOES: a pair, side view facing right
- CLOAK / CAPE: front view, hanging open, empty (no body inside)
- RING: single ring, 3/4 view so the band is visible

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. LEG ARMOR 「뱀이 감긴 각반」 — loot from the monster 「현무」. more refined and menacing; mood: reinforced, built to last.
2. LEG ARMOR 「곰 발 각반」 — loot from the monster 「웅녀」. plain look; mood: modest, well used.
3. BOOTS / SHOES 「불을 밟는 신」 — loot from the monster 「화린」. plain look; mood: pointed, piercing.
4. BOOTS / SHOES 「허물 벗은 신」 — loot from the monster 「백년 영사」. plain look; mood: sinister, a touch of blood red.
5. CLOAK / CAPE 「빙잠사 망토」 — loot from the monster 「빙잠」. plain look; mood: sturdy, protective.
6. CLOAK / CAPE 「아홉 꼬리 목도리」 — loot from the monster 「구미호」. more refined and menacing; mood: sinister, a touch of blood red.
7. RING 「금잠 반지」 — loot from the monster 「금잠고」. plain look; mood: pointed, piercing.
8. RING 「주작의 불씨 반지」 — loot from the monster 「주작」. more refined and menacing; mood: heavy, blunt, massive.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 뱀이 감긴 각반 | 각반 | 현무 | `assets/items/blacktortoise_0.png` |
| 2 | 곰 발 각반 | 각반 | 웅녀 | `assets/items/ungnyeo2_1.png` |
| 3 | 불을 밟는 신 | 신발 | 화린 | `assets/items/hwarin2_1.png` |
| 4 | 허물 벗은 신 | 신발 | 백년 영사 | `assets/items/yeongsa2_1.png` |
| 5 | 빙잠사 망토 | 망토 | 빙잠 | `assets/items/bingjam2_1.png` |
| 6 | 아홉 꼬리 목도리 | 망토 | 구미호 | `assets/items/gumiho2_1.png` |
| 7 | 금잠 반지 | 반지 | 금잠고 | `assets/items/geumjam2_0.png` |
| 8 | 주작의 불씨 반지 | 반지 | 주작 | `assets/items/vermilionbird_0.png` |

## 시트 11-D — 목걸이 · 팔찌 · 특수장비 (7개)

저장할 이름: `design/images/sheets/rank11-D.png`

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
- NECKLACE / AMULET: chain in a loop, pendant at the bottom center
- BRACELET / BANGLE / WRISTWATCH: single band, 3/4 view
- SMALL PRECIOUS OBJECT (gem or relic): single small object, 3/4 view

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. NECKLACE / AMULET 「여우 구슬」 — loot from the monster 「구미호」. more refined and menacing; mood: sinister, a touch of blood red.
2. NECKLACE / AMULET 「영사의 내단」 — loot from the monster 「백년 영사」. plain look; mood: sinister, a touch of blood red.
3. BRACELET / BANGLE / WRISTWATCH 「금섬 팔찌」 — loot from the monster 「세 발 금두꺼비」. plain look; mood: a lucky charm, a hint of gold.
4. BRACELET / BANGLE / WRISTWATCH 「천년 삼 팔찌」 — loot from the monster 「천년 산삼 동자」. plain look; mood: reinforced, built to last.
5. SMALL PRECIOUS OBJECT (gem or relic) 「봉황의 비취」 — loot from the monster 「봉황」. a small shining stone or crystal; mysterious, faintly glowing.
6. SMALL PRECIOUS OBJECT (gem or relic) 「태평의 깃」 — loot from the monster 「봉황」. a small ancient object; mysterious, faintly glowing.
7. SMALL PRECIOUS OBJECT (gem or relic) 「이무기의 여의주」 — loot from the monster 「이무기」. a small shining stone or crystal; the most ornate and imposing piece of this set.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 여우 구슬 | 목걸이 | 구미호 | `assets/items/gumiho2_0.png` |
| 2 | 영사의 내단 | 목걸이 | 백년 영사 | `assets/items/yeongsa2_0.png` |
| 3 | 금섬 팔찌 | 팔찌 | 세 발 금두꺼비 | `assets/items/geumseom2_0.png` |
| 4 | 천년 삼 팔찌 | 팔찌 | 천년 산삼 동자 | `assets/items/sansam2_1.png` |
| 5 | 봉황의 비취 | 특수장비 | 봉황 | `assets/items/bonghwang2_0.png` |
| 6 | 태평의 깃 | 특수장비 | 봉황 | `assets/items/bonghwang2_1.png` |
| 7 | 이무기의 여의주 | 특수장비 | 이무기 | `assets/items/imugi2_2.png` |

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

- **용을 찢는 발톱** → `assets/items/geumsijo2_0.png`

  ```text
  WEAPON 「용을 찢는 발톱」 — loot from the monster 「금시조」. more refined and menacing; mood: light, slim, built for speed. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **화린 뿔창** → `assets/items/hwarin2_0.png`

  ```text
  WEAPON 「화린 뿔창」 — loot from the monster 「화린」. plain look; mood: pointed, piercing. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **승천하지 못한 뿔** → `assets/items/imugi2_0.png`

  ```text
  WEAPON 「승천하지 못한 뿔」 — loot from the monster 「이무기」. the most ornate and imposing piece of this set; mood: heavy, blunt, massive. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **금전표** → `assets/items/geumseom2_1.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「금전표」 — loot from the monster 「세 발 금두꺼비」. plain look; mood: a lucky charm, a hint of gold. Framing: front view, slightly tilted.
  ```

- **만년 귀갑** → `assets/items/yeonggu2_0.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「만년 귀갑」 — loot from the monster 「금강영구」. plain look; mood: sturdy, protective. Framing: front view, slightly tilted.
  ```

- **쑥 화관** → `assets/items/ungnyeo2_0.png`

  ```text
  HEADGEAR 「쑥 화관」 — loot from the monster 「웅녀」. plain look; mood: modest, well used. Framing: 3/4 front view, empty (no head inside).
  ```

- **거북 등 투구** → `assets/items/yeonggu2_1.png`

  ```text
  HEADGEAR 「거북 등 투구」 — loot from the monster 「금강영구」. plain look; mood: sturdy, protective. Framing: 3/4 front view, empty (no head inside).
  ```

- **천잠보의** → `assets/items/bingjam2_0.png`

  ```text
  BODY ARMOR / CLOTHING 「천잠보의」 — loot from the monster 「빙잠」. plain look; mood: sturdy, protective. Framing: front view, torso piece only, empty (no body inside).
  ```

- **역린 갑주** → `assets/items/imugi2_1.png`

  ```text
  BODY ARMOR / CLOTHING 「역린 갑주」 — loot from the monster 「이무기」. the most ornate and imposing piece of this set; mood: heavy, blunt, massive. Framing: front view, torso piece only, empty (no body inside).
  ```

- **만년설 여우털 어깨걸이** → `assets/items/chest_tianshan_shoulder.png`

  ```text
  SHOULDER GUARD 「만년설 여우털 어깨걸이」 — old treasure that was buried in a chest for a long time. plain look; mood: a lucky charm, a hint of gold. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **금빛 깃 견갑** → `assets/items/geumsijo2_1.png`

  ```text
  SHOULDER GUARD 「금빛 깃 견갑」 — loot from the monster 「금시조」. more refined and menacing; mood: light, slim, built for speed. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **산군의 어깨** → `assets/items/sangun2_0.png`

  ```text
  SHOULDER GUARD 「산군의 어깨」 — loot from the monster 「산군」. plain look; mood: aggressive, sharp. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **금사 장갑** → `assets/items/geumjam2_1.png`

  ```text
  GLOVES / GAUNTLETS 「금사 장갑」 — loot from the monster 「금잠고」. plain look; mood: pointed, piercing. Framing: a pair, backs of the hands, fingers up.
  ```

- **흰 범의 발톱** → `assets/items/whitetiger_0.png`

  ```text
  GLOVES / GAUNTLETS 「흰 범의 발톱」 — loot from the monster 「백호」. more refined and menacing; mood: aggressive, sharp. Framing: a pair, backs of the hands, fingers up.
  ```

- **청룡의 비늘 허리띠** → `assets/items/azuredragon_0.png`

  ```text
  BELT / SASH 「청룡의 비늘 허리띠」 — loot from the monster 「청룡」. more refined and menacing; mood: spiked, thorny. Framing: laid in a loop, buckle or knot at the front.
  ```

- **산삼 뿌리 띠** → `assets/items/sansam2_0.png`

  ```text
  BELT / SASH 「산삼 뿌리 띠」 — loot from the monster 「천년 산삼 동자」. plain look; mood: reinforced, built to last. Framing: laid in a loop, buckle or knot at the front.
  ```

- **뱀이 감긴 각반** → `assets/items/blacktortoise_0.png`

  ```text
  LEG ARMOR 「뱀이 감긴 각반」 — loot from the monster 「현무」. more refined and menacing; mood: reinforced, built to last. Framing: a pair of shin guards, front view.
  ```

- **곰 발 각반** → `assets/items/ungnyeo2_1.png`

  ```text
  LEG ARMOR 「곰 발 각반」 — loot from the monster 「웅녀」. plain look; mood: modest, well used. Framing: a pair of shin guards, front view.
  ```

- **불을 밟는 신** → `assets/items/hwarin2_1.png`

  ```text
  BOOTS / SHOES 「불을 밟는 신」 — loot from the monster 「화린」. plain look; mood: pointed, piercing. Framing: a pair, side view facing right.
  ```

- **허물 벗은 신** → `assets/items/yeongsa2_1.png`

  ```text
  BOOTS / SHOES 「허물 벗은 신」 — loot from the monster 「백년 영사」. plain look; mood: sinister, a touch of blood red. Framing: a pair, side view facing right.
  ```

- **빙잠사 망토** → `assets/items/bingjam2_1.png`

  ```text
  CLOAK / CAPE 「빙잠사 망토」 — loot from the monster 「빙잠」. plain look; mood: sturdy, protective. Framing: front view, hanging open, empty (no body inside).
  ```

- **아홉 꼬리 목도리** → `assets/items/gumiho2_1.png`

  ```text
  CLOAK / CAPE 「아홉 꼬리 목도리」 — loot from the monster 「구미호」. more refined and menacing; mood: sinister, a touch of blood red. Framing: front view, hanging open, empty (no body inside).
  ```

- **금잠 반지** → `assets/items/geumjam2_0.png`

  ```text
  RING 「금잠 반지」 — loot from the monster 「금잠고」. plain look; mood: pointed, piercing. Framing: single ring, 3/4 view so the band is visible.
  ```

- **주작의 불씨 반지** → `assets/items/vermilionbird_0.png`

  ```text
  RING 「주작의 불씨 반지」 — loot from the monster 「주작」. more refined and menacing; mood: heavy, blunt, massive. Framing: single ring, 3/4 view so the band is visible.
  ```

- **여우 구슬** → `assets/items/gumiho2_0.png`

  ```text
  NECKLACE / AMULET 「여우 구슬」 — loot from the monster 「구미호」. more refined and menacing; mood: sinister, a touch of blood red. Framing: chain in a loop, pendant at the bottom center.
  ```

- **영사의 내단** → `assets/items/yeongsa2_0.png`

  ```text
  NECKLACE / AMULET 「영사의 내단」 — loot from the monster 「백년 영사」. plain look; mood: sinister, a touch of blood red. Framing: chain in a loop, pendant at the bottom center.
  ```

- **금섬 팔찌** → `assets/items/geumseom2_0.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「금섬 팔찌」 — loot from the monster 「세 발 금두꺼비」. plain look; mood: a lucky charm, a hint of gold. Framing: single band, 3/4 view.
  ```

- **천년 삼 팔찌** → `assets/items/sansam2_1.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「천년 삼 팔찌」 — loot from the monster 「천년 산삼 동자」. plain look; mood: reinforced, built to last. Framing: single band, 3/4 view.
  ```

- **봉황의 비취** → `assets/items/bonghwang2_0.png`

  ```text
  SMALL PRECIOUS OBJECT (gem or relic) 「봉황의 비취」 — loot from the monster 「봉황」. a small shining stone or crystal; mysterious, faintly glowing. Framing: single small object, 3/4 view.
  ```

- **태평의 깃** → `assets/items/bonghwang2_1.png`

  ```text
  SMALL PRECIOUS OBJECT (gem or relic) 「태평의 깃」 — loot from the monster 「봉황」. a small ancient object; mysterious, faintly glowing. Framing: single small object, 3/4 view.
  ```

- **이무기의 여의주** → `assets/items/imugi2_2.png`

  ```text
  SMALL PRECIOUS OBJECT (gem or relic) 「이무기의 여의주」 — loot from the monster 「이무기」. a small shining stone or crystal; the most ornate and imposing piece of this set. Framing: single small object, 3/4 view.
  ```
