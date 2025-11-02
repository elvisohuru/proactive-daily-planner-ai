import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Flame, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const ProductivityStreak: React.FC = () => {
  const streak = useAppStore((state) => state.streak);

  return (
    <motion.div
      className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg flex flex-col justify-center"
    >
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
        <Flame size={20} className="text-orange-500" /> Productivity Streak
      </h2>
      <div className="flex items-center justify-around gap-4 text-slate-600 dark:text-slate-400">
        <div className="text-center">
            <p className="text-sm">Current</p>
            <div className="flex items-center gap-1.5 mt-1" title="Current Streak">
                <Flame className={`w-6 h-6 ${streak.current > 0 ? 'text-orange-500' : 'text-slate-400'}`} />
                <span className="font-bold text-3xl text-slate-800 dark:text-slate-100">{streak.current}</span>
            </div>
             <p className="text-sm">Day{streak.current !== 1 && 's'}</p>
        </div>
        
        <div className="h-16 w-px bg-slate-200 dark:bg-slate-700"></div>

        <div className="text-center">
            <p className="text-sm">Longest</p>
             <div className="flex items-center gap-1.5 mt-1" title="Longest Streak">
                 <Star className={`w-6 h-6 ${streak.longest > 0 ? 'text-yellow-400' : 'text-slate-400'}`} />
                 <span className="font-bold text-3xl text-slate-800 dark:text-slate-100">{streak.longest}</span>
            </div>
            <p className="text-sm">Day{streak.longest !== 1 && 's'}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductivityStreak;
