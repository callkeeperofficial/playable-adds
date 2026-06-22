# Bonus Mechanic From Second Video

## Что добавлено

Новая запись показывает механику `Buy Bonus`.

Это отдельный режим поверх основной penalty/ladder-механики.

Игрок не просто делает обычную ставку и один удар, а покупает бонусный раунд с гарантированным количеством ударов.

## Вход в режим

На основном экране есть большая кнопка:

```text
BUY BONUS
```

После клика открывается затемнённый overlay поверх поля.

Фон игры размывается/затемняется, сверху остаются элементы шапки:
- логотип;
- How to play;
- balance;
- fullscreen/menu.

Overlay закрывается через крестик в правом верхнем углу.

## Экран Buy Bonus

Показываются три большие карточки:

```text
EASY
MEDIUM
HARD
```

Каждая карточка содержит:

- портрет игрока;
- название сложности;
- lightning-индикаторы силы/риска;
- `MAX WIN`;
- цену покупки бонуса.

Пример из видео при bet `$200`:

```text
Easy   — max win 100.64x   — $6 000
Medium — max win 1812.54x  — $12 000
Hard   — max win 6298.56x  — $20 000
```

Цена масштабируется от выбранной ставки:

```text
Easy   ≈ bet × 30
Medium ≈ bet × 60
Hard   ≈ bet × 100
```

Пример при bet `$110`:

```text
Easy   — $3 300
Medium — $6 600
Hard   — $11 000
```

Внизу overlay есть selector ставки:

```text
<   BET $200   >
```

Также есть пояснение:

```text
A MISS DOES NOT WASTE THE WINNINGS
```

То есть в бонусе промах/сейв не уничтожает уже набранный выигрыш.

## Ошибка покупки

В записи есть toast:

```text
Something went wrong
while creating bet
```

Это можно реализовать как optional error-state/toast.

Для playable достаточно локальной проверки:

- если balance меньше цены bonus — показать ошибку;
- иначе списать цену и запустить bonus roulette.

## Roulette

После покупки бонуса появляется roulette overlay.

Текст:

```text
ROULETTE
12–15 shots guaranteed
```

Колесо содержит сектора с количеством ударов, например:

```text
12
13
14
15
```

После остановки roulette выбранное число показывается крупно поверх gameplay.

Пример из видео:

```text
15
```

Это значит, что бонусный раунд стартует с 15 ударами.

## Bonus Gameplay

После roulette игра возвращается на экран пенальти, но UI меняется.

В нижней панели вместо обычного `BET` отображается количество оставшихся ударов:

```text
15 SHOTS
$200
```

Затем после каждого удара счётчик уменьшается:

```text
15 SHOTS → 14 SHOTS → 13 SHOTS → ... → 0 SHOTS
```

`Difficulty` остаётся видимой, но выглядит заблокированной/неактивной.

`Claim` во время бонуса визуально есть, но фактически не используется как обычный cashout.

## Поведение удара в бонусе

Каждый бонусный удар использует ту же механику пенальти:

1. появляются target-зоны;
2. мяч летит в выбранную/сгенерированную точку;
3. вратарь прыгает;
4. результат может быть goal или save;
5. shot counter уменьшается на 1.

Ключевое отличие:

```text
В обычном режиме save завершает раунд.
В bonus mode save НЕ завершает бонус и НЕ обнуляет уже накопленный выигрыш.
```

Save просто тратит один удар.

## Множители в бонусе

В бонусе верхняя multiplier-линейка продолжает работать, но она может уходить дальше обычных первых 5–6 значений.

В записи видны расширенные значения:

```text
x6.17
x8.42
x11.48
x15.65
x21.34
...
```

То есть для bonus mode нужна длинная ladder-линейка, а не только:

```text
x0 → x1.31 → x1.79 → x2.43 → x3.32 → x4.53
```

Для playable можно сделать массив из 15–25 значений и прокручивать/сдвигать верхнюю шкалу по мере прогресса.

## Last Win / Bonus Win

Во время бонуса справа снизу показывается `LAST WIN`, который обновляется по мере набора выигрыша.

После окончания всех shots появляется отдельный экран результата:

```text
BONUS WIN
```

Визуал:

- затемнённый стадион;
- золотой кубок;
- конфетти;
- сумма выигрыша;
- возможно небольшая подпись под суммой.

Пример финального значения из записи:

```text
$7.93k
```

После result screen баланс обновляется, игра возвращается в обычный режим.

## Новый flow

```text
idle_before_kick
  ↓
buy_bonus_overlay
  ↓
select_bonus_difficulty
  ↓
select_bonus_bet
  ↓
bonus_roulette
  ↓
bonus_intro_selected_shots
  ↓
bonus_shot_loop
  ↓
bonus_result
  ↓
idle_before_kick
```

## Новые состояния

Добавить к state machine:

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
  | "next_round"

  // bonus mode
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

## Новые переменные

```ts
type BonusMode = {
  active: boolean;
  difficulty: Difficulty;
  bet: number;
  price: number;
  maxWinMultiplier: number;
  shotsTotal: number;
  shotsLeft: number;
  accumulatedWin: number;
  currentStep: number;
};
```

## Конфиг для playable

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

## Рекомендация для реализации

Для playable сделать упрощённо:

1. Buy Bonus открывает overlay.
2. Игрок выбирает Easy/Medium/Hard.
3. Цена списывается с balance.
4. Запускается roulette.
5. Roulette выбирает случайно 12–15 shots.
6. Включается bonus mode.
7. Каждый удар уменьшает `shotsLeft`.
8. Save не завершает бонус.
9. Goal двигает multiplier и увеличивает `accumulatedWin`.
10. Когда `shotsLeft === 0`, показать `BONUS WIN`.
11. После result screen вернуть обычный режим.

## Важное отличие от обычного режима

Обычный режим:

```text
save = lose round
goal = advance multiplier / claim available
```

Bonus mode:

```text
save = consume one shot, keep accumulated win
goal = consume one shot, advance multiplier, increase accumulated win
0 shots = show Bonus Win
```


## Roulette UI Assets

The roulette screen has a dedicated static UI asset pack:

```text
docs/asset-map-roulette-ui.md
source/ui/roulette/
```

Use:

```text
rouletteWheel.c208d970.png        — rotating wheel
rouletteWheelArrow.946f3d05.png   — fixed pointer
rouletteWheelSectorPart.6067044f.png — optional sector highlight
sliderball.png                    — likely multiplier track/current marker
sprite.4de80bac.svg               — generic SVG sprite/icons
```

The wheel rotates; the arrow stays fixed.


## Bonus Buy Card Assets

Dedicated static card images are available:

```text
docs/asset-map-bonus-buy-cards.md
source/ui/bonus_buy_cards/
```

Mapping:

```text
Easy   → Bronze card
Medium → Silver card
Hard   → Gold card
```

Mobile overlay should use the `Mobile` card versions. Desktop can use the `Desktop` versions.

The cards are regular PNG images, not Spine.
