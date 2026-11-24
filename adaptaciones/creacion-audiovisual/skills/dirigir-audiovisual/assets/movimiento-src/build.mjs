import {mkdir, readFile, readdir, writeFile} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {build} from 'esbuild';

const root = dirname(fileURLToPath(import.meta.url));
const output = join(root, 'dist');
const entries = {
  physics: 'bakePhysics',
  'three-scene': 'createThreeScene',
  animation: 'createMotionTimeline',
  'pixi-layer': 'createPixiLayer',
};
const packages = new Set();
const summary = {};
await mkdir(output, {recursive: true});

const compactRapier = {
  name: 'compact-rapier',
  setup(esbuild) {
    esbuild.onLoad({filter: /[\\/]@dimforge[\\/]rapier3d-compat[\\/]dist[\\/]rapier\.mjs$/}, async ({path}) => {
      const source = await readFile(path, 'utf8');
      const wasmInput = /[\w$]+\.toByteArray\("([A-Za-z0-9+/]{100000,}={0,2})"\)\.buffer/gu;
      if ([...source.matchAll(wasmInput)].length !== 1) {
        throw new Error('Cambió el empaquetado de Rapier. Revisa su inicialización antes de reconstruir.');
      }
      const adapted = source.replace(wasmInput, (_, data) => {
        const wasm = Buffer.from(data, 'base64');
        if (wasm.subarray(0, 4).toString('hex') !== '0061736d') {
          throw new Error('El recurso oficial de Rapier no tiene la cabecera esperada de WebAssembly.');
        }
        return `(yield decompressRapierWasm("${gzipSync(wasm, {level: 9}).toString('base64')}"))`;
      });
      const decompress = `
        async function decompressRapierWasm(encoded) {
          if (typeof DecompressionStream === 'undefined') {
            throw new Error('La simulación necesita descompresión gzip disponible en el navegador.');
          }
          const decoded = atob(encoded);
          const bytes = new Uint8Array(decoded.length);
          for (let index = 0; index < decoded.length; index += 1) bytes[index] = decoded.charCodeAt(index);
          return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
        }
      `;
      return {contents: adapted + decompress, loader: 'js'};
    });
  },
};

for (const [entry, exported] of Object.entries(entries)) {
  const bundled = await build({
    absWorkingDir: root,
    entryPoints: [`src/${entry}.js`],
    outfile: join(output, `${entry}.js`),
    bundle: true,
    platform: 'browser',
    target: 'es2022',
    format: 'iife',
    globalName: 'engine',
    banner: {js: '(function () {'},
    footer: {js: `(globalThis.MovimientoRuntime ??= {}).${exported} = engine.${exported};\n})();`},
    minify: true,
    legalComments: 'eof',
    metafile: true,
    write: false,
    plugins: entry === 'physics' ? [compactRapier] : [],
  });
  for (const filename of Object.keys(bundled.metafile.inputs)) {
    const match = filename.match(/^(.*node_modules\/(?:@[^/]+\/)?[^/]+)\//u);
    if (match) packages.add(match[1]);
  }
  // Each bundle is also used inline in the portable HTML. Escape a literal closing script tag.
  const source = bundled.outputFiles[0].text.replace(/<\/script/giu, '<\\/script');
  await writeFile(join(output, `${entry}.js`), source);
  summary[entry] = {export: exported, bytes: Buffer.byteLength(source)};
}

const notices = [
  'AVISOS DE LICENCIA — MOTORES OPCIONALES DE MOVIMIENTO',
  'Versiones fijadas en package.json y package-lock.json.',
  'Solo se enumeran paquetes con código incorporado en los archivos generados.',
  'Adaptación de @dimforge/rapier3d-compat: sustituimos el empaquetado Base64 del ejecutable por su compresión gzip. Los bytes de WebAssembly se conservan al descomprimir.',
];
for (const packagePath of [...packages].sort()) {
  const folder = resolve(root, packagePath);
  const manifest = JSON.parse(await readFile(join(folder, 'package.json'), 'utf8'));
  const licenseFiles = (await readdir(folder, {withFileTypes: true}))
    .filter((file) => file.isFile() && /^(licen[cs]es?|copying|notice)(\.|$)/iu.test(file.name))
    .map((file) => file.name)
    .sort();
  if (!licenseFiles.length) throw new Error(`Falta el aviso original de ${manifest.name} en ${packagePath}`);
  notices.push(`${manifest.name} ${manifest.version} — ${manifest.license}`);
  for (const file of licenseFiles) {
    notices.push(`--- ${file} ---\n${(await readFile(join(folder, file), 'utf8')).trim()}`);
  }
}
await writeFile(join(output, 'LICENCIAS-MOVIMIENTO.txt'), notices.join('\n\n') + '\n');
await writeFile(join(output, 'resumen.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(summary);
