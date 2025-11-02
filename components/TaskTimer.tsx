import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { formatTime } from '../utils/dateUtils';
import { Play, Pause, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TaskTimer: React.FC = () => {
  const { activeTask, updateTimer, finishTimer, completeActiveTask } = useAppStore();
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (activeTask && !activeTask.isPaused) {
      intervalRef.current = window.setInterval(() => {
        // Safe to access activeTask here because this effect re-runs when it changes.
        updateTimer({ remainingSeconds: activeTask.remainingSeconds - 1 });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    if (activeTask && activeTask.remainingSeconds <= 0) {
      finishTimer();
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeTask, updateTimer, finishTimer]);
  
  const handlePauseResume = () => {
    if (activeTask) {
      updateTimer({ isPaused: !activeTask.isPaused });
    }
  };

  const handleCompleteAndLog = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    completeActiveTask();
  };

  const progress = activeTask ? (1 - activeTask.remainingSeconds / activeTask.totalDuration) * 100 : 0;

  return (
    <AnimatePresence>
      {activeTask && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg"
        >
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Active Task</h2>
          <p className="text-slate-600 dark:text-slate-400 truncate mb-4">{activeTask.task}</p>
          <div className="text-center my-4">
            <span className="text-5xl font-mono font-bold text-calm-blue-500 dark:text-calm-blue-400 tracking-wider">
              {formatTime(activeTask.remainingSeconds)}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-6">
            <motion.div
              className="bg-calm-blue-500 h-2.5 rounded-full"
              initial={{ width: `${progress}%` }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'linear' }}
            ></motion.div>
          </div>
          <div className="flex justify-center gap-4">
            <button
              onClick={handlePauseResume}
              className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold p-3 rounded-full flex items-center justify-center transition"
              aria-label={activeTask.isPaused ? 'Resume Timer' : 'Pause Timer'}
            >
              {activeTask.isPaused ? <Play size={20} /> : <Pause size={20} />}
            </button>
            <button
              onClick={handleCompleteAndLog}
              className="bg-calm-green-500 hover:bg-calm-green-600 text-white font-semibold p-3 rounded-full flex items-center justify-center transition"
              aria-label="Complete and Log Task"
            >
              <CheckSquare size={20} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TaskTimer;