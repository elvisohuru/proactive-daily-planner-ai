import React, { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatTime } from '../utils/dateUtils';

const TimeAllocationByTag: React.FC = () => {
  const { logs, plan } = useAppStore();

  const tagData = useMemo(() => {
    const tagMap = new Map<string, number>();
    const todaysLogs = logs.filter(log => log.dateString === plan.date);

    todaysLogs.forEach(log => {
      const task = plan.tasks.find(t => t.text === log.task);
      if (task && task.tags && task.tags.length > 0) {
        task.tags.forEach(tag => {
          const currentDuration = tagMap.get(tag) || 0;
          tagMap.set(tag, currentDuration + log.duration);
        });
      }
    });
    
    const totalTaggedTime = Array.from(tagMap.values()).reduce((sum, duration) => sum + duration, 0);

    return Array.from(tagMap.entries())
        .map(([tag, duration]) => ({
            tag,
            duration,
            percentage: totalTaggedTime > 0 ? (duration / totalTaggedTime) * 100 : 0,
        }))
        .sort((a, b) => b.duration - a.duration);
  }, [logs, plan]);

  if (tagData.length === 0) {
    return null; // Don't render the component if there's no tagged time logged today
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
        <Tag size={20} /> Time Allocation by Tag
      </h2>
      <div className="space-y-3">
        {tagData.map((data, index) => (
          <div key={data.tag}>
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize"># {data.tag}</span>
              <span className="text-slate-500 dark:text-slate-400">{formatTime(data.duration)}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
              <motion.div
                className="bg-calm-blue-500 h-2.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${data.percentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.1 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimeAllocationByTag;