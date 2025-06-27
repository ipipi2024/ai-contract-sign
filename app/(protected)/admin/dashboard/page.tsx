// app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Calendar,
  UserCheck,
  Shield,
  CreditCard,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalContracts: number;
  usersByPlan: {
    free: number;
    pro: number;
    enterprise: number;
  };
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    plan: string;
    createdAt: string;
    lastLoginAt?: string;
  }>;
  contractsOverview: {
    total: number;
    completed: number;
    pending: number;
    draft: number;
  };
  recentContracts: Array<{
    id: string;
    title: string;
    status: string;
    createdBy: string;
    createdAt: string;
  }>;
}

interface PaginatedUsers {
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    plan: string;
    contractsCreated: number;
    createdAt: string;
    lastLoginAt?: string;
  }>;
  total: number;
  page: number;
  totalPages: number;
}

interface PaginatedContracts {
  contracts: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    createdBy: string;
    parties: Array<{
      name: string;
      email: string;
      signed: boolean;
    }>;
    createdAt: string;
    updatedAt: string;
  }>;
  total: number;
  page: number;
  totalPages: number;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'contracts'>('overview');
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalContracts: 0,
    usersByPlan: {
      free: 0,
      pro: 0,
      enterprise: 0
    },
    recentUsers: [],
    contractsOverview: {
      total: 0,
      completed: 0,
      pending: 0,
      draft: 0
    },
    recentContracts: []
  });
  const [users, setUsers] = useState<PaginatedUsers>({
    users: [],
    total: 0,
    page: 1,
    totalPages: 1
  });
  const [contracts, setContracts] = useState<PaginatedContracts>({
    contracts: [],
    total: 0,
    page: 1,
    totalPages: 1
  });
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [contractSearch, setContractSearch] = useState('');
  const [userPlanFilter, setUserPlanFilter] = useState('all');
  const [contractStatusFilter, setContractStatusFilter] = useState('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session?.user) {
      checkAdminAccess();
    }
  }, [status, session, router]);

  const checkAdminAccess = async () => {
    try {
      const res = await fetch('/api/admin/check');
      if (!res.ok) {
        router.push('/dashboard/contracts');
        return;
      }
      loadAdminStats();
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/dashboard/contracts');
    }
  };

  const loadAdminStats = async () => {
    try {
      setError(null);
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('Failed to fetch admin stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      setError('Failed to load admin data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (page: number = 1) => {
    try {
      setUsersLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        search: userSearch,
        plan: userPlanFilter
      });
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setUsersLoading(false);
    }
  };

  const loadContracts = async (page: number = 1) => {
    try {
      setContractsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        search: contractSearch,
        status: contractStatusFilter
      });
      const res = await fetch(`/api/admin/contracts?${params}`);
      if (!res.ok) throw new Error('Failed to fetch contracts');
      const data = await res.json();
      setContracts(data);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      setError('Failed to load contracts. Please try again.');
    } finally {
      setContractsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users' && !loading) {
      loadUsers(1);
    }
  }, [activeTab, userSearch, userPlanFilter]);

  useEffect(() => {
    if (activeTab === 'contracts' && !loading) {
      loadContracts(1);
    }
  }, [activeTab, contractSearch, contractStatusFilter]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && activeTab === 'overview') {
    return (
      <div className="p-6 sm:p-8 lg:p-10">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error}</p>
          <button 
            onClick={loadAdminStats}
            className="ml-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Loading skeleton for table rows
  const TableRowSkeleton = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mt-1"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-8"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </td>
    </tr>
  );

  const ContractRowSkeleton = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-16"></div>
        <div className="h-3 bg-gray-200 rounded w-12 mt-1"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </td>
    </tr>
  );

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
        <p className="text-gray-600">Monitor your platform's performance and user activity</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Users ({stats.totalUsers})
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'contracts'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Contracts ({stats.totalContracts})
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Contracts</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalContracts}</p>
                </div>
                <FileText className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pro Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.usersByPlan.pro}</p>
                </div>
                <CreditCard className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Enterprise Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.usersByPlan.enterprise}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
          </div>

          {/* Plan Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">User Plan Distribution</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gray-400 rounded"></div>
                  <span className="text-sm text-gray-700">Free Plan</span>
                </div>
                <span className="text-sm font-medium">{stats.usersByPlan.free} users</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-purple-600 rounded"></div>
                  <span className="text-sm text-gray-700">Pro Plan</span>
                </div>
                <span className="text-sm font-medium">{stats.usersByPlan.pro} users</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-indigo-600 rounded"></div>
                  <span className="text-sm text-gray-700">Enterprise Plan</span>
                </div>
                <span className="text-sm font-medium">{stats.usersByPlan.enterprise} users</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Users */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h2>
              <div className="space-y-3">
                {stats.recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <UserCheck className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        user.plan === 'enterprise' ? 'bg-indigo-100 text-indigo-800' :
                        user.plan === 'pro' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.plan}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Contracts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Contracts</h2>
              <div className="space-y-3">
                {stats.recentContracts.map((contract) => (
                  <div key={contract.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{contract.title}</p>
                        <p className="text-xs text-gray-600">by {contract.createdBy}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        contract.status === 'completed' ? 'bg-green-100 text-green-800' :
                        contract.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {contract.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(contract.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contracts Overview */}
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contracts Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{stats.contractsOverview.total}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">{stats.contractsOverview.completed}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-700">{stats.contractsOverview.pending}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-700">{stats.contractsOverview.draft}</p>
                <p className="text-sm text-gray-600">Draft</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <select
                value={userPlanFilter}
                onChange={(e) => setUserPlanFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Plans</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contracts</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usersLoading ? (
                  <>
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                  </>
                ) : users.users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No users found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  users.users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          user.plan === 'enterprise' ? 'bg-indigo-100 text-indigo-800' :
                          user.plan === 'pro' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.contractsCreated}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!usersLoading && users.users.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Showing {((users.page - 1) * 10) + 1} to {Math.min(users.page * 10, users.total)} of {users.total} users
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => loadUsers(users.page - 1)}
                  disabled={users.page === 1}
                  className={`px-3 py-1 rounded-md ${
                    users.page === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-4 py-1 text-sm text-gray-700">
                  Page {users.page} of {users.totalPages}
                </span>
                <button
                  onClick={() => loadUsers(users.page + 1)}
                  disabled={users.page === users.totalPages}
                  className={`px-3 py-1 rounded-md ${
                    users.page === users.totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contracts Tab */}
      {activeTab === 'contracts' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search contracts by title..."
                  value={contractSearch}
                  onChange={(e) => setContractSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <select
                value={contractStatusFilter}
                onChange={(e) => setContractStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="signed">Signed</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parties</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contractsLoading ? (
                  <>
                    <ContractRowSkeleton />
                    <ContractRowSkeleton />
                    <ContractRowSkeleton />
                    <ContractRowSkeleton />
                    <ContractRowSkeleton />
                  </>
                ) : contracts.contracts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No contracts found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  contracts.contracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">{contract.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 capitalize">{contract.type}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          contract.status === 'completed' ? 'bg-green-100 text-green-800' :
                          contract.status === 'signed' ? 'bg-blue-100 text-blue-800' :
                          contract.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {contract.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {contract.createdBy}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {contract.parties.length} parties
                          <div className="text-xs text-gray-500">
                            {contract.parties.filter(p => p.signed).length} signed
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(contract.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(contract.updatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!contractsLoading && contracts.contracts.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Showing {((contracts.page - 1) * 10) + 1} to {Math.min(contracts.page * 10, contracts.total)} of {contracts.total} contracts
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => loadContracts(contracts.page - 1)}
                  disabled={contracts.page === 1}
                  className={`px-3 py-1 rounded-md ${
                    contracts.page === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-4 py-1 text-sm text-gray-700">
                  Page {contracts.page} of {contracts.totalPages}
                </span>
                <button
                  onClick={() => loadContracts(contracts.page + 1)}
                  disabled={contracts.page === contracts.totalPages}
                  className={`px-3 py-1 rounded-md ${
                    contracts.page === contracts.totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}