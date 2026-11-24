import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {bakePhysics} from './src/physics.js';

const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const require = createRequire(import.meta.url);
const {chromium} = require(process.env.CODEX_QA_PLAYWRIGHT || 'playwright');

const bundles = ['physics', 'three-scene', 'animation', 'pixi-layer'];
const inline = await Promise.all(bundles.map(async (bundle) =>
  `<script>${await readFile(new URL(`./dist/${bundle}.js`, import.meta.url), 'utf8')}</script>`));
const config = {fps: 60, frames: 361, height: 3.4, radius: 0.37, restitution: 0.71};
const expected = await bakePhysics(config);
const cube = await bakePhysics({...config, shape: 'cubo'});
assert.ok(expected.frames.filter(({impact}) => impact).length > 2, 'La esfera debe registrar varios impactos');
assert.ok(cube.frames.filter(({impact}) => impact).length > 2, 'El cubo debe registrar varios impactos');
assert.notDeepEqual(cube.frames[60], expected.frames[60]);
assert.deepEqual(await bakePhysics(config), expected);
await assert.rejects(bakePhysics({...config, restitution: -0.1}), RangeError);
const browser = await chromium.launch({
  executablePath: process.env.CODEX_QA_EDGE || edge,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({
      offline: true, isMobile: mobile, hasTouch: mobile, viewport: {width: mobile ? 390 : 1024, height: 640},
    });
    const page = await context.newPage();
    const requests = [];
    const errors = [];
    page.on('request', (request) => { if (/^https?:/u.test(request.url())) requests.push(request.url()); });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setContent(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'wasm-unsafe-eval'">
      <canvas id="stage" width="360" height="200"></canvas><canvas id="overlay" width="360" height="200"></canvas>
      ${inline.join('\n')}`);
    const result = await page.evaluate(async ({config, target}) => {
      const {bakePhysics, createThreeScene, createMotionTimeline, createPixiLayer} = globalThis.MovimientoRuntime;
      const scene = createThreeScene(document.querySelector('#stage'), {radius: config.radius});
      const pixi = await createPixiLayer(document.querySelector('#overlay'));
      const timeline = createMotionTimeline(undefined, {durationMs: 6000});

      function canvasSignature(selector) {
        const src = document.querySelector(selector);
        const dst = Object.assign(document.createElement('canvas'), {width: src.width, height: src.height});
        const ctx = dst.getContext('2d');
        ctx.drawImage(src, 0, 0);
        const {data} = ctx.getImageData(0, 0, src.width, src.height);
        let checksum = 2166136261;
        let visible = 0;
        for (let offset = 0; offset < data.length; offset += 1) {
          checksum = Math.imul(checksum ^ data[offset], 16777619);
          if (offset % 4 === 3 && data[offset] > 1) visible += 1;
        }
        return {checksum, visible};
      }

      const physics = await bakePhysics(config);
      const seek = (frame) => ({...timeline.seek(frame / config.fps * 1000)});
      const pose = seek(target);
      const initial = seek(0);
      const threePose = scene.render(target, {physics, pose, bloom: false});
      const rawThree = canvasSignature('#stage');
      scene.render(target, {physics, pose, bloom: true});
      const bloomThree = canvasSignature('#stage');
      scene.render(160, {physics, pose: seek(160), bloom: true});
      scene.render(target, {physics, pose: seek(target), bloom: true});
      const repeatedThree = canvasSignature('#stage');
      scene.render(target, {physics, pose, bloom: false});
      const restoredThree = canvasSignature('#stage');

      const anchor = scene.project({...physics.frames[target].position, y: 0});
      pixi.render(target, {pose, filters: false, anchor, phase: 0.23});
      const rawPixi = canvasSignature('#overlay');
      const filtered = pixi.render(target, {pose, filters: true, anchor, phase: 0.23});
      const filteredPixi = canvasSignature('#overlay');
      pixi.render(160, {pose: seek(160), filters: true});
      pixi.render(target, {pose: seek(target), filters: true, anchor, phase: 0.23});
      const repeatedPixi = canvasSignature('#overlay');
      scene.render(target, {physics, pose, bloom: true});
      return {
        physics, pose, initial, seekAgain: seek(target), threePose,
        rawThree, bloomThree, repeatedThree, restoredThree,
        rawPixi, filteredPixi, repeatedPixi, filtered, anchor,
        threeEngines: scene.engines, pixiEngines: pixi.engines,
      };
    }, {config, target: 65});
    assert.deepEqual(result.physics, expected);
    assert.notDeepEqual(result.pose, result.initial);
    assert.deepEqual(result.pose, result.seekAgain);
    assert.equal(result.threePose.x, expected.frames[65].position.x);
    assert.equal(result.threeEngines.postprocessing, true);
    assert.equal(result.rawThree.visible, 360 * 200);
    assert.notEqual(result.rawThree.checksum, result.bloomThree.checksum);
    assert.deepEqual(result.bloomThree, result.repeatedThree);
    assert.deepEqual(result.rawThree, result.restoredThree);
    assert.equal(result.pixiEngines.filters, true);
    assert.ok(result.anchor.x > 0 && result.anchor.x < 1 && result.anchor.y > 0 && result.anchor.y < 1);
    assert.ok(result.rawPixi.visible > 100 && result.rawPixi.visible < 360 * 200 / 2);
    assert.equal(result.filtered.filters, true);
    assert.notEqual(result.rawPixi.checksum, result.filteredPixi.checksum);
    assert.deepEqual(result.filteredPixi, result.repeatedPixi);
    assert.deepEqual(requests, []);
    assert.deepEqual(errors, []);
    await page.screenshot({path: fileURLToPath(new URL(`./dist/revision-${mobile ? 'movil' : 'escritorio'}.png`, import.meta.url))});
    await context.close();
    console.log(`PASS ${mobile ? 'móvil simulado' : 'escritorio'}: cinco bibliotecas y Three. Rapier coincide con Node; efectos visibles y fotogramas reproducibles, sin red.`);
  }
} finally {
  await browser.close();
}
