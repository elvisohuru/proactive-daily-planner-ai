
import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

const DailyProgress: React.FC = () => {
  const tasks = useAppStore((state) => state.plan.tasks);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const score = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const circumference = 2 * Math.PI * 54; // 2 * pi * radius
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getMotivationalMessage = () => {
    if (totalTasks === 0) return "Let's plan your day!";
    if (score === 100) return "Amazing! You completed your plan!";
    if (score >= 80) return "Nice work, almost there!";
    if (score >= 50) return "You're making great progress!";
    if (score > 0) return "Keep up the momentum!";
    return "Ready to start your day?";
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg flex flex-col items-center gap-4">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            strokeWidth="12"
            className="text-slate-200 dark:text-slate-700"
          />
          <motion.circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            strokeWidth="12"
            className="stroke-current text-calm-blue-500"
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            style={{ strokeDasharray: circumference, strokeDashoffset }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-slate-800 dark:text-slate-100">
            {score}
            <span className="text-2xl text-slate-500">%</span>
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          {getMotivationalMessage()}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {completedTasks} of {totalTasks} tasks completed
        </p>
      </div>
    </div>
  );
};

export default DailyProgress;
