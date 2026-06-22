# Prompt for Codex

Ты работаешь с проектом playable ad / browser game.

Нужно собрать прототип футбольной penalty/casino-style игры по видео, описанию механик и ассетам.

## Стек

Использовать:

- Vite
- TypeScript
- PixiJS

Если проекта ещё нет — создать минимальный Vite + TypeScript проект и подключить PixiJS.

## Главная цель

Собрать playable-прототип, который повторяет механику из записи экрана:

- игрок выбирает страну;
- затем попадает на экран пенальти;
- выбирает сложность;
- выбирает ставку;
- выбирает точку удара в воротах;
- мяч летит в выбранную точку;
- вратарь прыгает в одну из зон;
- если вратарь не отбил — игрок проходит дальше по лестнице множителей;
- после успешного удара доступна кнопка Claim;
- если вратарь отбил — игрок проигрывает раунд;
- можно начать новый раунд.

Это не production casino game. Серверная логика, реальные выплаты, реальный RTP и настоящие деньги не нужны. Нужна локальная визуальная симуляция для playable ad.

## Входные материалы

Смотри папки:

```text
docs/
processed_assets/
source/
video_notes/
```

Особенно важные файлы:

```text
docs/game-mechanics-from-video.md
docs/asset-map-worldCupNations.md
processed_assets/worldCupNations_split/
```

## Ассеты стран

Файл `worldCupNations` — это spritesheet флагов стран.

Параметры:

```text
общий размер: 420×250
сетка: 10×5
ячейка: 42×50
```

Уже есть нарезанные PNG:

```text
processed_assets/worldCupNations_split/nation_00_r0_c0.png
...
processed_assets/worldCupNations_split/nation_49_r4_c9.png
```

Используй нарезанные PNG для экрана выбора страны и HUD.

## Экраны

### 1. Country Select

Экран выбора страны.

Нужно:

- фон в стиле футбольной/стадионной игры;
- заголовок выбора страны;
- сетка флагов;
- при клике на флаг сохранить выбранную страну;
- перейти на основной экран игры.

Минимально достаточно показать 20–50 стран из папки `worldCupNations_split`.

### 2. Penalty Game

Основной экран.

Состав:

- стадион/поле/фон;
- ворота в верхней части;
- вратарь перед воротами;
- мяч внизу перед ударом;
- target-зоны в воротах;
- верхняя шкала множителей;
- выбранный флаг игрока;
- флаг соперника;
- Difficulty selector: Easy / Medium / Hard;
- Bet selector;
- Claim button;
- Last Win;
- Balance;
- кнопки Buy Bonus и How to play можно сделать декоративными.

## Механика

### Состояния игры

Реализовать state machine:

```ts
type GameState =
  | "country_select"
  | "idle_before_kick"
  | "show_targets"
  | "target_selected"
  | "ball_flying"
  | "goalkeeper_diving"
  | "success"
  | "fail"
  | "claim_available"
  | "claimed"
  | "next_round";
```

### Сложности

Реализовать три режима:

```ts
type Difficulty = "easy" | "medium" | "hard";
```

Пример множителей:

```ts
const MULTIPLIERS = {
  easy: [0, 1.31, 1.79, 2.43, 3.32, 4.53],
  medium: [0, 1.8, 3.2, 5.6, 9.8, 17.1],
  hard: [0, 2.88, 8.64, 25.92, 77.76, 233.28],
};
```

Можно скорректировать визуально, если нужно.

### Вероятность сейва

Для playable использовать простую локальную симуляцию:

```ts
const SAVE_CHANCE = {
  easy: 0.18,
  medium: 0.32,
  hard: 0.48,
};
```

Но визуально можно сделать так:

1. Игрок выбирает target.
2. Код выбирает, будет ли save.
3. Если save:
   - goalkeeperTarget = playerTarget;
4. Если goal:
   - goalkeeperTarget = random target, but not playerTarget.

Так результат будет визуально понятным.

### Target-зоны

Сделать 5–6 зон в воротах:

```text
top-left
top-center
top-right
bottom-left
bottom-center
bottom-right
```

Каждая зона — кликабельный круг/маркер.

### Удар

После клика по target:

1. отключить клики;
2. скрыть или приглушить остальные target-зоны;
3. анимировать мяч от стартовой позиции к target;
4. параллельно/чуть позже анимировать прыжок вратаря;
5. определить success/fail;
6. показать результат;
7. если success — обновить текущий множитель и активировать Claim;
8. если fail — показать проигрыш и reset/new round.

## Анимации

Минимальные анимации:

- ball: движение по кривой или линейно к target;
- goalkeeper: смещение/прыжок в сторону выбранной зоны;
- target click: scale/flash;
- success: короткая вспышка / текст Goal;
- fail: текст Saved;
- multiplier: подсветить текущую ступень;
- Claim button: активное состояние после гола.

Не нужно делать сложную физику. Достаточно визуального ощущения.

## UI-логика

### Bet

Сделать несколько ставок:

```ts
const BETS = [1, 5, 10, 25, 50, 100];
```

При старте balance можно задать локально:

```ts
let balance = 1000;
```

При начале раунда можно списывать bet.

### Claim

Claim доступен только после успешного удара.

Формула:

```ts
claimAmount = bet * currentMultiplier;
```

После Claim:

- добавить claimAmount к balance;
- записать Last Win;
- завершить раунд;
- вернуть игру в idle/new round.

## Архитектура файлов

Предпочтительная структура:

```text
src/
  main.ts
  app.ts
  assets/
  scenes/
    CountrySelectScene.ts
    PenaltyGameScene.ts
  components/
    Ball.ts
    Goalkeeper.ts
    Goal.ts
    TargetGrid.ts
    MultiplierTrack.ts
    BottomPanel.ts
    Button.ts
    FlagGrid.ts
  game/
    types.ts
    config.ts
    state.ts
    random.ts
  ui/
    createText.ts
    layout.ts
```

Не обязательно строго так, но код должен быть разделён по смыслу. Не надо складывать всю игру в один огромный файл.

## Важные ограничения

- Не делать настоящую азартную игру.
- Не добавлять реальные платежи.
- Не добавлять сервер.
- Не добавлять авторизацию.
- Не делать крипту, деньги, вывод средств.
- Всё должно работать локально в браузере.
- Цель — playable prototype.

## Что считать готовым результатом

Готово, если:

1. `npm install` работает.
2. `npm run dev` запускает игру.
3. Открывается Country Select.
4. Можно выбрать страну.
5. Открывается экран пенальти.
6. Можно выбрать Difficulty.
7. Можно выбрать Bet.
8. Можно кликнуть target в воротах.
9. Мяч летит к target.
10. Вратарь прыгает.
11. Бывает Goal / Saved.
12. При Goal активируется Claim.
13. Множитель двигается вперёд.
14. Balance / Last Win обновляются.
15. Можно начать новый раунд.

## Если каких-то ассетов не хватает

Не останавливайся.

Используй простые placeholder-формы PixiJS:

- прямоугольник для ворот;
- круг для мяча;
- простая фигура/прямоугольник для вратаря;
- круги для target-зон;
- текстовые кнопки.

Но флаги стран взять из `processed_assets/worldCupNations_split/`.

## Приоритет

Сначала механика и играбельность.

Потом внешний вид.

Не трать много времени на пиксель-перфект, пока core loop не работает.


## Buy Bonus / Bonus Mode

Добавь отдельный bonus mode по файлу:

```text
docs/bonus-mechanic-from-second-video.md
```

Механика:

1. На основном экране есть кнопка `BUY BONUS`.
2. Клик открывает overlay с тремя карточками:
   - Easy
   - Medium
   - Hard
3. Внизу overlay есть выбор ставки.
4. Цена бонуса считается так:

```ts
const BONUS_PRICE_MULTIPLIER = {
  easy: 30,
  medium: 60,
  hard: 100,
};
```

5. Пример при bet `$200`:
   - Easy = `$6000`
   - Medium = `$12000`
   - Hard = `$20000`

6. После покупки запускается roulette.
7. Roulette выбирает количество ударов от 12 до 15.
8. После roulette начинается bonus shot loop.
9. В нижней панели вместо `BET` показывается:

```text
15 SHOTS
$200
```

10. Каждый удар уменьшает `shotsLeft`.
11. В bonus mode save не завершает раунд и не обнуляет выигрыш.
12. Goal продвигает multiplier и увеличивает `accumulatedWin`.
13. Когда `shotsLeft === 0`, показать экран:

```text
BONUS WIN
```

14. После Bonus Win обновить balance и вернуться в обычный режим.

Добавь состояния:

```ts
type GameState =
  | "buy_bonus_overlay"
  | "bonus_difficulty_select"
  | "bonus_roulette"
  | "bonus_intro"
  | "bonus_shot_idle"
  | "bonus_ball_flying"
  | "bonus_goalkeeper_diving"
  | "bonus_shot_result"
  | "bonus_result";
```

Добавь конфиг:

```ts
const BONUS_CONFIG = {
  easy: {
    priceMultiplier: 30,
    maxWinMultiplier: 100.64,
    shotRange: [12, 15],
  },
  medium: {
    priceMultiplier: 60,
    maxWinMultiplier: 1812.54,
    shotRange: [12, 15],
  },
  hard: {
    priceMultiplier: 100,
    maxWinMultiplier: 6298.56,
    shotRange: [12, 15],
  },
};
```

Для playable roulette можно сделать простой визуальной анимацией вращения, без настоящей физики.

Если не хватает ассетов для карточек/портретов/рулетки/кубка — использовать placeholder-графику PixiJS, но сохранить структуру flow.


## Mobile-First Layout

Игра делается для мобилки. Основной источник по layout:

```text
docs/mobile-layout-from-third-video.md
```

Основной viewport:

```ts
const DESIGN_WIDTH = 390;
const DESIGN_HEIGHT = 844;
```

Или использовать реальные размеры `app.screen.width / app.screen.height`, но layout должен быть mobile-first.

Не делать desktop-композицию основной.

Требования:

1. Canvas занимает весь экран.
2. `html`, `body`, `#app` без скролла.
3. Header закреплён сверху:
   - logo слева;
   - balance pill справа/по центру;
   - menu icon справа.
4. Multiplier track расположен сверху поверх неба, почти во всю ширину.
5. Ворота и вратарь — в центральной части экрана.
6. Мяч — большой, по центру, над нижней панелью.
7. Нижняя панель закреплена внизу:
   - Difficulty слева сверху;
   - Bet/Shots справа сверху;
   - Last Win слева снизу;
   - Claim справа снизу.
8. Флаги команд и кнопка Buy Bonus расположены над нижней панелью.
9. Country Select — mobile modal:
   - затемнённый background;
   - тёмная карточка;
   - 5 колонок флагов;
   - scrollable grid;
   - Confirm button;
   - Don't show again checkbox.
10. Buy Bonus — mobile fullscreen overlay:
   - close X справа сверху;
   - три bonus options вертикально;
   - fixed bet selector внизу;
   - текст `A MISS DOES NOT WASTE THE WINNINGS`.
11. Bonus mode должен показывать `N SHOTS` вместо обычного `BET`.

Добавь resize handling:

```ts
window.addEventListener("resize", () => {
  app.renderer.resize(window.innerWidth, window.innerHeight);
  currentScene.resize(app.screen.width, app.screen.height);
});
```

Все позиции считать через layout helper, а не захардкоженные desktop coordinates.


## Spine Ball Asset — Mandatory Runtime Usage

В проект добавлен Spine-ассет мяча:

```text
source/spine/ball/ball.png
source/spine/ball/ball.atlas
source/spine/ball/ball.json
docs/asset-map-ball-spine.md
```

Жёсткое правило:

```text
НЕ РЕЗАТЬ ball.png НА ОТДЕЛЬНЫЕ КАРТИНКИ.
НЕ СОБИРАТЬ ЭТУ АНИМАЦИЮ ВРУЧНУЮ ИЗ PNG.
ИСПОЛЬЗОВАТЬ SPINE RUNTIME.
```

Причина: `ball.json` содержит skeleton, bones, slots, attachments, meshes, deformations и готовые animations. Ручная нарезка разрушит оригинальные анимации.

Использовать официальный Spine runtime для PixiJS.

Для PixiJS v8 предпочтительно:

```text
@esotericsoftware/spine-pixi-v8
```

Codex должен:
1. установить совместимые версии `pixi.js` и Spine runtime;
2. загрузить `ball.json`, `ball.atlas`, `ball.png`;
3. проигрывать animation names из `ball.json`;
4. использовать этот Spine object для idle ball / shot / target / result effects;
5. если runtime временно не заводится — оставить placeholder только как временную заглушку, но не нарезать atlas.

Изучи:

```text
docs/asset-map-ball-spine.md
```

Минимальная цель:
- загрузить Spine ball asset на сцену;
- проиграть `ball_start` или другой idle animation, если он есть;
- при клике по target проигрывать соответствующую shot animation;
- после анимации возвращать мяч в idle/new shot state.


## Spine Background Asset — Mandatory Runtime Usage

В проект добавлен Spine-ассет фона/стадиона:

```text
source/spine/background/background.png
source/spine/background/background.atlas
source/spine/background/background.json
docs/asset-map-background-spine.md
```

Жёсткое правило:

```text
НЕ РЕЗАТЬ background.png.
ИСПОЛЬЗОВАТЬ SPINE RUNTIME.
```

Этот asset отвечает за:
- sky;
- clouds;
- stadium;
- grass;
- lights;
- smoke/fog;
- banners/flags;
- bonus/fire visual states.

Анимации:

```text
background
background_bonus
background_fire
```

Используй его как нижний слой сцены:

```text
Background Spine
Goal / Goalkeeper
Ball Spine
Target zones
HUD
Overlays
```

На mobile не сжимать весь широкий skeleton в экран. Использовать cover/crop behavior: масштабировать фон так, чтобы он покрывал вертикальный viewport, а лишнее по ширине обрезалось.


## Spine Gates Asset — Mandatory Runtime Usage

В проект добавлен Spine-ассет ворот:

```text
source/spine/gates/gates.png
source/spine/gates/gates.atlas
source/spine/gates/gates.json
docs/asset-map-gates-spine.md
```

Жёсткое правило:

```text
НЕ РЕЗАТЬ gates.png.
ИСПОЛЬЗОВАТЬ SPINE RUNTIME.
```

Это goal/net asset:
- front goal frame;
- side nets;
- back net/grid;
- top net;
- perspective mesh.

Использовать как слой ворот:

```text
Background Spine
Gates Spine
Goalkeeper
Target zones
Ball Spine
HUD
```

Если визуально нужно, target zones рендерить поверх сетки, а ball Spine поверх target zones.

На mobile:
- ворота в центральной части экрана;
- ширина примерно 88–96% viewport;
- scale uniform;
- target zones позиционировать относительно bounds ворот.


## Spine Goalkeeper Asset — Mandatory Runtime Usage

В проект добавлен Spine-персонаж вратаря:

```text
source/spine/goalkeeper/goalkeeper.png
source/spine/goalkeeper/goalkeeper.atlas
source/spine/goalkeeper/goalkeeper.json
docs/asset-map-goalkeeper-spine.md
```

Жёсткое правило:

```text
НЕ РЕЗАТЬ goalkeeper.png.
ИСПОЛЬЗОВАТЬ SPINE RUNTIME.
```

Это полноценный character rig:
- body / arms / legs / head / face / fingers;
- IK constraints;
- transform constraints;
- skins;
- animations.

Skins связаны со сложностью:

```ts
const GOALKEEPER_SKIN_BY_DIFFICULTY = {
  easy: "easy",
  medium: "medium",
  hard: "hard",
};
```

При смене difficulty:

```ts
goalkeeper.skeleton.setSkinByName(GOALKEEPER_SKIN_BY_DIFFICULTY[difficulty]);
goalkeeper.skeleton.setSlotsToSetupPose();
```

Использовать как слой:

```text
Background Spine
Gates Spine
Goalkeeper Spine
Target zones
Ball Spine
HUD
```

Codex должен:
1. загрузить goalkeeper Spine asset;
2. поставить его в центр ворот;
3. менять skin по Difficulty;
4. проигрывать idle animation;
5. при ударе проигрывать save/dive animation;
6. после результата возвращать idle/new shot state.

Точные animation names читать из `goalkeeper.json`. Не выдумывать имена, если они отличаются.


## Big Win / Bonus Win Result Assets

В проект добавлен пакет win/result screen:

```text
docs/asset-map-bigwin-result.md
source/win/bgBigWin.b5ddd5f5.jpg

source/spine/bigwin_text/bigwin_text.png
source/spine/bigwin_text/bigwin_text.atlas
source/spine/bigwin_text/bigwin_text.json

source/spine/bigwin/bigwin.png
source/spine/bigwin/bigwin.atlas
source/spine/bigwin/bigwin.json
```

Назначение:

```text
bonus_result / big win overlay
```

`bgBigWin.b5ddd5f5.jpg` — static dark stadium background.

`bigwin_text` — Spine title text with animations:

```text
bigwin_start
bigwin_idle
bigwin_end
```

`bigwin` — Spine golden ball / pedestal / result decoration with animations:

```text
bigwin_start
bigwin_idle
bigwin_end
big-epic_win_transition
```

Жёсткое правило:

```text
НЕ РЕЗАТЬ bigwin_text.png.
НЕ РЕЗАТЬ bigwin.png.
ИСПОЛЬЗОВАТЬ SPINE RUNTIME.
```

Добавить компонент:

```text
BigWinOverlay
```

Flow:

1. Fade in `bgBigWin`.
2. Play `bigwin_text.bigwin_start`.
3. Play `bigwin.bigwin_start`.
4. Show win amount text, e.g. `$7.93k`.
5. Loop `bigwin_idle`.
6. On tap or timeout play `bigwin_end`.
7. Close overlay and return to gameplay.

Использовать после окончания bonus mode:

```ts
if (bonusMode.shotsLeft === 0) {
  showBigWinOverlay(bonusMode.accumulatedWin);
}
```


## Mega Win Result Assets

В проект добавлен второй уровень win/result screen: `MEGA WIN`.

Файлы:

```text
docs/asset-map-megawin-result.md
source/win/bgMegaWin.9fd1952f.jpg

source/spine/megawin_text/megawin_text.png
source/spine/megawin_text/megawin_text.atlas
source/spine/megawin_text/megawin_text.json

source/spine/megawin/megawin.png
source/spine/megawin/megawin.atlas
source/spine/megawin/megawin.json
```

`megawin_text` animations:

```text
megawin_start
megawin_idle
megawin_end
```

`megawin` animations:

```text
megawin_start
megawin_idle
megawin_end
mega-epic_win_transition
```

Жёсткое правило:

```text
НЕ РЕЗАТЬ megawin_text.png.
НЕ РЕЗАТЬ megawin.png.
ИСПОЛЬЗОВАТЬ SPINE RUNTIME.
```

Расширить result overlay:

```ts
type WinTier = "big" | "mega";
```

Лучше сделать generic component:

```text
WinOverlay
```

С конфигом:

```ts
const WIN_TIER_CONFIG = {
  big: {
    background: "bgBigWin.b5ddd5f5.jpg",
    textSpine: "bigwin_text",
    stageSpine: "bigwin",
    start: "bigwin_start",
    idle: "bigwin_idle",
    end: "bigwin_end",
  },
  mega: {
    background: "bgMegaWin.9fd1952f.jpg",
    textSpine: "megawin_text",
    stageSpine: "megawin",
    start: "megawin_start",
    idle: "megawin_idle",
    end: "megawin_end",
  },
};
```

Пример выбора tier для playable:

```ts
function getWinTier(winAmount: number, bet: number): WinTier {
  const multiplier = winAmount / bet;
  if (multiplier >= 50) return "mega";
  return "big";
}
```

После bonus_result или большого Claim показывать Big Win или Mega Win в зависимости от tier.


## Epic Win Result Assets

В проект добавлен третий уровень win/result screen: `EPIC WIN`.

Файлы:

```text
docs/asset-map-epicwin-result.md
source/win/bgEpicWin.9d8cce80.jpg

source/spine/epicwin_text/epicwin_text.png
source/spine/epicwin_text/epicwin_text.atlas
source/spine/epicwin_text/epicwin_text.json

source/spine/epicwin/epicwin.png
source/spine/epicwin/epicwin.atlas
source/spine/epicwin/epicwin.json
```

`epicwin_text` animations:

```text
epicwin_start
epicwin_idle
epicwin_end
epicwin_transition
```

`epicwin` animations include:

```text
epicwin_start
epicwin_idle
epicwin_end
big-epic_win_transition
epic-mega_win_transition
```

Жёсткое правило:

```text
НЕ РЕЗАТЬ epicwin_text.png.
НЕ РЕЗАТЬ epicwin.png.
ИСПОЛЬЗОВАТЬ SPINE RUNTIME.
```

Расширить result overlay:

```ts
type WinTier = "big" | "mega" | "epic";
```

Использовать generic component:

```text
WinOverlay
```

Пример выбора tier для playable:

```ts
function getWinTier(winAmount: number, bet: number): WinTier {
  const multiplier = winAmount / bet;

  if (multiplier >= 150) return "epic";
  if (multiplier >= 50) return "mega";
  return "big";
}
```

После bonus_result или большого Claim показывать Big / Mega / Epic Win в зависимости от tier.

Перед проигрыванием transition animation проверять, что animation существует в skeleton.


## Legendary Win Result Assets

В проект добавлен четвёртый уровень win/result screen: `LEGENDARY WIN`.

Файлы:

```text
docs/asset-map-legendarywin-result.md
source/win/bgLegendaryWin.6c24bab1.jpg

source/spine/legendarywin_text/legendarywin_text.png
source/spine/legendarywin_text/legendarywin_text.atlas
source/spine/legendarywin_text/legendarywin_text.json

source/spine/legendarywin/legendarywin.png
source/spine/legendarywin/legendarywin.atlas
source/spine/legendarywin/legendarywin.json
```

Жёсткое правило:

```text
НЕ РЕЗАТЬ legendarywin_text.png.
НЕ РЕЗАТЬ legendarywin.png.
ИСПОЛЬЗОВАТЬ SPINE RUNTIME.
```

Расширить result overlay:

```ts
type WinTier = "big" | "mega" | "epic" | "legendary";
```

Использовать generic component:

```text
WinOverlay
```

Пример выбора tier для playable:

```ts
function getWinTier(winAmount: number, bet: number): WinTier {
  const multiplier = winAmount / bet;

  if (multiplier >= 300) return "legendary";
  if (multiplier >= 150) return "epic";
  if (multiplier >= 50) return "mega";
  return "big";
}
```

Добавить tier config для `legendary`:

```ts
legendary: {
  background: "bgLegendaryWin.6c24bab1.jpg",
  textSpine: "legendarywin_text",
  stageSpine: "legendarywin",
  start: "legendary_start",
  idle: "legendary_idle",
  end: "legendary_end",
}
```

Важно: перед проигрыванием animation проверить, что она реально есть в skeleton. Если имя отличается, взять точное имя из `legendarywin_text.json` / `legendarywin.json`.

После bonus_result или большого Claim показывать Big / Mega / Epic / Legendary Win в зависимости от tier.


## Roulette UI Assets

В проект добавлены обычные UI-ассеты для bonus roulette:

```text
docs/asset-map-roulette-ui.md
source/ui/roulette/rouletteWheel.c208d970.png
source/ui/roulette/rouletteWheelArrow.946f3d05.png
source/ui/roulette/rouletteWheelSectorPart.6067044f.png
source/ui/roulette/sliderball.png
source/ui/roulette/sprite.4de80bac.svg
```

Это НЕ Spine.

Использовать как обычные PixiJS textures/sprites.

Назначение:

```text
rouletteWheel.c208d970.png          — rotating wheel
rouletteWheelArrow.946f3d05.png     — fixed pointer/arrow
rouletteWheelSectorPart.6067044f.png — optional sector highlight/mask
sliderball.png                      — likely multiplier-track current marker
sprite.4de80bac.svg                 — generic SVG icon/sprite file
```

Реализация roulette:

1. Открыть `RouletteOverlay`.
2. Поставить `rouletteWheel` в центр.
3. Поставить `rouletteWheelArrow` сверху как фиксированный pointer.
4. Добавить PixiJS text labels: 12 / 13 / 14 / 15.
5. Вращать wheel, не arrow.
6. После ease-out выбрать 12–15 shots.
7. Закрыть overlay и запустить bonus mode.

`rouletteWheelSectorPart` использовать опционально для подсветки выбранного сектора.

`sliderball.png` использовать как marker текущего множителя на верхней multiplier track, если подходит визуально.


## Confetti Spine Effect

В проект добавлен Spine-эффект конфетти:

```text
docs/asset-map-confetti-spine.md
source/spine/confetti/confetti.png
source/spine/confetti/confetti.atlas
source/spine/confetti/confetti.json
```

Жёсткое правило:

```text
НЕ РЕЗАТЬ confetti.png.
ИСПОЛЬЗОВАТЬ SPINE RUNTIME.
```

Назначение:

```text
shared confetti overlay for win/result screens
```

Использовать в generic `WinOverlay` для:

```text
Big Win
Mega Win
Epic Win
Legendary Win
Bonus Win
```

Слой:

```text
Win background
Win stage Spine
Win text Spine
Win amount text
Confetti Spine overlay
Continue/tap hint
```

Codex должен:
1. загрузить `confetti` через тот же Spine runtime;
2. проверить animation names из `confetti.json`;
3. проигрывать start/idle/end или доступную комбинацию;
4. удалять/останавливать confetti при закрытии WinOverlay;
5. не пересобирать confetti вручную через particle system, пока Spine runtime работает.


## Mobile UI Assets

В проект добавлены обычные PNG UI-ассеты:

```text
docs/asset-map-mobile-ui.md
source/ui/mobile/cursor.6000941b.png
source/ui/mobile/logoMobile.8dd41027.png
```

Это НЕ Spine.

Использовать как обычные PixiJS textures/sprites.

Назначение:

```text
cursor.6000941b.png     — target/cursor marker for shot target zones
logoMobile.8dd41027.png — mobile header logo
```

`cursor` использовать вместо простых нарисованных кругов для target zones внутри ворот.

Target zones должны иметь logical IDs, связанные с Spine animations:

```ts
targetZone = 1..15
ballAnimation = `ball_${targetZone}`
goalkeeperAnimation = `jump_${goalkeeperZone}`
```

`logoMobile` использовать в mobile header слева.

Не растягивать logo non-uniformly. Scale uniformly to fit header height.


## Bonus Buy Card Assets

В проект добавлены обычные PNG-карточки для Buy Bonus overlay:

```text
docs/asset-map-bonus-buy-cards.md
source/ui/bonus_buy_cards/
```

Файлы:

```text
bonusbuyBronzeDesktop.65bbd194.png
bonusbuyBronzeMobile.b369f44a.png
bonusbuySilverDesktop.6df21a04.png
bonusbuySilverMobile.3ace4b37.png
bonusbuyGoldDesktop.4dfeefd1.png
bonusbuyGoldMobile.fc35bf64.png
```

Это НЕ Spine. Использовать как обычные PixiJS sprites.

Mapping:

```ts
const BONUS_CARD_BY_DIFFICULTY = {
  easy: {
    tier: "bronze",
    desktop: "bonusbuyBronzeDesktop.65bbd194.png",
    mobile: "bonusbuyBronzeMobile.b369f44a.png",
  },
  medium: {
    tier: "silver",
    desktop: "bonusbuySilverDesktop.6df21a04.png",
    mobile: "bonusbuySilverMobile.3ace4b37.png",
  },
  hard: {
    tier: "gold",
    desktop: "bonusbuyGoldDesktop.4dfeefd1.png",
    mobile: "bonusbuyGoldMobile.fc35bf64.png",
  },
};
```

Mobile-first:
- использовать `Mobile` версии как основные;
- расположить карточки вертикально в Buy Bonus fullscreen overlay;
- поверх карточек нарисовать dynamic text:
  - EASY / MEDIUM / HARD;
  - MAX WIN;
  - price;
  - buy button / price area.

Карточки кликабельные. При tap:
1. выбрать difficulty;
2. price = bet × priceMultiplier;
3. если balance хватает — купить bonus и открыть roulette;
4. если не хватает — показать toast/error.


## HTML/CSS Overlay UI — Mandatory

Important architecture rule:

```text
Game/Spine/animations = PixiJS canvas.
Menu and UI without dedicated assets = normal HTML/CSS overlay above canvas.
```

Read:

```text
docs/html-overlay-ui-rule.md
```

Do not draw all menus/buttons/text-only UI with PixiJS Graphics/Text.

Use HTML/CSS for:
- header UI;
- balance pill;
- hamburger menu;
- bottom panel;
- Difficulty selector;
- Bet selector;
- Claim button;
- Last Win;
- Buy Bonus modal structure and labels;
- How to play;
- toast/errors;
- settings/menu screens;
- any interface element that has no atlas/image.

Use PixiJS for:
- background Spine;
- gates Spine;
- goalkeeper Spine;
- ball Spine;
- cursor target markers if tied to goal coordinates;
- roulette wheel if rotation is easier in canvas;
- win Spine animations;
- confetti Spine.

Required DOM structure can be:

```html
<div id="app">
  <canvas id="game-canvas"></canvas>
  <div id="ui-overlay">
    <header id="mobile-header"></header>
    <div id="hud"></div>
    <div id="bottom-panel"></div>
    <div id="modal-root"></div>
    <div id="toast-root"></div>
  </div>
</div>
```

CSS rule:

```css
#ui-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
}

#ui-overlay button,
#ui-overlay [data-clickable="true"],
.modal-backdrop {
  pointer-events: auto;
}
```

Keep state shared through a small event/state bridge:

```ts
ui.on("difficultyChanged", game.setDifficulty);
ui.on("betChanged", game.setBet);
ui.on("claimClicked", game.claim);
ui.on("buyBonusClicked", game.openBuyBonus);

game.events.on("balanceChanged", ui.setBalance);
game.events.on("stateChanged", ui.renderForState);
```

The final implementation should clearly separate:

```text
Pixi game layer
HTML UI layer
Shared game state/events
```
