export interface PackagingType {
  id: number;
  description: string;
  category: string;
  icon: string;
  color: string;
}

export interface CatalogArticle {
  c: string; // code
  p: number | null; // pkgTypeId
  q: number | null; // pkgQty
  n: string; // name
  f?: string; // family
  s?: string; // subfam
}

export type PackagingStatus = 'CONTAINERIZED' | 'LOOSE' | 'FILTERED_OUT' | 'NOT_IN_DB';

export interface CalculatedItem {
  code: string;
  description: string;
  quantity: number;
  pkgTypeId: number | null;
  pkgTypeName: string;
  pkgCategory: string;
  pkgIcon: string;
  pkgColor: string;
  pkgQty: number | null;
  containersNeeded: number;
  fullContainers: number;
  remainingUnits: number;
  occupancyRate: number; // 0 - 100%
  status: PackagingStatus;
  notes?: string;
}

export interface GroupOptimizationProposal {
  standardContainers: number;
  optimizedContainers: number;
  savedContainers: number;
  byPackagingType: Record<string, {
    pkgTypeId: number;
    description: string;
    standardCount: number;
    optimizedCount: number;
    savedCount: number;
    fractionalTotal: number;
    items: Array<{
      code: string;
      description: string;
      quantity: number;
      pkgQty: number;
      fractional: number;
    }>;
  }>;
}

export interface GroupSummary {
  groupKey: string;
  chapter: string;
  subChapter: string;
  items: CalculatedItem[];
  totalUnits: number;
  totalArticles: number;
  containerizedArticles: number;
  looseArticles: number;
  containersByType: Record<string, {
    count: number;
    pkgTypeId: number;
    description: string;
    category: string;
    icon: string;
    color: string;
    totalUnitsPacked: number;
    articles: string[];
  }>;
  totalContainers: number;
  optimization: GroupOptimizationProposal;
}

export interface GlobalOptimizationSummary {
  totalStandardContainers: number;
  totalOptimizedContainers: number;
  totalSavedContainers: number;
  savingsPercentage: number;
}

export interface GlobalProjectSummary {
  fileName: string;
  fileType: 'CSV' | 'TXT';
  totalGroups: number;
  totalDistinctArticles: number;
  totalUnits: number;
  totalContainers: number;
  containerizedUnits: number;
  looseUnits: number;
  averageOccupancy: number;
  containersByType: Record<string, {
    count: number;
    pkgTypeId: number;
    description: string;
    category: string;
    icon: string;
    color: string;
    totalUnitsPacked: number;
    articlesCount: number;
    articlesList: Array<{
      code: string;
      description: string;
      quantity: number;
      containersNeeded: number;
      pkgQty: number;
    }>;
  }>;
  groups: GroupSummary[];
  optimization: GlobalOptimizationSummary;
}

export type GroupingMode = 'CHAPTER_AND_SUBCHAPTER' | 'CHAPTER_ONLY' | 'ALL_CONSOLIDATED';

export interface AddedProvisionalContainer {
  id: string;
  code: string;
  description: string;
  quantity: number;
  addedAt: string;
}
