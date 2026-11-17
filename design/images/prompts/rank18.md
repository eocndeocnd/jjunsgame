# 제18격 주신 — 장비 24개 · 시트 3장

> 자동으로 만든 파일입니다 (`node tools/cli.js images`). 손으로 고치지 마세요. 쓰는 법은 같은 폴더의 `README.md`.

## 시트 18-A — 무기 · 보조무기 · 투구 (8개)

저장할 이름: `design/images/sheets/rank18-A.png`

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

TIER LOOK: top-tier gear — divine or otherworldly: radiant, strange materials, a strong glow, elaborate but still one clear silhouette.

FRAMING BY TYPE:
- WEAPON: whole weapon, diagonal, tip or head toward the upper right
- OFF-HAND (shield, book, lantern, orb ...): front view, slightly tilted
- HEADGEAR: 3/4 front view, empty (no head inside)

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. WEAPON 「금강저 바즈라」 — loot from the monster 「인드라」. more refined and menacing; mood: heavy, blunt, massive.
2. WEAPON 「빗나가지 않는 창 궁니르」 — loot from the monster 「오딘」. more refined and menacing; mood: pointed, piercing.
3. WEAPON 「케라우노스」 — loot from the monster 「제우스」. the most ornate and imposing piece of this set; mood: aggressive, sharp.
4. OFF-HAND (shield, book, lantern, orb ...) 「갈고리 홀」 — loot from the monster 「오시리스」. plain look; mood: sinister, a touch of blood red.
5. OFF-HAND (shield, book, lantern, orb ...) 「수다르샤나 원반」 — loot from the monster 「비슈누」. more refined and menacing; mood: reinforced, built to last.
6. OFF-HAND (shield, book, lantern, orb ...) 「아이기스」 — loot from the monster 「제우스」. the most ornate and imposing piece of this set; mood: aggressive, sharp.
7. HEADGEAR 「천부인의 관」 — loot from the monster 「환인」. plain look; mood: sturdy, protective.
8. HEADGEAR 「천 개의 눈」 — loot from the monster 「인드라」. more refined and menacing; mood: heavy, blunt, massive.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 금강저 바즈라 | 무기 | 인드라 | `assets/items/indra2_0.png` |
| 2 | 빗나가지 않는 창 궁니르 | 무기 | 오딘 | `assets/items/odin2_0.png` |
| 3 | 케라우노스 | 무기 | 제우스 | `assets/items/zeus2_0.png` |
| 4 | 갈고리 홀 | 보조무기 | 오시리스 | `assets/items/osiris2_0.png` |
| 5 | 수다르샤나 원반 | 보조무기 | 비슈누 | `assets/items/vishnu2_0.png` |
| 6 | 아이기스 | 보조무기 | 제우스 | `assets/items/zeus2_1.png` |
| 7 | 천부인의 관 | 투구 | 환인 | `assets/items/hwanin2_0.png` |
| 8 | 천 개의 눈 | 투구 | 인드라 | `assets/items/indra2_1.png` |

## 시트 18-B — 갑옷 · 어깨 · 장갑 · 허리띠 · 각반 · 신발 · 망토 (8개)

저장할 이름: `design/images/sheets/rank18-B.png`

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

TIER LOOK: top-tier gear — divine or otherworldly: radiant, strange materials, a strong glow, elaborate but still one clear silhouette.

FRAMING BY TYPE:
- BODY ARMOR / CLOTHING: front view, torso piece only, empty (no body inside)
- SHOULDER GUARD: one pauldron or a matching pair, 3/4 view
- GLOVES / GAUNTLETS: a pair, backs of the hands, fingers up
- BELT / SASH: laid in a loop, buckle or knot at the front
- LEG ARMOR: a pair of shin guards, front view
- BOOTS / SHOES: a pair, side view facing right
- CLOAK / CAPE: front view, hanging open, empty (no body inside)

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. BODY ARMOR / CLOTHING 「황금 태양원반」 — loot from the monster 「라」. plain look; mood: aggressive, sharp.
2. SHOULDER GUARD 「황천의 견갑」 — loot from the monster 「이자나기」. plain look; mood: pointed, piercing.
3. GLOVES / GAUNTLETS 「네 팔의 장갑」 — loot from the monster 「브라흐마」. more refined and menacing; mood: modest, well used.
4. BELT / SASH 「아마포 허리띠」 — loot from the monster 「오시리스」. plain look; mood: sinister, a touch of blood red.
5. LEG ARMOR 「깃털 각반」 — loot from the monster 「케찰코아틀」. plain look; mood: light, slim, built for speed.
6. BOOTS / SHOES 「창공을 딛는 신」 — loot from the monster 「케찰코아틀」. plain look; mood: light, slim, built for speed.
7. CLOAK / CAPE 「자미원의 곤룡포」 — loot from the monster 「옥황상제」. plain look; mood: a lucky charm, a hint of gold.
8. CLOAK / CAPE 「회색 나그네의 망토」 — loot from the monster 「오딘」. more refined and menacing; mood: pointed, piercing.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 황금 태양원반 | 갑옷 | 라 | `assets/items/ra2_0.png` |
| 2 | 황천의 견갑 | 어깨 | 이자나기 | `assets/items/izanagi2_0.png` |
| 3 | 네 팔의 장갑 | 장갑 | 브라흐마 | `assets/items/brahma_0.png` |
| 4 | 아마포 허리띠 | 허리띠 | 오시리스 | `assets/items/osiris2_1.png` |
| 5 | 깃털 각반 | 각반 | 케찰코아틀 | `assets/items/quetzalcoatl2_1.png` |
| 6 | 창공을 딛는 신 | 신발 | 케찰코아틀 | `assets/items/quetzalcoatl2_0.png` |
| 7 | 자미원의 곤룡포 | 망토 | 옥황상제 | `assets/items/jadeemperor2_0.png` |
| 8 | 회색 나그네의 망토 | 망토 | 오딘 | `assets/items/odin2_1.png` |

## 시트 18-C — 반지 · 목걸이 · 팔찌 · 특수장비 (8개)

저장할 이름: `design/images/sheets/rank18-C.png`

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

TIER LOOK: top-tier gear — divine or otherworldly: radiant, strange materials, a strong glow, elaborate but still one clear silhouette.

FRAMING BY TYPE:
- RING: single ring, 3/4 view so the band is visible
- NECKLACE / AMULET: chain in a loop, pendant at the bottom center
- BRACELET / BANGLE / WRISTWATCH: single band, 3/4 view
- SMALL PRECIOUS OBJECT (gem or relic): single small object, 3/4 view

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. RING 「월계수 반지」 — old treasure that was buried in a chest for a long time. plain look; mood: a lucky charm, a hint of gold.
2. RING 「옥새」 — loot from the monster 「옥황상제」. plain look; mood: a lucky charm, a hint of gold.
3. RING 「우라에우스의 뱀」 — loot from the monster 「라」. plain look; mood: aggressive, sharp.
4. NECKLACE / AMULET 「신단수의 가지」 — loot from the monster 「환인」. plain look; mood: sturdy, protective.
5. NECKLACE / AMULET 「올림포스의 인장」 — loot from the monster 「제우스」. the most ornate and imposing piece of this set; mood: aggressive, sharp.
6. BRACELET / BANGLE / WRISTWATCH 「진리의 고리」 — loot from the monster 「아후라 마즈다」. plain look; mood: spiked, thorny.
7. SMALL PRECIOUS OBJECT (gem or relic) 「황천의 복숭아」 — loot from the monster 「이자나기」. a small ancient object; plain look.
8. SMALL PRECIOUS OBJECT (gem or relic) 「시바의 셋째 눈」 — loot from the monster 「시바」. a small ancient object; more refined and menacing.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 월계수 반지 | 반지 | 보물상자 | `assets/items/chest_olympus_ring.png` |
| 2 | 옥새 | 반지 | 옥황상제 | `assets/items/jadeemperor2_1.png` |
| 3 | 우라에우스의 뱀 | 반지 | 라 | `assets/items/ra2_1.png` |
| 4 | 신단수의 가지 | 목걸이 | 환인 | `assets/items/hwanin2_1.png` |
| 5 | 올림포스의 인장 | 목걸이 | 제우스 | `assets/items/zeus2_2.png` |
| 6 | 진리의 고리 | 팔찌 | 아후라 마즈다 | `assets/items/ahuramazda2_0.png` |
| 7 | 황천의 복숭아 | 특수장비 | 이자나기 | `assets/items/izanagi2_1.png` |
| 8 | 시바의 셋째 눈 | 특수장비 | 시바 | `assets/items/shiva2_0.png` |

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

TIER LOOK: top-tier gear — divine or otherworldly: radiant, strange materials, a strong glow, elaborate but still one clear silhouette.

ITEM — the name is Korean. Draw what the name describes; never write the name in the image.
If the name describes a different kind of object than its type, draw the object from the name.
```

- **금강저 바즈라** → `assets/items/indra2_0.png`

  ```text
  WEAPON 「금강저 바즈라」 — loot from the monster 「인드라」. more refined and menacing; mood: heavy, blunt, massive. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **빗나가지 않는 창 궁니르** → `assets/items/odin2_0.png`

  ```text
  WEAPON 「빗나가지 않는 창 궁니르」 — loot from the monster 「오딘」. more refined and menacing; mood: pointed, piercing. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **케라우노스** → `assets/items/zeus2_0.png`

  ```text
  WEAPON 「케라우노스」 — loot from the monster 「제우스」. the most ornate and imposing piece of this set; mood: aggressive, sharp. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **갈고리 홀** → `assets/items/osiris2_0.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「갈고리 홀」 — loot from the monster 「오시리스」. plain look; mood: sinister, a touch of blood red. Framing: front view, slightly tilted.
  ```

- **수다르샤나 원반** → `assets/items/vishnu2_0.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「수다르샤나 원반」 — loot from the monster 「비슈누」. more refined and menacing; mood: reinforced, built to last. Framing: front view, slightly tilted.
  ```

- **아이기스** → `assets/items/zeus2_1.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「아이기스」 — loot from the monster 「제우스」. the most ornate and imposing piece of this set; mood: aggressive, sharp. Framing: front view, slightly tilted.
  ```

- **천부인의 관** → `assets/items/hwanin2_0.png`

  ```text
  HEADGEAR 「천부인의 관」 — loot from the monster 「환인」. plain look; mood: sturdy, protective. Framing: 3/4 front view, empty (no head inside).
  ```

- **천 개의 눈** → `assets/items/indra2_1.png`

  ```text
  HEADGEAR 「천 개의 눈」 — loot from the monster 「인드라」. more refined and menacing; mood: heavy, blunt, massive. Framing: 3/4 front view, empty (no head inside).
  ```

- **황금 태양원반** → `assets/items/ra2_0.png`

  ```text
  BODY ARMOR / CLOTHING 「황금 태양원반」 — loot from the monster 「라」. plain look; mood: aggressive, sharp. Framing: front view, torso piece only, empty (no body inside).
  ```

- **황천의 견갑** → `assets/items/izanagi2_0.png`

  ```text
  SHOULDER GUARD 「황천의 견갑」 — loot from the monster 「이자나기」. plain look; mood: pointed, piercing. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **네 팔의 장갑** → `assets/items/brahma_0.png`

  ```text
  GLOVES / GAUNTLETS 「네 팔의 장갑」 — loot from the monster 「브라흐마」. more refined and menacing; mood: modest, well used. Framing: a pair, backs of the hands, fingers up.
  ```

- **아마포 허리띠** → `assets/items/osiris2_1.png`

  ```text
  BELT / SASH 「아마포 허리띠」 — loot from the monster 「오시리스」. plain look; mood: sinister, a touch of blood red. Framing: laid in a loop, buckle or knot at the front.
  ```

- **깃털 각반** → `assets/items/quetzalcoatl2_1.png`

  ```text
  LEG ARMOR 「깃털 각반」 — loot from the monster 「케찰코아틀」. plain look; mood: light, slim, built for speed. Framing: a pair of shin guards, front view.
  ```

- **창공을 딛는 신** → `assets/items/quetzalcoatl2_0.png`

  ```text
  BOOTS / SHOES 「창공을 딛는 신」 — loot from the monster 「케찰코아틀」. plain look; mood: light, slim, built for speed. Framing: a pair, side view facing right.
  ```

- **자미원의 곤룡포** → `assets/items/jadeemperor2_0.png`

  ```text
  CLOAK / CAPE 「자미원의 곤룡포」 — loot from the monster 「옥황상제」. plain look; mood: a lucky charm, a hint of gold. Framing: front view, hanging open, empty (no body inside).
  ```

- **회색 나그네의 망토** → `assets/items/odin2_1.png`

  ```text
  CLOAK / CAPE 「회색 나그네의 망토」 — loot from the monster 「오딘」. more refined and menacing; mood: pointed, piercing. Framing: front view, hanging open, empty (no body inside).
  ```

- **월계수 반지** → `assets/items/chest_olympus_ring.png`

  ```text
  RING 「월계수 반지」 — old treasure that was buried in a chest for a long time. plain look; mood: a lucky charm, a hint of gold. Framing: single ring, 3/4 view so the band is visible.
  ```

- **옥새** → `assets/items/jadeemperor2_1.png`

  ```text
  RING 「옥새」 — loot from the monster 「옥황상제」. plain look; mood: a lucky charm, a hint of gold. Framing: single ring, 3/4 view so the band is visible.
  ```

- **우라에우스의 뱀** → `assets/items/ra2_1.png`

  ```text
  RING 「우라에우스의 뱀」 — loot from the monster 「라」. plain look; mood: aggressive, sharp. Framing: single ring, 3/4 view so the band is visible.
  ```

- **신단수의 가지** → `assets/items/hwanin2_1.png`

  ```text
  NECKLACE / AMULET 「신단수의 가지」 — loot from the monster 「환인」. plain look; mood: sturdy, protective. Framing: chain in a loop, pendant at the bottom center.
  ```

- **올림포스의 인장** → `assets/items/zeus2_2.png`

  ```text
  NECKLACE / AMULET 「올림포스의 인장」 — loot from the monster 「제우스」. the most ornate and imposing piece of this set; mood: aggressive, sharp. Framing: chain in a loop, pendant at the bottom center.
  ```

- **진리의 고리** → `assets/items/ahuramazda2_0.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「진리의 고리」 — loot from the monster 「아후라 마즈다」. plain look; mood: spiked, thorny. Framing: single band, 3/4 view.
  ```

- **황천의 복숭아** → `assets/items/izanagi2_1.png`

  ```text
  SMALL PRECIOUS OBJECT (gem or relic) 「황천의 복숭아」 — loot from the monster 「이자나기」. a small ancient object; plain look. Framing: single small object, 3/4 view.
  ```

- **시바의 셋째 눈** → `assets/items/shiva2_0.png`

  ```text
  SMALL PRECIOUS OBJECT (gem or relic) 「시바의 셋째 눈」 — loot from the monster 「시바」. a small ancient object; more refined and menacing. Framing: single small object, 3/4 view.
  ```
