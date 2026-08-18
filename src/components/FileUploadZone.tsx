import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import { useTranslation } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';

interface FileUploadZoneProps {
  onFileLoaded: (content: string, fileName: string) => void;
  isLoading: boolean;
  currentFileName?: string;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileLoaded,
  isLoading,
  currentFileName,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onFileLoaded(content, file.name);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  return (
    <div className="mb-8">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative overflow-hidden rounded-3xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? 'border-red-500 bg-red-950/20 scale-[1.01] shadow-2xl shadow-red-950/40'
            : isDarkMode
            ? currentFileName
              ? 'border-slate-800 bg-slate-900/70 hover:border-red-500/40 hover:bg-slate-900/90 shadow-lg'
              : 'border-slate-800/90 bg-slate-900/40 hover:border-red-600/30 hover:bg-slate-900/70'
            : currentFileName
            ? 'border-slate-300 bg-white hover:border-red-500 hover:bg-slate-50 shadow-md'
            : 'border-slate-300 bg-white/80 hover:border-red-500/60 hover:bg-white shadow-sm'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt,.tsv"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg ${
              currentFileName
                ? isDarkMode
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-emerald-950/20'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-300 shadow-emerald-100'
                : isDarkMode
                ? 'bg-red-600/10 text-red-400 border border-red-500/20 shadow-red-950/20'
                : 'bg-red-50 text-[#AA182C] border border-red-200 shadow-red-100'
            }`}
          >
            {currentFileName ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>

          <div>
            <h3 className={`text-base font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {currentFileName ? (
                <span className="flex items-center justify-center gap-2 flex-wrap">
                  {t('calculation')}: <span className={`font-mono px-2.5 py-0.5 rounded-lg border ${
                    isDarkMode
                      ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/20'
                      : 'text-emerald-700 bg-emerald-50 border-emerald-300 font-bold'
                  }`}>{currentFileName}</span>
                </span>
              ) : (
                t('drag_drop_title')
              )}
            </h3>
            <p className={`text-xs max-w-lg mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {currentFileName
                ? t('change_file')
                : t('drag_drop_subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2.5 mt-2 flex-wrap justify-center">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isDarkMode
                ? 'bg-slate-900 text-slate-300 border-slate-700/80'
                : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}>
              <FileSpreadsheet className={`w-3.5 h-3.5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
              {t('csv_alsina')}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isDarkMode
                ? 'bg-slate-900 text-slate-300 border-slate-700/80'
                : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}>
              <FileText className={`w-3.5 h-3.5 ${isDarkMode ? 'text-red-400' : 'text-[#AA182C]'}`} />
              {t('txt_hemox')}
            </span>
          </div>
        </div>
      </div>

      {/* Demo Action Buttons */}
      <div className="flex items-center justify-center gap-3 pt-1 flex-wrap">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const demoCsv = `Código;Cant. Oferta;Nombre del Artículo en el Idioma del Cliente;Nombre del Capítulo;Nombre del Subcapítulo
010101;120;MECANOCONCEPTO CABEZAL RECUPERABLE;MURO Y PILARES;ENCOFRADO VERTICAL
010102;85;VIGA EXTENSIBLE 2.0-3.5M ALSI;MURO Y PILARES;ENCOFRADO VERTICAL
020101;45;PUNTAL ALSIFLEX 3.50M;LOSAS Y FORJADOS;APUNTALAMIENTO
020102;60;PUNTAL ALUPRO-400;LOSAS Y FORJADOS;APUNTALAMIENTO
030101;200;CUÑA DE MADERA TRATADA;ACCESORIOS;VARIOS
030102;150;TORNILLO Y TUERCA HEXAG. 16X50;ACCESORIOS;TORNILLERIA`;
            onFileLoaded(demoCsv, 'Oferta_Demostracion_Alsina.csv');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border shadow-sm transition-all cursor-pointer hover:scale-[1.02] ${
            isDarkMode
              ? 'bg-slate-900 hover:bg-slate-800 text-emerald-300 border-emerald-500/30'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
          <span>Probar con archivo de demostración CSV</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const demoTxt = `010101\t150\tMECANOCONCEPTO CABEZAL RECUPERABLE\tESTRUCTURA\tFASE 1
020101\t90\tPUNTAL ALSIFLEX 3.50M\tESTRUCTURA\tFASE 2
030101\t300\tCUÑA DE MADERA TRATADA\tACCESORIOS\tGENERAL`;
            onFileLoaded(demoTxt, 'Oferta_Demostracion_Alsina.txt');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border shadow-sm transition-all cursor-pointer hover:scale-[1.02] ${
            isDarkMode
              ? 'bg-slate-900 hover:bg-slate-800 text-red-300 border-red-500/30'
              : 'bg-red-50 hover:bg-red-100 text-[#AA182C] border-red-200'
          }`}
        >
          <FileText className="w-4 h-4 text-red-500" />
          <span>Probar con archivo TXT</span>
        </button>
      </div>
    </div>
  );
};
