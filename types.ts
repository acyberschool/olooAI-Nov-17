
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

export interface Organization {
    id: string;
    name: string;
    ownerId: string;
}

export interface OrganizationMember {
    id: string;
    organizationId: string;
    userId?: string;
    name: string;
    email: string;
    role: 'Owner' | 'Admin' | 'Member';
    permissions: { access: string[] }; // e.g. ['clients', 'hr', 'sales'] or ['all']
    status: 'Active' | 'Invited';
    lastActive?: string; // ISO Date string
}

// --- NEW MODULE TYPES ---

export type EventStatus = 'Planning' | 'Confirmed' | 'Completed';

export interface Event {
    id: string;
    organizationId: string;
    name: string;
    date?: string;
    location?: string;
    status: EventStatus;
    checklist: { id: string; text: string; isDone: boolean; owner?: string }[];
    partners?: string;
    impactNotes?: string;
    // Deep Dive Fields
    strategyTheme?: string;
    speakerBios?: string;
    contentAbstracts?: string;
    roiAnalysis?: string;
}

export interface HRCandidate {
    id: string;
    organizationId: string;
    name: string;
    roleApplied: string;
    email: string;
    status: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected';
    resumeUrl?: string;
    notes?: string;
    interviewDate?: string;
    screeningScore?: number; // AI Generated
}

export interface HREmployee {
    id: string;
    organizationId: string;
    name: string;
    role: string;
    type: 'Full-time' | 'Contractor';
    email: string;
    startDate: string;
    status: 'Active' | 'Onboarding' | 'Offboarding';
    compensationModel?: string; // e.g., "Base + Comm"
    payrollStatus?: 'Paid' | 'Pending';
}

// --- EXISTING TYPES UPDATED WITH ORG_ID ---

export interface Contact {
    id: string;
    organizationId: string;
    clientId: string;
    name: string;
    role: string;
    email: string;
    phone: string;
}

export interface Task {
  id: string;
  organizationId: string;
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
  organizationId: string;
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
  organizationId: string;
  businessLineId: string;
  steps: PlaybookStep[];
}

export interface Client {
  id:string;
  organizationId: string;
  name: string;
  description: string;
  aiFocus: string;
  businessLineId: string;
  suggestions?: Suggestion[];
  contactPersonName?: string;
  contactPersonEmail?: string;
  contactPersonNumber?: string;
  officeLocation?: string;
  officeNumber?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  proposedLastTouchSummary?: string;
  proposedNextAction?: string;
  proposedNextActionDueDate?: string;
  leadScore?: number;
  leadScoreReason?: string;
}

export type SalesStage = 'Qualified' | 'Contact Made' | 'Demo Scheduled' | 'Proposal Made' | 'Negotiated' | 'Onboarded' | 'Botched';

export interface Deal {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  status: 'Open' | 'Closed - Won' | 'Closed - Lost';
  salesStage?: SalesStage; // New granular stage
  clientId: string;
  businessLineId: string;
  playbookId?: string;
  suggestions?: Suggestion[];
  value: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'KES';
  revenueModel: 'Revenue Share' | 'Full Pay';
  amountPaid: number;
  createdAt?: string;
  proposedLastTouchSummary?: string;
  proposedNextAction?: string;
  proposedNextActionDueDate?: string;
  proposedStatus?: 'Open' | 'Closed - Won' | 'Closed - Lost';
  // Sales Coaching
  qualificationScore?: number;
  velocityBlockers?: string;
  coachingNotes?: string;
}

export type ProjectStage = 'Lead' | 'In design' | 'Live' | 'Closing' | 'Dormant';
export type ProjectDealType = 'Revenue Share' | 'Fee-based' | 'Grant' | 'In-kind';

export interface Project {
  id: string;
  organizationId: string;
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
  proposedLastTouchSummary?: string;
  proposedNextAction?: string;
  proposedNextActionDueDate?: string;
  proposedStage?: ProjectStage;
}

export type DocumentCategory = 'SOPs' | 'Legal' | 'Templates' | 'Marketing' | 'Business Development' | 'Playbooks';
export type DocumentOwnerType = 'businessLine' | 'client' | 'deal' | 'project';

export interface Document {
  id: string;
  organizationId: string;
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
  organizationId: string;
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

export interface Role {
  scope: string;
  permission: string;
}

// This is now handled by OrganizationMember
export interface TeamMember extends OrganizationMember {}

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

export interface SocialPost {
    id: string;
    organizationId: string;
    businessLineId: string;
    date: string; // ISO Date String YYYY-MM-DD
    content: string; // The caption or text
    type: 'Post' | 'Idea' | 'Prompt';
    imageUrl?: string; // Base64 or URL
    videoUrl?: string; // URL for generated video
    imagePrompt?: string;
    status: 'Draft' | 'Scheduled' | 'Posted';
    channel?: string;
    cta?: string;
    engagementHook?: string;
}

// --- AI Router Brain Types ---
export interface RouterTask {
  title: string;
  due_date: string | null;
  client_name: string | null;
  deal_name: string | null;
  business_line_name: string | null;
  update_hint: string | null;
  priority?: 'Low' | 'Medium' | 'High';
  assignee_name?: string | null; // For ATC (Assign to Colleague)
}

export interface RouterNote {
  text: string;
  channel: CRMEntryType;
}

export interface RouterBrainResult {
  action: 'create_task' | 'create_note' | 'both' | 'update_task' | 'ignore' | 'create_business_line' | 'create_client' | 'create_deal' | 'create_project' | 'create_event' | 'create_candidate';
  tasks: RouterTask[];
  note: RouterNote | null;
  summary: string | null;
  businessLine?: Omit<BusinessLine, 'id' | 'organizationId'>;
  client?: Omit<Client, 'id' | 'businessLineId' | 'organizationId'> & { businessLineName?: string };
  deal?: Omit<Deal, 'id' | 'status' | 'amountPaid' | 'clientId' | 'businessLineId' | 'organizationId'> & { clientName: string };
  project?: {
      partnerName: string;
      projectName: string;
      goal: string;
      dealType: ProjectDealType;
      expectedRevenue: number;
      impactMetric: string;
      stage: ProjectStage;
  };
  event?: {
      name: string;
      location?: string;
      date?: string;
  };
  candidate?: {
      name: string;
      roleApplied: string;
      email: string;
  };
}

export type UniversalInputContext = {
    clientId?: string;
    dealId?: string;
    businessLineId?: string;
    task?: Task;
    placeholder?: string;
    date?: Date;
};


// --- Gemini Types from @google/genai ---
export { Type as GeminiType };
export type { Schema as GeminiSchema };
export type { FunctionDeclaration as GeminiFunctionDeclaration };
export type { Blob as GeminiBlob };
export { Modality as GeminiModality };
