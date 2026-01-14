interface UserProfile {
  id: string;
  name: string;
  interests: string[];
  conversationHistory: string;
  lastUpdated: number;
}

interface SessionSummary {
  sessionId: string;
  title: string;
  date: number;
  personality: string;
  summary: string;
  topics: string[];
}

const STORAGE_KEYS = {
  USER_PROFILE: 'helpfulat_user_profile',
  SESSION_SUMMARIES: 'helpfulat_session_summaries',
  ALL_SESSIONS: 'helpfulat_all_sessions',
};

// Initialize or get user profile
export function getUserProfile(): UserProfile {
  const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
  if (stored) {
    return JSON.parse(stored);
  }

  const newProfile: UserProfile = {
    id: generateUserId(),
    name: 'User',
    interests: [],
    conversationHistory: '',
    lastUpdated: Date.now(),
  };

  saveUserProfile(newProfile);
  return newProfile;
}

// Save user profile
export function saveUserProfile(profile: UserProfile): void {
  profile.lastUpdated = Date.now();
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
}

// Update user name
export function updateUserName(name: string): void {
  const profile = getUserProfile();
  profile.name = name;
  saveUserProfile(profile);
}

// Add interests to user profile
export function addInterest(interest: string): void {
  const profile = getUserProfile();
  if (!profile.interests.includes(interest)) {
    profile.interests.push(interest);
    saveUserProfile(profile);
  }
}

// Get session summaries (past sessions for context)
export function getSessionSummaries(): SessionSummary[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SESSION_SUMMARIES);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading session summaries:', error);
    return [];
  }
}

// Save session summary after it ends
export function saveSessionSummary(
  sessionId: string,
  title: string,
  personality: string,
  messages: any[]
): void {
  const summaries = getSessionSummaries();

  // Create a summary from the messages
  const summary = generateSessionSummary(messages);
  const topics = extractTopics(messages);

  const sessionSummary: SessionSummary = {
    sessionId,
    title,
    date: Date.now(),
    personality,
    summary,
    topics,
  };

  summaries.push(sessionSummary);

  // Keep only last 10 sessions for context
  if (summaries.length > 10) {
    summaries.shift();
  }

  localStorage.setItem(STORAGE_KEYS.SESSION_SUMMARIES, JSON.stringify(summaries));

  // Update user's conversation history
  const profile = getUserProfile();
  profile.conversationHistory = summaries
    .slice(-5) // Last 5 sessions
    .map((s) => `${s.title}: ${s.summary}`)
    .join('\n');
  saveUserProfile(profile);
}

// Build context string for the AI to understand user memory
export function buildMemoryContext(userName: string, interests: string[], recentSessions: SessionSummary[]): string {
  try {
    let context = `User Information:\n`;
    context += `- Name: ${userName || 'User'}\n`;

    if (interests && interests.length > 0) {
      context += `- Interests: ${interests.join(', ')}\n`;
    }

    if (recentSessions && recentSessions.length > 0) {
      context += `\nRecent Conversation History:\n`;
      recentSessions.slice(-3).forEach((session) => {
        if (session && session.date && session.title && session.topics && session.summary) {
          context += `- ${new Date(session.date).toLocaleDateString()}: ${session.title}\n`;
          context += `  Topics: ${session.topics.join(', ')}\n`;
          context += `  Summary: ${session.summary}\n`;
        }
      });
    }

    return context;
  } catch (error) {
    console.error('Error building memory context:', error);
    return `User Information:\n- Name: ${userName || 'User'}\n`;
  }
}

// Helper: Generate session summary from messages
function generateSessionSummary(messages: any[]): string {
  const userMessages = messages.filter((m) => m.role === 'user').map((m) => m.content);
  if (userMessages.length === 0) return 'Empty session';

  const first = userMessages[0].substring(0, 50);
  const last = userMessages[userMessages.length - 1].substring(0, 50);
  const count = userMessages.length;

  return `${count} questions asked starting with "${first}..." and ending with "${last}..."`;
}

// Helper: Extract topics from messages
function extractTopics(messages: any[]): string[] {
  const userMessages = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content);

  // Simple keyword extraction (could be enhanced with NLP)
  const keywords = new Set<string>();

  const commonKeywords = [
    'learn',
    'code',
    'explain',
    'how',
    'what',
    'why',
    'python',
    'javascript',
    'math',
    'science',
    'history',
    'language',
  ];

  userMessages.forEach((msg) => {
    const lower = msg.toLowerCase();
    commonKeywords.forEach((kw) => {
      if (lower.includes(kw)) {
        keywords.add(kw);
      }
    });
  });

  return Array.from(keywords);
}

// Helper: Generate unique user ID
function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Clear all memory (for testing/privacy)
export function clearAllMemory(): void {
  localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
  localStorage.removeItem(STORAGE_KEYS.SESSION_SUMMARIES);
}

// Get stats for display
export function getMemoryStats(): {
  userName: string;
  totalSessions: number;
  interests: string[];
  lastSession: SessionSummary | null;
} {
  const profile = getUserProfile();
  const summaries = getSessionSummaries();

  return {
    userName: profile.name,
    totalSessions: summaries.length,
    interests: profile.interests,
    lastSession: summaries.length > 0 ? summaries[summaries.length - 1] : null,
  };
}
