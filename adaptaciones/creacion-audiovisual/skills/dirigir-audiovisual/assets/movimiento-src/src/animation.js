import {createTimeline} from 'animejs';

export function createMotionTimeline(
  target = {elastic: 0, squash: 1, yaw: 0, flash: 0},
  {durationMs = 4000} = {},
) {
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    throw new RangeError('La duración de la animación debe ser positiva.');
  }

  const timeline = createTimeline({autoplay: false, defaults: {ease: 'linear'}});
  timeline
    .add(target, {
      elastic: [0, 1],
      squash: [1, 0.77],
      yaw: [0, 0.72],
      flash: [0, 1],
      duration: durationMs * 0.21,
      ease: 'inOutQuad',
    }, 0)
    .add(target, {
      elastic: 0,
      squash: 1,
      yaw: 0.03,
      flash: 0,
      duration: durationMs * 0.79,
      ease: 'outElastic(1, 0.45)',
    }, durationMs * 0.21);

  return {
    engines: {anime: 'Anime.js'},
    seek(ms) {
      if (!Number.isFinite(ms)) throw new TypeError('El tiempo de la animación debe ser un número.');
      timeline.seek(Math.min(durationMs, Math.max(0, ms)), true);
      return target;
    },
    dispose() {
      timeline.cancel();
    },
  };
}
