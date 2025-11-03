import { Award, Star, Zap, Target as TargetIcon, Calendar, TrendingUp, Sparkles, ClipboardCheck, BookHeart, Gem, FolderCheck, Clock, Link as LinkIcon, BrainCircuit, Sunrise, Sunset } from 'lucide-react';
import React from 'react';
import { getTodayDateString } from './dateUtils';
// Fix: Import AppState from '../types' instead of '../store/useAppStore'
import { AchievementDefinition, AppState } from '../types';
import { parseISO } from 'date-fns';

export const achievementsList: AchievementDefinition[] = [
  {
    id: 'FIRST_TASK',
    name: 'First Step',
    description: 'Complete your very first task.',
    icon: React.createElement(Star, { size: 24, className: "text-yellow-400" }),
    condition: (state: AppState) => (state.plan.tasks.some(t => t.completed) || state.routine.some(t => t.completed)),
  },
  {
    id: 'PLANNER_PRO',
    name: 'Planner Pro',
    description: 'Add 10 or more tasks to a single day\'s plan.',
    icon: React.createElement(Calendar, { size: 24, className: "text-purple-500" }),
    condition: (state: AppState) => state.plan.tasks.length >= 10,
  },
   {
    id: 'STRATEGIST',
    name: 'Strategist',
    description: 'Plan a task from a goal or project.',
    icon: React.createElement(BrainCircuit, { size: 24, className: "text-cyan-400" }),
    condition: (state: AppState) => state.plan.tasks.some(t => t.originGoalId || t.originProjectId),
  },
  {
    id: 'MASTER_LINKER',
    name: 'Master Linker',
    description: 'Link two items with a dependency.',
    icon: React.createElement(LinkIcon, { size: 24, className: "text-gray-500" }),
    condition: (state: AppState) => 
      state.plan.tasks.some(t => t.dependsOn && t.dependsOn.length > 0) || 
      state.routine.some(r => r.dependsOn && r.dependsOn.length > 0) || 
      state.projects.some(p => p.subTasks.some(st => st.dependsOn && st.dependsOn.length > 0)) ||
      state.goals.some(g => g.subGoals.some(sg => sg.dependsOn && sg.dependsOn.length > 0)),
  },
  {
    id: 'PERFECT_DAY',
    name: 'Perfectionist',
    description: 'Achieve a 100% productivity score for a day.',
    icon: React.createElement(Award, { size: 24, className: "text-calm-blue-500" }),
    condition: (state: AppState) => state.performanceHistory.some(p => p.score === 100),
  },
  {
    id: 'OVERACHIEVER',
    name: 'Overachiever',
    description: 'Go above and beyond with a score over 100%.',
    icon: React.createElement(Sparkles, { size: 24, className: "text-pink-400" }),
    condition: (state: AppState) => state.performanceHistory.some(p => p.score > 100),
  },
  {
    id: 'ROUTINE_MASTER',
    name: 'Routine Master',
    description: 'Complete all of your scheduled routines for a day.',
    icon: React.createElement(ClipboardCheck, { size: 24, className: "text-indigo-500" }),
    condition: (state: AppState) => {
      // When this runs during `initialize`, `plan.date` is yesterday's date.
      const yesterdayDate = parseISO(state.plan.date);
      const yesterdaysRoutines = state.routine.filter(r => r.recurringDays.length === 0 || r.recurringDays.includes(yesterdayDate.getDay()));
      if (yesterdaysRoutines.length === 0) return false;
      return yesterdaysRoutines.every(r => r.completed);
    },
  },
  {
    id: 'STREAK_7',
    name: 'On a Roll',
    description: 'Maintain a 7-day productivity streak.',
    icon: React.createElement(TrendingUp, { size: 24, className: "text-calm-green-500" }),
    condition: (state: AppState) => state.streak.current >= 7,
  },
   {
    id: 'STREAK_30',
    name: 'Iron Will',
    description: 'Maintain a 30-day productivity streak.',
    icon: React.createElement(Gem, { size: 24, className: "text-teal-400" }),
    condition: (state: AppState) => state.streak.current >= 30,
  },
  {
    id: 'GOAL_DIGGER',
    name: 'Goal Digger',
    description: 'Complete your first goal.',
    icon: React.createElement(TargetIcon, { size: 24, className: "text-red-500" }),
    condition: (state: AppState) => state.goals.some(g => g.completed),
  },
  {
    id: 'PROJECT_FINISHER',
    name: 'Project Finisher',
    description: 'Complete your first project.',
    icon: React.createElement(FolderCheck, { size: 24, className: "text-lime-500" }),
    condition: (state: AppState) => state.projects.some(p => p.completed),
  },
  {
    id: 'FOCUSED_5',
    name: 'Deep Focus',
    description: 'Log 5 hours of focused work in a single day.',
    icon: React.createElement(Zap, { size: 24, className: "text-orange-500" }),
    condition: (state: AppState) => {
      const today = getTodayDateString();
      const totalSeconds = state.logs
        .filter(log => log.dateString === today)
        .reduce((sum, log) => sum + log.duration, 0);
      return totalSeconds >= 5 * 3600;
    },
  },
   {
    id: 'FOCUSED_HOUR',
    name: 'Focused Hour',
    description: 'Log a focus session of 60 minutes or more.',
    icon: React.createElement(Clock, { size: 24, className: "text-sky-500" }),
    condition: (state: AppState) => state.logs.some(l => l.duration >= 3600),
  },
   {
    id: 'EARLY_BIRD',
    name: 'Early Bird',
    description: 'Complete a task before 9 AM.',
    icon: React.createElement(Sunrise, { size: 24, className: "text-amber-500" }),
    condition: (state: AppState) => state.logs.some(l => new Date(l.timestamp).getHours() < 9),
  },
  {
    id: 'NIGHT_OWL',
    name: 'Night Owl',
    description: 'Complete a task after 9 PM.',
    icon: React.createElement(Sunset, { size: 24, className: "text-orange-600" }),
    condition: (state: AppState) => state.logs.some(l => new Date(l.timestamp).getHours() >= 21),
  },
  {
    id: 'FIRST_REFLECTION',
    name: 'Reflective Mind',
    description: 'Write your first daily reflection.',
    icon: React.createElement(BookHeart, { size: 24, className: "text-rose-500" }),
    condition: (state: AppState) => state.reflections.length > 0,
  },
];
