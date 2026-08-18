import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Boxes,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { PackagingType, CatalogArticle } from '../types';
import defaultPackagingTypes from '../data/packagingTypes.json';
import defaultArticlesCatalog from '../data/articlesCatalog.json';
import { useTranslation } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';

export const QuickCalculatorModal: React.FC = () => {
  const [selectedArticleCode, setSelectedArticleCode] = useState<string>('010101');
  const [quantity, setQuantity] = useState<number>(150);
  const [customPkgTypeId, setCustomPkgTypeId] = useState<number | null>(null);
  const [customPkgQty, setCustomPkgQty] = useState<number | null>(null);
  const [useCustomOverride, setUseCustomOverride] = useState(false);

  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  const packagingTypes = defaultPackagingTypes as PackagingType[];
  const articlesCatalog = defaultArticlesCatalog as Record<string, CatalogArticle>;

  const currentArticle = articlesCatalog[selectedArticleCode] || null;

  const activePkgTypeId = useCustomOverride ? customPkgTypeId : (currentArticle?.p ?? null);
  const activePkgQty = useCustomOverride ? customPkgQty : (currentArticle?.q ?? null);

  const selectedPkgType = packagingTypes.find((p) => p.id === activePkgTypeId) || null;

  // Calculation results
  const calculation = useMemo(() => {
    if (!activePkgTypeId || !activePkgQty || activePkgQty <= 0 || quantity <= 0) {
      return {
        containersNeeded: 0,
        fullContainers: 0,
        remainingUnits: quantity,
        occupancyRate: 0,
        hasPackaging: false,
      };
    }

    const containersNeeded = Math.ceil(quantity / activePkgQty);
    const fullContainers = Math.floor(quantity / activePkgQty);
    const remainingUnits = quantity % activePkgQty;
    const occupancyRate = Math.round((quantity / (containersNeeded * activePkgQty)) * 100);

    return {
      containersNeeded,
      fullContainers,
      remainingUnits,
      occupancyRate,
      hasPackaging: true,
    };
  }, [quantity, activePkgTypeId, activePkgQty]);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg ${
        isDarkMode
          ? 'bg-gradient-to-r from-slate-900 via-slate-900/90 to-red-950/30 border-slate-800'
          : 'bg-white border-slate-200 shadow-slate-200'
      }`}>
        <div>
          <h2 className={`text-lg font-black flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            <Calculator className="w-5 h-5 text-red-500" />
            <span>{t('quick_calc')}</span>
          </h2>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Calcula instantáneamente contenedores requeridos y ratio de llenado para cualquier referencia o cantidad manual
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Inputs */}
        <div className={`lg:col-span-6 space-y-4 p-6 rounded-2xl border shadow-xl ${
          isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-slate-200'
        }`}>
          <h3 className={`text-sm font-bold uppercase tracking-wider pb-3 border-b ${
            isDarkMode ? 'text-slate-300 border-slate-800' : 'text-slate-700 border-slate-100'
          }`}>
            {t('calculation')}
          </h3>

          <div>
            <label className={`text-xs font-bold block mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              {t('code')}
            </label>
            <input
              type="text"
              placeholder="Ej: 010101, 311000003499, 2236..."
              value={selectedArticleCode}
              onChange={(e) => {
                setSelectedArticleCode(e.target.value.trim());
                setUseCustomOverride(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono border focus:outline-none focus:border-red-500 ${
                isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
            {currentArticle ? (
              <div className={`mt-2 p-2.5 rounded-xl border text-xs ${
                isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`font-bold block ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{currentArticle.n}</span>
                <span className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Ficha BD: {currentArticle.p ? `${t('containers')} ID ${currentArticle.p} (${currentArticle.q} ${t('units_per_container').toLowerCase()})` : t('without_container_loose')}
                </span>
              </div>
            ) : (
              <div className="mt-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{t('not_in_db')}</span>
              </div>
            )}
          </div>

          <div>
            <label className={`text-xs font-bold block mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              {t('quantity')}
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono font-bold border focus:outline-none focus:border-red-500 ${
                isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          {/* Override Toggle */}
          <div className={`pt-2 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Personalizar Contenedor / Capacidad Manual</span>
              <input
                type="checkbox"
                checked={useCustomOverride}
                onChange={(e) => setUseCustomOverride(e.target.checked)}
                className="w-4 h-4 rounded text-red-600 focus:ring-red-500 accent-red-600 cursor-pointer"
              />
            </div>

            {useCustomOverride && (
              <div className={`mt-3 space-y-3 p-3.5 rounded-xl border text-xs ${
                isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <label className={`block mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{t('assigned_container')}</label>
                  <select
                    value={customPkgTypeId || ''}
                    onChange={(e) => setCustomPkgTypeId(e.target.value ? Number(e.target.value) : null)}
                    className={`w-full p-2 rounded-lg border focus:outline-none focus:border-red-500 ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="">Seleccionar tipo...</option>
                    {packagingTypes.map((pt) => (
                      <option key={pt.id} value={pt.id}>
                        {pt.description} ({pt.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{t('units_per_container')}</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ej: 50"
                    value={customPkgQty ?? ''}
                    onChange={(e) => setCustomPkgQty(e.target.value ? Number(e.target.value) : null)}
                    className={`w-full p-2 rounded-lg border font-mono focus:outline-none focus:border-red-500 ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Real-time Simulation Results */}
        <div className={`lg:col-span-6 space-y-4 p-6 rounded-2xl border shadow-2xl flex flex-col justify-between ${
          isDarkMode
            ? 'bg-gradient-to-br from-slate-900 via-slate-900/90 to-red-950/30 border-red-900/40'
            : 'bg-white border-slate-200 shadow-slate-200'
        }`}>
          <div>
            <div className={`flex items-center justify-between pb-3 border-b ${
              isDarkMode ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-red-500 flex items-center gap-2">
                <Boxes className="w-4 h-4" />
                <span>Resultado de Simulación</span>
              </h3>
              {selectedPkgType && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}>
                  {selectedPkgType.category}
                </span>
              )}
            </div>

            {calculation.hasPackaging ? (
              <div className="mt-5 space-y-5">
                {/* Big Metric Box */}
                <div className={`p-5 rounded-2xl border text-center ${
                  isDarkMode ? 'bg-slate-950/80 border-red-500/30' : 'bg-red-50/50 border-red-200'
                }`}>
                  <span className={`text-xs uppercase font-bold block mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{t('containers_needed')}</span>
                  <div className="text-5xl font-black text-red-500 tracking-tight">
                    {calculation.containersNeeded}
                  </div>
                  <span className={`text-xs font-bold mt-1 block ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {selectedPkgType?.description || 'Contenedores Estándar'}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className={`p-3.5 rounded-xl border ${
                    isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className={`block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Contenedores Completos:</span>
                    <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{calculation.fullContainers}</span>
                  </div>
                  <div className={`p-3.5 rounded-xl border ${
                    isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className={`block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Unidades Restantes:</span>
                    <span className="text-lg font-bold text-amber-500">{calculation.remainingUnits}</span>
                  </div>
                </div>

                {/* Occupancy Gauge */}
                <div className={`p-4 rounded-xl border space-y-2 ${
                  isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex justify-between text-xs font-bold">
                    <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{t('occupancy')}:</span>
                    <span className="text-emerald-500">{calculation.occupancyRate}%</span>
                  </div>
                  <div className={`w-full rounded-full h-2 overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        calculation.occupancyRate >= 90
                          ? 'bg-emerald-500'
                          : calculation.occupancyRate >= 50
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${calculation.occupancyRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p>Selecciona una referencia con contenedor o activa la personalización manual para simular el cubicaje.</p>
              </div>
            )}
          </div>

          <div className={`pt-4 border-t text-[11px] flex items-center justify-between ${
            isDarkMode ? 'border-slate-800/80 text-slate-400' : 'border-slate-100 text-slate-500'
          }`}>
            <span>Cálculo según estándar de logística Alsina</span>
            <span className={`font-mono ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{quantity.toLocaleString('es-ES')} {t('total_units').toLowerCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

