import { Task, BusinessLine, Client, Deal, Document, Playbook, CRMEntry, Project, TeamMember, KanbanStatus, TaskType } from '../types';

export const initialBusinessLines: BusinessLine[] = [
    {
        id: 'bl-demo-1',
        name: 'Tech Consulting',
        description: 'Helping companies optimize their software stack.',
        customers: 'Startups and SMEs',
        aiFocus: 'Find companies raising Series A'
    }
];

export const initialClients: Client[] = [
    {
        id: 'client-demo-1',
        name: 'Acme Corp',
        description: 'A logistics company.',
        aiFocus: 'Needs help with inventory management.',
        businessLineId: 'bl-demo-1'
    }
];

export const initialDeals: Deal[] = [];

export const initialProjects: Project[] = [];

export const initialTasks: Task[] = [
    {
        id: 'task-demo-1',
        title: 'Welcome to olooAI',
        description: 'This is a sample task. Click to edit or delete.',
        status: KanbanStatus.ToDo,
        type: TaskType.Task,
        createdAt: new Date().toISOString(),
        businessLineId: 'bl-demo-1'
    }
];

export const initialDocuments: Document[] = [];

export const initialPlaybooks: Playbook[] = [];

export const initialCRMEntries: CRMEntry[] = [];

export const initialTeamMembers: TeamMember[] = [
    { id: '1', name: 'You (Admin)', email: 'admin@oloo.ai', status: 'Active', role: { scope: 'All access', permission: 'Can edit' } }
];