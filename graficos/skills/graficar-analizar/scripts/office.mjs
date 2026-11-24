import { escapeMarkup, finiteMetric, formatNumber, labelOf } from './model.mjs';

const crcTable = Uint32Array.from({ length: 256 }, (_, byte) => {
  let result = byte;
  for (let bit = 0; bit < 8; bit += 1) result = (result & 1) !== 0 ? 0xedb88320 ^ (result >>> 1) : result >>> 1;
  return result >>> 0;
});

function crc32(buffer) {
  let result = 0xffffffff;
  for (const byte of buffer) result = (result >>> 8) ^ crcTable[(result ^ byte) & 255];
  return (result ^ 0xffffffff) >>> 0;
}

function zip(entries) {
  const local = [];
  const central = [];
  let offset = 0;
  let centralSize = 0;
  for (const [name, text] of Object.entries(entries)) {
    const path = Buffer.from(name);
    const data = Buffer.from(text);
    const checksum = crc32(data);
    const file = Buffer.alloc(30);
    file.writeUInt32LE(0x04034b50, 0);
    file.writeUInt16LE(20, 4);
    file.writeUInt16LE(33, 12);
    file.writeUInt32LE(checksum, 14);
    file.writeUInt32LE(data.length, 18);
    file.writeUInt32LE(data.length, 22);
    file.writeUInt16LE(path.length, 26);
    const directory = Buffer.alloc(46);
    directory.writeUInt32LE(0x02014b50, 0);
    directory.writeUInt16LE(20, 4);
    directory.writeUInt16LE(20, 6);
    directory.writeUInt16LE(33, 14);
    directory.writeUInt32LE(checksum, 16);
    directory.writeUInt32LE(data.length, 20);
    directory.writeUInt32LE(data.length, 24);
    directory.writeUInt16LE(path.length, 28);
    directory.writeUInt32LE(offset, 42);
    central.push(directory, path);
    local.push(file, path, data);
    offset += file.length + path.length + data.length;
    centralSize += directory.length + path.length;
  }
  const count = Object.keys(entries).length;
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(count, 8);
  end.writeUInt16LE(count, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, ...central, end]);
}

const header = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const main = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const rel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const pkg = 'http://schemas.openxmlformats.org/package/2006/relationships';
const drawing = 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing';
const chart = 'http://schemas.openxmlformats.org/drawingml/2006/chart';
const drawMain = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const xml = (text) => escapeMarkup(String(text ?? '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFE\uFFFF]/g, ''));
const relEntry = (id, type, target) => '<Relationship Id="' + id + '" Type="' + rel + '/' + type + '" Target="' + target + '"/>';
const relations = (items) => header + '<Relationships xmlns="' + pkg + '">' + items.join('') + '</Relationships>';

function columnName(index) {
  let name = '';
  for (let current = index + 1; current; current = Math.floor((current - 1) / 26)) {
    name = String.fromCharCode(65 + (current - 1) % 26) + name;
  }
  return name;
}

function cell(value, index, row, formula) {
  const reference = columnName(index) + row;
  const opening = '<c r="' + reference + '"' + (row === 1 ? ' s="1"' : '');
  if (formula) return opening + '><f>' + xml(formula) + '</f><v>' + value + '</v></c>';
  if (typeof value === 'number') return opening + '><v>' + value + '</v></c>';
  if (typeof value === 'boolean') return opening + ' t="b"><v>' + Number(value) + '</v></c>';
  return opening + ' t="inlineStr"><is><t xml:space="preserve">' + xml(value) + '</t></is></c>';
}

function worksheet(rows, { drawingId, filtered = true, widths = [], columnCount = rows[0].length } = {}) {
  const body = rows.map((values, index) => '<row r="' + (index + 1) + '">'
    + values.map((value, col) => value && typeof value === 'object' ? cell(value.result, col, index + 1, value.formula) : cell(value, col, index + 1)).join('') + '</row>').join('');
  const columns = widths.map((width, index) => '<col min="' + (index + 1) + '" max="' + (index + 1) + '" width="' + width + '" customWidth="1"/>').join('');
  return header + '<worksheet xmlns="' + main + '" xmlns:r="' + rel + '"><dimension ref="A1:' + columnName(columnCount - 1) + rows.length
    + '"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
    + (columns ? '<cols>' + columns + '</cols>' : '') + '<sheetData>' + body + '</sheetData>'
    + (filtered ? '<autoFilter ref="A1:' + columnName(columnCount - 1) + rows.length + '"/>' : '')
    + (drawingId ? '<drawing r:id="' + drawingId + '"/>' : '') + '</worksheet>';
}

function chartXml(spec, groups) {
  const last = groups.length + 1;
  const point = (value, index) => '<c:pt idx="' + index + '"><c:v>' + xml(value) + '</c:v></c:pt>';
  const cache = (field) => groups.map((group, index) => point(group[field], index)).join('');
  const count = '<c:ptCount val="' + groups.length + '"/>';
  const type = spec.chartType === 'line' ? 'lineChart' : 'barChart';
  return header + '<c:chartSpace xmlns:c="' + chart + '" xmlns:a="' + drawMain + '" xmlns:r="' + rel + '"><c:lang val="es-MX"/><c:chart>'
    + '<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>' + xml(spec.title + ' · ' + spec.unit) + '</a:t></a:r></a:p></c:rich></c:tx><c:layout/></c:title>'
    + '<c:plotArea><c:layout/><c:' + type + '>' + (type === 'barChart' ? '<c:barDir val="col"/><c:grouping val="clustered"/>' : '<c:grouping val="standard"/>')
    + '<c:ser><c:idx val="0"/><c:order val="0"/><c:tx><c:strRef><c:f>Resumen!$B$1</c:f><c:strCache><c:ptCount val="1"/>' + point(spec.y, 0) + '</c:strCache></c:strRef></c:tx>'
    + '<c:cat><c:strRef><c:f>Resumen!$A$2:$A$' + last + '</c:f><c:strCache>' + count + cache('label') + '</c:strCache></c:strRef></c:cat>'
    + '<c:val><c:numRef><c:f>Resumen!$B$2:$B$' + last + '</c:f><c:numCache><c:formatCode>General</c:formatCode>' + count + cache('value')
    + '</c:numCache></c:numRef></c:val></c:ser><c:axId val="112"/><c:axId val="113"/></c:' + type + '>'
    + '<c:catAx><c:axId val="112"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:axPos val="b"/><c:crossAx val="113"/><c:crosses val="autoZero"/></c:catAx>'
    + '<c:valAx><c:axId val="113"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:axPos val="l"/><c:majorGridlines/><c:crossAx val="112"/><c:crosses val="autoZero"/></c:valAx>'
    + '</c:plotArea><c:plotVisOnly val="1"/></c:chart></c:chartSpace>';
}

export function workbook(spec, result) {
  if (spec.rows.length >= 1048576 || spec.columns.length > 16384) throw new Error('Los datos exceden la capacidad de una hoja XLSX.');
  const raw = [spec.columns, ...spec.rows.map((row) => spec.columns.map((key) => {
    if (key === spec.x) return labelOf(row[key]);
    if (key === spec.y) return finiteMetric(row[key], spec.decimal) ?? row[key];
    return row[key];
  }))];
  const firstColumn = columnName(spec.columns.indexOf(spec.x));
  const secondColumn = columnName(spec.columns.indexOf(spec.y));
  const range = (column) => 'Datos!$' + column + '$2:$' + column + '$' + raw.length;
  const dataCategory = range(firstColumn);
  const dataMetric = range(secondColumn);
  const summary = [[spec.x, spec.y, 'Registros'], ...result.groups.map((group, index) => [
    group.label,
    { result: group.value, formula: 'SUMPRODUCT(--EXACT(' + dataCategory + ',A' + (index + 2) + '),' + dataMetric + ')' },
    { result: group.count, formula: 'SUMPRODUCT(--EXACT(' + dataCategory + ',A' + (index + 2) + '),--ISNUMBER(' + dataMetric + '))' },
  ])];
  const lastGroup = summary.length;
  summary.push(['Total observado', { result: result.total, formula: 'SUM(B2:B' + lastGroup + ')' },
    { result: result.included.length, formula: 'SUM(C2:C' + lastGroup + ')' }]);
  const method = [
    ['Campo', 'Detalle'], ['Título', spec.title], ['Fuente', spec.source], ['Unidad', spec.unit], ['Dimensión', spec.x],
    ['Variable', spec.y], ['Filas de origen', spec.rows.length], ['Filas excluidas', result.omitted],
    ['Método', 'Suma de registros numéricos por categoría. El promedio usa los registros incluidos.'],
    ['Edición', 'Los valores y series se actualizan al editar celdas existentes. Para categorías nuevas o rangos ampliados, vuelve a generar el libro.'],
  ];
  const sheetDefinitions = ['Datos', 'Resumen', 'Metodología'];
  const contentTypes = header + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'
    + Object.entries({
      '/xl/workbook.xml': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml',
      '/xl/styles.xml': 'application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml',
      '/xl/worksheets/sheet1.xml': 'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml',
      '/xl/worksheets/sheet2.xml': 'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml',
      '/xl/worksheets/sheet3.xml': 'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml',
      '/xl/drawings/drawing1.xml': 'application/vnd.openxmlformats-officedocument.drawing+xml',
      '/xl/charts/chart1.xml': 'application/vnd.openxmlformats-officedocument.drawingml.chart+xml',
    }).map(([name, type]) => '<Override PartName="' + name + '" ContentType="' + type + '"/>').join('') + '</Types>';
  const book = header + '<workbook xmlns="' + main + '" xmlns:r="' + rel + '"><bookViews><workbookView activeTab="1"/></bookViews><sheets>'
    + sheetDefinitions.map((name, index) => '<sheet name="' + name + '" sheetId="' + (index + 1) + '" r:id="rId' + (index + 1) + '"/>').join('')
    + '</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>';
  const styles = header + '<styleSheet xmlns="' + main + '"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font>'
    + '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1755A3"/><bgColor indexed="64"/></patternFill></fill></fills>'
    + '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
  const chartDrawing = header + '<xdr:wsDr xmlns:xdr="' + drawing + '" xmlns:a="' + drawMain + '"><xdr:twoCellAnchor>'
    + '<xdr:from><xdr:col>4</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>1</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>'
    + '<xdr:to><xdr:col>15</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>24</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>'
    + '<xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="2" name="Gráfica editable"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr>'
    + '<xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm><a:graphic><a:graphicData uri="' + chart + '"><c:chart xmlns:c="' + chart + '" xmlns:r="' + rel + '" r:id="rId1"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor></xdr:wsDr>';
  return zip({
    '[Content_Types].xml': contentTypes,
    '_rels/.rels': relations([relEntry('rId1', 'officeDocument', 'xl/workbook.xml')]),
    'xl/workbook.xml': book,
    'xl/_rels/workbook.xml.rels': relations([
      ...sheetDefinitions.map((_, index) => relEntry('rId' + (index + 1), 'worksheet', 'worksheets/sheet' + (index + 1) + '.xml')),
      relEntry('rId4', 'styles', 'styles.xml'),
    ]),
    'xl/styles.xml': styles,
    'xl/worksheets/sheet1.xml': worksheet(raw, { widths: spec.columns.map((column) => Math.min(35, Math.max(12, column.length + 5))) }),
    'xl/worksheets/sheet2.xml': worksheet(summary, { widths: [26, 20, 15], drawingId: 'rId1', filtered: false }),
    'xl/worksheets/sheet3.xml': worksheet(method, { widths: [22, 100], filtered: false }),
    'xl/worksheets/_rels/sheet2.xml.rels': relations([relEntry('rId1', 'drawing', '../drawings/drawing1.xml')]),
    'xl/drawings/drawing1.xml': chartDrawing,
    'xl/drawings/_rels/drawing1.xml.rels': relations([relEntry('rId1', 'chart', '../charts/chart1.xml')]),
    'xl/charts/chart1.xml': chartXml(spec, result.groups),
  });
}

function pdfText(value) {
  return '(' + [...String(value).normalize('NFC').replace(/…/g, '...').replace(/[–—]/g, '-')]
    .map((character) => {
      const code = character.charCodeAt(0);
      if (code < 32 || code > 255) return '?';
      if ('()\\'.includes(character)) return '\\' + character;
      return code > 127 ? '\\' + code.toString(8).padStart(3, '0') : character;
    }).join('') + ')';
}

function wrap(text, limit) {
  const result = [];
  for (const line of String(text).split(/\r?\n/)) {
    let buffer = '';
    for (const rawWord of line.split(/\s+/).filter(Boolean)) {
      for (let offset = 0; offset < rawWord.length; offset += limit) {
        const word = rawWord.slice(offset, offset + limit);
        if (buffer && buffer.length + 1 + word.length > limit) {
          result.push(buffer);
          buffer = '';
        }
        buffer += (buffer ? ' ' : '') + word;
      }
    }
    if (buffer) result.push(buffer);
  }
  return result;
}

export function pdfReport(spec, result) {
  const objects = [];
  const build = (...items) => { objects.push(...items); return objects.length; };
  build('<< /Type /Catalog /Pages 2 0 R >>', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const pages = [];
  let commands = [];
  let y = 746;
  function textLine(text, x, height, size = 11, bold = false) {
    commands.push('BT /' + (bold ? 'F2' : 'F1') + ' ' + size + ' Tf 0.059 0.09 0.16 rg 1 0 0 1 ' + x + ' ' + height + ' Tm ' + pdfText(text) + ' Tj ET');
  }
  function finishPage() {
    textLine(String(pages.length + 1), 545, 33, 9);
    const content = commands.join('\n') + '\n';
    const stream = build('<< /Length ' + Buffer.byteLength(content) + ' >>\nstream\n' + content + 'endstream');
    pages.push(build('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ' + stream + ' 0 R >>'));
    commands = [];
    y = 746;
  }
  function paragraph(text, { width = 83, size = 11, bold = false, margin = 40 } = {}) {
    for (const line of wrap(text, width)) {
      if (y < 57) finishPage();
      textLine(line, margin, y, size, bold);
      y -= size + 5;
    }
  }
  paragraph(spec.title, { width: 50, size: 21, bold: true });
  paragraph('Fuente: ' + spec.source);
  paragraph('Total: ' + formatNumber(result.total) + ' ' + spec.unit + '   |   Registros: ' + result.included.length + '   |   Excluidos: ' + result.omitted);
  paragraph('Promedio por registro: ' + formatNumber(result.average) + ' ' + spec.unit);
  y -= 12;
  paragraph('Suma por ' + spec.x + ' · ' + spec.unit, { bold: true, size: 13 });
  const bars = result.groups.slice(0, 12);
  const max = bars.reduce((bound, group) => Math.max(bound, Math.abs(group.value)), 1);
  if (y < 330) finishPage();
  const hasNegative = bars.some((group) => group.value < 0);
  const baseline = hasNegative ? 337 : 199;
  const span = hasNegative ? 133 : 272;
  for (const group of bars) {
    const length = Math.max(1, Math.abs(group.value / max) * span);
    const start = group.value < 0 ? baseline - length : baseline;
    commands.push('0.09 0.33 0.64 rg ' + start.toFixed(2) + ' ' + (y - 5) + ' ' + length.toFixed(2) + ' 11 re f');
    textLine(group.label.length > 23 ? group.label.substring(0, 20) + '...' : group.label, 40, y - 2, 10);
    textLine(formatNumber(group.value), 478, y - 2, 10);
    y -= 23;
  }
  if (bars.length < result.groups.length) paragraph('La figura muestra ' + bars.length + ' categorías. La tabla incluye la lista completa.');
  y -= 14;
  paragraph('Detalle agregado', { bold: true, size: 13 });
  for (const row of result.groups) paragraph(row.label + ' · ' + formatNumber(row.value) + ' ' + spec.unit + ' · ' + row.count + ' registros');
  finishPage();
  objects[1] = '<< /Type /Pages /Kids [' + pages.map((id) => id + ' 0 R').join(' ') + '] /Count ' + pages.length + ' >>';
  let content = '%PDF-1.4\n';
  const offsets = [];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(content));
    content += (index + 1) + ' 0 obj\n' + object + '\nendobj\n';
  }
  const xref = Buffer.byteLength(content);
  content += 'xref\n0 ' + (objects.length + 1) + '\n0000000000 65535 f \n'
    + offsets.map((offset) => String(offset).padStart(10, '0') + ' 00000 n \n').join('')
    + 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n';
  return Buffer.from(content);
}

