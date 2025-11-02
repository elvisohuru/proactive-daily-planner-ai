import React from 'react';
import { Sun, Moon, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabaseClient';

const Header: React.FC = () => {
  const { theme, toggleTheme, clearUserState, session } = useAppStore(state => ({
    theme: state.theme,
    toggleTheme: state.toggleTheme,
    clearUserState: state.clearUserState,
    session: state.session
  }));

  const greeting = "Today's Plan";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    clearUserState(); // Clear local state after signing out
  };

  return (
    <header className="flex items-center justify-between p-4 md:p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
      <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-200 tracking-tight">
        {greeting}
      </h1>
      <div className="flex items-center gap-2">
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
        {session && (
          <button
            onClick={handleSignOut}
            className="w-10 h-10 flex items-center justify-center rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Sign Out"
          >
            <LogOut size={22} />
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;