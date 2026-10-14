# 그림 목록 (AI 이미지 생성용)

> 이 문서와 `image-manifest.json` 은 `tools/export-images.html` (또는 `node tools/cli.js images`) 로 만든 것입니다. 손으로 고치지 마세요 — 적이나 전리품이 바뀌면 다시 뽑아야 합니다.

게임에 필요한 그림 전부의 목록입니다. 기계가 읽는 전체 데이터는 `image-manifest.json` 이고, 이 문서는 같은 내용을 격(지역)별로 묶은 안내입니다.

## 공통 규칙

- **형식**: PNG 또는 WebP, 배경은 진짜 투명(체크무늬 무늬 넣지 말 것)
- **몬스터**: 512x512, 전신, 가운데 정렬, 발 밑 약한 그림자 가능. 전투 초상(정사각 칸)과 화신 그림으로 같이 씀. 작게 줄여도 알아볼 실루엣이 중요.
- **전리품**: 256x256, 물건 하나만 가운데에. 화면에서는 58~72px 정사각 칸에 contain 으로 들어감 → 단순하고 굵은 실루엣. 64x64 격자로 그려 4배 확대(nearest-neighbor)를 권장.
- **화풍**: 16-bit pixel art, crisp 1px dark outline, limited color palette, centered, no text, transparent background
- **일관성**: 같은 부위의 물건끼리 시점/비율을 통일(옆모습 또는 3/4 정면). 격이 높을수록 화려하게: 1~3격은 거칠고 소박, 4~6격은 금속·마석, 7격부터는 신화적 장식.
- **세계관**: 현대 지구 위에 이상현상(균열 속 공간)이 생긴 세계. 소지품(상인 물건)은 현대 일상용품(안전모, 손전등, 등산화 등). 그 밖의 적/전리품은 판타지·신화풍.
- **주의**: 누구의 소지품인지, 상인이 누구인지, 무명이 누구인지 등 정체를 설명하는 요소는 그림에 넣지 말 것. 다른 작품의 고유 용어나 요소는 넣지 말 것.
- **저장 경로**: 몬스터 `assets/monsters/<id>.png` · 전리품 `assets/items/<id>.png` (id 는 아래 표와 json 의 id)

## 개수

- 몬스터 192개 (일반 136 · 정예 36 · 히든 5 · 보스 15) — 이 중 **화신 114명**은 몬스터 그림을 화신 그림으로도 씁니다
- 전리품 528개 — 부위별: weapon 66 · offhand 33 · helm 43 · armor 51 · shoulder 30 · gloves 28 · belt 23 · greaves 35 · boots 40 · cloak 35 · ring 32 · necklace 48 · bracelet 41 · special 23

## 그 밖의 그림

- **hero_fresh** — 주인공 — 기본 차림 (재킷에 가방을 멘 헌터) (있음) → `assets/hero/hunter.webp` — 지금은 체크무늬 배경이 박힌 그림을 코드가 걷어냄. 진짜 투명 PNG 로 바꾸면 처리 불필요
- **hero_worn** — 주인공 — 마왕을 지난 뒤 해진 차림 (있음) → `assets/hero/hunter-worn.webp` — 위와 같은 포즈 · 같은 인물, 옷만 해진 것
- **merchant** — 떠돌이 상인 초상 (아직 없음, 이모티콘 🎒) (필요) → `assets/other/merchant.png`
- **avatar_art_slot** — 화신 그림 — 화신(몬스터) 그림을 그대로 씁니다. 화신 단추 · 화신 얻는 창의 그림 칸 (몬스터 그림과 같음) → `(monsters 의 그림 재사용)` — 7격 이상 적 113명 + 무명. 화신 창에서는 정사각 칸에 contain 으로 들어갑니다

---

## 제1격 잡졸 — 초심자의 지하수로

> 누구나 여기서 시작한다. 여기서 끝나는 자도 많다.

### 슬라임 `slime` — 일반

- 설명: 가장 만만한 것 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/slime.png` (지금은 🟢)
- 프롬프트: 슬라임 — 가장 만만한 것. 초심자의 지하수로(제1격 잡졸)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `slime_0` **녹슨 단검** (weapon) → `assets/items/slime_0.png`
  - `slime_1` **점액 묻은 천옷** (armor) → `assets/items/slime_1.png`

### 자이언트 랫 `giantrat` — 일반

- 설명: 수로에 사는 것 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/giantrat.png` (지금은 🐀)
- 프롬프트: 자이언트 랫 — 수로에 사는 것. 초심자의 지하수로(제1격 잡졸)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `giantrat_0` **쥐가죽 신** (boots) → `assets/items/giantrat_0.png`
  - `giantrat_1` **이빨 목걸이** (ring) → `assets/items/giantrat_1.png`

### 고블린 `goblin` — 일반

- 설명: 떼로 몰려다니는 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/goblin.png` (지금은 👺)
- 프롬프트: 고블린 — 떼로 몰려다니는. 초심자의 지하수로(제1격 잡졸)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `goblin_0` **고블린 손도끼** (weapon) → `assets/items/goblin_0.png`
  - `goblin_1` **찌그러진 투구** (helm) → `assets/items/goblin_1.png`
  - `goblin_2` **고블린 손싸개** (gloves) → `assets/items/goblin_2.png`

### 코볼트 `kobold` — 일반

- 설명: 함정을 파는 것 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/kobold.png` (지금은 🦎)
- 프롬프트: 코볼트 — 함정을 파는 것. 초심자의 지하수로(제1격 잡졸)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `kobold_0` **조잡한 덫** (gloves) → `assets/items/kobold_0.png`
  - `kobold_1` **비늘 각반** (greaves) → `assets/items/kobold_1.png`
  - `kobold_2` **코볼트 허리끈** (belt) → `assets/items/kobold_2.png`

### 고블린 족장 `goblinchief` — 정예

- 설명: 제일 큰 몽둥이를 든 자 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/goblinchief.png` (지금은 🪓)
- 프롬프트: 고블린 족장 — 제일 큰 몽둥이를 든 자. 초심자의 지하수로(제1격 잡졸)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `goblinchief_0` **족장의 어깨뼈** (shoulder) → `assets/items/goblinchief_0.png`
  - `goblinchief_1` **전리품 누더기** (armor) → `assets/items/goblinchief_1.png`
  - `goblinchief_2` **해골 목걸이** (necklace) → `assets/items/goblinchief_2.png`

### 스켈레톤 `skeleton` — 일반

- 설명: 부서져도 다시 모이는 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/skeleton.png` (지금은 ☠️)
- 프롬프트: 스켈레톤 — 부서져도 다시 모이는. 초심자의 지하수로(제1격 잡졸)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `skeleton_0` **갈비뼈 견갑** (shoulder) → `assets/items/skeleton_0.png`
  - `skeleton_1` **해골 투구** (helm) → `assets/items/skeleton_1.png`
  - `skeleton_2` **뼈 허리띠** (belt) → `assets/items/skeleton_2.png`

### 좀비 `zombie` — 일반

- 설명: 느리지만 멈추지 않는 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/zombie.png` (지금은 🧟)
- 프롬프트: 좀비 — 느리지만 멈추지 않는. 초심자의 지하수로(제1격 잡졸)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `zombie_0` **썩은 가죽** (armor) → `assets/items/zombie_0.png`
  - `zombie_1` **무거운 발** (greaves) → `assets/items/zombie_1.png`
  - `zombie_2` **썩은 손** (gloves) → `assets/items/zombie_2.png`

### 자이언트 스파이더 `cavespider` — 일반

- 설명: 천장에서 내려오는 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/cavespider.png` (지금은 🕷️)
- 프롬프트: 자이언트 스파이더 — 천장에서 내려오는. 초심자의 지하수로(제1격 잡졸)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `cavespider_0` **거미줄 신** (boots) → `assets/items/cavespider_0.png`
  - `cavespider_1` **독니 반지** (ring) → `assets/items/cavespider_1.png`
  - `cavespider_2` **거미줄 팔찌** (bracelet) → `assets/items/cavespider_2.png`

### 미믹 `mimic` — 정예

- 설명: 보물인 척하는 것 / 성격: 행운 — 싸움은 약해지고 전리품이 늘어난다
- 몬스터 그림: `assets/monsters/mimic.png` (지금은 🧰)
- 프롬프트: 미믹 — 보물인 척하는 것. 초심자의 지하수로(제1격 잡졸)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `mimic_0` **이빨 달린 상자** (gloves) → `assets/items/mimic_0.png`
  - `mimic_1` **가짜 금화** (necklace) → `assets/items/mimic_1.png`
  - `mimic_2` **미끼 반지** (ring) → `assets/items/mimic_2.png`

### 임프 `imp` — 일반

- 설명: 작고 귀찮은 악마 / 성격: 성장 — 싸움은 약해지고 경험치를 더 얻는다
- 몬스터 그림: `assets/monsters/imp.png` (지금은 😈)
- 프롬프트: 임프 — 작고 귀찮은 악마. 초심자의 지하수로(제1격 잡졸)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `imp_0` **작은 삼지창** (offhand) → `assets/items/imp_0.png`
  - `imp_1` **유황 조각** (necklace) → `assets/items/imp_1.png`
  - `imp_2` **박쥐날개 망토** (cloak) → `assets/items/imp_2.png`

### 다크 울프 `darkwolf` — 일반

- 설명: 어둠 속에서 눈만 보이는 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/darkwolf.png` (지금은 🐕‍🦺)
- 프롬프트: 다크 울프 — 어둠 속에서 눈만 보이는. 초심자의 지하수로(제1격 잡졸)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `darkwolf_0` **늑대가죽 갑옷** (armor) → `assets/items/darkwolf_0.png`
  - `darkwolf_1` **발자국 없는 신** (boots) → `assets/items/darkwolf_1.png`
  - `darkwolf_2` **늑대발 장갑** (gloves) → `assets/items/darkwolf_2.png`

### 던전 가디언 `dungeonguardian` — 보스

- 설명: 문을 지키라는 명령만 남은 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/dungeonguardian.png` (지금은 🛡️)
- 프롬프트: 던전 가디언 — 문을 지키라는 명령만 남은. 초심자의 지하수로(제1격 잡졸)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 전리품:
  - `dungeonguardian_0` **수호자의 대검** (weapon) → `assets/items/dungeonguardian_0.png`
  - `dungeonguardian_1` **고철 판금** (armor) → `assets/items/dungeonguardian_1.png`
  - `dungeonguardian_2` **지하수로의 열쇠** (necklace) → `assets/items/dungeonguardian_2.png`


---

## 제2격 마물 — 이끼 낀 숲길

> 길은 있다. 다만 누가 냈는지는 아무도 모른다.

### 오크 전사 `orc` — 일반

- 설명: 힘으로만 밀어붙이는 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/orc.png` (지금은 🐗)
- 프롬프트: 오크 전사 — 힘으로만 밀어붙이는. 이끼 낀 숲길(제2격 마물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `orc_0` **오크 대검** (weapon) → `assets/items/orc_0.png`
  - `orc_1` **가죽 흉갑** (armor) → `assets/items/orc_1.png`
  - `orc_2` **오크 손등가리개** (gloves) → `assets/items/orc_2.png`

### 홉고블린 `hobgoblin` — 일반

- 설명: 줄을 맞춰 싸우는 고블린 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/hobgoblin.png` (지금은 👹)
- 프롬프트: 홉고블린 — 줄을 맞춰 싸우는 고블린. 이끼 낀 숲길(제2격 마물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `hobgoblin_0` **군용 방패** (offhand) → `assets/items/hobgoblin_0.png`
  - `hobgoblin_1` **지휘관의 투구** (helm) → `assets/items/hobgoblin_1.png`
  - `hobgoblin_2` **군용 허리띠** (belt) → `assets/items/hobgoblin_2.png`

### 리저드맨 `lizardman` — 일반

- 설명: 늪에서 기어나온 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/lizardman.png` (지금은 🐊)
- 프롬프트: 리저드맨 — 늪에서 기어나온. 이끼 낀 숲길(제2격 마물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `lizardman_0` **뼈 삼지창** (weapon) → `assets/items/lizardman_0.png`
  - `lizardman_1` **늪지 각반** (greaves) → `assets/items/lizardman_1.png`

### 하피 `harpy` — 일반

- 설명: 노래로 홀리는 것 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/harpy.png` (지금은 🪽)
- 프롬프트: 하피 — 노래로 홀리는 것. 이끼 낀 숲길(제2격 마물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `harpy_0` **깃털 신** (boots) → `assets/items/harpy_0.png`
  - `harpy_1` **홀리는 목소리** (ring) → `assets/items/harpy_1.png`
  - `harpy_2` **깃털 망토** (cloak) → `assets/items/harpy_2.png`

### 오크 장군 `orcgeneral` — 정예

- 설명: 천 명을 이끌었던 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/orcgeneral.png` (지금은 🪖)
- 프롬프트: 오크 장군 — 천 명을 이끌었던. 이끼 낀 숲길(제2격 마물)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `orcgeneral_0` **장군의 견장** (shoulder) → `assets/items/orcgeneral_0.png`
  - `orcgeneral_1` **전장의 판금** (armor) → `assets/items/orcgeneral_1.png`
  - `orcgeneral_2` **뿔 달린 투구** (helm) → `assets/items/orcgeneral_2.png`

### 오우거 `ogre` — 일반

- 설명: 나무를 뽑아 휘두르는 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/ogre.png` (지금은 🪨)
- 프롬프트: 오우거 — 나무를 뽑아 휘두르는. 이끼 낀 숲길(제2격 마물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `ogre_0` **통나무 어깨받이** (shoulder) → `assets/items/ogre_0.png`
  - `ogre_1` **두꺼운 각반** (greaves) → `assets/items/ogre_1.png`

### 다크 엘프 자객 `darkelf` — 일반

- 설명: 뒤에서만 나타나는 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/darkelf.png` (지금은 🌑)
- 프롬프트: 다크 엘프 자객 — 뒤에서만 나타나는. 이끼 낀 숲길(제2격 마물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `darkelf_0` **독 바른 단검** (weapon) → `assets/items/darkelf_0.png`
  - `darkelf_1` **그림자 신** (boots) → `assets/items/darkelf_1.png`
  - `darkelf_2` **암살자의 인장** (ring) → `assets/items/darkelf_2.png`

### 트렌트 `treant` — 일반

- 설명: 걷는 나무 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/treant.png` (지금은 🌳)
- 프롬프트: 트렌트 — 걷는 나무. 이끼 낀 숲길(제2격 마물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `treant_0` **나무껍질 갑옷** (armor) → `assets/items/treant_0.png`
  - `treant_1` **뿌리 방패** (offhand) → `assets/items/treant_1.png`
  - `treant_2` **덩굴 허리띠** (belt) → `assets/items/treant_2.png`

### 숲의 마녀 `forestwitch` — 정예

- 설명: 길 잃은 자만 만나는 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/forestwitch.png` (지금은 🧙)
- 프롬프트: 숲의 마녀 — 길 잃은 자만 만나는. 이끼 낀 숲길(제2격 마물)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `forestwitch_0` **뒤틀린 지팡이** (weapon) → `assets/items/forestwitch_0.png`
  - `forestwitch_1` **저주받은 부적** (necklace) → `assets/items/forestwitch_1.png`
  - `forestwitch_2` **마녀의 고리** (ring) → `assets/items/forestwitch_2.png`

### 가고일 `gargoyle` — 일반

- 설명: 낮에는 돌인 것 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/gargoyle.png` (지금은 🗿)
- 프롬프트: 가고일 — 낮에는 돌인 것. 이끼 낀 숲길(제2격 마물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `gargoyle_0` **석상 갑주** (armor) → `assets/items/gargoyle_0.png`
  - `gargoyle_1` **돌 뿔** (helm) → `assets/items/gargoyle_1.png`
  - `gargoyle_2` **돌 팔찌** (bracelet) → `assets/items/gargoyle_2.png`

### 바실리스크 `basilisk` — 일반

- 설명: 눈을 마주치면 끝 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/basilisk.png` (지금은 🐍)
- 프롬프트: 바실리스크 — 눈을 마주치면 끝. 이끼 낀 숲길(제2격 마물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `basilisk_0` **석화의 눈** (necklace) → `assets/items/basilisk_0.png`
  - `basilisk_1` **비늘 정강이** (greaves) → `assets/items/basilisk_1.png`
  - `basilisk_2` **석화의 팔찌** (bracelet) → `assets/items/basilisk_2.png`

### 트롤 킹 `trollking` — 보스

- 설명: 베어도 다시 붙는 자 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/trollking.png` (지금은 🧌)
- 프롬프트: 트롤 킹 — 베어도 다시 붙는 자. 이끼 낀 숲길(제2격 마물)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 전리품:
  - `trollking_0` **재생의 곤봉** (weapon) → `assets/items/trollking_0.png`
  - `trollking_1` **트롤가죽 갑주** (armor) → `assets/items/trollking_1.png`
  - `trollking_2` **숲의 심장** (necklace) → `assets/items/trollking_2.png`


---

## 제3격 마수 — 무너진 왕국

> 왕은 없고 왕관만 굴러다닌다.

### 미노타우로스 `minotaur` — 일반

- 설명: 미궁의 주인 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/minotaur.png` (지금은 🐂)
- 프롬프트: 미노타우로스 — 미궁의 주인. 무너진 왕국(제3격 마수)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `minotaur_0` **미궁의 전투도끼** (weapon) → `assets/items/minotaur_0.png`
  - `minotaur_1` **황소 투구** (helm) → `assets/items/minotaur_1.png`
  - `minotaur_2` **미궁의 허리띠** (belt) → `assets/items/minotaur_2.png`

### 와이번 `wyvern` — 일반

- 설명: 용은 아니지만 하늘을 나는 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/wyvern.png` (지금은 🦇)
- 프롬프트: 와이번 — 용은 아니지만 하늘을 나는. 무너진 왕국(제3격 마수)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `wyvern_0` **날개막 신** (boots) → `assets/items/wyvern_0.png`
  - `wyvern_1` **와이번 가죽** (armor) → `assets/items/wyvern_1.png`
  - `wyvern_2` **와이번 가죽 망토** (cloak) → `assets/items/wyvern_2.png`

### 키메라 `chimera` — 일반

- 설명: 셋을 억지로 붙여놓은 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/chimera.png` (지금은 🦁)
- 프롬프트: 키메라 — 셋을 억지로 붙여놓은. 무너진 왕국(제3격 마수)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `chimera_0` **세 짐승의 어깨** (shoulder) → `assets/items/chimera_0.png`
  - `chimera_1` **뒤섞인 심장** (necklace) → `assets/items/chimera_1.png`

### 만티코어 `manticore` — 일반

- 설명: 꼬리에 독침이 달린 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/manticore.png` (지금은 🦂)
- 프롬프트: 만티코어 — 꼬리에 독침이 달린. 무너진 왕국(제3격 마수)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `manticore_0` **독침 채찍** (weapon) → `assets/items/manticore_0.png`
  - `manticore_1` **만티코어의 송곳니** (ring) → `assets/items/manticore_1.png`
  - `manticore_2` **만티코어 망토** (cloak) → `assets/items/manticore_2.png`

### 그리핀 로드 `griffinlord` — 정예

- 설명: 하늘의 왕관을 쓴 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/griffinlord.png` (지금은 🦅)
- 프롬프트: 그리핀 로드 — 하늘의 왕관을 쓴. 무너진 왕국(제3격 마수)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `griffinlord_0` **창공의 발톱** (boots) → `assets/items/griffinlord_0.png`
  - `griffinlord_1` **깃털 흉갑** (armor) → `assets/items/griffinlord_1.png`
  - `griffinlord_2` **왕의 깃털** (necklace) → `assets/items/griffinlord_2.png`

### 스톤 골렘 `stonegolem` — 일반

- 설명: 명령 하나만 기억하는 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/stonegolem.png` (지금은 🪆)
- 프롬프트: 스톤 골렘 — 명령 하나만 기억하는. 무너진 왕국(제3격 마수)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `stonegolem_0` **화강암 갑주** (armor) → `assets/items/stonegolem_0.png`
  - `stonegolem_1` **돌기둥 각반** (greaves) → `assets/items/stonegolem_1.png`
  - `stonegolem_2` **화강암 띠** (belt) → `assets/items/stonegolem_2.png`

### 아이언 골렘 `irongolem` — 일반

- 설명: 녹슬지 않는 병사 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/irongolem.png` (지금은 ⚒️)
- 프롬프트: 아이언 골렘 — 녹슬지 않는 병사. 무너진 왕국(제3격 마수)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `irongolem_0` **강철 방패** (offhand) → `assets/items/irongolem_0.png`
  - `irongolem_1` **무쇠 투구** (helm) → `assets/items/irongolem_1.png`
  - `irongolem_2` **무쇠 손** (gloves) → `assets/items/irongolem_2.png`

### 하피 퀸 `harpyqueen` — 일반

- 설명: 노래를 멈추지 않는 / 성격: 행운 — 싸움은 약해지고 전리품이 늘어난다
- 몬스터 그림: `assets/monsters/harpyqueen.png` (지금은 🎶)
- 프롬프트: 하피 퀸 — 노래를 멈추지 않는. 무너진 왕국(제3격 마수)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `harpyqueen_0` **여왕의 깃털** (ring) → `assets/items/harpyqueen_0.png`
  - `harpyqueen_1` **바람 타는 신** (boots) → `assets/items/harpyqueen_1.png`
  - `harpyqueen_2` **여왕의 팔찌** (bracelet) → `assets/items/harpyqueen_2.png`

### 히드라 `hydra` — 정예

- 설명: 하나 자르면 둘이 되는 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/hydra.png` (지금은 🐲)
- 프롬프트: 히드라 — 하나 자르면 둘이 되는. 무너진 왕국(제3격 마수)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `hydra_0` **아홉 머리의 이빨** (weapon) → `assets/items/hydra_0.png`
  - `hydra_1` **재생하는 비늘** (armor) → `assets/items/hydra_1.png`
  - `hydra_2` **불멸의 독** (necklace) → `assets/items/hydra_2.png`

### 코카트리스 `cockatrice` — 일반

- 설명: 닭처럼 생겼지만 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/cockatrice.png` (지금은 🐓)
- 프롬프트: 코카트리스 — 닭처럼 생겼지만. 무너진 왕국(제3격 마수)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `cockatrice_0` **석화 방지 각반** (greaves) → `assets/items/cockatrice_0.png`
  - `cockatrice_1` **볏의 고리** (ring) → `assets/items/cockatrice_1.png`

### 다크 나이트 `darkknight` — 일반

- 설명: 투구 안이 비어 있는 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/darkknight.png` (지금은 🖤)
- 프롬프트: 다크 나이트 — 투구 안이 비어 있는. 무너진 왕국(제3격 마수)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `darkknight_0` **흑철 견갑** (shoulder) → `assets/items/darkknight_0.png`
  - `darkknight_1` **흑기사 판금** (armor) → `assets/items/darkknight_1.png`
  - `darkknight_2` **빈 투구** (helm) → `assets/items/darkknight_2.png`

### 카벙클 `carbuncle` — 히든

- 설명: 무너진 왕국의 홍옥을 이마에 박은 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/carbuncle.png` (지금은 💎)
- 프롬프트: 카벙클 — 무너진 왕국의 홍옥을 이마에 박은. 무너진 왕국(제3격 마수)의 히든 적. 전신 도트 일러스트, 투명 배경. 신비롭고 은은히 빛나는 외형.
- 전리품:


### 몰락한 왕 `fallenking` — 보스

- 설명: 아직도 옥좌에 앉아 있는 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/fallenking.png` (지금은 🤴)
- 프롬프트: 몰락한 왕 — 아직도 옥좌에 앉아 있는. 무너진 왕국(제3격 마수)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 전리품:
  - `fallenking_0` **왕의 세검** (weapon) → `assets/items/fallenking_0.png`
  - `fallenking_1` **녹슨 왕관** (helm) → `assets/items/fallenking_1.png`
  - `fallenking_2` **무너진 옥새** (necklace) → `assets/items/fallenking_2.png`


---

## 제4격 환수 — 잊혀진 성역

> 신화에 이름이 실린 짐승들이 여기 숨어 있다.

### 유니콘 `unicorn` — 일반

- 설명: 순수한 자에게만 보이는 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/unicorn.png` (지금은 🦄)
- 프롬프트: 유니콘 — 순수한 자에게만 보이는. 잊혀진 성역(제4격 환수)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `unicorn_0` **일각수의 뿔** (weapon) → `assets/items/unicorn_0.png`
  - `unicorn_1` **정화의 물방울** (necklace) → `assets/items/unicorn_1.png`
  - `unicorn_2` **정화의 팔찌** (bracelet) → `assets/items/unicorn_2.png`

### 페가수스 `pegasus` — 일반

- 설명: 땅을 딛지 않는 말 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/pegasus.png` (지금은 🐴)
- 프롬프트: 페가수스 — 땅을 딛지 않는 말. 잊혀진 성역(제4격 환수)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `pegasus_0` **구름을 딛는 편자** (boots) → `assets/items/pegasus_0.png`
  - `pegasus_1` **날개의 고리** (bracelet) → `assets/items/pegasus_1.png`

### 피닉스 `phoenix` — 일반

- 설명: 타 죽어야 사는 새 / 성격: 성장 — 싸움은 약해지고 경험치를 더 얻는다
- 몬스터 그림: `assets/monsters/phoenix.png` (지금은 🔥)
- 프롬프트: 피닉스 — 타 죽어야 사는 새. 잊혀진 성역(제4격 환수)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `phoenix_0` **재에서 난 깃옷** (cloak) → `assets/items/phoenix_0.png`
  - `phoenix_2` **불티 장갑** (gloves) → `assets/items/phoenix_2.png`
  - `phoenix_3` **다시 타오르는 잿불** (special·relic) → `assets/items/phoenix_3.png`

### 케르베로스 `cerberus` — 일반

- 설명: 문을 지키는 세 머리 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/cerberus.png` (지금은 🐕)
- 프롬프트: 케르베로스 — 문을 지키는 세 머리. 잊혀진 성역(제4격 환수)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `cerberus_0` **세 머리의 투구** (helm) → `assets/items/cerberus_0.png`
  - `cerberus_1` **지옥문 각반** (greaves) → `assets/items/cerberus_1.png`
  - `cerberus_2` **세 목줄의 고리** (ring) → `assets/items/cerberus_2.png`

### 스핑크스 `sphinx` — 정예

- 설명: 답하지 못하면 잡아먹는 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/sphinx.png` (지금은 🐈‍⬛)
- 프롬프트: 스핑크스 — 답하지 못하면 잡아먹는. 잊혀진 성역(제4격 환수)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `sphinx_0` **풀리지 않는 수수께끼** (necklace) → `assets/items/sphinx_0.png`
  - `sphinx_1` **사자의 관** (helm) → `assets/items/sphinx_1.png`
  - `sphinx_2` **정답의 고리** (bracelet) → `assets/items/sphinx_2.png`

### 리바이어던 `leviathan` — 일반

- 설명: 바다를 통째로 삼킨 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/leviathan.png` (지금은 🐋)
- 프롬프트: 리바이어던 — 바다를 통째로 삼킨. 잊혀진 성역(제4격 환수)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `leviathan_0` **심해 비늘 갑주** (armor) → `assets/items/leviathan_0.png`
  - `leviathan_1` **해일의 지느러미** (shoulder) → `assets/items/leviathan_1.png`

### 베히모스 `behemoth` — 일반

- 설명: 땅을 통째로 눌러앉은 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/behemoth.png` (지금은 🦏)
- 프롬프트: 베히모스 — 땅을 통째로 눌러앉은. 잊혀진 성역(제4격 환수)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `behemoth_0` **대지의 각반** (greaves) → `assets/items/behemoth_0.png`
  - `behemoth_1` **뿔 방패** (offhand) → `assets/items/behemoth_1.png`
  - `behemoth_2` **대지의 허리띠** (belt) → `assets/items/behemoth_2.png`

### 지즈 `ziz` — 일반

- 설명: 하늘을 가리는 날개 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/ziz.png` (지금은 🕊️)
- 프롬프트: 지즈 — 하늘을 가리는 날개. 잊혀진 성역(제4격 환수)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `ziz_0` **하늘 덮는 신** (boots) → `assets/items/ziz_0.png`
  - `ziz_1` **깃대의 고리** (bracelet) → `assets/items/ziz_1.png`
  - `ziz_2` **하늘 덮는 망토** (cloak) → `assets/items/ziz_2.png`

### 크라켄 `kraken` — 정예

- 설명: 배를 통째로 끌고 내려가는 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/kraken.png` (지금은 🦑)
- 프롬프트: 크라켄 — 배를 통째로 끌고 내려가는. 잊혀진 성역(제4격 환수)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `kraken_0` **거대 촉수** (shoulder) → `assets/items/kraken_0.png`
  - `kraken_1` **흡반 갑피** (armor) → `assets/items/kraken_1.png`
  - `kraken_2` **심연의 먹물** (necklace) → `assets/items/kraken_2.png`

### 샐러맨더 `salamander` — 일반

- 설명: 불 속에서만 사는 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/salamander.png` (지금은 🦎)
- 프롬프트: 샐러맨더 — 불 속에서만 사는. 잊혀진 성역(제4격 환수)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `salamander_0` **불꽃 꼬리** (weapon) → `assets/items/salamander_0.png`
  - `salamander_1` **용암 각반** (greaves) → `assets/items/salamander_1.png`
  - `salamander_2` **화염 손** (gloves) → `assets/items/salamander_2.png`

### 실프 `sylph` — 일반

- 설명: 만질 수 없는 것 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/sylph.png` (지금은 💨)
- 프롬프트: 실프 — 만질 수 없는 것. 잊혀진 성역(제4격 환수)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `sylph_0` **바람의 신** (boots) → `assets/items/sylph_0.png`
  - `sylph_1` **공기의 고리** (bracelet) → `assets/items/sylph_1.png`
  - `sylph_2` **바람 팔찌** (bracelet) → `assets/items/sylph_2.png`

### 성역의 수호룡 `sanctdragon` — 보스

- 설명: 천 년을 한 자리에서 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/sanctdragon.png` (지금은 🐉)
- 프롬프트: 성역의 수호룡 — 천 년을 한 자리에서. 잊혀진 성역(제4격 환수)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 전리품:
  - `sanctdragon_0` **용의 송곳니 검** (weapon) → `assets/items/sanctdragon_0.png`
  - `sanctdragon_1` **고룡 비늘 갑주** (armor) → `assets/items/sanctdragon_1.png`
  - `sanctdragon_4` **성역의 수호석** (special·relic) → `assets/items/sanctdragon_4.png`


---

## 제5격 마족 — 시체가 걷는 도시

> 여기 사는 것들은 죽는 법을 잊었다.

### 구울 `ghoul` — 일반

- 설명: 무덤을 파헤치는 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/ghoul.png` (지금은 🧟‍♂️)
- 프롬프트: 구울 — 무덤을 파헤치는. 시체가 걷는 도시(제5격 마족)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `ghoul_0` **갈퀴손** (gloves) → `assets/items/ghoul_0.png`
  - `ghoul_1` **흙투성이 각반** (greaves) → `assets/items/ghoul_1.png`
  - `ghoul_2` **수의 허리끈** (belt) → `assets/items/ghoul_2.png`

### 레이스 `wraith` — 일반

- 설명: 만질 수 없는 원한 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/wraith.png` (지금은 👻)
- 프롬프트: 레이스 — 만질 수 없는 원한. 시체가 걷는 도시(제5격 마족)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `wraith_0` **안개 수의** (cloak) → `assets/items/wraith_0.png`
  - `wraith_1` **원한의 고리** (bracelet) → `assets/items/wraith_1.png`

### 뱀파이어 `vampire` — 일반

- 설명: 초대받아야 들어오는 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/vampire.png` (지금은 🧛)
- 프롬프트: 뱀파이어 — 초대받아야 들어오는. 시체가 걷는 도시(제5격 마족)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `vampire_0` **흡혈 레이피어** (weapon) → `assets/items/vampire_0.png`
  - `vampire_1` **귀족의 망토** (cloak) → `assets/items/vampire_1.png`
  - `vampire_4` **흡혈귀의 송곳니** (special·relic) → `assets/items/vampire_4.png`

### 밴시 `banshee` — 일반

- 설명: 죽음을 미리 알리는 울음 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/banshee.png` (지금은 😱)
- 프롬프트: 밴시 — 죽음을 미리 알리는 울음. 시체가 걷는 도시(제5격 마족)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `banshee_0` **통곡의 두건** (helm) → `assets/items/banshee_0.png`
  - `banshee_1` **예고의 고리** (bracelet) → `assets/items/banshee_1.png`
  - `banshee_2` **통곡의 망토** (cloak) → `assets/items/banshee_2.png`

### 데스 나이트 `deathknight` — 정예

- 설명: 충성만 남은 시체 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/deathknight.png` (지금은 ⚰️)
- 프롬프트: 데스 나이트 — 충성만 남은 시체. 시체가 걷는 도시(제5격 마족)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `deathknight_0` **서약의 대검** (weapon) → `assets/items/deathknight_0.png`
  - `deathknight_1` **사자의 판금** (armor) → `assets/items/deathknight_1.png`
  - `deathknight_2` **맹세의 투구** (helm) → `assets/items/deathknight_2.png`

### 본 드래곤 `bonedragon` — 일반

- 설명: 살이 없어도 나는 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/bonedragon.png` (지금은 🦴)
- 프롬프트: 본 드래곤 — 살이 없어도 나는. 시체가 걷는 도시(제5격 마족)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `bonedragon_0` **뼈 갑주** (armor) → `assets/items/bonedragon_0.png`
  - `bonedragon_1` **해골 발톱** (boots) → `assets/items/bonedragon_1.png`
  - `bonedragon_2` **뼈 팔찌** (bracelet) → `assets/items/bonedragon_2.png`

### 서큐버스 `succubus` — 일반

- 설명: 꿈으로 들어오는 / 성격: 행운 — 싸움은 약해지고 전리품이 늘어난다
- 몬스터 그림: `assets/monsters/succubus.png` (지금은 💋)
- 프롬프트: 서큐버스 — 꿈으로 들어오는. 시체가 걷는 도시(제5격 마족)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `succubus_0` **유혹의 반지** (ring) → `assets/items/succubus_0.png`
  - `succubus_1` **훔친 꿈** (necklace) → `assets/items/succubus_1.png`
  - `succubus_2` **유혹의 팔찌** (bracelet) → `assets/items/succubus_2.png`

### 인큐버스 `incubus` — 일반

- 설명: 깨어나면 사라지는 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/incubus.png` (지금은 🩸)
- 프롬프트: 인큐버스 — 깨어나면 사라지는. 시체가 걷는 도시(제5격 마족)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `incubus_0` **악몽의 어깨** (shoulder) → `assets/items/incubus_0.png`
  - `incubus_1` **꿈을 걷는 신** (boots) → `assets/items/incubus_1.png`

### 리치 `lich` — 정예

- 설명: 심장을 항아리에 넣어둔 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/lich.png` (지금은 📕)
- 프롬프트: 리치 — 심장을 항아리에 넣어둔. 시체가 걷는 도시(제5격 마족)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `lich_0` **생명을 먹는 지팡이** (weapon) → `assets/items/lich_0.png`
  - `lich_1` **성물함** (necklace) → `assets/items/lich_1.png`
  - `lich_2` **학자의 관** (helm) → `assets/items/lich_2.png`

### 데몬 로드 `demonlord` — 일반

- 설명: 계약서를 들고 오는 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/demonlord.png` (지금은 👿)
- 프롬프트: 데몬 로드 — 계약서를 들고 오는. 시체가 걷는 도시(제5격 마족)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `demonlord_0` **계약의 낙인** (shoulder) → `assets/items/demonlord_0.png`
  - `demonlord_1` **지옥 판금** (armor) → `assets/items/demonlord_1.png`
  - `demonlord_2` **피로 쓴 서명** (ring) → `assets/items/demonlord_2.png`

### 발록 `balrog` — 일반

- 설명: 불과 그림자 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/balrog.png` (지금은 🌋)
- 프롬프트: 발록 — 불과 그림자. 시체가 걷는 도시(제5격 마족)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `balrog_0` **불꽃 채찍** (weapon) → `assets/items/balrog_0.png`
  - `balrog_1` **용암 정강이** (greaves) → `assets/items/balrog_1.png`
  - `balrog_2` **그림자 방패** (offhand) → `assets/items/balrog_2.png`

### 까마귀 왕 `ravenking` — 히든

- 설명: 반짝이는 것이면 죽은 자의 것이라도 물어 가는 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/ravenking.png` (지금은 🐦)
- 프롬프트: 까마귀 왕 — 반짝이는 것이면 죽은 자의 것이라도 물어 가는. 시체가 걷는 도시(제5격 마족)의 히든 적. 전신 도트 일러스트, 투명 배경. 신비롭고 은은히 빛나는 외형.
- 전리품:
  - `ravenking_0` **까마귀가 물어 온 청옥** (special·gem) → `assets/items/ravenking_0.png`
  - `ravenking_1` **검은 깃 부적** (special·relic) → `assets/items/ravenking_1.png`

### 불사의 왕 `lichking` — 보스

- 설명: 죽음을 신하로 부리는 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/lichking.png` (지금은 👑)
- 프롬프트: 불사의 왕 — 죽음을 신하로 부리는. 시체가 걷는 도시(제5격 마족)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 전리품:
  - `lichking_0` **서리한** (weapon) → `assets/items/lichking_0.png`
  - `lichking_1` **불사의 판금** (armor) → `assets/items/lichking_1.png`
  - `lichking_4` **죽지 않는 성물함** (special·relic) → `assets/items/lichking_4.png`


---

## 제6격 마왕 — 마계의 왕좌

> 세계를 끝내겠다고 말하는 것들이 여기 모여 있다.

### 아크데몬 `archdemon` — 일반

- 설명: 군단을 거느린 것 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/archdemon.png` (지금은 😈)
- 프롬프트: 아크데몬 — 군단을 거느린 것. 마계의 왕좌(제6격 마왕)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `archdemon_0` **심연의 대검** (weapon) → `assets/items/archdemon_0.png`
  - `archdemon_1` **마계 판금** (armor) → `assets/items/archdemon_1.png`
  - `archdemon_2` **군단장의 망토** (cloak) → `assets/items/archdemon_2.png`

### 심연의 촉수 `abysstentacle` — 일반

- 설명: 바닥이 없는 곳에서 올라온 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/abysstentacle.png` (지금은 🦑)
- 프롬프트: 심연의 촉수 — 바닥이 없는 곳에서 올라온. 마계의 왕좌(제6격 마왕)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `abysstentacle_0` **끝없는 촉수** (shoulder) → `assets/items/abysstentacle_0.png`
  - `abysstentacle_1` **바닥 없는 신** (boots) → `assets/items/abysstentacle_1.png`

### 칠죄종 · 나태 `sinsloth` — 정예

- 설명: 일어나기 싫은 것 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/sinsloth.png` (지금은 😴)
- 프롬프트: 칠죄종 · 나태 — 일어나기 싫은 것. 마계의 왕좌(제6격 마왕)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `sinsloth_0` **끌려가는 신** (boots) → `assets/items/sinsloth_0.png`
  - `sinsloth_1` **졸음의 방패** (offhand) → `assets/items/sinsloth_1.png`
  - `sinsloth_2` **멈춘 맥박의 고리** (bracelet) → `assets/items/sinsloth_2.png`

### 칠죄종 · 질투 `sinenvy` — 정예

- 설명: 남의 것이 더 좋아 보이는 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/sinenvy.png` (지금은 💚)
- 프롬프트: 칠죄종 · 질투 — 남의 것이 더 좋아 보이는. 마계의 왕좌(제6격 마왕)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `sinenvy_0` **훔쳐 낀 장갑** (gloves) → `assets/items/sinenvy_0.png`
  - `sinenvy_1` **남의 것을 두른 망토** (cloak) → `assets/items/sinenvy_1.png`
  - `sinenvy_2` **질투의 팔찌** (bracelet) → `assets/items/sinenvy_2.png`

### 고대룡 `elderdragon` — 일반

- 설명: 신화보다 오래된 비늘 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/elderdragon.png` (지금은 🐲)
- 프롬프트: 고대룡 — 신화보다 오래된 비늘. 마계의 왕좌(제6격 마왕)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `elderdragon_0` **고룡의 송곳니** (weapon) → `assets/items/elderdragon_0.png`
  - `elderdragon_1` **고룡의 비늘** (armor) → `assets/items/elderdragon_1.png`
  - `elderdragon_4` **고룡의 심장석** (special·gem) → `assets/items/elderdragon_4.png`

### 칠죄종 · 색욕 `sinlust` — 정예

- 설명: 눈을 떼지 못하게 하는 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/sinlust.png` (지금은 💋)
- 프롬프트: 칠죄종 · 색욕 — 눈을 떼지 못하게 하는. 마계의 왕좌(제6격 마왕)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `sinlust_0` **비단 망토** (cloak) → `assets/items/sinlust_0.png`
  - `sinlust_1` **유혹의 허리띠** (belt) → `assets/items/sinlust_1.png`
  - `sinlust_2` **맹세를 깨는 고리** (ring) → `assets/items/sinlust_2.png`

### 칠죄종 · 폭식 `singluttony` — 정예

- 설명: 먹어도 허기진 것 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/singluttony.png` (지금은 🍖)
- 프롬프트: 칠죄종 · 폭식 — 먹어도 허기진 것. 마계의 왕좌(제6격 마왕)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `singluttony_0` **부푼 허리띠** (belt) → `assets/items/singluttony_0.png`
  - `singluttony_1` **기름진 손** (gloves) → `assets/items/singluttony_1.png`
  - `singluttony_2` **바닥 없는 접시** (offhand) → `assets/items/singluttony_2.png`

### 칠죄종 · 오만 `sinpride` — 정예

- 설명: 무릎 꿇는 법을 모르는 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/sinpride.png` (지금은 🪞)
- 프롬프트: 칠죄종 · 오만 — 무릎 꿇는 법을 모르는. 마계의 왕좌(제6격 마왕)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `sinpride_0` **오만의 관** (helm) → `assets/items/sinpride_0.png`
  - `sinpride_1` **굽히지 않는 갑주** (armor) → `assets/items/sinpride_1.png`
  - `sinpride_2` **자만의 고리** (ring) → `assets/items/sinpride_2.png`

### 칠죄종 · 분노 `sinwrath` — 정예

- 설명: 식지 않는 것 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/sinwrath.png` (지금은 🔥)
- 프롬프트: 칠죄종 · 분노 — 식지 않는 것. 마계의 왕좌(제6격 마왕)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `sinwrath_0` **분노의 견갑** (shoulder) → `assets/items/sinwrath_0.png`
  - `sinwrath_1` **타오르는 각반** (greaves) → `assets/items/sinwrath_1.png`
  - `sinwrath_2` **식지 않는 주먹** (gloves) → `assets/items/sinwrath_2.png`

### 칠죄종 · 탐욕 `singreed` — 정예

- 설명: 가져도 모자란 것 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/singreed.png` (지금은 💰)
- 프롬프트: 칠죄종 · 탐욕 — 가져도 모자란 것. 마계의 왕좌(제6격 마왕)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `singreed_0` **탐욕의 반지** (ring) → `assets/items/singreed_0.png`
  - `singreed_1` **끝없는 자루** (necklace) → `assets/items/singreed_1.png`
  - `singreed_2` **탐욕의 전대** (belt) → `assets/items/singreed_2.png`

### 마신장 `demongeneral` — 일반

- 설명: 마왕의 왼팔 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/demongeneral.png` (지금은 ⚔️)
- 프롬프트: 마신장 — 마왕의 왼팔. 마계의 왕좌(제6격 마왕)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `demongeneral_0` **마신의 창** (weapon) → `assets/items/demongeneral_0.png`
  - `demongeneral_2` **마장의 투구** (helm) → `assets/items/demongeneral_2.png`
  - `demongeneral_3` **마장의 건틀릿** (gloves) → `assets/items/demongeneral_3.png`

### 관측자 `observer` — 히든

- 설명: 처음부터 당신을 보고 있던 것 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/observer.png` (지금은 👁️)
- 프롬프트: 관측자 — 처음부터 당신을 보고 있던 것. 마계의 왕좌(제6격 마왕)의 히든 적. 전신 도트 일러스트, 투명 배경. 신비롭고 은은히 빛나는 외형.
- 전리품:
  - `observer_0` **격을 삼키는 검** (weapon) → `assets/items/observer_0.png`

### 세계수를 먹는 벌레 `worldworm` — 정예

- 설명: 뿌리부터 갉아먹는 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/worldworm.png` (지금은 🐛)
- 프롬프트: 세계수를 먹는 벌레 — 뿌리부터 갉아먹는. 마계의 왕좌(제6격 마왕)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 전리품:
  - `worldworm_2` **세계수의 파편** (necklace) → `assets/items/worldworm_2.png`
  - `worldworm_3` **갉는 팔찌** (bracelet) → `assets/items/worldworm_3.png`
  - `worldworm_4` **마디 갑각** (shoulder) → `assets/items/worldworm_4.png`

### 종말의 짐승 `apocalypsebeast` — 일반

- 설명: 뿔이 일곱 개인 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/apocalypsebeast.png` (지금은 🐏)
- 프롬프트: 종말의 짐승 — 뿔이 일곱 개인. 마계의 왕좌(제6격 마왕)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 전리품:
  - `apocalypsebeast_0` **일곱 뿔의 관** (helm) → `assets/items/apocalypsebeast_0.png`
  - `apocalypsebeast_1` **짓밟는 각반** (greaves) → `assets/items/apocalypsebeast_1.png`

### 마왕 `demonking` — 보스

- 설명: 세계를 끝내러 온 자 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/demonking.png` (지금은 💀)
- 프롬프트: 마왕 — 세계를 끝내러 온 자. 마계의 왕좌(제6격 마왕)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 전리품:
  - `demonking_0` **마왕의 검** (weapon) → `assets/items/demonking_0.png`
  - `demonking_1` **마왕의 갑주** (armor) → `assets/items/demonking_1.png`
  - `demonking_2` **마왕의 관** (necklace) → `assets/items/demonking_2.png`


---

## 제7격 설화 — 알렉산드리아 대도서관

> 불탄 줄 알았던 두루마리들이 아직 여기서 숨을 쉰다.

### 이름 없는 이야기꾼 `storyteller` — 일반 · 화신

- 설명: 가장 오래된 목소리 / 성격: 행운 — 싸움은 약해지고 전리품이 늘어난다
- 몬스터 그림: `assets/monsters/storyteller.png` (지금은 📖)
- 프롬프트: 이름 없는 이야기꾼 — 가장 오래된 목소리. 알렉산드리아 대도서관(제7격 설화)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「처음부터 끝까지 들어 줄 사람이 필요했다. 네가 마지막 독자가 되어 다오.」
- 전리품:
  - `storyteller_0` **닳아버린 붓** (weapon) → `assets/items/storyteller_0.png`
  - `storyteller_1` **이야기꾼의 해진 외투** (cloak) → `assets/items/storyteller_1.png`
  - `storyteller_2` **천 하룻밤의 띠** (belt) → `assets/items/storyteller_2.png`

### 필경사의 화신 `scribe` — 일반 · 화신

- 설명: 베껴 쓰다 눈이 먼 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/scribe.png` (지금은 🪶)
- 프롬프트: 필경사의 화신 — 베껴 쓰다 눈이 먼. 알렉산드리아 대도서관(제7격 설화)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「눈이 멀 때까지 베껴 썼지. 이번엔 네가 가는 길을 받아 적으마.」
- 전리품:
  - `scribe_0` **마르지 않는 뿔병** (offhand) → `assets/items/scribe_0.png`
  - `scribe_1` **필경사의 낡은 샌들** (boots) → `assets/items/scribe_1.png`
  - `scribe_2` **잉크 물든 장갑** (gloves) → `assets/items/scribe_2.png`

### 아르키메데스의 화신 `archimedes` — 일반 · 화신

- 설명: 지렛대를 든 자 / 성격: 성장 — 싸움은 약해지고 경험치를 더 얻는다
- 몬스터 그림: `assets/monsters/archimedes.png` (지금은 ⚙️)
- 프롬프트: 아르키메데스의 화신 — 지렛대를 든 자. 알렉산드리아 대도서관(제7격 설화)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「발 디딜 곳만 다오. 세계는 네 쪽으로 기울어 움직일 테니.」
- 전리품:
  - `archimedes_0` **움직이지 않는 지렛대** (weapon) → `assets/items/archimedes_0.png`
  - `archimedes_1` **유레카의 원** (ring) → `assets/items/archimedes_1.png`

### 히파티아의 화신 `hypatia` — 일반 · 화신

- 설명: 마지막 도서관장 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/hypatia.png` (지금은 🔭)
- 프롬프트: 히파티아의 화신 — 마지막 도서관장. 알렉산드리아 대도서관(제7격 설화)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「불타는 서가에서 마지막으로 꺼낸 게 너다. 잘 읽혀라.」
- 전리품:
  - `hypatia_0` **천구의** (offhand) → `assets/items/hypatia_0.png`
  - `hypatia_1` **아스트롤라베** (necklace) → `assets/items/hypatia_1.png`
  - `hypatia_2` **천문 팔찌** (bracelet) → `assets/items/hypatia_2.png`

### 손자의 화신 `sunzi` — 정예 · 화신

- 설명: 싸우지 않고 이기는 법 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/sunzi.png` (지금은 📜)
- 프롬프트: 손자의 화신 — 싸우지 않고 이기는 법. 알렉산드리아 대도서관(제7격 설화)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「싸움은 이미 끝나 있었다. 네가 이긴 쪽에 서 있었을 뿐.」
- 전리품:
  - `sunzi_0` **병법의 죽간** (weapon) → `assets/items/sunzi_0.png`
  - `sunzi_1` **그림자 각반** (greaves) → `assets/items/sunzi_1.png`
  - `sunzi_2` **허를 찌르는 투구** (helm) → `assets/items/sunzi_2.png`

### 레오나르도 다 빈치의 화신 `davinci` — 일반 · 화신

- 설명: 다 그리지 못한 설계도 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/davinci.png` (지금은 🎨)
- 프롬프트: 레오나르도 다 빈치의 화신 — 다 그리지 못한 설계도. 알렉산드리아 대도서관(제7격 설화)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「설계도는 아직 덜 그렸다. 네 몸으로 마저 그려 보자.」
- 전리품:
  - `davinci_0` **날개 설계도** (offhand) → `assets/items/davinci_0.png`
  - `davinci_1` **비행 장치** (boots) → `assets/items/davinci_1.png`
  - `davinci_2` **설계도 각반** (greaves) → `assets/items/davinci_2.png`

### 헤로도토스의 화신 `herodotos` — 일반 · 화신

- 설명: 처음으로 기록한 자 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/herodotos.png` (지금은 🗺️)
- 프롬프트: 헤로도토스의 화신 — 처음으로 기록한 자. 알렉산드리아 대도서관(제7격 설화)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「네가 한 일을 있는 그대로 적어 두겠다. 부풀리지는 않는다.」
- 전리품:
  - `herodotos_0` **기록자의 두건** (helm) → `assets/items/herodotos_0.png`
  - `herodotos_1` **역사의 첫 장** (necklace) → `assets/items/herodotos_1.png`
  - `herodotos_2` **여행자의 망토** (cloak) → `assets/items/herodotos_2.png`

### 잔 다르크의 화신 `joan` — 일반 · 화신

- 설명: 불타는 오를레앙의 처녀 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/joan.png` (지금은 ⚜️)
- 프롬프트: 잔 다르크의 화신 — 불타는 오를레앙의 처녀. 알렉산드리아 대도서관(제7격 설화)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「목소리가 시키는 대로 갔을 뿐이야. 이번엔 네가 가는 길을 따라가지.」
- 전리품:
  - `joan_0` **성녀의 견갑** (shoulder) → `assets/items/joan_0.png`
  - `joan_1` **오를레앙의 흰 갑주** (armor) → `assets/items/joan_1.png`
  - `joan_2` **재가 되지 않는 심장** (necklace) → `assets/items/joan_2.png`

### 스파르타쿠스의 화신 `spartacus` — 정예 · 화신

- 설명: 사슬을 끊은 검투사 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/spartacus.png` (지금은 ⛓️)
- 프롬프트: 스파르타쿠스의 화신 — 사슬을 끊은 검투사. 알렉산드리아 대도서관(제7격 설화)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「사슬은 끊으라고 있는 것이다. 네 사슬도 같이 끊어 주마.」
- 전리품:
  - `spartacus_0` **부러진 글라디우스** (weapon) → `assets/items/spartacus_0.png`
  - `spartacus_1` **검투사의 방패** (offhand) → `assets/items/spartacus_1.png`
  - `spartacus_2` **끊어진 족쇄** (bracelet) → `assets/items/spartacus_2.png`

### 칭기즈 칸의 화신 `genghis` — 일반 · 화신

- 설명: 지평선을 국경으로 삼은 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/genghis.png` (지금은 🏇)
- 프롬프트: 칭기즈 칸의 화신 — 지평선을 국경으로 삼은. 알렉산드리아 대도서관(제7격 설화)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「지평선 너머가 궁금하지 않나? 말을 내줄 테니 달려라.」
- 전리품:
  - `genghis_0` **초원의 어깨가리개** (shoulder) → `assets/items/genghis_0.png`
  - `genghis_1` **천리마의 등자** (boots) → `assets/items/genghis_1.png`
  - `genghis_2` **칸의 인장** (ring) → `assets/items/genghis_2.png`

### 알렉산드로스의 화신 `alexander` — 일반 · 화신

- 설명: 온 세계가 좁았던 자 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/alexander.png` (지금은 🐎)
- 프롬프트: 알렉산드로스의 화신 — 온 세계가 좁았던 자. 알렉산드리아 대도서관(제7격 설화)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「세계가 좁았다. 네가 가는 곳은 얼마나 넓은지 보고 싶군.」
- 전리품:
  - `alexander_0` **정복자의 투구** (helm) → `assets/items/alexander_0.png`
  - `alexander_1` **마케도니아 흉갑** (armor) → `assets/items/alexander_1.png`
  - `alexander_4` **칼로 끊은 매듭** (special·relic) → `assets/items/alexander_4.png`

### 헤르메스 트리스메기스투스의 화신 `trismegistus` — 히든 · 화신

- 설명: 위에서와 같이 아래에서도 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/trismegistus.png` (지금은 ⚗️)
- 프롬프트: 헤르메스 트리스메기스투스의 화신 — 위에서와 같이 아래에서도. 알렉산드리아 대도서관(제7격 설화)의 히든 적. 전신 도트 일러스트, 투명 배경. 신비롭고 은은히 빛나는 외형.
- 화신의 한마디: 「위에서와 같이 아래에서도. 네가 선 자리가 곧 그 증거다.」
- 전리품:
  - `trismegistus_0` **에메랄드 서판** (special·relic) → `assets/items/trismegistus_0.png`
  - `trismegistus_1` **현자의 돌** (special·gem) → `assets/items/trismegistus_1.png`

### 이순신의 화신 `yisunsin` — 보스 · 화신

- 설명: 아직 열두 척이 남았다 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/yisunsin.png` (지금은 ⚓)
- 프롬프트: 이순신의 화신 — 아직 열두 척이 남았다. 알렉산드리아 대도서관(제7격 설화)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 화신의 한마디: 「신에게는 아직 열두 척의 배가 남아 있사옵니다. 함께 나아가지요.」
- 전리품:
  - `yisunsin_0` **쌍룡검** (weapon) → `assets/items/yisunsin_0.png`
  - `yisunsin_1` **두정갑** (armor) → `assets/items/yisunsin_1.png`
  - `yisunsin_2` **난중일기** (necklace) → `assets/items/yisunsin_2.png`


---

## 제8격 무림 — 천하제일 비무대

> 강호에 이름 석 자를 남기려는 자들이 오른다. 걸어서 내려간 자는 손에 꼽는다.

### 흑도 낭인 `nangin` — 일반 · 화신

- 설명: 값만 맞으면 누구든 벤다 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/nangin.png` (지금은 🗡️)
- 프롬프트: 흑도 낭인 — 값만 맞으면 누구든 벤다. 천하제일 비무대(제8격 무림)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「값은 이미 치렀다. 이제부터 내 칼은 네 것이다.」
- 전리품:
  - `nangin_0` **이 빠진 박도** (weapon) → `assets/items/nangin_0.png`
  - `nangin_1` **떠돌이 짚신** (boots) → `assets/items/nangin_1.png`

### 개방 장로 `gaebang` — 일반 · 화신

- 설명: 천하의 소문은 거지가 먼저 안다 / 성격: 행운 — 싸움은 약해지고 전리품이 늘어난다
- 몬스터 그림: `assets/monsters/gaebang.png` (지금은 🥢)
- 프롬프트: 개방 장로 — 천하의 소문은 거지가 먼저 안다. 천하제일 비무대(제8격 무림)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「소문은 거지가 제일 빠르지. 네 소문은 내가 퍼뜨려 주마.」
- 전리품:
  - `gaebang_0` **타구봉** (weapon) → `assets/items/gaebang_0.png`
  - `gaebang_1` **아홉 매듭 띠** (belt) → `assets/items/gaebang_1.png`

### 아미파 사태 `emei` — 일반 · 화신

- 설명: 자비로운 얼굴, 자비 없는 비수 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/emei.png` (지금은 📿)
- 프롬프트: 아미파 사태 — 자비로운 얼굴, 자비 없는 비수. 천하제일 비무대(제8격 무림)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「자비롭게 웃으며 찌를 줄도 안다. 함께 가면 쓸모가 있을 거다.」
- 전리품:
  - `emei_0` **아미자** (offhand) → `assets/items/emei_0.png`
  - `emei_1` **백팔 염주** (bracelet) → `assets/items/emei_1.png`

### 소림 나한 `shaolin` — 일반 · 화신

- 설명: 쇠를 두드려 몸을 만든 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/shaolin.png` (지금은 🙏)
- 프롬프트: 소림 나한 — 쇠를 두드려 몸을 만든. 천하제일 비무대(제8격 무림)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「몸은 쇠처럼, 마음은 물처럼. 맞는 법부터 배워라.」
- 전리품:
  - `shaolin_0` **금강 권갑** (gloves) → `assets/items/shaolin_0.png`
  - `shaolin_1` **철포삼** (armor) → `assets/items/shaolin_1.png`

### 달마의 화신 `dalma` — 정예 · 화신

- 설명: 벽을 보고 아홉 해 / 성격: 성장 — 싸움은 약해지고 경험치를 더 얻는다
- 몬스터 그림: `assets/monsters/dalma.png` (지금은 🧘)
- 프롬프트: 달마의 화신 — 벽을 보고 아홉 해. 천하제일 비무대(제8격 무림)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「…구 년째 벽만 보다가 너를 봤다. 나쁘지 않군.」
- 전리품:
  - `dalma_0` **세수경** (offhand) → `assets/items/dalma_0.png`
  - `dalma_1` **면벽의 염주** (necklace) → `assets/items/dalma_1.png`
  - `dalma_2` **갈대 한 줄기 가사** (cloak) → `assets/items/dalma_2.png`

### 무당 도사 `wudang` — 일반 · 화신

- 설명: 부드러움이 굳셈을 이긴다 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/wudang.png` (지금은 ☯️)
- 프롬프트: 무당 도사 — 부드러움이 굳셈을 이긴다. 천하제일 비무대(제8격 무림)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「힘을 빼라. 센 것은 부드러운 것에게 진다.」
- 전리품:
  - `wudang_0` **송문고검** (weapon) → `assets/items/wudang_0.png`
  - `wudang_1` **태극 도포** (cloak) → `assets/items/wudang_1.png`

### 사천당가 독수 `tangga` — 일반 · 화신

- 설명: 손끝마다 다른 독 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/tangga.png` (지금은 🧪)
- 프롬프트: 사천당가 독수 — 손끝마다 다른 독. 천하제일 비무대(제8격 무림)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「손끝이 닿기만 해도 족하다. 네 적에게도 알려 주지.」
- 전리품:
  - `tangga_0` **독침 반지** (ring) → `assets/items/tangga_0.png`
  - `tangga_1` **암기 견대** (shoulder) → `assets/items/tangga_1.png`

### 화산파 매화검수 `hwasan` — 일반 · 화신

- 설명: 검 끝에 매화가 핀다 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/hwasan.png` (지금은 🌸)
- 프롬프트: 화산파 매화검수 — 검 끝에 매화가 핀다. 천하제일 비무대(제8격 무림)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「매화는 눈 속에서 핀다. 네 앞길이 얼어 있을수록 좋지.」
- 전리품:
  - `hwasan_0` **매화 두건** (helm) → `assets/items/hwasan_0.png`
  - `hwasan_1` **암향 신** (boots) → `assets/items/hwasan_1.png`

### 장삼봉의 화신 `zhangsanfeng` — 정예 · 화신

- 설명: 태극을 처음 그린 자 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/zhangsanfeng.png` (지금은 ⛰️)
- 프롬프트: 장삼봉의 화신 — 태극을 처음 그린 자. 천하제일 비무대(제8격 무림)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「원을 그려 보아라. 끝과 시작이 만나는 곳에 답이 있다.」
- 전리품:
  - `zhangsanfeng_0` **진무검** (weapon) → `assets/items/zhangsanfeng_0.png`
  - `zhangsanfeng_1` **태극 팔찌** (bracelet) → `assets/items/zhangsanfeng_1.png`
  - `zhangsanfeng_2` **구름 위를 걷는 각반** (greaves) → `assets/items/zhangsanfeng_2.png`

### 남궁세가 가주 `namgung` — 일반 · 화신

- 설명: 창공을 가르는 세가의 검 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/namgung.png` (지금은 🏯)
- 프롬프트: 남궁세가 가주 — 창공을 가르는 세가의 검. 천하제일 비무대(제8격 무림)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「남궁의 검은 하늘을 가른다. 네 앞길도 갈라 주지.」
- 전리품:
  - `namgung_0` **세가의 옥패** (necklace) → `assets/items/namgung_0.png`
  - `namgung_1` **창궁 각반** (greaves) → `assets/items/namgung_1.png`

### 북해빙궁 무사 `bukhae` — 일반 · 화신

- 설명: 얼음 궁에서 내려온 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/bukhae.png` (지금은 🧊)
- 프롬프트: 북해빙궁 무사 — 얼음 궁에서 내려온. 천하제일 비무대(제8격 무림)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「얼음 궁은 춥지만 사람은 따뜻하더군. 오래 곁에 있어도 되겠나.」
- 전리품:
  - `bukhae_0` **한빙 갑의** (armor) → `assets/items/bukhae_0.png`
  - `bukhae_1` **서리 투구** (helm) → `assets/items/bukhae_1.png`

### 천마 `cheonma` — 보스 · 화신

- 설명: 하늘 아래 마(魔)는 하나뿐 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/cheonma.png` (지금은 🌑)
- 프롬프트: 천마 — 하늘 아래 마(魔)는 하나뿐. 천하제일 비무대(제8격 무림)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 화신의 한마디: 「하늘 아래 마(魔)는 하나뿐이다. 이제 그 하나가 네 안에 산다.」
- 전리품:
  - `cheonma_0` **천마검** (weapon) → `assets/items/cheonma_0.png`
  - `cheonma_1` **천마흑포** (armor) → `assets/items/cheonma_1.png`
  - `cheonma_3` **천마의 비급** (special·relic) → `assets/items/cheonma_3.png`


---

## 제9격 영물 — 만년설 덮인 천산

> 무림인이 평생을 걸고 찾는 내단의 주인들이 산다. 대개는 찾는 쪽이 먹힌다.

### 백년 영사 `yeongsa` — 일반 · 화신

- 설명: 내단을 품고 똬리를 튼 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/yeongsa.png` (지금은 🐍)
- 프롬프트: 백년 영사 — 내단을 품고 똬리를 튼. 만년설 덮인 천산(제9격 영물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「백 년을 똬리 틀고 기다렸다. 이제 움직일 때가 되었군.」
- 전리품:
  - `yeongsa_0` **영사의 내단** (necklace) → `assets/items/yeongsa_0.png`
  - `yeongsa_1` **허물 벗은 신** (boots) → `assets/items/yeongsa_1.png`

### 금잠고 `geumjam` — 일반 · 화신

- 설명: 독충을 다 잡아먹고 남은 하나 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/geumjam.png` (지금은 🐛)
- 프롬프트: 금잠고 — 독충을 다 잡아먹고 남은 하나. 만년설 덮인 천산(제9격 영물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「독충을 다 먹고 남은 건 나 하나. 너도 남는 쪽이 되어라.」
- 전리품:
  - `geumjam_0` **금잠 반지** (ring) → `assets/items/geumjam_0.png`
  - `geumjam_1` **금사 장갑** (gloves) → `assets/items/geumjam_1.png`

### 세 발 금두꺼비 `geumseom` — 일반 · 화신

- 설명: 물고 있던 동전을 뱉으면 복이 온다 / 성격: 행운 — 싸움은 약해지고 전리품이 늘어난다
- 몬스터 그림: `assets/monsters/geumseom.png` (지금은 🐸)
- 프롬프트: 세 발 금두꺼비 — 물고 있던 동전을 뱉으면 복이 온다. 만년설 덮인 천산(제9격 영물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「동전 하나 뱉어 주마. 복이란 건 받는 쪽이 하기 나름이다.」
- 전리품:
  - `geumseom_0` **금섬 팔찌** (bracelet) → `assets/items/geumseom_0.png`
  - `geumseom_1` **금전표** (offhand) → `assets/items/geumseom_1.png`

### 천년 산삼 동자 `sansam` — 일반 · 화신

- 설명: 사람 꼴을 하고 산을 뛰어다니는 뿌리 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/sansam.png` (지금은 🌱)
- 프롬프트: 천년 산삼 동자 — 사람 꼴을 하고 산을 뛰어다니는 뿌리. 만년설 덮인 천산(제9격 영물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「캐려고 오는 사람은 많았지. 같이 가자고 한 건 네가 처음이다.」
- 전리품:
  - `sansam_0` **산삼 뿌리 띠** (belt) → `assets/items/sansam_0.png`
  - `sansam_1` **천년 삼 팔찌** (bracelet) → `assets/items/sansam_1.png`

### 구미호 `gumiho` — 정예 · 화신

- 설명: 천 년을 채우면 사람이 된다 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/gumiho.png` (지금은 🦊)
- 프롬프트: 구미호 — 천 년을 채우면 사람이 된다. 만년설 덮인 천산(제9격 영물)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「천 년을 채우면 사람이 된다더군. 네 곁이면 채울 만하겠어.」
- 전리품:
  - `gumiho_0` **여우 구슬** (necklace) → `assets/items/gumiho_0.png`
  - `gumiho_1` **홀리는 반지** (ring) → `assets/items/gumiho_1.png`
  - `gumiho_2` **아홉 꼬리 목도리** (cloak) → `assets/items/gumiho_2.png`

### 빙잠 `bingjam` — 일반 · 화신

- 설명: 만년설 속에서 실을 토하는 누에 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/bingjam.png` (지금은 🪱)
- 프롬프트: 빙잠 — 만년설 속에서 실을 토하는 누에. 만년설 덮인 천산(제9격 영물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「만년설 속에서 실을 뽑았다. 네 길이 끊기지 않게 엮어 주마.」
- 전리품:
  - `bingjam_0` **천잠보의** (armor) → `assets/items/bingjam_0.png`
  - `bingjam_1` **빙잠사 망토** (cloak) → `assets/items/bingjam_1.png`

### 웅녀 `ungnyeo` — 일반 · 화신

- 설명: 쑥과 마늘로 백 일을 버틴 곰 / 성격: 성장 — 싸움은 약해지고 경험치를 더 얻는다
- 몬스터 그림: `assets/monsters/ungnyeo.png` (지금은 🐻)
- 프롬프트: 웅녀 — 쑥과 마늘로 백 일을 버틴 곰. 만년설 덮인 천산(제9격 영물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「백 일을 버텼다. 버티는 법이라면 가르쳐 줄 수 있지.」
- 전리품:
  - `ungnyeo_0` **쑥 화관** (helm) → `assets/items/ungnyeo_0.png`
  - `ungnyeo_1` **곰 발 각반** (greaves) → `assets/items/ungnyeo_1.png`

### 산군 `sangun` — 일반 · 화신

- 설명: 감히 이름으로 부르지 못하는 호랑이 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/sangun.png` (지금은 🐅)
- 프롬프트: 산군 — 감히 이름으로 부르지 못하는 호랑이. 만년설 덮인 천산(제9격 영물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「내 이름을 입에 올리는 자는 없었다. 네가 처음이군. 좋다.」
- 전리품:
  - `sangun_0` **산군의 어깨** (shoulder) → `assets/items/sangun_0.png`
  - `sangun_1` **호랑이 발톱** (weapon) → `assets/items/sangun_1.png`

### 금시조 `geumsijo` — 정예 · 화신

- 설명: 용을 잡아먹는 금빛 날개 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/geumsijo.png` (지금은 🦚)
- 프롬프트: 금시조 — 용을 잡아먹는 금빛 날개. 만년설 덮인 천산(제9격 영물)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「용도 먹고 산 날개다. 높이 나는 법을 알려 주마.」
- 전리품:
  - `geumsijo_0` **용을 찢는 발톱** (weapon) → `assets/items/geumsijo_0.png`
  - `geumsijo_1` **금빛 깃 견갑** (shoulder) → `assets/items/geumsijo_1.png`
  - `geumsijo_2` **바람을 딛는 발** (boots) → `assets/items/geumsijo_2.png`

### 화린 `hwarin` — 일반 · 화신

- 설명: 불을 밟고 다니는 기린 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/hwarin.png` (지금은 🦌)
- 프롬프트: 화린 — 불을 밟고 다니는 기린. 만년설 덮인 천산(제9격 영물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「불을 밟고 걸어도 풀 한 포기 안 태운다. 네 발밑도 그렇게 해 주지.」
- 전리품:
  - `hwarin_0` **화린 뿔창** (weapon) → `assets/items/hwarin_0.png`
  - `hwarin_1` **불을 밟는 신** (boots) → `assets/items/hwarin_1.png`

### 금강영구 `yeonggu` — 일반 · 화신

- 설명: 만 년을 등에 지고 걷는 거북 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/yeonggu.png` (지금은 🐢)
- 프롬프트: 금강영구 — 만 년을 등에 지고 걷는 거북. 만년설 덮인 천산(제9격 영물)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「만 년을 걸었으니 급할 것 없다. 천천히 가도 도착은 한다.」
- 전리품:
  - `yeonggu_0` **만년 귀갑** (offhand) → `assets/items/yeonggu_0.png`
  - `yeonggu_1` **거북 등 투구** (helm) → `assets/items/yeonggu_1.png`

### 봉황 `bonghwang` — 히든 · 화신

- 설명: 태평한 세상에만 내려앉는 새 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/bonghwang.png` (지금은 🎋)
- 프롬프트: 봉황 — 태평한 세상에만 내려앉는 새. 만년설 덮인 천산(제9격 영물)의 히든 적. 전신 도트 일러스트, 투명 배경. 신비롭고 은은히 빛나는 외형.
- 화신의 한마디: 「태평한 세상에만 내려앉는다. 네가 그런 세상을 만들 수 있겠나.」
- 전리품:
  - `bonghwang_0` **봉황의 비취** (special·gem) → `assets/items/bonghwang_0.png`
  - `bonghwang_1` **태평의 깃** (special·relic) → `assets/items/bonghwang_1.png`

### 이무기 `imugi` — 보스 · 화신

- 설명: 천 년을 기다려 하늘로 오르려는 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/imugi.png` (지금은 🐉)
- 프롬프트: 이무기 — 천 년을 기다려 하늘로 오르려는. 만년설 덮인 천산(제9격 영물)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 화신의 한마디: 「천 년을 기다렸다. 용이 되는 날이 오늘이라면 네 덕이다.」
- 전리품:
  - `imugi_0` **승천하지 못한 뿔** (weapon) → `assets/items/imugi_0.png`
  - `imugi_1` **역린 갑주** (armor) → `assets/items/imugi_1.png`
  - `imugi_3` **이무기의 여의주** (special·gem) → `assets/items/imugi_3.png`


---

## 제10격 영웅 — 엘리시온 평원

> 죽어서도 영웅인 자들만 이 들판을 걷는다.

### 테세우스의 화신 `theseus` — 일반 · 화신

- 설명: 돌아오는 길을 아는 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/theseus.png` (지금은 🧵)
- 프롬프트: 테세우스의 화신 — 돌아오는 길을 아는. 엘리시온 평원(제10격 영웅)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「미궁에서 돌아오는 길을 안다. 실 끝은 내가 쥐고 있지.」
- 전리품:
  - `theseus_0` **아테네의 견갑** (shoulder) → `assets/items/theseus_0.png`
  - `theseus_1` **아리아드네의 실타래** (necklace) → `assets/items/theseus_1.png`
  - `theseus_2` **미궁의 실 허리띠** (belt) → `assets/items/theseus_2.png`

### 페르세우스의 화신 `perseus` — 일반 · 화신

- 설명: 보지 않고 벤 자 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/perseus.png` (지금은 🪞)
- 프롬프트: 페르세우스의 화신 — 보지 않고 벤 자. 엘리시온 평원(제10격 영웅)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「보지 않고도 벤다. 눈을 감고 따라와라.」
- 전리품:
  - `perseus_0` **거울 방패** (offhand) → `assets/items/perseus_0.png`
  - `perseus_1` **날개 달린 신** (boots) → `assets/items/perseus_1.png`
  - `perseus_2` **보이지 않는 망토** (cloak) → `assets/items/perseus_2.png`

### 오디세우스의 화신 `odysseus` — 일반 · 화신

- 설명: 열 해를 헤매고도 돌아간 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/odysseus.png` (지금은 ⛵)
- 프롬프트: 오디세우스의 화신 — 열 해를 헤매고도 돌아간. 엘리시온 평원(제10격 영웅)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「열 해를 헤매도 돌아간다. 돌아가는 길이라면 내가 안내하마.」
- 전리품:
  - `odysseus_0` **열두 도끼를 꿰뚫은 손** (gloves) → `assets/items/odysseus_0.png`
  - `odysseus_1` **거지 행색의 누더기** (cloak) → `assets/items/odysseus_1.png`

### 아탈란테의 화신 `atalanta` — 일반 · 화신

- 설명: 누구보다 빨랐던 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/atalanta.png` (지금은 🏹)
- 프롬프트: 아탈란테의 화신 — 누구보다 빨랐던. 엘리시온 평원(제10격 영웅)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「나보다 빠르면 곁을 내주마. …방금 졌군, 내가.」
- 전리품:
  - `atalanta_0` **칼리돈의 활** (weapon) → `assets/items/atalanta_0.png`
  - `atalanta_1` **멈추지 않는 발** (boots) → `assets/items/atalanta_1.png`
  - `atalanta_2` **황금 사과** (ring) → `assets/items/atalanta_2.png`

### 엔키두의 화신 `enkidu` — 일반 · 화신

- 설명: 흙으로 빚어진 벗 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/enkidu.png` (지금은 🌿)
- 프롬프트: 엔키두의 화신 — 흙으로 빚어진 벗. 엘리시온 평원(제10격 영웅)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「흙에서 나와 흙으로 돌아간다. 그 사이는 벗과 함께면 족하다.」
- 전리품:
  - `enkidu_0` **들짐승의 가죽** (armor) → `assets/items/enkidu_0.png`
  - `enkidu_1` **야생의 각반** (greaves) → `assets/items/enkidu_1.png`
  - `enkidu_2` **흙으로 빚은 팔찌** (bracelet) → `assets/items/enkidu_2.png`

### 길가메시의 화신 `gilgamesh` — 정예 · 화신

- 설명: 영생을 놓친 왕 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/gilgamesh.png` (지금은 🗿)
- 프롬프트: 길가메시의 화신 — 영생을 놓친 왕. 엘리시온 평원(제10격 영웅)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「영생은 놓쳤다. 그래도 잡을 수 있는 건 아직 많더군.」
- 전리품:
  - `gilgamesh_0` **하늘 황소의 어깨** (shoulder) → `assets/items/gilgamesh_0.png`
  - `gilgamesh_1` **우루크의 왕관** (helm) → `assets/items/gilgamesh_1.png`
  - `gilgamesh_2` **시들어버린 영생초** (necklace) → `assets/items/gilgamesh_2.png`

### 헥토르의 화신 `hector` — 일반 · 화신

- 설명: 질 것을 알고도 나선 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/hector.png` (지금은 🏛️)
- 프롬프트: 헥토르의 화신 — 질 것을 알고도 나선. 엘리시온 평원(제10격 영웅)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「질 줄 알면서 나섰다. 너는 이기려고 나서라. 그 차이가 전부다.」
- 전리품:
  - `hector_0` **트로이의 방패** (offhand) → `assets/items/hector_0.png`
  - `hector_1` **성벽의 각반** (greaves) → `assets/items/hector_1.png`
  - `hector_2` **빛나는 투구** (helm) → `assets/items/hector_2.png`

### 아킬레우스의 화신 `achilles` — 일반 · 화신

- 설명: 발뒤꿈치 하나만 사람인 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/achilles.png` (지금은 🛡️)
- 프롬프트: 아킬레우스의 화신 — 발뒤꿈치 하나만 사람인. 엘리시온 평원(제10격 영웅)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「약점은 하나뿐이다. 그 하나를 네가 지켜 다오.」
- 전리품:
  - `achilles_0` **펠리온의 물푸레 창** (weapon) → `assets/items/achilles_0.png`
  - `achilles_1` **불멸의 청동 갑주** (armor) → `assets/items/achilles_1.png`
  - `achilles_2` **테티스가 잡았던 발목** (boots) → `assets/items/achilles_2.png`

### 쿠 훌린의 화신 `cuchulainn` — 일반 · 화신

- 설명: 빛의 아이 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/cuchulainn.png` (지금은 🔱)
- 프롬프트: 쿠 훌린의 화신 — 빛의 아이. 엘리시온 평원(제10격 영웅)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「빛의 아이는 쓰러지면서도 선 채로 죽는다. 너도 그리 서라.」
- 전리품:
  - `cuchulainn_0` **게 불그** (weapon) → `assets/items/cuchulainn_0.png`
  - `cuchulainn_1` **뒤틀림의 각반** (greaves) → `assets/items/cuchulainn_1.png`
  - `cuchulainn_2` **뒤틀림의 팔찌** (bracelet) → `assets/items/cuchulainn_2.png`

### 베오울프의 화신 `beowulf` — 정예 · 화신

- 설명: 맨손으로 괴물을 찢은 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/beowulf.png` (지금은 🐻)
- 프롬프트: 베오울프의 화신 — 맨손으로 괴물을 찢은. 엘리시온 평원(제10격 영웅)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「괴물은 맨손으로 찢는 거다. 칼은 그다음 일이고.」
- 전리품:
  - `beowulf_0` **그렌델의 팔** (gloves) → `assets/items/beowulf_0.png`
  - `beowulf_1` **곰가죽 투구** (helm) → `assets/items/beowulf_1.png`
  - `beowulf_2` **흐룬팅의 고리** (bracelet) → `assets/items/beowulf_2.png`

### 아르주나의 화신 `arjuna` — 일반 · 화신

- 설명: 과녁의 눈만 보이는 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/arjuna.png` (지금은 🎯)
- 프롬프트: 아르주나의 화신 — 과녁의 눈만 보이는. 엘리시온 평원(제10격 영웅)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「과녁의 눈만 보인다. 네 눈에도 그것만 보이게 해 주지.」
- 전리품:
  - `arjuna_0` **간디바** (weapon) → `assets/items/arjuna_0.png`
  - `arjuna_1` **집중의 고리** (bracelet) → `assets/items/arjuna_1.png`
  - `arjuna_2` **전차의 발판** (boots) → `assets/items/arjuna_2.png`

### 지그프리트의 화신 `siegfried` — 일반 · 화신

- 설명: 용의 피를 뒤집어쓴 자 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/siegfried.png` (지금은 🗡️)
- 프롬프트: 지그프리트의 화신 — 용의 피를 뒤집어쓴 자. 엘리시온 평원(제10격 영웅)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「용의 피를 뒤집어썼지만 등 한 곳은 젖지 않았다. 그곳은 네가 맡아라.」
- 전리품:
  - `siegfried_0` **마검 그람** (weapon) → `assets/items/siegfried_0.png`
  - `siegfried_1` **용피 갑주** (armor) → `assets/items/siegfried_1.png`
  - `siegfried_3` **파프니르의 피** (special·gem) → `assets/items/siegfried_3.png`

### 헤라클레스의 화신 `heracles` — 보스 · 화신

- 설명: 열두 번 죽고 열두 번 돌아온 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/heracles.png` (지금은 🦁)
- 프롬프트: 헤라클레스의 화신 — 열두 번 죽고 열두 번 돌아온. 엘리시온 평원(제10격 영웅)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 화신의 한마디: 「열두 번 죽고 열두 번 돌아왔다. 열세 번째도 같이 가자.」
- 전리품:
  - `heracles_0` **올리브 몽둥이** (weapon) → `assets/items/heracles_0.png`
  - `heracles_1` **네메아 사자의 가죽** (armor) → `assets/items/heracles_1.png`
  - `heracles_4` **네메아를 꺾은 주먹** (special·relic) → `assets/items/heracles_4.png`


---

## 제11격 천사 — 일곱 번째 하늘

> 노래가 한 번도 멈춘 적 없는 곳. 아홉 겹의 성가대가 문을 지킨다.

### 수호천사 `guardianangel` — 일반 · 화신

- 설명: 한 사람 곁에 하나씩 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/guardianangel.png` (지금은 😇)
- 프롬프트: 수호천사 — 한 사람 곁에 하나씩. 일곱 번째 하늘(제11격 천사)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「한 사람 곁에 하나씩. 이제 네 곁은 내 자리다.」
- 전리품:
  - `guardianangel_0` **깃털 한 장의 망토** (cloak) → `assets/items/guardianangel_0.png`
  - `guardianangel_1` **지켜보는 반지** (ring) → `assets/items/guardianangel_1.png`

### 권천사 `principality` — 일반 · 화신

- 설명: 나라 하나를 맡은 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/principality.png` (지금은 🛐)
- 프롬프트: 권천사 — 나라 하나를 맡은. 일곱 번째 하늘(제11격 천사)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「나라 하나를 맡았던 손이다. 네 하나쯤은 거뜬하지.」
- 전리품:
  - `principality_0` **나라를 맡은 관** (helm) → `assets/items/principality_0.png`
  - `principality_1` **홀을 찬 띠** (belt) → `assets/items/principality_1.png`

### 능천사 `powerangel` — 일반 · 화신

- 설명: 악을 쫓는 첫 번째 칼 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/powerangel.png` (지금은 🔆)
- 프롬프트: 능천사 — 악을 쫓는 첫 번째 칼. 일곱 번째 하늘(제11격 천사)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「악을 쫓는 첫 칼이 여기 있다. 겨눌 곳을 가리켜라.」
- 전리품:
  - `powerangel_0` **악을 쫓는 창** (weapon) → `assets/items/powerangel_0.png`
  - `powerangel_1` **능천사의 견갑** (shoulder) → `assets/items/powerangel_1.png`

### 나팔의 천사 `trumpetangel` — 일반 · 화신

- 설명: 일곱 나팔 중 첫째를 부는 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/trumpetangel.png` (지금은 🎺)
- 프롬프트: 나팔의 천사 — 일곱 나팔 중 첫째를 부는. 일곱 번째 하늘(제11격 천사)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「첫 나팔은 아직 불지 않았다. 네가 신호를 줄 때까지.」
- 전리품:
  - `trumpetangel_0` **첫째 나팔** (offhand) → `assets/items/trumpetangel_0.png`
  - `trumpetangel_1` **구름 디딤 신** (boots) → `assets/items/trumpetangel_1.png`

### 라파엘의 화신 `raphael` — 정예 · 화신

- 설명: 신이 고치신다 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/raphael.png` (지금은 ⚕️)
- 프롬프트: 라파엘의 화신 — 신이 고치신다. 일곱 번째 하늘(제11격 천사)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「신이 고치신다. 나는 그 손을 빌려줄 뿐이다.」
- 전리품:
  - `raphael_0` **치유의 팔찌** (bracelet) → `assets/items/raphael_0.png`
  - `raphael_1` **토비트의 물고기** (necklace) → `assets/items/raphael_1.png`
  - `raphael_2` **나그네의 띠** (belt) → `assets/items/raphael_2.png`

### 역천사 `virtueangel` — 일반 · 화신

- 설명: 기적을 맡은 / 성격: 행운 — 싸움은 약해지고 전리품이 늘어난다
- 몬스터 그림: `assets/monsters/virtueangel.png` (지금은 ✨)
- 프롬프트: 역천사 — 기적을 맡은. 일곱 번째 하늘(제11격 천사)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「기적은 드물어서 기적이다. 네 몫으로 한 번쯤 아껴 두마.」
- 전리품:
  - `virtueangel_0` **기적의 팔찌** (bracelet) → `assets/items/virtueangel_0.png`
  - `virtueangel_1` **기적을 행하는 손** (gloves) → `assets/items/virtueangel_1.png`

### 주천사 `dominion` — 일반 · 화신

- 설명: 천사들을 다스리는 천사 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/dominion.png` (지금은 🕊️)
- 프롬프트: 주천사 — 천사들을 다스리는 천사. 일곱 번째 하늘(제11격 천사)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「다스리는 자들을 다스려 왔다. 네 한 몸쯤이야.」
- 전리품:
  - `dominion_0` **다스림의 흉갑** (armor) → `assets/items/dominion_0.png`
  - `dominion_1` **주권의 목걸이** (necklace) → `assets/items/dominion_1.png`

### 좌천사 `throneangel` — 일반 · 화신

- 설명: 눈으로 가득한 바퀴 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/throneangel.png` (지금은 🛞)
- 프롬프트: 좌천사 — 눈으로 가득한 바퀴. 일곱 번째 하늘(제11격 천사)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「수많은 눈이 네 길을 보고 있다. 눈 돌릴 곳이 없을 거다.」
- 전리품:
  - `throneangel_0` **바퀴 속의 바퀴** (greaves) → `assets/items/throneangel_0.png`
  - `throneangel_1` **눈으로 가득한 관** (helm) → `assets/items/throneangel_1.png`

### 가브리엘의 화신 `gabriel` — 정예 · 화신

- 설명: 소식을 전하러 내려온 / 성격: 성장 — 싸움은 약해지고 경험치를 더 얻는다
- 몬스터 그림: `assets/monsters/gabriel.png` (지금은 📯)
- 프롬프트: 가브리엘의 화신 — 소식을 전하러 내려온. 일곱 번째 하늘(제11격 천사)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「소식을 가져왔다 — 이제 네가 소식이다.」
- 전리품:
  - `gabriel_0` **마지막 나팔** (offhand) → `assets/items/gabriel_0.png`
  - `gabriel_1` **백합 반지** (ring) → `assets/items/gabriel_1.png`
  - `gabriel_2` **전령의 관** (helm) → `assets/items/gabriel_2.png`

### 지품천사 `cherub` — 일반 · 화신

- 설명: 에덴의 동쪽에서 불칼을 든 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/cherub.png` (지금은 🦁)
- 프롬프트: 지품천사 — 에덴의 동쪽에서 불칼을 든. 일곱 번째 하늘(제11격 천사)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「불칼은 에덴을 지켰다. 이제 네 앞을 지킨다.」
- 전리품:
  - `cherub_0` **두루 도는 불칼** (weapon) → `assets/items/cherub_0.png`
  - `cherub_1` **네 얼굴의 견갑** (shoulder) → `assets/items/cherub_1.png`

### 치품천사 `seraph` — 일반 · 화신

- 설명: 여섯 날개로 얼굴을 가린 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/seraph.png` (지금은 🌞)
- 프롬프트: 치품천사 — 여섯 날개로 얼굴을 가린. 일곱 번째 하늘(제11격 천사)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「얼굴을 가린 건 눈부셔서가 아니다. 네가 부끄럽지 않게 하려는 거지.」
- 전리품:
  - `seraph_0` **여섯 날개** (cloak) → `assets/items/seraph_0.png`
  - `seraph_1` **숯불 집게** (gloves) → `assets/items/seraph_1.png`

### 미카엘의 화신 `michael` — 보스 · 화신

- 설명: 용을 하늘에서 떨어뜨린 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/michael.png` (지금은 ⚖️)
- 프롬프트: 미카엘의 화신 — 용을 하늘에서 떨어뜨린. 일곱 번째 하늘(제11격 천사)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 화신의 한마디: 「용을 떨어뜨린 칼이다. 네가 겨누는 건 무엇이든 떨어지겠지.」
- 전리품:
  - `michael_0` **용을 떨어뜨린 검** (weapon) → `assets/items/michael_0.png`
  - `michael_1` **천군의 갑주** (armor) → `assets/items/michael_1.png`
  - `michael_3` **미카엘의 저울** (special·relic) → `assets/items/michael_3.png`


---

## 제12격 악마 — 얼어붙은 코키토스

> 지옥의 맨 밑바닥은 불이 아니라 얼음이다. 등을 돌린 자들이 거기 얼어 있다.

### 레기온 `legion` — 일반 · 화신

- 설명: 우리의 이름은 군대, 우리는 많다 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/legion.png` (지금은 👥)
- 프롬프트: 레기온 — 우리의 이름은 군대, 우리는 많다. 얼어붙은 코키토스(제12격 악마)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「우리의 이름은 군대. 이제 우리 전부가 네 이름이 된다.」
- 전리품:
  - `legion_0` **이천 마리 돼지가죽** (armor) → `assets/items/legion_0.png`
  - `legion_1` **많은 이름의 반지** (ring) → `assets/items/legion_1.png`

### 몰록의 화신 `moloch` — 일반 · 화신

- 설명: 불타는 제단 위의 황소 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/moloch.png` (지금은 🐂)
- 프롬프트: 몰록의 화신 — 불타는 제단 위의 황소. 얼어붙은 코키토스(제12격 악마)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「제단은 늘 배고프다. 네가 바치는 건 승리뿐이면 좋겠군.」
- 전리품:
  - `moloch_0` **황소 머리 투구** (helm) → `assets/items/moloch_0.png`
  - `moloch_1` **제단 불에 그을린 손** (gloves) → `assets/items/moloch_1.png`

### 바포메트의 화신 `baphomet` — 일반 · 화신

- 설명: 녹이고 굳히는 염소 머리 우상 / 성격: 성장 — 싸움은 약해지고 경험치를 더 얻는다
- 몬스터 그림: `assets/monsters/baphomet.png` (지금은 🐐)
- 프롬프트: 바포메트의 화신 — 녹이고 굳히는 염소 머리 우상. 얼어붙은 코키토스(제12격 악마)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「녹이고 굳히는 건 내 일이다. 네 약점도 굳혀 주지.」
- 전리품:
  - `baphomet_0` **염소 머리 우상** (offhand) → `assets/items/baphomet_0.png`
  - `baphomet_1` **녹이고 굳히는 팔찌** (bracelet) → `assets/items/baphomet_1.png`

### 아자젤의 화신 `azazel` — 일반 · 화신

- 설명: 사람에게 칼 벼리는 법을 가르친 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/azazel.png` (지금은 ⚒️)
- 프롬프트: 아자젤의 화신 — 사람에게 칼 벼리는 법을 가르친. 얼어붙은 코키토스(제12격 악마)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「칼 벼리는 법을 알려 준 죄로 갇혔다. 네게도 가르쳐 주지, 값은 나중에.」
- 전리품:
  - `azazel_0` **처음 벼린 칼** (weapon) → `assets/items/azazel_0.png`
  - `azazel_1` **감시자의 견갑** (shoulder) → `assets/items/azazel_1.png`

### 벨제부브의 화신 `beelzebub` — 정예 · 화신

- 설명: 파리 떼의 왕 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/beelzebub.png` (지금은 🪰)
- 프롬프트: 벨제부브의 화신 — 파리 떼의 왕. 얼어붙은 코키토스(제12격 악마)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「파리 떼가 네 앞길을 먼저 훑어 줄 거다.」
- 전리품:
  - `beelzebub_0` **파리 떼의 관** (helm) → `assets/items/beelzebub_0.png`
  - `beelzebub_1` **파리 날개 갑의** (armor) → `assets/items/beelzebub_1.png`
  - `beelzebub_2` **배를 채우지 못하는 손** (gloves) → `assets/items/beelzebub_2.png`

### 메피스토펠레스의 화신 `mephisto` — 일반 · 화신

- 설명: 영혼을 값으로 쳐주는 상인 / 성격: 행운 — 싸움은 약해지고 전리품이 늘어난다
- 몬스터 그림: `assets/monsters/mephisto.png` (지금은 🎩)
- 프롬프트: 메피스토펠레스의 화신 — 영혼을 값으로 쳐주는 상인. 얼어붙은 코키토스(제12격 악마)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「영혼은 값으로 쳐주마. 네 건 아직 받지 않았으니 안심해라.」
- 전리품:
  - `mephisto_0` **피로 쓴 계약서** (necklace) → `assets/items/mephisto_0.png`
  - `mephisto_1` **진홍 외투** (cloak) → `assets/items/mephisto_1.png`

### 아스타로트의 화신 `astaroth` — 일반 · 화신

- 설명: 독사를 타고 오는 공작 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/astaroth.png` (지금은 🦎)
- 프롬프트: 아스타로트의 화신 — 독사를 타고 오는 공작. 얼어붙은 코키토스(제12격 악마)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「독사를 타고 왔다. 물리는 쪽은 늘 네 적이 되겠지.」
- 전리품:
  - `astaroth_0` **독사를 탄 신** (boots) → `assets/items/astaroth_0.png`
  - `astaroth_1` **독사 허리띠** (belt) → `assets/items/astaroth_1.png`

### 벨리알의 화신 `belial` — 일반 · 화신

- 설명: 불의 전차를 탄 무가치한 자 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/belial.png` (지금은 🕯️)
- 프롬프트: 벨리알의 화신 — 불의 전차를 탄 무가치한 자. 얼어붙은 코키토스(제12격 악마)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「무가치한 자라 불렸다. 그래서 자유롭다. 너도 그 편이 편할걸.」
- 전리품:
  - `belial_0` **무가치의 검** (weapon) → `assets/items/belial_0.png`
  - `belial_1` **불의 전차 각반** (greaves) → `assets/items/belial_1.png`

### 아스모데우스의 화신 `asmodeus` — 정예 · 화신

- 설명: 솔로몬의 반지를 빼앗은 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/asmodeus.png` (지금은 💍)
- 프롬프트: 아스모데우스의 화신 — 솔로몬의 반지를 빼앗은. 얼어붙은 코키토스(제12격 악마)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「솔로몬의 반지도 빼앗았다. 네 앞길의 문쯤이야.」
- 전리품:
  - `asmodeus_0` **솔로몬의 반지** (ring) → `assets/items/asmodeus_0.png`
  - `asmodeus_1` **세 머리의 목걸이** (necklace) → `assets/items/asmodeus_1.png`
  - `asmodeus_2` **불타는 발굽** (boots) → `assets/items/asmodeus_2.png`

### 파이몬의 화신 `paimon` — 일반 · 화신

- 설명: 서쪽을 다스리는 지옥의 왕 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/paimon.png` (지금은 🐪)
- 프롬프트: 파이몬의 화신 — 서쪽을 다스리는 지옥의 왕. 얼어붙은 코키토스(제12격 악마)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「서쪽 끝까지 다스렸다. 길을 물으면 대답해 주마.」
- 전리품:
  - `paimon_0` **파이몬의 왕관** (helm) → `assets/items/paimon_0.png`
  - `paimon_1` **모든 학문의 책** (offhand) → `assets/items/paimon_1.png`

### 릴리스의 화신 `lilith` — 일반 · 화신

- 설명: 에덴을 먼저 떠난 자 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/lilith.png` (지금은 🌒)
- 프롬프트: 릴리스의 화신 — 에덴을 먼저 떠난 자. 얼어붙은 코키토스(제12격 악마)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「먼저 떠난 자가 길을 안다. 따라와라, 뒤돌아보지 말고.」
- 전리품:
  - `lilith_0` **밤의 목걸이** (necklace) → `assets/items/lilith_0.png`
  - `lilith_1` **첫 아내의 팔찌** (bracelet) → `assets/items/lilith_1.png`

### 루시퍼의 화신 `lucifer` — 보스 · 화신

- 설명: 가장 빛나던 별, 가장 깊이 떨어진 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/lucifer.png` (지금은 🌠)
- 프롬프트: 루시퍼의 화신 — 가장 빛나던 별, 가장 깊이 떨어진. 얼어붙은 코키토스(제12격 악마)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 화신의 한마디: 「가장 높이 있었기에 가장 깊이 떨어졌다. 너는 떨어지지 마라.」
- 전리품:
  - `lucifer_0` **새벽별의 검** (weapon) → `assets/items/lucifer_0.png`
  - `lucifer_2` **빛을 잃은 여섯 날개** (cloak) → `assets/items/lucifer_2.png`
  - `lucifer_3` **새벽별 조각** (special·relic) → `assets/items/lucifer_3.png`


---

## 제13격 신격 — 이그드라실의 가지

> 아홉 세계가 이 나무 하나에 매달려 있다. 어느 신화든 여기서 만난다.

### 헤르메스의 화신 `hermes` — 일반 · 화신

- 설명: 경계를 넘나드는 전령 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/hermes.png` (지금은 🪽)
- 프롬프트: 헤르메스의 화신 — 경계를 넘나드는 전령. 이그드라실의 가지(제13격 신격)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「경계를 넘나드는 게 내 일이다. 너를 건너편까지 배달해 주지.」
- 전리품:
  - `hermes_0` **날개 달린 샌들** (boots) → `assets/items/hermes_0.png`
  - `hermes_1` **카두케우스** (offhand) → `assets/items/hermes_1.png`
  - `hermes_3` **전령의 날개** (special·relic) → `assets/items/hermes_3.png`

### 바스테트의 화신 `bastet` — 일반 · 화신

- 설명: 집과 전쟁을 함께 지키는 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/bastet.png` (지금은 🐈)
- 프롬프트: 바스테트의 화신 — 집과 전쟁을 함께 지키는. 이그드라실의 가지(제13격 신격)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「집도 전쟁도 지킨다. 어느 쪽이 필요하냐.」
- 전리품:
  - `bastet_0` **고양이의 눈** (ring) → `assets/items/bastet_0.png`
  - `bastet_1` **소리 없는 각반** (greaves) → `assets/items/bastet_1.png`
  - `bastet_2` **고양이 팔찌** (bracelet) → `assets/items/bastet_2.png`

### 아누비스의 화신 `anubis` — 일반 · 화신

- 설명: 심장의 무게를 재는 자 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/anubis.png` (지금은 🐺)
- 프롬프트: 아누비스의 화신 — 심장의 무게를 재는 자. 이그드라실의 가지(제13격 신격)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「심장을 달아 보았다. 네 쪽이 더 가볍더군. 좋은 뜻이다.」
- 전리품:
  - `anubis_0` **방부사의 어깨띠** (shoulder) → `assets/items/anubis_0.png`
  - `anubis_1` **재칼의 가면** (helm) → `assets/items/anubis_1.png`
  - `anubis_2` **마아트의 저울** (necklace) → `assets/items/anubis_2.png`

### 아르테미스의 화신 `artemis` — 일반 · 화신

- 설명: 달과 사냥의 주인 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/artemis.png` (지금은 🌙)
- 프롬프트: 아르테미스의 화신 — 달과 사냥의 주인. 이그드라실의 가지(제13격 신격)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「달이 뜨면 사냥을 시작한다. 쫓을 것을 가리켜라.」
- 전리품:
  - `artemis_0` **초승달 활** (weapon) → `assets/items/artemis_0.png`
  - `artemis_1` **사슴가죽 신** (boots) → `assets/items/artemis_1.png`
  - `artemis_2` **달빛 망토** (cloak) → `assets/items/artemis_2.png`

### 로키의 화신 `loki` — 정예 · 화신

- 설명: 묶여서도 웃는 자 / 성격: 행운 — 싸움은 약해지고 전리품이 늘어난다
- 몬스터 그림: `assets/monsters/loki.png` (지금은 🦊)
- 프롬프트: 로키의 화신 — 묶여서도 웃는 자. 이그드라실의 가지(제13격 신격)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「묶여서도 웃었지. 웃을 일이 하나 늘었군, 네 덕에.」
- 전리품:
  - `loki_0` **거짓의 단검** (offhand) → `assets/items/loki_0.png`
  - `loki_1` **뒤바뀐 반지** (bracelet) → `assets/items/loki_1.png`
  - `loki_2` **슬레이프니르의 갈기** (necklace) → `assets/items/loki_2.png`

### 스사노오의 화신 `susanoo` — 일반 · 화신

- 설명: 쫓겨나서 영웅이 된 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/susanoo.png` (지금은 🌪️)
- 프롬프트: 스사노오의 화신 — 쫓겨나서 영웅이 된. 이그드라실의 가지(제13격 신격)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「쫓겨나서 영웅이 됐다. 쫓겨나는 것도 나쁘지 않다.」
- 전리품:
  - `susanoo_0` **아메노하바키리** (weapon) → `assets/items/susanoo_0.png`
  - `susanoo_1` **폭풍의 겉옷** (cloak) → `assets/items/susanoo_1.png`
  - `susanoo_2` **폭풍 팔찌** (bracelet) → `assets/items/susanoo_2.png`

### 토르의 화신 `thor` — 일반 · 화신

- 설명: 천둥을 손에 쥔 자 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/thor.png` (지금은 ⚡)
- 프롬프트: 토르의 화신 — 천둥을 손에 쥔 자. 이그드라실의 가지(제13격 신격)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「천둥은 부르는 것이 아니라 쥐는 것이다. 자, 잡아라.」
- 전리품:
  - `thor_0` **묠니르** (weapon) → `assets/items/thor_0.png`
  - `thor_1` **야른그레이프르** (gloves) → `assets/items/thor_1.png`
  - `thor_3` **메긴교르드의 고리** (special·gem) → `assets/items/thor_3.png`

### 아레스의 화신 `ares` — 일반 · 화신

- 설명: 전쟁 그 자체 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/ares.png` (지금은 ⚔️)
- 프롬프트: 아레스의 화신 — 전쟁 그 자체. 이그드라실의 가지(제13격 신격)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「전쟁 그 자체다. 싸우고 싶을 때 내 이름을 불러라.」
- 전리품:
  - `ares_0` **전화(戰禍)의 견갑** (shoulder) → `assets/items/ares_0.png`
  - `ares_1` **전화(戰禍)의 갑주** (armor) → `assets/items/ares_1.png`
  - `ares_2` **포보스의 투구** (helm) → `assets/items/ares_2.png`

### 포세이돈의 화신 `poseidon` — 정예 · 화신

- 설명: 땅을 흔드는 자 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/poseidon.png` (지금은 🌊)
- 프롬프트: 포세이돈의 화신 — 땅을 흔드는 자. 이그드라실의 가지(제13격 신격)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「땅이 흔들리면 내가 움직이는 거다. 파도도 네 편이다.」
- 전리품:
  - `poseidon_0` **삼지창** (weapon) → `assets/items/poseidon_0.png`
  - `poseidon_1` **파도를 딛는 신** (boots) → `assets/items/poseidon_1.png`
  - `poseidon_2` **심해의 진주** (necklace) → `assets/items/poseidon_2.png`

### 아마테라스의 화신 `amaterasu` — 일반 · 화신

- 설명: 동굴에서 나온 해 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/amaterasu.png` (지금은 🌅)
- 프롬프트: 아마테라스의 화신 — 동굴에서 나온 해. 이그드라실의 가지(제13격 신격)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「동굴에서 나온 해다. 네 앞이 어두우면 나를 불러라.」
- 전리품:
  - `amaterasu_0` **하늘 옷** (cloak) → `assets/items/amaterasu_0.png`
  - `amaterasu_1` **야타의 관** (helm) → `assets/items/amaterasu_1.png`
  - `amaterasu_2` **야사카니의 곡옥** (ring) → `assets/items/amaterasu_2.png`

### 이시스의 화신 `isis` — 일반 · 화신

- 설명: 흩어진 것을 다시 모으는 / 성격: 성장 — 싸움은 약해지고 경험치를 더 얻는다
- 몬스터 그림: `assets/monsters/isis.png` (지금은 🪬)
- 프롬프트: 이시스의 화신 — 흩어진 것을 다시 모으는. 이그드라실의 가지(제13격 신격)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「흩어진 것은 다시 모으면 된다. 네가 흩어져도 마찬가지다.」
- 전리품:
  - `isis_0` **생명의 매듭** (gloves) → `assets/items/isis_0.png`
  - `isis_1` **아마포 감개** (belt) → `assets/items/isis_1.png`
  - `isis_2` **앙크** (necklace) → `assets/items/isis_2.png`

### 하데스의 화신 `hades` — 보스 · 화신

- 설명: 돌아온 자가 없는 문의 주인 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/hades.png` (지금은 💀)
- 프롬프트: 하데스의 화신 — 돌아온 자가 없는 문의 주인. 이그드라실의 가지(제13격 신격)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 화신의 한마디: 「돌아온 자가 없는 문이다. 네가 첫 번째가 되겠군.」
- 전리품:
  - `hades_0` **명계의 이지창** (weapon) → `assets/items/hades_0.png`
  - `hades_1` **보이지 않게 하는 투구** (helm) → `assets/items/hades_1.png`
  - `hades_2` **케르베로스의 사슬** (necklace) → `assets/items/hades_2.png`


---

## 제14격 주신 — 올림포스 정상

> 어느 신화의 주신이든, 결국 정상에서는 마주치게 된다.

### 오시리스의 화신 `osiris` — 일반 · 화신

- 설명: 찢겨서도 다시 맞춰진 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/osiris.png` (지금은 🏺)
- 프롬프트: 오시리스의 화신 — 찢겨서도 다시 맞춰진. 올림포스 정상(제14격 주신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「찢겨서도 다시 맞춰졌다. 너도 그렇게 해라.」
- 전리품:
  - `osiris_0` **갈고리 홀** (offhand) → `assets/items/osiris_0.png`
  - `osiris_1` **아마포 각반** (greaves) → `assets/items/osiris_1.png`
  - `osiris_2` **아마포 허리띠** (belt) → `assets/items/osiris_2.png`

### 타이탄 `titanmyth` — 일반 · 화신

- 설명: 신에게 진 자들 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/titanmyth.png` (지금은 🗿)
- 프롬프트: 타이탄 — 신에게 진 자들. 올림포스 정상(제14격 주신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「신에게 졌다. 그래도 아직 일어서 있다. 너와 함께라면 더 높이도.」
- 전리품:
  - `titanmyth_0` **거인의 각반** (greaves) → `assets/items/titanmyth_0.png`
  - `titanmyth_1` **산을 깎은 방패** (offhand) → `assets/items/titanmyth_1.png`
  - `titanmyth_2` **거인의 허리띠** (belt) → `assets/items/titanmyth_2.png`

### 이자나기의 화신 `izanagi` — 일반 · 화신

- 설명: 황천에서 돌아온 자 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/izanagi.png` (지금은 🗾)
- 프롬프트: 이자나기의 화신 — 황천에서 돌아온 자. 올림포스 정상(제14격 주신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「황천에서 돌아왔다. 돌아오는 길은 내가 제일 잘 안다.」
- 전리품:
  - `izanagi_0` **황천의 견갑** (shoulder) → `assets/items/izanagi_0.png`
  - `izanagi_1` **황천을 밟은 신** (boots) → `assets/items/izanagi_1.png`
  - `izanagi_3` **황천의 복숭아** (special·relic) → `assets/items/izanagi_3.png`

### 라의 화신 `ra` — 일반 · 화신

- 설명: 매일 세계를 다시 켜는 자 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/ra.png` (지금은 ☀️)
- 프롬프트: 라의 화신 — 매일 세계를 다시 켜는 자. 올림포스 정상(제14격 주신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「매일 세계를 다시 켠다. 네 하루도 내가 켜 주마.」
- 전리품:
  - `ra_0` **태양의 견갑** (shoulder) → `assets/items/ra_0.png`
  - `ra_1` **황금 태양원반** (armor) → `assets/items/ra_1.png`
  - `ra_2` **우라에우스의 뱀** (ring) → `assets/items/ra_2.png`

### 비슈누의 화신 `vishnu` — 일반 · 화신

- 설명: 열 번 세상에 내려온 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/vishnu.png` (지금은 🪷)
- 프롬프트: 비슈누의 화신 — 열 번 세상에 내려온. 올림포스 정상(제14격 주신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「열 번 내려왔다. 열한 번째는 네 곁으로 간다.」
- 전리품:
  - `vishnu_0` **수다르샤나 원반** (offhand) → `assets/items/vishnu_0.png`
  - `vishnu_1` **연꽃의 씨** (necklace) → `assets/items/vishnu_1.png`
  - `vishnu_2` **열 화신의 망토** (cloak) → `assets/items/vishnu_2.png`

### 인드라의 화신 `indra` — 정예 · 화신

- 설명: 천 개의 눈으로 보는 자 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/indra.png` (지금은 🐘)
- 프롬프트: 인드라의 화신 — 천 개의 눈으로 보는 자. 올림포스 정상(제14격 주신)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「천 개의 눈으로 보고 있다. 네 등 뒤는 걱정 마라.」
- 전리품:
  - `indra_0` **금강저 바즈라** (weapon) → `assets/items/indra_0.png`
  - `indra_1` **아이라바타의 비늘** (armor) → `assets/items/indra_1.png`
  - `indra_2` **천 개의 눈** (helm) → `assets/items/indra_2.png`

### 환인의 화신 `hwanin` — 일반 · 화신

- 설명: 하늘에서 내려다본 자 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/hwanin.png` (지금은 🏔️)
- 프롬프트: 환인의 화신 — 하늘에서 내려다본 자. 올림포스 정상(제14격 주신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「하늘에서 내려다보았다. 네 걸음은 곧게 가더군.」
- 전리품:
  - `hwanin_0` **천부인의 관** (helm) → `assets/items/hwanin_0.png`
  - `hwanin_1` **태백의 각반** (greaves) → `assets/items/hwanin_1.png`
  - `hwanin_2` **신단수의 가지** (necklace) → `assets/items/hwanin_2.png`

### 옥황상제의 화신 `jadeemperor` — 일반 · 화신

- 설명: 하늘 관청의 주인 / 성격: 수호 — 방어와 생명, 막기
- 몬스터 그림: `assets/monsters/jadeemperor.png` (지금은 🐲)
- 프롬프트: 옥황상제의 화신 — 하늘 관청의 주인. 올림포스 정상(제14격 주신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「하늘 관청의 도장을 찍어 주마. 이제 네 일은 공식이다.」
- 전리품:
  - `jadeemperor_0` **자미원의 곤룡포** (cloak) → `assets/items/jadeemperor_0.png`
  - `jadeemperor_1` **옥새** (ring) → `assets/items/jadeemperor_1.png`
  - `jadeemperor_2` **옥황의 장갑** (gloves) → `assets/items/jadeemperor_2.png`

### 시바의 화신 `shiva` — 일반 · 화신

- 설명: 춤 한 번에 세계를 끝내는 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/shiva.png` (지금은 🕉️)
- 프롬프트: 시바의 화신 — 춤 한 번에 세계를 끝내는. 올림포스 정상(제14격 주신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「춤 한 번으로 세계를 끝낼 수 있지. 네게는 한 박자만 빌려주마.」
- 전리품:
  - `shiva_0` **트리슐라** (weapon) → `assets/items/shiva_0.png`
  - `shiva_1` **재를 밟는 각반** (greaves) → `assets/items/shiva_1.png`
  - `shiva_4` **시바의 셋째 눈** (special·relic) → `assets/items/shiva_4.png`

### 오딘의 화신 `odin` — 정예 · 화신

- 설명: 한쪽 눈으로 모든 것을 본 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/odin.png` (지금은 🦅)
- 프롬프트: 오딘의 화신 — 한쪽 눈으로 모든 것을 본. 올림포스 정상(제14격 주신)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「한쪽 눈은 이미 내주었다. 나머지 한쪽으로 너를 지켜보마.」
- 전리품:
  - `odin_0` **빗나가지 않는 창 궁니르** (weapon) → `assets/items/odin_0.png`
  - `odin_1` **회색 나그네의 망토** (cloak) → `assets/items/odin_1.png`
  - `odin_2` **미미르의 눈** (necklace) → `assets/items/odin_2.png`

### 케찰코아틀의 화신 `quetzalcoatl` — 일반 · 화신

- 설명: 깃털 달린 뱀 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/quetzalcoatl.png` (지금은 🐍)
- 프롬프트: 케찰코아틀의 화신 — 깃털 달린 뱀. 올림포스 정상(제14격 주신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「깃털 달린 뱀이 하늘을 난다. 올라타라.」
- 전리품:
  - `quetzalcoatl_0` **깃털 방패** (offhand) → `assets/items/quetzalcoatl_0.png`
  - `quetzalcoatl_1` **창공을 딛는 신** (boots) → `assets/items/quetzalcoatl_1.png`
  - `quetzalcoatl_2` **깃털 각반** (greaves) → `assets/items/quetzalcoatl_2.png`

### 아후라 마즈다의 화신 `ahuramazda` — 일반 · 화신

- 설명: 꺼지지 않는 불 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/ahuramazda.png` (지금은 🔥)
- 프롬프트: 아후라 마즈다의 화신 — 꺼지지 않는 불. 올림포스 정상(제14격 주신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「꺼지지 않는 불이다. 어두운 길에는 이걸 들어라.」
- 전리품:
  - `ahuramazda_0` **성화의 관** (helm) → `assets/items/ahuramazda_0.png`
  - `ahuramazda_1` **빛의 겉옷** (cloak) → `assets/items/ahuramazda_1.png`
  - `ahuramazda_2` **진리의 고리** (bracelet) → `assets/items/ahuramazda_2.png`

### 제우스의 화신 `zeus` — 보스 · 화신

- 설명: 올림포스의 마지막 말 / 성격: 흉포 — 공격과 치명타에 몰빵
- 몬스터 그림: `assets/monsters/zeus.png` (지금은 ⛈️)
- 프롬프트: 제우스의 화신 — 올림포스의 마지막 말. 올림포스 정상(제14격 주신)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 화신의 한마디: 「올림포스의 마지막 말은 내가 한다. 네 이름을 불러 주마.」
- 전리품:
  - `zeus_0` **케라우노스** (weapon) → `assets/items/zeus_0.png`
  - `zeus_1` **아이기스** (offhand) → `assets/items/zeus_1.png`
  - `zeus_2` **올림포스의 인장** (necklace) → `assets/items/zeus_2.png`


---

## 제15격 외신 — 궁극의 혼돈

> 여기엔 위도 아래도 없다. 신화도 없다. 신화는 인간의 것이니까.

### 다곤의 화신 `dagon` — 일반 · 화신

- 설명: 깊은 곳의 아버지 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/dagon.png` (지금은 🐟)
- 프롬프트: 다곤의 화신 — 깊은 곳의 아버지. 궁극의 혼돈(제15격 외신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「깊은 곳에서 올라왔다. 숨이 차면 내 쪽으로 오너라.」
- 전리품:
  - `dagon_0` **심해 비늘 각반** (greaves) → `assets/items/dagon_0.png`
  - `dagon_1` **물갈퀴 신** (boots) → `assets/items/dagon_1.png`
  - `dagon_2` **물갈퀴 장갑** (gloves) → `assets/items/dagon_2.png`

### 이그의 화신 `yig` — 일반 · 화신

- 설명: 뱀들의 아버지 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/yig.png` (지금은 🐍)
- 프롬프트: 이그의 화신 — 뱀들의 아버지. 궁극의 혼돈(제15격 외신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「뱀들이 너를 알아본다. 물릴 일은 없을 거다.」
- 전리품:
  - `yig_0` **방울뱀 허리띠** (belt) → `assets/items/yig_0.png`
  - `yig_1` **저주의 고리** (ring) → `assets/items/yig_1.png`

### 이타콰의 화신 `ithaqua` — 일반 · 화신

- 설명: 바람을 타고 걷는 자 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/ithaqua.png` (지금은 ❄️)
- 프롬프트: 이타콰의 화신 — 바람을 타고 걷는 자. 궁극의 혼돈(제15격 외신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「바람을 타고 걷는다. 발자국은 남기지 마라, 쫓아오니까.」
- 전리품:
  - `ithaqua_0` **눈을 밟지 않는 신** (boots) → `assets/items/ithaqua_0.png`
  - `ithaqua_1` **얼어붙은 발자국** (necklace) → `assets/items/ithaqua_1.png`
  - `ithaqua_2` **바람의 망토** (cloak) → `assets/items/ithaqua_2.png`

### 차우그나르 파우근의 화신 `chaugnar` — 일반 · 화신

- 설명: 피를 빠는 코끼리 신 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/chaugnar.png` (지금은 🦣)
- 프롬프트: 차우그나르 파우근의 화신 — 피를 빠는 코끼리 신. 궁극의 혼돈(제15격 외신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「피에 굶주렸지만 오늘은 참아 주마. …오늘만.」
- 전리품:
  - `chaugnar_0` **상아 어깨뼈** (shoulder) → `assets/items/chaugnar_0.png`
  - `chaugnar_1` **돌가죽 갑주** (armor) → `assets/items/chaugnar_1.png`
  - `chaugnar_2` **상아 팔찌** (bracelet) → `assets/items/chaugnar_2.png`

### 슈브니구라스의 화신 `shubniggurath` — 일반 · 화신

- 설명: 천 마리 새끼를 거느린 검은 염소 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/shubniggurath.png` (지금은 🐐)
- 프롬프트: 슈브니구라스의 화신 — 천 마리 새끼를 거느린 검은 염소. 궁극의 혼돈(제15격 외신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「천 마리 새끼가 너를 따른다. 귀찮으면 말해라.」
- 전리품:
  - `shubniggurath_0` **뿔난 관** (helm) → `assets/items/shubniggurath_0.png`
  - `shubniggurath_1` **새끼의 고리** (bracelet) → `assets/items/shubniggurath_1.png`
  - `shubniggurath_2` **검은 털 각반** (greaves) → `assets/items/shubniggurath_2.png`

### 하스터의 화신 `hastur` — 정예 · 화신

- 설명: 세 번 부르면 오는 황의 왕 / 성격: 반격 — 맞은 만큼 돌려준다
- 몬스터 그림: `assets/monsters/hastur.png` (지금은 👑)
- 프롬프트: 하스터의 화신 — 세 번 부르면 오는 황의 왕. 궁극의 혼돈(제15격 외신)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「세 번 불러서 왔다. 네 번째는 부르지 마라.」
- 전리품:
  - `hastur_0` **황색 징표의 검** (weapon) → `assets/items/hastur_0.png`
  - `hastur_1` **누더기 황의** (cloak) → `assets/items/hastur_1.png`
  - `hastur_2` **카르코사의 열쇠** (necklace) → `assets/items/hastur_2.png`

### 츠아토구아의 화신 `tsathoggua` — 일반 · 화신

- 설명: 움직이기 싫어하는 두꺼비 신 / 성격: 보호 — 오래 버틴다
- 몬스터 그림: `assets/monsters/tsathoggua.png` (지금은 🦥)
- 프롬프트: 츠아토구아의 화신 — 움직이기 싫어하는 두꺼비 신. 궁극의 혼돈(제15격 외신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「움직이기 싫다. 그러니 네가 대신 움직여라. 내 몫까지.」
- 전리품:
  - `tsathoggua_0` **잠의 부적** (offhand) → `assets/items/tsathoggua_0.png`
  - `tsathoggua_1` **늪을 걷는 신** (boots) → `assets/items/tsathoggua_1.png`
  - `tsathoggua_2` **잠의 팔찌** (bracelet) → `assets/items/tsathoggua_2.png`

### 글라아키의 화신 `glaaki` — 일반 · 화신

- 설명: 가시로 꿈을 꿰는 자 / 성격: 성장 — 싸움은 약해지고 경험치를 더 얻는다
- 몬스터 그림: `assets/monsters/glaaki.png` (지금은 🪲)
- 프롬프트: 글라아키의 화신 — 가시로 꿈을 꿰는 자. 궁극의 혼돈(제15격 외신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「가시로 꿈을 꿰었다. 네 악몽쯤은 한 땀이면 된다.」
- 전리품:
  - `glaaki_0` **꿰뚫는 금속 가시** (shoulder) → `assets/items/glaaki_0.png`
  - `glaaki_1` **녹슨 관** (helm) → `assets/items/glaaki_1.png`
  - `glaaki_2` **호수 바닥의 각반** (greaves) → `assets/items/glaaki_2.png`

### 크툴루의 화신 `cthulhu` — 일반 · 화신

- 설명: 죽지 않고 잠들어 있을 뿐인 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/cthulhu.png` (지금은 🐙)
- 프롬프트: 크툴루의 화신 — 죽지 않고 잠들어 있을 뿐인. 궁극의 혼돈(제15격 외신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「죽은 게 아니라 자는 거다. 네가 깨워 주는 날까지.」
- 전리품:
  - `cthulhu_0` **르뤼에의 촉수** (weapon) → `assets/items/cthulhu_0.png`
  - `cthulhu_1` **심해의 갑각** (armor) → `assets/items/cthulhu_1.png`
  - `cthulhu_4` **잠든 신의 우상** (special·relic) → `assets/items/cthulhu_4.png`

### 요그소토스의 화신 `yogsothoth` — 정예 · 화신

- 설명: 문이자 열쇠이며 문지기인 / 성격: 행운 — 싸움은 약해지고 전리품이 늘어난다
- 몬스터 그림: `assets/monsters/yogsothoth.png` (지금은 🔮)
- 프롬프트: 요그소토스의 화신 — 문이자 열쇠이며 문지기인. 궁극의 혼돈(제15격 외신)의 정예 적. 전신 도트 일러스트, 투명 배경. 조금 더 정교하고 위압적인 외형.
- 화신의 한마디: 「문이자 열쇠다. 어느 쪽이든 필요한 쪽을 쥐어라.」
- 전리품:
  - `yogsothoth_0` **열리는 문** (offhand) → `assets/items/yogsothoth_0.png`
  - `yogsothoth_1` **모든 문의 열쇠** (ring) → `assets/items/yogsothoth_1.png`
  - `yogsothoth_2` **구체 속의 구체** (necklace) → `assets/items/yogsothoth_2.png`

### 아브호스의 화신 `abhoth` — 일반 · 화신

- 설명: 끝없이 새것을 게워내는 웅덩이 / 성격: 흡혈 — 때린 만큼 회복
- 몬스터 그림: `assets/monsters/abhoth.png` (지금은 🫧)
- 프롬프트: 아브호스의 화신 — 끝없이 새것을 게워내는 웅덩이. 궁극의 혼돈(제15격 외신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「끝없이 새것을 게워 낸다. 낡은 건 내가 먹어 주마.」
- 전리품:
  - `abhoth_0` **끓는 진흙 갑주** (armor) → `assets/items/abhoth_0.png`
  - `abhoth_1` **녹아내리는 신** (boots) → `assets/items/abhoth_1.png`
  - `abhoth_2` **갓 태어난 고리** (bracelet) → `assets/items/abhoth_2.png`

### 공허의 군주 `voidlordmyth` — 일반 · 화신

- 설명: 아무것도 아닌 것의 왕 / 성격: 관통 — 단단한 상대를 뚫는다
- 몬스터 그림: `assets/monsters/voidlordmyth.png` (지금은 🕳️)
- 프롬프트: 공허의 군주 — 아무것도 아닌 것의 왕. 궁극의 혼돈(제15격 외신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「아무것도 아닌 것의 왕이다. 그러니 잃을 것도 없지. 너처럼.」
- 전리품:
  - `voidlordmyth_0` **공허의 낫** (weapon) → `assets/items/voidlordmyth_0.png`
  - `voidlordmyth_1` **없음의 갑주** (armor) → `assets/items/voidlordmyth_1.png`
  - `voidlordmyth_2` **빈 고리** (bracelet) → `assets/items/voidlordmyth_2.png`

### 니알라토텝의 화신 `nyarlathotep` — 일반 · 화신

- 설명: 천 개의 가면을 쓴 기어오는 혼돈 / 성격: 신속 — 민첩과 이중타격
- 몬스터 그림: `assets/monsters/nyarlathotep.png` (지금은 🎭)
- 프롬프트: 니알라토텝의 화신 — 천 개의 가면을 쓴 기어오는 혼돈. 궁극의 혼돈(제15격 외신)의 일반 적. 전신 도트 일러스트, 투명 배경. 평범한 외형.
- 화신의 한마디: 「가면은 천 개다. 네게 보여 줄 얼굴은 아직 고르지 못했다.」
- 전리품:
  - `nyarlathotep_0` **천 개째의 가면** (weapon) → `assets/items/nyarlathotep_0.png`
  - `nyarlathotep_1` **검은 파라오의 의복** (cloak) → `assets/items/nyarlathotep_1.png`
  - `nyarlathotep_2` **기어오는 각반** (greaves) → `assets/items/nyarlathotep_2.png`

### 아자토스 `azathoth` — 보스

- 설명: 중심에서 잠든 눈먼 백치 신 · 화신을 갖지 못한 유일한 것 / 성격: 분쇄 — 느리지만 한 방이 무겁다
- 몬스터 그림: `assets/monsters/azathoth.png` (지금은 🌀)
- 프롬프트: 아자토스 — 중심에서 잠든 눈먼 백치 신 · 화신을 갖지 못한 유일한 것. 궁극의 혼돈(제15격 외신)의 보스 적. 전신 도트 일러스트, 투명 배경. 화려하고 압도적인 외형(가장 공들인 그림).
- 전리품:
  - `azathoth_0` **만물을 가르는 칼날** (weapon) → `assets/items/azathoth_0.png`
  - `azathoth_1` **무(無)의 갑주** (armor) → `assets/items/azathoth_1.png`
  - `azathoth_2` **백치의 왕관** (necklace) → `assets/items/azathoth_2.png`


---

## 떠돌이 상인의 소지품 (몬스터 없음)

- `ware_hardhat` **이름이 번진 안전모** (helm, 제4격 성능) → `assets/items/ware_hardhat.png` — 안쪽에 매직으로 쓴 이름이 땀에 번져 읽히지 않는다.
- `ware_flashlight` **아직 켜지는 손전등** (offhand, 제4격 성능) → `assets/items/ware_flashlight.png` — 건전지는 새것이다. 누가 갈아 끼웠는지는 모른다.
- `ware_jacket` **구겨진 협회 점퍼** (armor, 제4격 성능) → `assets/items/ware_jacket.png` — 왼쪽 가슴에 붙은 번호표가 반쯤 뜯겼다.
- `ware_boots` **끈이 해진 등산화** (boots, 제4격 성능) → `assets/items/ware_boots.png` — 밑창에 아직 진흙이 마르지 않았다.
- `ware_glove` **한 짝뿐인 작업 장갑** (gloves, 제4격 성능) → `assets/items/ware_glove.png` — 나머지 한 짝을 찾는 사람은 없었다.
- `ware_tag` **번호만 남은 인식표** (necklace, 제5격 성능) → `assets/items/ware_tag.png` — 체인에 묻은 얼룩은 닦이지 않는다.
- `ware_watch` **멈춘 손목시계** (bracelet, 제5격 성능) → `assets/items/ware_watch.png` — 바늘은 새벽 네 시 십 분에서 움직이지 않는다.
- `ware_sign` **방패 대신 든 표지판** (offhand, 제5격 성능) → `assets/items/ware_sign.png` — 「공사중 · 우회하세요」
- `ware_belt` **탄창이 빈 전술 벨트** (belt, 제5격 성능) → `assets/items/ware_belt.png` — 고리마다 누군가의 손때가 있다.
- `ware_raincoat` **찢긴 방수 망토** (cloak, 제5격 성능) → `assets/items/ware_raincoat.png` — 후드를 쓰면 빗소리 같은 것이 들린다.
- `ware_bat` **손잡이만 감긴 쇠파이프** (weapon, 제6격 성능) → `assets/items/ware_bat.png` — 테이프는 새것이고, 쇠는 닳아 있다.
- `ware_ring` **안쪽에 날짜가 새겨진 반지** (ring, 제6격 성능) → `assets/items/ware_ring.png` — 날짜는 오늘보다 한참 전이다.
- `ware_greaves` **무릎보호대** (greaves, 제6격 성능) → `assets/items/ware_greaves.png` — 한쪽만 심하게 닳았다.
- `ware_scarf` **색 바랜 목도리** (shoulder, 제6격 성능) → `assets/items/ware_scarf.png` — 누가 떠 준 것인지 모르는 채 두르게 된다.

---

## 무명의 화신

- `nameless` → `assets/monsters/nameless.png` — 무명 — 이름이 없는 것. 얼굴과 이름이 없는 인물의 실루엣. 전신 도트 일러스트, 투명 배경. (정체를 암시하지 말 것)
