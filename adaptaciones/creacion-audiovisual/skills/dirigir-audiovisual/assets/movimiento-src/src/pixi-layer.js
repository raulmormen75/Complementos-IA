import 'pixi.js/unsafe-eval';
import {Application, Graphics, Rectangle} from 'pixi.js';
import {PixelateFilter} from 'pixi-filters/pixelate';
import {RGBSplitFilter} from 'pixi-filters/rgb-split';

export async function createPixiLayer(canvas, {filters = true} = {}) {
  const app = new Application();
  await app.init({
    canvas, width: canvas.width, height: canvas.height, resolution: 1,
    preference: 'webgl', preferWebGLVersion: 2, backgroundAlpha: 0,
    antialias: true, autoStart: false, sharedTicker: false, preserveDrawingBuffer: true,
  });
  app.stop();

  const effect = new Graphics();
  app.stage.addChild(effect);
  const filterArea = new Rectangle(0, 0, canvas.width, canvas.height);
  effect.filterArea = filterArea;
  const pixel = filters ? new PixelateFilter({size: 4}) : null;
  const rgb = filters ? new RGBSplitFilter({red: [-3, -1], green: [0, 0], blue: [3, 1]}) : null;

  return {
    engines: {pixi: 'PixiJS', filters: Boolean(pixel)},
    resize(width, height) {
      app.renderer.resize(width, height, 1);
      filterArea.width = width;
      filterArea.height = height;
    },
    render(frame, {pose, filters: useFilters = true, intensity = 1, anchor, phase} = {}) {
      const {width, height} = app.screen;
      const flash = Math.min(1, Math.max(0, pose?.flash ?? 0));
      const gain = Math.min(2, Math.max(0, intensity));
      const alpha = Math.min(1, (0.51 + flash * 0.34) * gain);
      const beat = Number.isFinite(phase)
        ? Math.min(1, Math.max(0, phase))
        : (Math.floor(frame) % 45 + 45) % 45 / 45;
      const radius = Math.min(width, height) * (0.07 + 0.17 * beat);
      const x = width * (anchor?.x ?? (0.58 + 0.05 * (pose?.elastic ?? 0)));
      const y = height * (anchor?.y ?? 0.57);
      const unit = Math.max(1, Math.min(width, height) / 360);
      effect.clear();
      effect.circle(x, y, radius).stroke({color: '#a4edff', width: 2.2 * unit, alpha: alpha * (1 - beat)});
      effect.circle(x, y, radius * 0.7).stroke({color: '#ffd58b', width: unit, alpha: alpha * 0.64 * (1 - beat)});
      for (let index = 0; index < 12; index += 1) {
        const angle = index * Math.PI / 6 + beat * 0.35;
        const distance = radius * (1.06 + (index % 3) * 0.11);
        const particleX = x + Math.cos(angle) * distance;
        const particleY = y + Math.sin(angle) * distance * 0.58;
        const size = (3 + index % 3 + flash * 2) * unit;
        effect.rect(particleX, particleY, size, size)
          .fill({color: index % 3 ? '#6ce7ff' : '#ffbd65', alpha: alpha * (1 - beat * 0.74)});
      }
      if (pixel && useFilters) {
        pixel.size = Math.round((4 + flash * 5) * unit);
        const offset = (3 + flash * 4) * unit;
        rgb.red = [-offset, -unit];
        rgb.blue = [offset, unit];
        effect.filters = [pixel, rgb];
      } else {
        effect.filters = null;
      }
      app.render();
      return {filters: Boolean(pixel && useFilters), alpha};
    },
    dispose() {
      pixel?.destroy();
      rgb?.destroy();
      app.destroy({removeView: false}, {children: true});
    },
  };
}
