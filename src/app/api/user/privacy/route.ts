import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { maskEmail, RETENTION_POLICY } from '@/lib/privacy';

/**
 * GET /api/user/privacy - Get user's data summary
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [user, formsCount, submissionsCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true, createdAt: true },
      }),
      prisma.form.count({ where: { userId: session.user.id } }),
      prisma.submission.count({ where: { form: { userId: session.user.id } } }),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email ? maskEmail(user.email) : null,
        memberSince: user.createdAt,
      },
      dataSummary: {
        formsCreated: formsCount,
        submissionsReceived: submissionsCount,
      },
      retentionPolicy: RETENTION_POLICY,
    });
  } catch (error) {
    console.error('Privacy settings error:', error);
    return NextResponse.json({ error: 'Failed to retrieve data' }, { status: 500 });
  }
}

/**
 * POST /api/user/privacy - Export or delete data
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, options } = await req.json();
    const userId = session.user.id;

    if (action === 'export') {
      const [user, forms, submissions] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, email: true, createdAt: true },
        }),
        prisma.form.findMany({
          where: { userId },
          select: { id: true, title: true, createdAt: true },
        }),
        prisma.submission.findMany({
          where: { form: { userId } },
          select: { id: true, formId: true, createdAt: true },
        }),
      ]);

      return NextResponse.json({
        success: true,
        data: { user, forms, submissions: submissions.length },
        exportedAt: new Date().toISOString(),
      });
    }

    if (action === 'delete') {
      const { deleteSubmissions, deleteForms, deleteAccount, confirmEmail } = options || {};
      const result = { submissionsDeleted: 0, formsDeleted: 0, accountDeleted: false };

      if (deleteAccount) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true },
        });
        if (!user?.email || confirmEmail !== user.email) {
          return NextResponse.json({ error: 'Email confirmation required' }, { status: 400 });
        }
        await prisma.user.delete({ where: { id: userId } });
        result.accountDeleted = true;
      } else {
        if (deleteSubmissions) {
          const forms = await prisma.form.findMany({ where: { userId }, select: { id: true } });
          const deleted = await prisma.submission.deleteMany({
            where: { formId: { in: forms.map(f => f.id) } },
          });
          result.submissionsDeleted = deleted.count;
        }
        if (deleteForms) {
          const deleted = await prisma.form.deleteMany({ where: { userId } });
          result.formsDeleted = deleted.count;
        }
      }

      return NextResponse.json({ success: true, deleted: result });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Privacy action error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
