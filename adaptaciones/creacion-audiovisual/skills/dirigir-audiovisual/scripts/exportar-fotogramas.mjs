import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const limit = 256 * 1024 ** 2;
const [framesDir, fpsArg, output, wav] = process.argv.slice(2);

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function ffmpeg(args) {
  return spawnSync(process.env.AUDIOVISUAL_FFMPEG || 'ffmpeg', ['-nostdin', '-hide_banner', ...args], {
    encoding: 'utf8', windowsHide: true, maxBuffer: 4 * 1024 ** 2
  });
}

function probe() {
  const result = ffmpeg(['-encoders']);
  return {
    avi: true,
    mp4: result.status === 0 && /\blibx264\b/.test(result.stdout) && /\baac\b/.test(result.stdout),
    network: 'not required',
  };
}

function boundedRead(file, max = 24 * 1024 ** 2) {
  const stat = fs.statSync(file);
  check(stat.isFile() && stat.size <= max, 'Archivo no regular o demasiado grande: ' + path.basename(file));
  return fs.readFileSync(file);
}

function validateDimensions(width, height) {
  check(width >= 2 && width <= 1920 && height >= 2 && height <= 1920 && width * height <= 1920 * 1080,
    'La imagen excede 1920 píxeles por lado o 2073600 píxeles totales.');
}

function ppm(data) {
  const head = data.subarray(0, 256).toString('latin1');
  const m = /^P6[ \t\r\n]+(\d+)[ \t\r\n]+(\d+)[ \t\r\n]+255(?:\r\n|[ \t\r\n])/.exec(head);
  check(m, 'PPM inválido. Usa P6 RGB de 8 bits y encabezado sin comentarios.');
  const width = Number(m[1]), height = Number(m[2]);
  const pixels = data.subarray(m[0].length);
  validateDimensions(width, height);
  check(pixels.length === width * height * 3, 'PPM truncado o con datos adicionales.');
  return {width, height, pixels};
}

function jpeg(data) {
  check(data.length >= 8 && data.readUInt16BE(0) === 0xffd8 &&
    data.readUInt16BE(data.length - 2) === 0xffd9, 'JPEG incompleto.');
  let at = 2;
  while (at + 4 <= data.length && data[at++] === 0xff) {
    while (data[at] === 0xff) at++;
    const tag = data[at++];
    check(at + 2 <= data.length && tag !== 0xda, 'JPEG sin encabezado de imagen válido.');
    const size = data.readUInt16BE(at);
    check(size >= 2 && at + size <= data.length, 'Segmento JPEG inválido.');
    if (tag === 0xc0) {
      check(size >= 8 && data[at + 2] === 8 && data[at + 7] === 3, 'Usa JPEG baseline RGB/YCbCr de 8 bits.');
      const width = data.readUInt16BE(at + 5), height = data.readUInt16BE(at + 3);
      validateDimensions(width, height);
      return {width, height, pixels: data};
    }
    at += size;
  }
  throw new Error('Usa JPEG baseline de tres componentes o PPM P6.');
}

function readAudio(file, count, fps) {
  const data = boundedRead(file, limit);
  check(data.length >= 12 && data.toString('ascii', 0, 4) === 'RIFF' &&
    data.toString('ascii', 8, 12) === 'WAVE' && data.readUInt32LE(4) + 8 === data.length, 'WAV RIFF inválido.');
  let format, samples;
  for (let at = 12; at + 8 <= data.length;) {
    const size = data.readUInt32LE(at + 4);
    const end = at + 8 + size;
    check(end <= data.length, 'WAV truncado.');
    const tag = data.toString('ascii', at, at + 4);
    if (tag === 'fmt ') format = data.subarray(at + 8, end);
    if (tag === 'data') samples = data.subarray(at + 8, end);
    at = end + (size % 2);
  }
  check(format?.length >= 16 && samples?.length && format.readUInt16LE(0) === 1 &&
    format.readUInt16LE(14) === 16, 'El audio debe ser WAV PCM de 16 bits.');
  const channels = format.readUInt16LE(2), rate = format.readUInt32LE(4);
  const align = channels * 2;
  check((channels === 1 || channels === 2) && rate >= 8000 && rate <= 48000 &&
    format.readUInt16LE(12) === align && format.readUInt32LE(8) === rate * align &&
    samples.length % align === 0, 'Formato PCM no admitido.');
  check(samples.length / align === Math.round(count * rate / fps),
    'La duración del WAV no coincide con el video. Ajusta la mezcla o los fotogramas de forma explícita.');
  return {format: format.subarray(0, 16), samples, rate, align};
}

function ints(...values) {
  const b = Buffer.alloc(4 * values.length);
  values.forEach((v, i) => b.writeUInt32LE(v, i * 4));
  return b;
}
const ascii = s => Buffer.from(s, 'ascii');
const chunkHeader = (tag, size) => Buffer.concat([ascii(tag), ints(size)]);
const pad = Buffer.alloc(1);
const chunk = (tag, bytes) => Buffer.concat([chunkHeader(tag, bytes.length), bytes, ...(bytes.length % 2 ? [pad] : [])]);
const list = (tag, ...chunks) => chunk('LIST', Buffer.concat([ascii(tag), ...chunks]));

function streamHeader(type, codec, scale, rate, count, suggested, sampleSize, width = 0, height = 0) {
  const box = Buffer.alloc(8);
  box.writeUInt16LE(width, 4);
  box.writeUInt16LE(height, 6);
  return chunk('strh', Buffer.concat([ascii(type), codec, ints(0, 0, 0, scale, rate, 0,
    count, suggested, 0xffffffff, sampleSize), box]));
}

function toBgr({pixels, width, height}, stride) {
  const bytes = Buffer.alloc(stride * height);
  for (let row = 0; row < height; row++) {
    let from = (height - row - 1) * width * 3, to = row * stride;
    for (let x = 0; x < width; x++, from += 3, to += 3) {
      bytes[to] = pixels[from + 2];
      bytes[to + 1] = pixels[from + 1];
      bytes[to + 2] = pixels[from];
    }
  }
  return bytes;
}

function writeAvi(dest, names, fps, image, loadFrame, compressed, audio) {
  const {width, height} = image, count = names.length;
  const stride = Math.ceil(width * 3 / 4) * 4;
  const frameSize = stride * height;
  const sizes = compressed ? names.map(file => fs.statSync(file).size) : names.map(() => frameSize);
  const max = Math.max(...sizes);
  const audioBytes = audio?.samples.length ?? 0;
  const chunkCount = count * (audio ? 2 : 1);
  const moviLength = 4 + sizes.reduce((sum, size) => sum + size + (size % 2), 0) + audioBytes + chunkCount * 8;
  const codec = compressed ? ascii('MJPG') : ints(0);
  const bitmap = Buffer.alloc(40);
  bitmap.writeUInt32LE(40);
  bitmap.writeUInt32LE(width, 4);
  bitmap.writeUInt32LE(height, 8);
  bitmap.writeUInt16LE(1, 12);
  bitmap.writeUInt16LE(24, 14);
  codec.copy(bitmap, 16);
  bitmap.writeUInt32LE(compressed ? max : frameSize, 20);
  const video = list('strl', streamHeader('vids', codec, 1, fps, count, max, 0, width, height), chunk('strf', bitmap));
  const audioStream = audio ? [list('strl',
    streamHeader('auds', ints(0), audio.align, audio.rate * audio.align, audioBytes / audio.align,
      Math.ceil(audio.rate / fps) * audio.align, audio.align),
    chunk('strf', audio.format))] : [];
  const header = list('hdrl', chunk('avih', ints(Math.round(1e6 / fps), max * fps + (audio ? audio.rate * audio.align : 0),
    0, audio ? 0x110 : 0x10, count, 0, audio ? 2 : 1, max, width, height, 0, 0, 0, 0)), video, ...audioStream);
  const size = 4 + header.length + 8 + moviLength + 8 + chunkCount * 16;
  check(size + 8 <= limit, 'El AVI superaría 256 MiB. Usa JPEG baseline, FFmpeg disponible o reduce resolución con autorización.');
  const fd = fs.openSync(dest, 'wx');
  const index = [];
  let offset = 4, closed = false;
  function write(bytes) {
    let at = 0;
    while (at < bytes.length) {
      const n = fs.writeSync(fd, bytes, at, bytes.length - at);
      check(n > 0, 'No se pudo escribir la salida completa.');
      at += n;
    }
  }
  function writeMedia(tag, bytes, flags) {
    write(chunkHeader(tag, bytes.length));
    write(bytes);
    if (bytes.length % 2) write(pad);
    index.push(Buffer.concat([ascii(tag), ints(flags, offset, bytes.length)]));
    offset += 8 + bytes.length + (bytes.length % 2);
  }
  try {
    write(chunkHeader('RIFF', size));
    write(ascii('AVI '));
    write(header);
    write(chunkHeader('LIST', moviLength));
    write(ascii('movi'));
    for (let i = 0; i < count; i++) {
      const frame = loadFrame(names[i]);
      const bytes = compressed ? frame.pixels : toBgr(frame, stride);
      check(bytes.length === sizes[i], 'Un fotograma cambió durante la exportación.');
      writeMedia(compressed ? '00dc' : '00db', bytes, 0x10);
      if (audio) {
        const sample = n => Math.round(n * audio.rate / fps) * audio.align;
        writeMedia('01wb', audio.samples.subarray(sample(i), sample(i + 1)), 0);
      }
    }
    check(offset === moviLength, 'Longitud de medios inesperada.');
    write(chunk('idx1', Buffer.concat(index)));
    check(fs.fstatSync(fd).size === size + 8, 'Tamaño AVI inesperado.');
    fs.closeSync(fd);
    closed = true;
  } finally {
    if (!closed) {
      fs.closeSync(fd);
      fs.unlinkSync(dest);
    }
  }
}

function main() {
  if (framesDir === '--probe' && !fpsArg) return console.log(JSON.stringify(probe()));
  const fps = Number(fpsArg);
  check(framesDir && output && Number.isInteger(fps) && fps >= 1 && fps <= 60 && process.argv.length <= 6,
    'Uso: node exportar-fotogramas.mjs <carpeta> <fps 1–60> <salida.avi|salida.mp4> [mezcla.wav]');
  const dir = path.resolve(framesDir);
  const files = fs.readdirSync(dir).filter(n => /^frame-\d{6}\.(ppm|jpg)$/.test(n)).sort();
  const extension = path.extname(files[0] ?? '');
  check(files.length && files.length <= 10800 &&
    files.every((n, i) => n === 'frame-' + String(i).padStart(6, '0') + extension),
    'Usa una secuencia continua frame-000000.ppm o frame-000000.jpg con una sola extensión (máximo 10800).');
  const names = files.map(n => path.join(dir, n));
  const parse = extension === '.jpg' ? jpeg : ppm;
  const image = parse(boundedRead(names[0]));
  const loadFrame = file => {
    const frame = parse(boundedRead(file));
    check(frame.width === image.width && frame.height === image.height, 'Todos los fotogramas deben tener el mismo tamaño.');
    return frame;
  };
  const audio = wav ? readAudio(path.resolve(wav), names.length, fps) : undefined;
  const dest = path.resolve(output);
  check(!fs.existsSync(dest), 'La salida ya existe. Indica otro nombre.');
  const format = path.extname(dest).toLowerCase();
  if (format === '.avi') writeAvi(dest, names, fps, image, loadFrame, extension === '.jpg', audio);
  else if (format === '.mp4') {
    check(image.width % 2 === 0 && image.height % 2 === 0, 'MP4 H.264 requiere dimensiones pares.');
    check(!dir.includes('%'), 'Para MP4 usa una ruta de fotogramas sin el carácter %.');
    check(probe().mp4, 'FFmpeg con H.264 y AAC no está disponible. Usa una salida .avi sin instalar paquetes.');
    names.forEach(loadFrame);
    const tmp = fs.mkdtempSync(path.join(path.dirname(dest), '.exportacion-'));
    const encoded = path.join(tmp, 'salida.mp4');
    try {
      const result = ffmpeg(['-loglevel', 'error', '-n', '-framerate', String(fps), '-start_number', '0',
        '-protocol_whitelist', 'file', '-i', path.join(dir, 'frame-%06d' + extension),
        ...(wav ? ['-protocol_whitelist', 'file', '-i', path.resolve(wav), '-c:a', 'aac'] : ['-an']),
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', encoded]);
      check(result.status === 0 && fs.statSync(encoded).size > 0, 'FFmpeg no exportó: ' + (result.stderr?.trim() || result.error?.message || 'sin diagnóstico'));
      fs.copyFileSync(encoded, dest, fs.constants.COPYFILE_EXCL);
    } finally {
      if (fs.existsSync(encoded)) fs.unlinkSync(encoded);
      fs.rmdirSync(tmp);
    }
  } else throw new Error('Elige una salida .avi o .mp4.');
  console.log(JSON.stringify({file: dest, format, width: image.width, height: image.height, fps,
    frames: names.length, seconds: names.length / fps, audio: Boolean(audio), bytes: fs.statSync(dest).size}));
}

try { main(); } catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
