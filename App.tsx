import React, { useEffect, lazy, Suspense } from 'react';
import { useAppStore } from './store/useAppStore';
import Header from './components/Header';
import ProductivityScore from './components/ProductivityScore';
import TodaysPlan from './components/TodaysPlan';
import TaskTimer from './components/TaskTimer';
import TimeLog from './components/TimeLog';
import DailyRoutine from './components/DailyRoutine';
import ReflectionTrigger from './components/ReflectionTrigger';
import PerformanceHistory from './components/PerformanceHistory';
import UnplannedTasks from './components/UnplannedTasks';
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
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import TimeAllocationByTag from './components/TimeAllocationByTag';
import ProcessInboxItemModal from './components/ProcessInboxItemModal';
import DashboardCard from './components/DashboardCard';
import CarryOverModal from './components/CarryOverModal';
import Toaster from './components/Toaster';
import WeeklyReview from './components/WeeklyReview';
import WeeklyReviewTrigger from './components/WeeklyReviewTrigger';
import LoadingSpinner from './components/LoadingSpinner';
import { BarChart3 } from 'lucide-react';

// Lazy-load the main view components
const MyGoals = lazy(() => import('./components/MyGoals'));
const InboxView = lazy(() => import('./components/InboxView'));
const CalendarView = lazy(() => import('./components/CalendarView'));
const DataAndInsights = lazy(() => import('./components/DataAndInsights'));


const dashboardComponentMap: { [key: string]: { component: React.FC, title: string, span: string } } = {
  ProductivityScore: { component: ProductivityScore, title: 'Productivity Score', span: 'lg:col-span-3' },
  WeeklyGoals: { component: WeeklyGoals, title: "This Week's Focus", span: 'lg:col-span-3' },
  WeeklyReviewTrigger: { component: WeeklyReviewTrigger, title: 'Weekly Review', span: 'lg:col-span-3' },
  StartDay: { component: StartDay, title: 'Start Day', span: 'lg:col-span-3' },
  DailyRoutine: { component: DailyRoutine, title: 'Daily Routine', span: 'lg:col-span-3' },
  TodaysPlan: { component: TodaysPlan, title: 'Planned Tasks', span: 'lg:col-span-3' },
  ProductivityStreak: { component: ProductivityStreak, title: 'Productivity Streak', span: 'lg:col-span-2' },
  UnplannedTasks: { component: UnplannedTasks, title: 'Unplanned Tasks', span: 'lg:col-span-2' },
  ReflectionTrigger: { component: ReflectionTrigger, title: 'End of Day', span: 'lg:col-span-2' },
};

const DashboardView = () => {
  const { dashboardItems, setDashboardItems, isDashboardInReorderMode, setDashboardReorderMode } = useAppStore();

  if (!dashboardItems) {
    return null;
  }

  return (
    <div className="relative">
      <AnimatePresence>
        {isDashboardInReorderMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sticky top-0 z-20 mb-4"
          >
            <button
              onClick={() => setDashboardReorderMode(false)}
              className="w-full bg-calm-blue-500 hover:bg-calm-blue-600 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              Done Reordering
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Reorder.Group
        values={dashboardItems}
        onReorder={setDashboardItems}
        className="grid grid-cols-1 lg:grid-cols-5 gap-6"
      >
        {dashboardItems.map((componentId) => {
          const item = dashboardComponentMap[componentId];
          if (!item) return null;
          const Component = item.component;
            
          return (
            <Reorder.Item
              key={componentId}
              value={componentId}
              dragListener={isDashboardInReorderMode}
              className={`${item.span} ${isDashboardInReorderMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
            >
              <DashboardCard title={item.title} componentId={componentId}>
                <Component />
              </DashboardCard>
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
    </div>
  );
};


const ReportsView = () => {
  const { performanceHistory, logs } = useAppStore();
  const hasData = performanceHistory.length > 0 || logs.length > 0;

  if (!hasData) {
    return (
      <div className="bg-white dark:bg-slate-800 p-10 rounded-2xl shadow-lg text-center flex flex-col items-center justify-center h-full">
        <BarChart3 size={48} className="mx-auto text-slate-400 mb-4" />
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">No Reports to Display</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
          Start tracking your tasks and time to unlock your productivity reports and gain insights into your work patterns.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <PerformanceHistory />
      <TimeAllocationByTag />
      <WastedTime />
      <TimeLog />
      <AdvancedAnalytics />
    </div>
  );
};

const InsightsView = () => (
  <div className="space-y-6">
    <Suspense fallback={<LoadingSpinner />}>
      <DataAndInsights />
    </Suspense>
  </div>
);

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
      case 'inbox':
        return <InboxView />;
      case 'calendar':
        return <CalendarView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className={`bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300 flex`}>
      <Sidebar />
      <div className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <Header />
        <main className="flex-1 p-2 sm:p-4 md:p-6 overflow-y-auto">
          <Suspense fallback={<LoadingSpinner />}>
            {renderActiveView()}
          </Suspense>
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
      <ProcessInboxItemModal />
      <CarryOverModal />
      <Toaster />
      <WeeklyReview />
    </div>
  );
}

export default App;
