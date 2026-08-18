import React, { useState } from 'react';
import {
  List,
  Plus,
  LayoutGrid,
  Database,
  Calculator,
  ChevronDown,
  LogOut,
  Bookmark,
  FileSpreadsheet,
  Languages,
  Scale,
  Sun,
  Moon,
} from 'lucide-react';
import { PortalUser, getPortalUrl } from '../usePortalAuth';
import logoImg from '../logo-aceler.png';
import { useTranslation } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';
import { LanguageCode } from '../i18n/translations';

interface HeaderProps {
  activeTab: 'calculation' | 'containers' | 'database' | 'sandbox' | 'saved';
  setActiveTab: (tab: 'calculation' | 'containers' | 'database' | 'sandbox' | 'saved') => void;
  totalArticlesInDb: number;
  totalPackagingTypes: number;
  user: PortalUser | null;
  hasLoadedFile: boolean;
  savedProjectsCount?: number;
  onNewCalculation?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  totalArticlesInDb,
  user,
  hasLoadedFile,
  savedProjectsCount = 0,
  onNewCalculation,
}) => {
  const portalUrl = getPortalUrl();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { t, language, setLanguage, currentLanguage, availableLanguages } = useTranslation();
  const { isDarkMode, toggleDarkMode, unitSystem, toggleUnitSystem } = useTheme();

  const getUserInitials = (name?: string) => {
    if (!name) return 'AP';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="bg-[#831A26] shadow-md sticky top-0 z-50 transition-all duration-300 w-full border-b border-black/20">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-4 relative">
        {/* Left Side: Branded Logo + Action Button + Guardados */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0 z-10">
          <a href={portalUrl} className="flex items-center select-none" title="Alsina | aCeler HC">
            <img
              src={logoImg}
              alt="Alsina | aCeler HC"
              className="h-8 md:h-9 w-auto object-contain"
            />
          </a>

          {/* Action: + Nuevo Cálculo */}
          <button
            onClick={() => {
              if (onNewCalculation) {
                onNewCalculation();
              } else {
                setActiveTab('calculation');
              }
            }}
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer select-none bg-white/15 hover:bg-white/25 border border-white/30 text-white hover:scale-[1.02] active:scale-[0.98]"
            title={t('new_calculation')}
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">{t('new_calculation')}</span>
          </button>

          {/* Tab: Guardados */}
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer select-none ${
              activeTab === 'saved'
                ? 'bg-white text-[#831A26] font-bold shadow-sm'
                : 'bg-white/10 border border-white/20 hover:bg-white/20 text-white'
            }`}
            title={t('saved')}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('saved')}</span>
            {savedProjectsCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'saved'
                    ? 'bg-[#831A26] text-white'
                    : 'bg-red-500 text-white'
                }`}
              >
                {savedProjectsCount}
              </span>
            )}
          </button>
        </div>

        {/* Center: Back to Portal button in the exact center of the screen */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 hidden md:flex">
          <a
            href={portalUrl}
            className="flex items-center gap-2 border border-white/30 text-white rounded-lg px-3 py-1.5 hover:bg-white/10 transition-all font-medium text-xs md:text-sm bg-transparent pointer-events-auto shadow-xs shrink-0 whitespace-nowrap"
            title={t('back_to_portal')}
          >
            <List className="w-4 h-4" />
            <span>{t('back_to_portal')}</span>
          </a>
        </div>

        {/* Right Side: Navigation Tabs + Profile Button */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 md:space-x-2 shrink-0 z-10">
          {/* Tab: Cálculo */}
          <button
            onClick={() => setActiveTab('calculation')}
            className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer select-none ${
              activeTab === 'calculation'
                ? 'bg-white text-[#831A26] font-bold shadow-sm'
                : 'bg-white/10 border border-white/20 hover:bg-white/20 text-white'
            }`}
            title={t('calculation')}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{t('calculation')}</span>
            {hasLoadedFile && (
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  activeTab === 'calculation' ? 'bg-[#831A26]' : 'bg-emerald-400'
                } animate-pulse`}
              ></span>
            )}
          </button>

          {/* Tab: Contenedores */}
          <button
            onClick={() => setActiveTab('containers')}
            className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer select-none ${
              activeTab === 'containers'
                ? 'bg-white text-[#831A26] font-bold shadow-sm'
                : 'bg-white/10 border border-white/20 hover:bg-white/20 text-white'
            }`}
            title={t('containers')}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('containers')}</span>
          </button>

          {/* Tab: Catálogo */}
          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer select-none ${
              activeTab === 'database'
                ? 'bg-white text-[#831A26] font-bold shadow-sm'
                : 'bg-white/10 border border-white/20 hover:bg-white/20 text-white'
            }`}
            title={t('catalog')}
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('catalog')}</span>
            {totalArticlesInDb > 0 && (
              <span
                className={`text-[10px] px-1 rounded-full font-bold ${
                  activeTab === 'database'
                    ? 'bg-red-100 text-[#831A26]'
                    : 'bg-white/20 text-white'
                }`}
              >
                {totalArticlesInDb.toLocaleString('es-ES')}
              </span>
            )}
          </button>

          {/* Tab: Simulador */}
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer select-none ${
              activeTab === 'sandbox'
                ? 'bg-white text-[#831A26] font-bold shadow-sm'
                : 'bg-white/10 border border-white/20 hover:bg-white/20 text-white'
            }`}
            title={t('simulator')}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{t('simulator')}</span>
          </button>

          {/* User Profile Pill Button with Dropdown Menu */}
          <div className="relative shrink-0">
            <div
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 border border-white/30 text-white rounded-lg px-2.5 sm:px-3 py-1.5 hover:bg-white/10 transition-all font-medium text-xs md:text-sm bg-transparent cursor-pointer select-none shrink-0 shadow-xs"
              title={t('user_menu')}
            >
              <div className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center text-white text-[10px] font-extrabold shrink-0">
                {getUserInitials(user?.name)}
              </div>
              <span className="leading-none hidden sm:inline">
                {user?.name || 'Alejandro Pardo'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-white/70 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Profile Dropdown matching exact requested design */}
            {isProfileOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setIsProfileOpen(false)}
                />
                <div
                  className={`absolute right-0 mt-2 w-64 rounded-xl shadow-2xl z-50 text-left overflow-hidden py-0 animate-fadeIn ${
                    isDarkMode
                      ? 'bg-[#18181c] border border-gray-800 text-slate-100 divide-y divide-gray-800/80 shadow-black/60'
                      : 'bg-white border border-gray-200 text-slate-800 divide-y divide-gray-100 shadow-slate-300/50'
                  }`}
                >
                  {/* User info header */}
                  <div className={`px-4 py-3 ${isDarkMode ? 'bg-[#121215]' : 'bg-gray-50/80'}`}>
                    <p className={`text-xs font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {user?.name || 'Alejandro Pardo'}
                    </p>
                    <p className={`text-[11px] truncate mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {user?.email || 'admin@alsina.com'}
                    </p>
                  </div>

                  {/* 1. Language Selection Row */}
                  <div
                    className={`relative flex items-center justify-between px-4 py-3 cursor-pointer group transition-colors ${
                      isDarkMode ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Languages className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className="text-xs font-semibold">{currentLanguage.nativeName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{currentLanguage.flag}</span>
                      <ChevronDown className={`w-3.5 h-3.5 ${isDarkMode ? 'text-gray-500 group-hover:text-gray-300' : 'text-gray-400 group-hover:text-gray-600'}`} />
                    </div>
                    {/* Transparent select overlay for native multi-language selector */}
                    <select
                      value={language}
                      onChange={(e) => {
                        setLanguage(e.target.value as LanguageCode);
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
                      title="Seleccionar idioma / Select language"
                    >
                      {availableLanguages.map((lang) => (
                        <option key={lang.code} value={lang.code} className="bg-slate-900 text-white py-1">
                          {lang.flag} {lang.nativeName} ({lang.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Unit System toggle row */}
                  <div
                    onClick={toggleUnitSystem}
                    className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                      isDarkMode ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50'
                    }`}
                    title="Cambiar unidades del proyecto"
                  >
                    <div className="flex items-center gap-2.5">
                      <Scale className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className="text-xs font-medium">
                        {unitSystem === 'metric' ? t('switch_to_imperial') : t('switch_to_metric')}
                      </span>
                    </div>
                    <div
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded leading-none ${
                        isDarkMode
                          ? 'bg-red-950/60 text-red-400 border border-red-800/40'
                          : 'bg-red-50 text-[#AA182C] border border-[#AA182C]/15'
                      }`}
                    >
                      {unitSystem === 'metric' ? 'cm/kg' : 'in/lb'}
                    </div>
                  </div>

                  {/* 3. Dark Mode Toggle Switch Row */}
                  <div
                    onClick={toggleDarkMode}
                    className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                      isDarkMode ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50'
                    }`}
                    title="Alternar entre modo oscuro y modo claro"
                  >
                    <div className="flex items-center gap-2.5">
                      {isDarkMode ? (
                        <Sun className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Moon className="w-4 h-4 text-slate-600" />
                      )}
                      <span className="text-xs font-medium">{t('dark_mode')}</span>
                    </div>
                    {/* Custom Animated Pill Switch */}
                    <div
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer flex items-center ${
                        isDarkMode ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                          isDarkMode ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>

                  {/* 4. Logout Row */}
                  <a
                    href={portalUrl}
                    className={`flex items-center gap-2.5 px-4 py-3 text-xs font-semibold text-red-500 transition-colors ${
                      isDarkMode ? 'hover:bg-red-950/30' : 'hover:bg-red-50'
                    }`}
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>{t('logout')}</span>
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};


