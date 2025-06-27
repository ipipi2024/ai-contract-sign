// lib/documentParser.ts

export async function parseDocument(file: File): Promise<string> {
  const fileType = file.type;
  
  try {
    // For text files, parse client-side for speed
    if (fileType === 'text/plain' || fileType === 'text/markdown') {
      return await parseTextFile(file);
    }
    
    // For other file types, use server-side parsing
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload/parse', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to parse document');
    }
    
    const result = await response.json();
    return result.text;
    
  } catch (error) {
    console.error('Error parsing document:', error);
    throw error;
  }
}

async function parseTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}