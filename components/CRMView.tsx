import React, { useMemo } from 'react';
import { Client, CRMEntry, Task, BusinessLine, KanbanStatus } from '../types';

interface CRMViewProps {
  clients: Client[];
  crmEntries: CRMEntry[];
  tasks: Task[];
  businessLines: BusinessLine[];
  onSelectClient: (id: string) => void;
}

const CRMView: React.FC<CRMViewProps> = ({ clients, crmEntries, tasks, businessLines, onSelectClient }) => {
    
    const clientData = useMemo(() => {
        return clients.map(client => {
            const lastEntry = crmEntries
                .filter(e => e.clientId === client.id)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

            const nextTask = tasks
                .filter(t => t.clientId === client.id && t.status === KanbanStatus.ToDo && t.dueDate)
                .sort((a,b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0];

            const businessLine = businessLines.find(bl => bl.id === client.businessLineId);

            return {
                ...client,
                lastEntry,
                nextTask,
                businessLineName: businessLine?.name || 'N/A',
            }
        }).sort((a,b) => {
            const aDate = a.lastEntry ? new Date(a.lastEntry.createdAt).getTime() : 0;
            const bDate = b.lastEntry ? new Date(b.lastEntry.createdAt).getTime() : 0;
            return bDate - aDate;
        });

    }, [clients, crmEntries, tasks, businessLines]);

    const timeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return "Just now";
    }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-[#15803D]">Conversations & Follow-ups</h2>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-[#E5E7EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
              <thead className="border-b border-[#E5E7EB] bg-gray-50">
                  <tr>
                      <th className="p-4 text-sm font-medium text-[#6B7280]">Client</th>
                      <th className="p-4 text-sm font-medium text-[#6B7280]">Last Conversation</th>
                      <th className="p-4 text-sm font-medium text-[#6B7280]">Next Planned Step</th>
                  </tr>
              </thead>
              <tbody>
                  {clientData.map(client => (
                      <tr key={client.id} onClick={() => onSelectClient(client.id)} className="border-b border-[#E5E7EB] last:border-b-0 hover:bg-gray-50 cursor-pointer">
                          <td className="p-4">
                              <p className="font-semibold text-[#111827]">{client.name}</p>
                              <p className="text-xs text-[#14532D]">{client.businessLineName}</p>
                          </td>
                          <td className="p-4">
                              {client.lastEntry ? (
                                  <>
                                      <p className="text-sm text-[#111827]">{client.lastEntry.summary}</p>
                                      <p className="text-xs text-[#6B7280]">{timeAgo(new Date(client.lastEntry.createdAt))}</p>
                                  </>
                              ) : (
                                  <p className="text-sm text-[#6B7280]">No conversations logged</p>
                              )}
                          </td>
                          <td className="p-4">
                              {client.nextTask ? (
                                  <>
                                      <p className="text-sm text-[#111827]">{client.nextTask.title}</p>
                                      <p className="text-xs text-red-600">Due: {new Date(client.nextTask.dueDate!).toLocaleDateString()}</p>
                                  </>
                              ) : (
                                  <p className="text-sm text-[#6B7280]">No next step planned</p>
                              )}
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default CRMView;