import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Search,
  Filter,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Edit2,
  CheckCircle2,
  RefreshCw,
  Save,
  X,
} from 'lucide-react';
import { PackagingType } from '../types';
import defaultPackagingTypes from '../data/packagingTypes.json';
import { useTranslation } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';

interface ArticleItem {
  id: number;
  code: string;
  name: string;
  packaging_type_id: number | null;
  packaging_qty: number | null;
  family: string | null;
  subfamily: string | null;
  packaging_description: string | null;
  packaging_category: string | null;
  packaging_icon: string | null;
  packaging_color: string | null;
}

interface DatabaseExplorerProps {
  onDatabaseUpdated?: () => void;
}

export const DatabaseExplorer: React.FC<DatabaseExplorerProps> = ({
  onDatabaseUpdated,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedPkgType, setSelectedPkgType] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 40;

  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [packagingTypes, setPackagingTypes] = useState<PackagingType[]>(
    defaultPackagingTypes as PackagingType[]
  );

  // Edit modal state
  const [editingArticle, setEditingArticle] = useState<ArticleItem | null>(null);
  const [editPkgType, setEditPkgType] = useState<number | null>(null);
  const [editPkgQty, setEditPkgQty] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Load packaging types from backend
  useEffect(() => {
    fetch('/api/contenedores/packaging-types')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPackagingTypes(data);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch articles from MySQL API
  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('limit', String(pageSize));

      if (debouncedSearch.trim()) {
        params.set('search', debouncedSearch.trim());
      }

      if (selectedPkgType !== 'ALL') {
        params.set('packaging_type_id', selectedPkgType === 'NONE' ? '0' : selectedPkgType);
      }

      const res = await fetch(`/api/contenedores/articles?${params.toString()}`);
      if (!res.ok) throw new Error('Error al conectar con la base de datos MySQL');
      const data = await res.json();

      setArticles(data.articles || []);
      setTotalCount(data.pagination?.total || 0);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      console.warn('Backend MySQL no disponible, usando base de datos local:', err);
      setArticles([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, selectedPkgType]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleOpenEdit = (art: ArticleItem) => {
    setEditingArticle(art);
    setEditPkgType(art.packaging_type_id);
    setEditPkgQty(art.packaging_qty);
    setSaveSuccess(false);
  };

  const handleSaveEdit = async () => {
    if (!editingArticle) return;
    setIsSaving(true);

    try {
      const res = await fetch(`/api/contenedores/articles/${editingArticle.code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingArticle.name,
          packaging_type_id: editPkgType,
          packaging_qty: editPkgQty,
          family: editingArticle.family,
          subfamily: editingArticle.subfamily,
        }),
      });

      if (!res.ok) throw new Error('Error al guardar en MySQL');
      await res.json();

      setSaveSuccess(true);
      setTimeout(() => {
        setEditingArticle(null);
        setSaveSuccess(false);
        fetchArticles();
      }, 700);

      if (onDatabaseUpdated) onDatabaseUpdated();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg ${
        isDarkMode
          ? 'bg-gradient-to-r from-slate-900 via-slate-900/90 to-red-950/30 border-slate-800'
          : 'bg-white border-slate-200 shadow-slate-200'
      }`}>
        <div>
          <h2 className={`text-lg font-black flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            <Database className="w-5 h-5 text-red-500" />
            <span>{t('database')}</span>
          </h2>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {totalCount.toLocaleString('es-ES')} {t('total_references').toLowerCase()} en <code className="text-red-500 font-mono">contenedores_articles</code>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchArticles}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
          <div className={`px-3.5 py-2 rounded-xl border text-xs ${
            isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Tipos de contenedor: </span>
            <span className="font-bold text-red-500">{packagingTypes.length}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={`flex flex-col md:flex-row items-center justify-between gap-3 p-4 rounded-2xl border ${
        isDarkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border focus:outline-none focus:border-red-500 ${
              isDarkMode
                ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
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

        {/* Packaging Type Filter Selector */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedPkgType}
            onChange={(e) => {
              setSelectedPkgType(e.target.value);
              setCurrentPage(1);
            }}
            className={`w-full md:w-auto px-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-red-500 ${
              isDarkMode
                ? 'bg-slate-950 border-slate-800 text-slate-200'
                : 'bg-slate-50 border-slate-300 text-slate-800'
            }`}
          >
            <option value="ALL">{t('select_all')} ({totalCount.toLocaleString('es-ES')})</option>
            <option value="NONE">{t('without_container_loose')}</option>
            {packagingTypes.map((pt) => (
              <option key={pt.id} value={pt.id}>
                {pt.description} ({pt.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Articles Table */}
      <div className={`rounded-2xl border shadow-md overflow-hidden ${
        isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-slate-200'
      }`}>
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="p-16 text-center text-xs text-slate-400">
              <RefreshCw className="w-8 h-8 text-red-500 animate-spin mx-auto mb-2" />
              <p>Consultando base de datos MySQL...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-400">
              <Database className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p>No se encontraron artículos con los filtros aplicados</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className={`uppercase font-semibold border-b ${
                isDarkMode ? 'bg-slate-950/80 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                <tr>
                  <th className="py-3 px-4">{t('code')}</th>
                  <th className="py-3 px-4">{t('description')}</th>
                  <th className="py-3 px-4">Familia / Subfam</th>
                  <th className="py-3 px-4">{t('assigned_container')}</th>
                  <th className="py-3 px-4 text-right">{t('units_per_container')}</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                isDarkMode ? 'divide-slate-800/60 text-slate-200' : 'divide-slate-200 text-slate-800'
              }`}>
                {articles.map((art) => (
                  <tr key={art.code} className={`transition-colors ${
                    isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                  }`}>
                    <td className={`py-2.5 px-4 font-mono font-bold whitespace-nowrap ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}>
                      {art.code}
                    </td>
                    <td className={`py-2.5 px-4 max-w-sm truncate ${
                      isDarkMode ? 'text-slate-200' : 'text-slate-700'
                    }`} title={art.name}>
                      {art.name}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 font-mono">
                      {art.family ? `F${art.family}${art.subfamily ? ` / S${art.subfamily}` : ''}` : '—'}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      {art.packaging_description ? (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                          isDarkMode
                            ? 'bg-slate-800 text-slate-200 border-slate-700'
                            : 'bg-slate-100 text-slate-800 border-slate-300'
                        }`}>
                          <Boxes className="w-3.5 h-3.5 text-red-500" />
                          {art.packaging_description}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">{t('without_container_loose')}</span>
                      )}
                    </td>
                    <td className={`py-2.5 px-4 text-right font-mono font-bold ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}>
                      {art.packaging_qty ? art.packaging_qty.toLocaleString('es-ES') : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenEdit(art)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          isDarkMode
                            ? 'bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-300 border-slate-700 hover:border-red-600/40'
                            : 'bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 border-slate-300 hover:border-red-300'
                        }`}
                        title="Modificar asignación de contenedor"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Bar */}
        <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
          isDarkMode ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <div>
            Mostrando {articles.length} de {totalCount.toLocaleString('es-ES')} artículos (Página {currentPage} de {totalPages})
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className={`p-2 rounded-xl border transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none ${
                isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className={`font-bold px-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
              className={`p-2 rounded-xl border transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none ${
                isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Article Modal */}
      {editingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl space-y-4 ${
            isDarkMode ? 'bg-slate-900 border-red-900/40' : 'bg-white border-slate-200'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${
              isDarkMode ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <h3 className={`text-base font-black flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                <Edit2 className="w-4 h-4 text-red-500" />
                <span>Editar Embalaje en MySQL</span>
              </h3>
              <button
                onClick={() => setEditingArticle(null)}
                className={`p-1 cursor-pointer ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className={`font-bold block mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{t('code')}</label>
                <div className={`font-mono font-bold text-sm p-2.5 rounded-xl border ${
                  isDarkMode ? 'text-white bg-slate-950 border-slate-800' : 'text-slate-900 bg-slate-50 border-slate-200'
                }`}>
                  {editingArticle.code}
                </div>
              </div>

              <div>
                <label className={`font-bold block mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{t('description')}</label>
                <div className={`p-2.5 rounded-xl border ${
                  isDarkMode ? 'text-slate-200 bg-slate-950 border-slate-800' : 'text-slate-800 bg-slate-50 border-slate-200'
                }`}>
                  {editingArticle.name}
                </div>
              </div>

              <div>
                <label className={`font-bold block mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{t('assigned_container')}</label>
                <select
                  value={editPkgType || ''}
                  onChange={(e) => setEditPkgType(e.target.value ? Number(e.target.value) : null)}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-red-500 ${
                    isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="">{t('without_container_loose')}</option>
                  {packagingTypes.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.description} ({pt.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`font-bold block mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{t('units_per_container')}</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ej: 50"
                  value={editPkgQty ?? ''}
                  onChange={(e) => setEditPkgQty(e.target.value ? Number(e.target.value) : null)}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-red-500 font-mono ${
                    isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Asignación guardada con éxito en la base de datos</span>
              </div>
            )}

            <div className={`flex items-center justify-end gap-3 pt-3 border-t ${
              isDarkMode ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <button
                onClick={() => setEditingArticle(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                  isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#AA182C] to-[#801221] hover:from-[#C72641] hover:to-[#AA182C] text-white shadow-md transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? t('saving') : t('save_to_db')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
