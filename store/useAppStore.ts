
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
  ShutdownState,
  Project,
  SubTask,
  SubGoal,
} from '../types';
import { STORAGE_KEYS } from '../constants';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { achievementsList } from '../utils/achievements';
import { exportStateToMarkdown, convertToCsv } from '../utils/exportUtils';


export interface AppState {
  plan: TodaysPlan;
  logs: LogEntry[];
  goals: Goal[];
  projects: Project[];
  routine: RoutineTask[];
  unplannedTasks: UnplannedTask[];
  activeTask: ActiveTask | null;
  reflections: Reflection[];
  performanceHistory: PerformanceRecord[];
  streak: Streak;
  unlockedAchievements: string[];
  theme: Theme;
  shutdownState: ShutdownState;
  isCommandPaletteOpen: boolean;
  isDayStarted: boolean;
  focusOnElement: string | null;

  // Actions
  initialize: () => void;
  startDay: () => void;
  addTask: (text: string, goalId: string | null, priority: TaskPriority, tags: string[], isBonus?: boolean) => Task;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Pick<Task, 'priority' | 'tags' | 'dependsOn'>>) => void;
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
  addSubGoal: (goalId: string, text: string) => void;
  toggleSubGoal: (goalId: string, subGoalId: string) => void;
  deleteSubGoal: (goalId: string, subGoalId: string) => void;
  updateSubGoal: (goalId: string, subGoalId: string, updates: Partial<Pick<SubGoal, 'dependsOn'>>) => void;
  sendSubGoalToPlan: (goalId: string, subGoalId: string) => void;
  addProject: (text: string, deadline: string | null) => void;
  archiveProject: (id: string) => void;
  restoreProject: (id: string) => void;
  permanentlyDeleteProject: (id: string) => void;
  addSubTask: (projectId: string, text: string) => void;
  toggleSubTask: (projectId: string, subTaskId: string) => void;
  deleteSubTask: (projectId: string, subTaskId: string) => void;
  updateSubTask: (projectId: string, subTaskId: string, updates: Partial<Pick<SubTask, 'dependsOn'>>) => void;
  sendSubTaskToPlan: (projectId: string, subTaskId: string) => void;
  addRoutineTask: (text: string, goalId: string | null, recurringDays: number[]) => void;
  toggleRoutineTask: (id: string, skipLog?: boolean) => void;
  updateRoutineTask: (id: string, updates: Partial<Pick<RoutineTask, 'dependsOn'>>) => void;
  deleteRoutineTask: (id: string) => void;
  reorderRoutine: (routine: RoutineTask[]) => void;
  addUnplannedTask: (text: string) => void;
  planUnplannedTask: (id: string) => void;
  deleteUnplannedTask: (id: string) => void;
  addReflection: (well: string, improve: string) => void;
  toggleTheme: () => void;
  startShutdownRoutine: () => void;
  processUnfinishedTasks: () => void;
  closeShutdownRoutine: () => void;
  setShutdownStep: (step: 'review' | 'reflect') => void;
  setCommandPaletteOpen: (isOpen: boolean) => void;
  setFocusOnElement: (elementId: string | null) => void;
  checkAchievements: () => void;
  exportDataAsJson: () => void;
  exportDataAsMarkdown: () => void;
  exportDataAsCsv: (dataType: 'tasks' | 'goals' | 'routine' | 'logs' | 'projects') => void;
  importData: (jsonString: string) => void;
}

const getTodaysScheduledRoutineTasks = (routine: RoutineTask[], date: Date): RoutineTask[] => {
    const todayIndex = date.getDay();
    return routine.filter(r => r.recurringDays.length === 0 || r.recurringDays.includes(todayIndex));
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // State
      plan: { date: getTodayDateString(), tasks: [] },
      logs: [],
      goals: [],
      projects: [],
      routine: [],
      unplannedTasks: [],
      activeTask: null,
      reflections: [],
      performanceHistory: [],
      streak: { current: 0, longest: 0, lastActivityDate: null },
      unlockedAchievements: [],
      theme: 'dark',
      shutdownState: { isOpen: false, step: null, unfinishedTasks: [] },
      isCommandPaletteOpen: false,
      isDayStarted: false,
      focusOnElement: null,

      // Actions
      initialize: () => {
        const todayString = getTodayDateString();
        const { plan, routine, performanceHistory, streak, checkAchievements } = get();

        if (plan.date !== todayString) {
          const yesterday = plan.date;
          const yesterdayDate = parseISO(yesterday);
          const todaysScheduledRoutine = getTodaysScheduledRoutineTasks(routine, yesterdayDate);

          const totalPlanTasks = plan.tasks.length;
          const completedPlanTasks = plan.tasks.filter((t) => t.completed).length;
          
          const totalRoutineTasks = todaysScheduledRoutine.length;
          const completedRoutineTasks = routine.filter(r => {
             const taskIsForYesterday = r.recurringDays.length === 0 || r.recurringDays.includes(yesterdayDate.getDay());
             return taskIsForYesterday && r.completed;
          }).length;

          const totalTasks = totalPlanTasks + totalRoutineTasks;
          const completedTasks = completedPlanTasks + completedRoutineTasks;
          
          let score = 0;
          if (totalTasks > 0) {
            score = Math.round((completedTasks / totalTasks) * 100);
          }

          if (totalTasks > 0) {
            const newRecord: PerformanceRecord = { date: yesterday, score };
            const updatedHistory = [newRecord, ...performanceHistory.filter(p => p.date !== newRecord.date)];
            const sortedHistory = updatedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const prunedHistory = sortedHistory.slice(0, 30);
            set({ performanceHistory: prunedHistory });
          }

          let newStreak = { ...streak };
          const lastDate = streak.lastActivityDate ? parseISO(streak.lastActivityDate) : null;
          const yesterdayHadActivity = totalTasks > 0;

          if (yesterdayHadActivity) {
            if (lastDate && differenceInCalendarDays(yesterdayDate, lastDate) === 1) {
              newStreak.current += 1;
            } else {
              newStreak.current = 1; 
            }
            newStreak.lastActivityDate = yesterday;
            if (newStreak.current > newStreak.longest) {
              newStreak.longest = newStreak.current;
            }
          } else {
            if (lastDate && differenceInCalendarDays(parseISO(todayString), lastDate) > 1) {
              newStreak.current = 0;
            }
          }
          set({ streak: newStreak });
          
          // Check achievements before resetting daily state
          checkAchievements();

          set({
            plan: { date: todayString, tasks: [] },
            activeTask: null,
            routine: get().routine.map(task => ({ ...task, completed: false })),
            isDayStarted: false,
          });
        }
      },

      startDay: () => {
        set({ isDayStarted: true });
      },

      addTask: (text, goalId, priority, tags, isBonus = false) => {
        const newTask: Task = { id: uuidv4(), text, completed: false, goalId, priority, tags, dependsOn: [], isBonus };
        set((state) => ({
          plan: { ...state.plan, tasks: [...state.plan.tasks, newTask] },
        }));
        get().checkAchievements();
        return newTask;
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
        get().checkAchievements();
      },

      toggleTask: (id) => {
        set((state) => {
          let toggledTask: Task | undefined;
          
          const updatedTasks = state.plan.tasks.map((task) => {
            if (task.id === id) {
              toggledTask = { ...task, completed: !task.completed };
              return toggledTask;
            }
            return task;
          });

          if (toggledTask) {
              const isNowCompleted = toggledTask.completed;
              // Sync with Project Sub-task
              if (toggledTask.originProjectId && toggledTask.originSubTaskId) {
                  const { originProjectId, originSubTaskId } = toggledTask;
                  state.projects = state.projects.map(p => {
                      if (p.id === originProjectId) {
                          const updatedSubTasks = p.subTasks.map(st => 
                              st.id === originSubTaskId ? { ...st, completed: isNowCompleted } : st
                          );
                          const allCompleted = updatedSubTasks.length > 0 && updatedSubTasks.every(st => st.completed);
                          return { ...p, subTasks: updatedSubTasks, completed: allCompleted };
                      }
                      return p;
                  });
              }
              // Sync with Goal Sub-goal
              if (toggledTask.originGoalId && toggledTask.originSubGoalId) {
                  const { originGoalId, originSubGoalId } = toggledTask;
                  state.goals = state.goals.map(g => {
                      if (g.id === originGoalId) {
                          const updatedSubGoals = g.subGoals.map(sg => 
                              sg.id === originSubGoalId ? { ...sg, completed: isNowCompleted } : sg
                          );
                          const allCompleted = updatedSubGoals.length > 0 && updatedSubGoals.every(sg => sg.completed);
                          return { ...g, subGoals: updatedSubGoals, completed: allCompleted };
                      }
                      return g;
                  });
              }
          }
      
          // Dependency re-render logic
          const finalTasks = updatedTasks.map(task => {
            if (task.dependsOn?.includes(id)) {
              return { ...task };
            }
            return task;
          });
      
          return {
            plan: { ...state.plan, tasks: finalTasks },
            projects: [...state.projects],
            goals: [...state.goals],
          };
        });
        get().checkAchievements();
      },

      deleteTask: (id) => {
        const taskToDelete = get().plan.tasks.find(t => t.id === id);

        set((state) => ({
          plan: { ...state.plan, tasks: state.plan.tasks.filter((task) => task.id !== id) },
          // Unlink from sub-task
          projects: taskToDelete?.originSubTaskId ? state.projects.map(p => ({
            ...p,
            subTasks: p.subTasks.map(st => st.id === taskToDelete.originSubTaskId ? { ...st, linkedTaskId: null } : st)
          })) : state.projects,
          // Unlink from sub-goal
          goals: taskToDelete?.originSubGoalId ? state.goals.map(g => ({
            ...g,
            subGoals: g.subGoals.map(sg => sg.id === taskToDelete.originSubGoalId ? { ...sg, linkedTaskId: null } : sg)
          })) : state.goals,
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
          subGoals: [],
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

      addSubGoal: (goalId, text) => {
        const newSubGoal: SubGoal = { id: uuidv4(), text, completed: false, dependsOn: [], linkedTaskId: null };
        set(state => ({
            goals: state.goals.map(g => 
                g.id === goalId ? { ...g, subGoals: [...g.subGoals, newSubGoal], completed: false } : g
            )
        }));
      },

      toggleSubGoal: (goalId, subGoalId) => {
        set(state => ({
            goals: state.goals.map(g => {
                if (g.id === goalId) {
                    let toggledSubGoal: SubGoal | undefined;
                    const updatedSubGoals = g.subGoals.map(sg => {
                        if (sg.id === subGoalId) {
                            toggledSubGoal = { ...sg, completed: !sg.completed };
                            return toggledSubGoal;
                        }
                        return sg;
                    });
                    
                    // Sync with linked task if it exists
                    if (toggledSubGoal?.linkedTaskId) {
                        const linkedTask = state.plan.tasks.find(t => t.id === toggledSubGoal!.linkedTaskId);
                        if (linkedTask && linkedTask.completed !== toggledSubGoal.completed) {
                            state.plan.tasks = state.plan.tasks.map(t => t.id === linkedTask.id ? { ...t, completed: toggledSubGoal!.completed } : t);
                        }
                    }

                    const dependencyUpdatedSubGoals = updatedSubGoals.map(sg => sg.dependsOn?.includes(subGoalId) ? { ...sg } : sg);
                    const allCompleted = dependencyUpdatedSubGoals.length > 0 && dependencyUpdatedSubGoals.every(sg => sg.completed);
                    return { ...g, subGoals: dependencyUpdatedSubGoals, completed: allCompleted };
                }
                return g;
            })
        }));
        get().checkAchievements();
      },

      deleteSubGoal: (goalId, subGoalId) => {
        const subGoalToDelete = get().goals.find(g => g.id === goalId)?.subGoals.find(sg => sg.id === subGoalId);
        set(state => ({
            goals: state.goals.map(g => {
                if (g.id === goalId) {
                    const updatedSubGoals = g.subGoals.filter(sg => sg.id !== subGoalId);
                    const allCompleted = updatedSubGoals.length > 0 && updatedSubGoals.every(sg => sg.completed);
                    return { ...g, subGoals: updatedSubGoals, completed: allCompleted };
                }
                return g;
            }),
            plan: {
                ...state.plan,
                tasks: subGoalToDelete?.linkedTaskId ? state.plan.tasks.map(t => 
                    t.id === subGoalToDelete.linkedTaskId 
                    ? { ...t, originGoalId: undefined, originSubGoalId: undefined } 
                    : t
                ) : state.plan.tasks
            }
        }));
      },

      updateSubGoal: (goalId, subGoalId, updates) => {
        set(state => ({
            goals: state.goals.map(g => 
                g.id === goalId ? { ...g, subGoals: g.subGoals.map(sg => sg.id === subGoalId ? { ...sg, ...updates } : sg) } : g
            )
        }));
        get().checkAchievements();
      },
      
      sendSubGoalToPlan: (goalId, subGoalId) => {
        const { goals, addTask } = get();
        const goal = goals.find(g => g.id === goalId);
        const subGoal = goal?.subGoals.find(sg => sg.id === subGoalId);

        if (subGoal && !subGoal.linkedTaskId) {
            const newTask = addTask(subGoal.text, null, 'none', ['goal']);
            set(state => ({
                goals: state.goals.map(g => 
                    g.id === goalId ? { ...g, subGoals: g.subGoals.map(sg => sg.id === subGoalId ? { ...sg, linkedTaskId: newTask.id } : sg) } : g
                ),
                plan: {
                    ...state.plan,
                    tasks: state.plan.tasks.map(t => t.id === newTask.id ? { ...t, originGoalId: goalId, originSubGoalId: subGoalId } : t)
                }
            }));
        }
      },

      addProject: (text, deadline) => {
        const newProject: Project = { id: uuidv4(), text, completed: false, deadline, archived: false, subTasks: [] };
        set(state => ({ projects: [...state.projects, newProject] }));
      },

      archiveProject: (id) => {
        set(state => ({
          projects: state.projects.map(p => p.id === id ? { ...p, archived: true } : p)
        }));
      },

      restoreProject: (id) => {
        set(state => ({
          projects: state.projects.map(p => p.id === id ? { ...p, archived: false } : p)
        }));
      },

      permanentlyDeleteProject: (id) => {
        set(state => ({ projects: state.projects.filter(p => p.id !== id) }));
      },

      addSubTask: (projectId, text) => {
        const newSubTask: SubTask = { id: uuidv4(), text, completed: false, dependsOn: [], linkedTaskId: null };
        set(state => ({
          projects: state.projects.map(p => {
            if (p.id === projectId) {
              return { ...p, subTasks: [...p.subTasks, newSubTask], completed: false };
            }
            return p;
          })
        }));
      },

      toggleSubTask: (projectId, subTaskId) => {
        set(state => ({
          projects: state.projects.map(p => {
            if (p.id === projectId) {
              let toggledSubTask: SubTask | undefined;
              const updatedSubTasks = p.subTasks.map(st => {
                  if (st.id === subTaskId) {
                      toggledSubTask = { ...st, completed: !st.completed };
                      return toggledSubTask;
                  }
                  return st;
              });

              // Sync with linked task if it exists
              if (toggledSubTask?.linkedTaskId) {
                  const linkedTask = state.plan.tasks.find(t => t.id === toggledSubTask!.linkedTaskId);
                  if (linkedTask && linkedTask.completed !== toggledSubTask.completed) {
                      state.plan.tasks = state.plan.tasks.map(t => t.id === linkedTask.id ? { ...t, completed: toggledSubTask!.completed } : t);
                  }
              }

              const dependencyUpdatedSubTasks = updatedSubTasks.map(subtask => subtask.dependsOn?.includes(subTaskId) ? { ...subtask } : subtask);
              const allCompleted = dependencyUpdatedSubTasks.length > 0 && dependencyUpdatedSubTasks.every(st => st.completed);
              return { ...p, subTasks: dependencyUpdatedSubTasks, completed: allCompleted };
            }
            return p;
          })
        }));
        get().checkAchievements();
      },

      deleteSubTask: (projectId, subTaskId) => {
        const subTaskToDelete = get().projects.find(p => p.id === projectId)?.subTasks.find(st => st.id === subTaskId);
        set(state => ({
            projects: state.projects.map(p => {
                if (p.id === projectId) {
                    const updatedSubTasks = p.subTasks.filter(st => st.id !== subTaskId);
                    const allCompleted = updatedSubTasks.length > 0 && updatedSubTasks.every(st => st.completed);
                    return { ...p, subTasks: updatedSubTasks, completed: allCompleted };
                }
                return p;
            }),
            plan: {
                ...state.plan,
                tasks: subTaskToDelete?.linkedTaskId ? state.plan.tasks.map(t => 
                    t.id === subTaskToDelete.linkedTaskId 
                    ? { ...t, originProjectId: undefined, originSubTaskId: undefined } 
                    : t
                ) : state.plan.tasks
            }
        }));
      },

      updateSubTask: (projectId, subTaskId, updates) => {
        set(state => ({
            projects: state.projects.map(p => {
                if (p.id === projectId) {
                    return {
                        ...p,
                        subTasks: p.subTasks.map(st => 
                            st.id === subTaskId ? { ...st, ...updates } : st
                        )
                    };
                }
                return p;
            })
        }));
        get().checkAchievements();
      },

      sendSubTaskToPlan: (projectId, subTaskId) => {
        const { projects, addTask } = get();
        const project = projects.find(p => p.id === projectId);
        const subTask = project?.subTasks.find(st => st.id === subTaskId);

        if (subTask && !subTask.linkedTaskId) {
            const newTask = addTask(subTask.text, null, 'none', ['project']);
            set(state => ({
                projects: state.projects.map(p => 
                    p.id === projectId ? { ...p, subTasks: p.subTasks.map(st => st.id === subTaskId ? { ...st, linkedTaskId: newTask.id } : st) } : p
                ),
                plan: {
                    ...state.plan,
                    tasks: state.plan.tasks.map(t => t.id === newTask.id ? { ...t, originProjectId: projectId, originSubTaskId: subTaskId } : t)
                }
            }));
        }
      },

      addRoutineTask: (text, goalId, recurringDays) => {
        const newRoutineTask: RoutineTask = { id: uuidv4(), text, completed: false, goalId, recurringDays, dependsOn: [] };
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
        
        set((state) => {
          const updatedRoutine = state.routine.map((task) =>
            task.id === id ? { ...task, completed: !task.completed } : task
          );
          
          const finalRoutine = updatedRoutine.map(task => {
            if (task.dependsOn?.includes(id)) {
              return { ...task }; // Create a new object reference
            }
            return task;
          });

          return {
            routine: finalRoutine
          };
        });
        get().checkAchievements();
      },
      
      updateRoutineTask: (id, updates) => {
        set(state => ({
          routine: state.routine.map(task => 
            task.id === id ? { ...task, ...updates } : task
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
        const { unplannedTasks, addTask, isDayStarted } = get();
        const taskToPlan = unplannedTasks.find(t => t.id === id);
        if(taskToPlan) {
            addTask(taskToPlan.text, null, 'none', [], isDayStarted);
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
        get().checkAchievements();
        get().closeShutdownRoutine();
      },
      
      toggleTheme: () => {
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        }));
      },
      
      startShutdownRoutine: () => {
        const { plan, reflections } = get();
        const unfinishedTasks = plan.tasks.filter(t => !t.completed);
        const hasReflected = reflections.some(r => r.date === getTodayDateString());

        if (unfinishedTasks.length > 0) {
            set({ shutdownState: { isOpen: true, step: 'review', unfinishedTasks } });
        } else if (!hasReflected) {
            set({ shutdownState: { isOpen: true, step: 'reflect', unfinishedTasks: [] } });
        } else {
            // Already done everything
            get().closeShutdownRoutine();
        }
      },

      processUnfinishedTasks: () => {
          const { shutdownState, addUnplannedTask, plan } = get();
          const newUnplannedTasks = shutdownState.unfinishedTasks.map(t => ({ id: uuidv4(), text: t.text, createdAt: Date.now() }));
          
          set(state => ({
              unplannedTasks: [...newUnplannedTasks, ...state.unplannedTasks],
              plan: { ...plan, tasks: plan.tasks.filter(t => t.completed) },
              shutdownState: { ...state.shutdownState, step: 'reflect' }
          }));
      },
      
      setShutdownStep: (step) => {
        set(state => ({ shutdownState: { ...state.shutdownState, step } }));
      },

      closeShutdownRoutine: () => {
        set({ shutdownState: { isOpen: false, step: null, unfinishedTasks: [] } });
      },

      setCommandPaletteOpen: (isOpen) => {
        set({ isCommandPaletteOpen: isOpen });
      },

      setFocusOnElement: (elementId) => {
        set({ focusOnElement: elementId });
        if (elementId) {
            setTimeout(() => set({ focusOnElement: null }), 100);
        }
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
      
      exportDataAsJson: () => {
        const state = get();
        const dataToExport = {
          plan: state.plan,
          logs: state.logs,
          goals: state.goals,
          projects: state.projects,
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
      
      exportDataAsMarkdown: () => {
        const state = get();
        const markdown = exportStateToMarkdown(state);
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `proactive-planner-export-${getTodayDateString()}.md`;
        a.click();
        URL.revokeObjectURL(url);
      },

      exportDataAsCsv: (dataType) => {
        const state = get();
        const csvString = convertToCsv(state, dataType);
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `proactive-planner-${dataType}-${getTodayDateString()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      },
      
      importData: (jsonString) => {
        try {
          const data = JSON.parse(jsonString);
          // Basic validation
          if (data.plan && data.goals && data.logs) {
            set({
              plan: data.plan,
              logs: data.logs,
              goals: data.goals,
              projects: data.projects || [],
              routine: data.routine || [],
              unplannedTasks: data.unplannedTasks || [],
              reflections: data.reflections || [],
              performanceHistory: data.performanceHistory || [],
              streak: data.streak || { current: 0, longest: 0, lastActivityDate: null },
              unlockedAchievements: data.unlockedAchievements || [],
            });
          } else {
            throw new Error('Invalid data structure');
          }
        } catch (error) {
          console.error('Failed to import data:', error);
          alert('Failed to import data. Please make sure the file is a valid export.');
        }
      }
    }),
    {
      name: STORAGE_KEYS.APP_STATE,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
