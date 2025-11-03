import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { CalendarClock } from 'lucide-react';

const WeeklyReviewTrigger: React.FC = () => {
  const { startWeeklyReview, lastWeekPlan } = useAppStore();

  if (!lastWeekPlan || lastWeekPlan.goals.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg border-2 border-calm-blue-500 animate-pulse">
        <button
          onClick={startWeeklyReview}
          className="w-full flex items-center justify-center gap-2 bg-calm-blue-500 hover:bg-calm-blue-600 text-white font-bold py-3 px-4 rounded-lg transition"
          aria-label="Start Weekly Review"
        >
          <CalendarClock size={20} />
          Start Weekly Review
        </button>
    </div>
  );
};

export default WeeklyReviewTrigger;
