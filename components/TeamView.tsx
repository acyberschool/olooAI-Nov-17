
import React, { useState } from 'react';
import { useKanban } from '../hooks/useKanban';
import { Role } from '../types';

const PlusIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>);

const TeamView: React.FC = () => {
    const { teamMembers, inviteMember } = useKanban();
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('Member');

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (inviteEmail) {
            // Map legacy role selection to new structure
            inviteMember(inviteEmail, { access: ['all'] });
            
            const subject = encodeURIComponent("Invitation to join olooAI Workspace");
            const body = encodeURIComponent(`Hi,\n\nI'm inviting you to join our workspace on olooAI. We'll be using it to manage tasks, clients, and projects.\n\nPlease accept the invite to get started.\n\nBest,\nAdmin`);
            
            window.location.href = `mailto:${inviteEmail}?subject=${subject}&body=${body}`;
            
            setInviteEmail('');
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h2 className="text-2xl font-semibold text-[#15803D] mb-2 sm:mb-0">Team & Access</h2>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-[#E5E7EB] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-[#E5E7EB] bg-gray-50">
                            <tr>
                                <th className="p-4 text-sm font-medium text-[#6B7280]">Name</th>
                                <th className="p-4 text-sm font-medium text-[#6B7280] hidden sm:table-cell">Role</th>
                                <th className="p-4 text-sm font-medium text-[#6B7280] hidden md:table-cell">Permissions</th>
                                <th className="p-4 text-sm font-medium text-[#6B7280]">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teamMembers.map(member => (
                                <tr key={member.id} className="border-b border-[#E5E7EB] last:border-b-0 hover:bg-gray-50">
                                    <td className="p-4">
                                        <p className="font-semibold text-[#111827]">{member.name}</p>
                                        <p className="text-xs text-[#6B7280]">{member.email}</p>
                                    </td>
                                    <td className="p-4 hidden sm:table-cell">
                                        <span className="bg-gray-100 text-gray-700 rounded-full px-3 py-1 text-sm font-medium">{member.role}</span>
                                    </td>
                                    <td className="p-4 hidden md:table-cell">
                                        <span className="rounded-full px-3 py-1 text-sm font-medium bg-purple-100 text-purple-800">
                                            {member.permissions?.access?.join(', ') || 'Restricted'}
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
                <form onSubmit={handleInvite}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-[#111827] mb-2">Email Address</label>
                        <input 
                            type="email" 
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="new.teammate@example.com" 
                            className="w-full bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D]" 
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#111827] mb-2">What can this person do?</label>
                        <select 
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value)}
                            className="w-full bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#15803D]"
                        >
                            <option value="Member">Member</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>
                </div>
                <div className="mt-6 flex justify-end items-center space-x-4">
                     <button type="submit" className="bg-[#15803D] hover:bg-[#166534] text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 00-2-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        Send Invite via Email
                     </button>
                </div>
                </form>
            </div>
        </div>
    );
};

export default TeamView;
