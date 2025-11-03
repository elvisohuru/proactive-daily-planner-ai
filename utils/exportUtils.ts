import { format, parseISO } from 'date-fns';
// Fix: Import AppState from '../types' instead of '../store/useAppStore'
import { AppState, Goal, Project, WeeklyGoal } from '../types';

const getGoalsByCategory = (goals: Goal[], category: 'Short Term' | 'Long Term') => {
    return goals.filter(g => g.category === category && !g.archived);
};

export const exportStateToMarkdown = (state: AppState): string => {
    const today = new Date();
    let md = `# Proactive Planner Export - ${format(today, 'MMMM d, yyyy')}\n\n`;

    // Weekly Goals
    if (state.weeklyPlan && state.weeklyPlan.goals.length > 0) {
        md += `## This Week's Focus\n`;
        state.weeklyPlan.goals.forEach(goal => {
            md += `### [${goal.completed ? 'x' : ' '}] ${goal.text}\n`;
            if (goal.subGoals.length > 0) {
                goal.subGoals.forEach(subGoal => {
                    md += `  - [${subGoal.completed ? 'x' : ' '}] ${subGoal.text}\n`;
                });
            }
        });
        md += '\n';
    }

    // Plan for today
    md += `## Today's Plan (${state.plan.date})\n`;
    if (state.plan.tasks.length > 0) {
        state.plan.tasks.forEach(task => {
            md += `- [${task.completed ? 'x' : ' '}] ${task.text}\n`;
        });
    } else {
        md += `_No tasks planned for today._\n`;
    }
    md += '\n';

    // Daily Routine
    md += `## Daily Routine\n`;
    if (state.routine.length > 0) {
        state.routine.forEach(task => {
            md += `- [${task.completed ? 'x' : ' '}] ${task.text}\n`;
        });
    } else {
        md += `_No routine tasks set up._\n`;
    }
    md += '\n';

    // Goals
    md += `## Goals\n`;
    const shortTermGoals = getGoalsByCategory(state.goals, 'Short Term');
    const longTermGoals = getGoalsByCategory(state.goals, 'Long Term');

    const formatGoal = (goal: Goal) => {
        md += `### [${goal.completed ? 'x' : ' '}] ${goal.text}${goal.deadline ? ` (Due: ${format(parseISO(goal.deadline), 'MMM d')})` : ''}\n`;
        if (goal.subGoals.length > 0) {
            goal.subGoals.forEach(subGoal => {
                md += `  - [${subGoal.completed ? 'x' : ' '}] ${subGoal.text}\n`;
            });
        }
    }

    md += `### Short Term\n`;
    if (shortTermGoals.length > 0) {
        shortTermGoals.forEach(formatGoal);
    } else {
        md += `_No short term goals._\n`;
    }
    md += '\n';
    
    md += `### Long Term\n`;
    if (longTermGoals.length > 0) {
        longTermGoals.forEach(formatGoal);
    } else {
        md += `_No long term goals._\n`;
    }
    md += '\n';

    // Projects
    md += `## Projects\n`;
    const activeProjects = state.projects.filter((p: Project) => !p.archived);
    if (activeProjects.length > 0) {
        activeProjects.forEach(project => {
            md += `### [${project.completed ? 'x' : ' '}] ${project.text}\n`;
            if (project.subTasks.length > 0) {
                project.subTasks.forEach(subtask => {
                    md += `  - [${subtask.completed ? 'x' : ' '}] ${subtask.text}\n`;
                });
            }
        });
    } else {
        md += `_No active projects._\n`;
    }
    md += '\n';

    // Idea Inbox
    md += `## Idea Inbox\n`;
    if (state.inbox && state.inbox.length > 0) {
        state.inbox.forEach(item => {
            md += `- ${item.text}\n`;
        });
    } else {
        md += `_Inbox is empty._\n`;
    }
    md += '\n';

    // Time Logs for Today
    md += `## Today's Time Log\n`;
    const todaysLogs = state.logs.filter(log => log.dateString === state.plan.date);
    if (todaysLogs.length > 0) {
        todaysLogs.forEach(log => {
            const duration = `${Math.floor(log.duration / 60)}m ${log.duration % 60}s`;
            md += `- **${log.task}**: ${duration}\n`;
        });
    } else {
        md += `_No time logged today._\n`;
    }
    md += '\n';

    // Reflections
    md += `## Past Reflections\n`;
    if (state.reflections.length > 0) {
        const sortedReflections = [...state.reflections].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        sortedReflections.slice(0, 7).forEach(r => { // Last 7 reflections
            md += `### ${format(parseISO(r.date), 'EEEE, MMMM d')}\n`;
            md += `- **Went well:** ${r.well}\n`;
            md += `- **To improve:** ${r.improve}\n\n`;
        });
    } else {
        md += `_No reflections saved yet._\n`;
    }

    return md;
};

const escapeCsvField = (field: any): string => {
    if (field === null || field === undefined) {
        return '';
    }
    const stringField = String(field);
    if (/[",\n\r]/.test(stringField)) {
        return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
};

export const convertToCsv = (state: AppState, dataType: 'tasks' | 'goals' | 'routine' | 'logs' | 'projects' | 'weekly' | 'inbox'): string => {
    let data: any[] = [];
    let headers: string[] = [];

    switch (dataType) {
        case 'tasks':
            data = state.plan.tasks;
            headers = ['id', 'text', 'completed', 'goalId', 'weeklyGoalId', 'priority', 'tags', 'dependsOn', 'originProjectId', 'originSubTaskId', 'originGoalId', 'originSubGoalId', 'originWeeklyGoalId', 'originWeeklySubGoalId'];
            break;
        case 'goals':
            data = state.goals.flatMap(g => 
                g.subGoals.length > 0 
                ? g.subGoals.map(sg => ({ 
                    goal_id: g.id, goal_text: g.text, category: g.category, goal_completed: g.completed, deadline: g.deadline, archived: g.archived, 
                    sub_goal_id: sg.id, sub_goal_text: sg.text, sub_goal_completed: sg.completed 
                  }))
                : [{
                    goal_id: g.id, goal_text: g.text, category: g.category, goal_completed: g.completed, deadline: g.deadline, archived: g.archived,
                    sub_goal_id: null, sub_goal_text: null, sub_goal_completed: null
                  }]
            );
            headers = ['goal_id', 'goal_text', 'category', 'goal_completed', 'deadline', 'archived', 'sub_goal_id', 'sub_goal_text', 'sub_goal_completed'];
            break;
        case 'routine':
            data = state.routine;
            headers = ['id', 'text', 'completed', 'goalId', 'recurringDays'];
            break;
        case 'logs':
            data = state.logs;
            headers = ['id', 'task', 'duration', 'timestamp', 'dateString'];
            break;
        case 'projects':
             data = state.projects.flatMap(p => 
                p.subTasks.length > 0
                ? p.subTasks.map(st => ({
                    project_id: p.id, project_text: p.text, project_completed: p.completed, deadline: p.deadline, archived: p.archived,
                    sub_task_id: st.id, sub_task_text: st.text, sub_task_completed: st.completed
                }))
                : [{
                    project_id: p.id, project_text: p.text, project_completed: p.completed, deadline: p.deadline, archived: p.archived,
                    sub_task_id: null, sub_task_text: null, sub_task_completed: null
                }]
            );
            headers = ['project_id', 'project_text', 'project_completed', 'deadline', 'archived', 'sub_task_id', 'sub_task_text', 'sub_task_completed'];
            break;
        case 'weekly':
             data = state.weeklyPlan.goals.flatMap(g => 
                g.subGoals.length > 0
                ? g.subGoals.map(sg => ({ 
                    week_start_date: state.weeklyPlan.weekStartDate, goal_id: g.id, goal_text: g.text, goal_completed: g.completed,
                    sub_goal_id: sg.id, sub_goal_text: sg.text, sub_goal_completed: sg.completed 
                  }))
                : [{
                    week_start_date: state.weeklyPlan.weekStartDate, goal_id: g.id, goal_text: g.text, goal_completed: g.completed,
                    sub_goal_id: null, sub_goal_text: null, sub_goal_completed: null
                  }]
            );
            headers = ['week_start_date', 'goal_id', 'goal_text', 'goal_completed', 'sub_goal_id', 'sub_goal_text', 'sub_goal_completed'];
            break;
        case 'inbox':
            data = state.inbox;
            headers = ['id', 'text', 'createdAt'];
            break;
    }

    const csvRows = [headers.join(',')];
    data.forEach(item => {
        const row = headers.map(header => {
            const value = (item as any)[header];
            if (Array.isArray(value)) {
                return escapeCsvField(value.join(';'));
            }
            return escapeCsvField(value);
        });
        csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
};