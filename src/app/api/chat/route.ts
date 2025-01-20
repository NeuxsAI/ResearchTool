import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { messages, highlightedText } = await request.json();

    // Prepare the messages for the API
    const apiMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    // If there's highlighted text, add it as context
    if (highlightedText) {
      apiMessages.unshift({
        role: "system",
        content: `The user has highlighted the following text: "${highlightedText}". Please consider this context when responding.`,
      });
    }

    // Add base system message
    apiMessages.unshift({
      role: "system",
      content: "You are a helpful research assistant. Your goal is to help users understand academic concepts, papers, and research. Provide clear, concise, and accurate responses. When appropriate, cite relevant papers or research to support your explanations.",
    });

    // Create stream
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
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
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
} 