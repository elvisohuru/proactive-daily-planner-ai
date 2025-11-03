import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { X, ArrowRight, Check, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTodayDateString } from '../utils/dateUtils';

const ShutdownRoutine: React.FC = () => {
  const { 
    shutdownState, 
    closeShutdownRoutine, 
    processUnfinishedTasks, 
    addReflection, 
    setShutdownStep,
    tomorrowsPlan,
    addTomorrowsTask,
    deleteTomorrowsTask,
  } = useAppStore();
  const [well, setWell] = useState('');
  const [improve, setImprove] = useState('');
  const [tomorrowsTaskText, setTomorrowsTaskText] = useState('');
  
  const today = getTodayDateString();
  const hasReflectedToday = useAppStore(state => state.reflections.some(r => r.date === today));
  
  useEffect(() => {
    if (shutdownState.isOpen) {
        if (shutdownState.step === 'reflect' && hasReflectedToday) {
          // If trying to reflect but already did, skip to planning
          setShutdownStep('plan_next');
        }
    } else {
        // Reset local state when modal closes
        setWell('');
        setImprove('');
        setTomorrowsTaskText('');
    }
  }, [shutdownState.isOpen, shutdownState.step, hasReflectedToday, setShutdownStep]);

  const handleReflectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (well.trim() && improve.trim()) {
      addReflection(well, improve);
      // The store action will transition to 'plan_next'
    }
  };

  const handleAddTomorrowsTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (tomorrowsTaskText.trim()) {
      addTomorrowsTask(tomorrowsTaskText.trim());
      setTomorrowsTaskText('');
    }
  };

  const renderContent = () => {
    switch (shutdownState.step) {
      case 'review':
        return (
          <>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Wrap Up Day</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">You have {shutdownState.unfinishedTasks.length} unfinished task(s).</p>
            <ul className="space-y-2 max-h-40 overflow-y-auto bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg mb-6">
              {shutdownState.unfinishedTasks.map(task => (
                <li key={task.id} className="text-sm text-slate-700 dark:text-slate-300">{task.text}</li>
              ))}
            </ul>
            <div className="flex flex-col gap-3">
              <button
                onClick={processUnfinishedTasks}
                className="w-full flex items-center justify-center gap-2 bg-calm-blue-500 hover:bg-calm-blue-600 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                Move to Unplanned & Continue <ArrowRight size={18} />
              </button>
              <button
                onClick={() => setShutdownStep('reflect')}
                className="w-full text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Keep for today & Continue
              </button>
            </div>
          </>
        );
      case 'reflect':
        return (
           <form onSubmit={handleReflectionSubmit}>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Daily Reflection</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Take a moment to reflect on your day.</p>
             <div className="space-y-4">
               <div>
                 <label htmlFor="well" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                   What went well today?
                 </label>
                 <textarea id="well" value={well} onChange={(e) => setWell(e.target.value)} rows={3} className="w-full bg-slate-100 dark:bg-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-calm-blue-500" />
               </div>
               <div>
                 <label htmlFor="improve" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                   What could be improved tomorrow?
                 </label>
                 <textarea id="improve" value={improve} onChange={(e) => setImprove(e.target.value)} rows={3} className="w-full bg-slate-100 dark:bg-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-calm-blue-500" />
               </div>
             </div>
             <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShutdownStep('plan_next')} className="w-full bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 font-bold py-2 px-4 rounded-lg transition">
                    Skip
                </button>
                <button type="submit" className="w-full flex items-center justify-center gap-2 bg-calm-green-500 hover:bg-calm-green-600 text-white font-bold py-2 px-4 rounded-lg transition">
                    <Check size={20} /> Save & Continue
                </button>
             </div>
           </form>
        );
      case 'plan_next':
        return (
          <>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Plan for Tomorrow</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Get a head start. These tasks will be in your plan when you start your next day.</p>
            <form onSubmit={handleAddTomorrowsTask} className="flex gap-2 mb-4">
              <input
                type="text"
                value={tomorrowsTaskText}
                onChange={(e) => setTomorrowsTaskText(e.target.value)}
                placeholder="Add a task for tomorrow..."
                className="flex-grow bg-slate-100 dark:bg-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-calm-blue-500"
                autoFocus
              />
              <button type="submit" className="bg-calm-blue-500 hover:bg-calm-blue-600 text-white font-semibold p-2 rounded-lg flex items-center justify-center aspect-square transition">
                <Plus size={20} />
              </button>
            </form>
            <ul className="space-y-2 max-h-40 overflow-y-auto bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg mb-6">
              <AnimatePresence>
                {tomorrowsPlan.map(task => (
                  <motion.li
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                  >
                    <span className="flex-grow">{task.text}</span>
                    <button onClick={() => deleteTomorrowsTask(task.id)} className="text-slate-400 hover:text-red-500 p-1">
                      <Trash2 size={16} />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
              {tomorrowsPlan.length === 0 && <p className="text-xs text-center text-slate-500">No tasks planned yet.</p>}
            </ul>
            <button
              onClick={closeShutdownRoutine}
              className="w-full flex items-center justify-center gap-2 bg-calm-green-500 hover:bg-calm-green-600 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              Finish Planning <Check size={20} />
            </button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {shutdownState.isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeShutdownRoutine}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md relative flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeShutdownRoutine}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition z-10"
            >
              <X size={24} />
            </button>
            <div className="p-6 overflow-y-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={shutdownState.step}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShutdownRoutine;