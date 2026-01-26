import { NextRequest, NextResponse } from 'next/server';
import { createWelcomeNotification } from '@/app/actions/notifications/notifications';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    await createWelcomeNotification(userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error creating welcome notification:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
