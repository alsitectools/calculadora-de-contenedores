import React, { useState } from 'react';
import {
  Filter,
  CheckSquare,
  Square,
  Check,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import { PackagingType } from '../types';
import { useTranslation } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';

export const DEFAULT_PACKAGING_TYPE_IDS = [12, 18]; // CONTENEDOR ALSI. (12) and PORTAPUNTAL (18)

export function getPackagingShortName(pt: { id: number; description: string }): string {
  const shortNames: Record<number, string> = {
    4: 'Cubeta D/25',
    5: 'Palet 0.74',
    6: 'Tacos',
    7: 'Palet 0.98',
    8: 'Estantería',
    9: 'Cinta',
    10: 'Cubo',
    12: 'Contenedor',
    13: 'Saco 30x50',
    14: 'Saco 40x60',
    15: 'Palet',
    18: 'Portapuntal',
  };
  return shortNames[pt.id] || pt.description.replace(/\s+ALSI\.?$/i, '').trim();
}

interface ContainerFilterBarProps {
  packagingTypes: PackagingType[];
  selectedTypeIds: number[];
  onChangeSelectedTypeIds: (ids: number[]) => void;
  totalArticlesContainerized?: number;
}

export const ContainerFilterBar: React.FC<ContainerFilterBarProps> = ({
  packagingTypes,
  selectedTypeIds,
  onChangeSelectedTypeIds,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  const allIds = packagingTypes.map((pt) => pt.id);
  const isAllSelected = allIds.length > 0 && allIds.every((id) => selectedTypeIds.includes(id));
  const isNoneSelected = selectedTypeIds.length === 0;

  const handleToggle = (id: number) => {
    if (selectedTypeIds.includes(id)) {
      onChangeSelectedTypeIds(selectedTypeIds.filter((x) => x !== id));
    } else {
      onChangeSelectedTypeIds([...selectedTypeIds, id]);
    }
  };

  const handleSelectAll = () => {
    onChangeSelectedTypeIds(allIds);
  };

  const handleDeselectAll = () => {
    onChangeSelectedTypeIds([]);
  };

  const handleResetDefault = () => {
    onChangeSelectedTypeIds(DEFAULT_PACKAGING_TYPE_IDS);
  };

  const handleSelectCategory = (catName: string) => {
    const categoryIds = packagingTypes
      .filter((pt) => pt.category.toLowerCase().includes(catName.toLowerCase()))
      .map((pt) => pt.id);
    onChangeSelectedTypeIds(categoryIds);
  };

  return (
    <div className={`rounded-2xl border p-4 shadow-lg transition-all mb-6 ${
      isDarkMode
        ? 'bg-gradient-to-r from-slate-900 via-slate-900/95 to-red-950/20 border-slate-800'
        : 'bg-white border-slate-200 shadow-slate-200'
    }`}>
      {/* Header & Controls */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${
        isDarkMode ? 'border-slate-800/80' : 'border-slate-100'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${
            isDarkMode ? 'bg-red-600/15 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-[#AA182C]'
          }`}>
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {t('filter_by_container')}
              </h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}>
                {selectedTypeIds.length} / {packagingTypes.length}
              </span>
            </div>
            <p className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {isAllSelected
                ? t('select_all')
                : isNoneSelected
                ? t('clear_filters')
                : `${selectedTypeIds.length} ${t('containers').toLowerCase()}`}
            </p>
          </div>
        </div>

        {/* Quick presets and toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleResetDefault}
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
            onClick={handleSelectAll}
            disabled={isAllSelected}
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
            onClick={handleDeselectAll}
            disabled={isNoneSelected}
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
            onClick={() => handleSelectCategory('palet')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer hidden md:inline-block ${
              isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
            }`}
          >
            Palets
          </button>

          <button
            onClick={() => handleSelectCategory('contenedor')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer hidden md:inline-block ${
              isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-blue-400 border-slate-700'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
            }`}
          >
            Contenedores
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-300'
            }`}
            title={isExpanded ? 'Plegar filtro' : 'Desplegar filtro'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Chips Container */}
      {isExpanded && (
        <div className="pt-2.5 flex items-center gap-1.5 flex-wrap xl:flex-nowrap overflow-x-auto no-scrollbar animate-fadeIn">
          {packagingTypes.map((pt) => {
            const isSelected = selectedTypeIds.includes(pt.id);
            const shortName = getPackagingShortName(pt);
            return (
              <button
                key={pt.id}
                onClick={() => handleToggle(pt.id)}
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
  );
};

