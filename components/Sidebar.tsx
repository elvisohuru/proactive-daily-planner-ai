import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { LayoutDashboard, Target, BarChart3, Lightbulb, Inbox, Calendar } from 'lucide-react';
import { AppView } from '../types';

const navItems: { view: AppView; label: string; icon: React.ReactNode; id?: string; }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={22} /> },
  { view: 'inbox', label: 'Idea Inbox', icon: <Inbox size={22} />, id: 'onboarding-inbox' },
  { view: 'goals', label: 'Goals & Projects', icon: <Target size={22} /> },
  { view: 'calendar', label: 'Calendar', icon: <Calendar size={22} /> },
  { view: 'reports', label: 'Reports', icon: <BarChart3 size={22} /> },
  { view: 'insights', label: 'Insights', icon: <Lightbulb size={22} /> },
];

const Sidebar: React.FC = () => {
  const { activeView, setActiveView, isSidebarCollapsed, toggleSidebar } = useAppStore();

  const handleNavClick = (view: AppView) => {
    setActiveView(view);
    // On mobile, close the sidebar after navigation
    if (window.innerWidth < 1024) {
      toggleSidebar();
    }
  }

  return (
    <aside className={`fixed top-0 left-0 h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col z-20 transition-transform lg:transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-64 -translate-x-full lg:translate-x-0 lg:w-20' : 'w-64 translate-x-0'}`}>
      <div className={`flex items-center border-b border-slate-200 dark:border-slate-700 transition-all duration-300 h-16 shrink-0 ${isSidebarCollapsed ? 'justify-center' : 'px-6 justify-start'}`}>
        {!isSidebarCollapsed && <span className="font-bold text-lg text-slate-800 dark:text-slate-200">Pro Planner</span>}
      </div>
      <nav className="flex-1 px-4 py-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.view}>
              <button
                id={item.id}
                onClick={() => handleNavClick(item.view)}
                title={isSidebarCollapsed ? item.label : ''}
                className={`w-full flex items-center gap-4 p-3 rounded-lg transition-colors text-slate-600 dark:text-slate-300 ${
                  activeView === item.view
                    ? 'bg-calm-blue-100 dark:bg-calm-blue-900/50 text-calm-blue-600 dark:text-calm-blue-300 font-semibold'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              >
                {item.icon}
                {!isSidebarCollapsed && <span>{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;