
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalTasks: 0, totalClients: 0, totalDeals: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch counts directly from the tables
        const { count: taskCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true });
        const { count: clientCount } = await supabase.from('clients').select('*', { count: 'exact', head: true });
        const { count: dealCount } = await supabase.from('deals').select('*', { count: 'exact', head: true });
        
        // Fetch team members to display as "Users"
        // Updated to use 'organization_members' as 'team_members' is deprecated in new schema
        const { data: teamMembers } = await supabase.from('organization_members').select('*').order('created_at', { ascending: false });

        setStats({
          totalTasks: taskCount || 0,
          totalClients: clientCount || 0,
          totalDeals: dealCount || 0
        });
        setUsers(teamMembers || []);
      } catch (e) {
        console.error("Admin fetch error", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return (
      <div className="flex h-full items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
  );

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#1A1A1A]">Super Admin Dashboard</h2>
          <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded uppercase">Restricted Access</span>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total Clients</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalClients}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total Deals</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalDeals}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Tasks Created</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalTasks}</p>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-700">Team Members / Users</h3>
          <span className="text-xs text-gray-500">Rows: {users.length}</span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Status</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {users.length > 0 ? (
                    users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                        <td className="px-6 py-4 text-gray-600">{user.email}</td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                            {user.role || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {user.status}
                        </span>
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No team members found.</td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
