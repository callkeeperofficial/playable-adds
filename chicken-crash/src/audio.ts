type Sound = 'car' | 'cashout' | 'chick' | 'jump' | 'lose' | 'win';

const players = new Map<Sound, HTMLAudioElement[]>();

const createPlayer = (sound: Sound) => {
  const player = new Audio(`${import.meta.env.BASE_URL}assets/audio/${sound}.webm`);
  player.preload = 'auto';
  return player;
};

export function playSound(sound: Sound) {
  let pool = players.get(sound);
  if (!pool) {
    pool = [createPlayer(sound), createPlayer(sound), createPlayer(sound)];
    players.set(sound, pool);
  }
  const player = pool.find((candidate) => candidate.paused) ?? pool[0];
  player.currentTime = 0;
  void player.play().catch(() => undefined);
}
