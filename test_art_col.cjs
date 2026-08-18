const fs = require('fs');
const path = require('path');

const txtPath = path.join(__dirname, 'ExportHemox_311000003499.txt');
const lines = fs.readFileSync(txtPath, 'utf8').split(/\r?\n/);
const header = lines[0].split('\t');

console.log('Total headers:', header.length);
header.forEach((h, i) => {
  console.log(`[${i}] ${h}`);
});

const parts = header.map(h => h.trim());

const findArticleNameIndex = (parts) => {
  let idx = parts.findIndex((p) => {
    const clean = p.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return clean.includes('nombre del articulo en el idioma del cliente');
  });
  if (idx >= 0) return idx;

  idx = parts.findIndex((p) => {
    const clean = p.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return (
      (clean.includes('nombre del articulo') || clean.includes('nombre articulo') || clean.includes('descripcion del articulo') || clean.includes('descripcion articulo')) &&
      !clean.includes('cliente') && !clean.includes('comercial')
    );
  });
  if (idx >= 0) return idx;

  idx = parts.findIndex((p) => {
    const clean = p.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return (
      (clean === 'descripcion' || clean === 'description' || clean === 'texto') &&
      !clean.includes('cliente') && !clean.includes('comercial') && !clean.includes('capitulo')
    );
  });
  if (idx >= 0) return idx;

  return -1;
};

const foundIdx = findArticleNameIndex(parts);
console.log('\nFound Article Name Index:', foundIdx, `("${header[foundIdx]}")`);

// Test line 1
const line1Parts = lines[1].split('\t');
console.log('Sample row article description:', line1Parts[foundIdx]);
