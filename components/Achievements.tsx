import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { achievementsList } from '../utils/achievements';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const Achievements: React.FC = () => {
  const unlockedAchievements = useAppStore((state) => state.unlockedAchievements);

  const allAchievements = achievementsList.map(ach => ({
    ...ach,
    unlocked: unlockedAchievements.includes(ach.id),
  }));

  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Your Awards</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {allAchievements.map((ach, index) => (
          <motion.div
            key={ach.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`flex flex-col items-center justify-center text-center p-4 rounded-lg border-2 ${
              ach.unlocked 
                ? 'border-calm-green-500/50 bg-calm-green-50 dark:bg-calm-green-900/20' 
                : 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/20'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                ach.unlocked
                ? 'bg-calm-green-100 dark:bg-calm-green-900'
                : 'bg-slate-200 dark:bg-slate-700'
            }`}>
              {ach.unlocked ? ach.icon : <Lock className="text-slate-400" size={24} />}
            </div>
            <p className={`font-semibold text-sm ${ach.unlocked ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>{ach.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{ach.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Achievements;
