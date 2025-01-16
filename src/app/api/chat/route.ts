import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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

    const completion = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return NextResponse.json({
      message: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
} 