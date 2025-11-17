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
  subTasks?: { id: string; text: string; isDone: boolean }[];
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
  status: 'Open' | 'Closed - Won' | 'Closed - Lost';
  clientId: string;
  businessLineId: string;
  playbookId?: string;
  suggestions?: Suggestion[];
  value: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'KES';
  revenueModel: 'Revenue Share' | 'Full Pay';
  amountPaid: number;
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

export interface PlatformInsight {
    id: string;
    text: string;
}

export interface FilterOptions {
    location: string;
    timeframe: string;
    scope: string;
    customQuery: string;
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


// --- Local Gemini Types to avoid import issues ---

export enum GeminiType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  INTEGER = 'INTEGER',
  BOOLEAN = 'BOOLEAN',
  ARRAY = 'ARRAY',
  OBJECT = 'OBJECT',
}

export interface GeminiSchema {
    type: GeminiType;
    description?: string;
    format?: string;
    nullable?: boolean;
    enum?: string[];
    items?: GeminiSchema;
    properties?: { [key: string]: GeminiSchema };
    required?: string[];
    propertyOrdering?: string[];
}

export interface GeminiFunctionDeclaration {
  name: string;
  description?: string;
  parameters?: GeminiSchema;
}

export interface GeminiBlob {
  data: string; // base64 encoded string
  mimeType: string;
}

export enum GeminiModality {
    MODALITY_UNSPECIFIED = 'MODALITY_UNSPECIFIED',
    TEXT = 'TEXT',
    IMAGE = 'IMAGE',
    AUDIO = 'AUDIO',
}