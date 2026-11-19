# 제7격 설화 — 장비 32개 · 시트 4장

> 자동으로 만든 파일입니다 (`node tools/cli.js images`). 손으로 고치지 마세요. 쓰는 법은 같은 폴더의 `README.md`.

## 시트 7-A — 무기 · 보조무기 · 투구 (7개)

저장할 이름: `design/images/sheets/rank07-A.png`

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
- WEAPON: whole weapon, diagonal, tip or head toward the upper right
- OFF-HAND (shield, book, lantern, orb ...): front view, slightly tilted
- HEADGEAR: 3/4 front view, empty (no head inside)

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. WEAPON 「청룡언월도」 — loot from the monster 「관우」. more refined and menacing; mood: heavy, blunt, massive.
2. WEAPON 「병법의 죽간」 — loot from the monster 「손자」. more refined and menacing; mood: sturdy, protective.
3. WEAPON 「쌍룡검」 — loot from the monster 「이순신」. the most ornate and imposing piece of this set; mood: sturdy, protective.
4. OFF-HAND (shield, book, lantern, orb ...) 「천구의」 — loot from the monster 「히파티아」. plain look; mood: light, slim, built for speed.
5. OFF-HAND (shield, book, lantern, orb ...) 「마르지 않는 뿔병」 — loot from the monster 「필경사」. plain look; mood: light, slim, built for speed.
6. OFF-HAND (shield, book, lantern, orb ...) 「검투사의 방패」 — loot from the monster 「스파르타쿠스」. more refined and menacing; mood: heavy, blunt, massive.
7. HEADGEAR 「정복자의 투구」 — loot from the monster 「알렉산드로스」. plain look; mood: aggressive, sharp.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 청룡언월도 | 무기 | 관우 | `assets/items/guanyu_0.png` |
| 2 | 병법의 죽간 | 무기 | 손자 | `assets/items/sunzi_0.png` |
| 3 | 쌍룡검 | 무기 | 이순신 | `assets/items/yisunsin_0.png` |
| 4 | 천구의 | 보조무기 | 히파티아 | `assets/items/hypatia_0.png` |
| 5 | 마르지 않는 뿔병 | 보조무기 | 필경사 | `assets/items/scribe_0.png` |
| 6 | 검투사의 방패 | 보조무기 | 스파르타쿠스 | `assets/items/spartacus_1.png` |
| 7 | 정복자의 투구 | 투구 | 알렉산드로스 | `assets/items/alexander_0.png` |

## 시트 7-B — 투구 · 갑옷 · 어깨 · 장갑 (7개)

저장할 이름: `design/images/sheets/rank07-B.png`

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
- HEADGEAR: 3/4 front view, empty (no head inside)
- BODY ARMOR / CLOTHING: front view, torso piece only, empty (no body inside)
- SHOULDER GUARD: one pauldron or a matching pair, 3/4 view
- GLOVES / GAUNTLETS: a pair, backs of the hands, fingers up

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. HEADGEAR 「기록자의 두건」 — loot from the monster 「헤로도토스」. plain look; mood: reinforced, built to last.
2. HEADGEAR 「사자 투구」 — loot from the monster 「마초」. more refined and menacing; mood: sinister, a touch of blood red.
3. BODY ARMOR / CLOTHING 「두정갑」 — loot from the monster 「이순신」. the most ornate and imposing piece of this set; mood: sturdy, protective.
4. BODY ARMOR / CLOTHING 「아두를 품은 흉갑」 — loot from the monster 「조운」. more refined and menacing; mood: sturdy, protective.
5. SHOULDER GUARD 「초원의 어깨가리개」 — loot from the monster 「칭기즈 칸」. plain look; mood: light, slim, built for speed.
6. SHOULDER GUARD 「성녀의 견갑」 — loot from the monster 「잔 다르크」. plain look; mood: aggressive, sharp.
7. GLOVES / GAUNTLETS 「잉크 물든 장갑」 — loot from the monster 「필경사」. plain look; mood: light, slim, built for speed.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 기록자의 두건 | 투구 | 헤로도토스 | `assets/items/herodotos_0.png` |
| 2 | 사자 투구 | 투구 | 마초 | `assets/items/machao_0.png` |
| 3 | 두정갑 | 갑옷 | 이순신 | `assets/items/yisunsin_1.png` |
| 4 | 아두를 품은 흉갑 | 갑옷 | 조운 | `assets/items/zhaoyun_0.png` |
| 5 | 초원의 어깨가리개 | 어깨 | 칭기즈 칸 | `assets/items/genghis_0.png` |
| 6 | 성녀의 견갑 | 어깨 | 잔 다르크 | `assets/items/joan_0.png` |
| 7 | 잉크 물든 장갑 | 장갑 | 필경사 | `assets/items/scribe_2.png` |

## 시트 7-C — 허리띠 · 각반 · 신발 · 망토 (7개)

저장할 이름: `design/images/sheets/rank07-C.png`

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
- BELT / SASH: laid in a loop, buckle or knot at the front
- LEG ARMOR: a pair of shin guards, front view
- BOOTS / SHOES: a pair, side view facing right
- CLOAK / CAPE: front view, hanging open, empty (no body inside)

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. BELT / SASH 「천 하룻밤의 띠」 — loot from the monster 「이름 없는 이야기꾼」. plain look; mood: a lucky charm, a hint of gold.
2. BELT / SASH 「술 호리병 허리띠」 — loot from the monster 「장비」. more refined and menacing; mood: aggressive, sharp.
3. LEG ARMOR 「설계도 각반」 — loot from the monster 「레오나르도 다 빈치」. plain look; mood: light, slim, built for speed.
4. BOOTS / SHOES 「비행 장치」 — loot from the monster 「레오나르도 다 빈치」. plain look; mood: light, slim, built for speed.
5. BOOTS / SHOES 「천리마의 등자」 — loot from the monster 「칭기즈 칸」. plain look; mood: light, slim, built for speed.
6. CLOAK / CAPE 「여행자의 망토」 — loot from the monster 「헤로도토스」. plain look; mood: reinforced, built to last.
7. CLOAK / CAPE 「이야기꾼의 해진 외투」 — loot from the monster 「이름 없는 이야기꾼」. plain look; mood: a lucky charm, a hint of gold.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 천 하룻밤의 띠 | 허리띠 | 이름 없는 이야기꾼 | `assets/items/storyteller_2.png` |
| 2 | 술 호리병 허리띠 | 허리띠 | 장비 | `assets/items/zhangfei_0.png` |
| 3 | 설계도 각반 | 각반 | 레오나르도 다 빈치 | `assets/items/davinci_2.png` |
| 4 | 비행 장치 | 신발 | 레오나르도 다 빈치 | `assets/items/davinci_1.png` |
| 5 | 천리마의 등자 | 신발 | 칭기즈 칸 | `assets/items/genghis_1.png` |
| 6 | 여행자의 망토 | 망토 | 헤로도토스 | `assets/items/herodotos_2.png` |
| 7 | 이야기꾼의 해진 외투 | 망토 | 이름 없는 이야기꾼 | `assets/items/storyteller_1.png` |

## 시트 7-D — 반지 · 목걸이 · 팔찌 · 특수장비 (7개)

저장할 이름: `design/images/sheets/rank07-D.png`

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
1. RING 「유레카의 원」 — loot from the monster 「아르키메데스」. plain look; mood: modest, well used.
2. RING 「노장의 깍지」 — loot from the monster 「황충」. more refined and menacing; mood: pointed, piercing.
3. NECKLACE / AMULET 「난중일기」 — loot from the monster 「이순신」. the most ornate and imposing piece of this set; mood: sturdy, protective.
4. BRACELET / BANGLE / WRISTWATCH 「천문 팔찌」 — loot from the monster 「히파티아」. plain look; mood: light, slim, built for speed.
5. SMALL PRECIOUS OBJECT (gem or relic) 「칼로 끊은 매듭」 — loot from the monster 「알렉산드로스」. a small ancient object; plain look.
6. SMALL PRECIOUS OBJECT (gem or relic) 「에메랄드 서판」 — loot from the monster 「헤르메스 트리스메기스투스」. a small ancient object; mysterious, faintly glowing.
7. SMALL PRECIOUS OBJECT (gem or relic) 「현자의 돌」 — loot from the monster 「헤르메스 트리스메기스투스」. a small shining stone or crystal; mysterious, faintly glowing.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 유레카의 원 | 반지 | 아르키메데스 | `assets/items/archimedes_1.png` |
| 2 | 노장의 깍지 | 반지 | 황충 | `assets/items/huangzhong_0.png` |
| 3 | 난중일기 | 목걸이 | 이순신 | `assets/items/yisunsin_2.png` |
| 4 | 천문 팔찌 | 팔찌 | 히파티아 | `assets/items/hypatia_2.png` |
| 5 | 칼로 끊은 매듭 | 특수장비 | 알렉산드로스 | `assets/items/alexander_4.png` |
| 6 | 에메랄드 서판 | 특수장비 | 헤르메스 트리스메기스투스 | `assets/items/trismegistus_0.png` |
| 7 | 현자의 돌 | 특수장비 | 헤르메스 트리스메기스투스 | `assets/items/trismegistus_1.png` |

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

- **청룡언월도** → `assets/items/guanyu_0.png`

  ```text
  WEAPON 「청룡언월도」 — loot from the monster 「관우」. more refined and menacing; mood: heavy, blunt, massive. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **병법의 죽간** → `assets/items/sunzi_0.png`

  ```text
  WEAPON 「병법의 죽간」 — loot from the monster 「손자」. more refined and menacing; mood: sturdy, protective. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **쌍룡검** → `assets/items/yisunsin_0.png`

  ```text
  WEAPON 「쌍룡검」 — loot from the monster 「이순신」. the most ornate and imposing piece of this set; mood: sturdy, protective. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **천구의** → `assets/items/hypatia_0.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「천구의」 — loot from the monster 「히파티아」. plain look; mood: light, slim, built for speed. Framing: front view, slightly tilted.
  ```

- **마르지 않는 뿔병** → `assets/items/scribe_0.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「마르지 않는 뿔병」 — loot from the monster 「필경사」. plain look; mood: light, slim, built for speed. Framing: front view, slightly tilted.
  ```

- **검투사의 방패** → `assets/items/spartacus_1.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「검투사의 방패」 — loot from the monster 「스파르타쿠스」. more refined and menacing; mood: heavy, blunt, massive. Framing: front view, slightly tilted.
  ```

- **정복자의 투구** → `assets/items/alexander_0.png`

  ```text
  HEADGEAR 「정복자의 투구」 — loot from the monster 「알렉산드로스」. plain look; mood: aggressive, sharp. Framing: 3/4 front view, empty (no head inside).
  ```

- **기록자의 두건** → `assets/items/herodotos_0.png`

  ```text
  HEADGEAR 「기록자의 두건」 — loot from the monster 「헤로도토스」. plain look; mood: reinforced, built to last. Framing: 3/4 front view, empty (no head inside).
  ```

- **사자 투구** → `assets/items/machao_0.png`

  ```text
  HEADGEAR 「사자 투구」 — loot from the monster 「마초」. more refined and menacing; mood: sinister, a touch of blood red. Framing: 3/4 front view, empty (no head inside).
  ```

- **두정갑** → `assets/items/yisunsin_1.png`

  ```text
  BODY ARMOR / CLOTHING 「두정갑」 — loot from the monster 「이순신」. the most ornate and imposing piece of this set; mood: sturdy, protective. Framing: front view, torso piece only, empty (no body inside).
  ```

- **아두를 품은 흉갑** → `assets/items/zhaoyun_0.png`

  ```text
  BODY ARMOR / CLOTHING 「아두를 품은 흉갑」 — loot from the monster 「조운」. more refined and menacing; mood: sturdy, protective. Framing: front view, torso piece only, empty (no body inside).
  ```

- **초원의 어깨가리개** → `assets/items/genghis_0.png`

  ```text
  SHOULDER GUARD 「초원의 어깨가리개」 — loot from the monster 「칭기즈 칸」. plain look; mood: light, slim, built for speed. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **성녀의 견갑** → `assets/items/joan_0.png`

  ```text
  SHOULDER GUARD 「성녀의 견갑」 — loot from the monster 「잔 다르크」. plain look; mood: aggressive, sharp. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **잉크 물든 장갑** → `assets/items/scribe_2.png`

  ```text
  GLOVES / GAUNTLETS 「잉크 물든 장갑」 — loot from the monster 「필경사」. plain look; mood: light, slim, built for speed. Framing: a pair, backs of the hands, fingers up.
  ```

- **천 하룻밤의 띠** → `assets/items/storyteller_2.png`

  ```text
  BELT / SASH 「천 하룻밤의 띠」 — loot from the monster 「이름 없는 이야기꾼」. plain look; mood: a lucky charm, a hint of gold. Framing: laid in a loop, buckle or knot at the front.
  ```

- **술 호리병 허리띠** → `assets/items/zhangfei_0.png`

  ```text
  BELT / SASH 「술 호리병 허리띠」 — loot from the monster 「장비」. more refined and menacing; mood: aggressive, sharp. Framing: laid in a loop, buckle or knot at the front.
  ```

- **설계도 각반** → `assets/items/davinci_2.png`

  ```text
  LEG ARMOR 「설계도 각반」 — loot from the monster 「레오나르도 다 빈치」. plain look; mood: light, slim, built for speed. Framing: a pair of shin guards, front view.
  ```

- **그림자 각반** → `assets/items/sunzi_1.png`

  ```text
  LEG ARMOR 「그림자 각반」 — loot from the monster 「손자」. more refined and menacing; mood: sturdy, protective. Framing: a pair of shin guards, front view.
  ```

- **비행 장치** → `assets/items/davinci_1.png`

  ```text
  BOOTS / SHOES 「비행 장치」 — loot from the monster 「레오나르도 다 빈치」. plain look; mood: light, slim, built for speed. Framing: a pair, side view facing right.
  ```

- **천리마의 등자** → `assets/items/genghis_1.png`

  ```text
  BOOTS / SHOES 「천리마의 등자」 — loot from the monster 「칭기즈 칸」. plain look; mood: light, slim, built for speed. Framing: a pair, side view facing right.
  ```

- **여행자의 망토** → `assets/items/herodotos_2.png`

  ```text
  CLOAK / CAPE 「여행자의 망토」 — loot from the monster 「헤로도토스」. plain look; mood: reinforced, built to last. Framing: front view, hanging open, empty (no body inside).
  ```

- **이야기꾼의 해진 외투** → `assets/items/storyteller_1.png`

  ```text
  CLOAK / CAPE 「이야기꾼의 해진 외투」 — loot from the monster 「이름 없는 이야기꾼」. plain look; mood: a lucky charm, a hint of gold. Framing: front view, hanging open, empty (no body inside).
  ```

- **유레카의 원** → `assets/items/archimedes_1.png`

  ```text
  RING 「유레카의 원」 — loot from the monster 「아르키메데스」. plain look; mood: modest, well used. Framing: single ring, 3/4 view so the band is visible.
  ```

- **노장의 깍지** → `assets/items/huangzhong_0.png`

  ```text
  RING 「노장의 깍지」 — loot from the monster 「황충」. more refined and menacing; mood: pointed, piercing. Framing: single ring, 3/4 view so the band is visible.
  ```

- **재가 되지 않는 심장** → `assets/items/joan_2.png`

  ```text
  NECKLACE / AMULET 「재가 되지 않는 심장」 — loot from the monster 「잔 다르크」. plain look; mood: aggressive, sharp. Framing: chain in a loop, pendant at the bottom center.
  ```

- **난중일기** → `assets/items/yisunsin_2.png`

  ```text
  NECKLACE / AMULET 「난중일기」 — loot from the monster 「이순신」. the most ornate and imposing piece of this set; mood: sturdy, protective. Framing: chain in a loop, pendant at the bottom center.
  ```

- **두루마리 끈 팔찌** → `assets/items/chest_library_cord.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「두루마리 끈 팔찌」 — old treasure that was buried in a chest for a long time. plain look; mood: modest, well used. Framing: single band, 3/4 view.
  ```

- **천문 팔찌** → `assets/items/hypatia_2.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「천문 팔찌」 — loot from the monster 「히파티아」. plain look; mood: light, slim, built for speed. Framing: single band, 3/4 view.
  ```

- **끊어진 족쇄** → `assets/items/spartacus_2.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「끊어진 족쇄」 — loot from the monster 「스파르타쿠스」. more refined and menacing; mood: heavy, blunt, massive. Framing: single band, 3/4 view.
  ```

- **칼로 끊은 매듭** → `assets/items/alexander_4.png`

  ```text
  SMALL PRECIOUS OBJECT (gem or relic) 「칼로 끊은 매듭」 — loot from the monster 「알렉산드로스」. a small ancient object; plain look. Framing: single small object, 3/4 view.
  ```

- **에메랄드 서판** → `assets/items/trismegistus_0.png`

  ```text
  SMALL PRECIOUS OBJECT (gem or relic) 「에메랄드 서판」 — loot from the monster 「헤르메스 트리스메기스투스」. a small ancient object; mysterious, faintly glowing. Framing: single small object, 3/4 view.
  ```

- **현자의 돌** → `assets/items/trismegistus_1.png`

  ```text
  SMALL PRECIOUS OBJECT (gem or relic) 「현자의 돌」 — loot from the monster 「헤르메스 트리스메기스투스」. a small shining stone or crystal; mysterious, faintly glowing. Framing: single small object, 3/4 view.
  ```
