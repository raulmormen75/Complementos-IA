import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function ffmpeg(executable, args, timeout = 30 * 60 * 1000) {
  const execution = spawnSync(executable, ['-nostdin', '-hide_banner', ...args], {
    encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 ** 2, timeout,
  });
  if (execution.error) throw execution.error;
  assert(execution.status === 0, 'FFmpeg falló: ' + (execution.stderr || execution.stdout || String(execution.status)).slice(-2200));
  return execution.stdout;
}

function finite(value, label, min, max) {
  assert(typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max, label + ' fuera de intervalo.');
  return value;
}

function size(value, label) {
  finite(value, label, 2, 1920);
  assert(Number.isInteger(value) && value % 2 === 0, label + ' debe ser entero par.');
  return value;
}

function localFile(base, candidate) {
  assert(typeof candidate === 'string' && candidate && !candidate.includes('://') && !/^\\\\/.test(candidate), 'Usa un archivo local.');
  const full = path.resolve(base, candidate);
  assert(!/^\\\\/.test(full) && fs.statSync(full).isFile(), 'Se esperaba un archivo local: ' + full);
  return full;
}

function edit(planPath, executable) {
  const base = path.dirname(path.resolve(planPath));
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8').replace(/^\uFEFF/, ''));
  const width = size(plan.width ?? 1280, 'Ancho');
  const height = size(plan.height ?? 720, 'Alto');
  const fps = finite(plan.fps ?? 30, 'FPS', 12, 60);
  assert(Number.isInteger(fps) && width * height <= 1920 * 1080, 'Usa FPS entero y máximo 2,073,600 píxeles.');
  assert(Array.isArray(plan.clips) && plan.clips.length >= 1 && plan.clips.length <= 32, 'Usa de 1 a 32 clips.');
  assert(typeof plan.output === 'string' && /\.mp4$/i.test(plan.output) && !plan.output.includes('://') && !/^\\\\/.test(plan.output),
    'La salida debe ser un archivo local .mp4.');
  const output = path.resolve(base, plan.output);
  assert(!fs.existsSync(output), 'La salida ya existe: ' + output);
  assert(fs.statSync(path.dirname(output)).isDirectory(), 'La carpeta de salida debe existir.');
  const input = [];
  const filters = [];
  let duration = 0;
  const clips = plan.clips.map(({file, start = 0, seconds, audio = false}, index) => {
    finite(start, 'Inicio del clip', 0, 60 * 60);
    finite(seconds, 'Duración del clip', 1 / fps, 600);
    assert(typeof audio === 'boolean', 'Indica audio del clip como true o false.');
    const source = localFile(base, file);
    duration += seconds;
    input.push('-ss', String(start), '-t', String(seconds), '-i', source);
    filters.push(
      '[' + index + ':v:0]fps=' + fps
      + ',scale=' + width + ':' + height + ':force_original_aspect_ratio=decrease'
      + ',pad=' + width + ':' + height + ':(ow-iw)/2:(oh-ih)/2:color=0x111C26'
      + ',setsar=1,format=yuv420p,trim=duration=' + seconds + ',setpts=PTS-STARTPTS[v' + index + ']',
      (audio ? '[' + index + ':a:0]aresample=48000,aformat=channel_layouts=stereo,apad,' : 'anullsrc=r=48000:cl=stereo,')
        + 'atrim=duration=' + seconds + ',asetpts=PTS-STARTPTS[a' + index + ']',
    );
    return '[v' + index + '][a' + index + ']';
  });
  filters.push(clips.join('') + 'concat=n=' + clips.length + ':v=1:a=1[video][clipAudio]');
  let next = clips.length;
  let audio = '[clipAudio]';
  if (plan.narration) {
    const voice = localFile(base, plan.narration);
    const volume = finite(plan.narrationVolume ?? 1, 'Volumen de narración', 0, 4);
    input.push('-i', voice);
    filters.push(
      '[' + next++ + ':a:0]aresample=48000,aformat=channel_layouts=stereo,volume=' + volume
        + ',apad,atrim=duration=' + duration + '[narration]',
      '[clipAudio][narration]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95:latency=1[audio]',
    );
    audio = '[audio]';
  }
  const subtitles = plan.subtitles ? ['-map', next + ':s:0', '-c:s', 'mov_text'] : [];
  if (plan.subtitles) {
    assert(/\.srt$/i.test(plan.subtitles), 'La pista de subtítulos debe ser SRT.');
    input.push('-i', localFile(base, plan.subtitles));
  }
  probe(executable);

  const staged = path.join(path.dirname(output), '.creacion-audiovisual-' + randomUUID() + '.mp4');
  try {
    ffmpeg(executable, [
      '-v', 'error', '-n', ...input, '-filter_complex', filters.join(';'),
      '-map', '[video]', '-map', audio, ...subtitles,
      '-t', String(duration), '-c:v', 'libx264', '-preset', 'medium', '-crf', '19',
      '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', staged,
    ]);
    ffmpeg(executable, ['-v', 'error', '-xerror', '-i', staged, '-map', '0:v:0', '-map', '0:a:0', '-f', 'null', '-']);
    fs.copyFileSync(staged, output, fs.constants.COPYFILE_EXCL);
    return {output, format: 'MP4', video: 'H.264', audio: 'AAC', secondsRequested: duration,
      decodingVerified: true, subtitleTrack: Boolean(plan.subtitles)};
  } finally {
    if (fs.existsSync(staged)) fs.unlinkSync(staged);
  }
}

function probe(executable) {
  const encoders = ffmpeg(executable, ['-encoders'], 10_000);
  assert(/\blibx264\b/.test(encoders) && /\baac\b/.test(encoders), 'Este FFmpeg necesita libx264 y AAC.');
  return {executable, mp4: true, encoders: ['libx264', 'aac'], network: 'not required'};
}

const values = process.argv.slice(2);
const [option, file, extra, explicit] = values;
try {
  const fallback = process.env.AUDIOVISUAL_FFMPEG || 'ffmpeg';
  const request = option === '--probe' && (values.length === 1 || (file === '--ffmpeg' && extra && values.length === 3))
    ? probe(extra || fallback)
    : option === '--plan' && file && (values.length === 2 || (extra === '--ffmpeg' && explicit && values.length === 4))
      ? edit(file, explicit || fallback)
      : undefined;
  assert(request, 'Uso: node editar-video.mjs --probe | --plan montaje.json [--ffmpeg ruta-local]');
  console.log(JSON.stringify(request, null, 2));
} catch (error) {
  console.error('MP4 pendiente: ' + error.message);
  process.exitCode = 2;
}
