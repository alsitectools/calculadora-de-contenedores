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

function parseSheetRows(sheetXmlPath, maxRows = 20) {
  const sheetDoc = parser.parseFromString(zip.file(sheetXmlPath).asText(), 'text/xml');
  const rows = sheetDoc.getElementsByTagName('row');
  const data = [];
  for (let r = 0; r < rows.length && r < maxRows; r++) {
    const rowEl = rows[r];
    const cells = rowEl.getElementsByTagName('c');
    const rowData = {};
    for (let c = 0; c < cells.length; c++) {
      const cellEl = cells[c];
      const ref = cellEl.getAttribute('r'); // e.g. "A1"
      const colLetter = ref.replace(/[0-9]/g, '');
      const type = cellEl.getAttribute('t');
      const vEl = cellEl.getElementsByTagName('v')[0];
      let val = vEl ? vEl.textContent : '';
      if (type === 's' && val !== '') {
        val = sharedStrings[parseInt(val, 10)];
      }
      rowData[colLetter] = val;
    }
    data.push(rowData);
  }
  return data;
}

console.log('=== TABLA 5 (Tipo de empaquetado - Sheet 2) ===');
const sheet2Rows = parseSheetRows('xl/worksheets/sheet2.xml', 100);
console.log(JSON.stringify(sheet2Rows, null, 2));

console.log('=== TABLA 4 (Sample first 15 rows - Sheet 1) ===');
const sheet1Rows = parseSheetRows('xl/worksheets/sheet1.xml', 15);
console.log(JSON.stringify(sheet1Rows, null, 2));
