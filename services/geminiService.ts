
import { GoogleGenAI } from "@google/genai";
import { Role } from "../types.ts";

const MODEL_NAME = 'gemini-3-pro-preview';
const OWNER_EMAIL = 'bodinizo2017@gmail.com';

export async function sendMessage(
  prompt: string, 
  history: any[], 
  isDeepSearch: boolean,
  isStudyMode: boolean = false,
  selectedBook?: string,
  lang: 'EN' | 'AR' = 'EN',
  isCodingMode: boolean = false,
  personality: string = 'Tutor',
  userEmail?: string 
): Promise<{ text: string; sources: any[] }> {
  console.log("%c [API] ", "background: #f59e0b; color: white", "Sending prompt to Gemini...", { isDeepSearch, personality });
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const contents = history.map(msg => ({
    role: msg.role === Role.USER ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  const isAR = lang === 'AR';
  const isVerifiedOwner = userEmail === OWNER_EMAIL;

  const systemInstruction = `
    Identity: Helpfulat Assistant. 
    Creator: Bodinizo.
    Current Language: ${lang}.
    Deep Search: ${isDeepSearch ? 'ENABLED' : 'DISABLED'}.
    Verified Owner: ${isVerifiedOwner ? 'YES' : 'NO'}.
    Personality: ${personality}.
    ${isStudyMode ? 'Study Mode Active: Guiding students without giving answers immediately.' : ''}
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
        systemInstruction: systemInstruction
      },
    });

    console.log("%c [API] ", "background: #10b981; color: white", "Response received.");
    
    const text = response.text || "No response text.";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { text, sources };
  } catch (error) {
    console.error("%c [API ERROR] ", "background: #ef4444; color: white", error);
    throw error;
  }
}
