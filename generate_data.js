const fs = require('fs');
const path = require('path');
const PizZip = require('../calculadoraencofrados-alsina-tools-vc/node_modules/pizzip');
const { DOMParser } = require('../calculadoraencofrados-alsina-tools-vc/node_modules/xmldom');

const excelPath = path.join(__dirname, 'listado para calculo de contenedores por articulo.xlsx');
const zip = new PizZip(fs.readFileSync(excelPath));
const parser = new DOMParser();

console.log('1. Reading sharedStrings...');
const sstDoc = parser.parseFromString(zip.file('xl/sharedStrings.xml').asText(), 'text/xml');
const siNodes = sstDoc.getElementsByTagName('si');
const sharedStrings = [];
for (let i = 0; i < siNodes.length; i++) {
  const tNodes = siNodes[i].getElementsByTagName('t');
  let str = '';
  for (let j = 0; j < tNodes.length; j++) str += tNodes[j].textContent || '';
  sharedStrings.push(str);
}
console.log(`Loaded ${sharedStrings.length} shared strings.`);

// 2. Read Tabla5 (Packaging types)
console.log('2. Extracting Tabla5 (Packaging types)...');
const sheet2Doc = parser.parseFromString(zip.file('xl/worksheets/sheet2.xml').asText(), 'text/xml');
const s2Rows = sheet2Doc.getElementsByTagName('row');
const packagingTypes = [];
const packagingTypesMap = {};

// Visual metadata for packaging types
const packagingMeta = {
  4: { icon: 'Package', color: 'indigo', category: 'Cubeta', label: 'CUBETA D/25' },
  5: { icon: 'Layers', color: 'amber', category: 'Palet', label: 'PALET 0,74 ALSI' },
  6: { icon: 'Box', color: 'emerald', category: 'Tacos', label: 'TACOS' },
  7: { icon: 'Layers', color: 'amber', category: 'Palet', label: 'PALET 0,98 ALSI,' },
  8: { icon: 'Grid', color: 'purple', category: 'Estantería', label: 'ESTANTERIA' },
  9: { icon: 'Tape', color: 'sky', category: 'Cinta', label: 'CINTA ADHESIVA' },
  10: { icon: 'Bucket', color: 'blue', category: 'Cubo', label: 'CUBO PLASTICO' },
  12: { icon: 'Container', color: 'blue', category: 'Contenedor', label: 'CONTENEDOR ALSI.' },
  13: { icon: 'ShoppingBag', color: 'teal', category: 'Saco', label: 'SACO 30X50 ALSI.' },
  14: { icon: 'ShoppingBag', color: 'teal', category: 'Saco', label: 'SACO 40X60 ALSI.' },
  15: { icon: 'Layers', color: 'amber', category: 'Palet', label: 'PALET' },
  18: { icon: 'Columns', color: 'rose', category: 'Portapuntal', label: 'PORTAPUNTAL' }
};

for (let r = 1; r < s2Rows.length; r++) {
  const cells = s2Rows[r].getElementsByTagName('c');
  let id = '', desc = '';
  for (let c = 0; c < cells.length; c++) {
    const ref = cells[c].getAttribute('r').replace(/[0-9]/g, '');
    const type = cells[c].getAttribute('t');
    const vEl = cells[c].getElementsByTagName('v')[0];
    let val = vEl ? vEl.textContent : '';
    if (type === 's' && val !== '') val = sharedStrings[parseInt(val, 10)];
    if (ref === 'A') id = String(val).trim();
    if (ref === 'B') desc = String(val).trim();
  }
  if (id) {
    const numId = parseInt(id, 10);
    const meta = packagingMeta[numId] || { icon: 'Package', color: 'slate', category: 'Envase' };
    const item = {
      id: numId,
      description: desc,
      category: meta.category,
      icon: meta.icon,
      color: meta.color
    };
    packagingTypes.push(item);
    packagingTypesMap[numId] = item;
  }
}

// 3. Read Tabla4 (Articles list)
console.log('3. Extracting Tabla4 (Articles list)...');
const sheet1Doc = parser.parseFromString(zip.file('xl/worksheets/sheet1.xml').asText(), 'text/xml');
const s1Rows = sheet1Doc.getElementsByTagName('row');

const articlesCatalog = {}; // code -> { code, pkgTypeId, pkgQty, name, family, subfam }
let processedCount = 0;

for (let r = 1; r < s1Rows.length; r++) {
  const cells = s1Rows[r].getElementsByTagName('c');
  let code = '', pkgType = '', pkgQty = '', name = '', family = '', subfam = '';
  for (let c = 0; c < cells.length; c++) {
    const ref = cells[c].getAttribute('r').replace(/[0-9]/g, '');
    const type = cells[c].getAttribute('t');
    const vEl = cells[c].getElementsByTagName('v')[0];
    let val = vEl ? vEl.textContent : '';
    if (type === 's' && val !== '') val = sharedStrings[parseInt(val, 10)];
    if (ref === 'A') code = String(val).trim();
    else if (ref === 'B') pkgType = String(val).trim();
    else if (ref === 'C') pkgQty = String(val).trim();
    else if (ref === 'D') name = String(val).trim();
    else if (ref === 'L') family = String(val).trim();
    else if (ref === 'M') subfam = String(val).trim();
  }
  if (code) {
    const numPkgType = pkgType ? parseInt(pkgType, 10) : null;
    const numPkgQty = pkgQty ? parseFloat(pkgQty) : null;
    articlesCatalog[code] = {
      c: code,
      p: numPkgType,
      q: numPkgQty,
      n: name || '',
      f: family || '',
      s: subfam || ''
    };
    processedCount++;
  }
}

console.log(`Extracted ${packagingTypes.length} packaging types.`);
console.log(`Extracted ${processedCount} articles.`);

// Create src/data directory
const dataDir = path.join(__dirname, 'src', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Write packagingTypes.json
fs.writeFileSync(
  path.join(dataDir, 'packagingTypes.json'),
  JSON.stringify(packagingTypes, null, 2),
  'utf8'
);

// Write articlesCatalog.json
fs.writeFileSync(
  path.join(dataDir, 'articlesCatalog.json'),
  JSON.stringify(articlesCatalog),
  'utf8'
);

console.log('Successfully written packagingTypes.json and articlesCatalog.json to src/data!');
