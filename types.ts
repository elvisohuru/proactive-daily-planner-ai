export type Task = {
  id: string;
  text: string;
  completed: boolean;
  goalId: string | null;
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
  id: string;
  text: string;
  completed: boolean;
  goalId: string | null;
};

export type PerformanceRecord = {
  date: string;
  score: number; // Percentage
};
