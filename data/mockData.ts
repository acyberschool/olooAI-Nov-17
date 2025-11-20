
import { Task, BusinessLine, Client, Deal, Document, Playbook, CRMEntry, Project, TeamMember, KanbanStatus, TaskType, Contact } from '../types';

export const initialBusinessLines: BusinessLine[] = [
    {
        id: 'bl-1',
        name: 'Fumigation',
        description: 'Residential and commercial pest control services.',
        customers: 'Apartments, offices, and homeowners.',
        aiFocus: 'Upsell annual maintenance contracts.'
    },
    {
        id: 'bl-2',
        name: 'Tech Consulting',
        description: 'Digital transformation and IT support.',
        customers: 'SMEs and Startups.',
        aiFocus: 'Identify automation opportunities.'
    }
];

export const initialClients: Client[] = [
    {
        id: 'client-1',
        name: 'ABC Apartments',
        description: 'A large residential complex in Westlands.',
        aiFocus: 'Interested in quarterly fumigation.',
        businessLineId: 'bl-1',
        leadScore: 85,
        leadScoreReason: 'High engagement, recurring need.'
    },
    {
        id: 'client-2',
        name: 'XYZ Logistics',
        description: 'Regional logistics firm.',
        aiFocus: 'Needs fleet management software audit.',
        businessLineId: 'bl-2',
        leadScore: 60,
        leadScoreReason: 'New prospect, budget unclear.'
    }
];

export const initialDeals: Deal[] = [
    {
        id: 'deal-1',
        name: 'Q3 Fumigation Contract',
        description: 'Quarterly pest control for 3 blocks.',
        status: 'Open',
        clientId: 'client-1',
        businessLineId: 'bl-1',
        value: 1500,
        currency: 'USD',
        revenueModel: 'Full Pay',
        amountPaid: 0
    }
];

export const initialProjects: Project[] = [
    {
        id: 'proj-1',
        partnerName: 'Nation Media Group',
        projectName: 'AI Workshop Series',
        goal: 'Train 50 journalists on AI tools.',
        dealType: 'Fee-based',
        expectedRevenue: 5000,
        impactMetric: '50 journalists trained',
        stage: 'In design',
        projectOwner: 'Me',
        lastTouchDate: new Date().toISOString(),
        lastTouchSummary: 'Sent proposal draft.',
        nextAction: 'Follow up on budget approval',
        nextActionOwner: 'Me',
        nextActionDueDate: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(),
        opportunityNote: 'Potential for long-term training partner.',
        clientId: 'client-2' // associated via client/partner match logic usually
    }
];

export const initialTasks: Task[] = [
    {
        id: 'task-1',
        title: 'Call ABC Apartments Manager',
        status: KanbanStatus.ToDo,
        type: TaskType.Task,
        dueDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
        clientId: 'client-1',
        businessLineId: 'bl-1',
        createdAt: new Date().toISOString()
    },
    {
        id: 'task-2',
        title: 'Draft Workshop Agenda',
        status: KanbanStatus.Doing,
        type: TaskType.Task,
        projectId: 'proj-1',
        createdAt: new Date().toISOString()
    }
];

export const initialDocuments: Document[] = [];
export const initialPlaybooks: Playbook[] = [];
export const initialCRMEntries: CRMEntry[] = [];
export const initialContacts: Contact[] = [];

export const initialTeamMembers: TeamMember[] = [
    { id: '1', name: 'You (Admin)', email: 'admin@oloo.ai', status: 'Active', role: { scope: 'All access', permission: 'Can edit' } }
];
