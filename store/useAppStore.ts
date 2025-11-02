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
} from '../types';
import { STORAGE_KEYS } from '../constants';

interface AppState {
  plan: TodaysPlan;
  logs: LogEntry[];
  goals: Goal[];
  activeTask: ActiveTask | null;
  reflections: Reflection[];
  theme: Theme;
  isReflectionModalOpen: boolean;

  // Actions
  initialize: () => void;
  addTask: (text: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  reorderTasks: (tasks: Task[]) => void;
  startTimer: (task: string, durationMinutes: number) => void;
  updateTimer: (updates: Partial<ActiveTask>) => void;
  finishTimer: () => void;
  addLog: (log: Omit<LogEntry, 'id'|'timestamp'|'dateString'>) => void;
  addGoal: (text: string, category: GoalCategory, deadline: string | null) => void;
  toggleGoal: (id: string) => void;
  deleteGoal: (id: string) => void;
  addReflection: (well: string, improve: string) => void;
  toggleTheme: () => void;
  setReflectionModalOpen: (isOpen: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // State
      plan: { date: getTodayDateString(), tasks: [] },
      logs: [],
      goals: [],
      activeTask: null,
      reflections: [],
      theme: 'light',
      isReflectionModalOpen: false,

      // Actions
      initialize: () => {
        const today = getTodayDateString();
        const { plan } = get();
        // Handles daily reset by date comparison
        if (plan.date !== today) {
          set({ plan: { date: today, tasks: [] }, activeTask: null });
        }
      },

      addTask: (text) => {
        const newTask: Task = { id: uuidv4(), text, completed: false };
        set((state) => ({
          plan: { ...state.plan, tasks: [...state.plan.tasks, newTask] },
        }));
      },

      toggleTask: (id) => {
        set((state) => {
          const updatedTasks = state.plan.tasks.map((task) =>
            task.id === id ? { ...task, completed: !task.completed } : task
          );
          const allCompleted = updatedTasks.length > 0 && updatedTasks.every(t => t.completed);
          return {
            plan: { ...state.plan, tasks: updatedTasks },
            isReflectionModalOpen: allCompleted ? true : state.isReflectionModalOpen
          };
        });
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

      startTimer: (task, durationMinutes) => {
        const durationSeconds = durationMinutes * 60;
        set({
          activeTask: {
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

      addLog: (log) => {
        const newLog: LogEntry = {
          ...log,
          id: uuidv4(),
          timestamp: Date.now(),
          dateString: getTodayDateString(),
        };
        set((state) => ({ logs: [newLog, ...state.logs] }));
      },

      addGoal: (text, category, deadline) => {
        const newGoal: Goal = {
          id: uuidv4(),
          text,
          category,
          deadline,
          completed: false,
        };
        set((state) => ({ goals: [...state.goals, newGoal] }));
      },

      toggleGoal: (id) => {
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === id ? { ...goal, completed: !goal.completed } : goal
          ),
        }));
      },

      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((goal) => goal.id !== id),
        }));
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
    }),
    {
      name: STORAGE_KEYS.APP_STATE,
      storage: createJSONStorage(() => localStorage),
    }
  )
);