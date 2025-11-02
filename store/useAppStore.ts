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
} from '../types';
import { STORAGE_KEYS } from '../constants';

interface AppState {
  plan: TodaysPlan;
  logs: LogEntry[];
  goals: Goal[];
  routine: RoutineTask[];
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
  startTimer: (id: string, type: 'plan' | 'routine', task: string, durationMinutes: number) => void;
  updateTimer: (updates: Partial<ActiveTask>) => void;
  finishTimer: () => void;
  completeActiveTask: () => void;
  addLog: (log: Omit<LogEntry, 'id'|'timestamp'|'dateString'>) => void;
  addGoal: (text: string, category: GoalCategory, deadline: string | null) => void;
  toggleGoal: (id: string) => void;
  deleteGoal: (id: string) => void;
  addRoutineTask: (text: string) => void;
  toggleRoutineTask: (id: string, skipLog?: boolean) => void;
  deleteRoutineTask: (id: string) => void;
  reorderRoutine: (routine: RoutineTask[]) => void;
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
      routine: [],
      activeTask: null,
      reflections: [],
      theme: 'dark',
      isReflectionModalOpen: false,

      // Actions
      initialize: () => {
        const today = getTodayDateString();
        const { plan, routine } = get();
        // Handles daily reset by date comparison
        if (plan.date !== today) {
          set({
            plan: { date: today, tasks: [] },
            activeTask: null,
            // Reset completion status for routine tasks but don't delete them
            routine: routine.map(task => ({ ...task, completed: false }))
          });
        }
      },

      addTask: (text) => {
        const newTask: Task = { id: uuidv4(), text, completed: false };
        set((state) => ({
          plan: { ...state.plan, tasks: [...state.plan.tasks, newTask] },
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
            toggleRoutineTask(activeTask.id, true); // Pass skipLog = true
          }

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

      addRoutineTask: (text) => {
        const newRoutineTask: RoutineTask = { id: uuidv4(), text, completed: false };
        set((state) => ({
          routine: [...state.routine, newRoutineTask],
        }));
      },

      toggleRoutineTask: (id, skipLog = false) => {
        const { routine, addLog } = get();
        const taskToToggle = routine.find((task) => task.id === id);

        // When marking a routine task as complete, add it to the log.
        if (!skipLog && taskToToggle && !taskToToggle.completed) {
          addLog({ task: taskToToggle.text, duration: 0 });
        }
        
        set((state) => ({
          routine: state.routine.map((task) =>
            task.id === id ? { ...task, completed: !task.completed } : task
          ),
        }));
      },

      deleteRoutineTask: (id) => {
        set((state) => ({
          routine: state.routine.filter((task) => task.id !== id),
        }));
      },
      
      reorderRoutine: (routine) => {
        set({ routine });
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