import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { access, copyFile, mkdir, unlink } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, extname, resolve } from 'node:path';
import { once } from 'node:events';
import { pathToFileURL } from 'node:url';

const [html, requestedOutput, requestedFrames] = process.argv.slice(2);
const requestedCount = requestedFrames === undefined ? undefined : Number(requestedFrames);
const fps = 30;
assert(html && requestedOutput && (requestedCount === undefined ||
  Number.isInteger(requestedCount) && requestedCount >= 3 && requestedCount <= 900),
  'Uso: node exportar-rebotes.mjs rebotes.html archivo.mp4 [fotogramas de 3 a 900]');
assert.equal(extname(requestedOutput).toLowerCase(), '.mp4', 'La extensión de salida debe ser .mp4.');

const input = resolve(html);
const output = resolve(requestedOutput);
await access(input);
await mkdir(dirname(output), { recursive: true });
try {
  await access(output);
  throw new Error(`Ya existe el archivo de salida: ${output}`);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const executable = process.env.AUDIOVISUAL_FFMPEG || 'ffmpeg';
const probe = spawnSync(executable, ['-hide_banner', '-encoders'], { encoding: 'utf8', timeout: 10_000 });
assert(!probe.error && probe.status === 0 && /\blibx264\b/.test(probe.stdout),
  'Se necesita FFmpeg local con libx264. Indica su ruta mediante AUDIOVISUAL_FFMPEG.');

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.AUDIOVISUAL_PLAYWRIGHT || 'playwright');
const browser = await chromium.launch({
  executablePath: process.env.AUDIOVISUAL_CHROMIUM || undefined,
  args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  headless: true,
});
const staged = `${output}.${randomUUID()}.mp4`;
let encoder;
let completion;

try {
  const context = await browser.newContext({ offline: true, viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  const pageErrors = [];
  const network = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('request', (request) => {
    if (/^https?:/i.test(request.url())) network.push(request.url());
  });
  const target = pathToFileURL(input);
  target.search = 'captura=1&vista=three&fisica=rapier&animacion=1&brillo=1&filtros=1';
  await page.goto(target.href);
  await page.waitForFunction(() => window.movimiento?.getState().ready, undefined, { timeout: 30_000 });
  const duration = await page.evaluate(() => window.movimiento.getState().duration);
  const frames = requestedCount ?? Math.round(duration * fps);
  assert(Number.isInteger(frames) && frames >= 3 && frames <= 900, 'La duración de la escena no es válida.');

  async function capture(frame) {
    await page.evaluate(({ frame, fps }) => window.movimiento.renderFrame(frame, fps), { frame, fps });
    return page.locator('#escena').screenshot();
  }

  const sample = Math.floor(frames / 2);
  const fingerprint = (buffer) => createHash('sha256').update(buffer).digest('hex');
  const first = fingerprint(await capture(sample));
  const end = fingerprint(await capture(frames - 1));
  const start = fingerprint(await capture(0));
  assert.notEqual(start, end, 'La captura entre inicio y final no muestra movimiento.');
  assert.equal(fingerprint(await capture(sample)), first,
    'El mismo fotograma cambió al dibujarlo después de otros fotogramas.');
  const state = await page.evaluate(() => window.movimiento.getState());
  assert.equal(state.physics, 'rapier', 'La prueba requiere Rapier activo.');
  assert.equal(state.view, 'three', 'La prueba requiere Three.js activo.');
  assert(state.effects && state.post && state.filters, 'La prueba requiere PixiJS, Postprocessing y Pixi Filters activos.');
  assert(state.layers.includes('animation'), 'La prueba requiere Anime.js activo.');

  encoder = spawn(executable, [
    '-hide_banner', '-loglevel', 'error', '-n', '-framerate', `${fps}`, '-f', 'image2pipe',
    '-vcodec', 'png', '-i', 'pipe:0', '-an', '-c:v', 'libx264', '-preset', 'fast',
    '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', staged,
  ], { stdio: ['pipe', 'ignore', 'pipe'], windowsHide: true });
  let errors = '';
  encoder.stderr.setEncoding('utf8').on('data', (chunk) => { errors += chunk; });
  encoder.stdin.on('error', () => {});
  completion = once(encoder, 'close');
  completion.catch(() => {});

  for (let frame = 0; frame < frames; frame += 1) {
    const png = await capture(frame);
    await new Promise((resolveWrite, rejectWrite) => {
      encoder.stdin.write(png, (error) => error ? rejectWrite(error) : resolveWrite());
    });
  }

  encoder.stdin.end();
  const [status] = await completion;
  assert.equal(status, 0, `FFmpeg devolvió ${status}. ${errors}`);
  const decode = spawnSync(executable, [
    '-hide_banner', '-xerror', '-i', staged, '-map', '0:v:0', '-f', 'null', '-',
  ], { encoding: 'utf8', timeout: 120_000 });
  assert(!decode.error && decode.status === 0, decode.stderr || 'Falló la comprobación de decodificación.');
  assert.match(decode.stderr, /Video:\s*h264[^\r\n]*1280x720/i, 'El video no tiene las características esperadas.');
  assert.equal(Number([...decode.stderr.matchAll(/frame=\s*(\d+)/g)].at(-1)?.[1]), frames,
    'El número de fotogramas decodificados difiere del solicitado.');
  assert.deepEqual(pageErrors, [], 'El navegador registró errores al dibujar la escena.');
  assert.deepEqual(network, [], 'El proyecto intentó acceder a servicios externos.');
  await copyFile(staged, output, constants.COPYFILE_EXCL);
  console.log(JSON.stringify({ output, fps, frames, video: 'H.264 1280 × 720', duration: frames / fps,
    sameFrameSha256: first, physics: state.physics, render: state.view, layers: state.layers,
    outsideRequests: network.length, pageErrors: pageErrors.length }, null, 2));
} finally {
  if (encoder && encoder.exitCode === null && encoder.signalCode === null) {
    encoder.kill();
    await completion?.catch(() => {});
  }
  await browser.close();
  await unlink(staged).catch((error) => { if (error.code !== 'ENOENT') throw error; });
}
