import React, { useState } from 'react';
import { TeamMember, Role, RoleScope, RolePermission } from '../types';

const mockTeam: TeamMember[] = [
  { id: '1', name: 'Grandma Oloo', email: 'grandma@oloo.ai', status: 'Active', role: { scope: 'All access', permission: 'Can edit' } },
  { id: '2', name: 'John Doe', email: 'john@example.com', status: 'Active', role: { scope: 'Deals only', permission: 'Can edit' } },
  { id: '3', name: 'Jane Smith', email: 'jane@example.com', status: 'Invited', role: { scope: 'Clients only', permission: 'Read-only' } },
];

const PlusIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>);

const TeamView: React.FC = () => {
    const [team, setTeam] = useState<TeamMember[]>(mockTeam);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h2 className="text-2xl font-semibold text-[#15803D] mb-2 sm:mb-0">Team & Access</h2>
                <button
                className="flex items-center bg-[#15803D] hover:bg-[#166534] text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                <PlusIcon /> Invite Member
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-[#E5E7EB] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-[#E5E7EB] bg-gray-50">
                            <tr>
                                <th className="p-4 text-sm font-medium text-[#6B7280]">Name</th>
                                <th className="p-4 text-sm font-medium text-[#6B7280] hidden sm:table-cell">Access Scope</th>
                                <th className="p-4 text-sm font-medium text-[#6B7280] hidden md:table-cell">Permissions</th>
                                <th className="p-4 text-sm font-medium text-[#6B7280]">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {team.map(member => (
                                <tr key={member.id} className="border-b border-[#E5E7EB] last:border-b-0 hover:bg-gray-50">
                                    <td className="p-4">
                                        <p className="font-semibold text-[#111827]">{member.name}</p>
                                        <p className="text-xs text-[#6B7280]">{member.email}</p>
                                    </td>
                                    <td className="p-4 hidden sm:table-cell">
                                        <span className="bg-gray-100 text-gray-700 rounded-full px-3 py-1 text-sm font-medium">{member.role.scope}</span>
                                    </td>
                                    <td className="p-4 hidden md:table-cell">
                                        <span className={`rounded-full px-3 py-1 text-sm font-medium ${member.role.permission === 'Can edit' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-700'}`}>
                                            {member.role.permission}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-sm font-bold ${member.status === 'Active' ? 'text-green-600' : 'text-yellow-600'}`}>{member.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-8 bg-white p-6 rounded-xl shadow-lg border border-[#E5E7EB]">
                <h3 className="text-lg font-semibold mb-4 text-[#111827]">Invite a new member</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-[#111827] mb-2">Email Address</label>
                        <input type="email" placeholder="new.teammate@example.com" className="w-full bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D]" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#111827] mb-2">What can this person do?</label>
                        <select className="w-full bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D]">
                            <option>Handle everything (All access)</option>
                            <option>Handle clients (Clients only)</option>
                            <option>Handle deals (Deals only)</option>
                            <option>Handle tasks (Tasks only)</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-[#111827] mb-2">Can they edit, or only view?</label>
                        <div className="flex items-center space-x-4">
                            <label className="flex items-center"><input type="radio" name="permission" className="form-radio bg-white border-gray-300 text-[#15803D] focus:ring-[#166534]" defaultChecked/> <span className="ml-2">Edit & view</span></label>
                            <label className="flex items-center"><input type="radio" name="permission" className="form-radio bg-white border-gray-300 text-[#15803D] focus:ring-[#166534]"/> <span className="ml-2">View only</span></label>
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                     <button className="bg-[#15803D] hover:bg-[#166534] text-white font-bold py-2 px-4 rounded-lg transition-colors">Send Invite</button>
                </div>
            </div>
        </div>
    );
};

export default TeamView;