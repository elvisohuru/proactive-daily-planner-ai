import React from 'react';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

const Header: React.FC = () => {
  const { theme, toggleTheme, toggleSidebar, isSidebarCollapsed } = useAppStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };
  
  return (
    <header className="flex items-center justify-between px-4 py-3 sm:px-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          aria-label="Toggle sidebar"
        >
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={isSidebarCollapsed ? 'menu' : 'x'}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {isSidebarCollapsed ? <Menu size={22} /> : <X size={22} />}
            </motion.div>
          </AnimatePresence>
        </button>
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-200 tracking-tight">
          {getGreeting()}
        </h1>
      </div>
      <button
        onClick={toggleTheme}
        className="relative w-10 h-10 flex items-center justify-center rounded-full text-slate-600 dark:text-yellow-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        aria-label="Toggle theme"
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={theme}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {theme === 'light' ? <Moon size={22} /> : <Sun size={24} />}
          </motion.div>
        </AnimatePresence>
      </button>
    </header>
  );
};

export default Header;