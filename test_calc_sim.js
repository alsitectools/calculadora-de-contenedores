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
  for (let j = 0; j < tNodes.length; j++) str += tNodes[j].textContent || '';
  sharedStrings.push(str);
}

// Read Tabla5 (Packaging Types)
const packagingTypes = {}; // id -> description
const sheet2Doc = parser.parseFromString(zip.file('xl/worksheets/sheet2.xml').asText(), 'text/xml');
const s2Rows = sheet2Doc.getElementsByTagName('row');
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
  if (id) packagingTypes[id] = desc;
}

// Read Tabla4 (Articles)
const articlesDb = {};
const sheet1Doc = parser.parseFromString(zip.file('xl/worksheets/sheet1.xml').asText(), 'text/xml');
const s1Rows = sheet1Doc.getElementsByTagName('row');
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
    articlesDb[code] = {
      code,
      pkgTypeId: pkgType ? parseInt(pkgType, 10) : null,
      pkgTypeName: pkgType && packagingTypes[pkgType] ? packagingTypes[pkgType] : (pkgType ? `Tipo ${pkgType}` : null),
      pkgQty: pkgQty ? parseFloat(pkgQty) : null,
      name,
      family,
      subfam
    };
  }
}

// 1. Process CSV
console.log('==============================================');
console.log('PROCESSING CSV: oferta_completa_Total1787034703.csv');
console.log('==============================================');

const csvContent = fs.readFileSync(path.join(__dirname, 'oferta_completa_Total1787034703.csv'), 'utf8');
const csvLines = csvContent.split(/\r?\n/).filter(l => l.trim().length > 0);

// Grouping by chapter + subchapter
const csvGroups = {}; // "capitulo > subcapitulo" -> { articles: { code: { code, name, qty } } }

csvLines.forEach((line, idx) => {
  const parts = line.split(';');
  if (parts.length < 2) return;
  const code = parts[0].trim();
  const qty = parseFloat(parts[1].trim().replace(',', '.')) || 0;
  const desc = (parts[2] || '').trim();
  const chapter = (parts[3] || 'Sin Capítulo').trim();
  const subChapter = (parts[4] || 'Sin Subcapítulo').trim();

  const groupKey = `${chapter} >> ${subChapter}`;
  if (!csvGroups[groupKey]) {
    csvGroups[groupKey] = { chapter, subChapter, items: {} };
  }
  if (!csvGroups[groupKey].items[code]) {
    csvGroups[groupKey].items[code] = { code, desc, qty: 0 };
  }
  csvGroups[groupKey].items[code].qty += qty;
});

// Run calculation per group
Object.keys(csvGroups).forEach(groupKey => {
  const grp = csvGroups[groupKey];
  console.log(`\n--- GRUPO: ${grp.chapter} | ${grp.subChapter} ---`);
  
  const containerTotals = {}; // pkgTypeName -> total containers needed
  let looseCount = 0;

  Object.values(grp.items).forEach(item => {
    const dbItem = articlesDb[item.code];
    const pkgTypeName = dbItem ? dbItem.pkgTypeName : null;
    const pkgQty = dbItem ? dbItem.pkgQty : null;

    if (pkgTypeName && pkgQty && pkgQty > 0) {
      const containersNeeded = Math.ceil(item.qty / pkgQty);
      const occupancy = ((item.qty / (containersNeeded * pkgQty)) * 100).toFixed(1);
      containerTotals[pkgTypeName] = (containerTotals[pkgTypeName] || 0) + containersNeeded;
      console.log(`  [OK] Art ${item.code} (${item.desc || (dbItem && dbItem.name)}): Cantidad = ${item.qty} | Envase: ${pkgTypeName} (Capacidad: ${pkgQty}/env) => Necesita: ${containersNeeded} envases (${occupancy}% ocup.)`);
    } else {
      looseCount++;
      const reason = !dbItem ? 'No en BD' : (!dbItem.pkgTypeId ? 'Sin tipo envase' : 'Sin capacidad');
      console.log(`  [--] Art ${item.code} (${item.desc || (dbItem && dbItem.name)}): Cantidad = ${item.qty} | [${reason}] (No requiere contenedor)`);
    }
  });

  console.log(`  >>> RESUMEN CONTENEDORES PARA ${groupKey}:`);
  if (Object.keys(containerTotals).length === 0) {
    console.log('      (Ningún artículo requiere contenedor)');
  } else {
    Object.entries(containerTotals).forEach(([type, count]) => {
      console.log(`      * ${type}: ${count} unidades`);
    });
  }
});

// 2. Process TXT
console.log('\n==============================================');
console.log('PROCESSING TXT: ExportHemox_311000003499.txt');
console.log('==============================================');

const txtContent = fs.readFileSync(path.join(__dirname, 'ExportHemox_311000003499.txt'), 'utf8');
const txtLines = txtContent.split(/\r?\n/).filter(l => l.trim().length > 0);
const txtHeader = txtLines[0].split('\t').map(h => h.trim());

const colIdxCap = txtHeader.indexOf('Capítulo');
const colIdxCapName = txtHeader.indexOf('Nombre Capítulo');
const colIdxArt = txtHeader.indexOf('Artículo');
const colIdxQty = txtHeader.indexOf('Cantidad');
const colIdxArtName = txtHeader.indexOf('Nombre del Artículo en el Idioma del Cliente');

console.log(`TXT Header Indices: Cap=${colIdxCap}, CapName=${colIdxCapName}, Art=${colIdxArt}, Qty=${colIdxQty}, ArtName=${colIdxArtName}`);

const txtGroups = {};

for (let i = 1; i < txtLines.length; i++) {
  const parts = txtLines[i].split('\t');
  if (parts.length < 5) continue;
  const chapter = (parts[colIdxCap] || 'General').trim();
  const chapterName = (colIdxCapName >= 0 ? parts[colIdxCapName] : '').trim();
  const code = (parts[colIdxArt] || '').trim();
  const qty = parseFloat((parts[colIdxQty] || '0').replace(',', '.')) || 0;
  const desc = (colIdxArtName >= 0 ? parts[colIdxArtName] : '').trim();

  const groupKey = chapterName ? `${chapter} (${chapterName})` : chapter;
  if (!txtGroups[groupKey]) {
    txtGroups[groupKey] = { chapter, chapterName, items: {} };
  }
  if (!txtGroups[groupKey].items[code]) {
    txtGroups[groupKey].items[code] = { code, desc, qty: 0 };
  }
  txtGroups[groupKey].items[code].qty += qty;
}

Object.keys(txtGroups).forEach(groupKey => {
  const grp = txtGroups[groupKey];
  console.log(`\n--- GRUPO TXT: ${groupKey} ---`);
  const containerTotals = {};

  Object.values(grp.items).forEach(item => {
    const dbItem = articlesDb[item.code];
    const pkgTypeName = dbItem ? dbItem.pkgTypeName : null;
    const pkgQty = dbItem ? dbItem.pkgQty : null;

    if (pkgTypeName && pkgQty && pkgQty > 0) {
      const containersNeeded = Math.ceil(item.qty / pkgQty);
      const occupancy = ((item.qty / (containersNeeded * pkgQty)) * 100).toFixed(1);
      containerTotals[pkgTypeName] = (containerTotals[pkgTypeName] || 0) + containersNeeded;
      console.log(`  [OK] Art ${item.code} (${item.desc || (dbItem && dbItem.name)}): Cantidad = ${item.qty} | Envase: ${pkgTypeName} (Capacidad: ${pkgQty}/env) => Necesita: ${containersNeeded} (${occupancy}% ocup.)`);
    } else {
      const reason = !dbItem ? 'No en BD' : (!dbItem.pkgTypeId ? 'Sin tipo envase' : 'Sin capacidad');
      console.log(`  [--] Art ${item.code} (${item.desc || (dbItem && dbItem.name)}): Cantidad = ${item.qty} | [${reason}]`);
    }
  });

  console.log(`  >>> RESUMEN CONTENEDORES PARA ${groupKey}:`);
  if (Object.keys(containerTotals).length === 0) {
    console.log('      (Ningún artículo requiere contenedor)');
  } else {
    Object.entries(containerTotals).forEach(([type, count]) => {
      console.log(`      * ${type}: ${count} unidades`);
    });
  }
});
