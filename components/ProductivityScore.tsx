import React, { useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { playCelebrationPopSound, playSparkleSound } from '../utils/sound';
import { Check, Target, Flame, Star } from 'lucide-react';

const usePrevious = <T,>(value: T): T | undefined => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

const iconComponents = [
  (props: any) => <Check {...props} color="#22c55e" />,
  (props: any) => <Target {...props} color="#38bdf8" />,
  (props: any) => <Flame {...props} color="#f97316" />,
  (props: any) => <Star {...props} color="#facc15" />,
];

const FloatingIcon: React.FC<{ piece: any }> = ({ piece }) => {
  const Icon = piece.icon;
  return (
    <motion.div
      style={{
        position: 'absolute',
        bottom: -50,
        left: piece.left,
        x: '-50%',
      }}
      animate={{
        y: -450,
        opacity: [0, 0.8, 0.8, 0],
        scale: [0.5, 1.2, 1, 0.5],
        rotate: piece.rotate,
      }}
      transition={{
        duration: piece.duration,
        delay: piece.delay,
        repeat: Infinity,
        repeatType: 'loop',
        ease: 'linear',
      }}
    >
      <Icon size={piece.size} />
    </motion.div>
  );
};

const ContinuousCelebration = React.memo(() => {
  const pieces = useMemo(() => {
    return Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      icon: iconComponents[i % iconComponents.length],
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 12,
      duration: 6 + Math.random() * 6,
      size: 14 + Math.random() * 12,
      rotate: (Math.random() - 0.5) * 360,
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      {pieces.map(p => <FloatingIcon key={p.id} piece={p} />)}
    </div>
  );
});


const ProductivityScore: React.FC = () => {
  const { plan, routine } = useAppStore();

  const todayIndex = new Date().getDay();
  const todaysScheduledRoutine = routine.filter(r => r.recurringDays.length === 0 || r.recurringDays.includes(todayIndex));

  const basePlannedTasks = plan.tasks.filter(task => !task.isBonus);
  const totalPlannedForScore = basePlannedTasks.length;

  const completedPlanned = plan.tasks.filter((task) => task.completed).length;

  const totalRoutine = todaysScheduledRoutine.length;
  const completedRoutine = todaysScheduledRoutine.filter((task) => task.completed).length;

  const totalTasksForScore = totalPlannedForScore + totalRoutine;
  const completedTasks = completedPlanned + completedRoutine;

  const score = totalTasksForScore > 0 ? Math.round((completedTasks / totalTasksForScore) * 100) : 0;
  
  const isComplete = score >= 100 && totalTasksForScore > 0;
  const prevIsComplete = usePrevious(isComplete);

  useEffect(() => {
    if (isComplete && !prevIsComplete) {
      playCelebrationPopSound();
      // Play the sparkle sound once as part of the initial celebration
      const sparkleTimeout = setTimeout(() => {
        playSparkleSound();
      }, 200);

      return () => {
        clearTimeout(sparkleTimeout);
      };
    }
  }, [isComplete, prevIsComplete]);
  
  const circumference = 2 * Math.PI * 54; // 2 * pi * radius
  const scoreRatio = totalTasksForScore > 0 ? completedTasks / totalTasksForScore : 0;
  const strokeDashoffset = circumference - Math.min(scoreRatio, 1) * circumference;

  const totalTasks = plan.tasks.length + totalRoutine;

  const getMotivationalMessage = () => {
    if (totalTasksForScore === 0) return "Let's plan the day!";
    if (score >= 110) return `WOW! ${score}%! You are unstoppable!`;
    if (score > 100) return `Bonus points! You're at ${score}%!`;
    if (score === 100) return `Amazing! You crushed all ${totalTasksForScore} planned tasks!`;
    if (score >= 80) return "Incredible focus, almost there!";
    if (score >= 50) return "You're making great progress!";
    if (score > 0) return "Keep up the momentum!";
    return "Ready to start your day?";
  }

  return (
    <div
      className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg flex flex-col items-center gap-4 relative overflow-hidden"
    >
      <AnimatePresence>
          {isComplete && <ContinuousCelebration />}
      </AnimatePresence>
      <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 z-10">
        <svg className="w-full h-full" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" strokeWidth="12" className="text-slate-200 dark:text-slate-700" />
          <motion.circle
            cx="60" cy="60" r="54" fill="none" strokeWidth="12"
            className={`stroke-current ${isComplete ? 'text-calm-green-500' : 'text-calm-blue-500'}`}
            strokeLinecap="round" transform="rotate(-90 60 60)"
            style={{ strokeDasharray: circumference }}
            animate={{ 
              strokeDashoffset, 
              filter: isComplete 
                ? ['drop-shadow(0 0 4px #22c55e)', 'drop-shadow(0 0 20px #22c55e)', 'drop-shadow(0 0 4px #22c55e)'] 
                : 'none' 
            }}
            transition={{ 
              strokeDashoffset: { duration: 0.8, ease: 'easeInOut' }, 
              filter: isComplete ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror' } : { duration: 0.5 } 
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100">{score}<span className="text-xl sm:text-2xl text-slate-500">%</span></span>
        </div>
      </div>
      <div className="text-center z-10">
        <p className="text-base sm:text-lg font-semibold text-slate-700 dark:text-slate-300">
          {getMotivationalMessage()}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {completedTasks} of {totalTasks} tasks completed
        </p>
      </div>
    </div>
  );
};

export default ProductivityScore;