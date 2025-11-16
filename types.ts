export enum KanbanStatus {
  ToDo = 'To Do',
  Doing = 'Doing',
  Done = 'Done',
  Terminated = 'Terminated',
}

export enum TaskType {
  Task = 'Task',
  Reminder = 'Reminder',
  Meeting = 'Meeting',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: KanbanStatus;
  dueDate?: string;
  priority?: 'Low' | 'Medium' | 'High';
  clientId?: string;
  dealId?: string;
  businessLineId?: string;
  type: TaskType;
  playbookStepId?: string;
}

export interface BusinessLine {
  id: string;
  name: string;
  description: string;
  customers: string;
  aiFocus: string;
}

export interface PlaybookStep {
  id: string;
  title: string;
  description: string;
}

export interface Playbook {
  id: string;
  businessLineId: string;
  steps: PlaybookStep[];
}

export interface Client {
  id:string;
  name: string;
  description: string;
  aiFocus: string;
  businessLineId: string;
  suggestions?: Suggestion[];
}

export interface Deal {
  id: string;
  name: string;
  description: string;
  status: 'Open' | 'Closed';
  clientId: string;
  businessLineId: string;
  playbookId?: string;
  suggestions?: Suggestion[];
}

export type DocumentCategory = 'SOPs' | 'Legal' | 'Templates' | 'Marketing' | 'Business Development' | 'Playbooks';
export type DocumentOwnerType = 'businessLine' | 'client' | 'deal';

export interface Document {
  id: string;
  name: string;
  category: DocumentCategory;
  url: string; 
  ownerId: string;
  ownerType: DocumentOwnerType;
  createdAt: string;
  note?: string;
}

export interface Opportunity {
  id: string;
  text: string;
}

export type CRMEntryType = 'call' | 'meeting' | 'email' | 'note' | 'file' | 'message' | 'ai_action';

export interface CRMEntry {
  id: string;
  clientId: string;
  dealId?: string;
  createdAt: string;
  type: CRMEntryType;
  summary: string;
  rawContent: string;
  documentId?: string;
  suggestions?: Suggestion[];
}

export interface Suggestion {
  id: string;
  text: string;
  taskData: Partial<Omit<Task, 'id' | 'status'>>;
}