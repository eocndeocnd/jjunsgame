# 제17격 태초 — 장비 22개 · 시트 3장

> 자동으로 만든 파일입니다 (`node tools/cli.js images`). 손으로 고치지 마세요. 쓰는 법은 같은 폴더의 `README.md`.

## 시트 17-A — 무기 · 보조무기 · 투구 · 갑옷 (8개)

저장할 이름: `design/images/sheets/rank17-A.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 8 separate game item icons in a 3x3 grid.

STYLE — the same for every icon:
- 16-bit pixel art, crisp 1px dark outline, limited color palette, flat shading with one highlight
- one object per icon, a simple bold silhouette that still reads at 64 px
- no text, no letters, no numbers, no labels, no frames, no grid lines, no drop shadows

BACKGROUND: one flat solid magenta (#FF00FF) everywhere. No gradient, no checkerboard, no floor.
Do not use magenta or hot pink on the items themselves.

LAYOUT: 3 columns x 3 rows of equal square cells. Exactly one item per cell, centered, filling about 70% of its cell,
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed. Leave the last 1 cell empty (plain magenta).

TIER LOOK: top-tier gear — divine or otherworldly: radiant, strange materials, a strong glow, elaborate but still one clear silhouette.

FRAMING BY TYPE:
- WEAPON: whole weapon, diagonal, tip or head toward the upper right
- OFF-HAND (shield, book, lantern, orb ...): front view, slightly tilted
- HEADGEAR: 3/4 front view, empty (no head inside)
- BODY ARMOR / CLOTHING: front view, torso piece only, empty (no body inside)

ITEMS — the names are Korean. Draw what each name describes; never write the name in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. WEAPON 「신을 삼킬 송곳니」 — loot from the monster 「펜리르」. plain look; mood: aggressive, sharp.
2. WEAPON 「꼬리에서 나온 구사나기」 — loot from the monster 「야마타노오로치」. plain look; mood: heavy, blunt, massive.
3. OFF-HAND (shield, book, lantern, orb ...) 「산을 깎은 방패」 — loot from the monster 「타이탄」. plain look; mood: sturdy, protective.
4. HEADGEAR 「밤을 삼키는 뱀 머리」 — loot from the monster 「아포피스」. plain look; mood: pointed, piercing.
5. HEADGEAR 「태초의 소라 투구」 — old treasure that was buried in a chest for a long time. plain look; mood: sturdy, protective.
6. HEADGEAR 「백 개의 뱀 머리 투구」 — loot from the monster 「티폰」. more refined and menacing; mood: aggressive, sharp.
7. BODY ARMOR / CLOTHING 「갈라진 바다의 갑주」 — loot from the monster 「티아마트」. the most ornate and imposing piece of this set; mood: spiked, thorny.
8. BODY ARMOR / CLOTHING 「물을 가둔 비늘」 — loot from the monster 「브리트라」. plain look; mood: sturdy, protective.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 신을 삼킬 송곳니 | 무기 | 펜리르 | `assets/items/fenrir_0.png` |
| 2 | 꼬리에서 나온 구사나기 | 무기 | 야마타노오로치 | `assets/items/orochi_0.png` |
| 3 | 산을 깎은 방패 | 보조무기 | 타이탄 | `assets/items/titanmyth2_0.png` |
| 4 | 밤을 삼키는 뱀 머리 | 투구 | 아포피스 | `assets/items/apophis_1.png` |
| 5 | 태초의 소라 투구 | 투구 | 보물상자 | `assets/items/chest_primordial_helm.png` |
| 6 | 백 개의 뱀 머리 투구 | 투구 | 티폰 | `assets/items/typhon_0.png` |
| 7 | 갈라진 바다의 갑주 | 갑옷 | 티아마트 | `assets/items/tiamat_0.png` |
| 8 | 물을 가둔 비늘 | 갑옷 | 브리트라 | `assets/items/vritra_0.png` |

## 시트 17-B — 어깨 · 장갑 · 허리띠 · 각반 (7개)

저장할 이름: `design/images/sheets/rank17-B.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 7 separate game item icons in a 3x3 grid.

STYLE — the same for every icon:
- 16-bit pixel art, crisp 1px dark outline, limited color palette, flat shading with one highlight
- one object per icon, a simple bold silhouette that still reads at 64 px
- no text, no letters, no numbers, no labels, no frames, no grid lines, no drop shadows

BACKGROUND: one flat solid magenta (#FF00FF) everywhere. No gradient, no checkerboard, no floor.
Do not use magenta or hot pink on the items themselves.

LAYOUT: 3 columns x 3 rows of equal square cells. Exactly one item per cell, centered, filling about 70% of its cell,
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed. Leave the last 2 cells empty (plain magenta).

TIER LOOK: top-tier gear — divine or otherworldly: radiant, strange materials, a strong glow, elaborate but still one clear silhouette.

FRAMING BY TYPE:
- SHOULDER GUARD: one pauldron or a matching pair, 3/4 view
- GLOVES / GAUNTLETS: a pair, backs of the hands, fingers up
- BELT / SASH: laid in a loop, buckle or knot at the front
- LEG ARMOR: a pair of shin guards, front view

ITEMS — the names are Korean. Draw what each name describes; never write the name in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. SHOULDER GUARD 「해일의 지느러미」 — loot from the monster 「리바이어던」. more refined and menacing; mood: heavy, blunt, massive.
2. SHOULDER GUARD 「산맥이 된 어깨」 — loot from the monster 「이미르」. more refined and menacing; mood: modest, well used.
3. GLOVES / GAUNTLETS 「제우스의 힘줄을 끊은 손」 — loot from the monster 「티폰」. more refined and menacing; mood: aggressive, sharp.
4. GLOVES / GAUNTLETS 「강을 막은 발톱」 — loot from the monster 「브리트라」. plain look; mood: sturdy, protective.
5. BELT / SASH 「세계를 감은 비늘 띠」 — loot from the monster 「요르문간드」. plain look; mood: sinister, a touch of blood red.
6. LEG ARMOR 「대지의 각반」 — loot from the monster 「베히모스」. more refined and menacing; mood: reinforced, built to last.
7. LEG ARMOR 「거인의 각반」 — loot from the monster 「타이탄」. plain look; mood: sturdy, protective.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 해일의 지느러미 | 어깨 | 리바이어던 | `assets/items/leviathan2_0.png` |
| 2 | 산맥이 된 어깨 | 어깨 | 이미르 | `assets/items/ymir_0.png` |
| 3 | 제우스의 힘줄을 끊은 손 | 장갑 | 티폰 | `assets/items/typhon_1.png` |
| 4 | 강을 막은 발톱 | 장갑 | 브리트라 | `assets/items/vritra_1.png` |
| 5 | 세계를 감은 비늘 띠 | 허리띠 | 요르문간드 | `assets/items/jormungandr_0.png` |
| 6 | 대지의 각반 | 각반 | 베히모스 | `assets/items/behemoth2_0.png` |
| 7 | 거인의 각반 | 각반 | 타이탄 | `assets/items/titanmyth2_1.png` |

## 시트 17-C — 신발 · 망토 · 반지 · 목걸이 · 팔찌 (7개)

저장할 이름: `design/images/sheets/rank17-C.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 7 separate game item icons in a 3x3 grid.

STYLE — the same for every icon:
- 16-bit pixel art, crisp 1px dark outline, limited color palette, flat shading with one highlight
- one object per icon, a simple bold silhouette that still reads at 64 px
- no text, no letters, no numbers, no labels, no frames, no grid lines, no drop shadows

BACKGROUND: one flat solid magenta (#FF00FF) everywhere. No gradient, no checkerboard, no floor.
Do not use magenta or hot pink on the items themselves.

LAYOUT: 3 columns x 3 rows of equal square cells. Exactly one item per cell, centered, filling about 70% of its cell,
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed. Leave the last 2 cells empty (plain magenta).

TIER LOOK: top-tier gear — divine or otherworldly: radiant, strange materials, a strong glow, elaborate but still one clear silhouette.

FRAMING BY TYPE:
- BOOTS / SHOES: a pair, side view facing right
- CLOAK / CAPE: front view, hanging open, empty (no body inside)
- RING: single ring, 3/4 view so the band is visible
- NECKLACE / AMULET: chain in a loop, pendant at the bottom center
- BRACELET / BANGLE / WRISTWATCH: single band, 3/4 view

ITEMS — the names are Korean. Draw what each name describes; never write the name in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. BOOTS / SHOES 「하늘 덮는 신」 — loot from the monster 「지즈」. more refined and menacing; mood: light, slim, built for speed.
2. CLOAK / CAPE 「해를 가리는 비늘 망토」 — loot from the monster 「아포피스」. plain look; mood: pointed, piercing.
3. RING 「제 꼬리를 문 고리」 — loot from the monster 「요르문간드」. plain look; mood: sinister, a touch of blood red.
4. NECKLACE / AMULET 「운명의 서판」 — loot from the monster 「티아마트」. the most ornate and imposing piece of this set; mood: spiked, thorny.
5. NECKLACE / AMULET 「서리 거인의 심장」 — loot from the monster 「이미르」. more refined and menacing; mood: modest, well used.
6. BRACELET / BANGLE / WRISTWATCH 「글레이프니르 족쇄」 — loot from the monster 「펜리르」. plain look; mood: aggressive, sharp.
7. BRACELET / BANGLE / WRISTWATCH 「열한 괴물의 팔찌」 — loot from the monster 「티아마트」. the most ornate and imposing piece of this set; mood: spiked, thorny.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 하늘 덮는 신 | 신발 | 지즈 | `assets/items/ziz2_0.png` |
| 2 | 해를 가리는 비늘 망토 | 망토 | 아포피스 | `assets/items/apophis_0.png` |
| 3 | 제 꼬리를 문 고리 | 반지 | 요르문간드 | `assets/items/jormungandr_1.png` |
| 4 | 운명의 서판 | 목걸이 | 티아마트 | `assets/items/tiamat_1.png` |
| 5 | 서리 거인의 심장 | 목걸이 | 이미르 | `assets/items/ymir_1.png` |
| 6 | 글레이프니르 족쇄 | 팔찌 | 펜리르 | `assets/items/fenrir_1.png` |
| 7 | 열한 괴물의 팔찌 | 팔찌 | 티아마트 | `assets/items/tiamat_2.png` |

## 하나씩 뽑기 (시트가 잘 안 될 때)

아래 「앞에 붙일 말」 뒤에 장비 한 줄을 붙여 보냅니다. 나온 그림은 표의 「잘라서 둘 곳」 이름으로 저장합니다 (배경은 나중에 도구가 걷어냅니다).

앞에 붙일 말:

```text
Make ONE square image, 1024x1024: a single game item icon.

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

- **신을 삼킬 송곳니** → `assets/items/fenrir_0.png`

  ```text
  WEAPON 「신을 삼킬 송곳니」 — loot from the monster 「펜리르」. plain look; mood: aggressive, sharp. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **꼬리에서 나온 구사나기** → `assets/items/orochi_0.png`

  ```text
  WEAPON 「꼬리에서 나온 구사나기」 — loot from the monster 「야마타노오로치」. plain look; mood: heavy, blunt, massive. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **산을 깎은 방패** → `assets/items/titanmyth2_0.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「산을 깎은 방패」 — loot from the monster 「타이탄」. plain look; mood: sturdy, protective. Framing: front view, slightly tilted.
  ```

- **밤을 삼키는 뱀 머리** → `assets/items/apophis_1.png`

  ```text
  HEADGEAR 「밤을 삼키는 뱀 머리」 — loot from the monster 「아포피스」. plain look; mood: pointed, piercing. Framing: 3/4 front view, empty (no head inside).
  ```

- **태초의 소라 투구** → `assets/items/chest_primordial_helm.png`

  ```text
  HEADGEAR 「태초의 소라 투구」 — old treasure that was buried in a chest for a long time. plain look; mood: sturdy, protective. Framing: 3/4 front view, empty (no head inside).
  ```

- **백 개의 뱀 머리 투구** → `assets/items/typhon_0.png`

  ```text
  HEADGEAR 「백 개의 뱀 머리 투구」 — loot from the monster 「티폰」. more refined and menacing; mood: aggressive, sharp. Framing: 3/4 front view, empty (no head inside).
  ```

- **갈라진 바다의 갑주** → `assets/items/tiamat_0.png`

  ```text
  BODY ARMOR / CLOTHING 「갈라진 바다의 갑주」 — loot from the monster 「티아마트」. the most ornate and imposing piece of this set; mood: spiked, thorny. Framing: front view, torso piece only, empty (no body inside).
  ```

- **물을 가둔 비늘** → `assets/items/vritra_0.png`

  ```text
  BODY ARMOR / CLOTHING 「물을 가둔 비늘」 — loot from the monster 「브리트라」. plain look; mood: sturdy, protective. Framing: front view, torso piece only, empty (no body inside).
  ```

- **해일의 지느러미** → `assets/items/leviathan2_0.png`

  ```text
  SHOULDER GUARD 「해일의 지느러미」 — loot from the monster 「리바이어던」. more refined and menacing; mood: heavy, blunt, massive. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **산맥이 된 어깨** → `assets/items/ymir_0.png`

  ```text
  SHOULDER GUARD 「산맥이 된 어깨」 — loot from the monster 「이미르」. more refined and menacing; mood: modest, well used. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **제우스의 힘줄을 끊은 손** → `assets/items/typhon_1.png`

  ```text
  GLOVES / GAUNTLETS 「제우스의 힘줄을 끊은 손」 — loot from the monster 「티폰」. more refined and menacing; mood: aggressive, sharp. Framing: a pair, backs of the hands, fingers up.
  ```

- **강을 막은 발톱** → `assets/items/vritra_1.png`

  ```text
  GLOVES / GAUNTLETS 「강을 막은 발톱」 — loot from the monster 「브리트라」. plain look; mood: sturdy, protective. Framing: a pair, backs of the hands, fingers up.
  ```

- **세계를 감은 비늘 띠** → `assets/items/jormungandr_0.png`

  ```text
  BELT / SASH 「세계를 감은 비늘 띠」 — loot from the monster 「요르문간드」. plain look; mood: sinister, a touch of blood red. Framing: laid in a loop, buckle or knot at the front.
  ```

- **대지의 각반** → `assets/items/behemoth2_0.png`

  ```text
  LEG ARMOR 「대지의 각반」 — loot from the monster 「베히모스」. more refined and menacing; mood: reinforced, built to last. Framing: a pair of shin guards, front view.
  ```

- **거인의 각반** → `assets/items/titanmyth2_1.png`

  ```text
  LEG ARMOR 「거인의 각반」 — loot from the monster 「타이탄」. plain look; mood: sturdy, protective. Framing: a pair of shin guards, front view.
  ```

- **하늘 덮는 신** → `assets/items/ziz2_0.png`

  ```text
  BOOTS / SHOES 「하늘 덮는 신」 — loot from the monster 「지즈」. more refined and menacing; mood: light, slim, built for speed. Framing: a pair, side view facing right.
  ```

- **해를 가리는 비늘 망토** → `assets/items/apophis_0.png`

  ```text
  CLOAK / CAPE 「해를 가리는 비늘 망토」 — loot from the monster 「아포피스」. plain look; mood: pointed, piercing. Framing: front view, hanging open, empty (no body inside).
  ```

- **제 꼬리를 문 고리** → `assets/items/jormungandr_1.png`

  ```text
  RING 「제 꼬리를 문 고리」 — loot from the monster 「요르문간드」. plain look; mood: sinister, a touch of blood red. Framing: single ring, 3/4 view so the band is visible.
  ```

- **운명의 서판** → `assets/items/tiamat_1.png`

  ```text
  NECKLACE / AMULET 「운명의 서판」 — loot from the monster 「티아마트」. the most ornate and imposing piece of this set; mood: spiked, thorny. Framing: chain in a loop, pendant at the bottom center.
  ```

- **서리 거인의 심장** → `assets/items/ymir_1.png`

  ```text
  NECKLACE / AMULET 「서리 거인의 심장」 — loot from the monster 「이미르」. more refined and menacing; mood: modest, well used. Framing: chain in a loop, pendant at the bottom center.
  ```

- **글레이프니르 족쇄** → `assets/items/fenrir_1.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「글레이프니르 족쇄」 — loot from the monster 「펜리르」. plain look; mood: aggressive, sharp. Framing: single band, 3/4 view.
  ```

- **열한 괴물의 팔찌** → `assets/items/tiamat_2.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「열한 괴물의 팔찌」 — loot from the monster 「티아마트」. the most ornate and imposing piece of this set; mood: spiked, thorny. Framing: single band, 3/4 view.
  ```
