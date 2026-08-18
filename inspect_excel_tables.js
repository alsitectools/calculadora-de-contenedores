const fs = require('fs');
const path = require('path');
const PizZip = require('../calculadoraencofrados-alsina-tools-vc/node_modules/pizzip');
const { DOMParser } = require('../calculadoraencofrados-alsina-tools-vc/node_modules/xmldom');

const excelPath = path.join(__dirname, 'listado para calculo de contenedores por articulo.xlsx');
const content = fs.readFileSync(excelPath);
const zip = new PizZip(content);

const parser = new DOMParser();

// Read sharedStrings
const sstXml = zip.file('xl/sharedStrings.xml').asText();
const sstDoc = parser.parseFromString(sstXml, 'text/xml');
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
console.log('Total shared strings:', sharedStrings.length);

// Read sheets from workbook
const wbDoc = parser.parseFromString(zip.file('xl/workbook.xml').asText(), 'text/xml');
const sheets = wbDoc.getElementsByTagName('sheet');
for (let i = 0; i < sheets.length; i++) {
  console.log(`Sheet: name="${sheets[i].getAttribute('name')}", id="${sheets[i].getAttribute('sheetId')}", r:id="${sheets[i].getAttribute('r:id')}"`);
}

// Read tables
['xl/tables/table1.xml', 'xl/tables/table2.xml'].forEach(tPath => {
  if (zip.file(tPath)) {
    const tDoc = parser.parseFromString(zip.file(tPath).asText(), 'text/xml');
    const tableEl = tDoc.documentElement;
    console.log(`Table file: ${tPath}, name: "${tableEl.getAttribute('name')}", displayName: "${tableEl.getAttribute('displayName')}", ref: "${tableEl.getAttribute('ref')}"`);
    const cols = tDoc.getElementsByTagName('tableColumn');
    const colNames = [];
    for (let c = 0; c < cols.length; c++) {
      colNames.push(cols[c].getAttribute('name'));
    }
    console.log(' Columns:', colNames);
  }
});
