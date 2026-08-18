const fs = require('fs');
const path = require('path');
const PizZip = require('../calculadoraencofrados-alsina-tools-vc/node_modules/pizzip');
const { DOMParser } = require('../calculadoraencofrados-alsina-tools-vc/node_modules/xmldom');

const excelPath = path.join(__dirname, 'listado para calculo de contenedores por articulo.xlsx');
const zip = new PizZip(fs.readFileSync(excelPath));
const parser = new DOMParser();

const sstDoc = parser.parseFromString(zip.file('xl/sharedStrings.xml').asText(), 'text/xml');
const siNodes = sstDoc.getElementsByTagName('si');
const sharedStrings = [];
for (let i = 0; i < siNodes.length; i++) {
  const tNodes = siNodes[i].getElementsByTagName('t');
  let str = '';
  for (let j = 0; j < tNodes.length; j++) str += tNodes[j].textContent || '';
  sharedStrings.push(str);
}

const sheetDoc = parser.parseFromString(zip.file('xl/worksheets/sheet1.xml').asText(), 'text/xml');
const rows = sheetDoc.getElementsByTagName('row');

const pkgTypeCounts = {};
let totalRows = 0;
let withQtyNoType = 0;
let withTypeNoQty = 0;
let withBoth = 0;
let withNeither = 0;

for (let r = 1; r < rows.length; r++) {
  totalRows++;
  const rowEl = rows[r];
  const cells = rowEl.getElementsByTagName('c');
  let code = '', pkgType = '', pkgQty = '';
  for (let c = 0; c < cells.length; c++) {
    const cellEl = cells[c];
    const ref = cellEl.getAttribute('r');
    const colLetter = ref.replace(/[0-9]/g, '');
    const type = cellEl.getAttribute('t');
    const vEl = cellEl.getElementsByTagName('v')[0];
    let val = vEl ? vEl.textContent : '';
    if (type === 's' && val !== '') val = sharedStrings[parseInt(val, 10)];
    if (colLetter === 'A') code = String(val).trim();
    else if (colLetter === 'B') pkgType = String(val).trim();
    else if (colLetter === 'C') pkgQty = String(val).trim();
  }
  if (pkgType && pkgQty) withBoth++;
  else if (pkgType && !pkgQty) withTypeNoQty++;
  else if (!pkgType && pkgQty) withQtyNoType++;
  else withNeither++;

  const key = pkgType || '(Sin tipo)';
  pkgTypeCounts[key] = (pkgTypeCounts[key] || 0) + 1;
}

console.log('Total rows in Tabla4:', totalRows);
console.log('With both Type & Qty:', withBoth);
console.log('With Type only:', withTypeNoQty);
console.log('With Qty only (No Type):', withQtyNoType);
console.log('With Neither:', withNeither);
console.log('\nBreakdown by pkgType ID:', pkgTypeCounts);
