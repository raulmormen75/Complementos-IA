import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

// Esquema temporal simple: una pista principal sin solapamientos implícitos.
// Un fundido se modela dentro de una escena; no limita composiciones Remotion reales.
export function validatePlan(plan) {
  const errors = [];
  const positiveInt = n => Number.isSafeInteger(n) && n > 0;
  const text = value => typeof value === 'string' && value.trim().length > 0;
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) return ['El plan debe ser un objeto.'];
  for (const key of ['title', 'intent', 'audience']) if (!text(plan[key])) errors.push(`${key}: texto requerido.`);
  for (const key of ['width', 'height', 'durationInFrames']) if (!positiveInt(plan[key])) errors.push(`${key}: entero positivo requerido.`);
  if (!(typeof plan.fps === 'number' && Number.isFinite(plan.fps) && plan.fps > 0 && plan.fps <= 240)) errors.push('fps: número mayor que cero y no mayor que 240.');
  if (!Array.isArray(plan.scenes) || !plan.scenes.length) errors.push('scenes: lista no vacía requerida.');
  else {
    let end = 0;
    const ids = new Set();
    plan.scenes.forEach((scene, i) => {
      const label = `scenes[${i}]`;
      if (!scene || typeof scene !== 'object' || Array.isArray(scene)) { errors.push(`${label}: objeto requerido.`); return; }
      if (!text(scene.id) || ids.has(scene.id)) errors.push(`${label}.id: texto único requerido.`);
      ids.add(scene.id);
      for (const key of ['purpose', 'visual', 'sound']) if (!text(scene[key])) errors.push(`${label}.${key}: texto requerido (usar silencio si procede).`);
      if (!Number.isSafeInteger(scene.from) || scene.from < 0) errors.push(`${label}.from: entero no negativo requerido.`);
      if (!positiveInt(scene.durationInFrames)) errors.push(`${label}.durationInFrames: entero positivo requerido.`);
      if (scene.from !== end) errors.push(`${label}: hueco, solapamiento o desorden; inicio esperado ${end}.`);
      end = scene.from + scene.durationInFrames;
    });
    if (end !== plan.durationInFrames) errors.push('La pista principal no coincide con durationInFrames.');
  }
  if (!Array.isArray(plan.assets)) errors.push('assets: lista requerida, puede estar vacía.');
  else plan.assets.forEach((asset,i) => {
    if (!asset || typeof asset !== 'object') {errors.push(`assets[${i}]: objeto requerido.`); return;}
    for (const key of ['name','origin','rights']) if (!text(asset[key])) errors.push(`assets[${i}].${key}: texto requerido.`);
  });
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    if (!process.argv[2]) throw new Error('Uso: node validate-plan.mjs <plan.json>');
    const errors = validatePlan(JSON.parse(fs.readFileSync(process.argv[2],'utf8').replace(/^\uFEFF/,'')));
    console.log(JSON.stringify({valid: errors.length === 0, errors, scope: 'Estructura y tiempos de una pista principal. No verifica derechos, calidad, recursos ni exactitud factual.'}, null, 2));
    process.exitCode = errors.length ? 1 : 0;
  } catch (error) { console.error(error.message); process.exitCode = 2; }
}
