import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { MetricsHUD } from './components/MetricsHUD';
import { FileUploadZone } from './components/FileUploadZone';
import { ContainerFilterBar, DEFAULT_PACKAGING_TYPE_IDS } from './components/ContainerFilterBar';
import { GroupedCalculationView } from './components/GroupedCalculationView';
import { ContainerSummaryCards } from './components/ContainerSummaryCards';
import { DatabaseExplorer } from './components/DatabaseExplorer';
import { QuickCalculatorModal } from './components/QuickCalculatorModal';
import { ExportModal } from './components/ExportModal';
import { SavedProjectsView } from './components/SavedProjectsView';
import { parseUploadedFile, ParsedRawItem } from './utils/fileParsers';
import { calculateProjectContainers } from './utils/containerCalculator';
import { GroupingMode, GlobalProjectSummary, PackagingType, AddedProvisionalContainer } from './types';
import { usePortalAuth } from './usePortalAuth';
import defaultPackagingTypes from './data/packagingTypes.json';
import defaultArticlesCatalog from './data/articlesCatalog.json';
import { CheckCircle2 } from 'lucide-react';
import { I18nProvider, useTranslation } from './context/I18nContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

function MainApp() {
  const { user } = usePortalAuth();
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'calculation' | 'containers' | 'database' | 'sandbox' | 'saved'>('calculation');
  const [rawItems, setRawItems] = useState<ParsedRawItem[]>([]);
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [currentFileType, setCurrentFileType] = useState<'CSV' | 'TXT'>('CSV');
  const [groupingMode, setGroupingMode] = useState<GroupingMode>('CHAPTER_AND_SUBCHAPTER');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState<number>(0);

  // Added provisional containers per chapter
  const [provisionalContainers, setProvisionalContainers] = useState<Record<string, AddedProvisionalContainer[]>>({});

  // State for enabled container/packaging types in calculation (defaults to [12, 18]: CONTENEDOR ALSI. and PORTAPUNTAL)
  const [selectedPackagingTypeIds, setSelectedPackagingTypeIds] = useState<number[]>(DEFAULT_PACKAGING_TYPE_IDS);

  // Compute calculated project summary reactively with packaging filters applied
  const summary: GlobalProjectSummary | null = useMemo(() => {
    if (rawItems.length === 0) return null;
    return calculateProjectContainers(
      rawItems,
      currentFileName,
      currentFileType,
      groupingMode,
      selectedPackagingTypeIds
    );
  }, [rawItems, currentFileName, currentFileType, groupingMode, selectedPackagingTypeIds]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleFileLoaded = (content: string, fileName: string) => {
    setIsLoading(true);
    try {
      const result = parseUploadedFile(content, fileName);
      setRawItems(result.items);
      setCurrentFileName(fileName);
      setCurrentFileType(result.fileType as 'CSV' | 'TXT');
      setProvisionalContainers({});
      setActiveTab('calculation');
      showToast(`Archivo "${fileName}" cargado y calculado`);
    } catch (err) {
      console.error('Error parsing file:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (!summary) return;
    setIsSaving(true);
    try {
      const token = sessionStorage.getItem('portal_token');
      const res = await fetch('/api/contenedores/calculations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-portal-token': token } : {}),
        },
        body: JSON.stringify({
          project_name: currentFileName || 'Cálculo de Contenedores',
          file_name: currentFileName,
          file_type: currentFileType,
          total_units: summary.totalUnits,
          total_containers: summary.totalContainers,
          summary,
        }),
      });

      if (!res.ok) throw new Error('Error al guardar');
      showToast('¡Cálculo guardado exitosamente en la base de datos!');
      setSavedCount((c) => c + 1);
    } catch (err: any) {
      alert('Error al guardar cálculo: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadSavedProject = (loadedSummary: GlobalProjectSummary, projectName: string) => {
    setCurrentFileName(projectName);
    setCurrentFileType(loadedSummary.fileType);
    setActiveTab('calculation');
    showToast(`Proyecto "${projectName}" cargado`);
  };

  const handleNewCalculation = () => {
    setRawItems([]);
    setCurrentFileName('');
    setProvisionalContainers({});
    setActiveTab('calculation');
    showToast('Nuevo cálculo iniciado. Arrastra o selecciona un archivo para comenzar.');
  };

  const totalArticlesCount = Object.keys(defaultArticlesCatalog).length;
  const totalPackagingTypesCount = defaultPackagingTypes.length;

  return (
    <div className={`min-h-screen flex flex-col selection:bg-red-600 selection:text-white transition-colors duration-200 ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalArticlesInDb={totalArticlesCount}
        totalPackagingTypes={totalPackagingTypesCount}
        user={user}
        hasLoadedFile={rawItems.length > 0}
        savedProjectsCount={savedCount}
        onNewCalculation={handleNewCalculation}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 border border-emerald-500/40 text-white shadow-2xl shadow-emerald-950/40 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab 1: Calculation View & File Upload */}
        {activeTab === 'calculation' && (
          <div className="space-y-6">
            {/* File Upload Zone */}
            <FileUploadZone
              onFileLoaded={handleFileLoaded}
              isLoading={isLoading}
              currentFileName={currentFileName}
            />

            {/* Metrics HUD (Estadísticas) */}
            <MetricsHUD
              summary={summary}
              onViewContainersClick={() => setActiveTab('containers')}
            />

            {/* Grouped Chapter Breakdown (con Filtros de Envases fusionados) */}
            {summary && (
              <GroupedCalculationView
                summary={summary}
                groupingMode={groupingMode}
                setGroupingMode={setGroupingMode}
                provisionalContainers={provisionalContainers}
                setProvisionalContainers={setProvisionalContainers}
                onExportClick={() => setIsExportModalOpen(true)}
                onSaveToDatabase={handleSaveToDatabase}
                isSaving={isSaving}
                packagingTypes={defaultPackagingTypes as PackagingType[]}
                selectedPackagingTypeIds={selectedPackagingTypeIds}
                onChangeSelectedPackagingTypeIds={setSelectedPackagingTypeIds}
              />
            )}
          </div>
        )}

        {/* Tab 2: Executive Container Summary Cards */}
        {activeTab === 'containers' && (
          <div className="space-y-6">
            <ContainerFilterBar
              packagingTypes={defaultPackagingTypes as PackagingType[]}
              selectedTypeIds={selectedPackagingTypeIds}
              onChangeSelectedTypeIds={setSelectedPackagingTypeIds}
            />
            <ContainerSummaryCards summary={summary} />
          </div>
        )}

        {/* Tab 3: Master Database Explorer */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            <DatabaseExplorer />
          </div>
        )}

        {/* Tab 4: Quick Sandbox Calculator */}
        {activeTab === 'sandbox' && (
          <div className="space-y-6">
            <QuickCalculatorModal />
          </div>
        )}

        {/* Tab 5: Saved Projects */}
        {activeTab === 'saved' && (
          <div className="space-y-6">
            <SavedProjectsView
              onLoadProject={handleLoadSavedProject}
              onProjectsCountChanged={setSavedCount}
            />
          </div>
        )}
      </main>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        summary={summary}
        provisionalContainers={provisionalContainers}
      />

      {/* Corporate Footer */}
      <footer className={`mt-auto border-t py-6 text-center text-xs ${
        isDarkMode
          ? 'border-slate-900 bg-slate-950/90 text-slate-500'
          : 'border-slate-200 bg-white text-slate-500 shadow-sm'
      }`}>
        <div className="max-w-[1600px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Encofrados J. Alsina, S.A. — Calculadora de Contenedores y Empaquetado</p>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Base de Datos: {totalArticlesCount.toLocaleString('es-ES')} Referencias</span>
            <span>•</span>
            <span>Alsiapps Ecosystem</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <MainApp />
      </I18nProvider>
    </ThemeProvider>
  );
}

