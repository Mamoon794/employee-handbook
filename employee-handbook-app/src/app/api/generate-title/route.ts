import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, chatId, userId } = await req.json();

    // calling fastAPI endpoint
    const fastApiResponse = await fetch('http://localhost:8000/generate-title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, chatId, userId }),
    });

    if (!fastApiResponse.ok) throw new Error('Failed to generate title');
    
    const { title } = await fastApiResponse.json();

    // updating title
    const updateResponse = await fetch('http://localhost:3000/api/update-title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, title }),
    });

    if (!updateResponse.ok) throw new Error('Failed to save title');
    
    return NextResponse.json({ title });
  } catch (error) {
    return NextResponse.json(
      { title: "New Chat" }, 
      { status: 200 }
    );
  }
}