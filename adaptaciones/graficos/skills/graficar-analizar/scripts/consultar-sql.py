#!/usr/bin/env python3
"""Consulta SQLite local de solo lectura sobre CSV, TSV o JSON sin requerir Node.js."""
import argparse
import csv
import io
import json
import math
import re
import sqlite3
import sys
from pathlib import Path

MAX_BYTES = 64 * 1024 * 1024
MAX_ROWS = 100_000
ALLOWED_FUNCTIONS = {
    "abs", "avg", "ceil", "ceiling", "coalesce", "concat", "concat_ws", "cos", "count",
    "cume_dist", "date", "datetime", "dense_rank", "exp", "first_value", "floor", "format",
    "glob", "group_concat", "hex", "ifnull", "iif", "instr", "julianday", "lag",
    "last_value", "length", "like", "ln", "log", "log10", "lower", "ltrim", "max", "min",
    "mod", "nth_value", "ntile", "nullif", "percent_rank", "pow", "power", "printf", "rank",
    "replace", "round", "row_number", "rtrim", "sin", "sqrt", "strftime", "string_agg",
    "substr", "substring", "sum", "time", "total", "trim", "trunc", "typeof", "unixepoch", "upper",
}


def ident(name):
    return '"' + name.replace('"', '""') + '"'


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


def read_local(path_str, limit=MAX_BYTES):
    if not path_str or path_str.startswith("//") or path_str.startswith("\\\\") or "://" in path_str:
        raise ValueError("Indica una ruta de archivo local.")
    p = Path(path_str).resolve(strict=True)
    if not p.is_file() or p.stat().st_size > limit:
        raise ValueError(f"El archivo no es regular o supera el límite: {p.name}")
    data = p.read_bytes()
    if len(data) > limit:
        raise ValueError("El archivo cambió de tamaño mientras se abría.")
    return p, data


def parse_separated(raw_bytes, explicit_delimiter=None):
    text = raw_bytes.decode("utf-8-sig")
    first_line = text.splitlines()[0] if text.splitlines() else ""
    if explicit_delimiter == "\\t":
        delim = "\t"
    elif explicit_delimiter:
        delim = explicit_delimiter
    elif "\t" in first_line:
        delim = "\t"
    elif ";" in first_line:
        delim = ";"
    else:
        delim = ","
    if delim not in (",", ";", "\t"):
        raise ValueError("El separador debe ser coma, punto y coma o tabulador.")
    reader = csv.reader(io.StringIO(text), delimiter=delim, strict=True)
    records = [row for row in reader if any(cell != "" for cell in row)]
    if not records:
        return []
    columns = [c.strip() for c in records[0]]
    if not columns or any(not c for c in columns) or len(set(columns)) != len(columns):
        raise ValueError("La primera fila debe contener nombres de columnas únicos y completos.")
    rows = []
    for idx, values in enumerate(records[1:], start=2):
        if len(values) > len(columns):
            raise ValueError(f"La fila {idx} supera el número de columnas.")
        row = {col: (values[i] if i < len(values) else None) for i, col in enumerate(columns)}
        rows.append(row)
    return rows


def load_table(name, path_str, numeric_cols, delimiter, decimal):
    p, raw = read_local(path_str)
    ext = p.suffix.lower()
    if ext == ".json":
        parsed = json.loads(raw.decode("utf-8-sig"))
        rows = parsed if isinstance(parsed, list) else (parsed.get("rows") if isinstance(parsed, dict) else None)
    elif ext in (".csv", ".tsv"):
        rows = parse_separated(raw, "\t" if ext == ".tsv" else delimiter)
    else:
        raise ValueError("Usa CSV, TSV o JSON. Para Parquet consulta la ruta DuckDB-Wasm local.")
    if not isinstance(rows, list) or not rows or len(rows) > MAX_ROWS or not all(isinstance(r, dict) for r in rows):
        raise ValueError("Cada tabla necesita entre 1 y 100,000 registros planos.")
    columns = []
    seen = set()
    for row in rows:
        for k in row.keys():
            if k not in seen:
                seen.add(k)
                columns.append(k)
    if not columns or len(columns) > 256 or any(not c or "\0" in c for c in columns) or len({c.lower() for c in columns}) != len(columns):
        raise ValueError("La tabla requiere de 1 a 256 columnas con nombres distintos.")
    num_set = set(numeric_cols)
    if not num_set.issubset(seen):
        raise ValueError(f"No existe una de las columnas numéricas solicitadas en {name}.")
    values = []
    for idx, row in enumerate(rows, start=1):
        rec = []
        for col in columns:
            val = row.get(col)
            if val is None:
                rec.append(None)
            elif col in num_set:
                num = finite_metric(val, decimal or ".")
                if num is None:
                    raise ValueError(f"Valor numérico inválido en {name}.{col}, registro {idx}.")
                rec.append(int(num) if num.is_integer() and abs(num) <= 9007199254740991 else num)
            elif isinstance(val, bool):
                rec.append(int(val))
            elif isinstance(val, (int, float)):
                if not math.isfinite(val):
                    raise ValueError(f"Valor no finito en {name}.{col}.")
                rec.append(val)
            elif isinstance(val, str):
                rec.append(val)
            else:
                raise ValueError(f"Usa valores planos en {name}.{col}.")
        values.append(rec)
    return {"name": name, "archivo": p.name, "registros": len(values), "columns": columns, "values": values}


def run_sql(tables, query):
    db = sqlite3.connect(":memory:")
    try:
        if hasattr(db, "enable_load_extension"):
            db.enable_load_extension(False)
        db.execute("PRAGMA temp_store=MEMORY")
        for t in tables:
            cols = ", ".join(ident(c) for c in t["columns"])
            db.execute(f"CREATE TABLE {ident(t['name'])} ({cols})")
            placeholders = ", ".join("?" for _ in t["columns"])
            db.executemany(f"INSERT INTO {ident(t['name'])} VALUES ({placeholders})", t["values"])
        db.commit()
        allowed_tables = {t["name"].lower() for t in tables}

        def authorize(action, first, second, database, scope):
            ok = (
                action == sqlite3.SQLITE_SELECT
                or (action == sqlite3.SQLITE_READ and database == "main" and (first or "").lower() in allowed_tables)
                or (action == sqlite3.SQLITE_FUNCTION and (second or "").lower() in ALLOWED_FUNCTIONS)
            )
            return sqlite3.SQLITE_OK if ok else sqlite3.SQLITE_DENY

        db.set_authorizer(authorize)
        cursor = db.execute(query)
        columns = [f[0] for f in (cursor.description or ())]
        if not columns or len({c.lower() for c in columns}) != len(columns):
            raise ValueError("La consulta debe devolver columnas con alias distintos.")
        rows = []
        for row in cursor:
            if len(rows) >= MAX_ROWS:
                raise ValueError("La consulta supera 100,000 resultados. Resume o agrega LIMIT.")
            vals = [str(v) if isinstance(v, int) and abs(v) > 9007199254740991 else v for v in row]
            rows.append(dict(zip(columns, vals)))
        return {"columns": columns, "rows": rows}
    finally:
        db.close()


def main():
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description="SQLite local de solo lectura para Gráficos")
    parser.add_argument("--input")
    parser.add_argument("--table", action="append", default=[])
    parser.add_argument("--numeric", action="append", default=[])
    parser.add_argument("--delimiter")
    parser.add_argument("--decimal", default=".")
    parser.add_argument("--sql")
    parser.add_argument("--sql-file")
    parser.add_argument("--config")
    parser.add_argument("--out")
    args = parser.parse_args()

    try:
        if not args.input or bool(args.sql) == bool(args.sql_file):
            raise ValueError("Indica --input y exactamente uno de --sql o --sql-file.")
        if args.decimal not in (".", ","):
            raise ValueError("El decimal debe ser punto o coma.")
        inputs = {"datos": args.input}
        for entry in args.table:
            m = re.match(r"^([a-z][a-z0-9_]*)=(.+)$", entry, re.I)
            if not m or m.group(1).lower() in inputs or m.group(1).lower().startswith("sqlite_"):
                raise ValueError("Usa --table nombre=archivo con nombres únicos.")
            inputs[m.group(1).lower()] = m.group(2)
        if len(inputs) > 8:
            raise ValueError("Puedes consultar hasta ocho archivos a la vez.")
        numeric_map = {k: [] for k in inputs}
        for entry in args.numeric:
            m = re.match(r"^([a-z][a-z0-9_]*)\.(.+)$", entry, re.I)
            if not m or m.group(1).lower() not in numeric_map:
                raise ValueError("Usa --numeric tabla.columna para una tabla cargada.")
            numeric_map[m.group(1).lower()].append(m.group(2))

        if args.sql:
            sql = args.sql
        else:
            _, sql_bytes = read_local(args.sql_file, 64 * 1024)
            sql = sql_bytes.decode("utf-8-sig")
        sql = sql.strip().rstrip(";").strip()
        if len(sql.encode("utf-8")) > 64 * 1024:
            raise ValueError("La consulta supera 64 KiB.")
        if not re.match(r"^(?:SELECT|WITH)\b", sql, re.I):
            raise ValueError("Usa una sola consulta SELECT o WITH de solo lectura.")

        tables = [load_table(n, path, numeric_map[n], args.delimiter, args.decimal) for n, path in inputs.items()]
        result = run_sql(tables, sql)
        metadata = {}
        if args.config:
            _, cfg_bytes = read_local(args.config, 4 * 1024 * 1024)
            cfg = json.loads(cfg_bytes.decode("utf-8-sig"))
            if not isinstance(cfg, dict):
                raise ValueError("La configuración debe ser un objeto JSON.")
            metadata = cfg

        record = {
            **metadata,
            **result,
            "procedencia": {
                "motor": "SQLite de Python",
                "tablas": [{k: t[k] for k in ("name", "archivo", "registros", "columns")} for t in tables],
                "consulta": sql,
            },
        }
        out_text = json.dumps(record, ensure_ascii=False, indent=2) + "\n"
        if args.out:
            out_path = Path(args.out).resolve()
            if out_path.suffix.lower() != ".json":
                raise ValueError("La salida debe ser un archivo JSON nuevo.")
            with out_path.open("x", encoding="utf-8") as fh:
                fh.write(out_text)
        else:
            sys.stdout.write(out_text)
    except Exception as exc:
        print(f"SQL local: {exc}", file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
