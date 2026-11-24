import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

// Inventario de solo consulta: no ejecuta herramientas del proyecto ni instala paquetes.
const target = process.argv[2];
if (!target) {
  console.error('Uso: node doctor.mjs <carpeta-del-proyecto>');
  process.exit(2);
}
const root = path.resolve(target);
try {
  if (!fs.statSync(root).isDirectory()) throw new Error('El destino no es una carpeta.');
  const packageFile = path.join(root, 'package.json');
  const manifest = fs.existsSync(packageFile) ? JSON.parse(fs.readFileSync(packageFile, 'utf8').replace(/^\uFEFF/, '')) : {};
  const require = createRequire(path.join(root, '__inventory__.cjs'));
  const names = ['remotion', '@remotion/cli', '@remotion/three', 'react', 'react-dom', 'three', '@react-three/fiber'];
  const packages = names.map(name => {
    let installed = null;
    try {
      let folder = path.dirname(require.resolve(name));
      for (;;) {
        const candidate = path.join(folder, 'package.json');
        if (fs.existsSync(candidate)) {
          const pkg = JSON.parse(fs.readFileSync(candidate, 'utf8'));
          if (pkg.name === name) { installed = pkg.version; break; }
        }
        const parent = path.dirname(folder);
        if (parent === folder) break;
        folder = parent;
      }
    } catch {}
    return {name, declared: manifest.dependencies?.[name] ?? manifest.devDependencies?.[name] ?? null, installed};
  });
  const remotionVersions = packages.filter(p => p.name === 'remotion' || p.name.startsWith('@remotion/')).map(p => p.installed).filter(Boolean);
  const result = {
    project: root, node: process.version, platform: process.platform,
    packageJson: fs.existsSync(packageFile), packages,
    remotionVersionsMatch: remotionVersions.length ? new Set(remotionVersions).size === 1 : null,
    localFfmpegOverride: process.env.AUDIOVISUAL_FFMPEG || null,
    mp4Probe: 'node editar-video.mjs --probe [--ffmpeg ruta-local]',
    lockfiles: ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lock'].filter(name => fs.existsSync(path.join(root,name))),
    checksNotPerformed: ['licencia y elegibilidad', 'GPU/navegador', 'render', 'calidad editorial', 'audio', 'disponibilidad de servicios externos']
  };
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(`No se pudo inspeccionar el proyecto: ${error.message}`);
  process.exitCode = 2;
}
