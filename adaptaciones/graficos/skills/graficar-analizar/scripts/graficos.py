#!/usr/bin/env python3
"""Generador de tableros, SVG, XLSX, PDF, JSON y CSV en Python 3 sin dependencias (respaldo de graficos.mjs)."""
import argparse
import csv
import html
import io
import json
import math
import re
import sys
import zipfile
from pathlib import Path

PORTABLE_FORMATS = ("html", "xlsx", "pdf", "svg", "json", "csv")
SKILL_ROOT = Path(__file__).resolve().parent.parent


def finite_metric(value, decimal="."):
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value) if math.isfinite(value) else None
    if not isinstance(value, str) or not value.strip():
        return None
    norm = value.strip().replace(",", ".") if decimal == "," else value.strip()
    if not re.match(r"^[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:e[+-]?[0-9]+)?$", norm, re.I):
        return None
    num = float(norm)
    return num if math.isfinite(num) else None


def label_of(value):
    if value is None or value == "":
        return "(Sin dato)"
    return str(value)


def format_number(value):
    if value is None:
        return "Sin datos"
    if isinstance(value, int) or (isinstance(value, float) and value.is_integer()):
        return f"{int(value):,}"
    s = f"{value:,.6f}".rstrip("0").rstrip(".")
    return s


def csv_rows(text, explicit_delimiter=None):
    raw = text.lstrip("\ufeff")
    first_line = raw.splitlines()[0] if raw.splitlines() else ""
    delim = "\t" if explicit_delimiter == "\\t" else (explicit_delimiter or ("\t" if "\t" in first_line else (";" if ";" in first_line else ",")))
    if delim not in (",", ";", "\t"):
        raise ValueError("El separador debe ser coma, punto y coma o tabulador.")
    reader = csv.reader(io.StringIO(raw), delimiter=delim, strict=True)
    records = [r for r in reader if any(cell != "" for cell in r)]
    if not records:
        raise ValueError("El archivo separado está vacío.")
    columns = [str(c or "").strip() for c in records[0]]
    if not columns or any(not c for c in columns) or len(set(columns)) != len(columns):
        raise ValueError("La primera fila debe contener nombres de columnas únicos y completos.")
    out = []
    for idx, vals in enumerate(records[1:], start=2):
        if len(vals) > len(columns):
            raise ValueError(f"La fila {idx} supera el número de columnas.")
        out.append({col: (vals[i] if i < len(vals) else None) for i, col in enumerate(columns)})
    return out


def normalize_spec(raw):
    if not isinstance(raw, dict):
        raise ValueError("Se requiere una configuración JSON.")
    for field in ("title", "source", "unit", "x", "y"):
        if not isinstance(raw.get(field), str) or not raw[field].strip():
            raise ValueError(f"Falta el texto de «{field}».")
    rows = raw.get("rows")
    if not isinstance(rows, list) or not rows:
        raise ValueError("La tabla debe incluir registros.")
    if raw["x"] == raw["y"]:
        raise ValueError("La dimensión y la variable deben ser columnas distintas.")
    columns = []
    seen = set()
    for row in rows:
        if not isinstance(row, dict):
            raise ValueError("Cada registro debe ser un objeto plano.")
        for k, v in row.items():
            if v is not None and not isinstance(v, (str, int, float, bool)):
                raise ValueError(f"El campo «{k}» contiene un valor que no es una celda simple.")
            if isinstance(v, float) and not math.isfinite(v):
                raise ValueError(f"El campo «{k}» contiene un valor no finito.")
            if k not in seen:
                seen.add(k)
                columns.append(k)
    filters = list(dict.fromkeys([f for f in ([raw.get("group")] + list(raw.get("filters") or [])) if f]))
    for req in [raw["x"], raw["y"], raw.get("group"), raw.get("region"), raw.get("latitude"), raw.get("longitude"), *filters]:
        if req and req not in seen:
            raise ValueError(f"No existe la columna «{req}».")
    chart_type = raw.get("chartType") or "bar"
    if chart_type not in ("bar", "line"):
        raise ValueError("chartType debe ser bar o line.")
    decimal = raw.get("decimal") or "."
    if decimal not in (".", ","):
        raise ValueError("decimal debe ser punto o coma.")
    edges = []
    for e in raw.get("edges") or []:
        f_node = e.get("from") or e.get("source")
        t_node = e.get("to") or e.get("target")
        if not isinstance(f_node, str) or not f_node.strip() or not isinstance(t_node, str) or not t_node.strip():
            raise ValueError("edges debe incluir conexiones de texto from y to.")
        edges.append({"from": f_node, "to": t_node})
    spec = {**raw, "chartType": chart_type, "decimal": decimal, "edges": edges, "columns": columns, "filters": filters}
    res = analyze(spec)
    if not res["included"]:
        raise ValueError(f"La variable «{raw['y']}» no tiene valores numéricos válidos.")
    return spec, res


def analyze(spec):
    categories = {}
    included = []
    values = []
    minimum = None
    maximum = None
    for idx, row in enumerate(spec["rows"]):
        num = finite_metric(row.get(spec["y"]), spec["decimal"])
        if num is None:
            continue
        included.append(idx)
        values.append(num)
        minimum = num if minimum is None else min(minimum, num)
        maximum = num if maximum is None else max(maximum, num)
        cat = label_of(row.get(spec["x"]))
        categories.setdefault(cat, []).append(num)
    groups = [{"label": k, "value": math.fsum(v), "count": len(v)} for k, v in categories.items()]
    if spec["chartType"] == "line":
        groups.sort(key=lambda g: g["label"])
    total = math.fsum(values)
    avg = total / len(included) if included else None
    return {
        "groups": groups,
        "total": total,
        "included": included,
        "matched": len(spec["rows"]),
        "omitted": len(spec["rows"]) - len(included),
        "average": avg,
        "minimum": minimum,
        "maximum": maximum,
    }


def esc(val):
    return html.escape(str(val if val is not None else ""), quote=True)


def chart_svg(spec, result, width=960, height=460, limit=24):
    displayed = result["groups"][:limit]
    x0, right, top, bottom = 93, width - 34, 77, height - 104
    low = min([0.0] + [r["value"] for r in displayed])
    high = max([0.0] + [r["value"] for r in displayed])
    magnitude = max(1.0, abs(high), abs(low))
    scaled_low = low / magnitude
    span = (high / magnitude - scaled_low) or 1.0

    def vertical(v):
        return bottom - ((v / magnitude - scaled_low) / span) * (bottom - top)

    baseline = vertical(0.0)
    slot = (right - x0) / max(1, len(displayed))
    parts = [
        '<rect width="100%" height="100%" fill="#ffffff"/>',
        f'<text x="34" y="35" font-size="23" font-weight="700">{esc(spec["title"])}</text>',
        f'<text x="34" y="60" font-size="14" fill="#475569">{esc(spec["unit"])} · suma por {esc(spec["x"])}</text>',
    ]
    for i in range(5):
        v = (scaled_low + i / 4 * span) * magnitude
        y = vertical(v)
        parts.append(f'<line x1="{x0}" x2="{right}" y1="{y}" y2="{y}" stroke="#e2e8f0"/>')
        parts.append(f'<text x="{x0 - 10}" y="{y + 4}" text-anchor="end" font-size="12" fill="#475569">{esc(format_number(v))}</text>')
    parts.append(f'<line x1="{x0}" x2="{right}" y1="{baseline}" y2="{baseline}" stroke="#64748b"/>')
    if spec["chartType"] == "line" and len(displayed) > 1:
        pts = " ".join(f"{x0 + (i + 0.5) * slot},{vertical(r['value'])}" for i, r in enumerate(displayed))
        parts.append(f'<polyline points="{pts}" fill="none" stroke="#1755a3" stroke-width="3"/>')
    for i, r in enumerate(displayed):
        center = x0 + (i + 0.5) * slot
        bw = max(5.0, min(slot * 0.61, 72.0))
        cap = f"{r['label']}: {format_number(r['value'])} {spec['unit']}"
        y = vertical(r["value"])
        parts.append(f"<g><title>{esc(cap)}</title>")
        if spec["chartType"] == "line":
            parts.append(f'<circle cx="{center}" cy="{y}" r="5" fill="#1755a3"/>')
        else:
            parts.append(f'<rect x="{center - bw / 2}" y="{min(baseline, y)}" width="{bw}" height="{max(2.0, abs(baseline - y))}" fill="#1755a3"/>')
        lbl = r["label"] if len(r["label"]) <= 22 else r["label"][:20] + "…"
        parts.append(f'<text transform="translate({center} {bottom + 14}) rotate(-28)" text-anchor="end" font-size="12">{esc(lbl)}</text></g>')
    if not displayed:
        parts.append(f'<text x="{width / 2}" y="{height / 2}" text-anchor="middle">Sin observaciones para los filtros aplicados.</text>')
    parts.append(f'<text x="34" y="{height - 27}" font-size="12" fill="#475569">Fuente: {esc(spec["source"][:135])}</text>')
    if len(displayed) < len(result["groups"]):
        parts.append(f'<text x="34" y="{height - 9}" font-size="11" fill="#475569">Se muestran {len(displayed)} de {len(result["groups"])} categorías. El total incluye todas.</text>')
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}" '
        f'role="img" aria-label="{esc(spec["title"] + " · " + spec["unit"])}" font-family="system-ui, sans-serif" fill="#0f172a">'
        + "".join(parts) + "</svg>"
    )


def diagram_svg(edges):
    nodes = list(dict.fromkeys([n for e in edges for n in (e["from"], e["to"])]))[:48]
    if not nodes:
        return ""
    cols = min(4, max(1, math.ceil(math.sqrt(len(nodes)))))
    width = 270 * cols + 60
    height = math.ceil(len(nodes) / cols) * 110 + 64
    layout = {n: (135 + (i % cols) * 270, 60 + (i // cols) * 110) for i, n in enumerate(nodes)}
    conns = []
    for e in edges:
        if e["from"] not in layout or e["to"] not in layout:
            continue
        sx, sy = layout[e["from"]]
        ex, ey = layout[e["to"]]
        if e["from"] == e["to"]:
            conns.append(f'<path d="M{sx} {sy - 24} c70 -65 100 15 55 20" fill="none" stroke="#64748b" marker-end="url(#flecha)"/>')
        else:
            dist = math.hypot(ex - sx, ey - sy) or 1.0
            off = min(0.39, 90.0 / dist)
            x1, y1 = sx + (ex - sx) * off, sy + (ey - sy) * off
            x2, y2 = ex - (ex - sx) * off, ey - (ey - sy) * off
            conns.append(f'<path d="M{x1} {y1} L{x2} {y2}" stroke="#64748b" stroke-width="2" marker-end="url(#flecha)"/>')
    boxes = []
    for name, (x, y) in layout.items():
        short = name if len(name) <= 19 else name[:17] + "…"
        boxes.append(f'<g><title>{esc(name)}</title><rect x="{x - 82}" y="{y - 23}" width="164" height="46" rx="5" fill="#edf4fd" stroke="#4278ad"/><text x="{x}" y="{y + 5}" text-anchor="middle" font-size="14">{esc(short)}</text></g>')
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" font-family="system-ui, sans-serif" role="img" aria-label="Diagrama de relaciones">'
        '<defs><marker id="flecha" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#64748b"/></marker></defs>'
        '<rect width="100%" height="100%" fill="white"/>' + "".join(conns) + "".join(boxes) + "</svg>"
    )


def csv_text(columns, rows):
    def cell(v):
        s = "" if v is None else str(v)
        if isinstance(v, str) and re.match(r"^[\t\r\n ]*[=+\-@]", s):
            s = "'" + s
        return '"' + s.replace('"', '""') + '"'
    lines = [",".join(cell(c) for c in columns)]
    for row in rows:
        lines.append(",".join(cell(row.get(c)) for c in columns))
    return "\ufeff" + "\r\n".join(lines) + "\r\n"


def _strip_esm(js_source, keep_names):
    lines = []
    for line in js_source.splitlines():
        if line.startswith("import "):
            continue
        line = re.sub(r"^export\s+(?=(?:function|const|let)\b)", "", line)
        lines.append(line)
    # Remove any top-level functions we don't need if duplicated, or simply reuse model.mjs + dashboard.mjs cleanly
    text = "\n".join(lines)
    # Remove dashboardHtml from dashboard.mjs since Python builds the outer HTML shell
    text = re.sub(r"\nfunction dashboardHtml\b[\s\S]*$", "", text)
    return text


def dashboard_html(spec, engines_str):
    css = (SKILL_ROOT / "assets" / "dashboard.css").read_text(encoding="utf-8")
    model_js = _strip_esm((SKILL_ROOT / "scripts" / "model.mjs").read_text(encoding="utf-8"), None)
    dash_js = _strip_esm((SKILL_ROOT / "scripts" / "dashboard.mjs").read_text(encoding="utf-8"), None)
    adapters = []
    permitted = {"plotly": "plotly.cjs", "three": "three-surface.cjs"}
    for eng in dict.fromkeys(e.strip() for e in (engines_str or ",".join(spec.get("engines") or [])).split(",") if e.strip()):
        if eng not in permitted:
            raise ValueError(f"Motor HTML desconocido: {eng}")
        if eng == "three" and spec.get("surface") != "sine":
            raise ValueError('La opción three requiere surface: "sine" para esta plantilla.')
        vendor = SKILL_ROOT / "assets" / "vendor" / permitted[eng]
        adapters.append(vendor.read_text(encoding="utf-8").replace("</script", "<\\/script"))
    payload = json.dumps(spec, ensure_ascii=False).replace("<", "\\u003c")
    return f"""<!doctype html>
<html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(spec["title"])}</title><style>{css}</style></head><body>
<main>
<header><h1 id="titulo"></h1><p id="fuente"></p></header>
<section aria-labelledby="seleccion"><h2 id="seleccion">Explorar datos</h2>
<div id="filtros" class="controls"></div>
<div class="controls"><label>Escenario hipotético (% de variación)
<input id="variacion" type="number" step="1" min="-100" max="1000" value="0"></label>
<button id="reiniciar" type="button">Restablecer filtros</button></div>
<p id="estado" role="status"></p>
<p id="contexto-seleccion"></p>
<dl class="kpis">
<div><dt>Total observado</dt><dd id="total"></dd></div>
<div><dt>Promedio por registro</dt><dd id="promedio"></dd></div>
<div><dt>Registros incluidos</dt><dd id="observaciones"></dd></div>
<div><dt>Total hipotético</dt><dd id="escenario"></dd></div>
</dl>
<div id="figura" class="figure"></div>
<p><a href="#registros-origen">Ir a los registros de la selección</a></p>
<section id="plotly-seccion" hidden><h2>Exploración con Plotly.js</h2><div id="plotly" class="plotly"></div><div id="plotly-superficie" hidden></div></section>
</section>
<section id="mapa-seccion" hidden><h2>Mapa de los datos</h2><div id="mapa" class="figure"></div><p>Selecciona una región o punto para filtrar la gráfica y los registros. El fondo usa únicamente las geometrías aportadas.</p></section>
<section id="diagrama-seccion" hidden><h2>Relaciones</h2><div id="diagrama" class="figure"></div></section>
<section id="superficie" hidden><h2>Superficie matemática</h2>
<div class="controls"><label>Giro <input id="angulo" type="range" min="-180" max="180" value="33"></label>
<label>Amplitud <input id="amplitud" type="range" min="0" max="2" value="1" step="0.1"></label></div>
<p id="funcion"></p><canvas id="lienzo" width="780" height="410" role="img" aria-label="Proyección de la superficie matemática"></canvas>
<div id="three" hidden><p id="three-estado" role="status"></p></div>
</section>
<section aria-labelledby="registros-origen"><h2 id="registros-origen" tabindex="-1">Registros de origen</h2>
<p id="cobertura"></p>
<p id="detalle-nota"></p><div class="controls"><button id="descargar-csv" type="button">Descargar CSV filtrado</button>
<button id="descargar-auditoria" type="button">Descargar comprobación</button>
<button id="descargar-svg" type="button">Descargar gráfica SVG</button>
<button id="descargar-png" type="button">Descargar gráfica PNG</button></div>
<div class="table" tabindex="0" aria-label="Tabla de registros"><table><thead><tr id="encabezados"></tr></thead><tbody id="detalle"></tbody></table></div>
</section>
</main>
<script id="datos" type="application/json">{payload}</script>
<script>{";\n".join(adapters)}</script>
<script>{model_js}\n{dash_js}\ndashboardMain();</script>
</body></html>"""


def _col_name(idx):
    name = ""
    c = idx + 1
    while c:
        name = chr(65 + (c - 1) % 26) + name
        c = (c - 1) // 26
    return name


def _xml_clean(val):
    cleaned = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFE\uFFFF]", "", str(val if val is not None else ""))
    return html.escape(cleaned, quote=True)


def build_xlsx(spec, result):
    hdr = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    main_ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
    rel_ns = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
    pkg_ns = "http://schemas.openxmlformats.org/package/2006/relationships"
    draw_ns = "http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing"
    chart_ns = "http://schemas.openxmlformats.org/drawingml/2006/chart"
    a_ns = "http://schemas.openxmlformats.org/drawingml/2006/main"

    def cell_xml(v, col_idx, row_num):
        ref = _col_name(col_idx) + str(row_num)
        s = ' s="1"' if row_num == 1 else ""
        if isinstance(v, tuple) and len(v) == 2:
            return f'<c r="{ref}"{s}><f>{_xml_clean(v[1])}</f><v>{v[0]}</v></c>'
        if isinstance(v, bool):
            return f'<c r="{ref}"{s} t="b"><v>{int(v)}</v></c>'
        if isinstance(v, (int, float)):
            return f'<c r="{ref}"{s}><v>{v}</v></c>'
        return f'<c r="{ref}"{s} t="inlineStr"><is><t xml:space="preserve">{_xml_clean(v)}</t></is></c>'

    def sheet_xml(rows, widths, filtered=True, drawing_id=None):
        col_count = len(rows[0])
        cols_tag = "<cols>" + "".join(f'<col min="{i+1}" max="{i+1}" width="{w}" customWidth="1"/>' for i, w in enumerate(widths)) + "</cols>"
        body = "".join(f'<row r="{ri+1}">' + "".join(cell_xml(val, ci, ri + 1) for ci, val in enumerate(row)) + "</row>" for ri, row in enumerate(rows))
        af = f'<autoFilter ref="A1:{_col_name(col_count - 1)}{len(rows)}"/>' if filtered else ""
        drw = f'<drawing r:id="{drawing_id}"/>' if drawing_id else ""
        return (
            f'{hdr}<worksheet xmlns="{main_ns}" xmlns:r="{rel_ns}"><dimension ref="A1:{_col_name(col_count - 1)}{len(rows)}"/>'
            '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
            f'{cols_tag}<sheetData>{body}</sheetData>{af}{drw}</worksheet>'
        )

    raw_rows = [spec["columns"]]
    for row in spec["rows"]:
        out_r = []
        for k in spec["columns"]:
            if k == spec["x"]:
                out_r.append(label_of(row.get(k)))
            elif k == spec["y"]:
                m = finite_metric(row.get(k), spec["decimal"])
                out_r.append(m if m is not None else row.get(k))
            else:
                out_r.append(row.get(k))
        raw_rows.append(out_r)

    c1 = _col_name(spec["columns"].index(spec["x"]))
    c2 = _col_name(spec["columns"].index(spec["y"]))
    d_cat = f"Datos!${c1}$2:${c1}${len(raw_rows)}"
    d_met = f"Datos!${c2}$2:${c2}${len(raw_rows)}"
    summary = [[spec["x"], spec["y"], "Registros"]]
    for idx, g in enumerate(result["groups"], start=2):
        summary.append([
            g["label"],
            (g["value"], f"SUMPRODUCT(--EXACT({d_cat},A{idx}),{d_met})"),
            (g["count"], f"SUMPRODUCT(--EXACT({d_cat},A{idx}),--ISNUMBER({d_met}))"),
        ])
    last_g = len(summary)
    summary.append(["Total observado", (result["total"], f"SUM(B2:B{last_g})"), (len(result["included"]), f"SUM(C2:C{last_g})")])
    method = [
        ["Campo", "Detalle"], ["Título", spec["title"]], ["Fuente", spec["source"]], ["Unidad", spec["unit"]],
        ["Dimensión", spec["x"]], ["Variable", spec["y"]], ["Filas de origen", len(spec["rows"])],
        ["Filas excluidas", result["omitted"]],
        ["Método", "Suma de registros numéricos por categoría. El promedio usa los registros incluidos."],
        ["Edición", "Los valores y series se actualizan al editar celdas existentes."],
    ]

    last = len(result["groups"]) + 1
    ctype = "lineChart" if spec["chartType"] == "line" else "barChart"
    extra_chart = '<c:grouping val="standard"/>' if ctype == "lineChart" else '<c:barDir val="col"/><c:grouping val="clustered"/>'
    cats_pt = "".join(f'<c:pt idx="{i}"><c:v>{_xml_clean(g["label"])}</c:v></c:pt>' for i, g in enumerate(result["groups"]))
    vals_pt = "".join(f'<c:pt idx="{i}"><c:v>{g["value"]}</c:v></c:pt>' for i, g in enumerate(result["groups"]))
    cnt = f'<c:ptCount val="{len(result["groups"])}"/>'
    chart_xml = (
        f'{hdr}<c:chartSpace xmlns:c="{chart_ns}" xmlns:a="{a_ns}" xmlns:r="{rel_ns}"><c:lang val="es-MX"/><c:chart>'
        f'<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>{_xml_clean(spec["title"] + " · " + spec["unit"])}</a:t></a:r></a:p></c:rich></c:tx><c:layout/></c:title>'
        f'<c:plotArea><c:layout/><c:{ctype}>{extra_chart}<c:ser><c:idx val="0"/><c:order val="0"/>'
        f'<c:tx><c:strRef><c:f>Resumen!$B$1</c:f><c:strCache><c:ptCount val="1"/><c:pt idx="0"><c:v>{_xml_clean(spec["y"])}</c:v></c:pt></c:strCache></c:strRef></c:tx>'
        f'<c:cat><c:strRef><c:f>Resumen!$A$2:$A${last}</c:f><c:strCache>{cnt}{cats_pt}</c:strCache></c:strRef></c:cat>'
        f'<c:val><c:numRef><c:f>Resumen!$B$2:$B${last}</c:f><c:numCache><c:formatCode>General</c:formatCode>{cnt}{vals_pt}</c:numCache></c:numRef></c:val>'
        f'</c:ser><c:axId val="112"/><c:axId val="113"/></c:{ctype}>'
        '<c:catAx><c:axId val="112"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:axPos val="b"/><c:crossAx val="113"/><c:crosses val="autoZero"/></c:catAx>'
        '<c:valAx><c:axId val="113"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:axPos val="l"/><c:majorGridlines/><c:crossAx val="112"/><c:crosses val="autoZero"/></c:valAx>'
        '</c:plotArea><c:plotVisOnly val="1"/></c:chart></c:chartSpace>'
    )
    drawing_xml = (
        f'{hdr}<xdr:wsDr xmlns:xdr="{draw_ns}" xmlns:a="{a_ns}"><xdr:twoCellAnchor>'
        '<xdr:from><xdr:col>4</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>1</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>'
        '<xdr:to><xdr:col>15</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>24</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>'
        '<xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="2" name="Gráfica editable"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr>'
        f'<xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm><a:graphic><a:graphicData uri="{chart_ns}"><c:chart xmlns:c="{chart_ns}" xmlns:r="{rel_ns}" r:id="rId1"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor></xdr:wsDr>'
    )
    rels = lambda items: f'{hdr}<Relationships xmlns="{pkg_ns}">' + "".join(f'<Relationship Id="{i}" Type="{rel_ns}/{t}" Target="{tgt}"/>' for i, t, tgt in items) + "</Relationships>"
    overrides = {
        "/xl/workbook.xml": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml",
        "/xl/styles.xml": "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml",
        "/xl/worksheets/sheet1.xml": "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml",
        "/xl/worksheets/sheet2.xml": "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml",
        "/xl/worksheets/sheet3.xml": "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml",
        "/xl/drawings/drawing1.xml": "application/vnd.openxmlformats-officedocument.drawing+xml",
        "/xl/charts/chart1.xml": "application/vnd.openxmlformats-officedocument.drawingml.chart+xml",
    }
    ctypes = f'{hdr}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' + "".join(f'<Override PartName="{k}" ContentType="{v}"/>' for k, v in overrides.items()) + "</Types>"
    wb_xml = f'{hdr}<workbook xmlns="{main_ns}" xmlns:r="{rel_ns}"><bookViews><workbookView activeTab="1"/></bookViews><sheets><sheet name="Datos" sheetId="1" r:id="rId1"/><sheet name="Resumen" sheetId="2" r:id="rId2"/><sheet name="Metodología" sheetId="3" r:id="rId3"/></sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>'
    styles_xml = f'{hdr}<styleSheet xmlns="{main_ns}"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1755A3"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_STORED) as zf:
        zf.writestr("[Content_Types].xml", ctypes)
        zf.writestr("_rels/.rels", rels([("rId1", "officeDocument", "xl/workbook.xml")]))
        zf.writestr("xl/workbook.xml", wb_xml)
        zf.writestr("xl/_rels/workbook.xml.rels", rels([("rId1", "worksheet", "worksheets/sheet1.xml"), ("rId2", "worksheet", "worksheets/sheet2.xml"), ("rId3", "worksheet", "worksheets/sheet3.xml"), ("rId4", "styles", "styles.xml")]))
        zf.writestr("xl/styles.xml", styles_xml)
        zf.writestr("xl/worksheets/sheet1.xml", sheet_xml(raw_rows, [min(35, max(12, len(c) + 5)) for c in spec["columns"]]))
        zf.writestr("xl/worksheets/sheet2.xml", sheet_xml(summary, [26, 20, 15], filtered=False, drawing_id="rId1"))
        zf.writestr("xl/worksheets/sheet3.xml", sheet_xml(method, [22, 100], filtered=False))
        zf.writestr("xl/worksheets/_rels/sheet2.xml.rels", rels([("rId1", "drawing", "../drawings/drawing1.xml")]))
        zf.writestr("xl/drawings/drawing1.xml", drawing_xml)
        zf.writestr("xl/drawings/_rels/drawing1.xml.rels", rels([("rId1", "chart", "../charts/chart1.xml")]))
        zf.writestr("xl/charts/chart1.xml", chart_xml)
    return buf.getvalue()


def _pdf_text(val):
    s = str(val).replace("…", "...").replace("–", "-").replace("—", "-")
    out = []
    for ch in s:
        code = ord(ch)
        if code < 32 or code > 255:
            out.append("?")
        elif ch in ("(", ")", "\\"):
            out.append("\\" + ch)
        elif code > 127:
            out.append(f"\\{code:03o}")
        else:
            out.append(ch)
    return "(" + "".join(out) + ")"


def build_pdf(spec, result):
    objs = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    ]
    pages = []
    cmds = []
    y = 746

    def text_line(txt, x, h, size=11, bold=False):
        cmds.append(f"BT /{'F2' if bold else 'F1'} {size} Tf 0.059 0.09 0.16 rg 1 0 0 1 {x} {h} Tm {_pdf_text(txt)} Tj ET")

    def finish_page():
        nonlocal cmds, y
        text_line(str(len(pages) + 1), 545, 33, 9)
        content = "\n".join(cmds) + "\n"
        objs.append(f"<< /Length {len(content.encode('latin-1', 'replace'))} >>\nstream\n{content}endstream")
        stream_id = len(objs)
        objs.append(f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents {stream_id} 0 R >>")
        pages.append(len(objs))
        cmds = []
        y = 746

    def paragraph(txt, width=83, size=11, bold=False, margin=40):
        nonlocal y
        for raw_line in str(txt).splitlines() or [""]:
            buf = ""
            for word in raw_line.split():
                if buf and len(buf) + 1 + len(word) > width:
                    if y < 57:
                        finish_page()
                    text_line(buf, margin, y, size, bold)
                    y -= size + 5
                    buf = word
                else:
                    buf = f"{buf} {word}".strip()
            if buf:
                if y < 57:
                    finish_page()
                text_line(buf, margin, y, size, bold)
                y -= size + 5

    paragraph(spec["title"], width=50, size=21, bold=True)
    paragraph("Fuente: " + spec["source"])
    paragraph(f"Total: {format_number(result['total'])} {spec['unit']}   |   Registros: {len(result['included'])}   |   Excluidos: {result['omitted']}")
    paragraph(f"Promedio por registro: {format_number(result['average'])} {spec['unit']}")
    y -= 12
    paragraph(f"Suma por {spec['x']} · {spec['unit']}", size=13, bold=True)
    bars = result["groups"][:12]
    max_v = max([1.0] + [abs(g["value"]) for g in bars])
    if y < 330:
        finish_page()
    has_neg = any(g["value"] < 0 for g in bars)
    base, span = (337, 133) if has_neg else (199, 272)
    for g in bars:
        length = max(1.0, abs(g["value"] / max_v) * span)
        start = base - length if g["value"] < 0 else base
        cmds.append(f"0.09 0.33 0.64 rg {start:.2f} {y - 5} {length:.2f} 11 re f")
        lbl = g["label"] if len(g["label"]) <= 23 else g["label"][:20] + "..."
        text_line(lbl, 40, y - 2, 10)
        text_line(format_number(g["value"]), 478, y - 2, 10)
        y -= 23
    if len(bars) < len(result["groups"]):
        paragraph(f"La figura muestra {len(bars)} categorías. La tabla incluye la lista completa.")
    y -= 14
    paragraph("Detalle agregado", size=13, bold=True)
    for r in result["groups"]:
        paragraph(f"{r['label']} · {format_number(r['value'])} {spec['unit']} · {r['count']} registros")
    finish_page()
    objs[1] = "<< /Type /Pages /Kids [" + " ".join(f"{pid} 0 R" for pid in pages) + f"] /Count {len(pages)} >>"
    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for idx, obj in enumerate(objs, start=1):
        offsets.append(len(out))
        out.extend(f"{idx} 0 obj\n{obj}\nendobj\n".encode("latin-1", "replace"))
    xref = len(out)
    out.extend(f"xref\n0 {len(objs) + 1}\n0000000000 65535 f \n".encode("ascii"))
    for off in offsets:
        out.extend(f"{off:010d} 00000 n \n".encode("ascii"))
    out.extend(f"trailer\n<< /Size {len(objs) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode("ascii"))
    return bytes(out)


def main():
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description="Generador portable de Gráficos en Python 3")
    parser.add_argument("--input")
    parser.add_argument("--out")
    parser.add_argument("--config")
    parser.add_argument("--geojson")
    parser.add_argument("--formats", default=",".join(PORTABLE_FORMATS))
    parser.add_argument("--engines")
    args = parser.parse_args()

    try:
        if not args.input or not args.out:
            raise ValueError("Indica --input y --out.")
        formats = [f.strip() for f in args.formats.split(",") if f.strip()]
        if not formats or any(f not in PORTABLE_FORMATS for f in formats):
            raise ValueError("Formatos válidos en Python: " + ", ".join(PORTABLE_FORMATS))
        cfg = json.loads(Path(args.config).read_text(encoding="utf-8-sig")) if args.config else {}
        in_path = Path(args.input)
        ext = in_path.suffix.lower()
        if ext == ".json":
            decoded = json.loads(in_path.read_text(encoding="utf-8-sig"))
            raw_spec = {**cfg, "rows": decoded} if isinstance(decoded, list) else {**cfg, **decoded}
        elif ext in (".csv", ".tsv"):
            raw_spec = {**cfg, "rows": csv_rows(in_path.read_text(encoding="utf-8-sig"), "\t" if ext == ".tsv" else cfg.get("delimiter"))}
        else:
            raise ValueError("En el respaldo Python usa JSON, CSV o TSV (XLSX requiere Node.js + ExcelJS).")
        if args.geojson:
            raw_spec["locations"] = json.loads(Path(args.geojson).read_text(encoding="utf-8-sig"))
        spec, result = normalize_spec(raw_spec)
        out_dir = Path(args.out).resolve()
        out_dir.mkdir(parents=True, exist_ok=True)
        written = []
        fig = chart_svg(spec, result)
        if "html" in formats:
            (out_dir / "panel.html").write_text(dashboard_html(spec, args.engines), encoding="utf-8")
            written.append("panel.html")
        if "xlsx" in formats:
            (out_dir / "datos.xlsx").write_bytes(build_xlsx(spec, result))
            written.append("datos.xlsx")
        if "pdf" in formats:
            (out_dir / "resumen.pdf").write_bytes(build_pdf(spec, result))
            written.append("resumen.pdf")
        if "svg" in formats:
            (out_dir / "grafica.svg").write_text(fig, encoding="utf-8")
            written.append("grafica.svg")
            if spec["edges"]:
                (out_dir / "diagrama.svg").write_text(diagram_svg(spec["edges"]), encoding="utf-8")
                written.append("diagrama.svg")
        if "csv" in formats:
            (out_dir / "datos.csv").write_text(csv_text(spec["columns"], spec["rows"]), encoding="utf-8")
            written.append("datos.csv")
        if "json" in formats:
            dup_count = len(spec["rows"]) - len({json.dumps([r.get(c) for c in spec["columns"]], sort_keys=True) for r in spec["rows"]})
            analysis = {
                "title": spec["title"], "source": spec["source"], "unit": spec["unit"],
                "dimension": spec["x"], "variable": spec["y"],
                "method": "Suma por categoría; el promedio usa los registros con valor numérico válido.",
                "metrics": {"total": result["total"], "mean": result["average"], "min": result["minimum"], "max": result["maximum"]},
                "rows": {"original": len(spec["rows"]), "included": len(result["included"]), "excluded": result["omitted"], "repeated": dup_count},
                "groups": result["groups"],
            }
            scene = {
                "title": spec["title"], "source": spec["source"], "unit": spec["unit"],
                "x": spec["x"], "y": spec["y"], "chartType": spec["chartType"],
                "rows": [{spec["x"]: g["label"], spec["y"]: g["value"]} for g in result["groups"]],
            }
            (out_dir / "analisis.json").write_text(json.dumps(analysis, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            (out_dir / "escena.json").write_text(json.dumps(scene, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            written.extend(["analisis.json", "escena.json"])
        print(json.dumps({"output": str(out_dir), "files": written, "total": result["total"], "valid": len(result["included"]), "excluded": result["omitted"]}, ensure_ascii=False))
    except Exception as exc:
        print(f"Gráficos: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
