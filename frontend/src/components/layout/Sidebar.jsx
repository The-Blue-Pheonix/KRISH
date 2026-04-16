import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map, 
  Sprout, 
  DollarSign, 
  BookOpen, 
  Settings, 
  HelpCircle,
  LogOut,
  X,
  Bot
} from 'lucide-react';

export default function Sidebar({ isOpen, closeSidebar, onLogout }) {
  const links = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { name: 'Krishi AI', icon: <Bot size={20} />, path: '/dashboard/ai' },
    { name: 'Your Farm', icon: <Map size={20} />, path: '/dashboard/farm' },
    { name: 'Crop Insights', icon: <Sprout size={20} />, path: '/dashboard/crops' },
    { name: 'Profit Estimator', icon: <DollarSign size={20} />, path: '/dashboard/profit' },
    { name: 'Farming Guide', icon: <BookOpen size={20} />, path: '/dashboard/guide' },
  ];

  return (
    <aside className={`fixed left-0 top-0 h-screen w-64 bg-white dark:bg-slate-800 border-r border-neutral-200 dark:border-slate-700 flex flex-col z-50 transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      
      {/* Mobile Close Button & Logo */}
      <div className="p-6 pb-2 flex items-center justify-between">
        <h1 className="text-2xl font-black text-emerald-700 dark:text-emerald-500 flex items-center gap-2">
          <Sprout className="text-emerald-600 dark:text-emerald-500" size={28} />
          Krishi
        </h1>
        <button className="md:hidden text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200" onClick={closeSidebar}>
           <X size={24} />
        </button>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 mt-6 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            end={link.path === '/dashboard'}
            onClick={closeSidebar}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                isActive 
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-l-4 border-emerald-600 dark:border-emerald-500' 
                  : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-slate-700 hover:text-neutral-900 dark:hover:text-neutral-100 border-l-4 border-transparent'
              }`
            }
          >
            {link.icon}
            {link.name}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 space-y-1 mb-4 border-t border-neutral-100 dark:border-slate-700">
        <NavLink 
           to="/dashboard/settings" 
           onClick={closeSidebar}
           className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive ? 'bg-emerald-50 dark:bg-slate-700 text-emerald-700 dark:text-emerald-400' : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-slate-700 hover:text-neutral-900 dark:hover:text-neutral-100'}`}
        >
          <Settings size={20} />
          Settings
        </NavLink>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-slate-700 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
          <HelpCircle size={20} />
          Help & Support
        </button>
        <button 
          onClick={() => { onLogout(); closeSidebar(); }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mt-2"
        >
          <LogOut size={20} />
          Log Out
        </button>
      </div>
    </aside>
  );
}
