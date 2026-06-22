import { Spine } from '@esotericsoftware/spine-pixi-v8';
import { Container, Graphics, Sprite } from 'pixi.js';
import { texture, urls } from '../game/assets';
import { winScreenToTier, winTierConfig, type WinScreen } from '../game/winConfig';

export class WinOverlay extends Container {
  show(screen: WinScreen = 4): void {
    const tier = winScreenToTier(screen);
    const config = winTierConfig(screen);

    const shade = new Graphics().rect(0, 0, 390, 844).fill(0x07090a);
    const background = new Sprite(texture(urls.winBackgrounds[tier]));
    const coverScale = Math.max(390 / background.texture.width, 844 / background.texture.height);
    background.anchor.set(0.5);
    background.position.set(195, 422);
    background.scale.set(coverScale);
    this.addChild(shade, background);

    const text = Spine.from({ skeleton: config.textData, atlas: config.textAtlas });
    text.position.set(195, config.textY);
    text.scale.set(config.textScale);
    text.state.setAnimation(0, config.start, false);
    text.state.addAnimation(0, config.idle, true, 0);

    const stage = Spine.from({ skeleton: config.stageData, atlas: config.stageAtlas });
    stage.position.set(195, config.stageY);
    stage.scale.set(config.stageScale);
    if (tier === 'legendary') {
      stage.skeleton.findSlot('item_cup2')!.setAttachment(null);
      stage.skeleton.findSlot('item_boot2')!.setAttachment(null);
      stage.skeleton.findSlot('item_ball2')!.setAttachment(null);
    }
    stage.state.setAnimation(0, config.start, false);
    stage.state.addAnimation(0, config.idle, true, 0);

    this.addChild(text, stage);

    if (config.confetti) {
      const confetti = Spine.from({ skeleton: 'confettiData', atlas: 'confettiAtlas' });
      confetti.position.set(195, 80);
      confetti.scale.set(0.17);
      confetti.state.setAnimation(0, 'start', false);
      confetti.state.addAnimation(0, 'idle', true, 0);
      this.addChild(confetti);
    }
  }
}
