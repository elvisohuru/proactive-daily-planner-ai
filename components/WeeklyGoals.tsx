import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { CalendarCheck, Check, Send, Plus, Trash2, Link2, Info, ArrowUpCircle, CircleCheck, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WeeklyGoal, WeeklySubGoal } from '../types';

const WeeklySubGoalItem: React.FC<{
    subGoal: WeeklySubGoal;
    goalId: string;
    allSubGoals: WeeklySubGoal[];
    editingDepsFor: string | null;
    setEditingDepsFor: (id: string | null) => void;
}> = ({ subGoal, goalId, allSubGoals, editingDepsFor, setEditingDepsFor }) => {
    const { toggleWeeklySubGoal, deleteWeeklySubGoal, updateWeeklySubGoal, sendWeeklySubGoalToPlan } = useAppStore();

    const isBlocked = subGoal.dependsOn?.some(depId => !allSubGoals.find(g => g.id === depId)?.completed) ?? false;

    const handleDependencyChange = (dependencyId: string, isChecked: boolean) => {
        const currentDeps = subGoal.dependsOn || [];
        const newDeps = isChecked ? [...currentDeps, dependencyId] : currentDeps.filter(id => id !== dependencyId);
        updateWeeklySubGoal(goalId, subGoal.id, { dependsOn: newDeps });
    };

    const getBlockedByText = (): string => {
        if (!subGoal.dependsOn) return '';
        const blockingTasks = subGoal.dependsOn
            .map(depId => allSubGoals.find(t => t.id === depId && !t.completed))
            .filter(Boolean);
        if (blockingTasks.length > 0) return `Blocked by: ${blockingTasks.map(t => t?.text).join(', ')}`;
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
                onClick={() => !isBlocked && toggleWeeklySubGoal(goalId, subGoal.id)}
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
                <button onClick={() => sendWeeklySubGoalToPlan(goalId, subGoal.id)} disabled={subGoal.completed} className="text-slate-400 hover:text-calm-green-500 p-1 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Send to today's plan">
                    <ArrowUpCircle size={14} />
                </button>
            )}

            <div className="relative">
                <button 
                    onClick={() => setEditingDepsFor(editingDepsFor === subGoal.id ? null : subGoal.id)} 
                    disabled={isBlocked || subGoal.completed}
                    className="text-slate-400 hover:text-calm-blue-500 p-1 disabled:cursor-not-allowed disabled:opacity-50"
                     aria-label="Link dependencies for this sub-goal"
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

            <button onClick={() => deleteWeeklySubGoal(goalId, subGoal.id)} disabled={subGoal.completed} className="text-slate-400 hover:text-red-500 p-1 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Delete sub-goal"><Trash2 size={14} /></button>
        </motion.li>
    );
};

const WeeklyGoalItem: React.FC<{
    goal: WeeklyGoal;
    allGoals: WeeklyGoal[];
}> = ({ goal, allGoals }) => {
    const { toggleWeeklyGoal, updateWeeklyGoal, addWeeklySubGoal } = useAppStore();
    const [newSubGoalText, setNewSubGoalText] = useState('');
    const [editingDepsFor, setEditingDepsFor] = useState<string | null>(null); // For sub-goals
    const [editingMainDepsFor, setEditingMainDepsFor] = useState<string | null>(null); // For main goals
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(goal.text);
    const [isExpanded, setIsExpanded] = useState(goal.subGoals.length === 0);
    const [isAddSubGoalOpen, setIsAddSubGoalOpen] = useState(false);
    const newSubGoalInputRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
        if (isAddSubGoalOpen) {
            newSubGoalInputRef.current?.focus();
        }
    }, [isAddSubGoalOpen]);

    const completedSubGoals = goal.subGoals.filter(sg => sg.completed).length;
    const totalSubGoals = goal.subGoals.length;
    const progress = totalSubGoals > 0 ? (completedSubGoals / totalSubGoals) * 100 : (goal.completed ? 100 : 0);
    const isBlocked = goal.dependsOn?.some(depId => !allGoals.find(g => g.id === depId)?.completed) ?? false;

    const handleAddSubGoal = (e: React.FormEvent) => {
        e.preventDefault();
        if (newSubGoalText.trim()) {
            addWeeklySubGoal(goal.id, newSubGoalText.trim());
            setNewSubGoalText('');
            setIsAddSubGoalOpen(false);
        }
    };

    const handleMainDependencyChange = (dependencyId: string, isChecked: boolean) => {
        const currentDeps = goal.dependsOn || [];
        const newDeps = isChecked ? [...currentDeps, dependencyId] : currentDeps.filter(id => id !== dependencyId);
        updateWeeklyGoal(goal.id, { dependsOn: newDeps });
    };

    const handleEditSave = () => {
      if (editText.trim() && editText.trim() !== goal.text) {
          updateWeeklyGoal(goal.id, { text: editText.trim() });
      }
      setIsEditing(false);
    };
    
    return (
         <motion.li
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`flex flex-col gap-1 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg ${isBlocked || goal.completed ? 'opacity-60' : ''}`}
        >
            <div className="flex items-start gap-3">
                <button
                    onClick={() => !isBlocked && toggleWeeklyGoal(goal.id)}
                    disabled={isBlocked || totalSubGoals > 0}
                    title={totalSubGoals > 0 ? "Complete all sub-goals to finish" : (isBlocked ? "This goal is blocked" : "")}
                    className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                        goal.completed ? 'bg-calm-green-500 border-calm-green-500' : 'border-slate-300 dark:border-slate-500'
                    } ${isBlocked || totalSubGoals > 0 ? 'cursor-not-allowed bg-slate-200 dark:bg-slate-600' : ''}`}
                >
                    {goal.completed && <Check size={12} className="text-white" />}
                </button>
                <div className="flex-grow">
                    {isEditing ? (
                        <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onBlur={handleEditSave}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleEditSave();
                                if (e.key === 'Escape') {
                                    setEditText(goal.text);
                                    setIsEditing(false);
                                }
                            }}
                            autoFocus
                            className="w-full bg-slate-100 dark:bg-slate-600 rounded-md px-2 py-0 text-base font-semibold border-transparent focus:ring-1 focus:ring-calm-blue-500"
                        />
                    ) : (
                         <p className={`font-semibold text-slate-700 dark:text-slate-300 ${goal.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                            {goal.text}
                            {totalSubGoals > 0 && (
                                <span className="text-xs font-semibold text-calm-blue-600 dark:text-calm-blue-400 ml-2">
                                    ({Math.round(progress)}%)
                                </span>
                            )}
                        </p>
                    )}
                     {isBlocked && (
                        <span className="text-xs text-yellow-600 dark:text-yellow-400">Blocked</span>
                     )}
                    <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5 my-1.5">
                        <motion.div 
                            className={`${goal.completed ? 'bg-calm-green-500' : 'bg-calm-blue-500'} h-1.5 rounded-full`}
                            initial={{ width: '0%' }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                    </div>
                </div>
                 <button onClick={() => setIsEditing(!isEditing)} disabled={goal.completed} className="text-slate-400 hover:text-calm-blue-500 p-1 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Edit weekly goal text">
                    <Pencil size={16} />
                </button>
                 <div className="relative">
                    <button 
                        onClick={() => setEditingMainDepsFor(editingMainDepsFor === goal.id ? null : goal.id)} 
                        disabled={isBlocked || goal.completed}
                        className="text-slate-400 hover:text-calm-blue-500 p-1 disabled:cursor-not-allowed disabled:opacity-50"
                         aria-label="Link dependencies for this weekly goal"
                    >
                        <Link2 size={16} />
                    </button>
                    <AnimatePresence>
                        {editingMainDepsFor === goal.id && (
                             <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                onClick={(e) => e.stopPropagation()}
                                className="absolute z-30 right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-2"
                            >
                                <p className="text-xs font-semibold mb-2 p-1 text-slate-800 dark:text-slate-200">Depends on:</p>
                                <ul className="max-h-32 overflow-y-auto space-y-1">
                                    {allGoals.filter(g => g.id !== goal.id).map(depGoal => (
                                        <li key={depGoal.id}>
                                            <label className="flex items-center gap-2 text-sm p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={goal.dependsOn?.includes(depGoal.id) ?? false} 
                                                    onChange={(e) => handleMainDependencyChange(depGoal.id, e.target.checked)} 
                                                    className="rounded text-calm-blue-500 focus:ring-calm-blue-500"
                                                />
                                                <span className={depGoal.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}>{depGoal.text}</span>
                                            </label>
                                        </li>
                                    ))}
                                    {allGoals.length <= 1 && <p className="text-xs text-slate-400 p-1">No other weekly goals to link.</p>}
                                </ul>
                                <button onClick={() => setEditingMainDepsFor(null)} className="mt-2 w-full text-center text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">Close</button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
             
            {!goal.completed && goal.subGoals.length > 0 && (
                <div className="pl-8">
                    <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {isExpanded ? 'Hide sub-goals' : `Show ${goal.subGoals.length} sub-goals`}
                    </button>
                </div>
            )}

            <AnimatePresence initial={false}>
                {!goal.completed && isExpanded && (
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
                                    {goal.subGoals.map(sg => <WeeklySubGoalItem key={sg.id} subGoal={sg} goalId={goal.id} allSubGoals={goal.subGoals} editingDepsFor={editingDepsFor} setEditingDepsFor={setEditingDepsFor} />)}
                                </AnimatePresence>
                            </ul>
                            {!isAddSubGoalOpen && (
                                <button 
                                    onClick={() => setIsAddSubGoalOpen(true)}
                                    className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mt-2 pl-4"
                                >
                                    <Plus size={14} /> Add sub-goal
                                </button>
                            )}
                            <AnimatePresence>
                                {isAddSubGoalOpen && (
                                    <motion.form 
                                        onSubmit={handleAddSubGoal}
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex gap-2 mt-2"
                                    >
                                        <input 
                                            ref={newSubGoalInputRef}
                                            type="text"
                                            value={newSubGoalText}
                                            onChange={e => setNewSubGoalText(e.target.value)}
                                            onBlur={() => { if(!newSubGoalText.trim()) setIsAddSubGoalOpen(false); }}
                                            placeholder="Add a sub-goal..."
                                            className="flex-grow min-w-0 bg-slate-100 dark:bg-slate-600 rounded-md px-2 py-1 text-sm border-transparent focus:ring-1 focus:ring-calm-blue-500"
                                        />
                                        <button type="submit" className="text-calm-blue-500 hover:text-calm-blue-600 p-1" aria-label="Add sub-goal"><Plus size={18}/></button>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.li>
    )
}

const WeeklyGoals: React.FC = () => {
    const { weeklyPlan, setWeeklyGoals } = useAppStore();
    const [goalInputs, setGoalInputs] = useState(['', '', '']);

    const handleInputChange = (index: number, value: string) => {
        const newInputs = [...goalInputs];
        newInputs[index] = value;
        setGoalInputs(newInputs);
    };

    const addGoalInput = () => {
        setGoalInputs([...goalInputs, '']);
    };

    const removeGoalInput = (index: number) => {
        const newInputs = goalInputs.filter((_, i) => i !== index);
        setGoalInputs(newInputs);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setWeeklyGoals(goalInputs);
    };

    const hasSetGoals = weeklyPlan.goals.length > 0;

    if (!hasSetGoals) {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <CalendarCheck size={20} /> Set Your Focus for the Week
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Define your main objectives to guide the week.
                </p>
                <form onSubmit={handleSubmit} className="space-y-3">
                    {goalInputs.map((goal, index) => (
                        <div key={index} className="flex gap-2 items-center">
                            <input
                                type="text"
                                value={goal}
                                onChange={(e) => handleInputChange(index, e.target.value)}
                                placeholder={`Goal #${index + 1}...`}
                                className="w-full bg-slate-100 dark:bg-slate-700 border-transparent focus:ring-2 focus:ring-calm-blue-500 focus:border-transparent rounded-lg px-4 py-2 text-slate-800 dark:text-slate-200 transition"
                            />
                            {goalInputs.length > 1 && (
                                <button type="button" onClick={() => removeGoalInput(index)} className="text-slate-400 hover:text-red-500 p-1" aria-label="Remove goal input">
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    ))}
                     <button
                        type="button"
                        onClick={addGoalInput}
                        className="w-full flex items-center justify-center gap-2 text-sm text-calm-blue-600 dark:text-calm-blue-400 hover:bg-calm-blue-50 dark:hover:bg-calm-blue-900/50 font-semibold py-2 px-4 rounded-lg transition"
                    >
                        <Plus size={16} />
                        Add another goal
                    </button>
                    <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 bg-calm-blue-500 hover:bg-calm-blue-600 text-white font-bold py-3 px-4 rounded-lg transition"
                    >
                        <Send size={18} />
                        Set Week's Focus
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <CalendarCheck size={20} /> This Week's Focus
            </h2>
            <ul className="space-y-3">
                {weeklyPlan.goals.map((goal) => (
                    <WeeklyGoalItem key={goal.id} goal={goal} allGoals={weeklyPlan.goals} />
                ))}
            </ul>
        </div>
    );
};

export default WeeklyGoals;