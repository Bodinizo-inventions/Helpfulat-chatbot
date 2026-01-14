
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Role } from './types.ts';
import { sendMessage } from './services/geminiService.ts';
import ChatMessage from './components/ChatMessage.tsx';
import Arcade from './components/Arcade.tsx';

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

const PERSONALITY_ICONS = {
  Tutor: '🧑‍🏫',
  Programmer: '💻',
  Thinker: '🧠',
  Chill: '🎮',
  Storyteller: '📖'
};

const App = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeepSearch, setIsDeepSearch] = useState(true);
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [isCodingMode, setIsCodingMode] = useState(false);
  const [lang, setLang] = useState<'EN' | 'AR'>('EN');
  const [personality, setPersonality] = useState<'Tutor' | 'Programmer' | 'Thinker' | 'Chill' | 'Storyteller'>('Thinker');
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isRTL = lang === 'AR';
  const currentSession = sessions.find(s => s.id === currentSessionId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages, isLoading, activeTab]);

  const createNewSession = useCallback((bookId?: string) => {
    const newSession = {
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
      // Fix: Provided missing argument undefined for createNewSession
      createNewSession(undefined);
    }
  }, [sessions.length, createNewSession]);

  // Fix: Adjusted signature to be compatible with FormEventHandler while keeping optional overrideInput
  const handleSend = async (e?: React.FormEvent, overrideInput?: string) => {
    e?.preventDefault();
    const finalInput = overrideInput || input;
    if (!finalInput.trim() || isLoading || !currentSessionId) return;

    const userMessage = {
      id: uuidv4(),
      role: Role.USER,
      content: finalInput,
      timestamp: new Date(),
    };

    const thinkingMessage = {
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
        lang, // Already typed as 'EN' | 'AR'
        isCodingMode,
        personality,
        AUTH_EMAIL
      );
      
      const assistantMessage = {
        id: uuidv4(),
        role: Role.ASSISTANT,
        content: response.text,
        timestamp: new Date(),
        sources: response.sources
      };

      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          const filtered = s.messages.filter(m => m.id !== 'thinking');
          const newTitle = s.messages.length <= 1 ? finalInput.slice(0, 30) : s.title;
          return { ...s, messages: [...filtered, assistantMessage], title: newTitle };
        }
        return s;
      }));
    } catch (err) {
      console.error(err);
      const errorMessage = {
        id: uuidv4(),
        role: Role.ASSISTANT,
        content: lang === 'EN' ? "Something went wrong." : "حدث خطأ ما.",
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
    createNewSession(bookId);
    
    setTimeout(() => {
        const book = STUDY_BOOKS[lang].find(b => b.id === bookId);
        const startMsg = lang === 'EN' 
            ? `Let's study ${book?.title}!` 
            : `لنبدأ دراسة ${book?.title}!`;
        handleSend(undefined, startMsg);
    }, 100);
  };

  return (
    <div className={`flex h-screen overflow-hidden ${isRTL ? 'flex-row-reverse' : 'flex-row'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <aside className="w-64 bg-white/60 backdrop-blur-md border-r-4 border-white flex flex-col hidden md:flex">
        <div className="p-4 space-y-3">
          <button onClick={() => { createNewSession(undefined); setIsStudyMode(false); }} className="w-full py-3 font-bold text-emerald-700 bg-white border-b-4 border-emerald-200 rounded-2xl shadow-sm">
            {lang === 'EN' ? '+ New Chat' : '+ محادثة جديدة'}
          </button>
          <button onClick={() => setActiveTab('study')} className={`w-full py-3 font-bold rounded-2xl border-b-4 ${activeTab === 'study' ? 'bg-blue-500 text-white border-blue-700' : 'bg-white text-blue-700 border-blue-200'}`}>
            📚 Study Room
          </button>
          <button onClick={() => setActiveTab('arcade')} className={`w-full py-3 font-bold rounded-2xl border-b-4 ${activeTab === 'arcade' ? 'bg-purple-500 text-white border-purple-700' : 'bg-white text-purple-700 border-purple-200'}`}>
            🕹️ Arcade
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
          {sessions.map(s => (
            <button key={s.id} onClick={() => { setCurrentSessionId(s.id); setActiveTab('chat'); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold truncate transition-all mb-2 ${currentSessionId === s.id ? 'bg-emerald-500 text-white' : 'hover:bg-white/80'}`}>
              {s.title}
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-white/40 backdrop-blur-sm">
        {activeTab === 'chat' ? (
          <>
            <header className="py-3 border-b-4 border-white flex items-center justify-between px-6 bg-white/40">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{PERSONALITY_ICONS[personality]}</span>
                <h1 className="text-xl font-black text-emerald-900">Helpfulat</h1>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setIsDeepSearch(!isDeepSearch)} className={`px-4 py-1.5 rounded-full text-[10px] font-black border-2 ${isDeepSearch ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-emerald-600 border-emerald-200'}`}>
                  DEEP SEARCH {isDeepSearch ? 'ON' : 'OFF'}
                </button>
                <button onClick={() => setLang(lang === 'EN' ? 'AR' : 'EN')} className="px-3 py-1.5 rounded-full bg-white text-[10px] font-black border-2 border-emerald-200">
                  {lang === 'EN' ? 'AR' : 'EN'}
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {currentSession?.messages.map(m => <ChatMessage key={m.id} message={m} />)}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 md:p-8">
              <form onSubmit={(e) => handleSend(e)} className="max-w-3xl mx-auto flex items-center bg-white border-4 border-white rounded-[2rem] shadow-2xl px-6 py-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={lang === 'EN' ? "How can I help you today?" : "كيف يمكنني مساعدتك اليوم؟"}
                  className="flex-1 bg-transparent border-none focus:ring-0 font-bold py-3"
                />
                <button disabled={!input.trim() || isLoading} className="p-3 bg-emerald-500 text-white rounded-2xl disabled:opacity-30">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="4" d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
              </form>
            </div>
          </>
        ) : activeTab === 'arcade' ? (
          <Arcade />
        ) : (
          <div className="p-8 h-full overflow-y-auto">
            <h2 className="text-4xl font-black text-center mb-12">Digital Library</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {STUDY_BOOKS[lang].map(book => (
                <button key={book.id} onClick={() => startStudySession(book.id)} className="bg-white p-8 rounded-[2.5rem] shadow-lg hover:scale-105 transition-all text-left">
                  <div className="text-4xl mb-4">{book.icon}</div>
                  <h3 className="text-xl font-black mb-2">{book.title}</h3>
                  <p className="text-sm text-gray-500 font-bold">{book.description}</p>
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
