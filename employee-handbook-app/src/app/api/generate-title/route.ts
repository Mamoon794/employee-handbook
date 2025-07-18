import { NextResponse } from 'next/server';
import { updateChatTitle } from '@/models/dbOperations';



export async function POST(req: Request) {
  try {
    const { message, chatId, userId } = await req.json();
    console.log("URL", process.env.AI_SERVICE_URL);
    // calling fastAPI endpoint
    const fastApiResponse = await fetch(
      `${process.env.AI_SERVICE_URL}/generate-title`, 
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, chatId, userId }),
      }
    );

    if (!fastApiResponse.ok) throw new Error('Failed to generate title');
    
    const { title } = await fastApiResponse.json();

    // updating title
    await updateChatTitle(chatId, title);

    
    return NextResponse.json({ title });
  } catch (error) {
    console.error('Error generating title:', error);
    return NextResponse.json(
      { title: "New Chat", error: 'Failed to save title' }, 
      { status: 200 }
    );
  }
}
