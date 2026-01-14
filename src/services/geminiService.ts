import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildMemoryContext, getSessionSummaries } from './memoryService';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error('VITE_GEMINI_API_KEY environment variable is not set');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

export async function generateResponse(
  messages: Array<{ role: string; content: string }>,
  deepSearch: boolean,
  personality: 'tutor' | 'programmer' | 'thinker' | 'chill' | 'storyteller' = 'tutor',
  codeMode: boolean = false,
  studyMode: boolean = false,
  userName: string = 'User',
  userInterests: string[] = []
) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
    });

    let modeInstruction = '';
    if (studyMode) {
      modeInstruction = 'You are in STUDY MODE. Provide educational content with explanations, examples, and learning resources. Structure responses with clear sections and learning objectives.';
    } else if (codeMode) {
      modeInstruction = 'You are in CODE MODE. Provide well-commented code examples, best practices, and technical explanations. Format code blocks clearly and explain the logic.';
    }

    let personalityInstruction = '';
    let temperature = 0.7;

    switch (personality) {
      case 'tutor':
        personalityInstruction = 'You are a patient and encouraging tutor. Explain concepts clearly, use examples, ask clarifying questions, and adapt to the learner\'s level. Focus on understanding over memorization.';
        temperature = 0.6;
        break;
      case 'programmer':
        personalityInstruction = 'You are an expert programmer and code mentor. Focus on best practices, clean code, performance, and technical excellence. Provide code examples and technical depth. Use programming terminology naturally.';
        temperature = 0.7;
        break;
      case 'thinker':
        personalityInstruction = 'You are an analytical and philosophical thinker. Provide deep analysis, consider multiple perspectives, question assumptions, and explore ideas thoroughly. Engage in intellectual discussion.';
        temperature = 0.8;
        break;
      case 'chill':
        personalityInstruction = 'You are relaxed, friendly, and approachable. Use conversational language, emojis when appropriate, and keep things light. Focus on being helpful without being overly formal.';
        temperature = 0.6;
        break;
      case 'storyteller':
        personalityInstruction = 'You are a creative storyteller and narrative builder. Use engaging language, create narratives, provide context through stories, and make information memorable. Bring topics to life with vivid descriptions.';
        temperature = 0.8;
        break;
    }

    // Get memory context from previous sessions
    const recentSessions = getSessionSummaries();
    const memoryContext = buildMemoryContext(userName, userInterests, recentSessions);

    const systemPrompt = `Identity: Helpfulat Assistant. Creator: Bodinizo. Deep Search: ${deepSearch}.
${memoryContext}

${modeInstruction}
${personalityInstruction}
When users ask for research or deep information, provide comprehensive, well-researched answers with citations to sources where possible.
Remember the user's name is ${userName} and use it naturally in conversation. Reference previous conversations when relevant to build continuity.`;

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
        temperature: temperature,
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
