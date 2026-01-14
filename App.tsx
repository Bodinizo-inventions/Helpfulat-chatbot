
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Role, Message, ChatSession } from './types.ts';
import { sendMessage } from './services/geminiService.ts';
import ChatMessage from './components/ChatMessage.tsx';
import Arcade from './components/Arcade.tsx';

type AppTab = 'chat' | 'arcade' | 'study';
type Language = 'EN' | 'AR';
type Personality = 'Tutor' | 'Programmer' | 'Thinker' | 'Chill' | 'Storyteller';

const AUTH_EMAIL = 'bodinizo2017@gmail.com'; 

const STUDY_BOOKS = {
  EN: [
    { id: 'english', title: 'English Book', icon: '📖', color: 'bg-blue-100', text: 'text-blue-700', description: 'Grammar, Vocabulary & Writing' },
    { id: 'math', title: 'Math Book', icon: '📐', color: 'bg-red-100', text: 'text-red-700', description: 'Arithmetic, Algebra & Geometry' },
    { id: 'science', title: 'Science Book', icon: '🧪', color: 'bg-green-100', text: 'text-green-700', description: 'Biology, Chemistry & Physics' },
    { id: 'discover', title: 'Discover Book', icon: '🌍', color: 'bg-orange-100', text: 'text-orange-700', description: 'History, Geography & Civics' },
    { id: 'ict', title: 'ICT Book', icon: '💻', color: 'bg-purple-100', text: 'text-purple-700', description: 'Coding & Digital Skills' },
  ],
  AR: [
    { id: 'english', title: 'كتاب اللغة الإنجليزية', icon: '📖', color: 'bg-blue-100', text: 'text-blue-700', description: 'القواعد، المفردات والكتابة' },
    { id: 'math', title: 'كتاب الرياضيات', icon: '📐', color: 'bg-red-100', text: 'text-red-700', description: 'الحساب، الجبر والهندسة' },
    { id: 'science', title: 'كتاب العلوم', icon: '🧪', color: 'bg-green-100', text: 'text-green-700', description: 'الأحياء، الكيمياء والفيزياء' },
    { id: 'discover', title: 'كتاب الدراسات', icon: '🌍', color: 'bg-orange-100', text: 'text-orange-700', description: 'التاريخ، الجغرافيا والمواطنة' },
    { id: 'ict', title: 'تكنولوجيا المعلومات', icon: '💻', color: 'bg-purple-100', text: 'text-purple-700', description: 'البرمجة والمهارات الرقمية' },
  ]
};

const PERSONALITY_ICONS: Record<Personality, string> = {
  Tutor: '🧑‍🏫',
  Programmer: '💻',
  Thinker: '🧠',
  Chill: '🎮',
  Storyteller: '📖'
};

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeepSearch, setIsDeepSearch] = useState(true);
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [isCodingMode, setIsCodingMode] = useState(false);
  const [lang, setLang] = useState<Language>('EN');
  const [personality, setPersonality] = useState<Personality>('Thinker');
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isRTL = lang === 'AR';
  const isOwner = AUTH_EMAIL === 'bodinizo2017@gmail.com';
  const currentSession = sessions.find(s => s.id === currentSessionId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages, isLoading, activeTab]);

  const createNewSession = useCallback((bookId?: string) => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: bookId ? (lang === 'EN' ? `Study: ${bookId.toUpperCase()}` : `دراسة: ${bookId}`) : (lang === 'EN' ? 'New Chat' : 'محادثة جديدة'),
      messages: [],
      createdAt: new Date(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setActiveTab('chat');
  }, [lang]);

  useEffect(() => {
    if (sessions.length === 0) {
      createNewSession();
    }
  }, [sessions, createNewSession]);

  const handleSend = async (e?: React.FormEvent, overrideInput?: string) => {
    e?.preventDefault();
    const finalInput = overrideInput || input;
    if (!finalInput.trim() || isLoading || !currentSessionId) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: Role.USER,
      content: finalInput,
      timestamp: new Date(),
    };

    const thinkingMessage: Message = {
      id: 'thinking',
      role: Role.ASSISTANT,
      content: '',
      timestamp: new Date(),
      isSearching: true
    };

    setInput('');
    setIsLoading(true);

    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return { ...s, messages: [...s.messages, userMessage, thinkingMessage] };
      }
      return s;
    }));

    try {
      const response = await sendMessage(
        finalInput, 
        currentSession?.messages || [], 
        isDeepSearch,
        isStudyMode,
        selectedBook || undefined,
        lang,
        isCodingMode,
        personality,
        AUTH_EMAIL
      );
      
      const assistantMessage: Message = {
        id: uuidv4(),
        role: Role.ASSISTANT,
        content: response.text,
        timestamp: new Date(),
        sources: response.sources
      };

      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          const filtered = s.messages.filter(m => m.id !== 'thinking');
          const newTitle = s.messages.length === 1 ? finalInput.slice(0, 30) + (finalInput.length > 30 ? '...' : '') : s.title;
          return { ...s, messages: [...filtered, assistantMessage], title: newTitle };
        }
        return s;
      }));
    } catch (err) {
      console.error(err);
      const errorMessage: Message = {
        id: uuidv4(),
        role: Role.ASSISTANT,
        content: lang === 'EN' ? "Oh no! Something went wrong." : "عذراً! حدث خطأ ما.",
        timestamp: new Date(),
      };
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          const filtered = s.messages.filter(m => m.id !== 'thinking');
          return { ...s, messages: [...filtered, errorMessage] };
        }
        return s;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const startStudySession = (bookId: string) => {
    setSelectedBook(bookId);
    setIsStudyMode(true);
    setIsCodingMode(bookId === 'ict');
    setPersonality('Tutor');
    const book = STUDY_BOOKS[lang].find(b => b.id === bookId);
    createNewSession(bookId);
    
    setTimeout(() => {
        const startMsg = lang === 'EN' 
            ? `I'm ready to learn from the ${book?.title}! Let's start with an introduction.` 
            : `أنا مستعد للتعلم من ${book?.title}! لنبدأ بمقدمة عن الموضوع.`;
        handleSend(undefined, startMsg);
    }, 100);
  };

  return (
    <div className={`flex h-screen overflow-hidden ${isRTL ? 'flex-row-reverse' : 'flex-row'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <aside className={`w-64 flex-shrink-0 bg-white/60 backdrop-blur-md border-white flex flex-col hidden md:flex ${isRTL ? 'border-l-4' : 'border-r-4'}`}>
        <div className="p-4 space-y-3">
          <button
            onClick={() => { createNewSession(); setIsStudyMode(false); setIsCodingMode(false); setSelectedBook(null); }}
            className="w-full flex items-center justify-center px-4 py-3 text-sm font-bold text-emerald-700 bg-white border-b-4 border-emerald-200 rounded-2xl hover:translate-y-0.5 transition-all shadow-sm"
          >
            {lang === 'EN' ? 'New Chat' : 'محادثة جديدة'}
          </button>

          <button onClick={() => setActiveTab('study')} className={`w-full px-4 py-3 text-sm font-bold rounded-2xl border-b-4 ${activeTab === 'study' ? 'bg-blue-500 text-white border-blue-700' : 'bg-white text-blue-700 border-blue-200'}`}>
            {lang === 'EN' ? '📚 Study Room' : '📚 غرفة الدراسة'}
          </button>

          <button onClick={() => setActiveTab('arcade')} className={`w-full px-4 py-3 text-sm font-bold rounded-2xl border-b-4 ${activeTab === 'arcade' ? 'bg-purple-500 text-white border-purple-700' : 'bg-white text-purple-700 border-purple-200'}`}>
            {lang === 'EN' ? '🕹️ Arcade' : '🕹️ الألعاب'}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => { setCurrentSessionId(session.id); setActiveTab('chat'); }}
              className={`w-full text-right px-4 py-3 rounded-xl text-sm font-bold truncate transition-all ${currentSessionId === session.id && activeTab === 'chat' ? 'bg-emerald-500 text-white' : 'text-emerald-800 hover:bg-white/80'}`}
            >
              {session.title}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col relative h-full bg-white/40 backdrop-blur-sm">
        {activeTab === 'chat' ? (
          <>
            <header className="h-auto py-3 border-b-4 border-white flex flex-col md:flex-row items-center justify-between px-6 bg-white/40 gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{PERSONALITY_ICONS[personality]}</span>
                <div>
                  <h1 className="text-xl font-black text-emerald-900 leading-none">Helpfulat</h1>
                  <div className="flex gap-1">
                    {isDeepSearch && <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded-md font-bold uppercase">Deep Search</span>}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <select value={personality} onChange={(e) => setPersonality(e.target.value as Personality)} className="bg-white/80 border-2 border-emerald-100 rounded-xl text-[10px] font-bold p-1">
                  <option value="Tutor">🧑‍🏫 Tutor</option>
                  <option value="Programmer">💻 Programmer</option>
                  <option value="Thinker">🧠 Thinker</option>
                  <option value="Chill">🎮 Chill</option>
                  <option value="Storyteller">📖 Storyteller</option>
                </select>
                <button onClick={() => setIsDeepSearch(!isDeepSearch)} className={`px-3 py-1 text-[10px] font-bold rounded-full border-2 transition-all ${isDeepSearch ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-emerald-600 border-emerald-100'}`}>
                  {isDeepSearch ? 'Deep Search ON' : 'Deep Search OFF'}
                </button>
                <button onClick={() => setLang(lang === 'EN' ? 'AR' : 'EN')} className="px-3 py-1 text-[10px] font-bold rounded-full bg-white border-2 border-emerald-100">
                  {lang === 'EN' ? 'العربية' : 'English'}
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {currentSession?.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <div className="text-8xl mb-4">✨</div>
                  <h2 className="text-2xl font-black">{lang === 'EN' ? 'How can I help?' : 'كيف يمكنني مساعدتك؟'}</h2>
                </div>
              ) : (
                <div className="flex flex-col">
                  {currentSession?.messages.map((message) => <ChatMessage key={message.id} message={message} />)}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="p-4 md:p-8">
              <form onSubmit={handleSend} className="max-w-3xl mx-auto flex items-center bg-white border-4 border-white rounded-[2rem] shadow-2xl px-6 py-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={lang === 'EN' ? "Ask anything..." : "اسأل أي شيء..."}
                  rows={1}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 font-bold py-2 resize-none"
                />
                <button disabled={!input.trim() || isLoading} type="submit" className="ml-2 p-3 bg-emerald-500 text-white rounded-2xl disabled:opacity-30">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="4" d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
              </form>
            </div>
          </>
        ) : activeTab === 'arcade' ? (
          <Arcade />
        ) : (
          <div className="p-8 overflow-y-auto">
            <h2 className="text-3xl font-black text-center mb-8">{lang === 'EN' ? 'Study Library' : 'مكتبة الدراسة'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {STUDY_BOOKS[lang].map((book) => (
                <button key={book.id} onClick={() => startStudySession(book.id)} className="bg-white p-6 rounded-3xl shadow-lg hover:scale-105 transition-all text-left">
                  <div className="text-3xl mb-2">{book.icon}</div>
                  <h3 className="font-black text-lg">{book.title}</h3>
                  <p className="text-xs text-gray-500">{book.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
