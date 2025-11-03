import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { PlayCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const StartDay: React.FC = () => {
  const { isDayStarted, startDay, plan, routine } = useAppStore();
  
  const todayIndex = new Date().getDay();
  const todaysScheduledRoutine = routine.filter(r => r.recurringDays.length === 0 || r.recurringDays.includes(todayIndex));
  const hasTasks = plan.tasks.length > 0 || todaysScheduledRoutine.length > 0;

  if (!hasTasks && !isDayStarted) {
    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg flex items-center justify-center gap-3 text-slate-500">
            <p className="font-semibold text-md">Plan your day to get started.</p>
        </div>
    );
  }

  if (isDayStarted) {
    return (
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg flex items-center justify-center gap-3 text-calm-green-500">
        <CheckCircle size={24} />
        <p className="font-semibold text-lg">Day has started. Good luck!</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg">
      <motion.button
        onClick={startDay}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-center gap-3 bg-calm-green-500 hover:bg-calm-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
      >
        <PlayCircle size={22} />
        Start Day & Lock Plan
      </motion.button>
    </div>
  );
};

export default StartDay;
