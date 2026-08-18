import React, { useState } from 'react';
import {
  Boxes,
  Search,
  ChevronRight,
  PackageOpen,
} from 'lucide-react';
import { GlobalProjectSummary } from '../types';
import { useTranslation } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';

interface ContainerSummaryCardsProps {
  summary: GlobalProjectSummary | null;
}

type ContainerInfo = GlobalProjectSummary['containersByType'][string];

export const ContainerSummaryCards: React.FC<ContainerSummaryCardsProps> = ({
  summary,
}) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  if (!summary) {
    return (
      <div className={`p-12 text-center rounded-2xl border ${
        isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <PackageOpen className={`w-10 h-10 mx-auto mb-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
        <h3 className={`text-base font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t('no_containers_detected')}</h3>
        <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('drag_drop_subtitle')}</p>
      </div>
    );
  }

  const containerList: ContainerInfo[] = (
    Object.values(summary.containersByType) as ContainerInfo[]
  ).sort((a, b) => b.count - a.count);

  const selectedContainer = selectedType
    ? containerList.find((c) => c.description === selectedType)
    : null;

  const filteredArticles = selectedContainer?.articlesList.filter((art) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return art.code.toLowerCase().includes(term) || art.description.toLowerCase().includes(term);
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg ${
        isDarkMode
          ? 'bg-gradient-to-r from-slate-900 via-slate-900/90 to-red-950/30 border-slate-800'
          : 'bg-white border-slate-200 shadow-slate-200'
      }`}>
        <div>
          <h2 className={`text-lg font-black flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            <Boxes className="w-5 h-5 text-red-500" />
            <span>{t('containers')}</span>
          </h2>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Total: {summary.totalContainers.toLocaleString('es-ES')} {t('containers').toLowerCase()} ({containerList.length} tipologías) • {summary.fileName}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3.5 py-2 rounded-xl border text-right ${
            isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`text-[10px] uppercase font-bold block ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{t('containerized')}</span>
            <span className="text-sm font-black text-emerald-500">{summary.containerizedUnits.toLocaleString('es-ES')}</span>
          </div>
          <div className={`px-3.5 py-2 rounded-xl border text-right ${
            isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`text-[10px] uppercase font-bold block ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{t('loose')}</span>
            <span className="text-sm font-black text-amber-500">{summary.looseUnits.toLocaleString('es-ES')}</span>
          </div>
        </div>
      </div>

      {/* Grid of Container Type Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {containerList.map((item: ContainerInfo) => {
          const isSelected = selectedType === item.description;

          return (
            <div
              key={item.description}
              onClick={() => setSelectedType(isSelected ? null : item.description)}
              className={`relative overflow-hidden rounded-2xl p-5 cursor-pointer transition-all duration-200 border ${
                isSelected
                  ? isDarkMode
                    ? 'bg-gradient-to-b from-slate-900 to-red-950/40 border-red-500/80 shadow-xl shadow-red-950/30 scale-[1.02]'
                    : 'bg-red-50/50 border-red-500 shadow-md scale-[1.02]'
                  : isDarkMode
                  ? 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-slate-700 shadow-md'
                  : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl border ${
                  isDarkMode ? 'bg-slate-800/80 text-red-400 border-slate-700' : 'bg-red-50 text-[#AA182C] border-red-200'
                }`}>
                  <Boxes className="w-5 h-5" />
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}>
                  {item.category}
                </span>
              </div>

              <h3 className={`text-base font-black tracking-tight mb-1 truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`} title={item.description}>
                {item.description}
              </h3>

              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-black text-red-500">
                  {item.count}
                </span>
                <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('containers_needed').toLowerCase()}</span>
              </div>

              <div className={`space-y-1.5 pt-3 border-t text-xs ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                <div className={`flex justify-between ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span>{t('total_units')}:</span>
                  <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.totalUnitsPacked.toLocaleString('es-ES')}</span>
                </div>
                <div className={`flex justify-between ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span>{t('database_articles')}:</span>
                  <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.articlesCount} refs</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-red-500">
                <span>{isSelected ? 'Ocultar artículos' : 'Ver desglose'}</span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Container Breakdown Modal/Panel */}
      {selectedContainer && (
        <div className={`p-5 rounded-2xl border shadow-2xl space-y-4 ${
          isDarkMode ? 'bg-slate-900/90 border-red-900/40' : 'bg-white border-slate-200 shadow-slate-200'
        }`}>
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b ${
            isDarkMode ? 'border-slate-800' : 'border-slate-100'
          }`}>
            <div>
              <h3 className={`text-base font-black flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                <span className="text-red-500">{selectedContainer.count}x</span>
                <span>{selectedContainer.description}</span>
                <span className={`text-xs px-2 py-0.5 rounded-md font-normal ${
                  isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                }`}>
                  {selectedContainer.category}
                </span>
              </h3>
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {t('assigned_container')}
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border focus:outline-none focus:border-red-500 ${
                  isDarkMode
                    ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`uppercase font-semibold border-b ${
                isDarkMode ? 'bg-slate-950/60 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                <tr>
                  <th className="py-2.5 px-3">{t('code')}</th>
                  <th className="py-2.5 px-3">{t('description')}</th>
                  <th className="py-2.5 px-3 text-right">{t('quantity')}</th>
                  <th className="py-2.5 px-3 text-right">{t('units_per_container')}</th>
                  <th className="py-2.5 px-3 text-right">{t('containers_needed')}</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                isDarkMode ? 'divide-slate-800/60 text-slate-200' : 'divide-slate-200 text-slate-800'
              }`}>
                {filteredArticles.map((art) => (
                  <tr key={art.code} className={isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                    <td className={`py-2 px-3 font-mono font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{art.code}</td>
                    <td className={`py-2 px-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{art.description}</td>
                    <td className={`py-2 px-3 text-right font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{art.quantity.toLocaleString('es-ES')}</td>
                    <td className={`py-2 px-3 text-right font-mono ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{art.pkgQty.toLocaleString('es-ES')}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-red-500">{art.containersNeeded}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

