const fs = require('fs');
const path = require('path');
const PizZip = require('../calculadoraencofrados-alsina-tools-vc/node_modules/pizzip');
const { DOMParser } = require('../calculadoraencofrados-alsina-tools-vc/node_modules/xmldom');

const excelPath = path.join(__dirname, 'listado para calculo de contenedores por articulo.xlsx');
const content = fs.readFileSync(excelPath);
const zip = new PizZip(content);

console.log('Files in xlsx:');
Object.keys(zip.files).forEach(f => {
  if (f.startsWith('xl/')) console.log(' - ' + f);
});

// Let's read workbook.xml to see sheet names and ids
const wbXml = zip.file('xl/workbook.xml').asText();
console.log('\nWorkbook XML preview:\n', wbXml.substring(0, 1000));
