import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'edge';

async function getRelevantContext(paperId: string, query: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_RAG_API_URL}/papers/${paperId}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        paper_id: paperId,
        limit: 5  // Get top 5 most relevant chunks
      })
    });

    if (!response.ok) {
      console.error('Failed to fetch RAG context:', await response.text());
      return null;
    }

    const results = await response.json();
    return results.map((r: any) => r.chunk_text).join('\n\n');
  } catch (error) {
    console.error('Error fetching RAG context:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { messages, paperId, highlightedText } = await request.json();

    if (!paperId) {
      throw new Error('Paper ID is required');
    }

    // Get the user's latest message
    const userMessage = messages[messages.length - 1];
    if (!userMessage || userMessage.role !== 'user') {
      throw new Error('Invalid message format');
    }

    // Get relevant context from RAG service
    const relevantContext = await getRelevantContext(paperId, userMessage.content);

    // Prepare the messages for the API
    const apiMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add context from RAG as system message
    if (relevantContext) {
      apiMessages.unshift({
        role: "system",
        content: `Here is relevant context from the paper:\n\n${relevantContext}\n\nUse this context to inform your response.`,
      });
    }

    // If there's highlighted text, add it as additional context
    if (highlightedText) {
      apiMessages.unshift({
        role: "system",
        content: `The user has highlighted the following text: "${highlightedText}". Consider this specific context in your response.`,
      });
    }

    // Add base system message
    apiMessages.unshift({
      role: "system",
      content: "You are a helpful research assistant with deep understanding of the paper being discussed. Your goal is to help users understand the paper's concepts, methodology, and findings. Use the provided context to give accurate, specific responses that demonstrate thorough knowledge of the paper's content. When appropriate, quote or reference specific parts of the paper to support your explanations.",
    });

    // Create stream
    const stream = await openai.chat.completions.create({
      model: "gpt-4",
      messages: apiMessages,
      stream: true,
    });

    // Create a TransformStream to handle the streaming response
    const encoder = new TextEncoder();
    const customStream = new TransformStream({
      async transform(chunk, controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk.choices[0]?.delta?.content || "" })}\n\n`));
      },
    });

    // Pipe the OpenAI stream through our transform stream
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          controller.enqueue(chunk);
        }
        controller.close();
      },
    });

    return new Response(readable.pipeThrough(customStream), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process chat request" },
      { status: 500 }
    );
  }
} 