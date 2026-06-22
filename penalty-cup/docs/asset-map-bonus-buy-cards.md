# Asset Map: Bonus Buy Cards

## Files

```text
source/ui/bonus_buy_cards/bonusbuyBronzeDesktop.65bbd194.png
source/ui/bonus_buy_cards/bonusbuyBronzeMobile.b369f44a.png
source/ui/bonus_buy_cards/bonusbuySilverDesktop.6df21a04.png
source/ui/bonus_buy_cards/bonusbuySilverMobile.3ace4b37.png
source/ui/bonus_buy_cards/bonusbuyGoldDesktop.4dfeefd1.png
source/ui/bonus_buy_cards/bonusbuyGoldMobile.fc35bf64.png
```

## Asset Type

These are regular PNG UI assets.

They are not Spine assets.

Use them as normal PixiJS textures / sprites.

## Metadata

```json
{
  "bonusbuyBronzeDesktop.65bbd194.png": {
    "format": "PNG",
    "width": 690,
    "height": 1020,
    "mode": "P"
  },
  "bonusbuyBronzeMobile.b369f44a.png": {
    "format": "PNG",
    "width": 960,
    "height": 315,
    "mode": "P"
  },
  "bonusbuyGoldDesktop.4dfeefd1.png": {
    "format": "PNG",
    "width": 690,
    "height": 1020,
    "mode": "P"
  },
  "bonusbuyGoldMobile.fc35bf64.png": {
    "format": "PNG",
    "width": 960,
    "height": 315,
    "mode": "P"
  },
  "bonusbuySilverDesktop.6df21a04.png": {
    "format": "PNG",
    "width": 690,
    "height": 1020,
    "mode": "P"
  },
  "bonusbuySilverMobile.3ace4b37.png": {
    "format": "PNG",
    "width": 960,
    "height": 315,
    "mode": "P"
  }
}
```

## Meaning

These are background/card images for the `Buy Bonus` overlay.

There are three bonus tiers:

```text
Bronze
Silver
Gold
```

Each tier has two layouts:

```text
Desktop card
Mobile card
```

The mobile versions are wide horizontal cards. The desktop versions are tall vertical cards.

## Visual Mapping

### Bronze

```text
bonusbuyBronzeDesktop.65bbd194.png
bonusbuyBronzeMobile.b369f44a.png
```

Visual:

- bronze/brown card;
- blue-shirt player portrait;
- 2 active lightning icons;
- lower power/risk tier.

Likely maps to:

```text
Easy
```

### Silver

```text
bonusbuySilverDesktop.6df21a04.png
bonusbuySilverMobile.3ace4b37.png
```

Visual:

- silver/gray card;
- yellow-shirt player portrait;
- 4 active lightning icons + 1 inactive;
- medium/high tier.

Likely maps to:

```text
Medium
```

### Gold

```text
bonusbuyGoldDesktop.4dfeefd1.png
bonusbuyGoldMobile.fc35bf64.png
```

Visual:

- gold/yellow card;
- red-shirt player portrait;
- 5 active lightning icons;
- highest power/risk tier.

Likely maps to:

```text
Hard
```

## Recommended Difficulty Mapping

```ts
const BONUS_CARD_BY_DIFFICULTY = {
  easy: {
    tier: "bronze",
    desktop: "bonusbuyBronzeDesktop.65bbd194.png",
    mobile: "bonusbuyBronzeMobile.b369f44a.png",
  },
  medium: {
    tier: "silver",
    desktop: "bonusbuySilverDesktop.6df21a04.png",
    mobile: "bonusbuySilverMobile.3ace4b37.png",
  },
  hard: {
    tier: "gold",
    desktop: "bonusbuyGoldDesktop.4dfeefd1.png",
    mobile: "bonusbuyGoldMobile.fc35bf64.png",
  },
};
```

This mapping matches the visual intensity:
- Bronze = lowest risk/reward;
- Silver = middle risk/reward;
- Gold = highest risk/reward.

## Mobile Buy Bonus Overlay

On mobile, use the `Mobile` versions.

Layout:

```text
BUY BONUS:

[Bronze/Easy mobile card]
[MAX WIN / price / label overlay]

[Silver/Medium mobile card]
[MAX WIN / price / label overlay]

[Gold/Hard mobile card]
[MAX WIN / price / label overlay]

A MISS DOES NOT WASTE THE WINNINGS

< BET $200 >
```

The card image itself is only a background art shell. Add text/buttons over it in PixiJS.

## Desktop Buy Bonus Overlay

On desktop, use the `Desktop` versions in a horizontal row:

```text
[Bronze] [Silver] [Gold]
```

But playable priority is mobile, so mobile cards are primary.

## Text Overlay

The images have empty lower panels. Codex should place dynamic UI text over them:

```text
EASY / MEDIUM / HARD
MAX WIN 100.64x / 1812.54x / 6298.56x
$6 000 / $12 000 / $20 000
```

Do not bake these texts into the image.

## Bonus Config Connection

Existing bonus config:

```ts
const BONUS_CONFIG = {
  easy: {
    priceMultiplier: 30,
    maxWinMultiplier: 100.64,
    shotRange: [12, 15],
  },
  medium: {
    priceMultiplier: 60,
    maxWinMultiplier: 1812.54,
    shotRange: [12, 15],
  },
  hard: {
    priceMultiplier: 100,
    maxWinMultiplier: 6298.56,
    shotRange: [12, 15],
  },
};
```

Suggested card mapping:

```text
easy   → bronze card
medium → silver card
hard   → gold card
```

## Interaction

Each card is clickable/tappable.

On tap:

```text
select bonus difficulty
calculate price = bet × priceMultiplier
if balance >= price:
  buy bonus
  open roulette
else:
  show error/toast
```

## Not Spine

Do not load through Spine runtime.

Use `Assets.load()` / `Texture.from()` and regular `Sprite`.
