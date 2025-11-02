import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Plus, Trash2, Play, Check, X, GripVertical, Flag, Tag } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Task, TaskPriority } from '../types';

const priorityMap: { [key in TaskPriority]: { color: string, label: string } } = {
    high: { color: 'border-red-500', label: 'High' },
    medium: { color: 'border-yellow-500', label: 'Medium' },
    low: { color: 'border-blue-500', label: 'Low' },
    none: { color: 'border-transparent', label: 'None' },
};

const TodaysPlan: React.FC = () => {
  const [newTaskText, setNewTaskText] = useState('');
  const [newGoalId, setNewGoalId] = useState<string | null>(null);
  const [newPriority, setNewPriority] = useState<TaskPriority>('none');
  const [newTags, setNewTags] = useState('');
  const [timerSetupTaskId, setTimerSetupTaskId] = useState<string | null>(null);
  const [timerDuration, setTimerDuration] = useState('60');
  
  const tasks = useAppStore((state) => state.plan.tasks);
  const goals = useAppStore((state) => state.goals);
  const { addTask, deleteTask, toggleTask, startTimer, reorderTasks } = useAppStore();

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      const tagsArray = newTags.split(',').map(t => t.trim()).filter(Boolean);
      addTask(newTaskText.trim(), newGoalId, newPriority, tagsArray);
      setNewTaskText('');
      setNewGoalId(null);
      setNewPriority('none');
      setNewTags('');
    }
  };
  
  const handleStartTimerSetup = (taskId: string) => {
    setTimerSetupTaskId(taskId);
    setTimerDuration('60'); // Reset to default when opening
  };

  const handleCancelTimerSetup = () => {
    setTimerSetupTaskId(null);
  };

  const handleConfirmStartTimer = (task: Task) => {
    const duration = parseInt(timerDuration, 10);
    if (!isNaN(duration) && duration > 0) {
      startTimer(task.id, 'plan', task.text, duration);
      setTimerSetupTaskId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Planned Tasks for Today</h2>
      <form onSubmit={handleAddTask} className="flex flex-col gap-2 mb-4">
        <div className="flex gap-2">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Add a new task..."
              className="flex-grow bg-slate-100 dark:bg-slate-700 border-transparent focus:ring-2 focus:ring-calm-blue-500 focus:border-transparent rounded-lg px-4 py-2 text-slate-800 dark:text-slate-200 transition"
            />
            <button
              type="submit"
              className="bg-calm-blue-500 hover:bg-calm-blue-600 text-white font-semibold p-2 rounded-lg flex items-center justify-center aspect-square transition"
              aria-label="Add Task"
            >
              <Plus size={20} />
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <select
                value={newGoalId || ''}
                onChange={(e) => setNewGoalId(e.target.value || null)}
                className="w-full bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-300 border-transparent focus:ring-2 focus:ring-calm-blue-500 focus:border-transparent"
            >
                <option value="">No associated goal</option>
                {goals.filter(g => !g.completed && !g.archived).map(goal => (
                <option key={goal.id} value={goal.id}>🎯 {goal.text}</option>
                ))}
            </select>
            <div className="flex gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2 text-sm items-center">
                <Flag size={14} className="text-slate-500" />
                 <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full bg-transparent text-slate-600 dark:text-slate-300 border-none focus:ring-0"
                >
                    <option value="none">No Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>
            </div>
        </div>
         <div className="flex gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2 text-sm items-center">
            <Tag size={14} className="text-slate-500" />
            <input 
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="Tags (comma-separated)"
                className="w-full bg-transparent text-slate-600 dark:text-slate-300 border-none focus:ring-0 p-0 h-auto"
            />
        </div>
      </form>
      <Reorder.Group as="ul" axis="y" values={tasks} onReorder={reorderTasks} className="space-y-2">
        <AnimatePresence>
          {tasks.map((task) => {
            const linkedGoal = task.goalId ? goals.find(g => g.id === task.goalId) : null;
            return (
              <Reorder.Item
                key={task.id}
                value={task}
                as="li"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                className={`flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-grab active:cursor-grabbing border-l-4 ${priorityMap[task.priority].color}`}
              >
                <GripVertical size={18} className="text-slate-400 flex-shrink-0" />
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                    task.completed
                      ? 'bg-calm-green-500 border-calm-green-500'
                      : 'border-slate-300 dark:border-slate-500 hover:border-calm-blue-400'
                  }`}
                  aria-label={task.completed ? 'Mark task as incomplete' : 'Mark task as complete'}
                >
                  <AnimatePresence>
                    {task.completed && (
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      >
                        <Check size={16} className="text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
                <div className={`flex-grow text-slate-700 dark:text-slate-300 ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                  <p>{task.text}</p>
                   <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {linkedGoal && (
                        <span className="text-xs bg-calm-blue-100 text-calm-blue-800 dark:bg-calm-blue-900 dark:text-calm-blue-200 px-2 py-0.5 rounded-full">
                          🎯 {linkedGoal.text}
                        </span>
                      )}
                      {task.tags.map(tag => (
                          <span key={tag} className="text-xs bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                              # {tag}
                          </span>
                      ))}
                  </div>
                </div>

                {timerSetupTaskId === task.id ? (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleConfirmStartTimer(task);
                    }}
                    className="flex items-center gap-1"
                  >
                      <input
                          type="number"
                          min="1"
                          value={timerDuration}
                          onChange={(e) => setTimerDuration(e.target.value)}
                          className="w-16 bg-slate-200 dark:bg-slate-600 rounded-md px-2 py-1 text-sm text-center focus:ring-2 focus:ring-calm-blue-500 focus:outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                  handleCancelTimerSetup();
                              }
                          }}
                      />
                      <span className="text-xs text-slate-500 dark:text-slate-400">min</span>
                      <button 
                          type="submit"
                          className="text-calm-green-500 hover:text-calm-green-600 p-1"
                          aria-label="Confirm start timer"
                      >
                          <Check size={18} />
                      </button>
                      <button
                          type="button"
                          onClick={handleCancelTimerSetup}
                          className="text-slate-400 hover:text-slate-600 p-1"
                          aria-label="Cancel timer setup"
                      >
                          <X size={18} />
                      </button>
                  </form>
                ) : (
                  <button
                    onClick={() => handleStartTimerSetup(task.id)}
                    className="text-slate-400 hover:text-calm-blue-500 dark:hover:text-calm-blue-400 transition-colors p-1"
                    aria-label="Start Timer for this task"
                  >
                    <Play size={18} />
                  </button>
                )}
                
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                  aria-label="Delete Task"
                >
                  <Trash2 size={18} />
                </button>
              </Reorder.Item>
            )
          })}
        </AnimatePresence>
      </Reorder.Group>
        {tasks.length === 0 && (
          <p className="text-center text-slate-500 dark:text-slate-400 py-4">No tasks yet. Add one to get started!</p>
        )}
    </div>
  );
};

export default TodaysPlan;
