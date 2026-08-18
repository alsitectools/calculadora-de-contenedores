import React from 'react';
import {
  Boxes,
  Layers,
  TrendingUp,
  PieChart,
  Info,
} from 'lucide-react';
import { GlobalProjectSummary } from '../types';
import { useTranslation } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';

interface MetricsHUDProps {
  summary: GlobalProjectSummary | null;
  onViewContainersClick: () => void;
}

type ContainerInfo = GlobalProjectSummary['containersByType'][string];

export const MetricsHUD: React.FC<MetricsHUDProps> = ({
  summary,
  onViewContainersClick,
}) => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  if (!summary) return null;

  // Find top 4 container types
  const topContainers: ContainerInfo[] = (
    Object.values(summary.containersByType) as ContainerInfo[]
  )
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const containerizedPercent = summary.totalUnits > 0
    ? (summary.containerizedUnits / summary.totalUnits) * 100
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* 1. Total Contenedores Necesarios */}
      <div className={`relative overflow-hidden rounded-2xl p-5 shadow-xl transition-all duration-300 group ${
        isDarkMode
          ? 'bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-red-500/30 shadow-red-950/20 hover:border-red-500/50'
          : 'bg-white border border-red-200 shadow-slate-200 hover:border-red-400'
      }`}>
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl transition-all ${
          isDarkMode ? 'bg-red-600/10 group-hover:bg-red-600/20' : 'bg-red-500/5 group-hover:bg-red-500/10'
        }`}></div>
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-red-500">
            {t('total_containers')}
          </span>
          <div className={`p-2.5 rounded-xl border ${
            isDarkMode ? 'bg-red-600/15 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-[#AA182C]'
          }`}>
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-1">
          <span className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            {summary.totalContainers.toLocaleString('es-ES')}
          </span>
          <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('containers').toLowerCase()}</span>
        </div>

        {summary.optimization && summary.optimization.totalSavedContainers > 0 && (
          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-bold mb-1 border ${
            isDarkMode ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
          }`}>
            <span>✨</span>
            <span>
              {t('apply_optimization')}: {summary.optimization.totalOptimizedContainers} (-{summary.optimization.totalSavedContainers} / -{summary.optimization.savingsPercentage}%)
            </span>
          </div>
        )}

        <div className={`flex items-center justify-between text-[11px] mt-3 pt-3 border-t ${
          isDarkMode ? 'text-slate-400 border-slate-800/80' : 'text-slate-500 border-slate-100'
        }`}>
          <span>{topContainers.length} {t('containers').toLowerCase()}</span>
          <button
            onClick={onViewContainersClick}
            className="text-red-500 hover:text-red-600 font-semibold transition-colors cursor-pointer"
          >
            {t('view_containers_breakdown')} →
          </button>
        </div>
      </div>

      {/* 2. Total Unidades y Referencias */}
      <div className={`relative overflow-hidden rounded-2xl p-5 shadow-xl transition-all duration-300 group ${
        isDarkMode
          ? 'bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 hover:border-slate-700'
          : 'bg-white border border-slate-200 shadow-slate-200 hover:border-slate-300'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {t('total_articles')} / {t('total_units')}
          </span>
          <div className={`p-2.5 rounded-xl border ${
            isDarkMode ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'
          }`}>
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            {summary.totalUnits.toLocaleString('es-ES')}
          </span>
          <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('total_units').toLowerCase()}</span>
        </div>

        <div className={`flex items-center justify-between text-[11px] mt-3 pt-3 border-t ${
          isDarkMode ? 'text-slate-400 border-slate-800/80' : 'text-slate-500 border-slate-100'
        }`}>
          <span>{summary.totalDistinctArticles.toLocaleString('es-ES')} {t('total_references').toLowerCase()}</span>
          <span>{summary.totalGroups} {t('group_by_chapter').toLowerCase()}</span>
        </div>
      </div>

      {/* 3. Magnitud Contenerizada */}
      <div className={`relative overflow-hidden rounded-2xl p-5 shadow-xl transition-all duration-300 group ${
        isDarkMode
          ? 'bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 hover:border-slate-700'
          : 'bg-white border border-slate-200 shadow-slate-200 hover:border-slate-300'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {t('containerized')}
          </span>
          <div className={`p-2.5 rounded-xl border ${
            isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
          }`}>
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-black text-emerald-500 tracking-tight">
            {containerizedPercent.toFixed(2)}%
          </span>
          <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('containerized').toLowerCase()}</span>
        </div>

        {/* Progress bar */}
        <div className={`w-full rounded-full h-2 mt-3 overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, containerizedPercent)}%` }}
          ></div>
        </div>

        <div className={`flex justify-between text-[11px] mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          <span>{summary.containerizedUnits.toLocaleString('es-ES')} {t('containerized').toLowerCase()}</span>
          <span>{summary.looseUnits.toLocaleString('es-ES')} {t('loose').toLowerCase()}</span>
        </div>
      </div>

      {/* 4. Ocupación Media */}
      <div className={`relative overflow-hidden rounded-2xl p-5 shadow-xl transition-all duration-300 group ${
        isDarkMode
          ? 'bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 hover:border-slate-700'
          : 'bg-white border border-slate-200 shadow-slate-200 hover:border-slate-300'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {t('occupancy_rate')}
          </span>
          <div className={`p-2.5 rounded-xl border ${
            isDarkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-600'
          }`}>
            <PieChart className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-black text-amber-500 tracking-tight">
            {Number(summary.averageOccupancy).toFixed(2)}%
          </span>
          <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('occupancy_rate').toLowerCase()}</span>
        </div>

        <div className={`w-full rounded-full h-2 mt-3 overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
          <div
            className="bg-gradient-to-r from-amber-500 to-orange-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${summary.averageOccupancy}%` }}
          ></div>
        </div>

        <div className={`flex items-center gap-1.5 text-[11px] mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>{t('occupancy')}</span>
        </div>
      </div>
    </div>
  );
};

