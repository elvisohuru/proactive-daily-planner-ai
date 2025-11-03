import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { MoreVertical, GripVertical, Move } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardCardProps {
  children: React.ReactNode;
  title: string;
  componentId: string;
}

// Components without a configurable header
const plainComponents = ['ProductivityScore', 'ProductivityStreak', 'StartDay', 'ReflectionTrigger'];

const DashboardCard: React.FC<DashboardCardProps> = ({ children, title, componentId }) => {
  const { isDashboardInReorderMode, setDashboardReorderMode } = useAppStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (plainComponents.includes(componentId)) {
    return (
      <div className={`relative ${isDashboardInReorderMode ? 'border-2 border-dashed border-calm-blue-400 rounded-2xl' : ''}`}>
        {isDashboardInReorderMode && (
          <div className="absolute top-2 right-2 p-2 text-slate-400 dark:text-slate-500 z-10 pointer-events-none">
            <GripVertical size={24} />
          </div>
        )}
        {children}
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-lg ${isDashboardInReorderMode ? 'border-2 border-dashed border-calm-blue-400' : ''}`}>
      <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{title}</h2>
        <div className="flex items-center gap-2">
          {isDashboardInReorderMode ? (
            <div className="p-2 text-slate-400 dark:text-slate-500 pointer-events-none">
              <GripVertical size={24} />
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                aria-label="Component options"
              >
                <MoreVertical size={20} />
              </button>
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10 p-1"
                  >
                    <button
                      onClick={() => {
                        setDashboardReorderMode(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                    >
                      <Move size={16} /> Reorder Dashboard
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </header>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default DashboardCard;