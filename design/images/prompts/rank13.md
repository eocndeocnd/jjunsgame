# 제13격 영웅 — 장비 27개 · 시트 3장

> 자동으로 만든 파일입니다 (`node tools/cli.js images`). 손으로 고치지 마세요. 쓰는 법은 같은 폴더의 `README.md`.

## 시트 13-A — 무기 · 보조무기 · 투구 · 갑옷 (9개)

저장할 이름: `design/images/sheets/rank13-A.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 9 separate game item icons in a 3x3 grid.

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
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed.

TIER LOOK: top-tier gear — divine or otherworldly: radiant, strange materials, a strong glow, elaborate but still one clear silhouette.

FRAMING BY TYPE:
- WEAPON: whole weapon, diagonal, tip or head toward the upper right
- OFF-HAND (shield, book, lantern, orb ...): front view, slightly tilted
- HEADGEAR: 3/4 front view, empty (no head inside)
- BODY ARMOR / CLOTHING: front view, torso piece only, empty (no body inside)

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. WEAPON 「간디바」 — loot from the monster 「아르주나」. plain look; mood: pointed, piercing.
2. WEAPON 「엘리시온 들꽃 창」 — old treasure that was buried in a chest for a long time. plain look; mood: pointed, piercing.
3. WEAPON 「올리브 몽둥이」 — loot from the monster 「헤라클레스」. the most ornate and imposing piece of this set; mood: heavy, blunt, massive.
4. WEAPON 「마검 그람」 — loot from the monster 「지그프리트」. plain look; mood: sinister, a touch of blood red.
5. OFF-HAND (shield, book, lantern, orb ...) 「트로이의 방패」 — loot from the monster 「헥토르」. plain look; mood: sturdy, protective.
6. OFF-HAND (shield, book, lantern, orb ...) 「거울 방패」 — loot from the monster 「페르세우스」. plain look; mood: light, slim, built for speed.
7. HEADGEAR 「우루크의 왕관」 — loot from the monster 「길가메시」. more refined and menacing; mood: heavy, blunt, massive.
8. HEADGEAR 「빛나는 투구」 — loot from the monster 「헥토르」. plain look; mood: sturdy, protective.
9. BODY ARMOR / CLOTHING 「불멸의 청동 갑주」 — loot from the monster 「아킬레우스」. plain look; mood: aggressive, sharp.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 간디바 | 무기 | 아르주나 | `assets/items/arjuna2_0.png` |
| 2 | 엘리시온 들꽃 창 | 무기 | 보물상자 | `assets/items/chest_elysion_spear.png` |
| 3 | 올리브 몽둥이 | 무기 | 헤라클레스 | `assets/items/heracles2_0.png` |
| 4 | 마검 그람 | 무기 | 지그프리트 | `assets/items/siegfried2_0.png` |
| 5 | 트로이의 방패 | 보조무기 | 헥토르 | `assets/items/hector2_0.png` |
| 6 | 거울 방패 | 보조무기 | 페르세우스 | `assets/items/perseus2_0.png` |
| 7 | 우루크의 왕관 | 투구 | 길가메시 | `assets/items/gilgamesh2_1.png` |
| 8 | 빛나는 투구 | 투구 | 헥토르 | `assets/items/hector2_1.png` |
| 9 | 불멸의 청동 갑주 | 갑옷 | 아킬레우스 | `assets/items/achilles2_0.png` |

## 시트 13-B — 갑옷 · 어깨 · 장갑 · 허리띠 · 각반 · 신발 (9개)

저장할 이름: `design/images/sheets/rank13-B.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 9 separate game item icons in a 3x3 grid.

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
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed.

TIER LOOK: top-tier gear — divine or otherworldly: radiant, strange materials, a strong glow, elaborate but still one clear silhouette.

FRAMING BY TYPE:
- BODY ARMOR / CLOTHING: front view, torso piece only, empty (no body inside)
- SHOULDER GUARD: one pauldron or a matching pair, 3/4 view
- GLOVES / GAUNTLETS: a pair, backs of the hands, fingers up
- BELT / SASH: laid in a loop, buckle or knot at the front
- LEG ARMOR: a pair of shin guards, front view
- BOOTS / SHOES: a pair, side view facing right

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. BODY ARMOR / CLOTHING 「들짐승의 가죽」 — loot from the monster 「엔키두」. plain look; mood: reinforced, built to last.
2. BODY ARMOR / CLOTHING 「네메아 사자의 가죽」 — loot from the monster 「헤라클레스」. the most ornate and imposing piece of this set; mood: heavy, blunt, massive.
3. SHOULDER GUARD 「하늘 황소의 어깨」 — loot from the monster 「길가메시」. more refined and menacing; mood: heavy, blunt, massive.
4. GLOVES / GAUNTLETS 「그렌델의 팔」 — loot from the monster 「베오울프」. more refined and menacing; mood: spiked, thorny.
5. GLOVES / GAUNTLETS 「열두 도끼를 꿰뚫은 손」 — loot from the monster 「오디세우스」. plain look; mood: pointed, piercing.
6. BELT / SASH 「미궁의 실 허리띠」 — loot from the monster 「테세우스」. plain look; mood: pointed, piercing.
7. LEG ARMOR 「뒤틀림의 각반」 — loot from the monster 「쿠 훌린」. plain look; mood: heavy, blunt, massive.
8. LEG ARMOR 「야생의 각반」 — loot from the monster 「엔키두」. plain look; mood: reinforced, built to last.
9. BOOTS / SHOES 「테티스가 잡았던 발목」 — loot from the monster 「아킬레우스」. plain look; mood: aggressive, sharp.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 들짐승의 가죽 | 갑옷 | 엔키두 | `assets/items/enkidu2_0.png` |
| 2 | 네메아 사자의 가죽 | 갑옷 | 헤라클레스 | `assets/items/heracles2_1.png` |
| 3 | 하늘 황소의 어깨 | 어깨 | 길가메시 | `assets/items/gilgamesh2_0.png` |
| 4 | 그렌델의 팔 | 장갑 | 베오울프 | `assets/items/beowulf2_0.png` |
| 5 | 열두 도끼를 꿰뚫은 손 | 장갑 | 오디세우스 | `assets/items/odysseus2_0.png` |
| 6 | 미궁의 실 허리띠 | 허리띠 | 테세우스 | `assets/items/theseus2_1.png` |
| 7 | 뒤틀림의 각반 | 각반 | 쿠 훌린 | `assets/items/cuchulainn2_0.png` |
| 8 | 야생의 각반 | 각반 | 엔키두 | `assets/items/enkidu2_1.png` |
| 9 | 테티스가 잡았던 발목 | 신발 | 아킬레우스 | `assets/items/achilles2_1.png` |

## 시트 13-C — 신발 · 망토 · 반지 · 목걸이 · 팔찌 · 특수장비 (9개)

저장할 이름: `design/images/sheets/rank13-C.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 9 separate game item icons in a 3x3 grid.

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
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed.

TIER LOOK: top-tier gear — divine or otherworldly: radiant, strange materials, a strong glow, elaborate but still one clear silhouette.

FRAMING BY TYPE:
- BOOTS / SHOES: a pair, side view facing right
- CLOAK / CAPE: front view, hanging open, empty (no body inside)
- RING: single ring, 3/4 view so the band is visible
- NECKLACE / AMULET: chain in a loop, pendant at the bottom center
- BRACELET / BANGLE / WRISTWATCH: single band, 3/4 view
- SMALL PRECIOUS OBJECT (gem or relic): single small object, 3/4 view

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. BOOTS / SHOES 「멈추지 않는 발」 — loot from the monster 「아탈란테」. plain look; mood: light, slim, built for speed.
2. CLOAK / CAPE 「전차병의 망토」 — loot from the monster 「아르주나」. plain look; mood: pointed, piercing.
3. CLOAK / CAPE 「보이지 않는 망토」 — loot from the monster 「페르세우스」. plain look; mood: light, slim, built for speed.
4. RING 「황금 사과」 — loot from the monster 「아탈란테」. plain look; mood: light, slim, built for speed.
5. NECKLACE / AMULET 「아리아드네의 실타래」 — loot from the monster 「테세우스」. plain look; mood: pointed, piercing.
6. BRACELET / BANGLE / WRISTWATCH 「흐룬팅의 고리」 — loot from the monster 「베오울프」. more refined and menacing; mood: spiked, thorny.
7. BRACELET / BANGLE / WRISTWATCH 「뒤틀림의 팔찌」 — loot from the monster 「쿠 훌린」. plain look; mood: heavy, blunt, massive.
8. SMALL PRECIOUS OBJECT (gem or relic) 「네메아를 꺾은 주먹」 — loot from the monster 「헤라클레스」. a small ancient object; the most ornate and imposing piece of this set.
9. SMALL PRECIOUS OBJECT (gem or relic) 「파프니르의 피」 — loot from the monster 「지그프리트」. a small shining stone or crystal; plain look.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 멈추지 않는 발 | 신발 | 아탈란테 | `assets/items/atalanta2_0.png` |
| 2 | 전차병의 망토 | 망토 | 아르주나 | `assets/items/arjuna2_1.png` |
| 3 | 보이지 않는 망토 | 망토 | 페르세우스 | `assets/items/perseus2_1.png` |
| 4 | 황금 사과 | 반지 | 아탈란테 | `assets/items/atalanta2_1.png` |
| 5 | 아리아드네의 실타래 | 목걸이 | 테세우스 | `assets/items/theseus2_0.png` |
| 6 | 흐룬팅의 고리 | 팔찌 | 베오울프 | `assets/items/beowulf2_1.png` |
| 7 | 뒤틀림의 팔찌 | 팔찌 | 쿠 훌린 | `assets/items/cuchulainn2_1.png` |
| 8 | 네메아를 꺾은 주먹 | 특수장비 | 헤라클레스 | `assets/items/heracles2_2.png` |
| 9 | 파프니르의 피 | 특수장비 | 지그프리트 | `assets/items/siegfried2_1.png` |

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

- **간디바** → `assets/items/arjuna2_0.png`

  ```text
  WEAPON 「간디바」 — loot from the monster 「아르주나」. plain look; mood: pointed, piercing. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **엘리시온 들꽃 창** → `assets/items/chest_elysion_spear.png`

  ```text
  WEAPON 「엘리시온 들꽃 창」 — old treasure that was buried in a chest for a long time. plain look; mood: pointed, piercing. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **올리브 몽둥이** → `assets/items/heracles2_0.png`

  ```text
  WEAPON 「올리브 몽둥이」 — loot from the monster 「헤라클레스」. the most ornate and imposing piece of this set; mood: heavy, blunt, massive. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **마검 그람** → `assets/items/siegfried2_0.png`

  ```text
  WEAPON 「마검 그람」 — loot from the monster 「지그프리트」. plain look; mood: sinister, a touch of blood red. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **트로이의 방패** → `assets/items/hector2_0.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「트로이의 방패」 — loot from the monster 「헥토르」. plain look; mood: sturdy, protective. Framing: front view, slightly tilted.
  ```

- **거울 방패** → `assets/items/perseus2_0.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「거울 방패」 — loot from the monster 「페르세우스」. plain look; mood: light, slim, built for speed. Framing: front view, slightly tilted.
  ```

- **우루크의 왕관** → `assets/items/gilgamesh2_1.png`

  ```text
  HEADGEAR 「우루크의 왕관」 — loot from the monster 「길가메시」. more refined and menacing; mood: heavy, blunt, massive. Framing: 3/4 front view, empty (no head inside).
  ```

- **빛나는 투구** → `assets/items/hector2_1.png`

  ```text
  HEADGEAR 「빛나는 투구」 — loot from the monster 「헥토르」. plain look; mood: sturdy, protective. Framing: 3/4 front view, empty (no head inside).
  ```

- **불멸의 청동 갑주** → `assets/items/achilles2_0.png`

  ```text
  BODY ARMOR / CLOTHING 「불멸의 청동 갑주」 — loot from the monster 「아킬레우스」. plain look; mood: aggressive, sharp. Framing: front view, torso piece only, empty (no body inside).
  ```

- **들짐승의 가죽** → `assets/items/enkidu2_0.png`

  ```text
  BODY ARMOR / CLOTHING 「들짐승의 가죽」 — loot from the monster 「엔키두」. plain look; mood: reinforced, built to last. Framing: front view, torso piece only, empty (no body inside).
  ```

- **네메아 사자의 가죽** → `assets/items/heracles2_1.png`

  ```text
  BODY ARMOR / CLOTHING 「네메아 사자의 가죽」 — loot from the monster 「헤라클레스」. the most ornate and imposing piece of this set; mood: heavy, blunt, massive. Framing: front view, torso piece only, empty (no body inside).
  ```

- **하늘 황소의 어깨** → `assets/items/gilgamesh2_0.png`

  ```text
  SHOULDER GUARD 「하늘 황소의 어깨」 — loot from the monster 「길가메시」. more refined and menacing; mood: heavy, blunt, massive. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **그렌델의 팔** → `assets/items/beowulf2_0.png`

  ```text
  GLOVES / GAUNTLETS 「그렌델의 팔」 — loot from the monster 「베오울프」. more refined and menacing; mood: spiked, thorny. Framing: a pair, backs of the hands, fingers up.
  ```

- **열두 도끼를 꿰뚫은 손** → `assets/items/odysseus2_0.png`

  ```text
  GLOVES / GAUNTLETS 「열두 도끼를 꿰뚫은 손」 — loot from the monster 「오디세우스」. plain look; mood: pointed, piercing. Framing: a pair, backs of the hands, fingers up.
  ```

- **미궁의 실 허리띠** → `assets/items/theseus2_1.png`

  ```text
  BELT / SASH 「미궁의 실 허리띠」 — loot from the monster 「테세우스」. plain look; mood: pointed, piercing. Framing: laid in a loop, buckle or knot at the front.
  ```

- **뒤틀림의 각반** → `assets/items/cuchulainn2_0.png`

  ```text
  LEG ARMOR 「뒤틀림의 각반」 — loot from the monster 「쿠 훌린」. plain look; mood: heavy, blunt, massive. Framing: a pair of shin guards, front view.
  ```

- **야생의 각반** → `assets/items/enkidu2_1.png`

  ```text
  LEG ARMOR 「야생의 각반」 — loot from the monster 「엔키두」. plain look; mood: reinforced, built to last. Framing: a pair of shin guards, front view.
  ```

- **테티스가 잡았던 발목** → `assets/items/achilles2_1.png`

  ```text
  BOOTS / SHOES 「테티스가 잡았던 발목」 — loot from the monster 「아킬레우스」. plain look; mood: aggressive, sharp. Framing: a pair, side view facing right.
  ```

- **멈추지 않는 발** → `assets/items/atalanta2_0.png`

  ```text
  BOOTS / SHOES 「멈추지 않는 발」 — loot from the monster 「아탈란테」. plain look; mood: light, slim, built for speed. Framing: a pair, side view facing right.
  ```

- **전차병의 망토** → `assets/items/arjuna2_1.png`

  ```text
  CLOAK / CAPE 「전차병의 망토」 — loot from the monster 「아르주나」. plain look; mood: pointed, piercing. Framing: front view, hanging open, empty (no body inside).
  ```

- **보이지 않는 망토** → `assets/items/perseus2_1.png`

  ```text
  CLOAK / CAPE 「보이지 않는 망토」 — loot from the monster 「페르세우스」. plain look; mood: light, slim, built for speed. Framing: front view, hanging open, empty (no body inside).
  ```

- **황금 사과** → `assets/items/atalanta2_1.png`

  ```text
  RING 「황금 사과」 — loot from the monster 「아탈란테」. plain look; mood: light, slim, built for speed. Framing: single ring, 3/4 view so the band is visible.
  ```

- **아리아드네의 실타래** → `assets/items/theseus2_0.png`

  ```text
  NECKLACE / AMULET 「아리아드네의 실타래」 — loot from the monster 「테세우스」. plain look; mood: pointed, piercing. Framing: chain in a loop, pendant at the bottom center.
  ```

- **흐룬팅의 고리** → `assets/items/beowulf2_1.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「흐룬팅의 고리」 — loot from the monster 「베오울프」. more refined and menacing; mood: spiked, thorny. Framing: single band, 3/4 view.
  ```

- **뒤틀림의 팔찌** → `assets/items/cuchulainn2_1.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「뒤틀림의 팔찌」 — loot from the monster 「쿠 훌린」. plain look; mood: heavy, blunt, massive. Framing: single band, 3/4 view.
  ```

- **네메아를 꺾은 주먹** → `assets/items/heracles2_2.png`

  ```text
  SMALL PRECIOUS OBJECT (gem or relic) 「네메아를 꺾은 주먹」 — loot from the monster 「헤라클레스」. a small ancient object; the most ornate and imposing piece of this set. Framing: single small object, 3/4 view.
  ```

- **파프니르의 피** → `assets/items/siegfried2_1.png`

  ```text
  SMALL PRECIOUS OBJECT (gem or relic) 「파프니르의 피」 — loot from the monster 「지그프리트」. a small shining stone or crystal; plain look. Framing: single small object, 3/4 view.
  ```
