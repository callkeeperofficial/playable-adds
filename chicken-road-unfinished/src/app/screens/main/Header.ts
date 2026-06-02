import { FancyButton } from "@pixi/ui";
import { Container, Graphics } from "pixi.js";

import { engine } from "../../getEngine";
import { PausePopup } from "../../popups/PausePopup";
import { Label } from "../../ui/Label";

/**
 * Верхняя панель экрана с заголовком, информацией и кнопками управления
 */
export class Header extends Container {
  private headerBg: Graphics;
  private titleLabel: Label;
  private liveDot: Graphics;
  private liveWinsLabel: Label;
  private onlineLabel: Label;
  private balanceLabel: Label;
  private infoButton: FancyButton;
  private fullscreenButton: FancyButton;
  private menuButton: FancyButton;

  constructor() {
    super();

    // Фон верхней панели (темный)
    this.headerBg = new Graphics();
    this.headerBg.rect(0, 0, 1, 1); // Будет изменено в resize
    this.headerBg.fill(0x1a1a2e);
    this.addChildAt(this.headerBg, 0);

    // Заголовок "CHICKEN ROAD"
    this.titleLabel = new Label({
      text: "CHICKEN ROAD",
      style: {
        fill: 0xffffff,
        fontSize: 48,
        fontFamily: "Arial Rounded MT Bold",
        fontWeight: "bold",
      },
    });
    this.titleLabel.anchor.set(0, 0.5);
    this.addChild(this.titleLabel);

    // Зеленая точка для Live wins
    this.liveDot = new Graphics();
    this.liveDot.circle(0, 0, 5);
    this.liveDot.fill(0x00ff00);
    this.addChild(this.liveDot);

    // Live wins
    this.liveWinsLabel = new Label({
      text: "Live wins",
      style: {
        fill: 0xffffff,
        fontSize: 16,
      },
    });
    this.liveWinsLabel.anchor.set(0, 0.5);
    this.addChild(this.liveWinsLabel);

    // Онлайн игроки
    this.onlineLabel = new Label({
      text: "Online: 3689",
      style: {
        fill: 0xffffff,
        fontSize: 16,
      },
    });
    this.onlineLabel.anchor.set(0, 0.5);
    this.addChild(this.onlineLabel);

    // Баланс
    this.balanceLabel = new Label({
      text: "999 320.24 $",
      style: {
        fill: 0xffffff,
        fontSize: 24,
        fontWeight: "bold",
      },
    });
    this.balanceLabel.anchor.set(1, 0.5);
    this.addChild(this.balanceLabel);

    // Кнопка информации
    const buttonAnimations = {
      hover: {
        props: { scale: { x: 1.1, y: 1.1 } },
        duration: 100,
      },
      pressed: {
        props: { scale: { x: 0.9, y: 0.9 } },
        duration: 100,
      },
    };

    this.infoButton = new FancyButton({
      defaultView: "icon-settings.png",
      anchor: 0.5,
      animations: buttonAnimations,
    });
    this.infoButton.onPress.connect(() => {
      // TODO: показать информацию о том, как играть
    });
    this.addChild(this.infoButton);

    // Кнопка полноэкранного режима
    this.fullscreenButton = new FancyButton({
      defaultView: "icon-settings.png",
      anchor: 0.5,
      animations: buttonAnimations,
    });
    this.fullscreenButton.onPress.connect(() => {
      // TODO: переключить полноэкранный режим
    });
    this.addChild(this.fullscreenButton);

    // Кнопка меню
    this.menuButton = new FancyButton({
      defaultView: "icon-pause.png",
      anchor: 0.5,
      animations: buttonAnimations,
    });
    this.menuButton.onPress.connect(() =>
      engine().navigation.presentPopup(PausePopup),
    );
    this.addChild(this.menuButton);
  }

  /**
   * Обновить размеры и позиции элементов верхней панели
   */
  public resize(width: number, height: number) {
    const headerHeight = height;

    // Обновляем фон верхней панели
    this.headerBg.clear();
    this.headerBg.rect(0, 0, width, headerHeight);
    this.headerBg.fill(0x1a1a2e);

    // Позиционируем элементы
    this.titleLabel.x = 30;
    this.titleLabel.y = 30;

    this.liveDot.x = 30;
    this.liveDot.y = 60;

    this.liveWinsLabel.x = 50;
    this.liveWinsLabel.y = 60;

    this.onlineLabel.x = 30;
    this.onlineLabel.y = 85;

    this.balanceLabel.x = width - 30;
    this.balanceLabel.y = 50;

    this.infoButton.x = width - 200;
    this.infoButton.y = 50;

    this.fullscreenButton.x = width - 150;
    this.fullscreenButton.y = 50;

    this.menuButton.x = width - 50;
    this.menuButton.y = 50;
  }

  /**
   * Обновить текст баланса
   */
  public setBalance(balance: string) {
    this.balanceLabel.text = balance;
  }

  /**
   * Обновить количество онлайн игроков
   */
  public setOnlineCount(count: number) {
    this.onlineLabel.text = `Online: ${count}`;
  }

  /**
   * Обновить текст Live wins
   */
  public setLiveWins(text: string) {
    this.liveWinsLabel.text = text;
  }
}
