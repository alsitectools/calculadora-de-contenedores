import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  Copy,
  Check,
  Download,
} from 'lucide-react';
import { GlobalProjectSummary, AddedProvisionalContainer } from '../types';
import { exportToExcel, exportToCSV } from '../utils/excelExporter';
import { useTranslation } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: GlobalProjectSummary | null;
  provisionalContainers?: Record<string, AddedProvisionalContainer[]>;
}

type ContainerInfo = GlobalProjectSummary['containersByType'][string];

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  summary,
  provisionalContainers,
}) => {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  if (!isOpen || !summary) return null;

  const handleCopySummary = () => {
    let text = `INFORME DE CÁLCULO DE CONTENEDORES ALSINA\n`;
    text += `Archivo: ${summary.fileName} (${summary.fileType})\n`;
    text += `Total Contenedores: ${summary.totalContainers}\n`;
    text += `Total Unidades: ${summary.totalUnits}\n`;
    text += `Referencias: ${summary.totalDistinctArticles}\n`;
    text += `Ocupación Media: ${Number(summary.averageOccupancy).toFixed(2)}%\n\n`;
    text += `DESGLOSE DE CONTENEDORES:\n`;
    (Object.values(summary.containersByType) as ContainerInfo[]).forEach((ct: ContainerInfo) => {
      text += `- ${ct.count}x ${ct.description} (${ct.totalUnitsPacked} piezas)\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className={`relative w-full max-w-lg rounded-3xl border p-6 shadow-2xl space-y-6 ${
        isDarkMode ? 'bg-slate-900 border-red-900/40' : 'bg-white border-slate-200'
      }`}>
        {/* Modal Header */}
        <div className={`flex items-center justify-between pb-3 border-b ${
          isDarkMode ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              isDarkMode ? 'bg-red-600/15 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-[#AA182C]'
            }`}>
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-lg font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {t('export_excel')}
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Selecciona el formato de exportación deseado
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Options Cards */}
        <div className="space-y-3">
          {/* Excel XLSX */}
          <button
            onClick={() => {
              exportToExcel(summary, provisionalContainers);
              onClose();
            }}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all group text-left cursor-pointer ${
              isDarkMode
                ? 'bg-slate-950/80 hover:bg-slate-800/80 border-slate-800 hover:border-emerald-500/50'
                : 'bg-slate-50 hover:bg-emerald-50/50 border-slate-200 hover:border-emerald-500/50'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h4 className={`text-sm font-bold group-hover:text-emerald-500 transition-colors ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  Libro Excel Completo (.xls)
                </h4>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Incluye 3 hojas: Resumen Global, Detalle de Artículos y Por Capítulos
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
          </button>

          {/* CSV File */}
          <button
            onClick={() => {
              exportToCSV(summary, provisionalContainers);
              onClose();
            }}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all group text-left cursor-pointer ${
              isDarkMode
                ? 'bg-slate-950/80 hover:bg-slate-800/80 border-slate-800 hover:border-red-500/50'
                : 'bg-slate-50 hover:bg-red-50/50 border-slate-200 hover:border-red-500/50'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-red-600/10 text-red-500 border border-red-500/20 group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className={`text-sm font-bold group-hover:text-red-500 transition-colors ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  Fichero CSV Plano (.csv)
                </h4>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Columnas: Código, Cantidad, Descripción, Capítulo, Subcapítulo
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors" />
          </button>

          {/* Copy to Clipboard */}
          <button
            onClick={handleCopySummary}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all group text-left cursor-pointer ${
              isDarkMode
                ? 'bg-slate-950/80 hover:bg-slate-800/80 border-slate-800 hover:border-amber-500/50'
                : 'bg-slate-50 hover:bg-amber-50/50 border-slate-200 hover:border-amber-500/50'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 group-hover:scale-105 transition-transform">
                {copied ? (
                  <Check className="w-6 h-6 text-emerald-500" />
                ) : (
                  <Copy className="w-6 h-6" />
                )}
              </div>
              <div>
                <h4 className={`text-sm font-bold group-hover:text-amber-500 transition-colors ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  {copied ? '¡Copiado al portapapeles!' : 'Copiar Resumen de Texto'}
                </h4>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Copia el resumen de totales y contenedores para pegar en correo o notas
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Modal Footer */}
        <div className="pt-2 flex items-center justify-end">
          <button
            onClick={onClose}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

