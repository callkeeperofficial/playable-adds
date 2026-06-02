import { FancyButton } from "@pixi/ui";
import { Container, Graphics } from "pixi.js";

import { Button } from "../../ui/Button";
import { Label } from "../../ui/Label";

/**
 * Нижняя панель управления с кнопками ставок, сложности и Play
 */
export class ControlPanel extends Container {
  private panelBg: Graphics;
  private betInputLabel: Label;
  private minButton: Button;
  private maxButton: Button;
  private betButtons: Button[] = [];
  private difficultyButtons: Button[] = [];
  private playButton: Button;
  private shuffleButton: FancyButton;

  private currentBet = 0.6;
  private currentDifficulty = "Easy";

  // Колбэки для событий
  public onBetChange?: (bet: number) => void;
  public onDifficultyChange?: (difficulty: string) => void;
  public onPlay?: () => void;
  public onShuffle?: () => void;

  constructor() {
    super();

    // Фон нижней панели управления (темно-серый)
    this.panelBg = new Graphics();
    this.panelBg.rect(0, 0, 1, 1); // Будет изменено в resize
    this.panelBg.fill(0x2a2a3a);
    this.addChildAt(this.panelBg, 0);

    // Поле ввода ставки
    this.betInputLabel = new Label({
      text: "0.6",
      style: {
        fill: 0xffffff,
        fontSize: 32,
        fontWeight: "bold",
      },
    });
    this.betInputLabel.anchor.set(0.5);
    this.addChild(this.betInputLabel);

    // Кнопки MIN и MAX
    this.minButton = new Button({
      text: "MIN",
      width: 80,
      height: 50,
    });
    this.minButton.onPress.connect(() => {
      this.setBet(0.1);
    });
    this.addChild(this.minButton);

    this.maxButton = new Button({
      text: "MAX",
      width: 80,
      height: 50,
    });
    this.maxButton.onPress.connect(() => {
      this.setBet(1000);
    });
    this.addChild(this.maxButton);

    // Кнопки быстрых ставок
    const betAmounts = [0.5, 1, 2, 7];
    betAmounts.forEach((amount) => {
      const betButton = new Button({
        text: `${amount} $`,
        width: 100,
        height: 50,
      });
      betButton.onPress.connect(() => {
        this.setBet(amount);
      });
      this.betButtons.push(betButton);
      this.addChild(betButton);
    });

    // Кнопки сложности
    const difficulties = ["Easy", "Medium", "Hard", "Hardcore"];
    difficulties.forEach((difficulty) => {
      const diffButton = new Button({
        text: difficulty,
        width: 120,
        height: 50,
      });
      diffButton.onPress.connect(() => {
        this.setDifficulty(difficulty);
      });
      this.difficultyButtons.push(diffButton);
      this.addChild(diffButton);
    });

    // Кнопка перемешивания
    this.shuffleButton = new FancyButton({
      defaultView: "icon-settings.png",
      anchor: 0.5,
      animations: {
        hover: {
          props: { scale: { x: 1.1, y: 1.1 } },
          duration: 100,
        },
        pressed: {
          props: { scale: { x: 0.9, y: 0.9 } },
          duration: 100,
        },
      },
    });
    this.shuffleButton.width = 60;
    this.shuffleButton.height = 60;
    this.shuffleButton.onPress.connect(() => {
      if (this.onShuffle) {
        this.onShuffle();
      }
    });
    this.addChild(this.shuffleButton);

    // Кнопка Play
    this.playButton = new Button({
      text: "Play",
      width: 200,
      height: 80,
    });
    this.playButton.onPress.connect(() => {
      if (this.onPlay) {
        this.onPlay();
      }
    });
    this.addChild(this.playButton);

    this.updateDifficultyButtons();
  }

  /**
   * Установить ставку
   */
  public setBet(bet: number) {
    this.currentBet = bet;
    this.updateBetDisplay();
    if (this.onBetChange) {
      this.onBetChange(bet);
    }
  }

  /**
   * Получить текущую ставку
   */
  public getBet(): number {
    return this.currentBet;
  }

  /**
   * Установить сложность
   */
  public setDifficulty(difficulty: string) {
    this.currentDifficulty = difficulty;
    this.updateDifficultyButtons();
    if (this.onDifficultyChange) {
      this.onDifficultyChange(difficulty);
    }
  }

  /**
   * Получить текущую сложность
   */
  public getDifficulty(): string {
    return this.currentDifficulty;
  }

  private updateBetDisplay() {
    this.betInputLabel.text = this.currentBet.toFixed(1);
  }

  private updateDifficultyButtons() {
    this.difficultyButtons.forEach((btn, index) => {
      const difficulties = ["Easy", "Medium", "Hard", "Hardcore"];
      if (difficulties[index] === this.currentDifficulty) {
        btn.alpha = 1.0;
        btn.scale.set(1.05);
      } else {
        btn.alpha = 0.7;
        btn.scale.set(1.0);
      }
    });
  }

  /**
   * Обновить размеры и позиции элементов панели управления
   */
  public resize(width: number, height: number) {
    // Обновляем фон нижней панели
    this.panelBg.clear();
    this.panelBg.rect(0, 0, width, height);
    this.panelBg.fill(0x2a2a3a);

    // Позиционирование элементов панели управления
    const panelPadding = 30;
    let currentX = panelPadding;

    // Поле ввода ставки
    this.betInputLabel.x = currentX + 100;
    this.betInputLabel.y = 30;

    // Кнопки MIN/MAX
    this.minButton.x = currentX;
    this.minButton.y = 30;
    this.maxButton.x = currentX + 200;
    this.maxButton.y = 30;

    currentX += 300;

    // Кнопки быстрых ставок
    this.betButtons.forEach((btn, index) => {
      btn.x = currentX + index * 110;
      btn.y = 30;
    });

    currentX += this.betButtons.length * 110 + 50;

    // Кнопки сложности
    this.difficultyButtons.forEach((btn, index) => {
      btn.x = currentX + index * 130;
      btn.y = 30;
    });

    currentX += this.difficultyButtons.length * 130 + 50;

    // Кнопка перемешивания
    this.shuffleButton.x = currentX;
    this.shuffleButton.y = 30;

    // Кнопка Play справа
    this.playButton.x = width - panelPadding - 100;
    this.playButton.y = 30;
  }
}
