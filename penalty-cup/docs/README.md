# Penalty Playable Analysis Package

Пакет для разбора и последующей сборки playable-прототипа футбольной penalty/casino-style игры.

## Содержимое

- `source/` — исходные файлы, которые были загружены или получены из них.
- `processed_assets/` — обработанные ассеты.
- `docs/` — описание механик, экранов, сущностей, состояний и ассетов.
- `codex/` — будущий промпт/инструкция для Codex.
- `video_notes/` — заметки по видео и геймплею.

## Текущий статус

Пока добавлено:
- запись экрана с геймплеем, если файл доступен;
- `worldCupNations` как исходный spritesheet;
- нарезка `worldCupNations` на отдельные PNG-флаги;
- manifest с координатами флагов.


## Добавлено после второй записи

- `docs/bonus-mechanic-from-second-video.md` — описание Buy Bonus / Roulette / Bonus Win.
- `video_notes/new_mechanic_contact_sheet.jpg` — обзор ключевых кадров второй записи.
- `video_notes/bonus_sequence_sheet.jpg` — последовательность первого bonus round.
- `video_notes/bonus2_sequence_sheet.jpg` — последовательность второго bonus round.
- `source/gameplay_bonus_recording.mov` — исходная вторая запись, если включена в архив.


## Добавлено после мобильной записи

- `docs/mobile-layout-from-third-video.md` — mobile-first layout, композиция экранов, адаптивные зоны.
- `video_notes/mobile_mobile_contact_sheet.jpg` — обзор ключевых кадров мобильной записи.
- `source/gameplay_mobile_recording.mov` — исходная мобильная запись, если включена в архив.


## Добавлено после ball Spine asset

- `docs/asset-map-ball-spine.md` — описание Spine-ассета мяча.
- `source/spine/ball/ball.png`
- `source/spine/ball/ball.atlas`
- `source/spine/ball/ball.json`

Жёсткое правило: `ball.png` не резать. Использовать Spine runtime.


## Добавлено после background Spine asset

- `docs/asset-map-background-spine.md` — описание Spine-ассета фона/стадиона.
- `source/spine/background/background.png`
- `source/spine/background/background.atlas`
- `source/spine/background/background.json`

Жёсткое правило: `background.png` не резать. Использовать Spine runtime.


## Добавлено после gates Spine asset

- `docs/asset-map-gates-spine.md` — описание Spine-ассета ворот/сетки.
- `source/spine/gates/gates.png`
- `source/spine/gates/gates.atlas`
- `source/spine/gates/gates.json`

Жёсткое правило: `gates.png` не резать. Использовать Spine runtime.


## Добавлено после goalkeeper Spine asset

- `docs/asset-map-goalkeeper-spine.md` — описание Spine-персонажа вратаря.
- `source/spine/goalkeeper/goalkeeper.png`
- `source/spine/goalkeeper/goalkeeper.atlas`
- `source/spine/goalkeeper/goalkeeper.json`

Жёсткое правило: `goalkeeper.png` не резать. Использовать Spine runtime. Skins связаны со сложностью: easy / medium / hard.


## Добавлено после Big Win / Bonus Win assets

- `docs/asset-map-bigwin-result.md` — описание win/result screen ассетов.
- `source/win/bgBigWin.b5ddd5f5.jpg`
- `source/spine/bigwin_text/bigwin_text.png`
- `source/spine/bigwin_text/bigwin_text.atlas`
- `source/spine/bigwin_text/bigwin_text.json`
- `source/spine/bigwin/bigwin.png`
- `source/spine/bigwin/bigwin.atlas`
- `source/spine/bigwin/bigwin.json`

Жёсткое правило: Spine PNG не резать. Использовать Spine runtime.


## Добавлено после Mega Win assets

- `docs/asset-map-megawin-result.md` — описание Mega Win result screen.
- `source/win/bgMegaWin.9fd1952f.jpg`
- `source/spine/megawin_text/megawin_text.png`
- `source/spine/megawin_text/megawin_text.atlas`
- `source/spine/megawin_text/megawin_text.json`
- `source/spine/megawin/megawin.png`
- `source/spine/megawin/megawin.atlas`
- `source/spine/megawin/megawin.json`

Жёсткое правило: Spine PNG не резать. Использовать Spine runtime.


## Добавлено после Epic Win assets

- `docs/asset-map-epicwin-result.md` — описание Epic Win result screen.
- `source/win/bgEpicWin.9d8cce80.jpg`
- `source/spine/epicwin_text/epicwin_text.png`
- `source/spine/epicwin_text/epicwin_text.atlas`
- `source/spine/epicwin_text/epicwin_text.json`
- `source/spine/epicwin/epicwin.png`
- `source/spine/epicwin/epicwin.atlas`
- `source/spine/epicwin/epicwin.json`

Жёсткое правило: Spine PNG не резать. Использовать Spine runtime.


## Добавлено после Legendary Win assets

- `docs/asset-map-legendarywin-result.md` — описание Legendary Win result screen.
- `source/win/bgLegendaryWin.6c24bab1.jpg`
- `source/spine/legendarywin_text/legendarywin_text.png`
- `source/spine/legendarywin_text/legendarywin_text.atlas`
- `source/spine/legendarywin_text/legendarywin_text.json`
- `source/spine/legendarywin/legendarywin.png`
- `source/spine/legendarywin/legendarywin.atlas`
- `source/spine/legendarywin/legendarywin.json`

Жёсткое правило: Spine PNG не резать. Использовать Spine runtime.


## Добавлено после Roulette UI assets

- `docs/asset-map-roulette-ui.md` — описание roulette wheel / arrow / sector / sliderball assets.
- `source/ui/roulette/rouletteWheel.c208d970.png`
- `source/ui/roulette/rouletteWheelArrow.946f3d05.png`
- `source/ui/roulette/rouletteWheelSectorPart.6067044f.png`
- `source/ui/roulette/sliderball.png`
- `source/ui/roulette/sprite.4de80bac.svg`

Это не Spine. Использовать как обычные PixiJS textures.


## Добавлено после Confetti Spine asset

- `docs/asset-map-confetti-spine.md` — описание Spine-эффекта конфетти.
- `source/spine/confetti/confetti.png`
- `source/spine/confetti/confetti.atlas`
- `source/spine/confetti/confetti.json`

Жёсткое правило: `confetti.png` не резать. Использовать Spine runtime. Эффект использовать как overlay на win/result экранах.


## Добавлено после Mobile UI assets

- `docs/asset-map-mobile-ui.md` — описание cursor / logoMobile.
- `source/ui/mobile/cursor.6000941b.png`
- `source/ui/mobile/logoMobile.8dd41027.png`

Это не Spine. Использовать как обычные PixiJS textures.


## Добавлено после Bonus Buy card assets

- `docs/asset-map-bonus-buy-cards.md` — описание Bronze/Silver/Gold Buy Bonus cards.
- `source/ui/bonus_buy_cards/bonusbuyBronzeDesktop.65bbd194.png`
- `source/ui/bonus_buy_cards/bonusbuyBronzeMobile.b369f44a.png`
- `source/ui/bonus_buy_cards/bonusbuySilverDesktop.6df21a04.png`
- `source/ui/bonus_buy_cards/bonusbuySilverMobile.3ace4b37.png`
- `source/ui/bonus_buy_cards/bonusbuyGoldDesktop.4dfeefd1.png`
- `source/ui/bonus_buy_cards/bonusbuyGoldMobile.fc35bf64.png`

Это не Spine. Использовать как обычные PixiJS textures. Mobile versions primary.


## Добавлено после HTML overlay уточнения

- `docs/html-overlay-ui-rule.md` — правило гибридной архитектуры: PixiJS canvas для игры/Spine, HTML/CSS overlay для меню и UI без ассетов.

Ключевое правило: если для меню/интерфейса нет атласа или картинки, рисовать его обычным HTML поверх canvas.
