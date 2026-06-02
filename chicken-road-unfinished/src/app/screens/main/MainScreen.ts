import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion/react";
import type { Ticker } from "pixi.js";
import { Container, Graphics, Rectangle, Sprite, Texture } from "pixi.js";

import { engine } from "../../getEngine";
import { PausePopup } from "../../popups/PausePopup";

import { ChickenGo } from "./ChickenGo";
import { ChickenIdle } from "./ChickenIdle";
import { ControlPanel } from "./ControlPanel";
import { Header } from "./Header";

/** The screen that holds the app */
export class MainScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["main"];

  // Контейнеры для разных секций
  private headerContainer: Header;
  private gameAreaContainer: Container;
  private controlPanelContainer: ControlPanel;

  // Игровая область
  private roadContainer!: Container; // Контейнер для дороги, который можно скроллить
  private roadGraphics!: Graphics;
  private chickenIdleSprite!: ChickenIdle;
  private chickenGoSprite!: ChickenGo;
  private chickenSprite!: ChickenIdle | ChickenGo; // Текущий активный спрайт курицы
  private archSprite!: Sprite;
  private lastLaneEggSprite!: Sprite; // Спрайт яйца на последней полосе
  private startDecorationSprite!: Sprite; // start_decoration для первой полосы
  private startFrontDecorationSprite!: Sprite; // start_front_decoration поверх
  private exitDecorationSprite!: Sprite; // exit_decoration для последней полосы
  private laneSprites: Sprite[] = []; // Спрайты луков для обычных полос
  private laneMultipliers: number[] = []; // Множители для каждой полосы
  private roadDecorSprites: Sprite[] = []; // Спрайты road_decor для каждой полосы
  private whiteRectSprites: Sprite[] = []; // Спрайты whiteRect для каждой полосы
  private bottomRectSprites: Sprite[] = []; // Спрайты bottomRect0/bottomRect1 для каждой полосы
  private vaseSprite!: Sprite; // Спрайт vase для последней полосы
  private laneCount: number; // Количество обычных полос между первой и последней
  private laneWidth = 0;
  private chickenWidth = 0;

  // Состояние игры
  public currentLaneIndex = -1; // Текущая полоса курицы (-1 = на старте, -2 = сгорела)
  private laneStates: ("default" | "green" | "red")[] = []; // Состояние каждой полосы
  private isMoving = false; // Флаг движения курицы
  private moveStartX = 0; // Начальная позиция X при движении
  private moveTargetX = 0; // Целевая позиция X при движении
  private moveProgress = 0; // Прогресс анимации (0-1)
  private moveDuration = 0.5; // Длительность анимации в секундах
  private eggBaseY = 0; // Базовая Y позиция яйца для анимации
  private eggBobTime = 0; // Время для анимации покачивания яйца
  private whiteRectBaseY = 0; // Базовая Y позиция whiteRect для анимации
  private whiteRectAnimating = false; // Флаг анимации whiteRect
  private whiteRectAnimIndex = -1; // Индекс анимируемого whiteRect

  // Переменные для скроллинга
  private isDragging = false;
  private dragStartX = 0;
  private dragStartOffset = 0;
  private roadOffset = 0; // Текущее смещение дороги
  private roadWidth = 0; // Ширина дороги
  private screenWidth = 0; // Ширина экрана

  private paused = false;

  constructor(laneCount: number = 7) {
    super();

    this.laneCount = laneCount;

    // Создаем контейнеры
    this.headerContainer = new Header();
    this.gameAreaContainer = new Container();
    this.controlPanelContainer = new ControlPanel();

    // Настраиваем колбэки для панели управления
    this.controlPanelContainer.onPlay = () => {
      this.jumpToNextLane();
    };

    this.addChild(this.headerContainer);
    this.addChild(this.gameAreaContainer);
    this.addChild(this.controlPanelContainer);

    this.createGameArea();
  }

  /**
   * Установить количество полос
   */
  public setLaneCount(count: number) {
    if (count < 1) {
      console.warn("Количество полос должно быть больше 0");
      return;
    }
    this.laneCount = count;
    // Пересоздаем кнопки множителей
    this.recreateMultiplierButtons();
    // Перерисовываем дорогу, если размеры экрана уже известны
    if (this.roadGraphics) {
      const screenWidth = engine().screen.width;
      const screenHeight = engine().screen.height;
      const headerHeight = 120;
      const controlPanelHeight = 180;
      this.drawRoad(
        screenWidth,
        screenHeight - headerHeight - controlPanelHeight,
      );
    }
  }

  /**
   * Получить количество полос
   */
  public getLaneCount(): number {
    return this.laneCount;
  }

  private createGameArea() {
    // Создаем контейнер для дороги, который можно скроллить
    this.roadContainer = new Container();
    this.gameAreaContainer.addChild(this.roadContainer);

    // Создаем графику для дороги
    this.roadGraphics = new Graphics();
    this.roadContainer.addChild(this.roadGraphics);

    // Делаем игровую область интерактивной для скроллинга
    this.gameAreaContainer.interactive = true;
    this.gameAreaContainer.cursor = "grab";

    // Обработчики событий для скроллинга
    this.setupScrolling();

    // Создаем анимированную курицу в покое
    try {
      this.chickenIdleSprite = new ChickenIdle();
      this.roadContainer.addChild(this.chickenIdleSprite);
      this.chickenIdleSprite.visible = true;

      // Создаем анимированную курицу в движении
      this.chickenGoSprite = new ChickenGo();
      this.roadContainer.addChild(this.chickenGoSprite);
      this.chickenGoSprite.visible = false;

      // Устанавливаем текущий спрайт как idle
      this.chickenSprite = this.chickenIdleSprite;

      // Вычисляем ширину курицы с учетом масштаба
      // Размер кадра 300x300, масштаб 0.5, значит ширина = 300 * 0.5 = 150
      this.chickenWidth = this.chickenSprite.width || 300 * 0.5;
    } catch (error) {
      // Если спрайт не найден, создаем заглушку
      console.warn("Не удалось загрузить анимацию курицы:", error);
      const chickenPlaceholder = new Graphics();
      chickenPlaceholder.circle(0, 0, 30);
      chickenPlaceholder.fill(0xffffff);
      // Создаем пустой ChickenIdle для совместимости типов
      this.chickenIdleSprite = new ChickenIdle();
      this.chickenIdleSprite.visible = false;
      this.chickenGoSprite = new ChickenGo();
      this.chickenGoSprite.visible = false;
      this.chickenSprite = this.chickenIdleSprite;
      this.roadContainer.addChild(chickenPlaceholder);
      // Используем размер заглушки или дефолтный размер курицы
      this.chickenWidth = 60;
    }

    // Если ширина курицы еще не определена, используем значение по умолчанию
    if (!this.chickenWidth || this.chickenWidth === 0) {
      this.chickenWidth = 150; // 300 * 0.5 (размер кадра * масштаб)
    }

    // Пытаемся загрузить спрайт арки
    try {
      this.archSprite = new Sprite({
        texture: Texture.from("arch.png"), // Замените на реальное имя файла
        anchor: 0.5,
      });
      this.roadContainer.addChild(this.archSprite);
    } catch {
      // Если спрайт не найден, создаем заглушку
      const archPlaceholder = new Graphics();
      archPlaceholder.rect(-40, -60, 80, 120);
      archPlaceholder.fill(0x888888);
      this.archSprite = new Sprite(Texture.EMPTY);
      this.roadContainer.addChild(archPlaceholder);
    }

    // Создаем спрайт первой полосы (где стоит курица)
    this.createFirstLane();

    // Создаем спрайты последней полосы (главный приз)
    this.createLastLane();

    this.createMultiplierButtons();

    // Создаем декоративные элементы
    this.createDecorElements();

    // Перемещаем курицу поверх декоративных элементов
    if (this.chickenIdleSprite && this.chickenGoSprite) {
      // Перемещаем курицу в конец списка детей, чтобы она была поверх всех
      this.roadContainer.setChildIndex(
        this.chickenIdleSprite,
        this.roadContainer.children.length - 1,
      );
      this.roadContainer.setChildIndex(
        this.chickenGoSprite,
        this.roadContainer.children.length - 1,
      );
    }

    // Перемещаем startFrontDecorationSprite поверх курицы
    if (this.startFrontDecorationSprite) {
      this.roadContainer.setChildIndex(
        this.startFrontDecorationSprite,
        this.roadContainer.children.length - 1,
      );
    }

    // Перемещаем bottomRect первой полосы поверх startFrontDecorationSprite
    if (this.bottomRectSprites.length > 0) {
      this.roadContainer.setChildIndex(
        this.bottomRectSprites[0],
        this.roadContainer.children.length - 1,
      );
    }
  }

  /**
   * Создать декоративные элементы для полос
   */
  private createDecorElements() {
    const totalLanes = this.getTotalLaneCount();

    // Создаем road_decor, whiteRect и bottomRect для каждой полосы
    for (let i = 0; i < totalLanes; i++) {
      try {
        // Создаем road_decor
        const roadDecor = this.createDecorSpriteFromSheet("road_decor");
        roadDecor.anchor.set(0.5);
        this.roadDecorSprites.push(roadDecor);
        this.roadContainer.addChild(roadDecor);

        // Создаем whiteRect
        const whiteRect = this.createDecorSpriteFromSheet("whiteRect");
        whiteRect.anchor.set(0.5);
        this.whiteRectSprites.push(whiteRect);
        this.roadContainer.addChild(whiteRect);

        // Создаем bottomRect (чередуем bottomRect0 и bottomRect1)
        const bottomRectName = i % 2 === 0 ? "bottomRect0" : "bottomRect1";
        const bottomRect = this.createDecorSpriteFromSheet(bottomRectName);
        bottomRect.anchor.set(0.5);
        this.bottomRectSprites.push(bottomRect);
        this.roadContainer.addChild(bottomRect);
      } catch (error) {
        console.warn(`Не удалось загрузить декоративные спрайты:`, error);
        const placeholder = new Graphics();
        placeholder.rect(0, 0, 100, 50);
        placeholder.fill(0x888888);
        const roadDecor = new Sprite(Texture.EMPTY);
        const whiteRect = new Sprite(Texture.EMPTY);
        const bottomRect = new Sprite(Texture.EMPTY);
        this.roadDecorSprites.push(roadDecor);
        this.whiteRectSprites.push(whiteRect);
        this.bottomRectSprites.push(bottomRect);
        this.roadContainer.addChild(placeholder);
      }
    }

    // Создаем vase для последней полосы
    try {
      this.vaseSprite = this.createDecorSpriteFromSheet("vase");
      this.vaseSprite.anchor.set(0.5);
      this.roadContainer.addChild(this.vaseSprite);
    } catch (error) {
      console.warn(`Не удалось загрузить спрайт vase:`, error);
      const placeholder = new Graphics();
      placeholder.rect(0, 0, 50, 50);
      placeholder.fill(0xffd700);
      this.vaseSprite = new Sprite(Texture.EMPTY);
      this.roadContainer.addChild(placeholder);
    }
  }

  /**
   * Создать спрайт первой полосы (где стоит курица)
   */
  private createFirstLane() {
    try {
      // Создаем start_decoration (задний план)
      this.startDecorationSprite =
        this.createWallSpriteFromSheet("start_decoration");
      this.startDecorationSprite.anchor.set(0.5, 1);
      this.roadContainer.addChild(this.startDecorationSprite);

      // Создаем start_front_decoration (передний план)
      this.startFrontDecorationSprite = this.createWallSpriteFromSheet(
        "start_front_decoration",
      );
      this.startFrontDecorationSprite.anchor.set(0.5, 1);
      this.roadContainer.addChild(this.startFrontDecorationSprite);
    } catch (error) {
      console.warn("Не удалось загрузить спрайты первой полосы:", error);
      // Если спрайт не найден, создаем заглушку
      const placeholder = new Graphics();
      placeholder.rect(0, 0, this.laneWidth, 200);
      placeholder.fill(0x4a4a6a);
      this.startDecorationSprite = new Sprite(Texture.EMPTY);
      this.startFrontDecorationSprite = new Sprite(Texture.EMPTY);
      this.roadContainer.addChild(placeholder);
    }
  }

  /**
   * Создать спрайт яйца на последней полосе (главный приз)
   */
  private createLastLane() {
    // Создаем exit_decoration для последней полосы
    try {
      this.exitDecorationSprite =
        this.createWallSpriteFromSheet("exit_decoration");
      this.exitDecorationSprite.anchor.set(0.5, 1);
      this.roadContainer.addChild(this.exitDecorationSprite);
    } catch (error) {
      console.warn("Не удалось загрузить exit_decoration:", error);
      this.exitDecorationSprite = new Sprite(Texture.EMPTY);
    }

    // Создаем спрайт яйца для последней полосы
    try {
      this.lastLaneEggSprite = this.createSpriteFromSheet("egg_gold");
      this.lastLaneEggSprite.anchor.set(0.5);
      this.roadContainer.addChild(this.lastLaneEggSprite);
    } catch {
      // Если спрайт не найден, создаем заглушку
      const placeholder = new Graphics();
      placeholder.circle(0, 0, 50);
      placeholder.fill(0xffd700);
      this.lastLaneEggSprite = new Sprite(Texture.EMPTY);
      this.roadContainer.addChild(placeholder);
    }
  }

  /**
   * Создать спрайт из спрайт-листа objects.png
   */
  private createSpriteFromSheet(frameName: string): Sprite {
    const SPRITE_SHEET_DATA = {
      egg_gold: { frame: { x: 1, y: 1, w: 620, h: 748 } },
      egg_green: { frame: { x: 623, y: 1, w: 620, h: 748 } },
      egg_red: { frame: { x: 1, y: 751, w: 620, h: 748 } },
      luke_default: { frame: { x: 623, y: 751, w: 400, h: 412 } },
      luke_empty: { frame: { x: 1025, y: 751, w: 452, h: 464 } },
      luke_gold: { frame: { x: 1245, y: 1, w: 400, h: 412 } },
      luke_green: { frame: { x: 1479, y: 415, w: 400, h: 413 } },
      luke_red: { frame: { x: 1479, y: 830, w: 400, h: 412 } },
    };

    const baseTexture = Texture.from("objects.png");
    const frameData =
      SPRITE_SHEET_DATA[frameName as keyof typeof SPRITE_SHEET_DATA];

    if (!frameData) {
      throw new Error(`Frame ${frameName} not found in sprite sheet`);
    }

    const { x, y, w, h } = frameData.frame;
    const texture = new Texture({
      source: baseTexture.source,
      frame: new Rectangle(x, y, w, h),
    });

    return new Sprite(texture);
  }

  /**
   * Создать спрайт из спрайт-листа decors.png
   */
  private createDecorSpriteFromSheet(frameName: string): Sprite {
    const SPRITE_SHEET_DATA = {
      bottomRect0: { frame: { x: 1, y: 1, w: 620, h: 126 } },
      bottomRect1: { frame: { x: 1, y: 129, w: 620, h: 126 } },
      brick0: { frame: { x: 623, y: 1, w: 432, h: 926 } },
      brick1: { frame: { x: 1, y: 929, w: 196, h: 122 } },
      brick2: { frame: { x: 1057, y: 1, w: 432, h: 336 } },
      brick_dark: { frame: { x: 1, y: 339, w: 196, h: 122 } },
      brick_start: { frame: { x: 199, y: 339, w: 196, h: 122 } },
      decoration_brick: { frame: { x: 397, y: 339, w: 196, h: 122 } },
      decoration_light: { frame: { x: 1057, y: 339, w: 512, h: 670 } },
      road_decor: { frame: { x: 199, y: 1011, w: 368, h: 392 } },
      vase: { frame: { x: 569, y: 1011, w: 282, h: 158 } },
      whiteRect: { frame: { x: 853, y: 1011, w: 432, h: 68 } },
    };

    const baseTexture = Texture.from("decors.png");
    const frameData =
      SPRITE_SHEET_DATA[frameName as keyof typeof SPRITE_SHEET_DATA];

    if (!frameData) {
      throw new Error(`Frame ${frameName} not found in decor sprite sheet`);
    }

    const { x, y, w, h } = frameData.frame;
    const texture = new Texture({
      source: baseTexture.source,
      frame: new Rectangle(x, y, w, h),
    });

    return new Sprite(texture);
  }

  /**
   * Создать спрайт из спрайт-листа walls.png
   */
  private createWallSpriteFromSheet(frameName: string): Sprite {
    const SPRITE_SHEET_DATA = {
      dash_line: { frame: { x: 1, y: 1, w: 16, h: 1137 } },
      decoration_walls: { frame: { x: 19, y: 1, w: 620, h: 1146 } },
      exit_decoration: { frame: { x: 641, y: 1, w: 620, h: 1370 } },
      start_decoration: { frame: { x: 1263, y: 1, w: 412, h: 1094 } },
      start_front_decoration: { frame: { x: 1263, y: 1097, w: 310, h: 694 } },
    };

    const baseTexture = Texture.from("walls.png");
    const frameData =
      SPRITE_SHEET_DATA[frameName as keyof typeof SPRITE_SHEET_DATA];

    if (!frameData) {
      throw new Error(`Frame ${frameName} not found in walls sprite sheet`);
    }

    const { x, y, w, h } = frameData.frame;
    const texture = new Texture({
      source: baseTexture.source,
      frame: new Rectangle(x, y, w, h),
    });

    return new Sprite(texture);
  }

  /**
   * Настроить обработчики событий для скроллинга дороги
   */
  private setupScrolling() {
    // Начало перетаскивания
    this.gameAreaContainer.on("pointerdown", (event) => {
      // Проверяем, не кликнули ли по спрайту полосы
      const target = event.target;
      const isLaneSprite = this.laneSprites.some((sprite) => target === sprite);

      if (!isLaneSprite) {
        this.isDragging = true;
        this.dragStartX = event.global.x;
        this.dragStartOffset = this.roadOffset;
        this.gameAreaContainer.cursor = "grabbing";
        event.stopPropagation();
      }
    });

    // Перемещение при перетаскивании
    this.gameAreaContainer.on("pointermove", (event) => {
      if (this.isDragging) {
        const deltaX = event.global.x - this.dragStartX;
        const newOffset = this.dragStartOffset + deltaX;

        // Ограничиваем смещение границами дороги
        const maxOffset = 0; // Максимальное смещение влево (дорога у левого края)
        const minOffset = this.screenWidth - this.roadWidth; // Минимальное смещение вправо

        // Если дорога уже помещается на экране, не позволяем скроллить
        if (this.roadWidth <= this.screenWidth) {
          this.roadOffset = 0;
        } else {
          this.roadOffset = Math.max(minOffset, Math.min(maxOffset, newOffset));
        }

        this.roadContainer.x = this.roadOffset;
        event.stopPropagation();
      }
    });

    // Конец перетаскивания
    this.gameAreaContainer.on("pointerup", () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.gameAreaContainer.cursor = "grab";
      }
    });

    this.gameAreaContainer.on("pointerupoutside", () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.gameAreaContainer.cursor = "grab";
      }
    });
  }

  /**
   * Создать спрайты луков для обычных полос (не первая и не последняя)
   */
  private createMultiplierButtons() {
    // Генерируем множители динамически или используем предустановленные
    const baseMultipliers = [1.03, 1.07, 1.12, 1.17, 1.23, 1.29, 1.5];
    this.laneMultipliers = [];

    // Генерируем множители только для обычных полос (между первой и последней)
    for (let i = 0; i < this.laneCount; i++) {
      if (i < baseMultipliers.length) {
        this.laneMultipliers.push(baseMultipliers[i]);
      } else {
        // Для дополнительных полос увеличиваем множитель на 0.1
        const lastMultiplier =
          this.laneMultipliers[this.laneMultipliers.length - 1] || 1.5;
        this.laneMultipliers.push(lastMultiplier + 0.1);
      }
    }

    // Инициализируем состояния полос
    this.laneStates = new Array(this.laneCount).fill("default");

    // Создаем спрайты луков только для обычных полос (пропускаем первую и последнюю)
    for (let i = 0; i < this.laneCount; i++) {
      try {
        const sprite = this.createSpriteFromSheet("luke_default");
        sprite.anchor.set(0.5);
        this.laneSprites.push(sprite);
        this.roadContainer.addChild(sprite);
      } catch (error) {
        // Если спрайт не найден, создаем заглушку
        console.warn(`Не удалось загрузить спрайт luke_default:`, error);
        const placeholder = new Graphics();
        placeholder.circle(0, 0, 50);
        placeholder.fill(0x1a3a5a);
        const sprite = new Sprite(Texture.EMPTY);
        this.laneSprites.push(sprite);
        this.roadContainer.addChild(placeholder);
      }
    }
  }

  /**
   * Пересоздать спрайты луков (при изменении количества полос)
   */
  private recreateMultiplierButtons() {
    // Удаляем старые спрайты
    this.laneSprites.forEach((sprite) => {
      this.roadContainer.removeChild(sprite);
    });
    this.laneSprites = [];
    this.laneMultipliers = [];
    this.laneStates = [];

    // Создаем новые спрайты
    this.createMultiplierButtons();
    // Перерисовываем дорогу, чтобы обновить позиции
    if (this.roadGraphics) {
      const screenWidth = engine().screen.width;
      const screenHeight = engine().screen.height;
      const headerHeight = 120;
      const controlPanelHeight = 180;
      this.drawRoad(
        screenWidth,
        screenHeight - headerHeight - controlPanelHeight,
      );
    }
  }

  /**
   * Обновить спрайт полосы в зависимости от состояния
   * @param laneIndex - Индекс полосы (0 = первая обычная полоса)
   * @param state - Состояние: "default", "green" (не сгорела), "red" (сгорела)
   */
  public updateLaneSprite(
    laneIndex: number,
    state: "default" | "green" | "red",
  ) {
    if (laneIndex < 0 || laneIndex >= this.laneSprites.length) {
      return;
    }

    const sprite = this.laneSprites[laneIndex];
    this.laneStates[laneIndex] = state;

    try {
      let frameName: string;
      if (state === "green") {
        frameName = "luke_green";
      } else if (state === "red") {
        frameName = "luke_red";
      } else {
        frameName = "luke_default";
      }

      const newTexture = this.createSpriteFromSheet(frameName).texture;
      sprite.texture = newTexture;
    } catch (error) {
      console.warn(`Не удалось обновить спрайт полосы ${laneIndex}:`, error);
    }
  }

  /**
   * Обновить спрайт яйца на последней полосе
   * @param state - Состояние: "default" (egg_gold), "green" (не сгорела), "red" (сгорела)
   */
  public updateLastLaneEgg(state: "default" | "green" | "red") {
    if (!this.lastLaneEggSprite) {
      return;
    }

    try {
      let frameName: string;
      if (state === "green") {
        frameName = "egg_green";
      } else if (state === "red") {
        frameName = "egg_red";
      } else {
        frameName = "egg_gold";
      }

      const newTexture = this.createSpriteFromSheet(frameName).texture;
      this.lastLaneEggSprite.texture = newTexture;
    } catch (error) {
      console.warn("Не удалось обновить спрайт яйца:", error);
    }
  }

  /**
   * Получить общее количество полос (первая + обычные + последняя)
   */
  private getTotalLaneCount(): number {
    return this.laneCount + 2; // первая + обычные + последняя
  }

  private drawRoad(width: number, height: number) {
    this.roadGraphics.clear();
    this.screenWidth = width;

    const roadY = height * 0.1;
    const roadHeight = height * 0.6;

    // Вычисляем ширину полосы: ширина курицы * 1.2 (на 20% больше), минимум 150px
    this.laneWidth = Math.max(150, this.chickenWidth * 1.2);

    // Вычисляем общую ширину дороги: первая полоса + обычные полосы + последняя полоса
    // Первая и последняя полосы всегда есть, между ними обычные полосы
    const totalLanes = this.getTotalLaneCount(); // первая + обычные + последняя
    this.roadWidth = this.laneWidth * totalLanes;

    // Начальная позиция дороги (слева от экрана, если дорога шире экрана)
    const roadStartX =
      this.roadWidth > width ? 0 : (width - this.roadWidth) * 0.5;

    // Фон первой полосы (темнее)
    this.roadGraphics.rect(roadStartX, roadY, this.laneWidth, roadHeight);
    this.roadGraphics.fill(0x2d324c);

    // Фон остальных полос
    this.roadGraphics.rect(
      roadStartX + this.laneWidth,
      roadY,
      this.roadWidth - this.laneWidth,
      roadHeight,
    );
    this.roadGraphics.fill(0x3e4464);

    // Рисуем стены (серые) по бокам
    const wallWidth = 40;
    const wallColor = 0x555555;

    // Левая стена
    this.roadGraphics.rect(
      roadStartX - wallWidth,
      roadY,
      wallWidth,
      roadHeight,
    );
    this.roadGraphics.fill(wallColor);

    // Правая стена
    this.roadGraphics.rect(
      roadStartX + this.roadWidth,
      roadY,
      wallWidth,
      roadHeight,
    );
    this.roadGraphics.fill(wallColor);

    // Рисуем пунктирные линии между полосами
    const dashLength = 20;
    const dashGap = 10;

    // Рисуем линии между всеми полосами (включая первую и последнюю)
    for (let i = 1; i < totalLanes; i++) {
      const x = roadStartX + i * this.laneWidth;
      let y = roadY;

      this.roadGraphics.moveTo(x, y);
      while (y < roadY + roadHeight) {
        const endY = Math.min(y + dashLength, roadY + roadHeight);
        this.roadGraphics.lineTo(x, endY);
        y = endY + dashGap;
        if (y < roadY + roadHeight) {
          this.roadGraphics.moveTo(x, y);
        }
      }
    }
    this.roadGraphics.stroke({ width: 2, color: 0xffffff });

    // Рисуем решетки внизу каждой полосы
    const grateHeight = 30;
    const grateY = roadY + roadHeight - grateHeight;
    const grateColor = 0x333333;

    // Рисуем решетки для всех полос (включая первую и последнюю)
    for (let i = 0; i < totalLanes; i++) {
      const grateX = roadStartX + i * this.laneWidth;
      this.roadGraphics.rect(grateX, grateY, this.laneWidth, grateHeight);
      this.roadGraphics.fill(grateColor);

      // Рисуем вертикальные линии решетки
      for (let j = 1; j < 4; j++) {
        const lineX = grateX + j * (this.laneWidth / 4);
        this.roadGraphics.moveTo(lineX, grateY);
        this.roadGraphics.lineTo(lineX, grateY + grateHeight);
      }
    }
    this.roadGraphics.stroke({ width: 1, color: 0x444444 });

    // Позиционируем спрайты первой полосы
    const firstLaneCenterX = roadStartX + this.laneWidth * 0.5;
    const startDecoScale =
      (this.laneWidth * 0.67) / (this.startDecorationSprite?.width || 1);
    if (this.startDecorationSprite) {
      this.startDecorationSprite.x = firstLaneCenterX;
      this.startDecorationSprite.y = roadY + roadHeight;
      // Масштабируем под 60% ширины полосы
      this.startDecorationSprite.scale.set(startDecoScale);
    }
    if (this.startFrontDecorationSprite) {
      // Располагаем от левого края полосы
      this.startFrontDecorationSprite.anchor.set(0, 1);
      this.startFrontDecorationSprite.x = roadStartX;
      this.startFrontDecorationSprite.y = roadY + roadHeight;
      // Используем тот же масштаб, что и у start_decoration
      this.startFrontDecorationSprite.scale.set(startDecoScale);
    }

    // Позиционируем курицу на текущей полосе (внизу полосы)
    if (this.chickenIdleSprite && this.chickenGoSprite) {
      const laneIndex = Math.max(0, this.currentLaneIndex);
      const chickenX = roadStartX + (laneIndex + 0.5) * this.laneWidth;
      const chickenY = roadY + roadHeight - this.chickenSprite.height * 0.5;

      // Позиционируем оба спрайта в одной позиции
      this.chickenIdleSprite.x = chickenX;
      this.chickenIdleSprite.y = chickenY;
      this.chickenGoSprite.x = chickenX;
      this.chickenGoSprite.y = chickenY;
    }

    // Позиционируем арку слева от дороги
    if (this.archSprite) {
      this.archSprite.x = roadStartX - wallWidth - 60;
      this.archSprite.y = roadY + roadHeight * 0.5;
    }

    // Позиционируем спрайт яйца на последней полосе (главный приз)
    const lastLaneX = roadStartX + (totalLanes - 1) * this.laneWidth;

    // Позиционируем exit_decoration для последней полосы
    if (this.exitDecorationSprite) {
      this.exitDecorationSprite.x = lastLaneX + this.laneWidth * 0.5;
      this.exitDecorationSprite.y = roadY + roadHeight;
      // Масштабируем под высоту дороги
      const scale = roadHeight / this.exitDecorationSprite.height;
      this.exitDecorationSprite.scale.set(scale);
    }

    if (this.lastLaneEggSprite) {
      this.lastLaneEggSprite.x = lastLaneX + this.laneWidth * 0.5;
      // Сохраняем базовую Y позицию для анимации покачивания
      this.eggBaseY = roadY + roadHeight * 0.4;
      this.lastLaneEggSprite.y = this.eggBaseY;
      // Масштабируем яйцо под размер полосы
      const scale = Math.min(
        this.laneWidth / this.lastLaneEggSprite.width,
        (roadHeight * 0.8) / this.lastLaneEggSprite.height,
      );
      this.lastLaneEggSprite.scale.set(scale);
    }

    // Позиционируем спрайты луков только для обычных полос (пропускаем первую и последнюю)
    // Луки чуть выше середины полосы
    const spriteY = roadY + roadHeight * 0.4; // 40% от высоты (чуть выше середины)
    this.laneSprites.forEach((sprite, index) => {
      // Индекс полосы: index + 1 (пропускаем первую полосу)
      const laneIndex = index + 1;
      const spriteX =
        roadStartX + laneIndex * this.laneWidth + this.laneWidth * 0.5;

      // Позиционируем основной спрайт
      sprite.x = spriteX;
      sprite.y = spriteY;
      // Масштабируем лук под размер полосы (на 20% меньше)
      const baseScale = Math.min(
        (this.laneWidth * 0.8) / sprite.width,
        (roadHeight * 0.6) / sprite.height,
      );
      sprite.scale.set(baseScale * 0.8); // Уменьшаем на 20%
    });

    // Позиционируем декоративные элементы внизу каждой полосы (кроме первой и последней)
    // Используем уже объявленные переменные grateHeight и grateY
    this.roadDecorSprites.forEach((roadDecor, index) => {
      // Скрываем road_decor на первой и последней полосе
      if (index === 0 || index === totalLanes - 1) {
        roadDecor.visible = false;
        return;
      }
      roadDecor.visible = true;
      const laneX = roadStartX + (index + 0.5) * this.laneWidth;
      // road_decor должен быть внизу полосы, но выше whiteRect
      roadDecor.x = laneX;
      // Уменьшаем road_decor
      const decorScale = (this.chickenWidth * 0.6) / roadDecor.width;
      roadDecor.scale.set(decorScale, decorScale);
      // Позиционируем road_decor внизу полосы, но выше решетки
      roadDecor.y = grateY - roadDecor.height * decorScale * 0.3;
    });

    this.whiteRectSprites.forEach((whiteRect, index) => {
      // Скрываем whiteRect на первой полосе
      if (index === 0) {
        whiteRect.visible = false;
        return;
      }
      whiteRect.visible = true;
      const laneX = roadStartX + (index + 0.5) * this.laneWidth;
      // whiteRect шириной с курицу
      const rectScale = this.chickenWidth / whiteRect.width;
      whiteRect.scale.set(rectScale, rectScale);
      whiteRect.x = laneX;
      // Проверяем, стоит ли курица на этой полосе (index соответствует полосе)
      const isChickenOnLane = this.currentLaneIndex === index;
      // Если курица на полосе, whiteRect уезжает вниз
      const yOffset = isChickenOnLane ? 1 : 0;
      whiteRect.y = roadY + roadHeight + yOffset - 10;
    });

    // Позиционируем bottomRect поверх whiteRect и road_decor
    this.bottomRectSprites.forEach((bottomRect, index) => {
      const laneX = roadStartX + (index + 0.5) * this.laneWidth;
      // bottomRect должен быть поверх whiteRect и road_decor
      bottomRect.x = laneX;
      bottomRect.y = roadY + roadHeight;
      // Масштабируем bottomRect под ширину полосы
      const rectScale = this.laneWidth / bottomRect.width;
      bottomRect.scale.set(rectScale, rectScale);
    });

    // Позиционируем vase на последней полосе поверх whiteRect
    if (this.vaseSprite) {
      const lastLaneIndex = totalLanes - 1;
      const lastLaneX = roadStartX + (lastLaneIndex + 0.5) * this.laneWidth;
      this.vaseSprite.x = lastLaneX;
      // Уменьшаем vase относительно его исходного размера
      const vaseScale = (this.laneWidth * 0.5) / this.vaseSprite.width;
      this.vaseSprite.scale.set(vaseScale, vaseScale);
      this.vaseSprite.y = roadY + roadHeight - this.vaseSprite.height * 0.85;
    }

    // Применяем текущее смещение дороги
    this.roadContainer.x = this.roadOffset;

    // Ограничиваем смещение, если дорога уже помещается на экране
    if (this.roadWidth <= this.screenWidth) {
      this.roadOffset = 0;
      this.roadContainer.x = 0;
    } else {
      // Ограничиваем смещение границами
      const maxOffset = 0;
      const minOffset = this.screenWidth - this.roadWidth;
      this.roadOffset = Math.max(
        minOffset,
        Math.min(maxOffset, this.roadOffset),
      );
      this.roadContainer.x = this.roadOffset;
    }
  }

  /** Prepare the screen just before showing */
  public prepare() {}

  /** Update the screen */
  public update(ticker: Ticker) {
    if (this.paused) return;

    // Обновляем анимацию движения курицы
    if (this.isMoving && this.chickenSprite) {
      const deltaTime = ticker.deltaMS / 1000; // Время в секундах
      this.moveProgress += deltaTime / this.moveDuration;

      if (this.moveProgress >= 1) {
        // Анимация завершена
        this.moveProgress = 1;
        this.isMoving = false;
        this.chickenSprite.x = this.moveTargetX;

        // Обновляем позицию обоих спрайтов
        if (this.chickenIdleSprite && this.chickenGoSprite) {
          this.chickenIdleSprite.x = this.moveTargetX;
          this.chickenGoSprite.x = this.moveTargetX;
        }

        // Переключаемся обратно на анимацию покоя
        if (this.chickenIdleSprite && this.chickenGoSprite) {
          this.chickenGoSprite.visible = false;
          this.chickenGoSprite.stopAnimation();
          this.chickenIdleSprite.visible = true;
          this.chickenIdleSprite.startAnimation();
          this.chickenSprite = this.chickenIdleSprite;
        }
      } else {
        // Интерполируем позицию
        const easeProgress = this.easeInOut(this.moveProgress);
        const currentX =
          this.moveStartX + (this.moveTargetX - this.moveStartX) * easeProgress;
        this.chickenSprite.x = currentX;

        // Обновляем позицию обоих спрайтов
        if (this.chickenIdleSprite && this.chickenGoSprite) {
          this.chickenIdleSprite.x = currentX;
          this.chickenGoSprite.x = currentX;
        }

        // Запускаем анимацию whiteRect когда курица прошла половину пути
        if (this.moveProgress >= 0.5 && !this.whiteRectAnimating) {
          this.updateWhiteRectPositions();
        }
      }
    }

    // Анимация покачивания яйца
    if (this.lastLaneEggSprite && this.eggBaseY > 0) {
      const deltaTime = ticker.deltaMS / 1000;
      this.eggBobTime += deltaTime;
      // Плавное покачивание вверх-вниз с амплитудой 8 пикселей
      const bobOffset = Math.sin(this.eggBobTime * 2) * 8;
      this.lastLaneEggSprite.y = this.eggBaseY + bobOffset;
    }

    // Плавная анимация whiteRect (когда курица наступает)
    if (
      this.whiteRectAnimating &&
      this.whiteRectAnimIndex >= 0 &&
      this.whiteRectAnimIndex < this.whiteRectSprites.length
    ) {
      const whiteRect = this.whiteRectSprites[this.whiteRectAnimIndex];
      const targetY = this.whiteRectBaseY + 4; // Целевая позиция (смещение на 4 пикселя)
      const speed = 50; // Пикселей в секунду
      const deltaTime = ticker.deltaMS / 1000;

      if (whiteRect.y < targetY) {
        whiteRect.y = Math.min(whiteRect.y + speed * deltaTime, targetY);
      } else {
        // Анимация завершена
        whiteRect.y = targetY;
        this.whiteRectAnimating = false;
      }
    }
  }

  /**
   * Функция плавности easeInOut
   */
  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  /**
   * Прыжок курицы на следующую полосу
   */
  public jumpToNextLane() {
    if (this.isMoving) {
      return; // Уже движется
    }

    const totalLanes = this.getTotalLaneCount();
    // Если currentLaneIndex = -1, то курица на первой полосе (индекс 0)
    // При прыжке она должна перейти на вторую полосу (индекс 1)
    const currentLaneIndexForJump = Math.max(0, this.currentLaneIndex);
    const nextLaneIndex = currentLaneIndexForJump + 1;

    // Проверяем, не достигли ли мы последней полосы
    if (nextLaneIndex >= totalLanes) {
      return; // Уже на последней полосе
    }

    // Вычисляем позиции используя те же расчеты, что и в drawRoad
    const screenWidth = engine().screen.width;
    const roadStartX =
      this.roadWidth > screenWidth ? 0 : (screenWidth - this.roadWidth) * 0.5;

    // Вычисляем начальную и целевую позиции
    const startX =
      roadStartX + (currentLaneIndexForJump + 0.5) * this.laneWidth;
    const targetX = roadStartX + (nextLaneIndex + 0.5) * this.laneWidth;

    // Используем текущую позицию Y курицы
    const startY = this.chickenSprite.y; // Используем текущую Y, чтобы не смещать вниз

    // Переключаемся на анимацию движения
    if (this.chickenIdleSprite && this.chickenGoSprite) {
      // Устанавливаем правильную начальную позицию для спрайта движения
      this.chickenIdleSprite.visible = false;
      this.chickenIdleSprite.stopAnimation();
      this.chickenGoSprite.visible = true;
      this.chickenGoSprite.startAnimation();
      this.chickenGoSprite.x = startX;
      this.chickenGoSprite.y = startY; // Используем текущую Y
      this.chickenSprite = this.chickenGoSprite;
    }

    // Начинаем анимацию движения (только по X, Y остается неизменным)
    this.moveStartX = startX;
    this.moveTargetX = targetX;
    this.moveProgress = 0;
    this.isMoving = true;

    // Обновляем текущую полосу (если был -1, то становится 0, иначе увеличиваем)
    this.currentLaneIndex = nextLaneIndex;
  }

  /**
   * Запустить плавную анимацию whiteRect для текущей полосы
   */
  private updateWhiteRectPositions() {
    // Запускаем плавную анимацию только для текущей полосы
    if (
      this.currentLaneIndex >= 0 &&
      this.currentLaneIndex < this.whiteRectSprites.length
    ) {
      const whiteRect = this.whiteRectSprites[this.currentLaneIndex];
      this.whiteRectBaseY = whiteRect.y;
      this.whiteRectAnimIndex = this.currentLaneIndex;
      this.whiteRectAnimating = true;
    }
  }

  /** Pause gameplay - automatically fired when a popup is presented */
  public async pause() {
    this.gameAreaContainer.interactiveChildren = false;
    this.controlPanelContainer.interactiveChildren = false;
    this.paused = true;
    // Останавливаем анимацию курицы
    if (this.chickenIdleSprite) {
      this.chickenIdleSprite.stopAnimation();
    }
    if (this.chickenGoSprite) {
      this.chickenGoSprite.stopAnimation();
    }
  }

  /** Resume gameplay */
  public async resume() {
    this.gameAreaContainer.interactiveChildren = true;
    this.controlPanelContainer.interactiveChildren = true;
    this.paused = false;
    // Возобновляем анимацию курицы
    if (this.chickenSprite) {
      this.chickenSprite.startAnimation();
    }
  }

  /** Fully reset */
  public reset() {}

  /** Resize the screen, fired whenever window size changes */
  public resize(width: number, height: number) {
    // Верхняя панель
    const headerHeight = 120;
    this.headerContainer.y = 0;
    this.headerContainer.resize(width, headerHeight);

    // Игровая область
    this.gameAreaContainer.y = headerHeight;
    this.drawRoad(width, height - headerHeight - 200);

    // Нижняя панель управления
    const controlPanelHeight = 180;
    const controlPanelY = height - controlPanelHeight;
    this.controlPanelContainer.y = controlPanelY;
    this.controlPanelContainer.resize(width, controlPanelHeight);
  }

  /** Show screen with animations */
  public async show(): Promise<void> {
    engine().audio.bgm.play("main/sounds/bgm-main.mp3", { volume: 0.5 });

    const elementsToAnimate = [
      ...this.headerContainer.children,
      ...this.controlPanelContainer.children,
    ];

    let finalPromise!: AnimationPlaybackControls;
    for (const element of elementsToAnimate) {
      element.alpha = 0;
      finalPromise = animate(
        element,
        { alpha: 1 },
        { duration: 0.3, delay: 0.75, ease: "backOut" },
      );
    }

    await finalPromise;
  }

  /** Hide screen with animations */
  public async hide() {}

  /** Auto pause the app when window go out of focus */
  public blur() {
    if (!engine().navigation.currentPopup) {
      engine().navigation.presentPopup(PausePopup);
    }
  }
}
