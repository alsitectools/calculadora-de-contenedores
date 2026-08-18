export interface ParsedRawItem {
  code: string;
  quantity: number;
  description: string;
  chapter: string;
  subChapter: string;
  rawLine?: string;
}

export interface ParseResult {
  fileType: 'CSV' | 'TXT' | 'RAW';
  fileName: string;
  items: ParsedRawItem[];
  warnings: string[];
}

function normalizeHeader(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Finds the column index for Article Description in a list of headers
 * Prioritizes "Nombre del Artículo en el Idioma del Cliente" and excludes client / commercial names
 */
function findArticleDescriptionIndex(headers: string[]): number {
  const normalized = headers.map(normalizeHeader);

  // 1. Exact / Full match for "Nombre del Artículo en el Idioma del Cliente"
  let idx = normalized.findIndex((h) =>
    h.includes('nombre del articulo en el idioma del cliente')
  );
  if (idx >= 0) return idx;

  // 2. Contains "nombre del articulo" or "descripcion del articulo"
  idx = normalized.findIndex((h) => {
    const isArticle =
      h.includes('nombre del articulo') ||
      h.includes('nombre articulo') ||
      h.includes('descripcion del articulo') ||
      h.includes('descripcion articulo') ||
      h.includes('descrip. articulo');
    const isExcluded =
      h.includes('cliente') ||
      h.includes('comercial') ||
      h.includes('capitulo') ||
      h.includes('obra');
    return isArticle && !isExcluded;
  });
  if (idx >= 0) return idx;

  // 3. Contains generic "descripcion" / "texto" / "concepto" (excluding chapter/client)
  idx = normalized.findIndex((h) => {
    const isDesc =
      h === 'descripcion' ||
      h === 'descrip' ||
      h === 'descripcion de elemento' ||
      h === 'texto' ||
      h === 'concepto';
    const isExcluded =
      h.includes('cliente') ||
      h.includes('comercial') ||
      h.includes('capitulo');
    return isDesc && !isExcluded;
  });
  if (idx >= 0) return idx;

  return -1;
}

/**
 * Parse CSV file content (typically semicolon separated, can also be comma or tab)
 * Col 0: Código
 * Col 1: Cantidad
 * Col 2: Descripción
 * Col 3: Capítulo
 * Col 4: Subcapítulo
 */
export function parseCSVContent(content: string, fileName = 'oferta.csv'): ParseResult {
  const lines = content.split(/\r?\n/);
  const items: ParsedRawItem[] = [];
  const warnings: string[] = [];

  // Determine delimiter: semicolon vs comma vs tab
  let delimiter = ';';
  const firstNonEmpty = lines.find((l) => l.trim().length > 0) || '';
  if (firstNonEmpty.includes(';') && firstNonEmpty.split(';').length >= 3) {
    delimiter = ';';
  } else if (firstNonEmpty.includes('\t')) {
    delimiter = '\t';
  } else if (firstNonEmpty.includes(',')) {
    delimiter = ',';
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Check if it's a header line (e.g. "codigo;cantidad;descripcion...")
    if (
      i === 0 &&
      (rawLine.toLowerCase().includes('codigo') ||
        rawLine.toLowerCase().includes('código') ||
        rawLine.toLowerCase().includes('articulo') ||
        rawLine.toLowerCase().includes('artículo'))
    ) {
      continue;
    }

    const parts = rawLine.split(delimiter).map((p) => p.trim());
    if (parts.length < 2) continue;

    const code = parts[0];
    const qtyStr = parts[1].replace(',', '.');
    const quantity = parseFloat(qtyStr);

    if (!code || isNaN(quantity) || quantity <= 0) {
      if (rawLine.length > 5) {
        warnings.push(`Línea ${i + 1} ignorada (código o cantidad no válida): "${rawLine}"`);
      }
      continue;
    }

    const description = parts[2] || '';
    const chapter = parts[3] || 'General';
    const subChapter = parts[4] || (parts[3] ? 'General' : 'Principal');

    items.push({
      code,
      quantity,
      description,
      chapter,
      subChapter,
      rawLine,
    });
  }

  return {
    fileType: 'CSV',
    fileName,
    items,
    warnings,
  };
}

/**
 * Parse TXT file content (ExportHemox or tab-delimited exports)
 */
export function parseTXTContent(content: string, fileName = 'export.txt'): ParseResult {
  const lines = content.split(/\r?\n/);
  const items: ParsedRawItem[] = [];
  const warnings: string[] = [];

  if (lines.length === 0) {
    return { fileType: 'TXT', fileName, items: [], warnings: ['El archivo está vacío'] };
  }

  // Look for header in the first few lines
  let headerIndex = -1;
  let delimiter = '\t';
  let colIdxCap = -1;
  let colIdxCapName = -1;
  let colIdxArt = -1;
  let colIdxQty = -1;
  let colIdxArtName = -1;

  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i];
    const testDelims = ['\t', ';', ','];
    for (const d of testDelims) {
      const rawHeaders = line.split(d).map((h) => h.trim());
      const normalized = rawHeaders.map(normalizeHeader);

      const cIdx = normalized.findIndex(
        (p) => p === 'capitulo' || p === 'capítulo' || p === 'cap.' || p === 'cap'
      );
      const aIdx = normalized.findIndex(
        (p) =>
          p === 'articulo' ||
          p === 'artículo' ||
          p === 'codigo' ||
          p === 'código' ||
          p === 'art.'
      );
      const qIdx = normalized.findIndex(
        (p) => p === 'cantidad' || p === 'cant' || p === 'cant.'
      );

      if (aIdx >= 0 && qIdx >= 0) {
        headerIndex = i;
        delimiter = d;
        colIdxCap = cIdx;
        colIdxCapName = normalized.findIndex(
          (p) =>
            p === 'nombre capitulo' ||
            p === 'nombre capítulo' ||
            p === 'nombre subcapitulo' ||
            p === 'subcapitulo' ||
            p === 'subcapítulo'
        );
        colIdxArt = aIdx;
        colIdxQty = qIdx;
        colIdxArtName = findArticleDescriptionIndex(rawHeaders);
        break;
      }
    }
    if (headerIndex >= 0) break;
  }

  // If header found, parse with header indices
  if (headerIndex >= 0 && colIdxArt >= 0 && colIdxQty >= 0) {
    for (let i = headerIndex + 1; i < lines.length; i++) {
      const rawLine = lines[i].trim();
      if (!rawLine) continue;
      const parts = lines[i].split(delimiter);

      const code = (parts[colIdxArt] || '').trim();
      const qtyStr = (parts[colIdxQty] || '0').replace(',', '.').trim();
      const quantity = parseFloat(qtyStr);

      if (!code || isNaN(quantity) || quantity <= 0) continue;

      const rawChapter = (colIdxCap >= 0 ? parts[colIdxCap] : 'General') || 'General';
      const rawChapterName = (colIdxCapName >= 0 ? parts[colIdxCapName] : '') || '';
      const description = (colIdxArtName >= 0 ? parts[colIdxArtName] : '') || '';

      const chapter = rawChapter.trim();
      const subChapter = rawChapterName.trim() || 'Principal';

      items.push({
        code,
        quantity,
        description: description.trim(),
        chapter,
        subChapter,
        rawLine,
      });
    }
  } else {
    // Fallback: parse as CSV or space/tab separated values
    return parseCSVContent(content, fileName);
  }

  return {
    fileType: 'TXT',
    fileName,
    items,
    warnings,
  };
}

/**
 * Auto-detect and parse any uploaded file (CSV, TXT, TSV)
 */
export function parseUploadedFile(content: string, fileName: string): ParseResult {
  const ext = fileName.toLowerCase().split('.').pop();
  if (ext === 'csv') {
    return parseCSVContent(content, fileName);
  } else if (ext === 'txt' || ext === 'tsv' || ext === 'tab') {
    return parseTXTContent(content, fileName);
  } else {
    // Attempt auto-detect
    if (content.includes('\t') && (content.includes('Capítulo') || content.includes('Artículo') || content.includes('Capitulo') || content.includes('Articulo'))) {
      return parseTXTContent(content, fileName);
    }
    return parseCSVContent(content, fileName);
  }
}
