type Sound = 'plane' | 'cashout' | 'chick' | 'jump' | 'lose' | 'win';

const SPRITE_SOUNDS: Partial<Record<Sound, { start: number; duration: number }>> = {
  jump: { start: 1, duration: 1 },
  plane: { start: 21, duration: 1 },
  lose: { start: 22, duration: 2 },
};

const players = new Map<Sound, HTMLAudioElement[]>();
let audioContext: AudioContext | undefined;
let spriteBuffer: AudioBuffer | undefined;
let spriteBufferPromise: Promise<AudioBuffer> | undefined;

const createPlayer = (sound: Sound) => {
  const player = new Audio(`${import.meta.env.BASE_URL}assets/audio/${sound}.webm`);
  player.preload = 'auto';
  return player;
};

const getAudioContext = () => {
  audioContext ??= new AudioContext();
  return audioContext;
};

export function unlockAudio() {
  const context = getAudioContext();
  if (context.state === 'suspended') void context.resume().catch(() => undefined);
  void loadSpriteBuffer();
}

const loadSpriteBuffer = () => {
  if (spriteBuffer) return Promise.resolve(spriteBuffer);
  spriteBufferPromise ??= fetch(`${import.meta.env.BASE_URL}assets/audio/pilot-chicken-sound.mp3`)
    .then((response) => response.arrayBuffer())
    .then((data) => getAudioContext().decodeAudioData(data))
    .then((buffer) => {
      spriteBuffer = buffer;
      return buffer;
    });
  return spriteBufferPromise;
};

function playSpriteSound(sound: Sound, sprite: { start: number; duration: number }) {
  void loadSpriteBuffer().then((buffer) => {
    const context = getAudioContext();
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    const play = () => source.start(0, sprite.start, sprite.duration);
    if (context.state === 'suspended') void context.resume().then(play).catch(() => undefined);
    else play();
  }).catch(() => undefined);
}

export function playSound(sound: Sound) {
  const sprite = SPRITE_SOUNDS[sound];
  if (sprite) {
    playSpriteSound(sound, sprite);
    return;
  }

  let pool = players.get(sound);
  if (!pool) {
    pool = [createPlayer(sound), createPlayer(sound), createPlayer(sound)];
    players.set(sound, pool);
  }
  const player = pool.find((candidate) => candidate.paused) ?? pool[0];
  player.currentTime = 0;
  void player.play().catch(() => undefined);
}
