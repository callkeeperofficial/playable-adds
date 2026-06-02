import { AnimatedSprite, Rectangle, Texture } from "pixi.js";

/**
 * Анимированная курица в состоянии покоя
 * Использует спрайт-лист chicken_idle.png с 24 кадрами
 */
export class ChickenIdle extends AnimatedSprite {
  // Данные спрайт-листа из JSON
  private static readonly SPRITE_SHEET_DATA = {
    frames: {
      chicken_idle_0: { frame: { x: 1, y: 1, w: 300, h: 300 } },
      chicken_idle_1: { frame: { x: 303, y: 1, w: 300, h: 300 } },
      chicken_idle_2: { frame: { x: 1, y: 907, w: 300, h: 300 } },
      chicken_idle_3: { frame: { x: 1209, y: 303, w: 300, h: 300 } },
      chicken_idle_4: { frame: { x: 1209, y: 605, w: 300, h: 300 } },
      chicken_idle_5: { frame: { x: 1209, y: 907, w: 300, h: 300 } },
      chicken_idle_6: { frame: { x: 1, y: 1209, w: 300, h: 300 } },
      chicken_idle_7: { frame: { x: 303, y: 1209, w: 300, h: 300 } },
      chicken_idle_8: { frame: { x: 605, y: 1209, w: 300, h: 300 } },
      chicken_idle_9: { frame: { x: 907, y: 1209, w: 300, h: 300 } },
      chicken_idle_10: { frame: { x: 605, y: 1, w: 300, h: 300 } },
      chicken_idle_11: { frame: { x: 907, y: 1, w: 300, h: 300 } },
      chicken_idle_12: { frame: { x: 1, y: 303, w: 300, h: 300 } },
      chicken_idle_13: { frame: { x: 303, y: 303, w: 300, h: 300 } },
      chicken_idle_14: { frame: { x: 605, y: 303, w: 300, h: 300 } },
      chicken_idle_15: { frame: { x: 907, y: 303, w: 300, h: 300 } },
      chicken_idle_16: { frame: { x: 1, y: 605, w: 300, h: 300 } },
      chicken_idle_17: { frame: { x: 303, y: 605, w: 300, h: 300 } },
      chicken_idle_18: { frame: { x: 605, y: 605, w: 300, h: 300 } },
      chicken_idle_19: { frame: { x: 907, y: 605, w: 300, h: 300 } },
      chicken_idle_20: { frame: { x: 303, y: 907, w: 300, h: 300 } },
      chicken_idle_21: { frame: { x: 605, y: 907, w: 300, h: 300 } },
      chicken_idle_22: { frame: { x: 907, y: 907, w: 300, h: 300 } },
      chicken_idle_23: { frame: { x: 1209, y: 1, w: 300, h: 300 } },
    },
  };

  constructor() {
    // Создаем текстуры для каждого кадра из спрайт-листа
    const baseTexture = Texture.from("chicken_idle.png");
    const textures: Texture[] = [];

    // Сначала создаем все текстуры для кадров 0-23
    const frameTextures: Texture[] = [];
    for (let frameIndex = 0; frameIndex < 24; frameIndex++) {
      const frameData =
        ChickenIdle.SPRITE_SHEET_DATA.frames[
          `chicken_idle_${frameIndex}` as keyof typeof ChickenIdle.SPRITE_SHEET_DATA.frames
        ];
      if (frameData) {
        const { x, y, w, h } = frameData.frame;
        const texture = new Texture({
          source: baseTexture.source,
          frame: new Rectangle(x, y, w, h),
        });
        frameTextures.push(texture);
      }
    }

    // Создаем порядок кадров: сначала обратный (23->0), потом прямой (0->23)
    // Обратный порядок: 23, 22, 21, ..., 1, 0
    for (let i = 23; i >= 0; i--) {
      textures.push(frameTextures[i]);
    }
    // Прямой порядок: 0, 1, 2, ..., 22, 23
    for (let i = 0; i < 24; i++) {
      textures.push(frameTextures[i]);
    }

    super(textures);

    // Настройки анимации
    this.anchor.set(0.5);
    this.animationSpeed = 0.5; // Скорость анимации (кадров в секунду)
    this.loop = true;
    // Масштабируем курицу (300x300 может быть слишком большим)
    this.scale.set(0.5); // Можно настроить под нужный размер
    this.play();
  }

  /**
   * Остановить анимацию
   */
  public stopAnimation() {
    this.stop();
  }

  /**
   * Запустить анимацию
   */
  public startAnimation() {
    this.play();
  }
}
