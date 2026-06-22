import { urls } from '../game/assets';

export const COUNTRIES = [
  'Brazil', 'Argentina', 'France', 'Germany', 'Denmark', 'Spain', 'Portugal', 'Mexico', 'Netherlands', 'United States',
  'Belgium', 'Uruguay', 'Croatia', 'Colombia', 'Morocco', 'Japan', 'South Korea', 'Senegal', 'Sweden', 'Australia',
  'Saudi Arabia', 'United Arab Emirates', 'Turkey', 'Ghana', 'Tunisia', 'Ecuador', 'Ivory Coast', 'South Africa', 'Austria', 'Switzerland',
  'Bahrain', 'India', 'Iran', 'Scotland', 'Norway', 'Canada', 'Algeria', 'Czech Republic', 'Kosovo', 'DR Congo',
  'Cuba', 'Uzbekistan', 'Cape Verde', 'Panama', 'Iraq', 'Guatemala', 'New Zealand', 'Samoa',
] as const;

export const FLAG_COUNT = COUNTRIES.length;
const FLAG_WIDTH = 42;
const FLAG_HEIGHT = 50;

export function flagStyle(index: number): string {
  const safeIndex = Math.max(0, Math.min(FLAG_COUNT - 1, index));
  const column = safeIndex % 10;
  const row = Math.floor(safeIndex / 10);
  return [
    `background-image:url('${urls.nationSheet}')`,
    'background-size:420px 250px',
    `background-position:${-column * FLAG_WIDTH}px ${-row * FLAG_HEIGHT}px`,
  ].join(';');
}
