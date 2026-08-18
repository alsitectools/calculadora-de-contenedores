const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'oferta_completa_Total1787034703.csv');
const txtPath = path.join(__dirname, 'ExportHemox_311000003499.txt');

const csvContent = fs.readFileSync(csvPath, 'utf8');
const txtContent = fs.readFileSync(txtPath, 'utf8');

const fileCode = `// Preloaded sample files for instant 1-click testing
export const sampleCSVName = 'oferta_completa_Total1787034703.csv';
export const sampleCSVContent = ${JSON.stringify(csvContent)};

export const sampleTXTName = 'ExportHemox_311000003499.txt';
export const sampleTXTContent = ${JSON.stringify(txtContent)};
`;

fs.writeFileSync(path.join(__dirname, 'src', 'data', 'sampleFiles.ts'), fileCode, 'utf8');
console.log('sampleFiles.ts generated successfully!');
