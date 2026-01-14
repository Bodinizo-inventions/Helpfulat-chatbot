import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error('VITE_GEMINI_API_KEY environment variable is not set');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

export async function generateResponse(messages: Array<{ role: string; content: string }>, deepSearch: boolean) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
    });

    const systemPrompt = `Identity: Helpfulat Assistant. Creator: Bodinizo. Deep Search: ${deepSearch}. When users ask for research or deep information, provide comprehensive, well-researched answers with citations to sources where possible.`;

    const contents = [
      {
        role: 'user' as const,
        parts: [{ text: systemPrompt }],
      },
      ...messages.map((msg) => ({
        role: msg.role === 'user' ? ('user' as const) : ('model' as const),
        parts: [{ text: msg.content }],
      })),
    ];

    const response = await model.generateContent({
      contents: contents as any,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
    });

    const result = response.response.text();
    
    // Parse sources from the response text if they're included
    const sources: any[] = [];
    // Try to extract URLs from the text
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = result.match(urlRegex);
    if (matches) {
      matches.forEach((url) => {
        sources.push({
          web: {
            uri: url,
            title: url.substring(url.lastIndexOf('/') + 1) || 'Research Link',
          },
        });
      });
    }

    return {
      text: result,
      sources: sources,
    };
  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
  }
}
