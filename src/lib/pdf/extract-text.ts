export async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  try {
    console.log('Creating form data with PDF buffer, size:', buffer.byteLength);
    const formData = new FormData();
    const blob = new Blob([buffer], { type: 'application/pdf' });
    formData.append('file', blob);
    console.log('Blob created, size:', blob.size);
    
    console.log('Sending request to /api/parse-pdf...');
    const response = await fetch('/api/parse-pdf', {
      method: 'POST',
      body: formData,
      // Increase timeout and disable response size limit
      signal: AbortSignal.timeout(300000), // 5 minutes timeout
    });
    
    console.log('Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PDF parsing failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      let errorMessage = 'Failed to parse PDF';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        console.error('Failed to parse error response:', e);
      }
      
      throw new Error(errorMessage);
    }

    console.log('Parsing response...');
    const text = await response.text();
    console.log('Response received, length:', text.length);
    
    try {
      const data = JSON.parse(text);
      if (!data.text) {
        throw new Error('No text content found in PDF');
      }
      console.log('Text extracted successfully, length:', data.text.length);
      return data.text;
    } catch (e) {
      console.error('Failed to parse response JSON:', e);
      throw new Error('Invalid response format from PDF parser');
    }
  } catch (error) {
    console.error('Error in extractTextFromPDF:', error);
    throw error instanceof Error ? error : new Error('Failed to extract text from PDF');
  }
} 