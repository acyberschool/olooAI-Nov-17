
import { Task, BusinessLine, Client, Deal, Document, Playbook, CRMEntry, Project, TeamMember, KanbanStatus, TaskType, Contact } from '../types';

// EMPTY DATA - Application relies on persistent storage or user creation
export const initialBusinessLines: BusinessLine[] = [];
export const initialClients: Client[] = [];
export const initialDeals: Deal[] = [];
export const initialProjects: Project[] = [];
export const initialTasks: Task[] = [];
export const initialDocuments: Document[] = [];
export const initialPlaybooks: Playbook[] = [];
export const initialCRMEntries: CRMEntry[] = [];
export const initialContacts: Contact[] = [];

// Keep Admin for access
export const initialTeamMembers: TeamMember[] = [
    { id: '1', name: 'You (Admin)', email: 'admin@oloo.ai', status: 'Active', role: { scope: 'All access', permission: 'Can edit' } }
];
