
import type { FunctionDeclaration, Schema, Blob } from '@google/genai';
import { Type, Modality } from '@google/genai';

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

export interface Contact {
    id: string;
    clientId: string;
    name: string;
    role: string;
    email: string;
    phone: string;
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
  subTasks?: { id: string; text: string; isDone: boolean }[];
  createdAt: string; 
  projectId?: string;
  assigneeId?: string; 
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
  // New CRM Fields
  contactPersonName?: string;
  contactPersonEmail?: string;
  contactPersonNumber?: string;
  officeLocation?: string;
  officeNumber?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  // AI Proposals
  proposedLastTouchSummary?: string;
  proposedNextAction?: string;
  proposedNextActionDueDate?: string;
}

export interface Deal {
  id: string;
  name: string;
  description: string;
  status: 'Open' | 'Closed - Won' | 'Closed - Lost';
  clientId: string;
  businessLineId: string;
  playbookId?: string;
  suggestions?: Suggestion[];
  value: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'KES';
  revenueModel: 'Revenue Share' | 'Full Pay';
  amountPaid: number;
  // AI Proposals
  proposedLastTouchSummary?: string;
  proposedNextAction?: string;
  proposedNextActionDueDate?: string;
  proposedStatus?: 'Open' | 'Closed - Won' | 'Closed - Lost';
}

export type ProjectStage = 'Lead' | 'In design' | 'Live' | 'Closing' | 'Dormant';
export type ProjectDealType = 'Revenue Share' | 'Fee-based' | 'Grant' | 'In-kind';

export interface Project {
  id: string;
  partnerName: string;
  projectName: string;
  goal: string;
  dealType: ProjectDealType;
  expectedRevenue: number;
  impactMetric: string;
  stage: ProjectStage;
  projectOwner: string;
  lastTouchDate: string;
  lastTouchSummary: string;
  nextAction: string;
  nextActionOwner: string;
  nextActionDueDate: string;
  opportunityNote: string;
  clientId?: string;
  // Fields for AI proposals
  proposedLastTouchSummary?: string;
  proposedNextAction?: string;
  proposedNextActionDueDate?: string;
  proposedStage?: ProjectStage;
}

export type DocumentCategory = 'SOPs' | 'Legal' | 'Templates' | 'Marketing' | 'Business Development' | 'Playbooks';
export type DocumentOwnerType = 'businessLine' | 'client' | 'deal' | 'project';

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
  projectId?: string;
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

export type RoleScope = 'All access' | 'Clients only' | 'Deals only' | 'Tasks only';
export type RolePermission = 'Can edit' | 'Read-only';

export interface Role {
  scope: RoleScope;
  permission: RolePermission;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'Active' | 'Invited';
}

export interface Prospect {
    id: string;
    name: string;
    likelyNeed: string;
}

export interface ClientPulse {
    id: string;
    source: 'Social Media' | 'News';
    content: string;
    url: string;
    date: string;
}

export interface CompetitorInsight {
    id: string;
    competitorName: string;
    insight: string;
    source: string;
}

export interface SearchTrend {
    id: string;
    keyword: string;
    insight: string;
}

export interface FilterOptions {
    location: string;
    timeframe: string;
    scope: string;
    customQuery: string;
}

export interface PlatformInsight {
    id: string;
    text: string;
}

// --- AI Router Brain Types ---
export interface RouterTask {
  title: string;
  due_date: string | null;
  client_name: string | null;
  deal_name: string | null;
  update_hint: string | null;
}

export interface RouterNote {
  text: string;
  channel: CRMEntryType;
}

export interface RouterBrainResult {
  action: 'create_task' | 'create_note' | 'both' | 'update_task' | 'ignore' | 'create_business_line' | 'create_client' | 'create_deal';
  tasks: RouterTask[];
  note: RouterNote | null;
  summary: string | null;
  businessLine?: Omit<BusinessLine, 'id'>;
  client?: Omit<Client, 'id' | 'businessLineId'> & { businessLineName?: string };
  deal?: Omit<Deal, 'id' | 'status' | 'amountPaid' | 'clientId' | 'businessLineId'> & { clientName: string };
}


// --- Gemini Types from @google/genai ---
export { Type as GeminiType };
export type { Schema as GeminiSchema };
export type { FunctionDeclaration as GeminiFunctionDeclaration };
export type { Blob as GeminiBlob };
export { Modality as GeminiModality };
