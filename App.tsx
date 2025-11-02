import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import Header from './components/Header';
import ProductivityScore from './components/ProductivityScore';
import TodaysPlan from './components/TodaysPlan';
import TaskTimer from './components/TaskTimer';
import TimeLog from './components/TimeLog';
import MyGoals from './components/MyGoals';
import DailyReflection from './components/DailyReflection';
import DailyRoutine from './components/DailyRoutine';
import ReflectionTrigger from './components/ReflectionTrigger';
import PerformanceHistory from './components/PerformanceHistory';

function App() {
  const { theme, initialize } = useAppStore();

  useEffect(() => {
    initialize();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300">
      <Header />
      <main className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ProductivityScore />
            <DailyRoutine />
            <TodaysPlan />
          </div>
          <div className="space-y-6">
            <TimeLog />
            <MyGoals />
            <ReflectionTrigger />
            <PerformanceHistory />
          </div>
        </div>
      </main>
      <TaskTimer />
      <DailyReflection />
    </div>
  );
}

export default App;