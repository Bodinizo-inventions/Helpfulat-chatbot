
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Role, Message, ChatSession } from './types';
import { sendMessage } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import Arcade from './components/Arcade';

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
  const [isDeepSearch, setIsDeepSearch] = useState(false);
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [isCodingMode, setIsCodingMode] = useState(false);
  const [lang, setLang] = useState<Language>('EN');
  const [personality, setPersonality] = useState<Personality>('Tutor');
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

    const prompt = finalInput;
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
        prompt, 
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
          const newTitle = s.messages.length === 0 ? prompt.slice(0, 30) + (prompt.length > 30 ? '...' : '') : s.title;
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

  const handlePersonalityChange = (newP: Personality) => {
    setPersonality(newP);
    const ack = lang === 'EN' ? `Personality updated to ${newP}.` : `تم تغيير الشخصية إلى ${newP}.`;
    const systemMessage: Message = {
      id: uuidv4(),
      role: Role.ASSISTANT,
      content: ack,
      timestamp: new Date(),
    };
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return { ...s, messages: [...s.messages, systemMessage] };
      }
      return s;
    }));
  };

  return (
    <div className={`flex h-screen overflow-hidden ${isRTL ? 'flex-row-reverse' : 'flex-row'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <aside className={`w-64 flex-shrink-0 bg-white/60 backdrop-blur-md border-white flex flex-col hidden md:flex ${isRTL ? 'border-l-4' : 'border-r-4'}`}>
        <div className="p-4 space-y-3">
          <button
            onClick={() => { createNewSession(); setIsStudyMode(false); setIsCodingMode(false); setSelectedBook(null); }}
            className="w-full flex items-center justify-center px-4 py-3 text-sm font-bold text-emerald-700 bg-white border-b-4 border-emerald-200 rounded-2xl hover:translate-y-0.5 transition-all shadow-sm focus:outline-none"
          >
            {lang === 'EN' ? 'New Chat' : 'محادثة جديدة'}
          </button>

          <button
            onClick={() => setActiveTab('study')}
            className={`w-full flex items-center justify-center px-4 py-3 text-sm font-bold rounded-2xl transition-all shadow-sm border-b-4 focus:outline-none ${
              activeTab === 'study' ? 'bg-blue-500 text-white border-blue-700' : 'bg-white text-blue-700 border-blue-200'
            }`}
          >
            {lang === 'EN' ? '📚 Study Room' : '📚 غرفة الدراسة'}
          </button>

          <button
            onClick={() => setActiveTab('arcade')}
            className={`w-full flex items-center justify-center px-4 py-3 text-sm font-bold rounded-2xl transition-all shadow-sm border-b-4 focus:outline-none ${
              activeTab === 'arcade' ? 'bg-purple-500 text-white border-purple-700' : 'bg-white text-purple-700 border-purple-200'
            }`}
          >
            {lang === 'EN' ? '🕹️ Arcade' : '🕹️ الألعاب'}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
          <p className="text-[11px] font-black text-emerald-800 uppercase tracking-widest mt-4 px-2 opacity-50">
            {lang === 'EN' ? 'Recent History' : 'السجل الأخير'}
          </p>
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => {
                setCurrentSessionId(session.id);
                setActiveTab('chat');
              }}
              className={`w-full text-right px-4 py-3 rounded-xl text-sm font-bold truncate transition-all focus:outline-none ${
                currentSessionId === session.id && activeTab === 'chat'
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'text-emerald-800 hover:bg-white/80'
              }`}
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
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-black text-emerald-900 tracking-tight leading-none mb-1">Helpfulat</h1>
                    {isOwner && (
                      <span className="bg-emerald-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter" title="Authenticated Creator">
                        Owner
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-md font-bold uppercase">{personality}</span>
                    {isDeepSearch && <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded-md font-bold uppercase">Deep</span>}
                    {isStudyMode && <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-md font-bold uppercase">Study</span>}
                    {isCodingMode && <span className="text-[9px] px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded-md font-bold uppercase">Code</span>}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-3">
                <div className="flex items-center bg-white/80 rounded-2xl border-2 border-emerald-100 px-3 py-1.5 shadow-sm">
                  <span className="text-[10px] font-black text-emerald-600 mr-1 whitespace-nowrap">
                    {lang === 'EN' ? 'Type:' : 'النوع:'}
                  </span>
                  <select 
                    value={personality}
                    onChange={(e) => handlePersonalityChange(e.target.value as Personality)}
                    className="bg-transparent border-none focus:ring-0 text-[10px] font-bold text-gray-700 cursor-pointer p-0 focus:outline-none"
                  >
                    <option value="Tutor">🧑‍🏫 Tutor</option>
                    <option value="Programmer">💻 Programmer</option>
                    <option value="Thinker">🧠 Thinker</option>
                    <option value="Chill">🎮 Chill</option>
                    <option value="Storyteller">📖 Storyteller</option>
                  </select>
                </div>

                <div className="flex items-center bg-white/80 rounded-full border-2 border-emerald-100 overflow-hidden shadow-sm">
                    <button onClick={() => setLang('EN')} className={`px-3 py-1 text-[10px] font-black transition-all focus:outline-none ${lang === 'EN' ? 'bg-emerald-500 text-white' : 'text-emerald-600 hover:bg-emerald-50'}`}>English</button>
                    <div className="w-[1px] h-3 bg-emerald-100"></div>
                    <button onClick={() => setLang('AR')} className={`px-3 py-1 text-[10px] font-black transition-all focus:outline-none ${lang === 'AR' ? 'bg-emerald-500 text-white' : 'text-emerald-600 hover:bg-emerald-50'}`}>Arabic</button>
                </div>

                <div className="flex items-center bg-white/80 rounded-full px-3 py-1 border-2 border-emerald-100">
                  <button 
                    onClick={() => setIsDeepSearch(!isDeepSearch)}
                    className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none ${isDeepSearch ? 'bg-emerald-500' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isDeepSearch ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                  <span className={`text-[10px] font-black ml-2 ${isDeepSearch ? 'text-emerald-600' : 'text-gray-400'}`}>Deep</span>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsCodingMode(!isCodingMode)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all border-2 focus:outline-none ${isCodingMode ? 'bg-purple-500 text-white border-purple-600' : 'bg-white text-purple-500 border-purple-100 shadow-sm'}`}
                  >
                    {isCodingMode ? (lang === 'EN' ? 'Code: ON' : 'برمجة: مفعل') : (lang === 'EN' ? 'Code: OFF' : 'برمجة: معطل')}
                  </button>
                  <button 
                    onClick={() => setIsStudyMode(!isStudyMode)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all border-2 focus:outline-none ${isStudyMode ? 'bg-blue-500 text-white border-blue-600' : 'bg-white text-blue-500 border-blue-100 shadow-sm'}`}
                  >
                    {isStudyMode ? (lang === 'EN' ? 'Study: ON' : 'دراسة: مفعل') : (lang === 'EN' ? 'Study: OFF' : 'دراسة: معطل')}
                  </button>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {currentSession?.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <div className="text-6xl mb-6">{PERSONALITY_ICONS[personality]}</div>
                  <h2 className="text-4xl font-black text-emerald-900 mb-2">
                    {personality === 'Tutor' ? (lang === 'EN' ? "Let's learn!" : "هيا لنتعلم!") : 
                     personality === 'Programmer' ? (lang === 'EN' ? "Let's code!" : "هيا نبرمج!") :
                     personality === 'Thinker' ? (lang === 'EN' ? "Let's solve it." : "لنحل الأمر.") :
                     personality === 'Chill' ? (lang === 'EN' ? "What's up?" : "ما الأخبار؟") :
                     (lang === 'EN' ? "Once upon a time..." : "كان يا مكان...")}
                  </h2>
                  <p className="text-emerald-800/60 font-bold mb-8">
                    {lang === 'EN' ? `Active Personality: ${personality}` : `الشخصية المفعلة: ${personality}`}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {currentSession?.messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="w-full max-w-3xl mx-auto p-4 md:p-8">
              <form onSubmit={handleSend} className="relative flex items-center bg-white border-4 border-white rounded-[2rem] shadow-2xl px-6 py-4">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={lang === 'EN' ? `Message Helpfulat (${personality})...` : `أرسل رسالة (${personality})...`}
                  rows={1}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 font-bold text-lg py-2 resize-none focus:outline-none"
                />
                <button
                  disabled={!input.trim() || isLoading}
                  type="submit"
                  className={`ml-4 p-3 rounded-2xl transition-all focus:outline-none ${!input.trim() || isLoading ? 'bg-gray-100' : 'bg-emerald-500 text-white shadow-emerald-500/30'}`}
                >
                  <svg className={`w-6 h-6 ${isRTL ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </form>
            </div>
          </>
        ) : activeTab === 'arcade' ? (
          <Arcade />
        ) : (
          <div className="h-full flex flex-col p-8 overflow-y-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black text-blue-900 mb-4 tracking-tight">
                {lang === 'EN' ? 'Digital Library' : 'المكتبة الرقمية'}
              </h2>
              <p className="text-blue-800/60 font-bold text-lg">
                {lang === 'EN' ? 'Select a course book to begin studying.' : 'اختر كتاباً دراسياً لبدء التعلم.'}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
              {STUDY_BOOKS[lang].map((book) => (
                <button 
                  key={book.id}
                  onClick={() => startStudySession(book.id)}
                  className="bg-white p-8 rounded-[2.5rem] border-b-8 border-gray-100 hover:border-blue-300 hover:scale-[1.03] transition-all text-left shadow-lg group focus:outline-none"
                >
                  <div className={`w-14 h-14 ${book.color} ${book.text} rounded-2xl flex items-center justify-center text-2xl mb-4`}>{book.icon}</div>
                  <h3 className="text-xl font-black text-gray-800 mb-2">{book.title}</h3>
                  <p className="text-gray-500 text-sm font-bold">{book.description}</p>
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