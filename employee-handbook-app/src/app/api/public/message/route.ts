import { NextRequest, NextResponse } from "next/server";

interface PublicMessageRequest {
  province: string;
  question: string;
}

interface LLMDocument {
  id: string;
  page_content: string;
  metadata: {
    source: string;
    start_index: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface AIState {
  question: string;
  context: LLMDocument[];
  answer: string;
}

// shape returned by FastAPI @app.post("/responses")
type PublicMessageResponse = {
  response: AIState;
};

export async function POST(req: NextRequest) {
  let body: PublicMessageRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { province, question } = body;
  if (!province || !question.trim()) {
    return NextResponse.json(
      { error: "Missing province or question" },
      { status: 400 }
    );
  }

  const serviceUrl = process.env.AI_SERVICE_URL;
  if (!serviceUrl) {
    console.error("AI_SERVICE_URL not set");
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${serviceUrl}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("AIService error:", text);
      return NextResponse.json(
        { error: "Upstream service error" },
        { status: 502 }
      );
    }

    const data = (await res.json()) as PublicMessageResponse;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      { error: "Failed to reach AI service" },
      { status: 502 }
    );
  }
}
