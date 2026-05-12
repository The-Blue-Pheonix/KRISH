import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell, Search, Menu, Moon, Sun, X, Globe } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useTranslation } from 'react-i18next';

export default function DashboardLayout() {
  const { t, i18n } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        langRef.current &&
        !langRef.current.contains(event.target)
      ) {
        setIsLangOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Load User, Theme, and Hydrate state
  useEffect(() => {
    // 1. Fetch Supabase User
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
        } else {
          // Fallback user for hackathon testing without login
          setUser({ email: 'farmer@krishi.com', user_metadata: { full_name: 'Krishi Demo' } });
        }
      } catch (err) {
        console.warn('Supabase auth lock warning suppressed in dev mode:', err);
        setUser({ email: 'farmer@krishi.com', user_metadata: { full_name: 'Krishi Demo' } });
      }
    };
    fetchUser();

    // 2. Fetch Theme Setting
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f4f7f6] dark:bg-slate-900 text-neutral-800 dark:text-neutral-100 flex font-sans transition-colors duration-200">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar Component */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        closeSidebar={() => setIsSidebarOpen(false)} 
        onLogout={handleLogout}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen overflow-hidden">
        
        {/* Top Navbar */}
        <header className="h-20 bg-white dark:bg-slate-800 border-b border-neutral-200 dark:border-slate-700 px-4 md:px-10 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-neutral-500 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-neutral-50 dark:hover:bg-slate-700"
            >
              <Menu size={24} />
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <input 
                type="text" 
                placeholder={t('layout.search_placeholder')}
                className="bg-neutral-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-64 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Language Selector */}
            <div className="relative" ref={langRef}>
    
              <button
                onClick={() => setIsLangOpen((prev) => !prev)}
                className="flex items-center gap-1.5 p-2 text-neutral-500 dark:text-neutral-400 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-lg hover:bg-neutral-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Globe size={20} />
                <span className="text-xs font-bold uppercase hidden sm:inline-block">
                  {i18n.language?.split("-")[0] || "en"}
                </span>
              </button>

              {isLangOpen && (
                <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-neutral-100 dark:border-slate-700 overflow-hidden z-50">
                  
                  {["en", "hi", "bn", "mr", "ta"].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        i18n.changeLanguage(lang);
                        setIsLangOpen(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm font-medium hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors ${
                        i18n.language?.startsWith(lang)
                          ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-slate-700/50"
                          : "text-neutral-700 dark:text-neutral-300"
                      }`}
                    >
                      {lang === "en"
                        ? "English"
                        : lang === "hi"
                        ? "हिन्दी"
                        : lang === "bn"
                        ? "বাংলা"
                        : lang === "mr"
                        ? "मराठी"
                        : "தமிழ்"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-full hover:bg-neutral-50 dark:hover:bg-slate-700 transition-colors"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notifications */}
            <button className="relative p-2 text-neutral-500 dark:text-neutral-400 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-full hover:bg-neutral-50 dark:hover:bg-slate-700 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-800"></span>
            </button>
            
            {/* Profile Dropdown Simulation */}
            <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-neutral-200 dark:border-slate-700 cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-bold shadow-sm">
                {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'F'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 line-clamp-1 max-w-[120px]">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Farmer"}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{t('layout.verified_account')}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Pages Output */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
            <Outlet />
        </main>

      </div>
    </div>
  );
}
