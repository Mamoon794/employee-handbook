import { NextResponse } from 'next/server';
import { updateChatTitle } from '@/models/dbOperations';

export async function POST(req: Request) {
  try {
    const { chatId, title } = await req.json();
    await updateChatTitle(chatId, title);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating title:', error);
    return NextResponse.json(
      { error: 'Failed to update title' },
      { status: 500 }
    );
  }
}