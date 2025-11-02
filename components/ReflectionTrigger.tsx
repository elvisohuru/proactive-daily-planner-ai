import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { BookText } from 'lucide-react';
import { getTodayDateString } from '../utils/dateUtils';

const ReflectionTrigger: React.FC = () => {
  const { setReflectionModalOpen, reflections } = useAppStore();
  const today = getTodayDateString();
  const hasReflectedToday = reflections.some(r => r.date === today);

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg">
        <button
          onClick={() => setReflectionModalOpen(true)}
          disabled={hasReflectedToday}
          className="w-full flex items-center justify-center gap-2 bg-calm-blue-500 hover:bg-calm-blue-600 text-white font-bold py-3 px-4 rounded-lg transition disabled:bg-slate-400 disabled:dark:bg-slate-600 disabled:cursor-not-allowed"
          aria-label={hasReflectedToday ? "Daily reflection already saved" : "Open daily reflection"}
        >
          <BookText size={20} />
          {hasReflectedToday ? "Reflection Saved" : "Reflect on Today"}
        </button>
    </div>
  );
};

export default ReflectionTrigger;
