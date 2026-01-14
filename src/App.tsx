import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from './components/ChatMessage';
import { Arcade } from './components/Arcade';
import { generateResponse } from './services/geminiService';
import { 
  getUserProfile, 
  updateUserName, 
  saveSessionSummary, 
  getMemoryStats 
} from './services/memoryService';
import { Role, log } from './utils';

interface Message {
  id: string;
  role: string;
  content: string;
  isSearching?: boolean;
  sources?: any[];
}

interface Session {
  id: string;
  title: string;
  messages: Message[];
}

type PersonalityType = 'tutor' | 'programmer' | 'thinker' | 'chill' | 'storyteller';

const PERSONALITIES: Record<PersonalityType, { emoji: string; name: string; color: string }> = {
  tutor: { emoji: '👨‍🏫', name: 'Tutor', color: 'from-blue-500 to-blue-600' },
  programmer: { emoji: '💻', name: 'Programmer', color: 'from-purple-500 to-purple-600' },
  thinker: { emoji: '🧠', name: 'Thinker', color: 'from-indigo-500 to-indigo-600' },
  chill: { emoji: '😎', name: 'Chill', color: 'from-green-500 to-green-600' },
  storyteller: { emoji: '📖', name: 'Storyteller', color: 'from-pink-500 to-pink-600' },
};

const COURSES = [
  { id: 'english', title: 'English Book', icon: '📖', desc: 'Grammar, Vocabulary & Writing' },
  { id: 'math', title: 'Math Book', icon: '📐', desc: 'Arithmetic, Algebra & Geometry' },
  { id: 'science', title: 'Science Book', icon: '🧪', desc: 'Biology, Chemistry & Physics' },
  { id: 'discover', title: 'Discover Book', icon: '🌍', desc: 'History, Geography & Civics' },
];

export const App: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeepSearch, setIsDeepSearch] = useState(true);
  const [lang, setLang] = useState('EN');
  const [activeTab, setActiveTab] = useState<'chat' | 'study' | 'arcade' | 'memory'>('chat');
  const [personality, setPersonality] = useState<PersonalityType>('tutor');
  const [codeMode, setCodeMode] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [showEditName, setShowEditName] = useState(false);
  const [memoryStats, setMemoryStats] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isRTL = lang === 'AR';
  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const personalityInfo = PERSONALITIES[personality];

  // Initialize user profile on mount
  useEffect(() => {
    const profile = getUserProfile();
    setUserName(profile.name);
    setNewUserName(profile.name);
    setMemoryStats(getMemoryStats());
  }, []);

  const createNewSession = useCallback(() => {
    const id = uuidv4();
    setSessions((prev) => [
      { id, title: lang === 'EN' ? 'New Chat' : 'محادثة جديدة', messages: [] },
      ...prev,
    ]);
    setCurrentSessionId(id);
    setActiveTab('chat');
  }, [lang]);

  useEffect(() => {
    if (sessions.length === 0) createNewSession();
  }, [createNewSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  // Save session summary when switching sessions
  useEffect(() => {
    if (currentSession && currentSession.messages.length > 0) {
      try {
        saveSessionSummary(
          currentSession.id,
          currentSession.messages[0]?.content?.substring(0, 50) || 'Chat',
          personality,
          currentSession.messages
        );
      } catch (error) {
        console.error('Error saving session summary:', error);
      }
    }
  }, [currentSessionId, personality]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: uuidv4(), role: Role.USER, content: input };
    const thinkingMsg: Message = {
      id: 'thinking',
      role: Role.ASSISTANT,
      content: '',
      isSearching: true,
    };

    setInput('');
    setIsLoading(true);
    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? { ...s, messages: [...s.messages, userMsg, thinkingMsg] }
          : s
      )
    );

    try {
      const history = currentSession!.messages
        .filter((m) => m.id !== 'thinking')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const response = await generateResponse(
        [...history, { role: Role.USER, content: userMsg.content }],
        isDeepSearch,
        personality,
        codeMode,
        studyMode,
        userName || 'User',
        [] // user interests can be expanded
      );

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === currentSessionId) {
            return {
              ...s,
              messages: [
                ...s.messages.filter((m) => m.id !== 'thinking'),
                {
                  id: uuidv4(),
                  role: Role.ASSISTANT,
                  content: response.text,
                  sources: response.sources,
                },
              ],
            };
          }
          return s;
        })
      );
    } catch (err) {
      log('ERROR', (err as Error).message);
      const errorMsg = (err as Error).message;
      
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === currentSessionId) {
            return {
              ...s,
              messages: [
                ...s.messages.filter((m) => m.id !== 'thinking'),
                {
                  id: uuidv4(),
                  role: Role.ASSISTANT,
                  content: errorMsg,
                  sources: [],
                },
              ],
            };
          }
          return s;
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden ${isRTL ? 'flex-row-reverse' : 'flex-row'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <aside className="w-72 bg-white/60 backdrop-blur-xl border-r-4 border-white flex flex-col hidden lg:flex">
        <div className="p-6">
          <h1 className="text-3xl font-black text-emerald-900 mb-6 flex items-center gap-2">
            🧠 Helpfulat
          </h1>
          <button
            onClick={createNewSession}
            className="w-full py-4 font-black text-white bg-gradient-to-r from-emerald-500 to-emerald-600 border-b-4 border-emerald-700 rounded-2xl shadow-sm hover:translate-y-1 transition-all"
          >
            ➕ New Chat
          </button>
        </div>

        {/* Study Room Button */}
        <div className="px-4 pb-4">
          <button
            onClick={() => {
              setSelectedCourse(null);
              setActiveTab('study');
            }}
            className={`w-full py-4 font-black rounded-2xl transition-all ${
              activeTab === 'study'
                ? 'bg-blue-500 text-white shadow-lg border-b-4 border-blue-600'
                : 'bg-white/80 text-blue-600 hover:bg-blue-50 border-b-4 border-blue-100'
            }`}
          >
            📚 Study Room
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setCurrentSessionId(s.id);
                setActiveTab('chat');
              }}
              className={`w-full text-left px-5 py-4 rounded-2xl text-sm font-bold truncate transition-all ${
                currentSessionId === s.id && activeTab === 'chat'
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'hover:bg-white/80 text-emerald-900'
              }`}
            >
              {s.messages.length > 0 ? s.messages[0].content.substring(0, 30) : s.title}
            </button>
          ))}
        </div>

        {/* Recent History Header */}
        <div className="px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-widest">
          {lang === 'EN' ? 'Recent History' : 'السجل الأخير'}
        </div>

        {/* Arcade Button */}
        <div className="p-4 border-t-4 border-white/50 space-y-2">
          <button
            onClick={() => setActiveTab('memory')}
            className={`w-full py-3 rounded-xl font-bold transition-all ${
              activeTab === 'memory'
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-white/60 text-orange-600 hover:bg-orange-50'
            }`}
          >
            💾 Memory
          </button>
          <button
            onClick={() => setActiveTab('arcade')}
            className="w-full py-3 rounded-xl font-bold bg-purple-500 text-white"
          >
            🕹️ Arcade
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-white/30 backdrop-blur-sm relative">
        {/* Header */}
        <header className="border-b-4 border-white px-8 py-4 bg-white/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="lg:hidden text-2xl font-black text-emerald-900">Helpfulat</div>
              <span className="hidden md:inline px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-black">
                OWNER
              </span>
              <span className="text-2xl font-black text-emerald-900">
                Type: <span className="text-3xl">{personalityInfo.emoji}</span> {personalityInfo.name}
              </span>
            </div>
          </div>

          {/* Controls Row 1: Personality Selector */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <select
              value={personality}
              onChange={(e) => setPersonality(e.target.value as PersonalityType)}
              className="px-4 py-2 rounded-lg bg-white border-2 border-gray-200 font-bold text-sm cursor-pointer hover:border-gray-300"
            >
              {Object.entries(PERSONALITIES).map(([key, { emoji, name }]) => (
                <option key={key} value={key}>
                  {emoji} {name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setLang(lang === 'EN' ? 'AR' : 'EN')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                lang === 'EN'
                  ? 'bg-white text-emerald-600 border-2 border-emerald-500'
                  : 'bg-emerald-500 text-white border-2 border-emerald-600'
              }`}
            >
              {lang === 'EN' ? 'English' : 'العربية'}
            </button>

            <button
              onClick={() => setIsDeepSearch(!isDeepSearch)}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                isDeepSearch
                  ? 'bg-emerald-500 text-white border-2 border-emerald-600'
                  : 'bg-white/60 text-gray-700 border-2 border-gray-300'
              }`}
            >
              Deep {isDeepSearch ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Controls Row 2: Code & Study Modes */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCodeMode(!codeMode)}
              className={`px-4 py-1.5 rounded-lg font-bold text-sm transition-all ${
                codeMode
                  ? 'bg-purple-500 text-white border-2 border-purple-600'
                  : 'bg-white/60 text-gray-700 border-2 border-gray-300'
              }`}
            >
              CODE: {codeMode ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={() => setStudyMode(!studyMode)}
              className={`px-4 py-1.5 rounded-lg font-bold text-sm transition-all ${
                studyMode
                  ? 'bg-orange-500 text-white border-2 border-orange-600'
                  : 'bg-white/60 text-gray-700 border-2 border-gray-300'
              }`}
            >
              STUDY: {studyMode ? 'ON' : 'OFF'}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'chat' ? (
            <div className="pb-32">
              {currentSession?.messages.length === 0 ? (
                <div className="mt-32 text-center px-6">
                  <div className="text-8xl mb-6 animate-bounce">{personalityInfo.emoji}</div>
                  <h2 className="text-4xl font-black text-emerald-900 mb-2">
                    {lang === 'EN' ? "Let's learn!" : 'دعونا نتعلم!'}
                  </h2>
                  <p className="text-emerald-700 font-bold">
                    {lang === 'EN'
                      ? `Active Personality: ${personalityInfo.name}`
                      : `الشخصية النشطة: ${personalityInfo.name}`}
                  </p>
                </div>
              ) : (
                currentSession?.messages.map((m) => <ChatMessage key={m.id} message={m} />)
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : activeTab === 'study' ? (
            <div className="p-12">
              {!selectedCourse ? (
                <div className="max-w-5xl mx-auto">
                  <h2 className="text-4xl font-black text-center text-gray-800 mb-4">
                    {lang === 'EN' ? 'Digital Library' : 'المكتبة الرقمية'}
                  </h2>
                  <p className="text-center text-gray-600 font-bold mb-12">
                    {lang === 'EN'
                      ? 'Select a course book to begin studying.'
                      : 'اختر كتاب دورة لبدء الدراسة.'}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {COURSES.map((course) => (
                      <button
                        key={course.id}
                        onClick={() => setSelectedCourse(course.id)}
                        className="bg-white/80 hover:bg-white backdrop-blur rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all text-left group"
                      >
                        <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{course.icon}</div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">{course.title}</h3>
                        <p className="text-gray-600 font-bold">{course.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <button
                    onClick={() => setSelectedCourse(null)}
                    className="mb-6 px-6 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600"
                  >
                    ← {lang === 'EN' ? 'Back to Library' : 'العودة إلى المكتبة'}
                  </button>
                  <p className="text-xl text-gray-700 font-bold">
                    {lang === 'EN' ? 'Selected:' : 'المحدد:'} {COURSES.find((c) => c.id === selectedCourse)?.title}
                  </p>
                </div>
              )}
            </div>
          ) : activeTab === 'memory' ? (
            <div className="p-12">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-4xl font-black text-center text-gray-800 mb-8">
                  💾 {lang === 'EN' ? 'Memory & Profile' : 'الذاكرة والملف الشخصي'}
                </h2>

                {/* User Profile Section */}
                <div className="bg-white/80 backdrop-blur rounded-3xl p-8 mb-8 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-black text-gray-900">👤 {lang === 'EN' ? 'User Profile' : 'الملف الشخصي'}</h3>
                      <p className="text-gray-600 font-bold">
                        {lang === 'EN' ? `Name: ${userName}` : `الاسم: ${userName}`}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowEditName(!showEditName)}
                      className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600"
                    >
                      ✏️ {lang === 'EN' ? 'Edit' : 'تحرير'}
                    </button>
                  </div>

                  {showEditName && (
                    <div className="flex gap-2 mt-4">
                      <input
                        type="text"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder={lang === 'EN' ? 'Enter your name' : 'أدخل اسمك'}
                        className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg font-bold"
                      />
                      <button
                        onClick={() => {
                          updateUserName(newUserName);
                          setUserName(newUserName);
                          setShowEditName(false);
                          setMemoryStats(getMemoryStats());
                        }}
                        className="px-6 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600"
                      >
                        ✓
                      </button>
                    </div>
                  )}
                </div>

                {/* Memory Stats */}
                {memoryStats && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-8 border-2 border-blue-200">
                    <h3 className="text-2xl font-black text-gray-900 mb-6">
                      📊 {lang === 'EN' ? 'Conversation History' : 'سجل المحادثات'}
                    </h3>
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div className="bg-white/80 rounded-xl p-4">
                        <p className="text-gray-600 text-sm font-bold">{lang === 'EN' ? 'Total Sessions' : 'إجمالي الجلسات'}</p>
                        <p className="text-3xl font-black text-blue-600">{memoryStats.totalSessions}</p>
                      </div>
                      <div className="bg-white/80 rounded-xl p-4">
                        <p className="text-gray-600 text-sm font-bold">{lang === 'EN' ? 'Topics Discussed' : 'المواضيع النقاشية'}</p>
                        <p className="text-3xl font-black text-indigo-600">{memoryStats.interests.length}</p>
                      </div>
                    </div>

                    {memoryStats.lastSession && (
                      <div className="bg-white/80 rounded-xl p-4 mt-4">
                        <p className="text-sm text-gray-600 font-bold mb-2">
                          {lang === 'EN' ? 'Last Conversation' : 'آخر محادثة'}:
                        </p>
                        <p className="text-gray-800 font-bold">
                          {memoryStats.lastSession.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(memoryStats.lastSession.date).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {memoryStats.interests.length > 0 && (
                      <div className="mt-6">
                        <p className="text-sm text-gray-600 font-bold mb-3">{lang === 'EN' ? 'Your Interests' : 'اهتماماتك'}:</p>
                        <div className="flex flex-wrap gap-2">
                          {memoryStats.interests.map((interest: string) => (
                            <span
                              key={interest}
                              className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-bold rounded-full"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Info */}
                <div className="mt-8 p-6 bg-amber-50 border-2 border-amber-200 rounded-2xl">
                  <p className="text-sm text-amber-900 font-bold leading-relaxed">
                    {lang === 'EN'
                      ? '🧠 The bot now remembers your name and past conversations. It will use this information to provide more personalized responses and refer back to previous topics when relevant.'
                      : '🧠 يتذكر البوت الآن اسمك والمحادثات السابقة. سوف يستخدم هذه المعلومات لتقديم ردود أكثر شخصية والإشارة إلى المواضيع السابقة عند الضرورة.'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <Arcade />
          )}
        </div>

        {/* Input Area */}
        {activeTab === 'chat' && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-sky-200/80 to-transparent">
            <form
              onSubmit={handleSend}
              className="max-w-4xl mx-auto flex items-center bg-white border-4 border-white rounded-[2.5rem] shadow-2xl px-6 py-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={lang === 'EN' ? 'Message Helpfulat (' + personalityInfo.name + ')...' : 'رسالة إلى Helpfulat...'}
                className="flex-1 bg-transparent border-none focus:ring-0 font-bold py-4 text-gray-700 text-lg"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-4 bg-emerald-500 text-white rounded-full disabled:opacity-30 shadow-lg"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="4"
                    d="M5 12h14M12 5l7 7-7 7"
                  />
                </svg>
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};
