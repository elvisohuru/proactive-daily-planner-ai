import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProductivityStreak: React.FC = () => {
  const streak = useAppStore((state) => state.streak);

  const getMotivationalMessage = () => {
    if (streak.current === 0) return "Start a new streak today!";
    if (streak.current <= 3) return "Great start, keep it going!";
    if (streak.current <= 7) return "You're building a solid habit!";
    if (streak.current <= 14) return "Incredible consistency!";
    return "You're on fire!";
  };

  const hasStreak = streak.current > 0;

  if (hasStreak) {
    return (
       <div
        className="p-6 rounded-2xl shadow-lg flex flex-col justify-between items-center text-center relative overflow-hidden text-white h-full"
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-red-600"
          style={{ backgroundSize: '200% 200%' }}
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ 
              duration: 8, 
              repeat: Infinity, 
              ease: 'easeInOut' 
          }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center flex-grow">
            <div className="flex items-center justify-center gap-4">
                <motion.div
                animate={{
                    scale: [1, 1.15, 1],
                    filter: [
                        'drop-shadow(0 0 8px #fef08a)', 
                        'drop-shadow(0 0 30px #fb923c)', 
                        'drop-shadow(0 0 8px #fef08a)'
                    ],
                }}
                transition={{ 
                    duration: 1.2, 
                    repeat: Infinity, 
                    ease: 'easeInOut' 
                    }}
                >
                <Flame size={48} className="text-yellow-300" />
                </motion.div>
                
                <AnimatePresence mode="wait">
                    <motion.div
                        key={streak.current}
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}
                        exit={{y: 20, opacity: 0}}
                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                        className="font-bold text-5xl sm:text-6xl md:text-7xl text-white"
                    >
                        {streak.current}
                    </motion.div>
                </AnimatePresence>
            </div>
            <p className="font-semibold text-lg mt-2 text-white/90">
                Current Streak
            </p>
             <p className="text-sm h-5 mt-1 text-white/80">
                {getMotivationalMessage()}
            </p>
        </div>
        <div className="relative z-10 mt-4 pt-4 w-full flex justify-center items-baseline gap-2 border-t border-white/20">
            <span className="font-semibold text-white/90">Longest streak:</span>
            <span className="font-bold text-xl text-white">{streak.longest}</span>
            <span className="text-sm text-white/80">days</span>
        </div>
      </div>
    )
  }

  // Inactive Streak State
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg flex flex-col justify-between h-full">
      <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-xl text-center border border-slate-200 dark:border-slate-700 shadow-inner flex-grow flex flex-col justify-center">
        <div className="flex items-center justify-center gap-4">
          <Flame size={48} className="text-orange-500" />
          <span className="font-bold text-5xl sm:text-6xl md:text-7xl text-slate-800 dark:text-slate-100">
            {streak.current}
          </span>
        </div>
        <p className="font-semibold text-lg mt-2 text-slate-700 dark:text-slate-300">Current Streak</p>
        <p className="text-sm h-5 mt-1 text-slate-500 dark:text-slate-400">{getMotivationalMessage()}</p>
      </div>

      <div className="mt-4 pt-4 w-full flex justify-center items-baseline gap-2 border-t border-slate-200 dark:border-slate-700">
        <span className="font-semibold text-slate-600 dark:text-slate-400">Longest streak:</span>
        <span className="font-bold text-xl text-slate-700 dark:text-slate-200">{streak.longest}</span>
        <span className="text-sm text-slate-500 dark:text-slate-400">days</span>
      </div>
    </div>
  );
};

export default ProductivityStreak;
