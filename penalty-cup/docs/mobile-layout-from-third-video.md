# Mobile Layout From Third Video

## Назначение записи

Третья запись показывает, как игра должна выглядеть на мобилке.

Это важнее desktop-композиции. Playable нужно собирать как vertical mobile-first game.

## Параметры записи

```text
video size: 792 × 1706 px
aspect ratio: ~0.464
условный CSS viewport при 2x: ~396 × 853 px
```

Для разработки можно использовать базовый дизайн:

```ts
const DESIGN_WIDTH = 390;
const DESIGN_HEIGHT = 844;
```

И масштабировать stage под реальный viewport.

## Общий принцип

Игра занимает весь вертикальный экран.

Нельзя делать desktop canvas с полями по бокам. Нужен mobile-first layout:

```text
top header
sky + multiplier track
stadium / goal / goalkeeper
grass field
bottom control panel
```

Canvas должен быть full viewport:

```css
html, body, #app {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
```

## Header

Верхняя панель фиксирована сверху.

Состав:

```text
left: logo Penalty Nations Cup
center/right: balance pill
right: hamburger menu
```

Пример:

```text
[LOGO]        [ 1 000 000  $ ]     [☰]
```

Особенности:

- тёмная полоса на всю ширину;
- баланс в большой тёмной скруглённой плашке;
- меню — три белые линии;
- header не должен перекрывать игровые клики.

## Multiplier Track

Шкала множителей находится в верхней части игрового поля, поверх неба.

Состав:

```text
left arrow
ball marker/current progress
horizontal line
white multiplier nodes
right arrow
labels: x0 / x1.31 / x1.79 / ...
```

На мобилке шкала почти во всю ширину экрана, с отступами примерно 12–16 px.

В bonus mode шкала может прокручиваться дальше:

```text
x21.34 → x29.1 → x39.69 → x54.12 → x73.8 → x100.64
```

Нужно поддержать сдвиг/окно из 5–6 видимых значений.

## Field / Goal Area

Ворота занимают центральную часть экрана.

Композиция:

```text
sky
stadium stands
goal frame
goal net
goalkeeper centered
grass foreground
```

На мобилке:

- ворота широкие, почти во всю ширину;
- вратарь стоит в центре ворот;
- мяч в idle находится внизу, перед панелью управления;
- поле не должно уходить под нижнюю панель так, чтобы мяч был закрыт.

## Target Zones

При ожидании удара в воротах появляются прозрачные target-зоны.

Визуально:

```text
semi-transparent circles
ball icon inside
white/gray outline
placed inside goal
```

Примерная сетка:

```text
top-left / top-center / top-right
middle-left / middle-center / middle-right
bottom-left / bottom-center / bottom-right
```

Не обязательно строго 9 зон. Главное — дать игроку понятные точки удара по воротам.

## Ball / Main Action Control

Большой мяч расположен внизу по центру и частично перекрывает нижнюю панель.

Вокруг мяча зелёное circular-highlight кольцо с небольшими стрелками.

Это центральный action object и визуальная точка внимания.

Принцип:

```text
flags + buy bonus
       ball
bottom panel cards
```

Мяч не является обычной кнопкой, но визуально показывает готовность удара.

## Bottom Control Panel

Нижняя панель закреплена у низа экрана.

Состав:

```text
top-left above panel: selected country flag VS opponent flag
top-right above panel: BUY BONUS button

center: big ball overlaps top edge of the panel

panel grid:
left top: Difficulty
right top: Bet или Shots
left bottom: Last Win
right bottom: Claim
```

Схема:

```text
[Spain flag] VS [Opponent flag]        [BUY BONUS]

                 [BALL]

[DIFFICULTY]                        [BET / SHOTS]
[EASY]                              [$200 / 15 SHOTS]

[LAST WIN]                          [CLAIM]
[$10.82k]
```

В обычном режиме справа сверху:

```text
BET
$200
```

В bonus mode справа сверху:

```text
15 SHOTS
$200
```

Когда bonus идёт, difficulty выглядит заблокированной/неактивной.

## Claim Button

Claim — большая зелёная кнопка справа снизу.

Состояния:

```text
inactive: тёмная/приглушённая
active: ярко-зелёная, показывает сумму claim
```

В bonus mode кнопка визуально остаётся, но как обычный cashout не используется.

## Country Select Mobile Modal

При первом запуске открывается overlay выбора страны.

Визуал:

- затемнённый/размытый gameplay background;
- большая тёмная карточка по центру;
- название выбранной страны зелёным;
- scrollable grid флагов;
- выбранный флаг подсвечен зелёным glow;
- жёлтая кнопка Confirm;
- чекбокс `Don't show again`.

Сетка на мобилке:

```text
5 columns
несколько рядов
вертикальный scroll внутри карточки
```

Важно:

- confirm button должен быть закреплён внизу карточки;
- список флагов скроллится отдельно;
- карточка не должна вылезать за safe area.

## Buy Bonus Mobile Overlay

На мобилке Buy Bonus — полноэкранный overlay поверх затемнённого поля.

Не отдельное маленькое desktop-окно.

Состав:

```text
top: обычный header остаётся видимым
top-right: close X
center: BUY BONUS:
middle: три вертикальные bonus-опции Easy / Medium / Hard
bottom: пояснение
bottom fixed: bet selector
bottom: balance
```

Пример:

```text
BUY BONUS:

EASY      MAX WIN 100.64x     [$6 000]
MEDIUM    MAX WIN 1812.54x    [$12 000]
HARD      MAX WIN 6298.56x    [$20 000]

A MISS DOES NOT WASTE THE WINNINGS

[ < ]   BET $200   [ > ]

$999 706  [wallet]
```

На мобилке bonus cards расположены вертикально, а не в ряд.

## Bonus Mode Mobile UI

После roulette стартует bonus mode.

Видно:

```text
15 SHOTS
$200
```

После каждого удара:

```text
15 SHOTS → 13 SHOTS → 11 SHOTS → 8 SHOTS → 6 SHOTS → 3 SHOTS → ...
```

В записи счётчик не всегда уменьшается на 1 на видимых кадрах, потому что кадры сняты с интервалом. В реализации нужно уменьшать на 1 после каждого удара.

## Mobile Result/Return

После bonus round игра возвращается на основной экран, баланс обновляется, Last Win показывает итог.

В записи видно обновление balance:

```text
999 706 → 1 004 530
```

После возврата:

- Buy Bonus снова доступен;
- Bet selector снова обычный;
- Difficulty снова активен;
- Last Win обновлён.

## Responsive Implementation Recommendation

Сделать layout через относительные координаты.

Примерные зоны:

```ts
const layout = {
  header: {
    y: 0,
    height: 0.06 * H,
  },
  multiplier: {
    y: 0.19 * H,
    height: 0.055 * H,
  },
  goal: {
    y: 0.36 * H,
    width: 0.9 * W,
    height: 0.22 * H,
  },
  bottomPanel: {
    y: 0.81 * H,
    height: 0.17 * H,
  },
  ball: {
    x: 0.5 * W,
    y: 0.78 * H,
    radius: 0.085 * W,
  },
};
```

Для PixiJS:

```ts
const app = new Application();
await app.init({
  resizeTo: window,
  backgroundAlpha: 1,
  antialias: true,
});
```

При resize:

```ts
layout.resize(app.screen.width, app.screen.height);
scene.resize(layout);
```

## Что обязательно передать Codex

1. Делать mobile-first.
2. Основной target viewport: `390×844`.
3. Не использовать desktop-композицию как основную.
4. Все игровые элементы должны помещаться без скролла.
5. Bottom panel всегда закреплена снизу.
6. Ball всегда поверх нижней панели по центру.
7. Buy Bonus overlay на мобилке вертикальный.
8. Country select — modal + scrollable flag grid.
9. Multiplier track — сверху поверх неба, во всю ширину.
10. Goal/goalkeeper — в центральной зоне.


## Mobile UI Assets

Dedicated mobile UI assets are available:

```text
docs/asset-map-mobile-ui.md
source/ui/mobile/cursor.6000941b.png
source/ui/mobile/logoMobile.8dd41027.png
```

Use:
- `logoMobile` in the top header;
- `cursor` as the visible target-zone marker inside the goal.


## HTML Overlay Rule

For mobile implementation, use hybrid rendering:

```text
PixiJS canvas:
- gameplay field
- Spine assets
- ball / goalkeeper / goal / background
- animated effects

HTML/CSS overlay:
- header
- balance
- menu
- bottom panel
- buttons
- modals
- Buy Bonus labels
- Bet / Difficulty / Claim / Last Win
- toast/errors
```

If there is no atlas or image for a menu/interface element, draw it as normal HTML above the canvas.
