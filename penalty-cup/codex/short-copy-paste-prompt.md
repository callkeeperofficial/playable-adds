Собери playable-прототип футбольной penalty/casino-style игры на PixiJS + Vite + TypeScript.

Используй папки `docs/`, `processed_assets/`, `source/`.

Главная механика:
- выбор страны;
- экран пенальти;
- Easy / Medium / Hard;
- выбор ставки;
- выбор target-зоны в воротах;
- мяч летит к target;
- вратарь прыгает;
- если сейв — проигрыш раунда;
- если гол — переход на следующий множитель;
- после гола доступен Claim;
- Claim добавляет выигрыш к balance и завершает раунд.

Это playable ad prototype, не настоящая азартная игра. Реальные деньги, сервер, RTP, платежи и авторизация не нужны. Всё локально в браузере.

Ассеты стран:
`processed_assets/worldCupNations_split/`
Это нарезанные флаги из spritesheet 420×250, сетка 10×5, ячейка 42×50.

Если каких-то ассетов не хватает — использовать placeholder-графику PixiJS.

Готово, если `npm install` и `npm run dev` запускают игру, можно выбрать страну, сыграть серию пенальти, увидеть Goal/Saved, продвинуть множитель и нажать Claim.


Добавь Buy Bonus:
- кнопка `BUY BONUS` на основном экране;
- overlay с карточками Easy/Medium/Hard;
- цена: Easy = bet×30, Medium = bet×60, Hard = bet×100;
- после покупки roulette выбирает 12–15 shots;
- запускается bonus mode;
- внизу показывать `N SHOTS` вместо обычного bet;
- save в bonus mode не завершает раунд, только тратит shot;
- goal продвигает multiplier и увеличивает accumulated win;
- при 0 shots показать `BONUS WIN` с кубком/конфетти и суммой;
- затем вернуть обычный режим.


Mobile-first:
- игра делается под вертикальный телефон, target viewport 390×844;
- canvas full-screen, без скролла;
- header сверху: logo, balance, menu;
- multiplier track сверху поверх неба;
- ворота/вратарь в центре;
- большой мяч по центру над нижней панелью;
- bottom panel закреплена снизу: Difficulty, Bet/Shots, Last Win, Claim;
- Country Select — modal с 5 колонками флагов и confirm;
- Buy Bonus — fullscreen overlay с вертикальными Easy/Medium/Hard и нижним bet selector;
- все координаты делать responsive через layout helper.


Spine ball asset:
- файлы: `source/spine/ball/ball.png`, `ball.atlas`, `ball.json`;
- это Spine 4.2 asset;
- НЕ резать `ball.png`;
- использовать Spine runtime для PixiJS, предпочтительно `@esotericsoftware/spine-pixi-v8`;
- проигрывать анимации из `ball.json`;
- если runtime не заведётся сразу, временно использовать placeholder, но не делать ручную нарезку atlas.


Spine background asset:
- файлы: `source/spine/background/background.png`, `background.atlas`, `background.json`;
- НЕ резать `background.png`;
- использовать Spine runtime;
- анимации: `background`, `background_bonus`, `background_fire`;
- использовать как нижний слой сцены;
- на mobile применять cover/crop, не сжимать весь широкий фон в экран.


Spine gates asset:
- файлы: `source/spine/gates/gates.png`, `gates.atlas`, `gates.json`;
- НЕ резать `gates.png`;
- использовать Spine runtime;
- это слой ворот/сетки;
- расположить над background, под goalkeeper/target/ball;
- на mobile ширина ворот примерно 88–96% viewport, scale uniform.


Spine goalkeeper asset:
- файлы: `source/spine/goalkeeper/goalkeeper.png`, `goalkeeper.atlas`, `goalkeeper.json`;
- НЕ резать `goalkeeper.png`;
- использовать Spine runtime;
- это rigged character с IK/constraints/skins;
- skins: easy / medium / hard;
- skin менять при смене Difficulty;
- расположить в центре ворот;
- проигрывать idle/save/dive animations из `goalkeeper.json`.


Big Win / Bonus Win assets:
- `source/win/bgBigWin.b5ddd5f5.jpg` — static dark result background;
- `source/spine/bigwin_text/` — Spine BIG WIN text, animations: bigwin_start / bigwin_idle / bigwin_end;
- `source/spine/bigwin/` — Spine golden ball/pedestal, animations: bigwin_start / bigwin_idle / bigwin_end / big-epic_win_transition;
- НЕ резать Spine PNG;
- добавить BigWinOverlay после bonus_result;
- показывать сумму выигрыша и закрывать overlay по tap/timeout.


Mega Win assets:
- `source/win/bgMegaWin.9fd1952f.jpg` — static warm result background;
- `source/spine/megawin_text/` — Spine MEGA WIN text, animations: megawin_start / megawin_idle / megawin_end;
- `source/spine/megawin/` — Spine trophy/pedestal, animations: megawin_start / megawin_idle / megawin_end;
- НЕ резать Spine PNG;
- расширить BigWinOverlay до generic WinOverlay;
- tiers: big / mega;
- Mega Win показывать для более крупных bonus/claim результатов.


Epic Win assets:
- `source/win/bgEpicWin.9d8cce80.jpg` — static cool result background;
- `source/spine/epicwin_text/` — Spine EPIC WIN text, animations: epicwin_start / epicwin_idle / epicwin_end / epicwin_transition;
- `source/spine/epicwin/` — Spine golden boot/ball/pedestal, animations: epicwin_start / epicwin_idle / epicwin_end плюс transition animations;
- НЕ резать Spine PNG;
- расширить WinOverlay до tiers: big / mega / epic;
- Epic Win показывать для самых крупных bonus/claim результатов.


Legendary Win assets:
- `source/win/bgLegendaryWin.6c24bab1.jpg` — static result background;
- `source/spine/legendarywin_text/` — Spine LEGENDARY WIN text;
- `source/spine/legendarywin/` — Spine legendary prize stage;
- НЕ резать Spine PNG;
- расширить WinOverlay до tiers: big / mega / epic / legendary;
- Legendary Win показывать для самых крупных bonus/claim результатов;
- animation names проверять по JSON перед playback.


Roulette UI assets:
- `source/ui/roulette/rouletteWheel.c208d970.png` — rotating wheel;
- `source/ui/roulette/rouletteWheelArrow.946f3d05.png` — fixed pointer;
- `source/ui/roulette/rouletteWheelSectorPart.6067044f.png` — optional selected-sector highlight/mask;
- `source/ui/roulette/sliderball.png` — likely multiplier-track ball marker;
- `source/ui/roulette/sprite.4de80bac.svg` — generic SVG sprite/icons;
- это НЕ Spine, использовать как обычные PixiJS textures;
- wheel вращается, arrow остаётся fixed;
- roulette выбирает 12–15 shots.


Confetti Spine effect:
- `source/spine/confetti/confetti.png`, `confetti.atlas`, `confetti.json`;
- НЕ резать `confetti.png`;
- использовать Spine runtime;
- добавить как overlay в WinOverlay;
- использовать на Big/Mega/Epic/Legendary/Bonus Win;
- animation names брать из JSON.


Mobile UI assets:
- `source/ui/mobile/cursor.6000941b.png` — target cursor marker for goal shot zones;
- `source/ui/mobile/logoMobile.8dd41027.png` — mobile header logo;
- это НЕ Spine, использовать как обычные PixiJS textures;
- cursor связать с target zones 1..15;
- logoMobile поставить в header слева.


Bonus Buy card assets:
- `source/ui/bonus_buy_cards/` contains Bronze/Silver/Gold cards;
- это НЕ Spine, использовать как обычные PixiJS textures;
- mapping: Easy → Bronze, Medium → Silver, Hard → Gold;
- mobile versions primary, desktop versions optional;
- в Buy Bonus overlay карточки кликабельные;
- поверх карточек добавить dynamic text: difficulty, max win, price.


HTML overlay rule:
- игра/Spine/анимации — в PixiJS canvas;
- меню и весь UI без атласа/картинки — обычный HTML/CSS поверх canvas;
- header, balance, menu, bottom panel, Difficulty, Bet, Claim, Last Win, Buy Bonus labels, How to play, toasts — HTML;
- canvas и HTML связывать через shared state/event bridge;
- не рисовать весь интерфейс через Pixi Graphics/Text, если это обычное меню.
