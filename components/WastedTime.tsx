import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { formatTime } from '../utils/dateUtils';
import { PieChart } from 'lucide-react';
import { motion } from 'framer-motion';

const WastedTime: React.FC = () => {
  const { idleTimeLogs, isDayStarted } = useAppStore();

  const totalProductiveSeconds = idleTimeLogs
    .filter(log => log.tag === 'Productive')
    .reduce((sum, log) => sum + log.duration, 0);

  const totalUnproductiveSeconds = idleTimeLogs
    .filter(log => log.tag === 'Unproductive')
    .reduce((sum, log) => sum + log.duration, 0);

  const totalIdleSeconds = totalProductiveSeconds + totalUnproductiveSeconds;

  const productiveIdlePercentage = totalIdleSeconds > 0 
    ? Math.round((totalProductiveSeconds / totalIdleSeconds) * 100) 
    : 0;
  
  if (!isDayStarted || idleTimeLogs.length === 0) {
      return null;
  }
  
  const getMotivationalMessage = () => {
    if (productiveIdlePercentage >= 75) return "Great job using your idle time effectively!";
    if (productiveIdlePercentage >= 50) return "A good balance of productive and restful breaks.";
    if (productiveIdlePercentage > 0) return "A little mindfulness goes a long way.";
    return "Log your idle time to see your patterns.";
  }

  return (
    <motion.div 
        className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
    >
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
        <PieChart size={20} className="text-calm-blue-500" /> Idle Time Report
      </h2>
      
      <div className="text-center mb-4">
        <p className="text-5xl font-bold text-slate-800 dark:text-slate-100">
          {productiveIdlePercentage}<span className="text-3xl text-slate-500">%</span>
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {getMotivationalMessage()}
        </p>
      </div>
      
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 flex overflow-hidden my-4">
        <motion.div 
          title={`Productive: ${formatTime(totalProductiveSeconds)}`}
          className="bg-calm-green-500 h-full"
          initial={{ width: '0%' }}
          animate={{ width: `${productiveIdlePercentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        <motion.div 
          title={`Unproductive: ${formatTime(totalUnproductiveSeconds)}`}
          className="bg-yellow-500 h-full"
          initial={{ width: '0%' }}
          animate={{ width: `${100 - productiveIdlePercentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <div className="flex justify-between mt-4 text-sm">
        <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-calm-green-500 flex-shrink-0"></span>
            <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">Productive</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{formatTime(totalProductiveSeconds)}</p>
            </div>
        </div>
        <div className="flex items-center gap-2 text-right">
             <div className="flex flex-col items-end">
                <p className="font-semibold text-slate-700 dark:text-slate-300">Unproductive</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{formatTime(totalUnproductiveSeconds)}</p>
            </div>
            <span className="w-3 h-3 rounded-full bg-yellow-500 flex-shrink-0"></span>
        </div>
      </div>

    </motion.div>
  );
};

export default WastedTime;
