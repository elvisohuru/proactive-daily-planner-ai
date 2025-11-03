import React from 'react';

export type TaskPriority = 'high' | 'medium' | 'low' | 'none';

export type WeeklySubGoal = {
  id: string;
  text: string;
  completed: boolean;
  dependsOn?: string[];
  linkedTaskId?: string | null;
};

export type WeeklyGoal = {
  id: string;
  text: string;
  completed: boolean;
  subGoals: WeeklySubGoal[];
  dependsOn?: string[];
};

export type WeeklyPlan = {
  weekStartDate: string; // YYYY-MM-DD of Monday
  goals: WeeklyGoal[];
};

export type Task = {
  id: string;
  text: string;
  completed: boolean;
  goalId: string | null;
  priority: TaskPriority;
  tags: string[];
  dependsOn?: string[];
  isBonus?: boolean;
  originProjectId?: string;
  originSubTaskId?: string;
  originGoalId?: string;
  originSubGoalId?: string;
  weeklyGoalId?: string | null;
  originWeeklyGoalId?: string;
  originWeeklySubGoalId?: string;
  taskType?: 'task' | 'review';
};

export type UnplannedTask = {
  id: string;
  text: string;
  createdAt: number;
};

export type TodaysPlan = {
  date: string;
  tasks: Task[];
};

export type LogEntry = {
  id: string;
  task: string;
  duration: number; // in seconds
  timestamp: number;
  dateString: string;
};

export type GoalCategory = 'Short Term' | 'Long Term';

export type SubGoal = {
  id: string;
  text: string;
  completed: boolean;
  dependsOn?: string[];
  linkedTaskId?: string | null;
};

export type Goal = {
  id: string;
  text: string;
  category: GoalCategory;
  completed: boolean;
  deadline: string | null;
  archived: boolean;
  subGoals: SubGoal[];
  reviewFrequency?: 'weekly' | 'monthly' | 'quarterly' | null;
};

export type SubTask = {
  id: string;
  text: string;
  completed: boolean;
  dependsOn?: string[];
  linkedTaskId?: string | null;
};

export type Project = {
  id: string;
  text: string;
  completed: boolean;
  subTasks: SubTask[];
  deadline: string | null;
  archived: boolean;
  reviewFrequency?: 'weekly' | 'monthly' | 'quarterly' | null;
};

export type ActiveTask = {
  id: string; // The ID of the plan task or routine task
  type: 'plan' | 'routine';
  task: string;
  remainingSeconds: number;
  totalDuration: number;
  isPaused: boolean;
};

export type Reflection = {
  date: string;
  well: string;
  improve: string;
};

export type Theme = 'light' | 'dark';

export type RoutineTask = {
  id:string;
  text: string;
  completed: boolean;
  goalId: string | null;
  recurringDays: number[];
  dependsOn?: string[];
};

export type PerformanceRecord = {
  date: string;
  score: number;
};

export type Streak = {
  current: number;
  longest: number;
  lastActivityDate: string | null;
};

export type ShutdownState = {
  isOpen: boolean;
  step: 'review' | 'reflect' | null;
  unfinishedTasks: Task[];
};

export type AchievementDefinition = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  condition: (state: any) => boolean;
};

export type IdleTimeEntry = {
  id: string;
  timestamp: number;
  description: string;
  tag: 'Productive' | 'Unproductive';
  duration: number; // in seconds
};

export type IdleState = {
  status: 'detecting' | 'tracking_idle' | 'review_pending';
  seconds: number;
} | null;

export type InboxItem = {
  id: string;
  text: string;
  createdAt: number;
};

export type AppView = 'dashboard' | 'goals' | 'reports' | 'insights' | 'inbox' | 'calendar';

export type DashboardLayout = string[];

// The main state structure
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
  weeklyPlan: WeeklyPlan;
  // New state for hourly review
  dayStartTime: number | null;
  idleTimeLogs: IdleTimeEntry[];
  isIdleReviewModalOpen: boolean;
  idleState: IdleState;

  // New state for navigation
  activeView: AppView;
  isSidebarCollapsed: boolean;

  // New state for Inbox
  inbox: InboxItem[];
  processingInboxItem: InboxItem | null;
  
  // Dashboard layout
  dashboardItems: DashboardLayout;
  isDashboardInReorderMode: boolean;
  
  // Onboarding
  hasCompletedOnboarding: boolean;

  // Actions
  initialize: () => void;
  startDay: () => void;
  addTask: (text: string, goalId: string | null, priority: TaskPriority, tags: string[], isBonus?: boolean, weeklyGoalId?: string | null) => Task;
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
  addGoal: (text: string, category: GoalCategory, deadline: string | null, reviewFrequency: Goal['reviewFrequency']) => void;
  toggleGoal: (id: string) => void;
  archiveGoal: (id: string) => void;
  restoreGoal: (id: string) => void;
  permanentlyDeleteGoal: (id: string) => void;
  updateGoal: (id: string, updates: Partial<Pick<Goal, 'text' | 'deadline' | 'reviewFrequency'>>) => void;
  addSubGoal: (goalId: string, text: string) => void;
  toggleSubGoal: (goalId: string, subGoalId: string) => void;
  deleteSubGoal: (goalId: string, subGoalId: string) => void;
  updateSubGoal: (goalId: string, subGoalId: string, updates: Partial<Pick<SubGoal, 'dependsOn'>>) => void;
  sendSubGoalToPlan: (goalId: string, subGoalId: string) => void;
  addProject: (text: string, deadline: string | null, reviewFrequency: Project['reviewFrequency']) => void;
  archiveProject: (id: string) => void;
  restoreProject: (id: string) => void;
  permanentlyDeleteProject: (id: string) => void;
  updateProject: (id: string, updates: Partial<Pick<Project, 'text' | 'deadline' | 'reviewFrequency'>>) => void;
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
  exportDataAsCsv: (dataType: 'tasks' | 'goals' | 'routine' | 'logs' | 'projects' | 'weekly' | 'inbox') => void;
  importData: (jsonString: string) => void;

  // New Actions for hourly review
  logIdleTimeEntry: (entry: Omit<IdleTimeEntry, 'id' | 'timestamp'>) => void;
  openIdleReviewModal: () => void;
  closeIdleReviewModal: () => void;
  setIdleState: (state: IdleState) => void;

  // Actions for weekly goals
  setWeeklyGoals: (goals: string[]) => void;
  toggleWeeklyGoal: (id: string) => void;
  updateWeeklyGoal: (id: string, updates: Partial<Pick<WeeklyGoal, 'text' | 'dependsOn'>>) => void;
  addWeeklySubGoal: (goalId: string, text: string) => void;
  toggleWeeklySubGoal: (goalId: string, subGoalId: string) => void;
  deleteWeeklySubGoal: (goalId: string, subGoalId: string) => void;
  updateWeeklySubGoal: (goalId: string, subGoalId: string, updates: Partial<Pick<WeeklySubGoal, 'dependsOn'>>) => void;
  sendWeeklySubGoalToPlan: (goalId: string, subGoalId: string) => void;

  // Actions for navigation
  setActiveView: (view: AppView) => void;
  toggleSidebar: () => void;

  // Actions for Inbox
  addInboxItem: (text: string) => void;
  deleteInboxItem: (id: string) => void;
  setProcessingInboxItem: (item: InboxItem | null) => void;
  processInboxItem: (
    itemId: string,
    action: 'to_task' | 'to_subgoal' | 'to_subtask' | 'to_goal' | 'to_project',
    details: {
      parentId?: string;
      parentType?: 'weekly_goal' | 'goal' | 'project';
      goalCategory?: GoalCategory;
      deadline?: string | null;
      reviewFrequency?: Goal['reviewFrequency'];
    }
  ) => void;
  
  // Action for dashboard layout
  setDashboardItems: (newItems: DashboardLayout) => void;
  setDashboardReorderMode: (isInReorderMode: boolean) => void;
  
  // Action for onboarding
  completeOnboarding: () => void;
}