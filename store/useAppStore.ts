import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
} from '../types';
import { STORAGE_KEYS } from '../constants';
import { supabase } from '../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

interface AppState {
  plan: TodaysPlan;
  logs: LogEntry[];
  goals: Goal[];
  routine: RoutineTask[];
  activeTask: ActiveTask | null;
  reflections: Reflection[];
  performanceHistory: PerformanceRecord[];
  theme: Theme;
  isReflectionModalOpen: boolean;
  session: Session | null;
  isDataLoading: boolean;
  isSessionChecked: boolean; // Tracks if the initial session check is complete

  // Actions
  initialize: () => void;
  addTask: (text: string, goalId: string | null) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  reorderTasks: (tasks: Task[]) => Promise<void>;
  startTimer: (id: string, type: 'plan' | 'routine', task: string, durationMinutes: number) => void;
  updateTimer: (updates: Partial<ActiveTask>) => void;
  completeActiveTask: () => Promise<void>;
  extendTimer: (minutes: number) => void;
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => Promise<void>;
  addGoal: (text: string, category: GoalCategory, deadline: string | null) => Promise<void>;
  toggleGoal: (id: string) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addRoutineTask: (text: string, goalId: string | null) => Promise<void>;
  toggleRoutineTask: (id: string, skipLog?: boolean) => Promise<void>;
  deleteRoutineTask: (id: string) => Promise<void>;
  reorderRoutine: (routine: RoutineTask[]) => Promise<void>;
  addReflection: (well: string, improve: string) => void;
  toggleTheme: () => void;
  setReflectionModalOpen: (isOpen: boolean) => void;
  setSession: (session: Session | null) => void;
  setSessionChecked: (isChecked: boolean) => void;
  clearUserState: () => void;
  fetchAllData: () => Promise<void>;
}

const initialState = {
  plan: { date: getTodayDateString(), tasks: [] },
  logs: [],
  goals: [],
  routine: [],
  activeTask: null,
  reflections: [],
  performanceHistory: [],
  isReflectionModalOpen: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // State
      ...initialState,
      theme: 'dark',
      session: null,
      isDataLoading: true,
      isSessionChecked: false,

      // Actions
      initialize: () => {
        const today = getTodayDateString();
        const { plan, routine, performanceHistory = [] } = get();

        if (plan.date !== today) {
          const totalPlanTasks = plan.tasks.length;
          const completedPlanTasks = plan.tasks.filter((t) => t.completed).length;
          
          const totalRoutineTasks = routine.length;
          const completedRoutineTasks = routine.filter((r) => r.completed).length;

          const totalTasks = totalPlanTasks + totalRoutineTasks;
          const completedTasks = completedPlanTasks + completedRoutineTasks;

          if (totalTasks > 0) {
            const score = Math.round((completedTasks / totalTasks) * 100);
            const newRecord: PerformanceRecord = { date: plan.date, score };
            
            const updatedHistory = (performanceHistory || []).filter(p => p.date !== newRecord.date);
            updatedHistory.push(newRecord);
            
            const sortedHistory = updatedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const prunedHistory = sortedHistory.slice(0, 30);
            set({ performanceHistory: prunedHistory });
          }
          
          set({
            plan: { date: today, tasks: [] }, // Will be populated by fetchAllData
            activeTask: null,
            routine: get().routine.map(task => ({ ...task, completed: false }))
          });
        }
      },
      
      fetchAllData: async () => {
        set({ isDataLoading: true });
        try {
          const today = getTodayDateString();
          const [goalsRes, tasksRes, routineRes, logsRes] = await Promise.all([
            supabase.from('goals').select('*').order('created_at', { ascending: true }),
            supabase.from('tasks').select('*').eq('date', today).order('position', { ascending: true }),
            supabase.from('routine_tasks').select('*').order('position', { ascending: true }),
            supabase.from('logs').select('*').like('timestamp', `${today}%`).order('timestamp', { ascending: false })
          ]);

          if (goalsRes.error) throw goalsRes.error;
          if (tasksRes.error) throw tasksRes.error;
          if (routineRes.error) throw routineRes.error;
          if (logsRes.error) throw logsRes.error;

          set({
            goals: goalsRes.data || [],
            plan: { date: today, tasks: tasksRes.data || [] },
            routine: (routineRes.data || []).map(r => ({ ...r, completed: false })), // Start fresh daily
            logs: logsRes.data || [],
            isDataLoading: false
          });

        } catch (error: any) {
          console.error('Error fetching data:', error.message);
          set({ isDataLoading: false });
        }
      },

      addTask: async (text, goal_id) => {
        const { plan, session } = get();
        if (!session?.user) return;

        const newPosition = plan.tasks.length > 0 ? Math.max(...plan.tasks.map(t => t.position)) + 1 : 0;
        
        const newTaskStub: Task = {
            id: `temp-${Date.now()}`,
            text,
            completed: false,
            goal_id,
            position: newPosition,
        };
        
        set({ plan: { ...plan, tasks: [...plan.tasks, newTaskStub] } });

        const { data, error } = await supabase
            .from('tasks')
            .insert({
                text,
                goal_id,
                date: plan.date,
                position: newPosition,
                user_id: session.user.id
            })
            .select()
            .single();

        if (error) {
            console.error("Error adding task:", error.message);
            set({ plan: { ...plan, tasks: plan.tasks.filter(t => t.id !== newTaskStub.id) } }); // Revert on error
            return;
        }

        set({ plan: { ...plan, tasks: plan.tasks.map(t => t.id === newTaskStub.id ? data : t) } });
      },

      toggleTask: async (id) => {
        const task = get().plan.tasks.find(t => t.id === id);
        if (!task) return;
        
        set(state => ({
          plan: {
            ...state.plan,
            tasks: state.plan.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
          }
        }));

        const { error } = await supabase
          .from('tasks')
          .update({ completed: !task.completed })
          .eq('id', id);

        if (error) {
          console.error("Error toggling task:", error.message);
          set(state => ({ // Revert on error
            plan: {
              ...state.plan,
              tasks: state.plan.tasks.map(t => t.id === id ? { ...t, completed: task.completed } : t)
            }
          }));
        }
      },

      deleteTask: async (id) => {
        const originalTasks = get().plan.tasks;
        const tasksToKeep = originalTasks.filter(task => task.id !== id);
        
        set(state => ({ plan: { ...state.plan, tasks: tasksToKeep } }));
        
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        
        if (error) {
            console.error("Error deleting task:", error.message);
            set(state => ({ plan: { ...state.plan, tasks: originalTasks } })); // Revert
        }
      },
      
      reorderTasks: async (tasks) => {
        const originalTasks = get().plan.tasks;
        set(state => ({ plan: { ...state.plan, tasks } }));

        const updates = tasks.map((task, index) => ({
            id: task.id,
            position: index,
        }));

        const { error } = await supabase.from('tasks').upsert(updates);

        if (error) {
            console.error("Error reordering tasks:", error.message);
            set(state => ({ plan: { ...state.plan, tasks: originalTasks } })); // Revert
        }
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
      
      completeActiveTask: async () => {
        const { activeTask, toggleTask, toggleRoutineTask, addLog } = get();
        if (activeTask) {
          const timeSpent = activeTask.totalDuration - activeTask.remainingSeconds;
          if (timeSpent > 0) {
            await addLog({ task: activeTask.task, duration: timeSpent });
          }

          if (activeTask.type === 'plan') {
            await toggleTask(activeTask.id);
          } else if (activeTask.type === 'routine') {
            await toggleRoutineTask(activeTask.id, true);
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

      addLog: async (log) => {
        const { session } = get();
        if (!session?.user) return;

        const { data, error } = await supabase
            .from('logs')
            .insert({
                task: log.task,
                duration: log.duration,
                user_id: session.user.id
            })
            .select()
            .single();

        if (error) {
            console.error("Error adding log:", error.message);
            return;
        }
        
        set((state) => ({ logs: [data as LogEntry, ...state.logs] }));
      },

      addGoal: async (text, category, deadline) => {
        const { session } = get();
        if (!session?.user) return;

        try {
            const { data, error } = await supabase
              .from('goals')
              .insert({ text, category, deadline, user_id: session.user.id })
              .select()
              .single();

            if (error) throw error;
            
            if (data) {
                set((state) => ({ goals: [...state.goals, data as Goal] }));
            }
        } catch(error: any) {
            console.error('Error adding goal:', error.message);
        }
      },

      toggleGoal: async (id) => {
        const goal = get().goals.find((g) => g.id === id);
        if (!goal) return;

        try {
            const { error } = await supabase
              .from('goals')
              .update({ completed: !goal.completed })
              .eq('id', id);
            
            if (error) throw error;

            set((state) => ({
              goals: state.goals.map((g) =>
                g.id === id ? { ...g, completed: !g.completed } : g
              ),
            }));
        } catch(error: any) {
            console.error('Error toggling goal:', error.message);
        }
      },

      deleteGoal: async (id) => {
        try {
            const { error } = await supabase
              .from('goals')
              .delete()
              .eq('id', id);
            
            if (error) throw error;

            set((state) => ({
              goals: state.goals.filter((goal) => goal.id !== id),
            }));
        } catch (error: any) {
            console.error('Error deleting goal:', error.message);
        }
      },

      addRoutineTask: async (text, goal_id) => {
         const { routine, session } = get();
        if (!session?.user) return;

        const newPosition = routine.length > 0 ? Math.max(...routine.map(t => t.position)) + 1 : 0;
        
        const { data, error } = await supabase
            .from('routine_tasks')
            .insert({ text, goal_id, position: newPosition, user_id: session.user.id })
            .select()
            .single();

        if (error) {
            console.error("Error adding routine task:", error.message);
            return;
        }

        set({ routine: [...routine, { ...data, completed: false }] });
      },

      toggleRoutineTask: async (id, skipLog = false) => {
        const { routine, addLog } = get();
        const taskToToggle = routine.find((task) => task.id === id);

        if (!skipLog && taskToToggle && !taskToToggle.completed) {
          await addLog({ task: taskToToggle.text, duration: 0 });
        }
        
        set((state) => ({
          routine: state.routine.map((task) =>
            task.id === id ? { ...task, completed: !task.completed } : task
          ),
        }));
      },

      deleteRoutineTask: async (id) => {
        const originalRoutine = get().routine;
        set({ routine: originalRoutine.filter((task) => task.id !== id) });
        
        const { error } = await supabase.from('routine_tasks').delete().eq('id', id);
        
        if (error) {
            console.error("Error deleting routine task:", error.message);
            set({ routine: originalRoutine }); // Revert
        }
      },
      
      reorderRoutine: async (routine) => {
        const originalRoutine = get().routine;
        // Keep client-side `completed` state during reorder
        const reorderedWithState = routine.map(task => {
            const originalTask = originalRoutine.find(t => t.id === task.id);
            return { ...task, completed: originalTask ? originalTask.completed : false };
        });

        set({ routine: reorderedWithState });

        const updates = routine.map((task, index) => ({
            id: task.id,
            position: index,
        }));

        const { error } = await supabase.from('routine_tasks').upsert(updates);
        if (error) {
            console.error("Error reordering routine:", error.message);
            set({ routine: originalRoutine }); // Revert
        }
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

      setSession: (session) => {
        set({ session });
        if (!session) {
          get().clearUserState();
        }
      },

      setSessionChecked: (isChecked) => {
        set({ isSessionChecked: isChecked });
      },
      
      clearUserState: () => {
        set({...initialState, goals: [], isDataLoading: false, session: null, isSessionChecked: true});
      }
    }),
    {
      name: STORAGE_KEYS.APP_STATE,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
          // Only persist UI settings and non-server data
          theme: state.theme,
          reflections: state.reflections,
          performanceHistory: state.performanceHistory,
      }),
    }
  )
);
