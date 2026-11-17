# 제14격 천사 — 장비 27개 · 시트 3장

> 자동으로 만든 파일입니다 (`node tools/cli.js images`). 손으로 고치지 마세요. 쓰는 법은 같은 폴더의 `README.md`.

## 시트 14-A — 무기 · 보조무기 · 투구 · 갑옷 (9개)

저장할 이름: `design/images/sheets/rank14-A.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 9 separate game item icons in a 3x3 grid.

STYLE — the same for every icon:
- 16-bit pixel art, crisp 1px dark outline, limited color palette, flat shading with one highlight
- one object per icon, a simple bold silhouette that still reads at 64 px
- no text, no letters, no numbers, no labels, no frames, no grid lines, no drop shadows

BACKGROUND: one flat solid magenta (#FF00FF) everywhere. No gradient, no checkerboard, no floor.
Do not use magenta or hot pink on the items themselves.

LAYOUT: 3 columns x 3 rows of equal square cells. Exactly one item per cell, centered, filling about 70% of its cell,
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed.

TIER LOOK: top-tier gear — divine or otherworldly: radiant, strange materials, a strong glow, elaborate but still one clear silhouette.

FRAMING BY TYPE:
- WEAPON: whole weapon, diagonal, tip or head toward the upper right
- OFF-HAND (shield, book, lantern, orb ...): front view, slightly tilted
- HEADGEAR: 3/4 front view, empty (no head inside)
- BODY ARMOR / CLOTHING: front view, torso piece only, empty (no body inside)

ITEMS — the names are Korean. Draw what each name describes; never write the name in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. WEAPON 「두루 도는 불칼」 — loot from the monster 「지품천사」. plain look; mood: sturdy, protective.
2. WEAPON 「용을 떨어뜨린 검」 — loot from the monster 「미카엘」. the most ornate and imposing piece of this set; mood: heavy, blunt, massive.
3. WEAPON 「악을 쫓는 창」 — loot from the monster 「능천사」. plain look; mood: aggressive, sharp.
4. OFF-HAND (shield, book, lantern, orb ...) 「마지막 나팔」 — loot from the monster 「가브리엘」. more refined and menacing; mood: modest, well used.
5. OFF-HAND (shield, book, lantern, orb ...) 「첫째 나팔」 — loot from the monster 「나팔의 천사」. plain look; mood: light, slim, built for speed.
6. HEADGEAR 「나라를 맡은 관」 — loot from the monster 「권천사」. plain look; mood: sturdy, protective.
7. HEADGEAR 「눈으로 가득한 관」 — loot from the monster 「좌천사」. plain look; mood: spiked, thorny.
8. BODY ARMOR / CLOTHING 「다스림의 흉갑」 — loot from the monster 「주천사」. plain look; mood: heavy, blunt, massive.
9. BODY ARMOR / CLOTHING 「천군의 갑주」 — loot from the monster 「미카엘」. the most ornate and imposing piece of this set; mood: heavy, blunt, massive.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 두루 도는 불칼 | 무기 | 지품천사 | `assets/items/cherub2_0.png` |
| 2 | 용을 떨어뜨린 검 | 무기 | 미카엘 | `assets/items/michael2_0.png` |
| 3 | 악을 쫓는 창 | 무기 | 능천사 | `assets/items/powerangel2_0.png` |
| 4 | 마지막 나팔 | 보조무기 | 가브리엘 | `assets/items/gabriel2_0.png` |
| 5 | 첫째 나팔 | 보조무기 | 나팔의 천사 | `assets/items/trumpetangel2_0.png` |
| 6 | 나라를 맡은 관 | 투구 | 권천사 | `assets/items/principality2_0.png` |
| 7 | 눈으로 가득한 관 | 투구 | 좌천사 | `assets/items/throneangel2_1.png` |
| 8 | 다스림의 흉갑 | 갑옷 | 주천사 | `assets/items/dominion2_0.png` |
| 9 | 천군의 갑주 | 갑옷 | 미카엘 | `assets/items/michael2_1.png` |

## 시트 14-B — 어깨 · 장갑 · 허리띠 · 각반 · 신발 (9개)

저장할 이름: `design/images/sheets/rank14-B.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 9 separate game item icons in a 3x3 grid.

STYLE — the same for every icon:
- 16-bit pixel art, crisp 1px dark outline, limited color palette, flat shading with one highlight
- one object per icon, a simple bold silhouette that still reads at 64 px
- no text, no letters, no numbers, no labels, no frames, no grid lines, no drop shadows

BACKGROUND: one flat solid magenta (#FF00FF) everywhere. No gradient, no checkerboard, no floor.
Do not use magenta or hot pink on the items themselves.

LAYOUT: 3 columns x 3 rows of equal square cells. Exactly one item per cell, centered, filling about 70% of its cell,
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed.

TIER LOOK: top-tier gear — divine or otherworldly: radiant, strange materials, a strong glow, elaborate but still one clear silhouette.

FRAMING BY TYPE:
- SHOULDER GUARD: one pauldron or a matching pair, 3/4 view
- GLOVES / GAUNTLETS: a pair, backs of the hands, fingers up
- BELT / SASH: laid in a loop, buckle or knot at the front
- LEG ARMOR: a pair of shin guards, front view
- BOOTS / SHOES: a pair, side view facing right

ITEMS — the names are Korean. Draw what each name describes; never write the name in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. SHOULDER GUARD 「네 얼굴의 견갑」 — loot from the monster 「지품천사」. plain look; mood: sturdy, protective.
2. SHOULDER GUARD 「능천사의 견갑」 — loot from the monster 「능천사」. plain look; mood: aggressive, sharp.
3. GLOVES / GAUNTLETS 「불꽃을 쥔 손」 — loot from the monster 「우리엘」. more refined and menacing; mood: pointed, piercing.
4. GLOVES / GAUNTLETS 「기적을 행하는 손」 — loot from the monster 「역천사」. plain look; mood: a lucky charm, a hint of gold.
5. BELT / SASH 「홀을 찬 띠」 — loot from the monster 「권천사」. plain look; mood: sturdy, protective.
6. LEG ARMOR 「일으켜 세우는 각반」 — loot from the monster 「레미엘」. more refined and menacing; mood: reinforced, built to last.
7. LEG ARMOR 「바퀴 속의 바퀴」 — loot from the monster 「좌천사」. plain look; mood: spiked, thorny.
8. BOOTS / SHOES 「달의 길을 걷는 신」 — loot from the monster 「사리엘」. more refined and menacing; mood: light, slim, built for speed.
9. BOOTS / SHOES 「구름 디딤 신」 — loot from the monster 「나팔의 천사」. plain look; mood: light, slim, built for speed.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 네 얼굴의 견갑 | 어깨 | 지품천사 | `assets/items/cherub2_1.png` |
| 2 | 능천사의 견갑 | 어깨 | 능천사 | `assets/items/powerangel2_1.png` |
| 3 | 불꽃을 쥔 손 | 장갑 | 우리엘 | `assets/items/uriel_0.png` |
| 4 | 기적을 행하는 손 | 장갑 | 역천사 | `assets/items/virtueangel2_1.png` |
| 5 | 홀을 찬 띠 | 허리띠 | 권천사 | `assets/items/principality2_1.png` |
| 6 | 일으켜 세우는 각반 | 각반 | 레미엘 | `assets/items/remiel_0.png` |
| 7 | 바퀴 속의 바퀴 | 각반 | 좌천사 | `assets/items/throneangel2_0.png` |
| 8 | 달의 길을 걷는 신 | 신발 | 사리엘 | `assets/items/sariel_0.png` |
| 9 | 구름 디딤 신 | 신발 | 나팔의 천사 | `assets/items/trumpetangel2_1.png` |

## 시트 14-C — 망토 · 반지 · 목걸이 · 팔찌 · 특수장비 (9개)

저장할 이름: `design/images/sheets/rank14-C.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 9 separate game item icons in a 3x3 grid.

STYLE — the same for every icon:
- 16-bit pixel art, crisp 1px dark outline, limited color palette, flat shading with one highlight
- one object per icon, a simple bold silhouette that still reads at 64 px
- no text, no letters, no numbers, no labels, no frames, no grid lines, no drop shadows

BACKGROUND: one flat solid magenta (#FF00FF) everywhere. No gradient, no checkerboard, no floor.
Do not use magenta or hot pink on the items themselves.

LAYOUT: 3 columns x 3 rows of equal square cells. Exactly one item per cell, centered, filling about 70% of its cell,
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed.

TIER LOOK: top-tier gear — divine or otherworldly: radiant, strange materials, a strong glow, elaborate but still one clear silhouette.

FRAMING BY TYPE:
- CLOAK / CAPE: front view, hanging open, empty (no body inside)
- RING: single ring, 3/4 view so the band is visible
- NECKLACE / AMULET: chain in a loop, pendant at the bottom center
- BRACELET / BANGLE / WRISTWATCH: single band, 3/4 view
- SMALL PRECIOUS OBJECT (gem or relic): single small object, 3/4 view

ITEMS — the names are Korean. Draw what each name describes; never write the name in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. CLOAK / CAPE 「일곱째 하늘의 깃털 외투」 — old treasure that was buried in a chest for a long time. plain look; mood: reinforced, built to last.
2. CLOAK / CAPE 「깃털 한 장의 망토」 — loot from the monster 「수호천사」. plain look; mood: reinforced, built to last.
3. CLOAK / CAPE 「여섯 날개」 — loot from the monster 「치품천사」. plain look; mood: aggressive, sharp.
4. RING 「지켜보는 반지」 — loot from the monster 「수호천사」. plain look; mood: reinforced, built to last.
5. NECKLACE / AMULET 「주권의 목걸이」 — loot from the monster 「주천사」. plain look; mood: heavy, blunt, massive.
6. NECKLACE / AMULET 「토비트의 물고기」 — loot from the monster 「라파엘」. more refined and menacing; mood: reinforced, built to last.
7. BRACELET / BANGLE / WRISTWATCH 「빛을 다스리는 팔찌」 — loot from the monster 「라구엘」. more refined and menacing; mood: sturdy, protective.
8. BRACELET / BANGLE / WRISTWATCH 「기적의 팔찌」 — loot from the monster 「역천사」. plain look; mood: a lucky charm, a hint of gold.
9. SMALL PRECIOUS OBJECT (gem or relic) 「미카엘의 저울」 — loot from the monster 「미카엘」. a small ancient object; the most ornate and imposing piece of this set.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 일곱째 하늘의 깃털 외투 | 망토 | 보물상자 | `assets/items/chest_heaven_cloak.png` |
| 2 | 깃털 한 장의 망토 | 망토 | 수호천사 | `assets/items/guardianangel2_0.png` |
| 3 | 여섯 날개 | 망토 | 치품천사 | `assets/items/seraph2_0.png` |
| 4 | 지켜보는 반지 | 반지 | 수호천사 | `assets/items/guardianangel2_1.png` |
| 5 | 주권의 목걸이 | 목걸이 | 주천사 | `assets/items/dominion2_1.png` |
| 6 | 토비트의 물고기 | 목걸이 | 라파엘 | `assets/items/raphael2_0.png` |
| 7 | 빛을 다스리는 팔찌 | 팔찌 | 라구엘 | `assets/items/raguel_0.png` |
| 8 | 기적의 팔찌 | 팔찌 | 역천사 | `assets/items/virtueangel2_0.png` |
| 9 | 미카엘의 저울 | 특수장비 | 미카엘 | `assets/items/michael2_2.png` |

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

- **두루 도는 불칼** → `assets/items/cherub2_0.png`

  ```text
  WEAPON 「두루 도는 불칼」 — loot from the monster 「지품천사」. plain look; mood: sturdy, protective. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **용을 떨어뜨린 검** → `assets/items/michael2_0.png`

  ```text
  WEAPON 「용을 떨어뜨린 검」 — loot from the monster 「미카엘」. the most ornate and imposing piece of this set; mood: heavy, blunt, massive. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **악을 쫓는 창** → `assets/items/powerangel2_0.png`

  ```text
  WEAPON 「악을 쫓는 창」 — loot from the monster 「능천사」. plain look; mood: aggressive, sharp. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **마지막 나팔** → `assets/items/gabriel2_0.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「마지막 나팔」 — loot from the monster 「가브리엘」. more refined and menacing; mood: modest, well used. Framing: front view, slightly tilted.
  ```

- **첫째 나팔** → `assets/items/trumpetangel2_0.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「첫째 나팔」 — loot from the monster 「나팔의 천사」. plain look; mood: light, slim, built for speed. Framing: front view, slightly tilted.
  ```

- **나라를 맡은 관** → `assets/items/principality2_0.png`

  ```text
  HEADGEAR 「나라를 맡은 관」 — loot from the monster 「권천사」. plain look; mood: sturdy, protective. Framing: 3/4 front view, empty (no head inside).
  ```

- **눈으로 가득한 관** → `assets/items/throneangel2_1.png`

  ```text
  HEADGEAR 「눈으로 가득한 관」 — loot from the monster 「좌천사」. plain look; mood: spiked, thorny. Framing: 3/4 front view, empty (no head inside).
  ```

- **다스림의 흉갑** → `assets/items/dominion2_0.png`

  ```text
  BODY ARMOR / CLOTHING 「다스림의 흉갑」 — loot from the monster 「주천사」. plain look; mood: heavy, blunt, massive. Framing: front view, torso piece only, empty (no body inside).
  ```

- **천군의 갑주** → `assets/items/michael2_1.png`

  ```text
  BODY ARMOR / CLOTHING 「천군의 갑주」 — loot from the monster 「미카엘」. the most ornate and imposing piece of this set; mood: heavy, blunt, massive. Framing: front view, torso piece only, empty (no body inside).
  ```

- **네 얼굴의 견갑** → `assets/items/cherub2_1.png`

  ```text
  SHOULDER GUARD 「네 얼굴의 견갑」 — loot from the monster 「지품천사」. plain look; mood: sturdy, protective. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **능천사의 견갑** → `assets/items/powerangel2_1.png`

  ```text
  SHOULDER GUARD 「능천사의 견갑」 — loot from the monster 「능천사」. plain look; mood: aggressive, sharp. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **불꽃을 쥔 손** → `assets/items/uriel_0.png`

  ```text
  GLOVES / GAUNTLETS 「불꽃을 쥔 손」 — loot from the monster 「우리엘」. more refined and menacing; mood: pointed, piercing. Framing: a pair, backs of the hands, fingers up.
  ```

- **기적을 행하는 손** → `assets/items/virtueangel2_1.png`

  ```text
  GLOVES / GAUNTLETS 「기적을 행하는 손」 — loot from the monster 「역천사」. plain look; mood: a lucky charm, a hint of gold. Framing: a pair, backs of the hands, fingers up.
  ```

- **홀을 찬 띠** → `assets/items/principality2_1.png`

  ```text
  BELT / SASH 「홀을 찬 띠」 — loot from the monster 「권천사」. plain look; mood: sturdy, protective. Framing: laid in a loop, buckle or knot at the front.
  ```

- **일으켜 세우는 각반** → `assets/items/remiel_0.png`

  ```text
  LEG ARMOR 「일으켜 세우는 각반」 — loot from the monster 「레미엘」. more refined and menacing; mood: reinforced, built to last. Framing: a pair of shin guards, front view.
  ```

- **바퀴 속의 바퀴** → `assets/items/throneangel2_0.png`

  ```text
  LEG ARMOR 「바퀴 속의 바퀴」 — loot from the monster 「좌천사」. plain look; mood: spiked, thorny. Framing: a pair of shin guards, front view.
  ```

- **달의 길을 걷는 신** → `assets/items/sariel_0.png`

  ```text
  BOOTS / SHOES 「달의 길을 걷는 신」 — loot from the monster 「사리엘」. more refined and menacing; mood: light, slim, built for speed. Framing: a pair, side view facing right.
  ```

- **구름 디딤 신** → `assets/items/trumpetangel2_1.png`

  ```text
  BOOTS / SHOES 「구름 디딤 신」 — loot from the monster 「나팔의 천사」. plain look; mood: light, slim, built for speed. Framing: a pair, side view facing right.
  ```

- **일곱째 하늘의 깃털 외투** → `assets/items/chest_heaven_cloak.png`

  ```text
  CLOAK / CAPE 「일곱째 하늘의 깃털 외투」 — old treasure that was buried in a chest for a long time. plain look; mood: reinforced, built to last. Framing: front view, hanging open, empty (no body inside).
  ```

- **깃털 한 장의 망토** → `assets/items/guardianangel2_0.png`

  ```text
  CLOAK / CAPE 「깃털 한 장의 망토」 — loot from the monster 「수호천사」. plain look; mood: reinforced, built to last. Framing: front view, hanging open, empty (no body inside).
  ```

- **여섯 날개** → `assets/items/seraph2_0.png`

  ```text
  CLOAK / CAPE 「여섯 날개」 — loot from the monster 「치품천사」. plain look; mood: aggressive, sharp. Framing: front view, hanging open, empty (no body inside).
  ```

- **지켜보는 반지** → `assets/items/guardianangel2_1.png`

  ```text
  RING 「지켜보는 반지」 — loot from the monster 「수호천사」. plain look; mood: reinforced, built to last. Framing: single ring, 3/4 view so the band is visible.
  ```

- **주권의 목걸이** → `assets/items/dominion2_1.png`

  ```text
  NECKLACE / AMULET 「주권의 목걸이」 — loot from the monster 「주천사」. plain look; mood: heavy, blunt, massive. Framing: chain in a loop, pendant at the bottom center.
  ```

- **토비트의 물고기** → `assets/items/raphael2_0.png`

  ```text
  NECKLACE / AMULET 「토비트의 물고기」 — loot from the monster 「라파엘」. more refined and menacing; mood: reinforced, built to last. Framing: chain in a loop, pendant at the bottom center.
  ```

- **빛을 다스리는 팔찌** → `assets/items/raguel_0.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「빛을 다스리는 팔찌」 — loot from the monster 「라구엘」. more refined and menacing; mood: sturdy, protective. Framing: single band, 3/4 view.
  ```

- **기적의 팔찌** → `assets/items/virtueangel2_0.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「기적의 팔찌」 — loot from the monster 「역천사」. plain look; mood: a lucky charm, a hint of gold. Framing: single band, 3/4 view.
  ```

- **미카엘의 저울** → `assets/items/michael2_2.png`

  ```text
  SMALL PRECIOUS OBJECT (gem or relic) 「미카엘의 저울」 — loot from the monster 「미카엘」. a small ancient object; the most ornate and imposing piece of this set. Framing: single small object, 3/4 view.
  ```
