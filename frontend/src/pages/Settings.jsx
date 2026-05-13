import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabaseClient';
import {
  User, Mail, Lock, Bell, Globe, Moon, Sun, Shield, Eye, EyeOff,
  Save, ChevronRight, LogOut, Trash2, Camera, Check
} from 'lucide-react';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedLang, setSelectedLang] = useState(i18n.language?.split('-')[0] || 'en');
  const [notifications, setNotifications] = useState({
    weather: true, crop: true, market: false, newsletter: false
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          setFullName(user.user_metadata?.full_name || '');
          setEmail(user.email || '');
        } else {
          setFullName('Krishi Demo');
          setEmail('farmer@krishi.com');
        }
      } catch {
        setFullName('Krishi Demo');
        setEmail('farmer@krishi.com');
      }
    };
    fetchUser();
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLangChange = (lang) => {
    setSelectedLang(lang);
    i18n.changeLanguage(lang);
  };

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const tabs = [
    { id: 'profile', label: t('settings.tabs.profile', 'Profile'), icon: <User size={18} /> },
    { id: 'appearance', label: t('settings.tabs.appearance', 'Appearance'), icon: <Moon size={18} /> },
    { id: 'notifications', label: t('settings.tabs.notifications', 'Notifications'), icon: <Bell size={18} /> },
    { id: 'privacy', label: t('settings.tabs.privacy', 'Privacy & Security'), icon: <Shield size={18} /> },
  ];

  const languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা' },
    { code: 'mr', name: 'Marathi', native: 'मराठी' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  ];

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-neutral-900 dark:text-white">{t('settings.title', 'Settings')}</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{t('settings.subtitle', 'Manage your account preferences and application settings.')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Tabs */}
        <div className="lg:w-56 shrink-0">
          <nav className="dashboard-card p-2 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-slate-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Content */}
        <div className="flex-1 space-y-6">

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <>
              {/* Avatar Section */}
              <div className="dashboard-card p-6">
                <h2 className="text-base font-bold text-neutral-900 dark:text-white mb-6">{t('settings.profile.avatar_title', 'Profile Photo')}</h2>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-2xl font-black border-2 border-emerald-200 dark:border-emerald-800">
                      {fullName?.charAt(0)?.toUpperCase() || 'F'}
                    </div>
                    <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-700 transition-colors">
                      <Camera size={14} />
                    </button>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{fullName || 'Farmer'}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{t('settings.profile.avatar_hint', 'JPG, PNG or GIF. Max 2MB.')}</p>
                  </div>
                </div>
              </div>

              {/* Personal Info */}
              <div className="dashboard-card p-6">
                <h2 className="text-base font-bold text-neutral-900 dark:text-white mb-6">{t('settings.profile.info_title', 'Personal Information')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">{t('settings.profile.full_name', 'Full Name')}</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                      <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl text-sm text-neutral-800 dark:text-neutral-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">{t('settings.profile.email', 'Email Address')}</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl text-sm text-neutral-800 dark:text-neutral-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">{t('settings.profile.phone', 'Phone Number')}</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 bg-neutral-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl text-sm text-neutral-800 dark:text-neutral-200 font-medium placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">{t('settings.profile.region', 'Farm Region')}</label>
                    <select className="w-full px-4 py-3 bg-neutral-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl text-sm text-neutral-800 dark:text-neutral-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all">
                      <option>West Bengal</option>
                      <option>Punjab</option>
                      <option>Haryana</option>
                      <option>Maharashtra</option>
                      <option>Tamil Nadu</option>
                      <option>Kerala</option>
                      <option>Uttar Pradesh</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <button onClick={handleSave} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2">
                    {saved ? <><Check size={16} /> {t('settings.saved', 'Saved!')}</> : <><Save size={16} /> {t('settings.save', 'Save Changes')}</>}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <>
              {/* Theme */}
              <div className="dashboard-card p-6">
                <h2 className="text-base font-bold text-neutral-900 dark:text-white mb-2">{t('settings.appearance.theme_title', 'Theme')}</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">{t('settings.appearance.theme_desc', 'Choose how Krishi looks to you.')}</p>
                <div className="grid grid-cols-2 gap-4 max-w-md">
                  <button
                    onClick={() => { if (isDark) toggleTheme(); }}
                    className={`p-5 rounded-2xl border-2 transition-all text-left ${
                      !isDark
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-neutral-200 dark:border-slate-700 hover:border-neutral-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <Sun size={24} className={!isDark ? 'text-emerald-600' : 'text-neutral-400 dark:text-neutral-500'} />
                    <p className={`text-sm font-bold mt-3 ${!isDark ? 'text-emerald-700' : 'text-neutral-600 dark:text-neutral-400'}`}>{t('settings.appearance.light', 'Light')}</p>
                  </button>
                  <button
                    onClick={() => { if (!isDark) toggleTheme(); }}
                    className={`p-5 rounded-2xl border-2 transition-all text-left ${
                      isDark
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-neutral-200 dark:border-slate-700 hover:border-neutral-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <Moon size={24} className={isDark ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400 dark:text-neutral-500'} />
                    <p className={`text-sm font-bold mt-3 ${isDark ? 'text-emerald-700 dark:text-emerald-400' : 'text-neutral-600 dark:text-neutral-400'}`}>{t('settings.appearance.dark', 'Dark')}</p>
                  </button>
                </div>
              </div>

              {/* Language */}
              <div className="dashboard-card p-6">
                <h2 className="text-base font-bold text-neutral-900 dark:text-white mb-2">{t('settings.appearance.lang_title', 'Language')}</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">{t('settings.appearance.lang_desc', 'Select your preferred language for the interface.')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => handleLangChange(lang.code)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                        selectedLang === lang.code
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-neutral-200 dark:border-slate-700 hover:border-neutral-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <Globe size={18} className={selectedLang === lang.code ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400'} />
                      <div>
                        <p className={`text-sm font-bold ${selectedLang === lang.code ? 'text-emerald-700 dark:text-emerald-400' : 'text-neutral-700 dark:text-neutral-300'}`}>{lang.native}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-500">{lang.name}</p>
                      </div>
                      {selectedLang === lang.code && <Check size={16} className="text-emerald-600 dark:text-emerald-400 ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="dashboard-card p-6">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white mb-2">{t('settings.notifications.title', 'Notification Preferences')}</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">{t('settings.notifications.desc', 'Choose what updates you want to receive.')}</p>
              <div className="space-y-4">
                {[
                  { key: 'weather', label: t('settings.notifications.weather', 'Weather Alerts'), desc: t('settings.notifications.weather_desc', 'Get notified about severe weather, rain forecasts, and temperature changes.'), icon: '🌦️' },
                  { key: 'crop', label: t('settings.notifications.crop', 'Crop Recommendations'), desc: t('settings.notifications.crop_desc', 'Receive sowing, irrigation, and fertilizer reminders based on AI analysis.'), icon: '🌾' },
                  { key: 'market', label: t('settings.notifications.market', 'Market Prices'), desc: t('settings.notifications.market_desc', 'Daily updates on mandi prices for your crops.'), icon: '📈' },
                  { key: 'newsletter', label: t('settings.notifications.newsletter', 'Newsletter'), desc: t('settings.notifications.newsletter_desc', 'Weekly farming tips and government scheme updates.'), icon: '📬' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{item.label}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                      className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                        notifications[item.key] ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-slate-600'
                      }`}
                    >
                      <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                        notifications[item.key] ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <button onClick={handleSave} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2">
                  {saved ? <><Check size={16} /> {t('settings.saved', 'Saved!')}</> : <><Save size={16} /> {t('settings.save', 'Save Changes')}</>}
                </button>
              </div>
            </div>
          )}

          {/* PRIVACY TAB */}
          {activeTab === 'privacy' && (
            <>
              <div className="dashboard-card p-6">
                <h2 className="text-base font-bold text-neutral-900 dark:text-white mb-2">{t('settings.privacy.password_title', 'Change Password')}</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">{t('settings.privacy.password_desc', 'Update your password to keep your account secure.')}</p>
                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">{t('settings.privacy.current_password', 'Current Password')}</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-12 py-3 bg-neutral-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl text-sm text-neutral-800 dark:text-neutral-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      />
                      <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">{t('settings.privacy.new_password', 'New Password')}</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                      <input type="password" placeholder="••••••••" className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl text-sm text-neutral-800 dark:text-neutral-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
                    </div>
                  </div>
                  <button onClick={handleSave} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2">
                    {saved ? <><Check size={16} /> {t('settings.saved', 'Updated!')}</> : <><Lock size={16} /> {t('settings.privacy.update_password', 'Update Password')}</>}
                  </button>
                </div>
              </div>

              <div className="dashboard-card p-6 border-red-200 dark:border-red-900/50">
                <h2 className="text-base font-bold text-red-700 dark:text-red-400 mb-2">{t('settings.privacy.danger_title', 'Danger Zone')}</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">{t('settings.privacy.danger_desc', 'Once you delete your account, there is no going back. Please be certain.')}</p>
                <button className="px-5 py-2.5 border-2 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2">
                  <Trash2 size={16} />
                  {t('settings.privacy.delete_account', 'Delete Account')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
