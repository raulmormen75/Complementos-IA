import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

if (!process.argv[2]) throw new Error('Indica la carpeta local que contiene node_modules de preparación.');
const staging = resolve(process.argv[2]);
const req = createRequire(join(staging, 'package.json'));
const adapters = fileURLToPath(new URL('../assets/adapters/', import.meta.url));
const target = fileURLToPath(new URL('../assets/vendor/', import.meta.url));
await mkdir(target, { recursive: true });
const { build } = req('esbuild');

await build({
  entryPoints: [join(adapters, 'three-surface.js')],
  outfile: join(target, 'three-surface.cjs'),
  nodePaths: [join(staging, 'node_modules')],
  bundle: true,
  minify: true,
  target: ['es2022'],
  platform: 'browser',
  format: 'iife',
  legalComments: 'inline',
});

const plotlyFile = req.resolve('plotly.js-gl3d-dist-min');
const runtime = await readFile(plotlyFile, 'utf8');
const implementation = await readFile(join(adapters, 'plotly-adapter.js'), 'utf8');
await writeFile(join(target, 'plotly.cjs'), runtime + '\n;\n' + implementation + '\n');
for (const packageName of ['three', 'plotly.js-gl3d-dist-min']) {
  await copyFile(join(staging, 'node_modules', packageName, 'LICENSE'), join(target, packageName + '.LICENSE'));
}
