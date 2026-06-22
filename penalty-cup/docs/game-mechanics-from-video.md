# Game Mechanics From Video

## Тип игры

Penalty/casino-style playable game.

Не обычный футбольный симулятор, а серия пенальти с лестницей множителей и возможностью забрать выигрыш через Claim.

## Core loop

1. Игрок выбирает страну.
2. Игрок выбирает сложность: Easy / Medium / Hard.
3. Игрок выбирает ставку.
4. В воротах появляются target-зоны.
5. Игрок выбирает точку удара.
6. Мяч летит в выбранную точку.
7. Вратарь прыгает в одну из зон.
8. Если вратарь не отбил — игрок проходит дальше по множителю.
9. После успешного удара игрок может нажать Claim.
10. Если вратарь отбил — раунд проигран.

## Основные состояния

```text
country_select
idle_before_kick
show_targets
target_selected
ball_flying
goalkeeper_diving
success
fail
claim_available
claimed
next_round
```

## UI

- выбор страны;
- поле/стадион;
- ворота;
- вратарь;
- мяч;
- target-зоны;
- флаги команд;
- шкала множителей;
- Difficulty selector;
- Bet selector;
- Claim button;
- Last Win;
- Buy Bonus;
- How to play;
- balance;
- menu/fullscreen.

## Важное

Точную математику игры по видео восстановить нельзя:
- вероятности сейва;
- RTP;
- точные хитбоксы;
- серверную логику.

Для playable это можно заменить локальной симуляцией.


## Дополнение: Buy Bonus

Вторая запись добавляет отдельный bonus mode.

Кратко:

```text
Buy Bonus → выбор Easy/Medium/Hard → roulette 12–15 shots → серия бонусных пенальти → Bonus Win
```

Ключевое отличие от обычного режима:

```text
Обычный save завершает раунд.
Bonus save только тратит один shot и не обнуляет накопленный выигрыш.
```

Полное описание смотри:

```text
docs/bonus-mechanic-from-second-video.md
```
