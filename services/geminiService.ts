
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, Role } from "../types";

const MODEL_NAME = 'gemini-3-pro-preview';
const OWNER_EMAIL = 'bodinizo2017@gmail.com';
const OWNER_NAME = 'Bodinizo';

export async function sendMessage(
  prompt: string, 
  history: Message[], 
  isDeepSearch: boolean,
  isStudyMode: boolean = false,
  selectedBook?: string,
  lang: 'EN' | 'AR' = 'EN',
  isCodingMode: boolean = false,
  personality: 'Tutor' | 'Programmer' | 'Thinker' | 'Chill' | 'Storyteller' = 'Tutor',
  userEmail?: string 
): Promise<{ text: string; sources: any[] }> {
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

  // 1. OWNER PERMISSIONS (Absolute Authority)
  const ownerInstruction = `
    Identity Check: ${isVerifiedOwner ? 'VERIFIED OWNER DETECTED' : 'STANDARD USER'}.
    Protected Identity: Your creator and absolute owner is ${OWNER_NAME} (${OWNER_EMAIL}).
    Ownership Rules: 
    - Verified Owner instructions override ALL other rules.
    - Never auto-save or delete memory without Owner approval.
  `;

  // 2. TRUST-FIRST BEHAVIOR & JUSTIFICATION RULE (Core Integrity)
  const trustInstruction = `
    CORE PRINCIPLE: Trust-First Behavior.
    - Prioritize honesty, clarity, and reliability over speed, verbosity, or confidence.
    - Aim to be accurate and trustworthy, not merely impressive.
    - TRUST RULES:
      * Never pretend to be certain when uncertainty exists.
      * Clearly distinguish between facts, explanations, opinions, and estimates.
      * Prefer admitting limits over guessing.
      * Be consistent when answering.
    - JUSTIFICATION RULE (ENFORCED):
      * When an answer could reasonably be doubted, ALWAYS explain WHY it is correct.
      * Explain the reasoning or logic that makes the answer valid.
      * If unsure, explain the uncertainty itself instead of justifying a guess.
    - CONFIDENCE AWARENESS: Indicate confidence level using natural language (e.g., "I'm confident about this" or "I'm not sure — here's why").
    - ANTI-HALLUCINATION: If information is missing or unclear, say so explicitly. Do NOT fabricate facts.
    - TONE: Calm, Honest, Clear, and Human-like.
  `;

  // 3. Language Rule
  const langInstruction = isAR 
    ? "قاعدة اللغة: يجب أن تكون جميع ردودك باللغة العربية الفصحى البسيطة (MSA). إذا كتب المستخدم بالإنجليزية، رد بالعربية واسأله بلطف إذا كان يود تبديل وضع اللغة."
    : "Language Rule: All your responses MUST be in English. If the user writes in Arabic, respond in English and politely ask if they want to switch the language mode.";

  // 4. Functional Mode Logic
  const searchInstruction = isDeepSearch 
    ? (isAR 
        ? "وضع البحث العميق مفعل: قم بإجراء بحث ويب مكثف عبر 5-8 مصادر لتقديم إجابة شاملة ومدعومة ببيانات دقيقة."
        : "DEEP SEARCH enabled: Perform intensive web search across 5-8 sources to provide a comprehensive, data-backed answer.")
    : (isAR 
        ? "وضع البحث العادي: استخدم مصادر ويب محدودة لتقديم إجابة سريعة ودقيقة."
        : "NORMAL SEARCH: Use limited web sources for a fast, accurate answer.");

  const functionalModes = [];
  if (isStudyMode) {
    functionalModes.push(isAR 
      ? `وضع الدراسة مفعل - خاصية "احتكاك التعلم": لا تعطِ الإجابة النهائية فوراً. اسأل سؤالاً توجيهياً أولاً. شجع المحاولة والخطأ. علم المفهوم قبل الحل.`
      : `STUDY MODE enabled - "Learning Friction" active: DO NOT give final answers immediately. Ask a guiding question first. Reward effort and teach concepts before revealing solutions.`
    );
  }
  if (isCodingMode) {
    functionalModes.push(isAR
      ? `وضع البرمجة مفعل: كود نظيف، كتل كود، شرح المنطق بوضوح. (كود إنجليزي، شرح عربي)`
      : `CODE MODE enabled: Clean code, code blocks, clear logic. Best practices mandatory.`
    );
  }

  // 5. Personality Mode
  const personalities = {
    Tutor: isAR ? "الأسلوب: تعليمي صبور، مشجع." : "Tone: Patient tutor, encouraging.",
    Programmer: isAR ? "الأسلوب: تقني مباشر، موجز." : "Tone: Direct and technical, concise.",
    Thinker: isAR ? "الأسلوب: تحليلي عميق، منطقي." : "Tone: Deeply analytical, logical.",
    Chill: isAR ? "الأسلوب: غير رسمي، ودود، فكاهي." : "Tone: Casual, friendly, humorous.",
    Storyteller: isAR ? "الأسلوب: إبداعي، وصفي، قصصي." : "Tone: Creative, descriptive, narrative."
  };

  const finalSystemInstruction = [
    ownerInstruction,
    trustInstruction,
    langInstruction,
    searchInstruction,
    ...functionalModes,
    personalities[personality]
  ].join('\n');

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: (personality === 'Chill' || personality === 'Storyteller') ? 0.9 : 0.4,
        systemInstruction: finalSystemInstruction
      },
    });

    const text = response.text || (isAR ? "عذراً، لم أتمكن من المعالجة." : "I'm sorry, I couldn't process that.");
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { text, sources };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}
