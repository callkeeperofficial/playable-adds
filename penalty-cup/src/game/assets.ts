import { Assets, type Texture } from 'pixi.js';
import '@esotericsoftware/spine-pixi-v8';
import { WIN_BACKGROUND_FILES } from './winConfig';

const base = `${import.meta.env.BASE_URL}assets/`;
const spineNames = [
  'background',
  'gates',
  'goalkeeper',
  'ball',
  'bigwin',
  'bigwin_text',
  'megawin',
  'megawin_text',
  'epicwin',
  'epicwin_text',
  'legendarywin',
  'legendarywin_text',
  'confetti',
] as const;

export const urls = {
  logo: `${base}ui/mobile/penalty-cup-logo.png`,
  rouletteWheel: `${base}ui/roulette/rouletteWheel.c208d970.png`,
  rouletteArrow: `${base}ui/roulette/rouletteWheelArrow.946f3d05.png`,
  sliderBall: `${base}ui/roulette/sliderball.png`,
  bonusCards: {
    easy: `${base}ui/bonus/bonusbuyBronzeMobile.b369f44a.png`,
    medium: `${base}ui/bonus/bonusbuySilverMobile.3ace4b37.png`,
    hard: `${base}ui/bonus/bonusbuyGoldMobile.fc35bf64.png`,
  },
  winBackgrounds: {
    big: `${base}win/${WIN_BACKGROUND_FILES.big}`,
    mega: `${base}win/${WIN_BACKGROUND_FILES.mega}`,
    epic: `${base}win/${WIN_BACKGROUND_FILES.epic}`,
    legendary: `${base}win/${WIN_BACKGROUND_FILES.legendary}`,
  },
  winBackground: `${base}win/${WIN_BACKGROUND_FILES.legendary}`,
  nationSheet: `${base}flags/worldCupNations.svg`,
};

export async function loadAssets(): Promise<void> {
  for (const name of spineNames) {
    Assets.add({ alias: `${name}Data`, src: `${base}spine/${name}/${name}.json` });
    Assets.add({ alias: `${name}Atlas`, src: `${base}spine/${name}/${name}.atlas` });
  }
  await Assets.load([
    ...spineNames.flatMap((name) => [`${name}Data`, `${name}Atlas`]),
    urls.logo,
    urls.rouletteWheel,
    urls.rouletteArrow,
    urls.sliderBall,
    ...Object.values(urls.bonusCards),
    ...Object.values(urls.winBackgrounds),
    urls.nationSheet,
  ]);
}

export function texture(url: string): Texture {
  return Assets.get(url);
}
