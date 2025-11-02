export type Task = {
  id: string; // This will be a UUID from the DB
  text: string;
  completed: boolean;
  goal_id: string | null;
  position: number;
};

export type TodaysPlan = {
  date: string;
  tasks: Task[];
};

export type LogEntry = {
  id: string; // This will be a UUID from the DB
  task: string;
  duration: number; // in seconds
  timestamp: string; // ISO string from the DB
  dateString?: string; // This can be derived client-side
};

export type GoalCategory = 'Short Term' | 'Long Term';

export type Goal = {
  id: string;
  text: string;
  category: GoalCategory;
  completed: boolean;
  deadline: string | null;
};

export type ActiveTask = {
  id: string; // The ID of the plan task or routine task
  type: 'plan' | 'routine'; // The type of task
  task: string;
  remainingSeconds: number;
  isPaused: boolean;
  totalDuration: number; // The original duration set for the timer
};

export type Reflection = {
  date: string;
  well: string;
  improve: string;
};

export type Theme = 'light' | 'dark';

export type RoutineTask = {
  id: string; // This will be a UUID from the DB
  text: string;
  completed: boolean; // Note: This state is client-side only and resets daily
  goal_id: string | null;
  position: number;
};

export type PerformanceRecord = {
  date: string;
  score: number; // Percentage
};