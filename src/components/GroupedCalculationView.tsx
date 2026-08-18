import React, { useState, useMemo } from 'react';
import {
  FolderTree,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Boxes,
  Layers,
  Copy,
  Check,
  FileSpreadsheet,
  Download,
  Info,
  Save,
  Filter,
  CheckSquare,
  Square,
  RotateCcw,
  SlidersHorizontal,
  PackagePlus,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import {
  GlobalProjectSummary,
  GroupSummary,
  CalculatedItem,
  GroupingMode,
  PackagingType,
  GroupOptimizationProposal,
} from '../types';
import { DEFAULT_PACKAGING_TYPE_IDS, getPackagingShortName } from './ContainerFilterBar';
import containerModels from '../data/containerModels.json';
import { useTranslation } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';

export interface AddedProvisionalContainer {
  id: string;
  code: string;
  description: string;
  quantity: number;
  addedAt: string;
}

interface GroupedCalculationViewProps {
  summary: GlobalProjectSummary;
  groupingMode: GroupingMode;
  setGroupingMode: (mode: GroupingMode) => void;
  onExportClick: () => void;
  onSaveToDatabase?: () => void;
  isSaving?: boolean;
  packagingTypes?: PackagingType[];
  selectedPackagingTypeIds?: number[];
  onChangeSelectedPackagingTypeIds?: (ids: number[]) => void;
  provisionalContainers?: Record<string, AddedProvisionalContainer[]>;
  setProvisionalContainers?: React.Dispatch<React.SetStateAction<Record<string, AddedProvisionalContainer[]>>>;
}

type GroupContainerInfo = GroupSummary['containersByType'][string];
type PackagingOptimizationInfo = GroupOptimizationProposal['byPackagingType'][string];

export const GroupedCalculationView: React.FC<GroupedCalculationViewProps> = ({
  summary,
  groupingMode,
  setGroupingMode,
  onExportClick,
  onSaveToDatabase,
  isSaving = false,
  packagingTypes = [],
  selectedPackagingTypeIds = DEFAULT_PACKAGING_TYPE_IDS,
  onChangeSelectedPackagingTypeIds,
  provisionalContainers: externalProvisionalContainers,
  setProvisionalContainers: externalSetProvisionalContainers,
}) => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONTAINERIZED' | 'LOOSE' | 'NOT_IN_DB'>('ALL');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);

  // Provisional containers state per group (use external if provided)
  const [internalProvisionalContainers, internalSetProvisionalContainers] = useState<Record<string, AddedProvisionalContainer[]>>({});
  const provisionalContainers = externalProvisionalContainers ?? internalProvisionalContainers;
  const setProvisionalContainers = externalSetProvisionalContainers ?? internalSetProvisionalContainers;

  const [selectedConditionPerGroup, setSelectedConditionPerGroup] = useState<Record<string, 'nuevo' | 'usado'>>({});
  const [selectedModelPerGroup, setSelectedModelPerGroup] = useState<Record<string, string>>({});
  const [customQtyPerGroup, setCustomQtyPerGroup] = useState<Record<string, number>>({});
  const [showOptimizationBreakdown, setShowOptimizationBreakdown] = useState<Record<string, boolean>>({});

  // Toggle single group collapse
  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Helper to determine the best default container model for a group
  const getGroupDefaultModel = (group: GroupSummary, condition: 'nuevo' | 'usado' = 'usado') => {
    const list = containerModels[condition] || containerModels.usado;
    const selected = selectedModelPerGroup[group.groupKey];
    if (selected && list.some((m) => m.codigo === selected)) {
      return selected;
    }
    const usesPortapuntal = Object.values(group.containersByType).some(
      (c) =>
        c.description.toLowerCase().includes('portapuntal') ||
        c.category.toLowerCase().includes('portapuntal') ||
        c.pkgTypeId === 18
    );
    const fallbackCode =
      condition === 'nuevo'
        ? usesPortapuntal
          ? '63312'
          : '94947'
        : usesPortapuntal
        ? '67312'
        : '87947';
    return list.find((m) => m.codigo === fallbackCode)?.codigo || list[0].codigo;
  };

  // Helper to determine the default suggested quantity for a group
  const getGroupDefaultQty = (group: GroupSummary) => {
    if (customQtyPerGroup[group.groupKey] !== undefined) {
      return customQtyPerGroup[group.groupKey];
    }
    return group.totalContainers > 0 ? group.totalContainers : 1;
  };

  // Add provisional container to group
  const handleAddProvisionalContainer = (group: GroupSummary) => {
    const condition = selectedConditionPerGroup[group.groupKey] || 'usado';
    const modelCode = getGroupDefaultModel(group, condition);
    const qty = getGroupDefaultQty(group);
    const list = containerModels[condition] || containerModels.usado;
    const model = list.find((m) => m.codigo === modelCode) || list[0];

    const newItem: AddedProvisionalContainer = {
      id: `${group.groupKey}_${modelCode}_${condition}_${Date.now()}`,
      code: model.codigo,
      description: model.descripcion,
      quantity: qty,
      addedAt: new Date().toISOString(),
    };

    setProvisionalContainers((prev) => ({
      ...prev,
      [group.groupKey]: [...(prev[group.groupKey] || []), newItem],
    }));
  };

  // Update provisional container quantity
  const handleUpdateProvisionalQty = (groupKey: string, itemId: string, newQty: number) => {
    setProvisionalContainers((prev) => ({
      ...prev,
      [groupKey]: (prev[groupKey] || []).map((it) =>
        it.id === itemId ? { ...it, quantity: newQty } : it
      ),
    }));
  };

  // Remove provisional container from group
  const handleRemoveProvisionalContainer = (groupKey: string, itemId: string) => {
    setProvisionalContainers((prev) => ({
      ...prev,
      [groupKey]: (prev[groupKey] || []).filter((it) => it.id !== itemId),
    }));
  };

  // Packaging Filter Handlers
  const allPkgIds = packagingTypes.map((pt) => pt.id);
  const isAllPkgSelected = allPkgIds.length > 0 && allPkgIds.every((id) => selectedPackagingTypeIds.includes(id));
  const isNonePkgSelected = selectedPackagingTypeIds.length === 0;

  const handleTogglePkg = (id: number) => {
    if (!onChangeSelectedPackagingTypeIds) return;
    if (selectedPackagingTypeIds.includes(id)) {
      onChangeSelectedPackagingTypeIds(selectedPackagingTypeIds.filter((x) => x !== id));
    } else {
      onChangeSelectedPackagingTypeIds([...selectedPackagingTypeIds, id]);
    }
  };

  const handleSelectAllPkg = () => {
    if (onChangeSelectedPackagingTypeIds) onChangeSelectedPackagingTypeIds(allPkgIds);
  };

  const handleDeselectAllPkg = () => {
    if (onChangeSelectedPackagingTypeIds) onChangeSelectedPackagingTypeIds([]);
  };

  const handleResetDefaultPkg = () => {
    if (onChangeSelectedPackagingTypeIds) onChangeSelectedPackagingTypeIds(DEFAULT_PACKAGING_TYPE_IDS);
  };

  const handleSelectCategoryPkg = (catName: string) => {
    if (!onChangeSelectedPackagingTypeIds) return;
    const categoryIds = packagingTypes
      .filter((pt) => pt.category.toLowerCase().includes(catName.toLowerCase()))
      .map((pt) => pt.id);
    onChangeSelectedPackagingTypeIds(categoryIds);
  };

  // Filter items in each group
  const filteredGroups = useMemo(() => {
    return summary.groups
      .map((grp) => {
        const filteredItems = grp.items.filter((item) => {
          // Status filter
          if (statusFilter !== 'ALL' && item.status !== statusFilter) {
            return false;
          }
          // Search term
          if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            const matchCode = item.code.toLowerCase().includes(term);
            const matchDesc = item.description.toLowerCase().includes(term);
            const matchPkg = item.pkgTypeName.toLowerCase().includes(term);
            return matchCode || matchDesc || matchPkg;
          }
          return true;
        });

        return {
          ...grp,
          items: filteredItems,
        };
      })
      .filter((grp) => grp.items.length > 0);
  }, [summary.groups, searchTerm, statusFilter]);

  const totalAllItems = useMemo(() => summary.groups.reduce((acc, g) => acc + g.items.length, 0), [summary.groups]);
  const totalFilteredItems = filteredGroups.reduce((acc, g) => acc + g.items.length, 0);

  return (
    <div className="space-y-6">
      {/* Unified Action, Packaging Filter & Search Bar */}
      <div className={`rounded-2xl border p-4 sm:p-5 shadow-xl space-y-4 ${
        isDarkMode
          ? 'bg-slate-900/90 border-slate-800'
          : 'bg-white border-slate-200 shadow-slate-200'
      }`}>
        {/* Row 1: Visualización */}
        <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b ${
          isDarkMode ? 'border-slate-800/80' : 'border-slate-100'
        }`}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg border ${
                isDarkMode ? 'bg-red-600/15 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-[#AA182C]'
              }`}>
                <FolderTree className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {t('group_by_chapter')}
                  </span>
                </div>
                <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {groupingMode === 'CHAPTER_AND_SUBCHAPTER'
                    ? `${t('group_by_chapter')} / Subcapítulos`
                    : groupingMode === 'CHAPTER_ONLY'
                    ? t('group_by_chapter')
                    : t('all_items')}
                </p>
              </div>
            </div>

            <div className={`flex items-center p-1 rounded-xl border text-xs ${
              isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => setGroupingMode('CHAPTER_AND_SUBCHAPTER')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  groupingMode === 'CHAPTER_AND_SUBCHAPTER'
                    ? 'bg-red-600 text-white shadow-sm'
                    : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('group_by_chapter')}
              </button>
              <button
                onClick={() => setGroupingMode('CHAPTER_ONLY')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  groupingMode === 'CHAPTER_ONLY'
                    ? 'bg-red-600 text-white shadow-sm'
                    : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Solo Capítulos
              </button>
              <button
                onClick={() => setGroupingMode('ALL_CONSOLIDATED')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  groupingMode === 'ALL_CONSOLIDATED'
                    ? 'bg-red-600 text-white shadow-sm'
                    : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('all_items')}
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Integrated Packaging Type Filter */}
        {packagingTypes.length > 0 && onChangeSelectedPackagingTypeIds && (
          <div className={`pb-4 border-b space-y-3 ${isDarkMode ? 'border-slate-800/80' : 'border-slate-100'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg border ${
                  isDarkMode ? 'bg-red-600/15 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-[#AA182C]'
                }`}>
                  <Filter className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {t('filter_by_container')}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}>
                      {selectedPackagingTypeIds.length} / {packagingTypes.length}
                    </span>
                  </div>
                  <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {isAllPkgSelected
                      ? t('select_all')
                      : isNonePkgSelected
                      ? t('clear_filters')
                      : `${selectedPackagingTypeIds.length} ${t('containers').toLowerCase()}`}
                  </p>
                </div>
              </div>

              {/* Presets and collapse toggle */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={handleResetDefaultPkg}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    isDarkMode
                      ? 'bg-red-950/60 hover:bg-red-900/60 text-red-300 border-red-800/60'
                      : 'bg-red-50 hover:bg-red-100 text-[#AA182C] border-red-200'
                  }`}
                  title="Restablecer a Contenedor Alsi + Portapuntal"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Default</span>
                </button>

                <button
                  onClick={handleSelectAllPkg}
                  disabled={isAllPkgSelected}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none ${
                    isDarkMode
                      ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-emerald-700 border-slate-300'
                  }`}
                >
                  <CheckSquare className="w-3 h-3" />
                  <span>{t('select_all')}</span>
                </button>

                <button
                  onClick={handleDeselectAllPkg}
                  disabled={isNonePkgSelected}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none ${
                    isDarkMode
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-red-600 border-slate-300'
                  }`}
                >
                  <Square className="w-3 h-3" />
                  <span>{t('clear_filters')}</span>
                </button>

                <button
                  onClick={() => handleSelectCategoryPkg('palet')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer hidden md:inline-block ${
                    isDarkMode
                      ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                  }`}
                >
                  Palets
                </button>

                <button
                  onClick={() => handleSelectCategoryPkg('contenedor')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer hidden md:inline-block ${
                    isDarkMode
                      ? 'bg-slate-800 hover:bg-slate-700 text-blue-400 border-slate-700'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                  }`}
                >
                  Contenedores
                </button>

                <button
                  onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                  className={`p-1 rounded-lg border transition-colors cursor-pointer ${
                    isDarkMode
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-300'
                  }`}
                  title={isFilterExpanded ? 'Plegar chips' : 'Desplegar chips'}
                >
                  {isFilterExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Chips */}
            {isFilterExpanded && (
              <div className="pt-2.5 flex items-center gap-1.5 flex-wrap xl:flex-nowrap overflow-x-auto no-scrollbar animate-fadeIn">
                {packagingTypes.map((pt) => {
                  const isSelected = selectedPackagingTypeIds.includes(pt.id);
                  const shortName = getPackagingShortName(pt);
                  return (
                    <button
                      key={pt.id}
                      onClick={() => handleTogglePkg(pt.id)}
                      title={`${pt.description} (${pt.category})`}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all duration-200 cursor-pointer select-none whitespace-nowrap shrink-0 border ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#AA182C] to-[#801221] text-white border-red-500/50 shadow-md shadow-red-950/40 hover:scale-[1.02]'
                          : isDarkMode
                          ? 'bg-slate-950/70 text-slate-500 border-slate-800 hover:border-slate-700 hover:text-slate-300 opacity-60 hover:opacity-100'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-800 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] ${
                          isSelected
                            ? 'bg-white text-red-700 font-black'
                            : isDarkMode
                            ? 'border border-slate-700 bg-slate-900 text-transparent'
                            : 'border border-slate-300 bg-white text-transparent'
                        }`}
                      >
                        {isSelected ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : null}
                      </div>

                      <span className="tracking-tight">{shortName}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Row 3: Herramientas de Análisis */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg border ${
                isDarkMode ? 'bg-red-600/15 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-[#AA182C]'
              }`}>
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {t('calculation')}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}>
                    {totalFilteredItems} / {totalAllItems} {t('total_articles').toLowerCase()}
                  </span>
                </div>
                <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t('search_placeholder')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`} />
              <input
                type="text"
                placeholder={t('search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-9 pr-4 py-1.5 rounded-xl text-xs border focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 ${
                  isDarkMode
                    ? 'bg-slate-950 border-slate-700/80 text-slate-100 placeholder-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Pill Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                  statusFilter === 'ALL'
                    ? isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-800 text-white'
                    : isDarkMode ? 'text-slate-400 hover:text-slate-200 bg-slate-800/50' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                }`}
              >
                {t('select_all')} ({totalAllItems})
              </button>
              <button
                onClick={() => setStatusFilter('CONTAINERIZED')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer border ${
                  statusFilter === 'CONTAINERIZED'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : isDarkMode
                    ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border-emerald-500/20'
                    : 'text-emerald-700 hover:text-emerald-800 bg-emerald-50 border-emerald-200'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                {t('containerized')}
              </button>
              <button
                onClick={() => setStatusFilter('LOOSE')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer border ${
                  statusFilter === 'LOOSE'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : isDarkMode
                    ? 'text-amber-400 hover:text-amber-300 bg-amber-950/40 border-amber-500/20'
                    : 'text-amber-700 hover:text-amber-800 bg-amber-50 border-amber-200'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                {t('loose')}
              </button>
              <button
                onClick={() => setStatusFilter('NOT_IN_DB')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer border ${
                  statusFilter === 'NOT_IN_DB'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : isDarkMode
                    ? 'text-rose-400 hover:text-rose-300 bg-rose-950/40 border-rose-500/20'
                    : 'text-rose-700 hover:text-rose-800 bg-rose-50 border-rose-200'
                }`}
              >
                <HelpCircle className="w-3 h-3" />
                {t('not_in_db')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Group List / Accordions */}
      <div className="space-y-4">
        {filteredGroups.length === 0 ? (
          <div className={`p-12 text-center rounded-2xl border ${
            isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <Info className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
            <p className={`text-sm font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>No se encontraron artículos</p>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Prueba a cambiar el término de búsqueda o el filtro de estado</p>
          </div>
        ) : (
          filteredGroups.map((group) => {
            const isCollapsed = collapsedGroups[group.groupKey];
            const groupContainers = Object.values(group.containersByType) as GroupContainerInfo[];
            const groupProvisionalList = provisionalContainers[group.groupKey] || [];

            return (
              <div
                key={group.groupKey}
                className={`rounded-2xl border shadow-md overflow-hidden transition-all duration-200 ${
                  isDarkMode
                    ? 'bg-slate-900/80 border-slate-800/90 hover:border-slate-700/80'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-slate-200'
                }`}
              >
                {/* Chapter Accordion Header */}
                <div
                  onClick={() => toggleGroup(group.groupKey)}
                  className={`p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none transition-colors ${
                    isDarkMode
                      ? 'bg-gradient-to-r from-slate-900 to-slate-900/70 hover:from-slate-850 hover:to-slate-900'
                      : 'bg-slate-50 hover:bg-slate-100/80 border-b border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronUp className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold tracking-wide ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {group.chapter}
                        </span>
                        {group.subChapter && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase border ${
                            isDarkMode
                              ? 'bg-red-950/70 text-red-300 border-red-800/40'
                              : 'bg-red-50 text-[#AA182C] border-red-200'
                          }`}>
                            {group.subChapter}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {group.totalArticles} {t('total_articles').toLowerCase()} • {group.totalUnits.toLocaleString('es-ES')} {t('total_units').toLowerCase()}
                        {groupProvisionalList.length > 0 && (
                          <span className="ml-2 text-blue-500 font-semibold">
                            (+{groupProvisionalList.length} {t('containers').toLowerCase()} {t('added').toLowerCase()})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Group Container Summary Pill Badges */}
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1.5 flex-wrap justify-end">
                      {groupContainers.map((gc: GroupContainerInfo) => (
                        <span
                          key={gc.description}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-xs ${
                            isDarkMode
                              ? 'bg-slate-950 text-slate-200 border-slate-800'
                              : 'bg-white text-slate-700 border-slate-300'
                          }`}
                        >
                          <span className="text-red-500 font-mono">{gc.count}x</span>
                          <span className="truncate max-w-[120px]">{gc.description}</span>
                        </span>
                      ))}
                    </div>

                    {group.optimization && group.optimization.savedContainers > 0 && (
                      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border shadow-xs whitespace-nowrap ${
                        isDarkMode
                          ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300'
                          : 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold'
                      }`}>
                        <Sparkles className={`w-3.5 h-3.5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        <span className={`text-[10px] uppercase font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>Opt:</span>
                        <span className="text-xs font-black font-mono">
                          {group.optimization.optimizedContainers}
                        </span>
                        <span className={`text-[10px] font-bold ${isDarkMode ? 'text-emerald-400/80' : 'text-emerald-600'}`}>
                          (-{group.optimization.savedContainers})
                        </span>
                      </div>
                    )}

                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shadow-xs whitespace-nowrap ${
                      isDarkMode
                        ? 'bg-slate-950 border-slate-800'
                        : 'bg-slate-100 border-slate-300'
                    }`}>
                      <span className={`text-[10px] uppercase font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Estándar:</span>
                      <span className="text-xs font-black text-red-500 font-mono">
                        {group.totalContainers}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items Table & Proposal Strip when group is expanded */}
                {!isCollapsed && (
                  <div>
                    {/* Proposal Strip for adding containers */}
                    <div className={`p-3.5 sm:p-4 border-t space-y-3 ${
                      isDarkMode ? 'bg-slate-950/90 border-slate-800/80' : 'bg-slate-50/70 border-slate-200'
                    }`}>
                      {/* Optimization Banner if savings available */}
                      {group.optimization && group.optimization.savedContainers > 0 && (
                        <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm ${
                          isDarkMode
                            ? 'bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-slate-900/60 border-emerald-500/30'
                            : 'bg-emerald-50/90 border-emerald-200'
                        }`}>
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded-lg border ${
                              isDarkMode
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-emerald-100 text-emerald-700 border-emerald-300'
                            }`}>
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold uppercase tracking-wider ${
                                  isDarkMode ? 'text-emerald-300' : 'text-emerald-800'
                                }`}>
                                  Propuesta de Optimización de Llenado
                                </span>
                                <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full border ${
                                  isDarkMode
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                }`}>
                                  Ahorro: -{group.optimization.savedContainers} contenedores ({group.optimization.optimizedContainers} en vez de {group.totalContainers})
                                </span>
                              </div>
                              <p className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                Agrupando piezas de referencias incompletas en un mismo contenedor se optimiza el espacio
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                setShowOptimizationBreakdown((prev) => ({
                                  ...prev,
                                  [group.groupKey]: !prev[group.groupKey],
                                }))
                              }
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                                isDarkMode
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
                              }`}
                            >
                              {showOptimizationBreakdown[group.groupKey] ? 'Ocultar' : 'Ver reparto'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Detailed Filling Breakdown */}
                      {group.optimization &&
                        group.optimization.savedContainers > 0 &&
                        showOptimizationBreakdown[group.groupKey] && (
                          <div className={`p-3 rounded-xl border space-y-2 text-xs animate-fadeIn ${
                            isDarkMode
                              ? 'bg-slate-900/90 border-emerald-800/40'
                              : 'bg-white border-emerald-300 shadow-sm'
                          }`}>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide text-[11px] block">
                              Detalle del Llenado Combinado por Tipo de Contenedor:
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              {(
                                Object.values(
                                  group.optimization.byPackagingType
                                ) as PackagingOptimizationInfo[]
                              ).map((pType) => (
                                <div
                                  key={pType.description}
                                  className={`p-2.5 rounded-lg border space-y-1.5 ${
                                    isDarkMode
                                      ? 'bg-slate-950/80 border-slate-800'
                                      : 'bg-slate-50 border-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between font-bold">
                                    <span className={isDarkMode ? 'text-slate-200' : 'text-slate-800'}>{pType.description}</span>
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                      {pType.optimizedCount} opt. (Estándar: {pType.standardCount})
                                    </span>
                                  </div>
                                  <div className={`text-[11px] space-y-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {pType.items.map((it) => (
                                      <div key={it.code} className="flex items-center justify-between">
                                        <span className={`font-mono ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                          {it.code} ({it.quantity} uds)
                                        </span>
                                        <span className="font-mono">
                                          {(it.fractional * 100).toFixed(1)}% de contenedor
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className={`pt-1 border-t flex items-center justify-between text-[11px] font-bold text-emerald-600 dark:text-emerald-300 ${
                                    isDarkMode ? 'border-slate-800/80' : 'border-slate-200'
                                  }`}>
                                    <span>Suma fraccional calculada:</span>
                                    <span>{pType.fractionalTotal.toFixed(2)} contenedores</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Main proposal controls */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg border ${
                            isDarkMode
                              ? 'bg-blue-600/15 border-blue-500/30 text-blue-400'
                              : 'bg-blue-50 border-blue-200 text-blue-600'
                          }`}>
                            <PackagePlus className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold uppercase tracking-wider ${
                                isDarkMode ? 'text-white' : 'text-slate-900'
                              }`}>
                                Propuesta de Contenedores
                              </span>
                              {group.totalContainers > 0 && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  isDarkMode
                                    ? 'bg-blue-950/80 text-blue-300 border-blue-700/60'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                  Estándar: {group.totalContainers}
                                </span>
                              )}
                            </div>
                            <p className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              Selecciona el modelo de contenedor para añadirlo a esta agrupación
                            </p>
                          </div>
                        </div>

                        {/* Condition Toggle + Dropdown + Qty + Add Button + Aplicar Optimización Button */}
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                          {/* Selector de Condición (Nuevo / Usado) */}
                          <div className={`flex items-center p-0.5 rounded-xl border ${
                            isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-300'
                          }`}>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedConditionPerGroup((prev) => ({
                                  ...prev,
                                  [group.groupKey]: 'nuevo',
                                }))
                              }
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                selectedConditionPerGroup[group.groupKey] === 'nuevo'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Nuevo
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedConditionPerGroup((prev) => ({
                                  ...prev,
                                  [group.groupKey]: 'usado',
                                }))
                              }
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                (selectedConditionPerGroup[group.groupKey] || 'usado') === 'usado'
                                  ? 'bg-amber-600 text-white shadow-sm'
                                  : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Usado
                            </button>
                          </div>

                          {/* Desplegable de Modelos (según Nuevo o Usado) */}
                          <select
                            value={getGroupDefaultModel(group, selectedConditionPerGroup[group.groupKey] || 'usado')}
                            onChange={(e) =>
                              setSelectedModelPerGroup((prev) => ({
                                ...prev,
                                [group.groupKey]: e.target.value,
                              }))
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border focus:outline-none focus:border-blue-500 max-w-[270px] truncate cursor-pointer ${
                              isDarkMode
                                ? 'bg-slate-900 border-slate-700 text-slate-100'
                                : 'bg-white border-slate-300 text-slate-800'
                            }`}
                          >
                            {(
                              containerModels[selectedConditionPerGroup[group.groupKey] || 'usado'] ||
                              containerModels.usado
                            ).map((m) => (
                              <option key={m.codigo} value={m.codigo}>
                                {m.codigo} - {m.descripcion}
                              </option>
                            ))}
                          </select>

                          {/* Grupo Integrado Fusionado: Cantidad + Botón Añadir + Botón Aplicar Optimización */}
                          <div className={`flex items-center rounded-xl border overflow-hidden shadow-xs ${
                            isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
                          }`}>
                            <div className="flex items-center gap-1.5 px-3 py-1">
                              <span className={`text-[11px] font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Uds:</span>
                              <input
                                type="number"
                                min="1"
                                value={getGroupDefaultQty(group)}
                                onChange={(e) =>
                                  setCustomQtyPerGroup((prev) => ({
                                    ...prev,
                                    [group.groupKey]: Math.max(1, parseInt(e.target.value) || 1),
                                  }))
                                }
                                className={`w-12 bg-transparent text-xs font-bold text-center focus:outline-none ${
                                  isDarkMode ? 'text-white' : 'text-slate-900'
                                }`}
                              />
                            </div>

                            <button
                              onClick={() => handleAddProvisionalContainer(group)}
                              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white border-l transition-all cursor-pointer whitespace-nowrap ${
                                isDarkMode ? 'border-slate-700' : 'border-slate-300'
                              }`}
                              title={t('add_provisional_container')}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{t('added')}</span>
                            </button>

                            {group.optimization && group.optimization.savedContainers > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setCustomQtyPerGroup((prev) => ({
                                    ...prev,
                                    [group.groupKey]: group.optimization.optimizedContainers,
                                  }))
                                }
                                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white border-l border-emerald-500/50 transition-all cursor-pointer whitespace-nowrap"
                                title={`Aplicar optimización (${group.optimization.optimizedContainers} uds en vez de ${group.totalContainers})`}
                              >
                                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                                <span>{t('apply_optimization')} ({group.optimization.optimizedContainers})</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Items Table */}
                    <div className={`border-t overflow-x-auto ${isDarkMode ? 'border-slate-800/80' : 'border-slate-200'}`}>
                      <table className="w-full text-left text-xs min-w-[760px]">
                        <thead className={`uppercase font-semibold border-b ${
                          isDarkMode ? 'bg-slate-950/80 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          <tr>
                            <th className="py-3.5 pl-5 pr-3">{t('code')}</th>
                            <th className="py-3.5 px-3">{t('description')}</th>
                            <th className="py-3.5 px-3 text-right">{t('quantity')}</th>
                            <th className="py-3.5 px-3">{t('assigned_container')}</th>
                            <th className="py-3.5 px-3 text-right">{t('units_per_container')}</th>
                            <th className="py-3.5 px-3 text-right">{t('containers_needed')}</th>
                            <th className="py-3.5 px-3 text-center">{t('occupancy')}</th>
                            <th className="py-3.5 pl-3 pr-6 text-center">{t('status')}</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${
                          isDarkMode ? 'divide-slate-800/50 text-slate-200' : 'divide-slate-200 text-slate-800'
                        }`}>
                          {/* Regular Chapter Items */}
                          {group.items.map((item: CalculatedItem) => (
                            <tr
                              key={item.code}
                              className={`transition-colors group ${
                                isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'
                              }`}
                            >
                              {/* Code */}
                              <td className={`py-2.5 pl-5 pr-3 font-mono font-bold whitespace-nowrap ${
                                isDarkMode ? 'text-white' : 'text-slate-900'
                              }`}>
                                <div className="flex items-center gap-1.5">
                                  <span>{item.code}</span>
                                  <button
                                    onClick={() => copyToClipboard(item.code)}
                                    className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                                      isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                    title={t('copy_code')}
                                  >
                                    {copiedCode === item.code ? (
                                      <Check className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </td>

                              {/* Description */}
                              <td className={`py-2.5 px-3 max-w-md truncate ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`} title={item.description}>
                                {item.description}
                              </td>

                              {/* Quantity */}
                              <td className={`py-2.5 px-3 text-right font-mono font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                {item.quantity.toLocaleString('es-ES')}
                              </td>

                              {/* Packaging Type */}
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                {item.pkgTypeId ? (
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                                    isDarkMode
                                      ? 'bg-slate-800 text-slate-200 border-slate-700'
                                      : 'bg-slate-100 text-slate-800 border-slate-300'
                                  }`}>
                                    <Boxes className="w-3 h-3 text-red-500" />
                                    {item.pkgTypeName}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic text-[11px]">
                                    {t('without_container_loose')}
                                  </span>
                                )}
                              </td>

                              {/* Units per Package */}
                              <td className={`py-2.5 px-3 text-right font-mono ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                {item.pkgQty ? item.pkgQty.toLocaleString('es-ES') : '—'}
                              </td>

                              {/* Containers Needed */}
                              <td className="py-2.5 px-3 text-right font-mono font-bold">
                                {item.containersNeeded > 0 ? (
                                  <span className={`px-2 py-0.5 rounded-md border ${
                                    isDarkMode
                                      ? 'text-red-400 bg-red-950/30 border-red-800/40'
                                      : 'text-[#AA182C] bg-red-50 border-red-200 font-extrabold'
                                  }`}>
                                    {item.containersNeeded}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">0</span>
                                )}
                              </td>

                              {/* Occupancy */}
                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                {item.pkgTypeId && item.containersNeeded > 0 ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <div className={`w-12 rounded-full h-1.5 overflow-hidden ${
                                      isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
                                    }`}>
                                      <div
                                        className={`h-1.5 rounded-full ${
                                          item.occupancyRate >= 90
                                            ? 'bg-emerald-500'
                                            : item.occupancyRate >= 50
                                            ? 'bg-amber-500'
                                            : 'bg-red-500'
                                        }`}
                                        style={{ width: `${item.occupancyRate}%` }}
                                      ></div>
                                    </div>
                                    <span className={`font-mono text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-bold'}`}>
                                      {item.occupancyRate}%
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>

                              {/* Status Badge */}
                              <td className="py-2.5 pl-3 pr-6 text-center whitespace-nowrap">
                                {item.status === 'CONTAINERIZED' && (
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                    isDarkMode
                                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  }`}>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                    {t('containerized')}
                                  </span>
                                )}
                                {item.status === 'LOOSE' && (
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                    isDarkMode
                                      ? 'bg-amber-950/60 text-amber-300 border-amber-800/50'
                                      : 'bg-amber-50 text-amber-700 border-amber-300'
                                  }`}>
                                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                                    {t('loose')}
                                  </span>
                                )}
                                {item.status === 'NOT_IN_DB' && (
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                    isDarkMode
                                      ? 'bg-rose-950/60 text-rose-300 border-rose-800/50'
                                      : 'bg-rose-50 text-rose-700 border-rose-300'
                                  }`}>
                                    <HelpCircle className="w-3 h-3 text-rose-500" />
                                    {t('not_in_db')}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}

                          {/* Added Provisional Containers Rows */}
                          {groupProvisionalList.map((prov) => (
                            <tr
                              key={prov.id}
                              className={`transition-colors border-l-2 border-l-blue-500 group ${
                                isDarkMode ? 'bg-blue-950/20 hover:bg-blue-950/30' : 'bg-blue-50/50 hover:bg-blue-50'
                              }`}
                            >
                              <td className={`py-2.5 pl-5 pr-3 font-mono font-bold whitespace-nowrap ${
                                isDarkMode ? 'text-blue-300' : 'text-blue-700'
                              }`}>
                                <div className="flex items-center gap-2">
                                  <span>{prov.code}</span>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider border ${
                                    isDarkMode ? 'bg-blue-900/60 text-blue-200 border-blue-700/50' : 'bg-blue-100 text-blue-800 border-blue-200'
                                  }`}>
                                    {t('provisional')}
                                  </span>
                                </div>
                              </td>

                              <td className={`py-2.5 px-3 font-semibold max-w-md truncate ${
                                isDarkMode ? 'text-blue-100' : 'text-slate-800'
                              }`} title={prov.description}>
                                {prov.description}
                              </td>

                              <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                                isDarkMode ? 'text-blue-300' : 'text-blue-700'
                              }`}>
                                <input
                                  type="number"
                                  min="1"
                                  value={prov.quantity}
                                  onChange={(e) =>
                                    handleUpdateProvisionalQty(
                                      group.groupKey,
                                      prov.id,
                                      Math.max(1, parseInt(e.target.value) || 1)
                                    )
                                  }
                                  className={`w-16 px-2 py-1 rounded-lg text-right text-xs font-bold font-mono focus:outline-none border focus:ring-1 focus:ring-blue-400 transition-colors ${
                                    isDarkMode
                                      ? 'bg-slate-900 border-blue-600/60 text-blue-200'
                                      : 'bg-white border-blue-300 text-blue-900'
                                  }`}
                                  title="Editar cantidad con el teclado"
                                />
                              </td>

                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                                  isDarkMode
                                    ? 'bg-blue-900/40 text-blue-200 border-blue-700/50'
                                    : 'bg-blue-50 text-blue-800 border-blue-200'
                                }`}>
                                  <Boxes className="w-3 h-3 text-blue-500" />
                                  {t('physical_container')}
                                </span>
                              </td>

                              <td className="py-2.5 px-3 text-right font-mono text-slate-400">—</td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-400">—</td>
                              <td className="py-2.5 px-3 text-center font-mono text-slate-400">—</td>

                              <td className="py-2.5 pl-3 pr-6 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-2">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                    isDarkMode
                                      ? 'bg-blue-950/90 text-blue-300 border-blue-700/60'
                                      : 'bg-blue-100 text-blue-800 border-blue-300'
                                  }`}>
                                    <CheckCircle2 className="w-3 h-3 text-blue-500" />
                                    {t('added')}
                                  </span>
                                  <button
                                    onClick={() => handleRemoveProvisionalContainer(group.groupKey, prov.id)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                    title="Eliminar contenedor provisional"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Actions Bar */}
      <div className={`rounded-2xl border p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 ${
        isDarkMode
          ? 'bg-slate-900/90 border-slate-800'
          : 'bg-white border-slate-200 shadow-slate-200'
      }`}>
        <div className={`text-xs text-center sm:text-left ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          <span className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>
            {summary.totalDistinctArticles} {t('total_references').toLowerCase()}
          </span>{' '}
          •{' '}
          <span className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>
            {summary.totalUnits.toLocaleString('es-ES')} {t('total_units').toLowerCase()}
          </span>{' '}
          •{' '}
          <span className="font-bold text-red-500">
            {summary.totalContainers} {t('total_containers').toLowerCase()}
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
          {onSaveToDatabase && (
            <button
              onClick={onSaveToDatabase}
              disabled={isSaving}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold border shadow-md transition-all cursor-pointer hover:scale-[1.02] disabled:opacity-50 ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/30'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? t('saving') : t('save_to_db')}</span>
            </button>
          )}

          <button
            onClick={onExportClick}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#AA182C] via-[#C72641] to-[#801221] hover:from-[#C72641] hover:to-[#AA182C] text-white shadow-lg shadow-red-950/40 border border-red-500/40 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <Download className="w-4 h-4" />
            <span>{t('export_excel')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
