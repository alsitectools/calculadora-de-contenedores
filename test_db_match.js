const fs = require('fs');
const path = require('path');
const PizZip = require('../calculadoraencofrados-alsina-tools-vc/node_modules/pizzip');
const { DOMParser } = require('../calculadoraencofrados-alsina-tools-vc/node_modules/xmldom');

const excelPath = path.join(__dirname, 'listado para calculo de contenedores por articulo.xlsx');
const zip = new PizZip(fs.readFileSync(excelPath));
const parser = new DOMParser();

// Read sharedStrings
const sstDoc = parser.parseFromString(zip.file('xl/sharedStrings.xml').asText(), 'text/xml');
const siNodes = sstDoc.getElementsByTagName('si');
const sharedStrings = [];
for (let i = 0; i < siNodes.length; i++) {
  const tNodes = siNodes[i].getElementsByTagName('t');
  let str = '';
  for (let j = 0; j < tNodes.length; j++) {
    str += tNodes[j].textContent || '';
  }
  sharedStrings.push(str);
}

// Read sheet1
const sheetDoc = parser.parseFromString(zip.file('xl/worksheets/sheet1.xml').asText(), 'text/xml');
const rows = sheetDoc.getElementsByTagName('row');

const articlesDb = {}; // code -> { code, pkgType, pkgQty, name, family, ... }
let countWithPkg = 0;

for (let r = 1; r < rows.length; r++) { // skip header
  const rowEl = rows[r];
  const cells = rowEl.getElementsByTagName('c');
  let code = '', pkgType = '', pkgQty = '', name = '';
  for (let c = 0; c < cells.length; c++) {
    const cellEl = cells[c];
    const ref = cellEl.getAttribute('r');
    const colLetter = ref.replace(/[0-9]/g, '');
    const type = cellEl.getAttribute('t');
    const vEl = cellEl.getElementsByTagName('v')[0];
    let val = vEl ? vEl.textContent : '';
    if (type === 's' && val !== '') {
      val = sharedStrings[parseInt(val, 10)];
    }
    if (colLetter === 'A') code = String(val).trim();
    else if (colLetter === 'B') pkgType = String(val).trim();
    else if (colLetter === 'C') pkgQty = String(val).trim();
    else if (colLetter === 'D') name = String(val).trim();
  }
  if (code) {
    if (pkgType || pkgQty) countWithPkg++;
    articlesDb[code] = {
      code,
      pkgTypeId: pkgType ? parseInt(pkgType, 10) : null,
      pkgQty: pkgQty ? parseFloat(pkgQty) : null,
      name
    };
  }
}

console.log(`Total articles in DB: ${Object.keys(articlesDb).length}`);
console.log(`Articles with packaging defined: ${countWithPkg}`);

// Let's test items from CSV
const csvCodes = ['73036', '73041', '73079', '53886', '44117', '53303', '53302', '53059', '53701', '53923', '14022', '24605', '24603', '63330', '3490197', '33793', '33701', '33700', '44058', '33728', '87947'];
console.log('\n--- Testing sample CSV articles against DB ---');
csvCodes.forEach(code => {
  const item = articlesDb[code];
  console.log(`Code ${code}:`, item || 'NOT FOUND');
});

// Let's test items from TXT
const txtCodes = ['27682', '27681', '57560', '57902', '67100', '57923', '57689', '27610', '27828', '57924', '57321', '57427', '57307', '57480', '57900', '67053', '57300', '87947', '67312', '14022'];
console.log('\n--- Testing sample TXT articles against DB ---');
txtCodes.forEach(code => {
  const item = articlesDb[code];
  console.log(`Code ${code}:`, item || 'NOT FOUND');
});
