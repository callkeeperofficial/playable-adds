# Asset Map: worldCupNations

## Файл

`worldCupNations.a8349004.svg` / `worldCupNations.png`

## Назначение

SVG/PNG spritesheet флагов стран в форме щитов. Используется на экране выбора страны и, вероятно, в HUD матча.

## Размеры

- Общий размер: `420 × 250 px`
- Сетка: `10 × 5`
- Размер ячейки: `42 × 50 px`
- Всего ячеек: `50`

## Координаты

Для ячейки:

```ts
const cellWidth = 42;
const cellHeight = 50;

const x = col * cellWidth;
const y = row * cellHeight;
```

## Нарезка

Нарезанные файлы лежат в:

`processed_assets/worldCupNations_split/`

Формат имени:

```text
nation_00_r0_c0.png
nation_01_r0_c1.png
...
nation_49_r4_c9.png
```

## Manifest

`manifest.json` содержит:

```json
{
  "index": 0,
  "file": "nation_00_r0_c0.png",
  "row": 0,
  "col": 0,
  "x": 0,
  "y": 0,
  "width": 42,
  "height": 50
}
```

## Рекомендация для реализации

Для playable лучше использовать уже нарезанные PNG, а не обращаться к spritesheet по координатам. Так меньше риск ошибки при сборке через Codex.
