import React, { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { format, subDays, parseISO } from 'date-fns';
import { motion } from 'framer-motion';

const AdvancedAnalytics: React.FC = () => {
  const { performanceHistory } = useAppStore();
  const hasData = useMemo(() => performanceHistory.length > 0, [performanceHistory]);

  const performanceData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }).map((_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd')).reverse();
    return last30Days.map(date => {
      const record = performanceHistory.find(h => h.date === date);
      return {
        date,
        dayLabel: format(parseISO(date), 'd'),
        score: record ? record.score : 0,
      };
    });
  }, [performanceHistory]);

  if (!hasData) {
    return null; // The parent ReportsView handles the main empty state.
  }

  return (
    <div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Productivity Trends (Last 30 Days)</h3>
        <div className="flex justify-between items-end h-32 gap-1 pt-6 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg">
          {performanceData.map((day, index) => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
              <div 
                className="relative w-full h-full flex items-end justify-center"
                title={`${day.date}: ${day.score}%`}
              >
                <motion.div
                  className="w-full bg-calm-blue-400 dark:bg-calm-blue-600 rounded-t-sm"
                  initial={{ height: '0%' }}
                  animate={{ height: `${day.score}%` }}
                  transition={{ duration: 0.5, delay: index * 0.01, ease: "easeOut" }}
                />
              </div>
              <span className="text-xs text-slate-400">{day.dayLabel}</span>
            </div>
          ))}
        </div>
    </div>
  );
};

export default AdvancedAnalytics;
