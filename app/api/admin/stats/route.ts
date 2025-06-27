// app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {connectToDatabase} from '@/lib/mongodb';
import User from '@/models/User';
import Contract from '@/models/Contract';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Verify admin access
    const adminUser = await User.findOne({ email: session.user.email });
    
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get total users
    const totalUsers = await User.countDocuments();
    
    // Get users by plan
    const usersByPlan = await User.aggregate([
      { $group: { _id: '$plan', count: { $sum: 1 } } }
    ]);
    
    const planCounts = {
      free: 0,
      pro: 0,
      enterprise: 0
    };
    
    usersByPlan.forEach(plan => {
      if (plan._id in planCounts) {
        planCounts[plan._id as keyof typeof planCounts] = plan.count;
      }
    });

    // Get recent users (last 5)
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email plan createdAt lastLoginAt');

    // Get total contracts
    const totalContracts = await Contract.countDocuments();
    
    // Get contracts by status
    const contractsByStatus = await Contract.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const contractsOverview = {
      total: totalContracts,
      completed: 0,
      pending: 0,
      draft: 0
    };
    
    contractsByStatus.forEach(status => {
      if (status._id === 'completed') contractsOverview.completed = status.count;
      else if (status._id === 'pending') contractsOverview.pending = status.count;
      else if (status._id === 'draft') contractsOverview.draft = status.count;
    });

    // Get recent contracts (last 5)
    const recentContracts = await Contract.find()
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status userId createdAt');

    const stats = {
      totalUsers,
      totalContracts,
      usersByPlan: planCounts,
      recentUsers: recentUsers.map(user => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        plan: user.plan,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      })),
      contractsOverview,
      recentContracts: recentContracts.map(contract => ({
        id: contract._id.toString(),
        title: contract.title,
        status: contract.status,
        createdBy: contract.userId?.name || 'Unknown',
        createdAt: contract.createdAt
      }))
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}