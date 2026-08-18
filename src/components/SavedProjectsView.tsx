import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  Trash2,
  FolderOpen,
  Calendar,
  Boxes,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { GlobalProjectSummary } from '../types';
import { useTranslation } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';

interface SavedProjectRecord {
  id: number;
  user_id: number;
  project_name: string;
  file_name: string;
  file_type: string;
  total_units: number;
  total_containers: number;
  created_at: string;
  summary_json?: string;
  summary?: GlobalProjectSummary;
}

interface SavedProjectsViewProps {
  onLoadProject: (summary: GlobalProjectSummary, projectName: string) => void;
  onProjectsCountChanged?: (count: number) => void;
}

export const SavedProjectsView: React.FC<SavedProjectsViewProps> = ({
  onLoadProject,
  onProjectsCountChanged,
}) => {
  const [projects, setProjects] = useState<SavedProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  const fetchSavedProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('portal_token');
      const res = await fetch('/api/contenedores/calculations', {
        headers: token ? { 'x-portal-token': token } : {},
      });
      if (!res.ok) throw new Error('Error al cargar proyectos');
      const data = await res.json();
      setProjects(data);
      if (onProjectsCountChanged) onProjectsCountChanged(data.length);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con la base de datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedProjects();
  }, []);

  const handleOpenProject = async (id: number) => {
    try {
      const token = sessionStorage.getItem('portal_token');
      const res = await fetch(`/api/contenedores/calculations/${id}`, {
        headers: token ? { 'x-portal-token': token } : {},
      });
      if (!res.ok) throw new Error('Error al abrir proyecto');
      const data = await res.json();
      if (data.summary) {
        onLoadProject(data.summary, data.project_name);
      }
    } catch (err: any) {
      alert('No se pudo cargar el proyecto: ' + err.message);
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar este cálculo guardado?')) return;
    setDeletingId(id);
    try {
      const token = sessionStorage.getItem('portal_token');
      const res = await fetch(`/api/contenedores/calculations/${id}`, {
        method: 'DELETE',
        headers: token ? { 'x-portal-token': token } : {},
      });
      if (!res.ok) throw new Error('Error al eliminar');
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (onProjectsCountChanged) onProjectsCountChanged(projects.length - 1);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

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
            <Bookmark className="w-5 h-5 text-red-500" />
            <span>{t('saved')}</span>
          </h2>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Historial de cálculos de contenedores guardados en MySQL
          </p>
        </div>

        <button
          onClick={fetchSavedProjects}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors self-start sm:self-auto cursor-pointer ${
            isDarkMode
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          <RefreshCw className="w-8 h-8 text-red-500 animate-spin mx-auto mb-2" />
          <p>Cargando historial de cálculos...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-950/30 border border-red-500/30 text-center text-xs text-red-300">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      ) : projects.length === 0 ? (
        <div className={`p-12 text-center rounded-2xl border space-y-3 ${
          isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <Bookmark className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>No tienes cálculos guardados</h3>
          <p className={`text-xs max-w-sm mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Puedes guardar cualquier cálculo activo desde la pestaña de Cálculo usando el botón "{t('save_to_db')}".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className={`p-5 rounded-2xl border shadow-md space-y-3 transition-all ${
                isDarkMode
                  ? 'bg-slate-900/80 border-slate-800 hover:border-red-900/50'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-slate-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border ${
                    isDarkMode ? 'bg-red-600/10 text-red-400 border-red-500/20' : 'bg-red-50 text-[#AA182C] border-red-200'
                  }`}>
                    <Boxes className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold truncate max-w-[180px] ${isDarkMode ? 'text-white' : 'text-slate-900'}`} title={proj.project_name}>
                      {proj.project_name}
                    </h4>
                    <span className={`text-[11px] block font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {proj.file_name || 'Archivo manual'}
                    </span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                }`}>
                  {proj.file_type}
                </span>
              </div>

              <div className={`grid grid-cols-2 gap-2 pt-2 border-t text-xs ${isDarkMode ? 'border-slate-800/80' : 'border-slate-100'}`}>
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-slate-950/60' : 'bg-slate-50'}`}>
                  <span className={`block text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{t('containers')}:</span>
                  <span className="font-bold text-red-500 text-sm">{proj.total_containers}</span>
                </div>
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-slate-950/60' : 'bg-slate-50'}`}>
                  <span className={`block text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{t('total_units')}:</span>
                  <span className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{proj.total_units.toLocaleString('es-ES')}</span>
                </div>
              </div>

              <div className={`flex items-center justify-between pt-2 text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>{new Date(proj.created_at).toLocaleDateString('es-ES')}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleDeleteProject(proj.id)}
                    disabled={deletingId === proj.id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Eliminar cálculo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenProject(proj.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600/20 text-red-600 dark:text-red-300 hover:bg-red-600 hover:text-white border border-red-500/30 transition-all cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Cargar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
