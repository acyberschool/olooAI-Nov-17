
import React, { useState } from 'react';
import { HRCandidate, HREmployee } from '../types';
import { useKanban } from '../hooks/useKanban';
import Tabs from './Tabs';

interface HRViewProps {
    candidates: HRCandidate[];
    employees: HREmployee[];
    kanbanApi: ReturnType<typeof useKanban>;
}

const HRView: React.FC<HRViewProps> = ({ candidates, employees, kanbanApi }) => {
    const [activeTab, setActiveTab] = useState('Recruitment');
    const [newCandidateName, setNewCandidateName] = useState('');
    const [newCandidateRole, setNewCandidateRole] = useState('');
    const [newCandidateEmail, setNewCandidateEmail] = useState('');

    const handleAddCandidate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCandidateName.trim()) {
            kanbanApi.addCandidate({ 
                name: newCandidateName, 
                roleApplied: newCandidateRole || 'General Application',
                email: newCandidateEmail || 'pending@email.com'
            });
            setNewCandidateName('');
            setNewCandidateRole('');
            setNewCandidateEmail('');
        }
    }

    return (
        <div>
            <h2 className="text-2xl font-semibold text-brevo-text-primary mb-6">HR & Team</h2>
            <Tabs tabs={['Recruitment', 'Team']} activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <div className="mt-6">
                {activeTab === 'Recruitment' ? (
                    <div>
                        <form onSubmit={handleAddCandidate} className="mb-8 bg-white p-4 rounded-xl border border-gray-200 shadow-sm max-w-3xl">
                            <h3 className="text-sm font-bold text-gray-700 mb-3">Add New Candidate</h3>
                            <div className="flex flex-wrap gap-3">
                                <input 
                                    type="text" 
                                    value={newCandidateName}
                                    onChange={(e) => setNewCandidateName(e.target.value)}
                                    placeholder="Candidate Name" 
                                    className="flex-1 p-2 border border-gray-300 rounded-lg shadow-sm min-w-[200px]"
                                    required
                                />
                                <input 
                                    type="text" 
                                    value={newCandidateRole}
                                    onChange={(e) => setNewCandidateRole(e.target.value)}
                                    placeholder="Role (e.g. Sales Rep)" 
                                    className="flex-1 p-2 border border-gray-300 rounded-lg shadow-sm min-w-[150px]"
                                />
                                <input 
                                    type="email" 
                                    value={newCandidateEmail}
                                    onChange={(e) => setNewCandidateEmail(e.target.value)}
                                    placeholder="Email" 
                                    className="flex-1 p-2 border border-gray-300 rounded-lg shadow-sm min-w-[200px]"
                                />
                                <button type="submit" className="bg-brevo-cta text-white px-4 py-2 rounded-lg font-bold hover:bg-brevo-cta-hover">Add</button>
                            </div>
                        </form>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {['Applied', 'Interview', 'Hired'].map(status => (
                                <div key={status} className="bg-gray-50 p-4 rounded-xl border border-gray-200 min-h-[400px]">
                                    <h3 className="font-bold text-gray-700 mb-4 flex justify-between">
                                        {status} 
                                        <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">{candidates.filter(c => c.status === status).length}</span>
                                    </h3>
                                    <div className="space-y-3">
                                        {candidates.filter(c => c.status === status).map(c => (
                                            <div key={c.id} className="bg-white p-3 rounded shadow-sm border border-gray-100">
                                                <p className="font-medium">{c.name}</p>
                                                <p className="text-xs text-gray-500">{c.roleApplied}</p>
                                                <p className="text-xs text-blue-500 mt-1">{c.email}</p>
                                            </div>
                                        ))}
                                        {candidates.filter(c => c.status === status).length === 0 && (
                                            <p className="text-xs text-gray-400 text-center py-4">No candidates</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Role</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {employees.map(emp => (
                                    <tr key={emp.id}>
                                        <td className="px-6 py-4 font-medium">{emp.name}</td>
                                        <td className="px-6 py-4 text-gray-600">{emp.role}</td>
                                        <td className="px-6 py-4 text-gray-600">{emp.type}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">{emp.status}</span>
                                        </td>
                                    </tr>
                                ))}
                                {employees.length === 0 && (
                                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No employees recorded.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HRView;
