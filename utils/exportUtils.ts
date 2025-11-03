
import { format, parseISO } from 'date-fns';
import { AppState } from '../store/useAppStore';
import { Goal, Project } from '../types';

const getGoalsByCategory = (goals: Goal[], category: 'Short Term' | 'Long Term') => {
    return goals.filter(g => g.category === category && !g.archived);
};

export const exportStateToMarkdown = (state: AppState): string => {
    const today = new Date();
    let md = `# Proactive Planner Export - ${format(today, 'MMMM d, yyyy')}\n\n`;

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

export const convertToCsv = (state: AppState, dataType: 'tasks' | 'goals' | 'routine' | 'logs' | 'projects'): string => {
    let data: any[] = [];
    let headers: string[] = [];

    switch (dataType) {
        case 'tasks':
            data = state.plan.tasks;
            headers = ['id', 'text', 'completed', 'goalId', 'priority', 'tags', 'dependsOn', 'originProjectId', 'originSubTaskId', 'originGoalId', 'originSubGoalId'];
            break;
        case 'goals':
            data = state.goals.flatMap(g => 
                g.subGoals.length > 0 
                ? g.subGoals.map(sg => ({
                    goal_id: g.id,
                    goal_text: g.text,
                    goal_category: g.category,
                    goal_completed: g.completed,
                    goal_deadline: g.deadline,
                    goal_archived: g.archived,
                    subgoal_id: sg.id,
                    subgoal_text: sg.text,
                    subgoal_completed: sg.completed,
                    }))
                : [{
                    goal_id: g.id,
                    goal_text: g.text,
                    goal_category: g.category,
                    goal_completed: g.completed,
                    goal_deadline: g.deadline,
                    goal_archived: g.archived,
                    subgoal_id: '',
                    subgoal_text: '',
                    subgoal_completed: null,
                }]
            );
            headers = ['goal_id', 'goal_text', 'goal_category', 'goal_completed', 'goal_deadline', 'goal_archived', 'subgoal_id', 'subgoal_text', 'subgoal_completed'];
            break;
        case 'routine':
            data = state.routine;
            headers = ['id', 'text', 'completed', 'goalId', 'recurringDays', 'dependsOn'];
            break;
        case 'logs':
            data = state.logs;
            headers = ['id', 'task', 'duration', 'timestamp', 'dateString'];
            break;
        case 'projects':
            data = state.projects.flatMap(p => 
                p.subTasks.length > 0 
                ? p.subTasks.map(st => ({
                    project_id: p.id,
                    project_text: p.text,
                    project_completed: p.completed,
                    project_deadline: p.deadline,
                    project_archived: p.archived,
                    subtask_id: st.id,
                    subtask_text: st.text,
                    subtask_completed: st.completed,
                    }))
                : [{
                    project_id: p.id,
                    project_text: p.text,
                    project_completed: p.completed,
                    project_deadline: p.deadline,
                    project_archived: p.archived,
                    subtask_id: '',
                    subtask_text: '',
                    subtask_completed: null,
                }]
            );
            headers = ['project_id', 'project_text', 'project_completed', 'project_deadline', 'project_archived', 'subtask_id', 'subtask_text', 'subtask_completed'];
            break;
    }

    if (data.length === 0) {
        return 'No data available for export.';
    }

    const headerRow = headers.map(escapeCsvField).join(',');
    const dataRows = data.map(row => {
        return headers.map(header => {
            let value = row[header as keyof typeof row];
            if (Array.isArray(value)) {
                value = value.join(';'); // Use semicolon for multi-value fields
            }
            return escapeCsvField(value);
        }).join(',');
    });

    return [headerRow, ...dataRows].join('\n');
};