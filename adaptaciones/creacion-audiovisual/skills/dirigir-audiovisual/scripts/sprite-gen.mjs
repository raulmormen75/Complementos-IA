import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

// Keep installed dependencies outside the plugin cache. The bundled wheel is
// portable; the virtual environment is recreated on each computer.
const assets = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/sprite-gen');
const bundle = JSON.parse(fs.readFileSync(path.join(assets, 'bundle.json'), 'utf8'));
const args = process.argv.slice(2);
const mode = args.shift();
let runtimeOption;
let pythonOption;
let commandArgs = [];
while (args.length) {
  const arg = args.shift();
  if (arg === '--') { commandArgs = args.splice(0); break; }
  if (arg !== '--runtime-dir' && arg !== '--python') throw new Error(`Opción no reconocida: ${arg}`);
  const value = args.shift();
  if (!value || value.startsWith('--')) throw new Error(`Falta el valor de ${arg}`);
  if (arg === '--runtime-dir') runtimeOption = value;
  else pythonOption = value;
}
const dataRoot = process.platform === 'win32'
  ? path.join(os.homedir(), 'AppData/Local')
  : (process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local/share'));
const runtime = path.resolve(runtimeOption || process.env.CREACION_AUDIOVISUAL_SPRITE_HOME
  || path.join(dataRoot, 'CreacionAudiovisual', 'sprite-gen', bundle.version));
const venv = path.join(runtime, '.venv');
const python = path.join(venv, process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
const log = value => process.stdout.write(JSON.stringify(value, null, 2) + '\n');
function invoke(executable, parameters, inherit = false) {
  const result = spawnSync(executable, parameters, {
    encoding: 'utf8', shell: false, windowsHide: true,
    stdio: inherit ? 'inherit' : 'pipe', maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error) throw new Error(`No se pudo ejecutar ${executable}: ${result.error.message}`);
  return result;
}
function checkPython(executable, prefix = []) {
  try {
    const result = invoke(executable, [...prefix, '-c', 'import sys,json; print(json.dumps({"version":list(sys.version_info[:3]),"executable":sys.executable}))']);
    if (result.status !== 0) return null;
    const info = JSON.parse(result.stdout);
    if (info.version[0] !== 3 || info.version[1] < 11) return null;
    return {executable: info.executable, version: info.version};
  } catch { return null; }
}
function findPython() {
  if (pythonOption) {
    const selected = checkPython(pythonOption);
    if (!selected) throw new Error('El Python indicado no funciona o es anterior a 3.11.');
    return selected;
  }
  const choices = [['py', ['-3']], ['python', []], ['python3', []]];
  if (process.platform === 'win32') {
    const managerRoot = path.join(dataRoot, 'Python');
    if (fs.existsSync(managerRoot)) {
      for (const entry of fs.readdirSync(managerRoot, {withFileTypes: true})) {
        if (entry.isDirectory() && entry.name.startsWith('pythoncore-'))
          choices.push([path.join(managerRoot, entry.name, 'python.exe'), []]);
      }
    }
  }
  for (const [executable, prefix] of choices) {
    const found = checkPython(executable, prefix);
    if (found) return found;
  }
  throw new Error('No se encontró Python 3.11 o posterior. Instalar Python y volver a ejecutar setup; también se puede indicar --python con su ejecutable.');
}
function doctor() {
  if (!fs.existsSync(python)) return {ok:false, installed:false, runtime, expected_version:bundle.version, next:'Ejecutar setup en un entorno con Python 3.11+ y acceso a PyPI.'};
  const code = 'import json,sys; from importlib.metadata import version; import sprite_gen,PIL,numpy; print(json.dumps({"version":version("sprite-gen"),"python":sys.version.split()[0],"pillow":PIL.__version__,"numpy":numpy.__version__}))';
  try {
    const result = invoke(python, ['-c', code]);
    if (result.status !== 0) throw new Error(result.stderr.trim());
    const found = JSON.parse(result.stdout);
    return {ok:found.version === bundle.version, installed:true, runtime, expected_version:bundle.version, ...found};
  } catch (error) {
    return {ok:false, installed:true, runtime, expected_version:bundle.version, error:error.message};
  }
}
function setup() {
  const wheel = path.join(assets, bundle.wheel);
  const hash = createHash('sha256').update(fs.readFileSync(wheel)).digest('hex');
  if (hash !== bundle.sha256) throw new Error('La huella del motor incluido no coincide con bundle.json.');
  if (fs.existsSync(venv)) {
    const report = doctor();
    if (!report.ok) throw new Error('Existe un entorno incompleto o de otra versión. Revisarlo o elegir otra carpeta con --runtime-dir; no se reemplaza automáticamente.');
    log({...report, reused:true});
    return;
  }
  const base = findPython();
  fs.mkdirSync(runtime, {recursive:true});
  let result = invoke(base.executable, ['-m', 'venv', venv], true);
  if (result.status !== 0) throw new Error('No se pudo crear el entorno de sprite-gen.');
  result = invoke(python, ['-m', 'pip', 'install', '--disable-pip-version-check', wheel], true);
  if (result.status !== 0) throw new Error('La instalación no terminó. Revisar el error y la conexión antes de reintentar; el entorno incompleto se conserva para diagnóstico.');
  const report = doctor();
  if (!report.ok) throw new Error('La comprobación posterior a la instalación falló.');
  fs.writeFileSync(path.join(runtime, 'installation.json'), JSON.stringify({version:bundle.version, wheel_sha256:bundle.sha256, created:new Date().toISOString()}, null, 2) + '\n');
  log({...report, reused:false});
}
try {
  if (mode === 'doctor') {
    const report = doctor(); log(report); process.exitCode = report.ok ? 0 : 2;
  } else if (mode === 'setup') setup();
  else if (mode === 'run') {
    if (!commandArgs.length) throw new Error('Usar run [--runtime-dir <carpeta>] -- <comando y opciones de sprite-gen>.');
    const report = doctor();
    if (!report.ok) throw new Error('El motor no está preparado. Ejecutar doctor y después setup; run no instala ni descarga por su cuenta.');
    const result = invoke(python, ['-m', 'sprite_gen.cli', ...commandArgs], true);
    process.exitCode = result.status ?? 1;
  } else throw new Error('Uso: node sprite-gen.mjs doctor|setup|run [--runtime-dir <carpeta>] [--python <ejecutable>] [-- <opciones del motor>]');
} catch (error) {
  process.stderr.write(error.message + '\n'); process.exitCode = 1;
}
