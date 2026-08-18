import {
  PackagingType,
  CatalogArticle,
  CalculatedItem,
  GroupSummary,
  GlobalProjectSummary,
  GroupingMode,
} from '../types';
import defaultPackagingTypes from '../data/packagingTypes.json';
import defaultArticlesCatalog from '../data/articlesCatalog.json';
import { ParsedRawItem } from './fileParsers';

// Cache for packaging types
const packagingTypesMap: Record<number, PackagingType> = {};
(defaultPackagingTypes as PackagingType[]).forEach((pt) => {
  packagingTypesMap[pt.id] = pt;
});

// Articles catalog typed reference
const articlesCatalogMap: Record<string, CatalogArticle> = defaultArticlesCatalog as any;

export function getPackagingType(id: number | null): PackagingType | null {
  if (!id) return null;
  return packagingTypesMap[id] || null;
}

export function getArticleFromCatalog(code: string): CatalogArticle | null {
  const cleanCode = String(code).trim();
  return articlesCatalogMap[cleanCode] || null;
}

export function getAllPackagingTypes(): PackagingType[] {
  return defaultPackagingTypes as PackagingType[];
}

/**
 * Calculate containerization for parsed items
 */
export function calculateProjectContainers(
  rawItems: ParsedRawItem[],
  fileName = 'archivo.csv',
  fileType: 'CSV' | 'TXT' = 'CSV',
  groupingMode: GroupingMode = 'CHAPTER_AND_SUBCHAPTER',
  enabledPackagingTypeIds?: number[]
): GlobalProjectSummary {
  // 1. Group raw items according to grouping mode and sum quantities for same code
  interface InternalGroup {
    groupKey: string;
    chapter: string;
    subChapter: string;
    itemsMap: Record<string, { code: string; description: string; quantity: number }>;
  }

  const groupsMap: Record<string, InternalGroup> = {};

  for (const item of rawItems) {
    let groupKey = '';
    let chapter = item.chapter || 'General';
    let subChapter = item.subChapter || 'Principal';

    if (groupingMode === 'CHAPTER_AND_SUBCHAPTER') {
      groupKey = `${chapter} >> ${subChapter}`;
    } else if (groupingMode === 'CHAPTER_ONLY') {
      groupKey = chapter;
      subChapter = '';
    } else {
      groupKey = 'Total Proyecto Consolidado';
      chapter = 'Todo el Proyecto';
      subChapter = 'Consolidado General';
    }

    if (!groupsMap[groupKey]) {
      groupsMap[groupKey] = {
        groupKey,
        chapter,
        subChapter,
        itemsMap: {},
      };
    }

    const code = String(item.code).trim();
    if (!groupsMap[groupKey].itemsMap[code]) {
      groupsMap[groupKey].itemsMap[code] = {
        code,
        description: item.description || '',
        quantity: 0,
      };
    }

    groupsMap[groupKey].itemsMap[code].quantity += item.quantity;
    if (!groupsMap[groupKey].itemsMap[code].description && item.description) {
      groupsMap[groupKey].itemsMap[code].description = item.description;
    }
  }

  // 2. Calculate containers per group
  const calculatedGroups: GroupSummary[] = [];
  const globalContainersByType: GlobalProjectSummary['containersByType'] = {};

  let globalTotalUnits = 0;
  let globalTotalContainers = 0;
  let globalContainerizedUnits = 0;
  let globalLooseUnits = 0;
  let globalDistinctArticlesSet = new Set<string>();
  let totalOccupancyWeightedSum = 0;
  let totalOccupancyWeightCount = 0;

  for (const grp of Object.values(groupsMap)) {
    const calculatedItems: CalculatedItem[] = [];
    const groupContainersByType: GroupSummary['containersByType'] = {};
    let groupTotalUnits = 0;
    let groupContainerizedArticles = 0;
    let groupLooseArticles = 0;
    let groupTotalContainers = 0;

    for (const raw of Object.values(grp.itemsMap)) {
      const code = raw.code;
      const qty = raw.quantity;
      globalDistinctArticlesSet.add(code);
      groupTotalUnits += qty;
      globalTotalUnits += qty;

      const dbItem = getArticleFromCatalog(code);
      const description = raw.description || (dbItem ? dbItem.n : `Artículo ${code}`);

      if (!dbItem) {
        // Not in catalog
        groupLooseArticles++;
        globalLooseUnits += qty;
        calculatedItems.push({
          code,
          description,
          quantity: qty,
          pkgTypeId: null,
          pkgTypeName: 'No catalogado',
          pkgCategory: 'Desconocido',
          pkgIcon: 'HelpCircle',
          pkgColor: 'slate',
          pkgQty: null,
          containersNeeded: 0,
          fullContainers: 0,
          remainingUnits: 0,
          occupancyRate: 0,
          status: 'NOT_IN_DB',
          notes: 'Referencia no encontrada en el catálogo maestro',
        });
        continue;
      }

      const pkgTypeId = dbItem.p;
      const pkgQty = dbItem.q;
      const pkgType = getPackagingType(pkgTypeId);
      const isPkgEnabled = !enabledPackagingTypeIds || (pkgTypeId !== null && enabledPackagingTypeIds.includes(pkgTypeId));

      if (pkgTypeId && pkgType && pkgQty && pkgQty > 0 && isPkgEnabled) {
        // Containerized article
        const containersNeeded = Math.ceil(qty / pkgQty);
        const fullContainers = Math.floor(qty / pkgQty);
        const remainingUnits = qty % pkgQty;
        const totalCapacity = containersNeeded * pkgQty;
        const occupancyRate = Math.round((qty / totalCapacity) * 10000) / 100;

        groupContainerizedArticles++;
        globalContainerizedUnits += qty;
        groupTotalContainers += containersNeeded;
        globalTotalContainers += containersNeeded;

        totalOccupancyWeightedSum += occupancyRate * containersNeeded;
        totalOccupancyWeightCount += containersNeeded;

        const calculatedItem: CalculatedItem = {
          code,
          description,
          quantity: qty,
          pkgTypeId,
          pkgTypeName: pkgType.description,
          pkgCategory: pkgType.category,
          pkgIcon: pkgType.icon,
          pkgColor: pkgType.color,
          pkgQty,
          containersNeeded,
          fullContainers,
          remainingUnits,
          occupancyRate,
          status: 'CONTAINERIZED',
        };
        calculatedItems.push(calculatedItem);

        // Add to group container summary
        const typeKey = pkgType.description;
        if (!groupContainersByType[typeKey]) {
          groupContainersByType[typeKey] = {
            count: 0,
            pkgTypeId,
            description: pkgType.description,
            category: pkgType.category,
            icon: pkgType.icon,
            color: pkgType.color,
            totalUnitsPacked: 0,
            articles: [],
          };
        }
        groupContainersByType[typeKey].count += containersNeeded;
        groupContainersByType[typeKey].totalUnitsPacked += qty;
        groupContainersByType[typeKey].articles.push(code);

        // Add to global container summary
        if (!globalContainersByType[typeKey]) {
          globalContainersByType[typeKey] = {
            count: 0,
            pkgTypeId,
            description: pkgType.description,
            category: pkgType.category,
            icon: pkgType.icon,
            color: pkgType.color,
            totalUnitsPacked: 0,
            articlesCount: 0,
            articlesList: [],
          };
        }
        globalContainersByType[typeKey].count += containersNeeded;
        globalContainersByType[typeKey].totalUnitsPacked += qty;
        globalContainersByType[typeKey].articlesCount += 1;
        globalContainersByType[typeKey].articlesList.push({
          code,
          description,
          quantity: qty,
          containersNeeded,
          pkgQty,
        });
      } else {
        // Loose / no packaging (or packaging type disabled by user filter)
        groupLooseArticles++;
        globalLooseUnits += qty;

        calculatedItems.push({
          code,
          description,
          quantity: qty,
          pkgTypeId: null,
          pkgTypeName: 'Sin contenedor (Suelto)',
          pkgCategory: 'Suelto',
          pkgIcon: 'PackageOpen',
          pkgColor: 'amber',
          pkgQty: null,
          containersNeeded: 0,
          fullContainers: 0,
          remainingUnits: 0,
          occupancyRate: 0,
          status: 'LOOSE',
          notes: 'Elemento suelto / Sin contenedor',
        });
      }
    }

    // Compute group optimization proposal (combining fractional containers for same packaging type)
    const byPackagingType: GroupSummary['optimization']['byPackagingType'] = {};
    let groupOptimizedContainers = 0;

    for (const item of calculatedItems) {
      if (item.status === 'CONTAINERIZED' && item.pkgTypeId && item.pkgQty && item.pkgQty > 0) {
        const typeKey = item.pkgTypeName;
        if (!byPackagingType[typeKey]) {
          byPackagingType[typeKey] = {
            pkgTypeId: item.pkgTypeId,
            description: item.pkgTypeName,
            standardCount: 0,
            optimizedCount: 0,
            savedCount: 0,
            fractionalTotal: 0,
            items: [],
          };
        }
        const fractional = Math.round((item.quantity / item.pkgQty) * 1000) / 1000;
        byPackagingType[typeKey].standardCount += item.containersNeeded;
        byPackagingType[typeKey].fractionalTotal += item.quantity / item.pkgQty;
        byPackagingType[typeKey].items.push({
          code: item.code,
          description: item.description,
          quantity: item.quantity,
          pkgQty: item.pkgQty,
          fractional,
        });
      }
    }

    for (const pInfo of Object.values(byPackagingType)) {
      pInfo.optimizedCount = Math.ceil(pInfo.fractionalTotal);
      pInfo.savedCount = Math.max(0, pInfo.standardCount - pInfo.optimizedCount);
      pInfo.fractionalTotal = Math.round(pInfo.fractionalTotal * 100) / 100;
      groupOptimizedContainers += pInfo.optimizedCount;
    }

    const groupSavedContainers = Math.max(0, groupTotalContainers - groupOptimizedContainers);

    calculatedGroups.push({
      groupKey: grp.groupKey,
      chapter: grp.chapter,
      subChapter: grp.subChapter,
      items: calculatedItems,
      totalUnits: groupTotalUnits,
      totalArticles: calculatedItems.length,
      containerizedArticles: groupContainerizedArticles,
      looseArticles: groupLooseArticles,
      containersByType: groupContainersByType,
      totalContainers: groupTotalContainers,
      optimization: {
        standardContainers: groupTotalContainers,
        optimizedContainers: groupOptimizedContainers,
        savedContainers: groupSavedContainers,
        byPackagingType,
      },
    });
  }

  const averageOccupancy =
    totalOccupancyWeightCount > 0
      ? Math.round((totalOccupancyWeightedSum / totalOccupancyWeightCount) * 100) / 100
      : 0;

  const totalStandardContainers = globalTotalContainers;
  const totalOptimizedContainers = calculatedGroups.reduce(
    (acc, g) => acc + g.optimization.optimizedContainers,
    0
  );
  const totalSavedContainers = Math.max(0, totalStandardContainers - totalOptimizedContainers);
  const savingsPercentage =
    totalStandardContainers > 0
      ? Math.round((totalSavedContainers / totalStandardContainers) * 1000) / 10
      : 0;

  return {
    fileName,
    fileType,
    totalGroups: calculatedGroups.length,
    totalDistinctArticles: globalDistinctArticlesSet.size,
    totalUnits: globalTotalUnits,
    totalContainers: globalTotalContainers,
    containerizedUnits: globalContainerizedUnits,
    looseUnits: globalLooseUnits,
    averageOccupancy,
    containersByType: globalContainersByType,
    groups: calculatedGroups,
    optimization: {
      totalStandardContainers,
      totalOptimizedContainers,
      totalSavedContainers,
      savingsPercentage,
    },
  };
}
