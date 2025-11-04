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
  AppState,
  IdleTimeEntry,
  IdleState,
  WeeklyPlan,
  WeeklyGoal,
  WeeklySubGoal,
  AppView,
  InboxItem,
  DashboardLayout,
  UnplannedTask as UnplannedTaskType,
  Toast,
  WeeklyReviewState,
} from '../types';
import { STORAGE_KEYS } from '../constants';
import { differenceInCalendarDays, parseISO, startOfWeek, format, isSunday, isFirstDayOfMonth, getMonth, getDate } from 'date-fns';
import { achievementsList } from '../utils/achievements';
import { exportStateToMarkdown, convertToCsv } from '../utils/exportUtils';


const getTodaysScheduledRoutineTasks = (routine: RoutineTask[], date: Date): RoutineTask[] => {
    const todayIndex = date.getDay();
    return routine.filter(r => r.recurringDays.length === 0 || r.recurringDays.includes(todayIndex));
};

export const defaultDashboardLayout: DashboardLayout = [
  'ProductivityScore',
  'ProductivityStreak',
  'StartDay',
  'WeeklyGoals',
  'DailyRoutine',
  'TodaysPlan',
  'UnplannedTasks',
  'ReflectionTrigger'
];

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
      weeklyPlan: { weekStartDate: '', goals: [] },
      lastWeekPlan: null,

      // Hourly Review State
      dayStartTime: null,
      idleTimeLogs: [],
      isIdleReviewModalOpen: false,
      idleState: null,

      // Navigation State
      activeView: 'dashboard',
      isSidebarCollapsed: false,

      // Inbox State
      inbox: [],
      processingInboxItem: null,
      
      // Dashboard Layout
      dashboardItems: defaultDashboardLayout,
      isDashboardInReorderMode: false,
      isTodaysPlanInReorderMode: false,
      isRoutineInReorderMode: false,
      
      // Day transition
      tasksToCarryOver: null,
      
      // Plan for tomorrow
      tomorrowsPlan: [],

      // Toasts
      toasts: [],
      
      // Weekly Review
      weeklyReviewState: { isOpen: false, step: null, lastWeekGoals: [] },


      // Actions
      initialize: () => {
        const today = new Date();
        const todayString = getTodayDateString();
        const { plan, routine, performanceHistory, streak, checkAchievements, weeklyPlan, goals, projects, tomorrowsPlan } = get();

        // Migration for dashboard layout for existing users
        const state = get();
        if ((state as any).dashboardLayout) {
          const oldLayout = (state as any).dashboardLayout;
          if (oldLayout.left && oldLayout.right) {
            const newItems = [...oldLayout.left, ...oldLayout.right];
            const defaultItems = new Set(defaultDashboardLayout);
            const currentItems = new Set(newItems);
            // Add any missing new components
            defaultItems.forEach(item => {
              if (!currentItems.has(item)) {
                newItems.push(item);
              }
            });
            set({ dashboardItems: newItems, dashboardLayout: undefined } as any);
          }
        } else if (!state.dashboardItems) {
            set({ dashboardItems: defaultDashboardLayout });
        }


        // Weekly reset logic
        const startOfThisWeek = startOfWeek(today, { weekStartsOn: 0 }); // Sunday
        const startOfThisWeekString = format(startOfThisWeek, 'yyyy-MM-dd');
        
        if (weeklyPlan.weekStartDate && weeklyPlan.weekStartDate !== startOfThisWeekString) {
          set(state => ({ 
            lastWeekPlan: state.weeklyPlan,
            weeklyPlan: { weekStartDate: startOfThisWeekString, goals: [] }
          }));
        } else if (!weeklyPlan.weekStartDate) {
          set({ weeklyPlan: { weekStartDate: startOfThisWeekString, goals: [] } });
        }
        
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

          const unfinishedTasks = plan.tasks.filter(t => !t.completed);

          // Generate review tasks for today
          const reviewTasks: Task[] = [];
          const checkFrequency = (item: Goal | Project, date: Date) => {
            if (item.completed || item.archived) return false;
            switch (item.reviewFrequency) {
              case 'weekly':
                return isSunday(date);
              case 'monthly':
                return isFirstDayOfMonth(date);
              case 'quarterly':
                const month = getMonth(date); // 0-indexed
                const dayOfMonth = getDate(date);
                return dayOfMonth === 1 && (month === 0 || month === 3 || month === 6 || month === 9);
              default:
                return false;
            }
          };

          goals.forEach(goal => {
            if (checkFrequency(goal, today)) {
              reviewTasks.push({
                id: uuidv4(), text: `Review Goal: "${goal.text}"`, completed: false,
                goalId: null, priority: 'medium', tags: ['review'], taskType: 'review',
              });
            }
          });
          projects.forEach(project => {
            if (checkFrequency(project, today)) {
              reviewTasks.push({
                id: uuidv4(), text: `Review Project: "${project.text}"`, completed: false,
                goalId: null, priority: 'medium', tags: ['review'], taskType: 'review',
              });
            }
          });

          set({
            plan: { date: todayString, tasks: [...reviewTasks, ...tomorrowsPlan] },
            activeTask: null,
            routine: get().routine.map(task => ({ ...task, completed: false })),
            isDayStarted: false,
            // Reset hourly review state
            dayStartTime: null,
            idleTimeLogs: [],
            idleState: null,
            isIdleReviewModalOpen: false,
            // Set tasks to be carried over, which will trigger the modal
            tasksToCarryOver: unfinishedTasks.length > 0 ? unfinishedTasks : null,
            tomorrowsPlan: [],
          });
        }
      },

      startDay: () => {
        set({ isDayStarted: true, dayStartTime: Date.now() });
      },

      addTask: (text, goalId, priority, tags, isBonus = false, weeklyGoalId = null) => {
        const newTask: Task = { id: uuidv4(), text, completed: false, goalId, priority, tags, dependsOn: [], isBonus, weeklyGoalId, taskType: 'task' };
        set((state) => ({
          plan: { ...state.plan, tasks: [...state.plan.tasks, newTask] },
        }));
        get().checkAchievements();
        get().addToast({ message: 'Task added to plan.', type: 'success' });
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
              // Sync with Weekly Sub-goal
              if (toggledTask.originWeeklyGoalId && toggledTask.originWeeklySubGoalId) {
                const { originWeeklyGoalId, originWeeklySubGoalId } = toggledTask;
                state.weeklyPlan.goals = state.weeklyPlan.goals.map(g => {
                    if (g.id === originWeeklyGoalId) {
                        const updatedSubGoals = g.subGoals.map(sg => 
                            sg.id === originWeeklySubGoalId ? { ...sg, completed: isNowCompleted } : sg
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
            weeklyPlan: { ...state.weeklyPlan, goals: [...state.weeklyPlan.goals] }
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
          // Unlink from weekly sub-goal
          weeklyPlan: taskToDelete?.originWeeklySubGoalId ? {
            ...state.weeklyPlan,
            goals: state.weeklyPlan.goals.map(g => ({
              ...g,
              subGoals: g.subGoals.map(sg => sg.id === taskToDelete.originWeeklySubGoalId ? { ...sg, linkedTaskId: null } : sg)
            }))
          } : state.weeklyPlan,
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

      addGoal: (text, category, deadline, reviewFrequency) => {
        const newGoal: Goal = {
          id: uuidv4(),
          text,
          category,
          deadline,
          completed: false,
          archived: false,
          subGoals: [],
          reviewFrequency,
        };
        set((state) => ({ goals: [...state.goals, newGoal] }));
        get().addToast({ message: 'Goal created.', type: 'success' });
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

      updateGoal: (id, updates) => {
        set(state => ({
          goals: state.goals.map(g => g.id === id ? { ...g, ...updates } : g)
        }));
      },

      addSubGoal: (goalId, text) => {
        const newSubGoal: SubGoal = { id: uuidv4(), text, completed: false, dependsOn: [], linkedTaskId: null };
        set(state => ({
            goals: state.goals.map(g => 
                g.id === goalId ? { ...g, subGoals: [...g.subGoals, newSubGoal], completed: false } : g
            )
        }));
        get().addToast({ message: 'Sub-goal added.', type: 'success' });
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
            const newTask = addTask(subGoal.text, goal.id, 'none', ['goal'], false, null);
            set(state => ({
                goals: state.goals.map(g => 
                    g.id === goalId ? { ...g, subGoals: g.subGoals.map(sg => sg.id === subGoalId ? { ...sg, linkedTaskId: newTask.id } : sg) } : g
                ),
                plan: {
                    ...state.plan,
                    tasks: state.plan.tasks.map(t => t.id === newTask.id ? { ...t, originGoalId: goalId, originSubGoalId: subGoalId } : t)
                }
            }));
            get().addToast({ message: 'Sub-goal sent to plan.', type: 'success' });
        }
      },

      addProject: (text, deadline, reviewFrequency) => {
        const newProject: Project = { id: uuidv4(), text, completed: false, deadline, archived: false, subTasks: [], reviewFrequency };
        set(state => ({ projects: [...state.projects, newProject] }));
        get().addToast({ message: 'Project created.', type: 'success' });
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

      updateProject: (id, updates) => {
        set(state => ({
          projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p)
        }));
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
        get().addToast({ message: 'Sub-task added.', type: 'success' });
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
            const newTask = addTask(subTask.text, null, 'none', ['project'], false, null);
            set(state => ({
                projects: state.projects.map(p => 
                    p.id === projectId ? { ...p, subTasks: p.subTasks.map(st => st.id === subTaskId ? { ...st, linkedTaskId: newTask.id } : st) } : p
                ),
                plan: {
                    ...state.plan,
                    tasks: state.plan.tasks.map(t => t.id === newTask.id ? { ...t, originProjectId: projectId, originSubTaskId: subTaskId } : t)
                }
            }));
            get().addToast({ message: 'Sub-task sent to plan.', type: 'success' });
        }
      },

      addRoutineTask: (text, goalId, recurringDays) => {
        const newRoutineTask: RoutineTask = { id: uuidv4(), text, completed: false, goalId, recurringDays, dependsOn: [] };
        set((state) => ({
          routine: [...state.routine, newRoutineTask],
        }));
        get().addToast({ message: 'Routine task added.', type: 'success' });
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
        const { unplannedTasks, addTask, isDayStarted, addInboxItem } = get();
        const taskToPlan = unplannedTasks.find(t => t.id === id);
        if(taskToPlan) {
            if (isDayStarted) {
                addInboxItem(taskToPlan.text);
            } else {
                addTask(taskToPlan.text, null, 'none', [], isDayStarted, null);
            }
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
        get().addToast({ message: 'Reflection saved.', type: 'success' });
        get().setShutdownStep('plan_next');
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
            set({ shutdownState: { isOpen: true, step: 'plan_next', unfinishedTasks: [] } });
        }
      },

      processUnfinishedTasks: () => {
          const { shutdownState, plan } = get();
          const newUnplannedTasks = shutdownState.unfinishedTasks.map(t => ({ id: uuidv4(), text: t.text, createdAt: Date.now() }));
          
          set(state => ({
              unplannedTasks: [...newUnplannedTasks, ...state.unplannedTasks],
              plan: { ...plan, tasks: plan.tasks.filter(t => t.completed) },
              shutdownState: { ...state.shutdownState, step: 'reflect' }
          }));
          get().addToast({ message: `${newUnplannedTasks.length} tasks moved to unplanned.`, type: 'info' });
      },
      
      setShutdownStep: (step) => {
        set(state => ({ shutdownState: { ...state.shutdownState, step } }));
      },

      closeShutdownRoutine: () => {
        const { shutdownState, tomorrowsPlan } = get();
        if (shutdownState.step === 'plan_next' && tomorrowsPlan.length > 0) {
            const newInboxItems: InboxItem[] = tomorrowsPlan.map(task => ({
                id: uuidv4(),
                text: task.text,
                createdAt: Date.now(),
            }));

            set(state => ({
                inbox: [...newInboxItems, ...state.inbox],
                tomorrowsPlan: [],
                shutdownState: { isOpen: false, step: null, unfinishedTasks: [] }
            }));
            get().addToast({ message: `${newInboxItems.length} ideas for tomorrow sent to inbox.`, type: 'success' });
        } else {
            set({ shutdownState: { isOpen: false, step: null, unfinishedTasks: [] } });
        }
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
          dayStartTime: state.dayStartTime,
          idleTimeLogs: state.idleTimeLogs,
          weeklyPlan: state.weeklyPlan,
          inbox: state.inbox,
          dashboardItems: state.dashboardItems,
          tomorrowsPlan: state.tomorrowsPlan,
        };
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `proactive-planner-export-${getTodayDateString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        get().addToast({ message: 'Data exported as JSON.', type: 'success' });
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
        get().addToast({ message: 'Data exported as Markdown.', type: 'success' });
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
        get().addToast({ message: `${dataType} data exported as CSV.`, type: 'success' });
      },
      
      importData: (jsonString) => {
        try {
          const data = JSON.parse(jsonString);
          // Basic validation
          if (data.plan && data.goals && data.logs) {
            let dashboardItems = defaultDashboardLayout;
            if(data.dashboardItems) {
              dashboardItems = data.dashboardItems
            } else if (data.dashboardLayout) {
               dashboardItems = [...(data.dashboardLayout.left || []), ...(data.dashboardLayout.right || [])];
            }
             // Add any missing new components for older imports
            const currentItems = new Set(dashboardItems);
            defaultDashboardLayout.forEach(item => {
              if (!currentItems.has(item)) {
                dashboardItems.push(item);
              }
            });

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
              dayStartTime: data.dayStartTime || null,
              idleTimeLogs: data.idleTimeLogs || [],
              weeklyPlan: data.weeklyPlan || { weekStartDate: '', goals: [] },
              inbox: data.inbox || [],
              dashboardItems: dashboardItems,
              isDashboardInReorderMode: false, // Always reset this on import
              tomorrowsPlan: data.tomorrowsPlan || [],
            });
            get().addToast({ message: 'Data imported successfully.', type: 'success' });
          } else {
            throw new Error('Invalid data structure');
          }
        } catch (error) {
          console.error('Failed to import data:', error);
          get().addToast({ message: 'Failed to import data.', type: 'error' });
          alert('Failed to import data. Please make sure the file is a valid export.');
        }
      },

      // Hourly Review Actions
      logIdleTimeEntry: (entry) => {
        const newEntry: IdleTimeEntry = {
          ...entry,
          id: uuidv4(),
          timestamp: Date.now(),
        };
        set(state => ({
          idleTimeLogs: [...state.idleTimeLogs, newEntry]
        }));
      },
      
      openIdleReviewModal: () => set({ isIdleReviewModalOpen: true }),
      
      closeIdleReviewModal: () => set({ isIdleReviewModalOpen: false }),

      setIdleState: (idleState: IdleState) => set({ idleState }),

      // Weekly Goal Actions
      setWeeklyGoals: (goalTexts) => {
        const newGoals: WeeklyGoal[] = goalTexts
            .map(text => text.trim())
            .filter(text => text !== '')
            .map(text => ({ id: uuidv4(), text, completed: false, subGoals: [], dependsOn: [] }));
        set(state => ({
            weeklyPlan: { ...state.weeklyPlan, goals: newGoals }
        }));
        get().addToast({ message: "This week's focus has been set.", type: 'success' });
      },
      toggleWeeklyGoal: (id) => {
        set(state => ({
            weeklyPlan: {
                ...state.weeklyPlan,
                goals: state.weeklyPlan.goals.map(g => {
                    if (g.id === id) {
                        return { ...g, completed: !g.completed }
                    }
                    const updatedGoals = state.weeklyPlan.goals.map(goal => goal.dependsOn?.includes(id) ? { ...goal } : goal);
                    return updatedGoals.find(ug => ug.id === g.id) || g;
                })
            }
        }));
        get().checkAchievements();
      },
      updateWeeklyGoal: (id, updates) => {
        set(state => ({
          weeklyPlan: {
            ...state.weeklyPlan,
            goals: state.weeklyPlan.goals.map(g => g.id === id ? { ...g, ...updates } : g)
          }
        }))
      },
      addWeeklySubGoal: (goalId, text) => {
        const newSubGoal: WeeklySubGoal = { id: uuidv4(), text, completed: false, dependsOn: [], linkedTaskId: null };
        set(state => ({
          weeklyPlan: {
            ...state.weeklyPlan,
            goals: state.weeklyPlan.goals.map(g => g.id === goalId ? { ...g, subGoals: [...g.subGoals, newSubGoal], completed: false } : g)
          }
        }));
        get().addToast({ message: 'Weekly sub-goal added.', type: 'success' });
      },
      toggleWeeklySubGoal: (goalId, subGoalId) => {
        set(state => {
          const newGoals = state.weeklyPlan.goals.map(g => {
            if (g.id === goalId) {
              let toggledSubGoal: WeeklySubGoal | undefined;
              const updatedSubGoals = g.subGoals.map(sg => {
                  if (sg.id === subGoalId) {
                      toggledSubGoal = { ...sg, completed: !sg.completed };
                      return toggledSubGoal;
                  }
                  return sg;
              });

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
          });
          return { weeklyPlan: { ...state.weeklyPlan, goals: newGoals }, plan: { ...state.plan, tasks: [...state.plan.tasks] }};
        });
        get().checkAchievements();
      },
      deleteWeeklySubGoal: (goalId, subGoalId) => {
        const subGoalToDelete = get().weeklyPlan.goals.find(g => g.id === goalId)?.subGoals.find(sg => sg.id === subGoalId);
        set(state => {
          const newGoals = state.weeklyPlan.goals.map(g => {
            if (g.id === goalId) {
                const updatedSubGoals = g.subGoals.filter(sg => sg.id !== subGoalId);
                const allCompleted = updatedSubGoals.length > 0 && updatedSubGoals.every(sg => sg.completed);
                return { ...g, subGoals: updatedSubGoals, completed: allCompleted };
            }
            return g;
          });
          return {
            weeklyPlan: { ...state.weeklyPlan, goals: newGoals },
            plan: {
              ...state.plan,
              tasks: subGoalToDelete?.linkedTaskId ? state.plan.tasks.map(t =>
                t.id === subGoalToDelete.linkedTaskId ? { ...t, originWeeklyGoalId: undefined, originWeeklySubGoalId: undefined } : t
              ) : state.plan.tasks
            }
          };
        });
      },
      updateWeeklySubGoal: (goalId, subGoalId, updates) => {
        set(state => ({
          weeklyPlan: {
            ...state.weeklyPlan,
            goals: state.weeklyPlan.goals.map(g => 
              g.id === goalId ? { ...g, subGoals: g.subGoals.map(sg => sg.id === subGoalId ? { ...sg, ...updates } : sg) } : g
            )
          }
        }));
      },
      sendWeeklySubGoalToPlan: (goalId, subGoalId) => {
        const { weeklyPlan, addTask } = get();
        const goal = weeklyPlan.goals.find(g => g.id === goalId);
        const subGoal = goal?.subGoals.find(sg => sg.id === subGoalId);

        if (subGoal && !subGoal.linkedTaskId) {
          const newTask = addTask(subGoal.text, null, 'none', ['weekly_goal'], false, goal.id);
          set(state => {
            const newGoals = state.weeklyPlan.goals.map(g =>
              g.id === goalId ? { ...g, subGoals: g.subGoals.map(sg => sg.id === subGoalId ? { ...sg, linkedTaskId: newTask.id } : sg) } : g
            );
            const newTasks = state.plan.tasks.map(t =>
              t.id === newTask.id ? { ...t, originWeeklyGoalId: goalId, originWeeklySubGoalId: subGoalId } : t
            );
            return {
              weeklyPlan: { ...state.weeklyPlan, goals: newGoals },
              plan: { ...state.plan, tasks: newTasks }
            };
          });
          get().addToast({ message: 'Weekly sub-goal sent to plan.', type: 'success' });
        }
      },

      // Navigation actions
      setActiveView: (view: AppView) => set({ activeView: view }),
      toggleSidebar: () => set(state => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

      // Inbox Actions
      addInboxItem: (text) => {
        const newItem: InboxItem = { id: uuidv4(), text, createdAt: Date.now() };
        set(state => ({ inbox: [newItem, ...state.inbox] }));
        get().addToast({ message: 'Idea captured in inbox.', type: 'success' });
      },
      deleteInboxItem: (id) => {
        set(state => ({ inbox: state.inbox.filter(item => item.id !== id) }));
      },
      setProcessingInboxItem: (item) => {
        set({ processingInboxItem: item });
      },
      processInboxItem: (itemId, action, details) => {
        const item = get().inbox.find(i => i.id === itemId);
        if (!item) return;

        switch (action) {
            case 'to_task':
                get().addTask(item.text, null, 'none', [], false, null);
                break;
            case 'to_subgoal':
                if (details.parentId && (details.parentType === 'goal' || details.parentType === 'weekly_goal')) {
                    if (details.parentType === 'goal') {
                      get().addSubGoal(details.parentId, item.text);
                    } else { // weekly_goal
                      get().addWeeklySubGoal(details.parentId, item.text);
                    }
                }
                break;
            case 'to_subtask':
                if (details.parentId && details.parentType === 'project') {
                    get().addSubTask(details.parentId, item.text);
                }
                break;
            case 'to_goal':
                if (details.goalCategory) {
                    get().addGoal(item.text, details.goalCategory, details.deadline || null, details.reviewFrequency || null);
                }
                break;
            case 'to_project':
                get().addProject(item.text, details.deadline || null, details.reviewFrequency || null);
                break;
        }

        get().deleteInboxItem(itemId);
        get().setProcessingInboxItem(null);
        get().addToast({ message: 'Inbox item processed.', type: 'success' });
    },
    
    // Dashboard layout action
    setDashboardItems: (newItems) => set({ dashboardItems: newItems }),
    setDashboardReorderMode: (isInReorderMode) => set({ isDashboardInReorderMode: isInReorderMode }),
    setTodaysPlanReorderMode: (isInReorderMode) => set({ isTodaysPlanInReorderMode: isInReorderMode }),
    setRoutineReorderMode: (isInReorderMode) => set({ isRoutineInReorderMode: isInReorderMode }),
    
    // Day transition actions
    processCarryOverTasks: (tasksToCarry, tasksToInbox) => {
        const newUnplanned = tasksToInbox.map((t): UnplannedTaskType => ({
            id: uuidv4(),
            text: t.text,
            createdAt: Date.now()
        }));

        set(state => ({
            plan: {
                ...state.plan,
                tasks: [...state.plan.tasks, ...tasksToCarry]
            },
            unplannedTasks: [...newUnplanned, ...state.unplannedTasks],
            tasksToCarryOver: null
        }));
    },
    clearCarryOverTasks: () => {
        set({ tasksToCarryOver: null });
    },

    // Actions for planning tomorrow
    addTomorrowsTask: (text) => {
        const newTask: Task = { id: uuidv4(), text, completed: false, goalId: null, priority: 'none', tags: [], dependsOn: [], isBonus: false, weeklyGoalId: null, taskType: 'task' };
        set((state) => ({
            tomorrowsPlan: [...state.tomorrowsPlan, newTask],
        }));
    },
    deleteTomorrowsTask: (id) => {
        set((state) => ({
            tomorrowsPlan: state.tomorrowsPlan.filter((task) => task.id !== id),
        }));
    },
    
    // Toast Actions
    addToast: (toast: Omit<Toast, 'id'>) => {
      const id = uuidv4();
      set(state => ({ toasts: [...state.toasts, { id, ...toast }] }));
      setTimeout(() => get().removeToast(id), 4000);
    },
    removeToast: (id: string) => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    },

    // Weekly Review Actions
    startWeeklyReview: () => {
      const { lastWeekPlan } = get();
      if (lastWeekPlan && lastWeekPlan.goals.length > 0) {
        set({
          weeklyReviewState: {
            isOpen: true,
            step: 'review_goals',
            lastWeekGoals: lastWeekPlan.goals,
          }
        });
      } else {
        get().addToast({ message: "No weekly plan from last week to review.", type: 'info' });
      }
    },
    setWeeklyReviewStep: (step) => {
      set(state => ({ weeklyReviewState: { ...state.weeklyReviewState, step } }));
    },
    closeWeeklyReview: () => {
      set(state => ({
        weeklyReviewState: { isOpen: false, step: null, lastWeekGoals: [] },
        lastWeekPlan: null // Consume the review for this week
      }));
    },
    }),
    {
      name: STORAGE_KEYS.APP_STATE,
      storage: createJSONStorage(() => localStorage),
    }
  )
);