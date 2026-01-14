
import { GoogleGenAI } from "@google/genai";
import { Role } from "../types.js";

const MODEL_NAME = 'gemini-3-pro-preview';
window.log("LOAD", "geminiService.js loaded.");

export async function sendMessage(prompt, history, isDeepSearch, isStudyMode = false, selectedBook, lang = 'EN', isCodingMode = false, personality = 'Tutor') {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const contents = history.map(msg => ({
    role: msg.role === Role.USER ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));
  contents.push({ role: 'user', parts: [{ text: prompt }] });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
        systemInstruction: `Helpfulat. Creator: Bodinizo. Lang: ${lang}. Search: ${isDeepSearch}.`
      },
    });
    return { 
      text: response.text, 
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] 
    };
  } catch (error) {
    window.log("API-ERR", error.message, "#ef4444");
    throw error;
  }
}
