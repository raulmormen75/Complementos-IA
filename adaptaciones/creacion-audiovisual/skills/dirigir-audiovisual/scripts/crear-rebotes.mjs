import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const defaults = {
  title: 'Laboratorio de rebotes', source: 'Escenario didáctico de ejemplo',
  shape: 'esfera', radius: 0.35, height: 3.25, duration: 6,
  gravity: 9.81, restitution: 0.72,
  colors: { body: '#65d9ae', ground: '#182d38', background: '#0c1721' },
};

export function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function canonicalConfig(input = {}) {
  assert(input && typeof input === 'object' && !Array.isArray(input), 'La escena debe ser un objeto JSON.');
  for (const key of Object.keys(input)) assert(Object.hasOwn(defaults, key), `Campo de escena desconocido: ${key}`);
  const config = { ...defaults, ...input };
  const palette = config.colors;
  assert(palette && typeof palette === 'object' && !Array.isArray(palette), 'colors debe ser un objeto.');
  for (const [key, value] of Object.entries(palette)) {
    assert(Object.hasOwn(defaults.colors, key) && typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value),
      `Color desconocido o inválido: ${key}. Usa #rrggbb.`);
  }
  config.colors = { ...defaults.colors, ...palette };
  for (const field of ['title', 'source']) {
    assert(typeof config[field] === 'string' && config[field].trim() && config[field].length <= 160,
      `${field} debe tener entre 1 y 160 caracteres.`);
    config[field] = config[field].trim();
  }
  assert(['esfera', 'cubo'].includes(config.shape), 'shape debe ser esfera o cubo.');
  for (const [key, min, max] of [['radius', .1, 1], ['height', .1, 8], ['duration', 2, 12],
    ['gravity', 1, 20], ['restitution', 0, 1]]) {
    const value = config[key];
    assert(typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max,
      `${key} debe estar entre ${min} y ${max}.`);
  }
  assert(config.height > config.radius, 'height debe exceder el radio o semilado.');
  return config;
}

export const packJSON = (value) => JSON.stringify(value).replace(/[<\u2028\u2029]/g,
  (char) => ({ '<': '\\u003c', '\u2028': '\\u2028', '\u2029': '\\u2029' })[char]);

export async function loadConfig(path) {
  return canonicalConfig(JSON.parse((await readFile(path, 'utf8')).replace(/^\uFEFF/, '')));
}

async function main() {
  const [input, output, template, ...extra] = process.argv.slice(2);
  assert(input && output && !extra.length && /\.html?$/i.test(output),
    'Uso: node crear-rebotes.mjs config.json salida.html [plantilla.html]');
  const base = template ? resolve(template) : fileURLToPath(new URL('../assets/rebotes.html', import.meta.url));
  const target = resolve(output);
  const existing = await realpath(target).catch((error) => {
    if (error.code !== 'ENOENT') throw error;
    return target;
  });
  const [original, inputFile] = await Promise.all([realpath(base), realpath(input)]);
  const normalize = process.platform === 'win32' ? (path) => path.toLowerCase() : (path) => path;
  assert(![original, inputFile].map(normalize).includes(normalize(existing)), 'Indica una salida distinta de la plantilla y de la configuración.');
  const [html, config] = await Promise.all([readFile(original, 'utf8'), loadConfig(inputFile)]);
  const configTag = /(<script id="scene-config" type="application\/json">)([^<]*)(<\/script>)/g;
  assert([...html.matchAll(configTag)].length === 1, 'La plantilla debe tener un único bloque de configuración válido.');
  const customized = html.replace(configTag, (_, prefix, json, suffix) => {
    const { mode } = JSON.parse(json);
    assert(['audiovisual', 'graficos'].includes(mode), 'La plantilla usa un modo desconocido.');
    return prefix + packJSON({ ...config, mode }) + suffix;
  });
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, customized, { encoding: 'utf8', flag: 'wx' });
  console.log(target);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
