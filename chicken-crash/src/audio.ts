import { assetUrl } from './publicPath';

type Sound = 'car' | 'cashout' | 'chick' | 'jump' | 'lose' | 'win';

const buffers = new Map<Sound, Promise<AudioBuffer>>();
let audioContext: AudioContext | undefined;

function getAudioContext() {
  if (audioContext) return audioContext;
  const AudioContextConstructor = window.AudioContext
    ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) return undefined;
  audioContext = new AudioContextConstructor();
  return audioContext;
}

function loadSound(sound: Sound) {
  const cached = buffers.get(sound);
  if (cached) return cached;
  const context = getAudioContext();
  if (!context) return Promise.reject(new Error('Web Audio is not available'));
  const request = fetch(assetUrl(`audio/${sound}.webm`), { cache: 'force-cache' })
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to load sound: ${sound}`);
      return response.arrayBuffer();
    })
    .then((data) => context.decodeAudioData(data));
  buffers.set(sound, request);
  return request;
}

export function playSound(sound: Sound) {
  const context = getAudioContext();
  if (!context) return;
  const resume = context.state === 'suspended' ? context.resume().catch(() => undefined) : Promise.resolve();
  void Promise.all([resume, loadSound(sound)])
    .then(([, buffer]) => {
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.start();
    })
    .catch(() => undefined);
}
