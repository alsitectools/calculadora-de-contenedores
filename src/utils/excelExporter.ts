import { GlobalProjectSummary, AddedProvisionalContainer } from '../types';

/**
 * Export to multi-sheet XML-based Excel (.xls)
 */
export function exportToExcel(
  project: GlobalProjectSummary,
  provisionalContainers?: Record<string, AddedProvisionalContainer[]>
) {
  let xml = `<?xml version="1.0" encoding="utf-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#831A26" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:FontName="Calibri" ss:Size="14" ss:Color="#831A26" ss:Bold="1"/>
  </Style>
  <Style ss:ID="Bold">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/>
  </Style>
  <Style ss:ID="Highlight">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#831A26" ss:Bold="1"/>
   <Interior ss:Color="#FDE8EA" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right"/>
  </Style>
  <Style ss:ID="Number">
   <NumberFormat ss:Format="#,##0"/>
   <Alignment ss:Horizontal="Right"/>
  </Style>
  <Style ss:ID="Percent">
   <NumberFormat ss:Format="0.0%"/>
   <Alignment ss:Horizontal="Right"/>
  </Style>
 </Styles>\n`;

  // --- 1. Resumen Global Sheet ---
  xml += ` <Worksheet ss:Name="Resumen Global">
  <Table>
   <Column ss:Width="250"/>
   <Column ss:Width="150"/>
   <Row><Cell ss:StyleID="Title"><Data ss:Type="String">Informe de Contenedores y Empaquetado Alsina</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Archivo analizado:</Data></Cell><Cell ss:StyleID="Bold"><Data ss:Type="String">${escapeXml(project.fileName)}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Total de capítulos/agrupaciones:</Data></Cell><Cell ss:StyleID="Number"><Data ss:Type="Number">${project.totalGroups}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Total de referencias únicas:</Data></Cell><Cell ss:StyleID="Number"><Data ss:Type="Number">${project.totalDistinctArticles}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Total de unidades / piezas ofertadas:</Data></Cell><Cell ss:StyleID="Number"><Data ss:Type="Number">${project.totalUnits}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Total de contenedores requeridos:</Data></Cell><Cell ss:StyleID="Highlight"><Data ss:Type="Number">${project.totalContainers}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Piezas contenerizadas:</Data></Cell><Cell ss:StyleID="Number"><Data ss:Type="Number">${project.containerizedUnits}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Piezas a granel (sin contenedor):</Data></Cell><Cell ss:StyleID="Number"><Data ss:Type="Number">${project.looseUnits}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Ocupación media calculada:</Data></Cell><Cell ss:StyleID="Percent"><Data ss:Type="Number">${(project.averageOccupancy / 100).toFixed(4)}</Data></Cell></Row>
   <Row></Row>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Tipología de Contenedor</Data></Cell>
    <Cell><Data ss:Type="String">Cantidad Total de Contenedores</Data></Cell>
   </Row>
`;

  Object.values(project.containersByType).forEach((ct) => {
    xml += `   <Row>
    <Cell><Data ss:Type="String">${escapeXml(ct.description)} (${escapeXml(ct.category)})</Data></Cell>
    <Cell ss:StyleID="Highlight"><Data ss:Type="Number">${ct.count}</Data></Cell>
   </Row>\n`;
  });

  xml += `  </Table>
 </Worksheet>\n`;

  // --- 2. Detalle de Artículos Sheet ---
  xml += ` <Worksheet ss:Name="Detalle de Artículos">
  <Table>
   <Column ss:Width="160"/>
   <Column ss:Width="160"/>
   <Column ss:Width="90"/>
   <Column ss:Width="260"/>
   <Column ss:Width="80"/>
   <Column ss:Width="110"/>
   <Column ss:Width="160"/>
   <Column ss:Width="80"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Capítulo</Data></Cell>
    <Cell><Data ss:Type="String">Subcapítulo</Data></Cell>
    <Cell><Data ss:Type="String">Código</Data></Cell>
    <Cell><Data ss:Type="String">Descripción</Data></Cell>
    <Cell><Data ss:Type="String">Cantidad</Data></Cell>
    <Cell><Data ss:Type="String">Estado</Data></Cell>
    <Cell><Data ss:Type="String">Contenedor Asignado</Data></Cell>
    <Cell><Data ss:Type="String">Uds/Contenedor</Data></Cell>
    <Cell><Data ss:Type="String">Contenedores Necesarios</Data></Cell>
    <Cell><Data ss:Type="String">% Ocupación</Data></Cell>
   </Row>
`;

  project.groups.forEach((grp) => {
    grp.items.forEach((item) => {
      xml += `   <Row>
    <Cell><Data ss:Type="String">${escapeXml(grp.chapter)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(grp.subChapter)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.code)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.description)}</Data></Cell>
    <Cell ss:StyleID="Number"><Data ss:Type="Number">${item.quantity}</Data></Cell>
    <Cell><Data ss:Type="String">${item.status === 'CONTAINERIZED' ? 'Con Contenedor' : item.status === 'LOOSE' ? 'Suelto' : 'No en Catálogo'}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.pkgTypeName)}</Data></Cell>
    <Cell ss:StyleID="Number"><Data ss:Type="${item.pkgQty ? 'Number' : 'String'}">${item.pkgQty ?? '-'}</Data></Cell>
    <Cell ss:StyleID="Highlight"><Data ss:Type="Number">${item.containersNeeded}</Data></Cell>
    <Cell ss:StyleID="Percent"><Data ss:Type="Number">${(item.occupancyRate / 100).toFixed(4)}</Data></Cell>
   </Row>\n`;
    });

    const addedContainers = provisionalContainers?.[grp.groupKey] || [];
    addedContainers.forEach((prov) => {
      xml += `   <Row>
    <Cell><Data ss:Type="String">${escapeXml(grp.chapter)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(grp.subChapter)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(prov.code)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(prov.description)}</Data></Cell>
    <Cell ss:StyleID="Number"><Data ss:Type="Number">${prov.quantity}</Data></Cell>
    <Cell><Data ss:Type="String">Contenedor Añadido</Data></Cell>
    <Cell><Data ss:Type="String">Contenedor Físico</Data></Cell>
    <Cell ss:StyleID="Number"><Data ss:Type="String">-</Data></Cell>
    <Cell ss:StyleID="Highlight"><Data ss:Type="Number">${prov.quantity}</Data></Cell>
    <Cell ss:StyleID="Percent"><Data ss:Type="Number">1.0000</Data></Cell>
   </Row>\n`;
    });
  });

  xml += `  </Table>
 </Worksheet>\n`;

  // --- 3. Por Capítulos Sheet ---
  xml += ` <Worksheet ss:Name="Por Capítulos">
  <Table>
   <Column ss:Width="180"/>
   <Column ss:Width="180"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="300"/>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Capítulo</Data></Cell>
    <Cell><Data ss:Type="String">Subcapítulo</Data></Cell>
    <Cell><Data ss:Type="String">Nº Artículos</Data></Cell>
    <Cell><Data ss:Type="String">Total Unidades</Data></Cell>
    <Cell><Data ss:Type="String">Total Contenedores</Data></Cell>
    <Cell><Data ss:Type="String">Desglose de Contenedores</Data></Cell>
   </Row>
`;

  project.groups.forEach((grp) => {
    const addedContainers = provisionalContainers?.[grp.groupKey] || [];
    const provCount = addedContainers.reduce((acc, c) => acc + c.quantity, 0);
    const totalConts = grp.totalContainers + provCount;

    const pkgBreakdown = Object.values(grp.containersByType)
      .map((c) => `${c.count}x ${c.description}`)
      .concat(addedContainers.map((p) => `${p.quantity}x ${p.description} (Añadido)`))
      .join(', ') || 'Ninguno (Material suelto)';

    xml += `   <Row>
    <Cell><Data ss:Type="String">${escapeXml(grp.chapter)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(grp.subChapter)}</Data></Cell>
    <Cell ss:StyleID="Number"><Data ss:Type="Number">${grp.totalArticles + addedContainers.length}</Data></Cell>
    <Cell ss:StyleID="Number"><Data ss:Type="Number">${grp.totalUnits}</Data></Cell>
    <Cell ss:StyleID="Highlight"><Data ss:Type="Number">${totalConts}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(pkgBreakdown)}</Data></Cell>
   </Row>\n`;
  });

  xml += `  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = project.fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `Calculo_Contenedores_${safeName}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeXml(str: string | undefined): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Export CSV
 * Formato: UTF-8 sin comillas separadoras (")
 * Columnas: Codigo;Qty;Descripcion;Nombre del Capitulo;Nombre del Subcapitulo
 * Incluye tanto artículos de la oferta como contenedores añadidos provisionalmente en cada capítulo.
 */
export function exportToCSV(
  project: GlobalProjectSummary,
  provisionalContainers?: Record<string, AddedProvisionalContainer[]>
) {
  let csv = '';

  project.groups.forEach((grp) => {
    // 1. Artículos regulares del capítulo
    grp.items.forEach((item) => {
      const cleanDesc = (item.description || '').replace(/[;\r\n]/g, ' ').trim();
      const cleanChapter = (grp.chapter || '').replace(/[;\r\n]/g, ' ').trim();
      const cleanSubChapter = (grp.subChapter || '').replace(/[;\r\n]/g, ' ').trim();

      const row = [
        item.code,
        item.quantity,
        cleanDesc,
        cleanChapter,
        cleanSubChapter,
      ];
      csv += row.join(';') + '\r\n';
    });

    // 2. Contenedores añadidos en este capítulo
    const addedContainers = provisionalContainers?.[grp.groupKey] || [];
    addedContainers.forEach((prov) => {
      const cleanDesc = (prov.description || '').replace(/[;\r\n]/g, ' ').trim();
      const cleanChapter = (grp.chapter || '').replace(/[;\r\n]/g, ' ').trim();
      const cleanSubChapter = (grp.subChapter || '').replace(/[;\r\n]/g, ' ').trim();

      const row = [
        prov.code,
        prov.quantity,
        cleanDesc,
        cleanChapter,
        cleanSubChapter,
      ];
      csv += row.join(';') + '\r\n';
    });
  });

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = project.fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `Calculo_Contenedores_${safeName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
