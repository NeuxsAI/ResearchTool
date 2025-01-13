import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that extracts metadata from academic papers. Always respond with valid JSON."
        },
        {
          role: "user",
          content: `Extract the following information from this academic paper:
- Title
- Authors (as a list)
- Year of publication
- Abstract

Format the response as JSON with the following structure:
{
  "title": "paper title",
  "authors": ["author 1", "author 2"],
  "year": YYYY,
  "abstract": "paper abstract"
}

Paper content:
${text.slice(0, 4000)}`
        }
      ]
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response content from OpenAI");
    }
    
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '');
    return NextResponse.json(JSON.parse(cleanedContent));
  } catch (error) {
    console.error("Error parsing paper:", error);
    return NextResponse.json({ error: "Failed to parse paper" }, { status: 500 });
  }
}
