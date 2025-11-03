import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import Header from './components/Header';
import ProductivityScore from './components/ProductivityScore';
import TodaysPlan from './components/TodaysPlan';
import TaskTimer from './components/TaskTimer';
import TimeLog from './components/TimeLog';
import MyGoals from './components/MyGoals';
import DailyRoutine from './components/DailyRoutine';
import ReflectionTrigger from './components/ReflectionTrigger';
import PerformanceHistory from './components/PerformanceHistory';
import UnplannedTasks from './components/UnplannedTasks';
import DataAndInsights from './components/DataAndInsights';
import ProductivityStreak from './components/ProductivityStreak';
import CommandPalette from './components/CommandPalette';
import ShutdownRoutine from './components/ShutdownRoutine';
import StartDay from './components/StartDay';
import IdleTimeTracker from './components/IdleTimeTracker';
import IdleCountdown from './components/IdleCountdown';
import IdleReviewModal from './components/IdleReviewModal';
import WastedTime from './components/WastedTime';
import WeeklyGoals from './components/WeeklyGoals';
import Sidebar from './components/Sidebar';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import { motion, AnimatePresence } from 'framer-motion';

const DashboardView = () => (
  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
    <div className="lg:col-span-3 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProductivityScore />
        <ProductivityStreak />
      </div>
      <WeeklyGoals />
      <StartDay />
      <DailyRoutine />
      <TodaysPlan />
    </div>
    <div className="lg:col-span-2 space-y-6">
      <UnplannedTasks />
      <ReflectionTrigger />
    </div>
  </div>
);

const ReportsView = () => (
  <div className="space-y-6">
    <PerformanceHistory />
    <WastedTime />
    <TimeLog />
    <AdvancedAnalytics />
  </div>
);

const InsightsView = () => (
  <div className="space-y-6">
    <DataAndInsights />
  </div>
)

function App() {
  const { theme, initialize, setCommandPaletteOpen, activeView, isSidebarCollapsed, toggleSidebar } = useAppStore();

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
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setCommandPaletteOpen]);

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'goals':
        return <MyGoals />;
      case 'reports':
        return <ReportsView />;
      case 'insights':
        return <InsightsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className={`bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300 flex`}>
      <Sidebar />
      <div className={`flex flex-col flex-1 transition-all duration-300 ease-in-out lg:ml-20 ${!isSidebarCollapsed ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <Header />
        <main className="flex-1 p-2 sm:p-4 md:p-6 overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Backdrop for mobile sidebar */}
      <AnimatePresence>
        {!isSidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/50 z-10 lg:hidden"
          />
        )}
      </AnimatePresence>
      
      {/* Global components */}
      <TaskTimer />
      <ShutdownRoutine />
      <CommandPalette />
      <IdleTimeTracker />
      <IdleCountdown />
      <IdleReviewModal />
    </div>
  );
}

export default App;