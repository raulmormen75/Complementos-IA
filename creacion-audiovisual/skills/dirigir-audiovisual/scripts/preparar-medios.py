"""Edición, limpieza de voz y subtítulos locales. No instala ni descarga modelos."""
import argparse
from pathlib import Path
import json
import os
import shutil
import subprocess
import tempfile


def existing_file(name):
    target = Path(name).resolve(strict=True)
    if not target.is_file():
        raise ValueError("Se esperaba un archivo local.")
    return target


def installed_model(name):
    directory = Path(name).resolve(strict=True)
    if not directory.is_dir():
        raise ValueError("Se esperaba una carpeta de modelo descargado previamente.")
    return directory


def new_output(name, extension):
    output = Path(name).resolve()
    if output.exists() or not output.parent.is_dir() or output.suffix.lower() != extension:
        raise ValueError(f"Usa una salida nueva {extension} con carpeta existente.")
    return output


def timestamp(seconds):
    total = max(0, round(seconds * 1000))
    h, residue = divmod(total, 3600000)
    m, residue = divmod(residue, 60000)
    s, ms = divmod(residue, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def subtitles(args):
    from faster_whisper import WhisperModel

    media = existing_file(args.media)
    folder = installed_model(args.model)
    output = new_output(args.output, ".srt")
    json_path = new_output(args.json, ".json") if args.json else None
    model = WhisperModel(str(folder), device="cpu", compute_type="int8", local_files_only=True)
    ffmpeg = args.ffmpeg or os.environ.get("AUDIOVISUAL_FFMPEG")
    audio = str(media)
    if ffmpeg:
        import numpy as np

        encoder = existing_file(ffmpeg)
        raw = subprocess.run(
            [str(encoder), "-nostdin", "-v", "error", "-i", str(media), "-vn",
             "-ac", "1", "-ar", "16000", "-f", "f32le", "pipe:1"],
            check=True, timeout=3600, stdout=subprocess.PIPE,
        ).stdout
        audio = np.frombuffer(raw, dtype="<f4")
        if not audio.size:
            raise ValueError("FFmpeg no encontró audio en el archivo.")
    try:
        chunks, metadata = model.transcribe(audio, language=args.language, vad_filter=True)
    except TypeError as exc:
        if not ffmpeg and "metadata_errors" in str(exc):
            raise ValueError("El decodificador de audio es incompatible. Indica un FFmpeg local mediante --ffmpeg.") from exc
        raise
    entries = []
    for item in chunks:
        text = " ".join(item.text.split())
        if text and item.end > item.start:
            entries.append({"start": item.start, "end": item.end, "text": text})
    if not entries:
        raise ValueError("No se encontraron segmentos de voz. Revisa el audio.")
    srt = "".join(f"{index}\n{timestamp(item['start'])} --> {timestamp(item['end'])}\n{item['text']}\n\n"
                  for index, item in enumerate(entries, 1))
    with output.open("x", encoding="utf-8") as stream:
        stream.write(srt)
    if json_path:
        with json_path.open("x", encoding="utf-8") as stream:
            json.dump(entries, stream, ensure_ascii=False, indent=2)
    print(f"{len(entries)} segmentos en {metadata.language}: {output}")


def clean_voice(args):
    media = existing_file(args.media)
    output = new_output(args.output, ".wav")
    if args.executable:
        if not args.ffmpeg:
            raise ValueError("La herramienta autónoma necesita un FFmpeg local para preparar WAV de 48 kHz.")
        executable = existing_file(args.executable)
        ffmpeg = existing_file(args.ffmpeg)
        model = existing_file(args.model) if args.model else None
        with tempfile.TemporaryDirectory(prefix="voz-local-", dir=output.parent) as temporary:
            root = Path(temporary)
            normalized = root / "voz.wav"
            filtered = root / "filtrado"
            filtered.mkdir()
            subprocess.run([str(ffmpeg), "-nostdin", "-v", "error", "-n", "-i", str(media),
                            "-vn", "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", str(normalized)],
                           check=True, timeout=600)
            command = [str(executable), "-D", "-o", str(filtered)]
            if model:
                command.extend(["-m", str(model)])
            subprocess.run([*command, str(normalized)], check=True, timeout=3600)
            candidates = list(filtered.glob("*.wav"))
            if len(candidates) != 1 or candidates[0].stat().st_size <= 44:
                raise ValueError("DeepFilterNet no produjo un WAV verificable.")
            with candidates[0].open("rb") as source, output.open("xb") as destination:
                shutil.copyfileobj(source, destination)
        print(output)
        return
    if not args.model:
        raise ValueError("Indica la carpeta del modelo para ejecutar DeepFilterNet en Python.")
    from df.enhance import enhance, init_df, load_audio, save_audio

    folder = installed_model(args.model)
    if not (folder / "config.ini").is_file() or not list((folder / "checkpoints").glob("*")):
        raise ValueError("La carpeta de DeepFilterNet debe contener config.ini y checkpoints locales.")
    model, state, _ = init_df(model_base_dir=str(folder))
    audio, _ = load_audio(str(media), sr=state.sr())
    save_audio(str(output), enhance(model, state, audio), state.sr())
    print(output)


def moviepy(args):
    # imageio no intenta descargar un codificador si se indica uno existente.
    os.environ["FFMPEG_BINARY"] = str(existing_file(args.ffmpeg))
    os.environ["IMAGEIO_FFMPEG_EXE"] = os.environ["FFMPEG_BINARY"]
    from moviepy import VideoFileClip, concatenate_videoclips

    output = new_output(args.output, ".mp4")
    parents = []
    pieces = []
    try:
        for item in args.clip:
            file, begin, end = item
            clip = VideoFileClip(str(existing_file(file)))
            parents.append(clip)
            low, high = float(begin), float(end)
            if not 0 <= low < high <= clip.duration:
                raise ValueError(f"Intervalo fuera del video: {file}")
            pieces.append(clip.subclipped(low, high))
        with concatenate_videoclips(pieces, method="compose") as montage:
            montage.write_videofile(str(output), codec="libx264", audio_codec="aac", pixel_format="yuv420p")
    finally:
        for clip in reversed(pieces + parents):
            clip.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(required=True)
    whisper = sub.add_parser("subtitular")
    whisper.add_argument("media")
    whisper.add_argument("--model", required=True)
    whisper.add_argument("--language", default="es")
    whisper.add_argument("--ffmpeg", help="FFmpeg disponible para decodificar el audio localmente")
    whisper.add_argument("--output", required=True)
    whisper.add_argument("--json")
    whisper.set_defaults(action=subtitles)
    denoise = sub.add_parser("limpiar-voz")
    denoise.add_argument("media")
    denoise.add_argument("--model")
    denoise.add_argument("--executable")
    denoise.add_argument("--ffmpeg")
    denoise.add_argument("--output", required=True)
    denoise.set_defaults(action=clean_voice)
    cutting = sub.add_parser("montar-python")
    cutting.add_argument("--ffmpeg", required=True)
    cutting.add_argument("--clip", action="append", nargs=3, required=True, metavar=("ARCHIVO", "INICIO", "FIN"))
    cutting.add_argument("--output", required=True)
    cutting.set_defaults(action=moviepy)
    args = parser.parse_args()
    try:
        args.action(args)
    except (ImportError, RuntimeError, OSError, ValueError, subprocess.SubprocessError) as error:
        parser.exit(2, f"Etapa pendiente: {error}\n")


if __name__ == "__main__":
    main()
