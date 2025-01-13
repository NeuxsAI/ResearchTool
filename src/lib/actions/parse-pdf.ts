'use server';

import pdfParse from 'pdf-parse';

export async function parsePDF(file: File) {
  try {
    // Convert file to buffer in chunks to handle large files
    const chunks: Uint8Array[] = [];
    const reader = file.stream().getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const buffer = Buffer.concat(chunks);
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file');
  }
} 