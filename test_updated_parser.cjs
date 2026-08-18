const fs = require('fs');
const path = require('path');

// Test the updated parser function
function normalizeHeader(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function findArticleDescriptionIndex(headers) {
  const normalized = headers.map(normalizeHeader);

  let idx = normalized.findIndex((h) =>
    h.includes('nombre del articulo en el idioma del cliente')
  );
  if (idx >= 0) return idx;

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

const txtContent = fs.readFileSync(path.join(__dirname, 'ExportHemox_311000003499.txt'), 'utf8');
const lines = txtContent.split(/\r?\n/);
const rawHeaders = lines[0].split('\t').map(h => h.trim());
const descIdx = findArticleDescriptionIndex(rawHeaders);
console.log('Article description column index:', descIdx, `("${rawHeaders[descIdx]}")`);

for (let i = 1; i <= 5; i++) {
  const p = lines[i].split('\t');
  console.log(`Row ${i}: Art=${p[12]}, Qty=${p[13]}, Desc="${p[descIdx]}"`);
}
