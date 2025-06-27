// app/api/admin/contracts/route.ts
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

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 10;
    const search = searchParams.get('search') || '';
    const statusFilter = searchParams.get('status') || 'all';

    // Build query
    const query: any = {};
    
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    
    if (statusFilter !== 'all') {
      query.status = statusFilter;
    }

    // Get total count
    const total = await Contract.countDocuments(query);
    
    // Get paginated contracts
    const contracts = await Contract.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      contracts: contracts.map(contract => ({
        id: contract._id.toString(),
        title: contract.title,
        type: contract.type,
        status: contract.status,
        createdBy: contract.userId?.name || 'Unknown',
        parties: contract.parties.map(party => ({
          name: party.name,
          email: party.email,
          signed: party.signed
        })),
        createdAt: contract.createdAt,
        updatedAt: contract.updatedAt
      })),
      total,
      page,
      totalPages
    });
  } catch (error) {
    console.error('Admin contracts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}