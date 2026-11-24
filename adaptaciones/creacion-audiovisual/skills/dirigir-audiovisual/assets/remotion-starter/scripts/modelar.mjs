import fs from 'node:fs';
import path from 'node:path';
import {ExtrudeGeometry, Mesh, MeshStandardMaterial, Shape} from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';

class NodeFileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onloadend?.();
    }, (error) => this.onerror?.(error));
  }
}

function check(condition, message) {
  if (!condition) throw new Error(message);
}

async function exportProfile(spec, output) {
  const {points, depth, color = '#D9B879'} = spec;
  check(Array.isArray(points) && points.length >= 3 && points.length <= 180 && points.every(
    (point) => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite)
  ) && typeof depth === 'number' && Number.isFinite(depth) && depth > 0, 'Se requieren puntos y profundidad positiva.');
  check(/^#[0-9a-f]{6}$/i.test(color), 'Usa un color hexadecimal de seis dígitos.');
  const shape = new Shape();
  points.forEach(([x, y], index) => index ? shape.lineTo(x, y) : shape.moveTo(x, y));
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, {depth, bevelEnabled: false});
  check(geometry.getAttribute('position').count > 0, 'El perfil no contiene triángulos.');
  geometry.center();
  const mesh = new Mesh(geometry, new MeshStandardMaterial({color, metalness: 0.23, roughness: 0.36}));
  mesh.name = typeof spec.title === 'string' ? spec.title : 'Perfil extruido';
  globalThis.FileReader ??= NodeFileReader;
  const glb = await new GLTFExporter().parseAsync(mesh, {binary: true});
  fs.writeFileSync(output, Buffer.from(glb), {flag: 'wx'});
  geometry.dispose();
  mesh.material.dispose();
}

function dimensions(list, n) {
  return Array.isArray(list) && list.length === n && list.every((number) =>
    typeof number === 'number' && Number.isFinite(number) && number > 0 && number <= 10000);
}

async function exportDimensions(spec, output) {
  const {booleans, primitives, transforms} = (await import('@jscad/modeling')).default;
  const {serialize} = (await import('@jscad/stl-serializer')).default;
  check(Array.isArray(spec.parts) && spec.parts.length >= 1 && spec.parts.length <= 40,
    'Usa de 1 a 40 piezas.');
  const parts = spec.parts.map((part) => {
    let solid;
    if (part.type === 'box' && dimensions(part.size, 3)) {
      solid = primitives.cuboid({size: part.size});
    } else if (part.type === 'cylinder' && dimensions([part.radius, part.height], 2)) {
      solid = primitives.cylinder({radius: part.radius, height: part.height, segments: 48});
    } else {
      throw new Error('Usa box con size [x,y,z] o cylinder con radius y height positivos.');
    }
    if (!part.translate) return solid;
    check(Array.isArray(part.translate) && part.translate.length === 3 && part.translate.every(Number.isFinite),
      'La traslación requiere tres coordenadas numéricas.');
    return transforms.translate(part.translate, solid);
  });
  const merged = parts.length === 1 ? parts[0] : booleans.union(...parts);
  const chunks = serialize({binary: true}, merged);
  fs.writeFileSync(output, Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))), {flag: 'wx'});
}

const [input, output] = process.argv.slice(2);
try {
  check(input && output && /\.(glb|stl)$/i.test(output) && !fs.existsSync(output),
    'Uso: node scripts/modelar.mjs geometria.json salida-nueva.glb|stl');
  const spec = JSON.parse(fs.readFileSync(input, 'utf8').replace(/^\uFEFF/, ''));
  if (/\.glb$/i.test(output)) {
    await exportProfile(spec, output);
  } else {
    await exportDimensions(spec, output);
  }
  console.log(path.resolve(output));
} catch (error) {
  console.error('Modelo pendiente: ' + error.message);
  process.exitCode = 2;
}
