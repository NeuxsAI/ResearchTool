interface ParsedPaper {
  title: string;
  authors: string[];
  year: number;
  abstract: string;
}

export async function parsePaperContent(text: string): Promise<ParsedPaper> {
  try {
    const response = await fetch('/api/parse-paper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!response.ok) throw new Error('Failed to parse paper');
    
    const result = await response.json();
    return {
      title: result.title || "",
      authors: result.authors || [],
      year: result.year || new Date().getFullYear(),
      abstract: result.abstract || ""
    };
  } catch (error) {
    console.error("Error parsing paper:", error);
    throw new Error("Failed to parse paper metadata");
  }
} 