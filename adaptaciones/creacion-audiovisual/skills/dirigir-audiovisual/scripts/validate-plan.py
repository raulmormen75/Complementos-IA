#!/usr/bin/env python3
"""Valida planes de escena JSON sin requerir Node.js (equivalente a validate-plan.mjs)."""
import json
import math
import sys
from pathlib import Path


def _is_pos_int(v):
    return isinstance(v, int) and not isinstance(v, bool) and v > 0


def _is_text(v):
    return isinstance(v, str) and len(v.strip()) > 0


def validate_plan(plan):
    errors = []
    if not isinstance(plan, dict):
        return ["El plan debe ser un objeto."]
    for key in ("title", "intent", "audience"):
        if not _is_text(plan.get(key)):
            errors.append(f"{key}: texto requerido.")
    for key in ("width", "height", "durationInFrames"):
        if not _is_pos_int(plan.get(key)):
            errors.append(f"{key}: entero positivo requerido.")
    fps = plan.get("fps")
    if not (isinstance(fps, (int, float)) and not isinstance(fps, bool) and math.isfinite(fps) and 0 < fps <= 240):
        errors.append("fps: número mayor que cero y no mayor que 240.")
    scenes = plan.get("scenes")
    if not isinstance(scenes, list) or not scenes:
        errors.append("scenes: lista no vacía requerida.")
    else:
        end = 0
        ids = set()
        for i, scene in enumerate(scenes):
            label = f"scenes[{i}]"
            if not isinstance(scene, dict):
                errors.append(f"{label}: objeto requerido.")
                continue
            sid = scene.get("id")
            if not _is_text(sid) or sid in ids:
                errors.append(f"{label}.id: texto único requerido.")
            if isinstance(sid, str):
                ids.add(sid)
            for key in ("purpose", "visual", "sound"):
                if not _is_text(scene.get(key)):
                    errors.append(f"{label}.{key}: texto requerido (usar silencio si procede).")
            s_from = scene.get("from")
            if not (isinstance(s_from, int) and not isinstance(s_from, bool) and s_from >= 0):
                errors.append(f"{label}.from: entero no negativo requerido.")
            s_dur = scene.get("durationInFrames")
            if not _is_pos_int(s_dur):
                errors.append(f"{label}.durationInFrames: entero positivo requerido.")
            if s_from != end:
                errors.append(f"{label}: hueco, solapamiento o desorden; inicio esperado {end}.")
            if isinstance(s_from, int) and isinstance(s_dur, int):
                end = s_from + s_dur
        if end != plan.get("durationInFrames"):
            errors.append("La pista principal no coincide con durationInFrames.")
    assets = plan.get("assets")
    if not isinstance(assets, list):
        errors.append("assets: lista requerida, puede estar vacía.")
    else:
        for i, asset in enumerate(assets):
            if not isinstance(asset, dict):
                errors.append(f"assets[{i}]: objeto requerido.")
                continue
            for key in ("name", "origin", "rights"):
                if not _is_text(asset.get(key)):
                    errors.append(f"assets[{i}].{key}: texto requerido.")
    return errors


def main():
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    try:
        if len(sys.argv) < 2:
            raise ValueError("Uso: python3 validate-plan.py <plan.json>")
        raw = Path(sys.argv[1]).read_text(encoding="utf-8-sig")
        errors = validate_plan(json.loads(raw))
        print(json.dumps({
            "valid": len(errors) == 0,
            "errors": errors,
            "scope": "Estructura y tiempos de una pista principal. No verifica derechos, calidad, recursos ni exactitud factual.",
        }, ensure_ascii=False, indent=2))
        sys.exit(1 if errors else 0)
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
