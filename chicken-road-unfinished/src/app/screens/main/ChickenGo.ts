import { AnimatedSprite, Rectangle, Texture } from "pixi.js";

/**
 * Анимированная курица в состоянии движения/шага
 * Использует спрайт-лист chicken_go.png с 16 кадрами
 */
export class ChickenGo extends AnimatedSprite {
  // Данные спрайт-листа из JSON
  private static readonly SPRITE_SHEET_DATA = {
    frames: {
      chicken_go_0: { frame: { x: 1, y: 1, w: 300, h: 300 } },
      chicken_go_1: { frame: { x: 303, y: 1, w: 300, h: 300 } },
      chicken_go_2: { frame: { x: 1, y: 605, w: 300, h: 300 } },
      chicken_go_3: { frame: { x: 303, y: 605, w: 300, h: 300 } },
      chicken_go_4: { frame: { x: 605, y: 605, w: 300, h: 300 } },
      chicken_go_5: { frame: { x: 907, y: 605, w: 300, h: 300 } },
      chicken_go_6: { frame: { x: 1, y: 907, w: 300, h: 300 } },
      chicken_go_7: { frame: { x: 303, y: 907, w: 300, h: 300 } },
      chicken_go_8: { frame: { x: 605, y: 907, w: 300, h: 300 } },
      chicken_go_9: { frame: { x: 907, y: 907, w: 300, h: 300 } },
      chicken_go_10: { frame: { x: 605, y: 1, w: 300, h: 300 } },
      chicken_go_11: { frame: { x: 907, y: 1, w: 300, h: 300 } },
      chicken_go_12: { frame: { x: 1, y: 303, w: 300, h: 300 } },
      chicken_go_13: { frame: { x: 303, y: 303, w: 300, h: 300 } },
      chicken_go_14: { frame: { x: 605, y: 303, w: 300, h: 300 } },
      chicken_go_15: { frame: { x: 907, y: 303, w: 300, h: 300 } },
    },
  };

  constructor() {
    // Создаем текстуры для каждого кадра из спрайт-листа
    const baseTexture = Texture.from("chicken_go.png");
    const textures: Texture[] = [];

    // Создаем текстуры для всех 16 кадров в правильном порядке (0-15)
    for (let frameIndex = 0; frameIndex < 16; frameIndex++) {
      const frameData =
        ChickenGo.SPRITE_SHEET_DATA.frames[
          `chicken_go_${frameIndex}` as keyof typeof ChickenGo.SPRITE_SHEET_DATA.frames
        ];
      if (frameData) {
        const { x, y, w, h } = frameData.frame;
        const texture = new Texture({
          source: baseTexture.source,
          frame: new Rectangle(x, y, w, h),
        });
        textures.push(texture);
      }
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
