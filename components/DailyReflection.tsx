
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DailyReflection: React.FC = () => {
  const { isReflectionModalOpen, setReflectionModalOpen, addReflection, reflections } = useAppStore();
  const today = new Date().toISOString().split('T')[0];
  const hasReflectedToday = reflections.some(r => r.date === today);

  const [well, setWell] = useState('');
  const [improve, setImprove] = useState('');
  
  useEffect(() => {
    if (hasReflectedToday) {
        setReflectionModalOpen(false);
    }
  }, [hasReflectedToday, setReflectionModalOpen]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (well.trim() && improve.trim()) {
      addReflection(well, improve);
      setWell('');
      setImprove('');
    }
  };

  if (!isReflectionModalOpen || hasReflectedToday) {
    return null;
  }

  return (
    <AnimatePresence>
      {isReflectionModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-md relative"
          >
            <button
              onClick={() => setReflectionModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Daily Reflection</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Great job completing your tasks! Take a moment to reflect.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="well" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  What went well today?
                </label>
                <textarea
                  id="well"
                  value={well}
                  onChange={(e) => setWell(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-100 dark:bg-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-calm-blue-500"
                />
              </div>
              <div>
                <label htmlFor="improve" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  What could be improved tomorrow?
                </label>
                <textarea
                  id="improve"
                  value={improve}
                  onChange={(e) => setImprove(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-100 dark:bg-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-calm-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-calm-blue-500 hover:bg-calm-blue-600 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                Save Reflection
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DailyReflection;
