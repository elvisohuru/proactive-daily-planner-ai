import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { getTodayDateString } from '../utils/dateUtils';
import {
  Task,
  TodaysPlan,
  LogEntry,
  Goal,
  GoalCategory,
  ActiveTask,
  Reflection,
  Theme,
  RoutineTask,
  PerformanceRecord,
  TaskPriority,
  UnplannedTask,
  Streak,
} from '../types';
import { STORAGE_KEYS } from '../constants';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { achievementsList } from '../utils/achievements';


export interface AppState {
  plan: TodaysPlan;
  logs: LogEntry[];
  goals: Goal[];
  routine: RoutineTask[];
  unplannedTasks: UnplannedTask[];
  activeTask: ActiveTask | null;
  reflections: Reflection[];
  performanceHistory: PerformanceRecord[];
  streak: Streak;
  unlockedAchievements: string[];
  theme: Theme;
  isReflectionModalOpen: boolean;

  // Actions
  initialize: () => void;
  addTask: (text: string, goalId: string | null, priority: TaskPriority, tags: string[]) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Pick<Task, 'priority' | 'tags'>>) => void;
  reorderTasks: (tasks: Task[]) => void;
  linkTaskToGoal: (taskId: string, goalId: string | null) => void;
  startTimer: (id: string, type: 'plan' | 'routine', task: string, durationMinutes: number) => void;
  updateTimer: (updates: Partial<ActiveTask>) => void;
  finishTimer: () => void;
  completeActiveTask: () => void;
  extendTimer: (minutes: number) => void;
  addLog: (log: Omit<LogEntry, 'id'|'timestamp'|'dateString'>) => void;
  addGoal: (text: string, category: GoalCategory, deadline: string | null) => void;
  toggleGoal: (id: string) => void;
  archiveGoal: (id: string) => void;
  restoreGoal: (id: string) => void;
  permanentlyDeleteGoal: (id: string) => void;
  addRoutineTask: (text: string, goalId: string | null, recurringDays: number[]) => void;
  toggleRoutineTask: (id: string, skipLog?: boolean) => void;
  deleteRoutineTask: (id: string) => void;
  reorderRoutine: (routine: RoutineTask[]) => void;
  addUnplannedTask: (text: string) => void;
  planUnplannedTask: (id: string) => void;
  deleteUnplannedTask: (id: string) => void;
  addReflection: (well: string, improve: string) => void;
  toggleTheme: () => void;
  setReflectionModalOpen: (isOpen: boolean) => void;
  checkAchievements: () => void;
  exportData: () => void;
}

const getTodaysScheduledRoutineTasks = (routine: RoutineTask[]): RoutineTask[] => {
    const todayIndex = new Date().getDay();
    return routine.filter(r => r.recurringDays.length === 0 || r.recurringDays.includes(todayIndex));
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // State
      plan: { date: getTodayDateString(), tasks: [] },
      logs: [],
      goals: [],
      routine: [],
      unplannedTasks: [],
      activeTask: null,
      reflections: [],
      performanceHistory: [],
      streak: { current: 0, longest: 0, lastActivityDate: null },
      unlockedAchievements: [],
      theme: 'dark',
      isReflectionModalOpen: false,

      // Actions
      initialize: () => {
        const today = getTodayDateString();
        const { plan, routine, performanceHistory, streak, checkAchievements } = get();

        if (plan.date !== today) {
          const todaysScheduledRoutine = getTodaysScheduledRoutineTasks(routine);
          const totalPlanTasks = plan.tasks.length;
          const completedPlanTasks = plan.tasks.filter((t) => t.completed).length;
          
          const totalRoutineTasks = todaysScheduledRoutine.length;
          const completedRoutineTasks = todaysScheduledRoutine.filter((r) => r.completed).length;

          const totalTasks = totalPlanTasks + totalRoutineTasks;
          const completedTasks = completedPlanTasks + completedRoutineTasks;

          let newStreak = { ...streak };

          if (totalTasks > 0) {
            const score = Math.round((completedTasks / totalTasks) * 100);
            const newRecord: PerformanceRecord = { date: plan.date, score };
            
            const updatedHistory = performanceHistory.filter(p => p.date !== newRecord.date);
            updatedHistory.push(newRecord);
            
            const sortedHistory = updatedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const prunedHistory = sortedHistory.slice(0, 30);
            set({ performanceHistory: prunedHistory });

            // Streak Logic
            const lastDate = streak.lastActivityDate ? parseISO(streak.lastActivityDate) : null;
            const planDate = parseISO(plan.date);
            if (lastDate && differenceInCalendarDays(planDate, lastDate) === 1) {
              newStreak.current += 1;
            } else {
              newStreak.current = 1;
            }
            newStreak.lastActivityDate = plan.date;
            if (newStreak.current > newStreak.longest) {
              newStreak.longest = newStreak.current;
            }
            set({ streak: newStreak });
          } else if (streak.lastActivityDate) {
              const lastDate = parseISO(streak.lastActivityDate);
              const planDate = parseISO(plan.date);
              if (differenceInCalendarDays(planDate, lastDate) > 1) {
                 newStreak.current = 0;
                 set({ streak: newStreak });
              }
          }
          
          set({
            plan: { date: today, tasks: [] },
            activeTask: null,
            routine: get().routine.map(task => ({ ...task, completed: false }))
          });
          checkAchievements();
        }
      },

      addTask: (text, goalId, priority, tags) => {
        const newTask: Task = { id: uuidv4(), text, completed: false, goalId, priority, tags };
        set((state) => ({
          plan: { ...state.plan, tasks: [...state.plan.tasks, newTask] },
        }));
        get().checkAchievements();
      },
      
      updateTask: (id, updates) => {
        set(state => ({
          plan: {
            ...state.plan,
            tasks: state.plan.tasks.map(task => 
              task.id === id ? { ...task, ...updates } : task
            ),
          },
        }));
      },

      toggleTask: (id) => {
        set((state) => ({
          plan: {
            ...state.plan,
            tasks: state.plan.tasks.map((task) =>
              task.id === id ? { ...task, completed: !task.completed } : task
            ),
          },
        }));
        get().checkAchievements();
      },

      deleteTask: (id) => {
        set((state) => ({
          plan: { ...state.plan, tasks: state.plan.tasks.filter((task) => task.id !== id) },
        }));
      },
      
      reorderTasks: (tasks) => {
        set((state) => ({
          plan: { ...state.plan, tasks },
        }));
      },
      
      linkTaskToGoal: (taskId, goalId) => {
        set((state) => ({
          plan: {
            ...state.plan,
            tasks: state.plan.tasks.map((task) =>
              task.id === taskId ? { ...task, goalId } : task
            ),
          },
        }));
      },

      startTimer: (id, type, task, durationMinutes) => {
        const durationSeconds = durationMinutes * 60;
        set({
          activeTask: {
            id,
            type,
            task,
            remainingSeconds: durationSeconds,
            totalDuration: durationSeconds,
            isPaused: false,
          },
        });
      },
      
      updateTimer: (updates) => {
        set((state) => ({
          activeTask: state.activeTask ? { ...state.activeTask, ...updates } : null,
        }));
      },

      finishTimer: () => {
        const { activeTask } = get();
        if (activeTask) {
          get().addLog({ task: activeTask.task, duration: activeTask.totalDuration });
          set({ activeTask: null });
        }
      },
      
      completeActiveTask: () => {
        const { activeTask, toggleTask, toggleRoutineTask, addLog } = get();
        if (activeTask) {
          const timeSpent = activeTask.totalDuration - activeTask.remainingSeconds;
          if (timeSpent > 0) {
            addLog({ task: activeTask.task, duration: timeSpent });
          }

          if (activeTask.type === 'plan') {
            toggleTask(activeTask.id);
          } else if (activeTask.type === 'routine') {
            toggleRoutineTask(activeTask.id, true);
          }

          set({ activeTask: null });
        }
      },

      extendTimer: (minutes) => {
        set((state) => {
          if (!state.activeTask) return {};
          const additionalSeconds = minutes * 60;
          return {
            activeTask: {
              ...state.activeTask,
              remainingSeconds: state.activeTask.remainingSeconds + additionalSeconds,
              totalDuration: state.activeTask.totalDuration + additionalSeconds,
              isPaused: false,
            },
          };
        });
      },

      addLog: (log) => {
        const newLog: LogEntry = {
          ...log,
          id: uuidv4(),
          timestamp: Date.now(),
          dateString: getTodayDateString(),
        };
        set((state) => ({ logs: [newLog, ...state.logs] }));
        get().checkAchievements();
      },

      addGoal: (text, category, deadline) => {
        const newGoal: Goal = {
          id: uuidv4(),
          text,
          category,
          deadline,
          completed: false,
          archived: false,
        };
        set((state) => ({ goals: [...state.goals, newGoal] }));
      },

      toggleGoal: (id) => {
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === id ? { ...goal, completed: !goal.completed } : goal
          ),
        }));
        get().checkAchievements();
      },

      archiveGoal: (id) => {
         set(state => ({
             goals: state.goals.map(g => g.id === id ? { ...g, archived: true } : g)
         }))
      },

      restoreGoal: (id) => {
         set(state => ({
             goals: state.goals.map(g => g.id === id ? { ...g, archived: false } : g)
         }))
      },
      
      permanentlyDeleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((goal) => goal.id !== id),
        }));
      },

      addRoutineTask: (text, goalId, recurringDays) => {
        const newRoutineTask: RoutineTask = { id: uuidv4(), text, completed: false, goalId, recurringDays };
        set((state) => ({
          routine: [...state.routine, newRoutineTask],
        }));
      },

      toggleRoutineTask: (id, skipLog = false) => {
        const { routine, addLog } = get();
        const taskToToggle = routine.find((task) => task.id === id);

        if (!skipLog && taskToToggle && !taskToToggle.completed) {
          addLog({ task: taskToToggle.text, duration: 0 });
        }
        
        set((state) => ({
          routine: state.routine.map((task) =>
            task.id === id ? { ...task, completed: !task.completed } : task
          ),
        }));
        get().checkAchievements();
      },

      deleteRoutineTask: (id) => {
        set((state) => ({
          routine: state.routine.filter((task) => task.id !== id),
        }));
      },
      
      reorderRoutine: (routine) => {
        set({ routine });
      },
      
      addUnplannedTask: (text) => {
        const task: UnplannedTask = { id: uuidv4(), text, createdAt: Date.now() };
        set(state => ({ unplannedTasks: [task, ...state.unplannedTasks] }));
      },
      
      planUnplannedTask: (id) => {
        const { unplannedTasks, addTask } = get();
        const taskToPlan = unplannedTasks.find(t => t.id === id);
        if(taskToPlan) {
            addTask(taskToPlan.text, null, 'none', []);
            set(state => ({ unplannedTasks: state.unplannedTasks.filter(t => t.id !== id) }));
        }
      },
      
      deleteUnplannedTask: (id) => {
        set(state => ({ unplannedTasks: state.unplannedTasks.filter(t => t.id !== id) }));
      },

      addReflection: (well, improve) => {
        const newReflection: Reflection = {
          date: getTodayDateString(),
          well,
          improve,
        };
        set((state) => ({
          reflections: [newReflection, ...state.reflections.filter(r => r.date !== newReflection.date)]
        }));
        get().setReflectionModalOpen(false);
      },
      
      toggleTheme: () => {
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        }));
      },

      setReflectionModalOpen: (isOpen) => {
        set({ isReflectionModalOpen: isOpen });
      },

      checkAchievements: () => {
        const state = get();
        const newlyUnlocked = achievementsList
          .filter(ach => !state.unlockedAchievements.includes(ach.id))
          .filter(ach => ach.condition(state))
          .map(ach => ach.id);
        
        if (newlyUnlocked.length > 0) {
          set(s => ({ unlockedAchievements: [...s.unlockedAchievements, ...newlyUnlocked] }));
        }
      },
      
      exportData: () => {
        const state = get();
        const dataToExport = {
          plan: state.plan,
          logs: state.logs,
          goals: state.goals,
          routine: state.routine,
          unplannedTasks: state.unplannedTasks,
          reflections: state.reflections,
          performanceHistory: state.performanceHistory,
          streak: state.streak,
          unlockedAchievements: state.unlockedAchievements,
        };
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `proactive-planner-export-${getTodayDateString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },

    }),
    {
      name: STORAGE_KEYS.APP_STATE,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
