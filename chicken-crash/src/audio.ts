type Sound = 'car' | 'cashout' | 'chick' | 'jump' | 'lose' | 'win';

const players = new Map<Sound, HTMLAudioElement>();

export function playSound(sound: Sound) {
  let player = players.get(sound);
  if (!player) {
    player = new Audio(`${import.meta.env.BASE_URL}assets/audio/${sound}.webm`);
    players.set(sound, player);
  }
  player.currentTime = 0;
  void player.play().catch(() => undefined);
}
