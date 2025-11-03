
import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Plus, Trash2, Check, Target, Archive, RefreshCw, FolderKanban, Link2, Info, ArrowUpCircle, CircleCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { getDeadlineCountdown } from '../utils/dateUtils';
import { Goal, GoalCategory, Project, SubTask, SubGoal } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

type ActiveGoalTab = 'short' | 'long' | 'projects';

const SubGoalItem: React.FC<{
    subGoal: SubGoal;
    goalId: string;
    allSubGoals: SubGoal[];
    editingDepsFor: string | null;
    setEditingDepsFor: (id: string | null) => void;
}> = ({ subGoal, goalId, allSubGoals, editingDepsFor, setEditingDepsFor }) => {
    const { toggleSubGoal, deleteSubGoal, updateSubGoal, sendSubGoalToPlan } = useAppStore();

    const isBlocked = subGoal.dependsOn?.some(depId => !allSubGoals.find(g => g.id === depId)?.completed) ?? false;

    const handleDependencyChange = (dependencyId: string, isChecked: boolean) => {
        const currentDeps = subGoal.dependsOn || [];
        const newDeps = isChecked
            ? [...currentDeps, dependencyId]
            : currentDeps.filter(id => id !== dependencyId);
        updateSubGoal(goalId, subGoal.id, { dependsOn: newDeps });
    };

    const getBlockedByText = (): string => {
        if (!subGoal.dependsOn) return '';
        const blockingTasks = subGoal.dependsOn
            .map(depId => allSubGoals.find(t => t.id === depId && !t.completed))
            .filter(Boolean);
        if (blockingTasks.length > 0) {
            return `Blocked by: ${blockingTasks.map(t => t?.text).join(', ')}`;
        }
        return '';
    };

    return (
        <motion.li 
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -10 }}
            className={`flex items-center gap-2 pl-4 py-1 ${isBlocked || subGoal.completed ? 'opacity-60' : ''}`}
        >
            <button
                onClick={() => !isBlocked && toggleSubGoal(goalId, subGoal.id)}
                disabled={isBlocked}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                    subGoal.completed ? 'bg-calm-blue-500 border-calm-blue-500' : 'border-slate-300 dark:border-slate-500'
                } ${isBlocked ? 'cursor-not-allowed bg-slate-200 dark:bg-slate-600' : ''}`}
                 aria-label={subGoal.completed ? 'Mark sub-goal as incomplete' : 'Mark sub-goal as complete'}
            >
                {subGoal.completed && <Check size={10} className="text-white" />}
            </button>
            <div className="flex-grow">
                <span className={`text-sm ${subGoal.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'}`}>{subGoal.text}</span>
                 {isBlocked && (
                    <div className="group relative flex items-center w-fit">
                        <span className="text-xs flex items-center gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-1.5 py-0.5 rounded-full mt-0.5">
                            <Info size={10}/> Blocked
                        </span>
                         <div className="absolute bottom-full mb-1 w-max max-w-xs bg-slate-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                            {getBlockedByText()}
                        </div>
                    </div>
                )}
            </div>
            
             {subGoal.linkedTaskId ? (
                <div className="flex items-center gap-1 text-xs text-calm-green-600 dark:text-calm-green-400 p-1">
                    <CircleCheck size={14}/> <span>Planned</span>
                </div>
            ) : (
                <button onClick={() => sendSubGoalToPlan(goalId, subGoal.id)} disabled={subGoal.completed} className="text-slate-400 hover:text-calm-green-500 p-1 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Send to today's plan">
                    <ArrowUpCircle size={14} />
                </button>
            )}

            <div className="relative">
                <button 
                    onClick={() => setEditingDepsFor(editingDepsFor === subGoal.id ? null : subGoal.id)} 
                    disabled={isBlocked || subGoal.completed}
                    className="text-slate-400 hover:text-calm-blue-500 p-1 disabled:cursor-not-allowed disabled:opacity-50"
                     aria-label="Link dependencies"
                >
                    <Link2 size={14} />
                </button>
                <AnimatePresence>
                    {editingDepsFor === subGoal.id && (
                         <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute z-30 right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-2"
                        >
                            <p className="text-xs font-semibold mb-2 p-1 text-slate-800 dark:text-slate-200">Depends on:</p>
                            <ul className="max-h-32 overflow-y-auto space-y-1">
                                {allSubGoals.filter(t => t.id !== subGoal.id).map(depTask => (
                                    <li key={depTask.id}>
                                        <label className="flex items-center gap-2 text-sm p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={subGoal.dependsOn?.includes(depTask.id) ?? false} 
                                                onChange={(e) => handleDependencyChange(depTask.id, e.target.checked)} 
                                                className="rounded text-calm-blue-500 focus:ring-calm-blue-500"
                                            />
                                            <span className={depTask.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}>{depTask.text}</span>
                                        </label>
                                    </li>
                                ))}
                                {allSubGoals.length <= 1 && <p className="text-xs text-slate-400 p-1">No other sub-goals to link.</p>}
                            </ul>
                            <button onClick={() => setEditingDepsFor(null)} className="mt-2 w-full text-center text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">Close</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <button onClick={() => deleteSubGoal(goalId, subGoal.id)} disabled={subGoal.completed} className="text-slate-400 hover:text-red-500 p-1 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Delete sub-goal"><Trash2 size={14} /></button>
        </motion.li>
    );
};

const SubTaskItem: React.FC<{
  subTask: SubTask;
  projectId: string;
  allSubTasks: SubTask[];
  editingDepsFor: string | null;
  setEditingDepsFor: (id: string | null) => void;
}> = ({ subTask, projectId, allSubTasks, editingDepsFor, setEditingDepsFor }) => {
    const { toggleSubTask, deleteSubTask, updateSubTask, sendSubTaskToPlan } = useAppStore();

    const isBlocked = subTask.dependsOn?.some(depId => !allSubTasks.find(t => t.id === depId)?.completed) ?? false;

    const handleDependencyChange = (dependencyId: string, isChecked: boolean) => {
        const currentDeps = subTask.dependsOn || [];
        const newDeps = isChecked
            ? [...currentDeps, dependencyId]
            : currentDeps.filter(id => id !== dependencyId);
        updateSubTask(projectId, subTask.id, { dependsOn: newDeps });
    };

    const getBlockedByText = (): string => {
        if (!subTask.dependsOn) return '';
        const blockingTasks = subTask.dependsOn
            .map(depId => allSubTasks.find(t => t.id === depId && !t.completed))
            .filter(Boolean);
        if (blockingTasks.length > 0) {
            return `Blocked by: ${blockingTasks.map(t => t?.text).join(', ')}`;
        }
        return '';
    };

    return (
        <motion.li 
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -10 }}
            className={`flex items-center gap-2 pl-4 py-1 ${isBlocked || subTask.completed ? 'opacity-60' : ''}`}
        >
            <button
                onClick={() => !isBlocked && toggleSubTask(projectId, subTask.id)}
                disabled={isBlocked}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                    subTask.completed ? 'bg-calm-blue-500 border-calm-blue-500' : 'border-slate-300 dark:border-slate-500'
                } ${isBlocked ? 'cursor-not-allowed bg-slate-200 dark:bg-slate-600' : ''}`}
                 aria-label={subTask.completed ? 'Mark sub-task as incomplete' : 'Mark sub-task as complete'}
            >
                {subTask.completed && <Check size={10} className="text-white" />}
            </button>
            <div className="flex-grow">
                <span className={`text-sm ${subTask.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'}`}>{subTask.text}</span>
                 {isBlocked && (
                    <div className="group relative flex items-center w-fit">
                        <span className="text-xs flex items-center gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-1.5 py-0.5 rounded-full mt-0.5">
                            <Info size={10}/> Blocked
                        </span>
                         <div className="absolute bottom-full mb-1 w-max max-w-xs bg-slate-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                            {getBlockedByText()}
                        </div>
                    </div>
                )}
            </div>
            
            {subTask.linkedTaskId ? (
                <div className="flex items-center gap-1 text-xs text-calm-green-600 dark:text-calm-green-400 p-1">
                    <CircleCheck size={14}/> <span>Planned</span>
                </div>
            ) : (
                <button onClick={() => sendSubTaskToPlan(projectId, subTask.id)} disabled={subTask.completed} className="text-slate-400 hover:text-calm-green-500 p-1 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Send to today's plan">
                    <ArrowUpCircle size={14} />
                </button>
            )}

            <div className="relative">
                <button 
                    onClick={() => setEditingDepsFor(editingDepsFor === subTask.id ? null : subTask.id)} 
                    disabled={isBlocked || subTask.completed}
                    className="text-slate-400 hover:text-calm-blue-500 p-1 disabled:cursor-not-allowed disabled:opacity-50"
                     aria-label="Link dependencies"
                >
                    <Link2 size={14} />
                </button>
                <AnimatePresence>
                    {editingDepsFor === subTask.id && (
                         <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute z-30 right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-2"
                        >
                            <p className="text-xs font-semibold mb-2 p-1 text-slate-800 dark:text-slate-200">Depends on:</p>
                            <ul className="max-h-32 overflow-y-auto space-y-1">
                                {allSubTasks.filter(t => t.id !== subTask.id).map(depTask => (
                                    <li key={depTask.id}>
                                        <label className="flex items-center gap-2 text-sm p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={subTask.dependsOn?.includes(depTask.id) ?? false} 
                                                onChange={(e) => handleDependencyChange(depTask.id, e.target.checked)} 
                                                className="rounded text-calm-blue-500 focus:ring-calm-blue-500"
                                            />
                                            <span className={depTask.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}>{depTask.text}</span>
                                        </label>
                                    </li>
                                ))}
                                {allSubTasks.length <= 1 && <p className="text-xs text-slate-400 p-1">No other sub-tasks to link.</p>}
                            </ul>
                            <button onClick={() => setEditingDepsFor(null)} className="mt-2 w-full text-center text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">Close</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <button onClick={() => deleteSubTask(projectId, subTask.id)} disabled={subTask.completed} className="text-slate-400 hover:text-red-500 p-1 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Delete sub-task"><Trash2 size={14} /></button>
        </motion.li>
    );
};


const ProjectItem: React.FC<{ 
    project: Project; 
    onArchive: (id: string) => void;
    onRestore: (id: string) => void;
    onDelete: (id: string) => void;
}> = ({ project, onArchive, onRestore, onDelete }) => {
  const { addSubTask } = useAppStore();
  const [countdown, setCountdown] = useState(getDeadlineCountdown(project.deadline));
  const [newSubTaskText, setNewSubTaskText] = useState('');
  const [editingDepsFor, setEditingDepsFor] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(project.subTasks.length === 0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getDeadlineCountdown(project.deadline));
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, [project.deadline]);
  
  const handleAddSubTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubTaskText.trim()) {
      addSubTask(project.id, newSubTaskText.trim());
      setNewSubTaskText('');
    }
  };

  const completedSubTasks = project.subTasks.filter(st => st.completed).length;
  const totalSubTasks = project.subTasks.length;
  const progress = totalSubTasks > 0 ? (completedSubTasks / totalSubTasks) * 100 : (project.completed ? 100 : 0);

  return (
    <li className="flex flex-col gap-1 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
      <div className="flex items-start gap-3">
         <div className={`mt-1 flex-shrink-0 ${project.completed ? 'text-calm-green-500' : 'text-calm-blue-500'}`}><FolderKanban size={20} /></div>
         <div className="flex-grow">
            <div className="flex justify-between items-baseline">
                <p className={`font-semibold text-slate-700 dark:text-slate-300 ${project.completed || project.archived ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                    {project.text}
                </p>
                {!project.archived && <span className="text-xs font-semibold text-calm-blue-600 dark:text-calm-blue-400 ml-2">{Math.round(progress)}%</span>}
            </div>
            
            {!project.archived && (
              <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5 my-1.5">
                <motion.div 
                  className={`${project.completed ? 'bg-calm-green-500' : 'bg-calm-blue-500'} h-1.5 rounded-full`}
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            )}
            
            {project.deadline && !project.completed && !project.archived && <p className="text-xs text-slate-500 dark:text-slate-400">{countdown}</p>}
        </div>
        {project.archived ? (
            <>
                <button onClick={() => onRestore(project.id)} className="text-slate-400 hover:text-calm-blue-500 p-1 flex-shrink-0" aria-label="Restore project"><RefreshCw size={16} /></button>
                <button onClick={() => onDelete(project.id)} className="text-slate-400 hover:text-red-500 p-1 flex-shrink-0" aria-label="Permanently delete project"><Trash2 size={16} /></button>
            </>
        ) : (
            <button onClick={() => onArchive(project.id)} disabled={project.completed} className="text-slate-400 hover:text-calm-blue-500 p-1 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Archive project"><Archive size={16} /></button>
        )}
      </div>
      
      {!project.archived && !project.completed && project.subTasks.length > 0 && (
        <div className="pl-8">
            <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {isExpanded ? 'Hide sub-tasks' : `Show ${project.subTasks.length} sub-tasks`}
            </button>
        </div>
      )}

      {!project.archived && !project.completed && (
          <AnimatePresence initial={false}>
              {isExpanded && (
                  <motion.div
                      key="content"
                      initial="collapsed"
                      animate="open"
                      exit="collapsed"
                      variants={{
                          open: { opacity: 1, height: 'auto' },
                          collapsed: { opacity: 0, height: 0 }
                      }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                  >
                      <div className="pl-8 pt-2">
                          <ul className="space-y-1">
                              <AnimatePresence>
                                {project.subTasks.map(st => <SubTaskItem key={st.id} subTask={st} projectId={project.id} allSubTasks={project.subTasks} editingDepsFor={editingDepsFor} setEditingDepsFor={setEditingDepsFor} />)}
                              </AnimatePresence>
                          </ul>
                          <form onSubmit={handleAddSubTask} className="flex gap-2 mt-2">
                              <input 
                                  type="text"
                                  value={newSubTaskText}
                                  onChange={e => setNewSubTaskText(e.target.value)}
                                  placeholder="Add a sub-task..."
                                  className="flex-grow bg-slate-100 dark:bg-slate-600 rounded-md px-2 py-1 text-sm border-transparent focus:ring-1 focus:ring-calm-blue-500"
                              />
                              <button type="submit" className="text-calm-blue-500 hover:text-calm-blue-600 p-1" aria-label="Add sub-task"><Plus size={18}/></button>
                          </form>
                      </div>
                  </motion.div>
              )}
          </AnimatePresence>
      )}
    </li>
  );
};


const GoalItem: React.FC<{ 
    goal: Goal; 
    onArchive: (id: string) => void;
    onRestore: (id: string) => void;
    onDelete: (id: string) => void;
}> = ({ goal, onArchive, onRestore, onDelete }) => {
  const { addSubGoal } = useAppStore();
  const [countdown, setCountdown] = useState(getDeadlineCountdown(goal.deadline));
  const [newSubGoalText, setNewSubGoalText] = useState('');
  const [editingDepsFor, setEditingDepsFor] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(goal.subGoals.length === 0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getDeadlineCountdown(goal.deadline));
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, [goal.deadline]);
  
  const handleAddSubGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubGoalText.trim()) {
      addSubGoal(goal.id, newSubGoalText.trim());
      setNewSubGoalText('');
    }
  };

  const completedSubGoals = goal.subGoals.filter(st => st.completed).length;
  const totalSubGoals = goal.subGoals.length;
  const progress = totalSubGoals > 0 ? (completedSubGoals / totalSubGoals) * 100 : (goal.completed ? 100 : 0);

  return (
    <li className="flex flex-col gap-1 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
      <div className="flex items-start gap-3">
         <div className={`mt-1 flex-shrink-0 ${goal.completed ? 'text-calm-green-500' : 'text-calm-blue-500'}`}><Target size={20} /></div>
         <div className="flex-grow">
            <div className="flex justify-between items-baseline">
                <p className={`font-semibold text-slate-700 dark:text-slate-300 ${goal.completed || goal.archived ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                    {goal.text}
                </p>
                {!goal.archived && <span className="text-xs font-semibold text-calm-blue-600 dark:text-calm-blue-400 ml-2">{Math.round(progress)}%</span>}
            </div>
            
            {!goal.archived && (
              <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5 my-1.5">
                <motion.div 
                  className={`${goal.completed ? 'bg-calm-green-500' : 'bg-calm-blue-500'} h-1.5 rounded-full`}
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            )}
            
            {goal.deadline && !goal.completed && !goal.archived && <p className="text-xs text-slate-500 dark:text-slate-400">{countdown}</p>}
        </div>
        {goal.archived ? (
            <>
                <button onClick={() => onRestore(goal.id)} className="text-slate-400 hover:text-calm-blue-500 p-1 flex-shrink-0" aria-label="Restore goal"><RefreshCw size={16} /></button>
                <button onClick={() => onDelete(goal.id)} className="text-slate-400 hover:text-red-500 p-1 flex-shrink-0" aria-label="Permanently delete goal"><Trash2 size={16} /></button>
            </>
        ) : (
            <button onClick={() => onArchive(goal.id)} disabled={goal.completed} className="text-slate-400 hover:text-calm-blue-500 p-1 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Archive goal"><Archive size={16} /></button>
        )}
      </div>
      
      {!goal.archived && !goal.completed && goal.subGoals.length > 0 && (
        <div className="pl-8">
            <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {isExpanded ? 'Hide sub-goals' : `Show ${goal.subGoals.length} sub-goals`}
            </button>
        </div>
      )}

      {!goal.archived && !goal.completed && (
           <AnimatePresence initial={false}>
              {isExpanded && (
                  <motion.div
                      key="content"
                      initial="collapsed"
                      animate="open"
                      exit="collapsed"
                      variants={{
                          open: { opacity: 1, height: 'auto' },
                          collapsed: { opacity: 0, height: 0 }
                      }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                  >
                       <div className="pl-8 pt-2">
                          <ul className="space-y-1">
                              <AnimatePresence>
                                {goal.subGoals.map(sg => <SubGoalItem key={sg.id} subGoal={sg} goalId={goal.id} allSubGoals={goal.subGoals} editingDepsFor={editingDepsFor} setEditingDepsFor={setEditingDepsFor} />)}
                              </AnimatePresence>
                          </ul>
                          <form onSubmit={handleAddSubGoal} className="flex gap-2 mt-2">
                              <input 
                                  type="text"
                                  value={newSubGoalText}
                                  onChange={e => setNewSubGoalText(e.target.value)}
                                  placeholder="Add a sub-goal..."
                                  className="flex-grow bg-slate-100 dark:bg-slate-600 rounded-md px-2 py-1 text-sm border-transparent focus:ring-1 focus:ring-calm-blue-500"
                              />
                              <button type="submit" className="text-calm-blue-500 hover:text-calm-blue-600 p-1" aria-label="Add sub-goal"><Plus size={18}/></button>
                          </form>
                      </div>
                  </motion.div>
              )}
          </AnimatePresence>
      )}
    </li>
  );
};


const MyGoals: React.FC = () => {
  const { goals, projects, addGoal, addProject, archiveGoal, restoreGoal, permanentlyDeleteGoal, archiveProject, restoreProject, permanentlyDeleteProject, focusOnElement } = useAppStore();
  const [activeTab, setActiveTab] = useState<ActiveGoalTab>('short');
  const [newItemText, setNewItemText] = useState('');
  const [deadline, setDeadline] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  
  const newItemInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusOnElement === 'new-goal-input' && newItemInputRef.current) {
      newItemInputRef.current.focus();
    }
  }, [focusOnElement]);

  useEffect(() => {
    // When switching tabs, clear the input form
    setNewItemText('');
    setDeadline('');
  }, [activeTab]);


  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemText.trim()) {
        if (activeTab === 'projects') {
            addProject(newItemText.trim(), deadline || null);
        } else {
            const newCategory: GoalCategory = activeTab === 'short' ? 'Short Term' : 'Long Term';
            addGoal(newItemText.trim(), newCategory, deadline || null);
        }
      setNewItemText('');
      setDeadline('');
    }
  };

  const activeGoals = goals.filter(g => !g.archived);
  const archivedGoals = goals.filter(g => g.archived);
  const activeProjects = projects.filter(p => !p.archived);
  const archivedProjects = projects.filter(p => p.archived);

  const shortTermGoals = activeGoals.filter((g) => g.category === 'Short Term');
  const longTermGoals = activeGoals.filter((g) => g.category === 'Long Term');

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2"><Target size={20}/> My Goals & Projects</h2>
      </div>
      
      <div className="mb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="overflow-x-auto">
          <div className="flex whitespace-nowrap">
            {(['short', 'long', 'projects'] as ActiveGoalTab[]).map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative px-2 sm:px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === tab
                        ? 'text-calm-blue-600 dark:text-calm-blue-400'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    {tab === 'short' ? 'Short Term' : tab === 'long' ? 'Long Term' : 'Projects'}
                    {activeTab === tab && <motion.div layoutId="goalUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-calm-blue-500" />}
                </button>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleAddItem} className="space-y-3 mb-6">
        <input
          id="new-goal-input"
          ref={newItemInputRef}
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder={activeTab === 'projects' ? 'Add a new project...' : `Add a new ${activeTab === 'short' ? 'short' : 'long'} term goal...`}
          className="w-full bg-slate-100 dark:bg-slate-700 rounded-lg px-4 py-2 text-slate-800 dark:text-slate-200"
        />
        <div className="flex gap-2 flex-wrap">
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="flex-grow bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2 text-sm"
            aria-label="Deadline"
          />
          <button type="submit" className="bg-calm-blue-500 hover:bg-calm-blue-600 text-white font-semibold p-2 rounded-lg" aria-label={activeTab === 'projects' ? 'Add Project' : 'Add Goal'}><Plus size={20} /></button>
        </div>
      </form>

      <div className="space-y-4">
        <AnimatePresence mode="wait">
            <motion.div
                key={activeTab}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                {activeTab === 'short' && (
                    <ul className="space-y-2">
                        {shortTermGoals.length > 0 ? shortTermGoals.map(g => (
                            <GoalItem key={g.id} goal={g} onArchive={archiveGoal} onRestore={restoreGoal} onDelete={permanentlyDeleteGoal} />
                        )) : <p className="text-sm text-center text-slate-500 py-4">No short term goals yet.</p>}
                    </ul>
                )}
                {activeTab === 'long' && (
                    <ul className="space-y-2">
                        {longTermGoals.length > 0 ? longTermGoals.map(g => (
                            <GoalItem key={g.id} goal={g} onArchive={archiveGoal} onRestore={restoreGoal} onDelete={permanentlyDeleteGoal} />
                        )) : <p className="text-sm text-center text-slate-500 py-4">No long term goals yet.</p>}
                    </ul>
                )}
                {activeTab === 'projects' && (
                     <ul className="space-y-2">
                        {activeProjects.length > 0 ? activeProjects.map(p => (
                            <ProjectItem key={p.id} project={p} onArchive={archiveProject} onRestore={restoreProject} onDelete={permanentlyDeleteProject} />
                        )) : <p className="text-sm text-center text-slate-500 py-4">No projects yet.</p>}
                    </ul>
                )}
            </motion.div>
        </AnimatePresence>
        
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <button onClick={() => setShowArchived(!showArchived)} className="text-sm text-slate-500 dark:text-slate-400 font-semibold">
                {showArchived ? 'Hide' : 'Show'} Archived ({activeTab === 'projects' ? archivedProjects.length : archivedGoals.length})
            </button>
            {showArchived && (
                 <ul className="space-y-2 mt-2">
                    {activeTab !== 'projects' && (
                        archivedGoals.length > 0 
                        ? archivedGoals.map(g => <GoalItem key={g.id} goal={g} onArchive={archiveGoal} onRestore={restoreGoal} onDelete={permanentlyDeleteGoal} />)
                        : <p className="text-sm text-slate-500">No archived goals.</p>
                    )}
                     {activeTab === 'projects' && (
                        archivedProjects.length > 0 
                        ? archivedProjects.map(p => <ProjectItem key={p.id} project={p} onArchive={archiveProject} onRestore={restoreProject} onDelete={permanentlyDeleteProject} />)
                        : <p className="text-sm text-slate-500">No archived projects.</p>
                    )}
                </ul>
            )}
        </div>
      </div>
    </div>
  );
};

export default MyGoals;
