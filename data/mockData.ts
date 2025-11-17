import { Task, KanbanStatus, TaskType, BusinessLine, Client, Deal, Document, Playbook, CRMEntry } from '../types';

export const initialBusinessLines: BusinessLine[] = [
  { 
    id: 'bl-1', 
    name: 'Fumigation',
    description: 'We help apartments and offices get rid of pests.',
    customers: 'Apartments, estates, and small offices in Nairobi.',
    aiFocus: 'Find estate-wide contracts and upsell clients to annual plans.',
  },
  { 
    id: 'bl-2', 
    name: 'Training',
    description: 'Corporate training for software development teams.',
    customers: 'Tech companies and startups.',
    aiFocus: 'Identify recurring training needs and package them as subscriptions.',
  },
  { 
    id: 'bl-3', 
    name: 'Cleaning',
    description: 'Commercial cleaning services for large offices.',
    customers: 'Corporate buildings and business parks.',
    aiFocus: 'Optimize cleaning schedules based on foot traffic data.',
  },
];

export const initialClients: Client[] = [
  { 
    id: 'client-1', 
    name: 'ABC Limited', 
    businessLineId: 'bl-1',
    description: 'A large logistics company with multiple warehouses.',
    aiFocus: 'Focus on securing a multi-year, multi-site fumigation contract.'
  },
  { 
    id: 'client-2', 
    name: 'Bright Schools', 
    businessLineId: 'bl-2',
    description: 'A chain of private schools looking to upskill their IT staff.',
    aiFocus: 'Propose a continuous learning subscription instead of one-off trainings.'
  },
  { 
    id: 'client-3', 
    name: 'Sunrise Apartments', 
    businessLineId: 'bl-3',
    description: 'A residential complex with three apartment blocks.',
    aiFocus: 'Upsell from basic cleaning to include specialized services like window and carpet cleaning.'
  },
];

export const initialDeals: Deal[] = [
  { id: 'deal-1', name: 'Warehouse monthly fumigation', description: "Ongoing monthly fumigation for ABC's main warehouse.", status: 'Open', clientId: 'client-1', businessLineId: 'bl-1', playbookId: 'playbook-1', value: 5000, currency: 'USD', revenueModel: 'Full Pay', amountPaid: 1500 },
  { id: 'deal-2', name: 'Q2 cleaning services', description: 'Quarterly deep cleaning for all common areas.', status: 'Closed - Won', clientId: 'client-3', businessLineId: 'bl-3', value: 2500, currency: 'KES', revenueModel: 'Full Pay', amountPaid: 2500 },
  { id: 'deal-3', name: 'Advanced React Training', description: 'A 5-day intensive training course for their senior developers.', status: 'Open', clientId: 'client-2', businessLineId: 'bl-2', value: 10000, currency: 'USD', revenueModel: 'Full Pay', amountPaid: 0 },
];

export const initialTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Call James from ABC Limited',
    description: 'Discuss the new fumigation deal and send him the contract.',
    status: KanbanStatus.ToDo,
    dueDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    priority: 'High',
    clientId: 'client-1',
    dealId: 'deal-1',
    businessLineId: 'bl-1',
    type: TaskType.Task,
  },
  {
    id: 'task-2',
    title: 'Follow up with Mary from Bright Schools',
    description: 'Check on the training proposal status.',
    status: KanbanStatus.ToDo,
    dueDate: new Date(new Date().setDate(new Date().getDate() + 4)).toISOString(),
    priority: 'Medium',
    clientId: 'client-2',
    dealId: 'deal-3',
    businessLineId: 'bl-2',
    type: TaskType.Task,
  },
  {
    id: 'task-3',
    title: 'Design new brochure for ABC Limited',
    description: 'Initial design mockups for the new marketing campaign.',
    status: KanbanStatus.Doing,
    priority: 'Medium',
    clientId: 'client-1',
    businessLineId: 'bl-1',
    type: TaskType.Task,
  },
  {
    id: 'task-4',
    title: 'Send invoice to Sunrise Apartments',
    description: 'Invoice for Q2 cleaning services.',
    status: KanbanStatus.Done,
    clientId: 'client-3',
    dealId: 'deal-2',
    businessLineId: 'bl-3',
    type: TaskType.Task,
  },
  {
    id: 'task-5',
    title: 'Prepare training materials',
    description: 'Finalize slides and code examples for the React workshop.',
    status: KanbanStatus.Doing,
    clientId: 'client-2',
    dealId: 'deal-3',
    businessLineId: 'bl-2',
    type: TaskType.Task,
  },
];

export const initialDocuments: Document[] = [
  {
    id: 'doc-1',
    name: 'Standard Fumigation Procedure.pdf',
    category: 'SOPs',
    url: '#',
    ownerId: 'bl-1',
    ownerType: 'businessLine',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(),
  },
  {
    id: 'doc-2',
    name: 'Client Contract v2.docx',
    category: 'Legal',
    url: '#',
    ownerId: 'bl-1',
    ownerType: 'businessLine',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
  },
  {
    id: 'doc-3',
    name: 'Signed MSA with ABC.pdf',
    category: 'Legal',
    url: '#',
    ownerId: 'client-1',
    ownerType: 'client',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 20)).toISOString(),
  },
  {
    id: 'doc-4',
    name: 'Fumigation Proposal - Deal 1.pdf',
    category: 'Marketing',
    note: 'Initial proposal sent to James.',
    url: '#',
    ownerId: 'deal-1',
    ownerType: 'deal',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 8)).toISOString(),
  },
  {
    id: 'doc-5',
    name: 'Signed Contract - Deal 1.pdf',
    category: 'Legal',
    url: '#',
    ownerId: 'deal-1',
    ownerType: 'deal',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
  }
];

export const initialPlaybooks: Playbook[] = [
  {
    id: 'playbook-1',
    businessLineId: 'bl-1', // Fumigation
    steps: [
      { id: 'step-1-1', title: 'First contact', description: 'Initial call or meeting to understand client needs.' },
      { id: 'step-1-2', title: 'Site Inspection', description: 'Visit the premises to assess the scope of work.' },
      { id: 'step-1-3', title: 'Prepare Quotation', description: 'Create and send a detailed proposal.' },
      { id: 'step-1-4', title: 'Schedule Work', description: 'Confirm dates and times with the client.' },
      { id: 'step-1-5', title: 'Deliver Service', description: 'Complete the fumigation as agreed.' },
      { id: 'step-1-6', title: 'Invoice & Payment', description: 'Send the invoice and follow up on payment.' },
    ]
  }
];

export const initialCRMEntries: CRMEntry[] = [
    {
        id: 'crm-1',
        clientId: 'client-1', // ABC Limited
        dealId: 'deal-1',
        createdAt: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
        type: 'call',
        summary: "Called James to discuss including the basement parking in the contract.",
        rawContent: "I called James from ABC Limited to discuss the new fumigation deal. He mentioned they also need the basement parking lot to be included. I told him I would update the quotation and send it over.",
    }
];