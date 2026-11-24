import fs from 'node:fs';
import path from 'node:path';

const target = process.argv[2];
if (!target) throw new Error('Uso: node crear-muestra.mjs <carpeta-nueva>');
const width = 320, height = 180, fps = 12, seconds = 2;
const rate = 16000;
fs.mkdirSync(target);
const frames = path.join(target, 'frames');
fs.mkdirSync(frames);

for (let frame = 0; frame < fps * seconds; frame++) {
  const rgb = Buffer.alloc(width * height * 3);
  const center = 35 + frame * 10;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 3;
      const circle = (x - center) ** 2 + (y - 90) ** 2 < 24 ** 2;
      rgb[offset] = circle ? 245 : 24;
      rgb[offset + 1] = circle ? 182 : 45;
      rgb[offset + 2] = circle ? 48 : 74;
    }
  }
  const name = 'frame-' + String(frame).padStart(6, '0') + '.ppm';
  fs.writeFileSync(path.join(frames, name), Buffer.concat([Buffer.from('P6\n320 180\n255\n'), rgb]), {flag: 'wx'});
}

const bytes = rate * seconds * 2;
const wave = Buffer.alloc(44 + bytes);
wave.write('RIFF', 0);
wave.writeUInt32LE(wave.length - 8, 4);
wave.write('WAVEfmt ', 8);
wave.writeUInt32LE(16, 16);
wave.writeUInt16LE(1, 20);
wave.writeUInt16LE(1, 22);
wave.writeUInt32LE(rate, 24);
wave.writeUInt32LE(rate * 2, 28);
wave.writeUInt16LE(2, 32);
wave.writeUInt16LE(16, 34);
wave.write('data', 36);
wave.writeUInt32LE(bytes, 40);
for (let i = 0; i < rate * seconds; i++) {
  const t = i / rate;
  const envelope = Math.max(0, 1 - (t % 0.5) * 3);
  wave.writeInt16LE(Math.round(2400 * envelope * Math.sin(2 * Math.PI * 330 * t)), 44 + i * 2);
}
fs.writeFileSync(path.join(target, 'mezcla.wav'), wave, {flag: 'wx'});
console.log(JSON.stringify({frames, fps, width, height, seconds}));
