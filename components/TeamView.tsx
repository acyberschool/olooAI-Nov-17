
import React, { useState } from 'react';
import { useKanban } from '../hooks/useKanban';
import { Role } from '../types';

const PlusIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>);
const GoogleIcon = () => (<svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>);

const TeamView: React.FC = () => {
    const { teamMembers, inviteMember } = useKanban();
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('Handle everything (All access)');

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (inviteEmail) {
            // 1. Add to local list (visual feedback)
            inviteMember(inviteEmail, { scope: 'All access', permission: 'Can edit' } as Role);
            
            // 2. Construct mailto link for real sending
            const subject = encodeURIComponent("Invitation to join olooAI Workspace");
            const body = encodeURIComponent(`Hi,\n\nI'm inviting you to join our workspace on olooAI. We'll be using it to manage tasks, clients, and projects.\n\nPlease accept the invite to get started.\n\nBest,\nAdmin`);
            
            // Open default email client
            window.location.href = `mailto:${inviteEmail}?subject=${subject}&body=${body}`;
            
            setInviteEmail('');
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h2 className="text-2xl font-semibold text-[#15803D] mb-2 sm:mb-0">Team & Access</h2>
                 <button onClick={() => alert("Authentication is simulated for this demo.")} className="bg-white text-gray-700 font-medium py-2 px-4 rounded border border-gray-300 hover:bg-gray-50 flex items-center">
                    <GoogleIcon />
                    Sign in with Google
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
                            {teamMembers.map(member => (
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
                <div className="mt-6 flex justify-end items-center space-x-4">
                     <button type="submit" className="bg-[#15803D] hover:bg-[#166534] text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        Send Invite via Email
                     </button>
                </div>
                </form>
            </div>
        </div>
    );
};

export default TeamView;
