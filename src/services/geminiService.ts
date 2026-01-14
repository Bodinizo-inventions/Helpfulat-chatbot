import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error('VITE_GEMINI_API_KEY environment variable is not set');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

export async function generateResponse(messages: Array<{ role: string; content: string }>, deepSearch: boolean) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      systemInstruction: `Identity: Helpfulat Assistant. Creator: Bodinizo. Deep Search: ${deepSearch}.`,
    });

    const contents = messages.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const response = await model.generateContent({
      contents: contents as any,
      generationConfig: {
        temperature: 1,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
      },
    });

    const result = response.response.text();
    const sources = response.response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return {
      text: result,
      sources: sources.map((chunk: any) => ({
        web: {
          uri: chunk.web?.uri || '',
          title: chunk.web?.title || 'Research Link',
        },
      })),
    };
  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
  }
}
