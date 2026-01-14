
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Role } from './types.js';
import { sendMessage } from './services/geminiService.js';
import ChatMessage from './components/ChatMessage.js';
import Arcade from './components/Arcade.js';

window.log("MODULE", "App.js loaded");

const App = () => {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeepSearch, setIsDeepSearch] = useState(true);
  const [lang, setLang] = useState('EN');
  const [activeTab, setActiveTab] = useState('chat');
  const messagesEndRef = useRef(null);

  const isRTL = lang === 'AR';
  const currentSession = sessions.find(s => s.id === currentSessionId);

  const createNewSession = useCallback(() => {
    const newId = uuidv4();
    const newSession = {
      id: newId,
      title: lang === 'EN' ? 'New Conversation' : 'محادثة جديدة',
      messages: [],
      createdAt: new Date(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setActiveTab('chat');
    window.log("APP", "Created new session: " + newId);
  }, [lang]);

  useEffect(() => {
    if (sessions.length === 0) createNewSession();
  }, [sessions.length, createNewSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || !currentSessionId) return;

    const userMsg = { id: uuidv4(), role: Role.USER, content: input, timestamp: new Date() };
    const thinkingMsg = { id: 'thinking', role: Role.ASSISTANT, content: '', timestamp: new Date(), isSearching: true };

    setInput('');
    setIsLoading(true);
    
    setSessions(prev => prev.map(s => 
      s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg, thinkingMsg] } : s
    ));

    try {
      window.log("API", "Requesting Gemini with Deep Search...");
      const response = await sendMessage(userMsg.content, currentSession?.messages || [], isDeepSearch, false, null, lang);
      
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          const filtered = s.messages.filter(m => m.id !== 'thinking');
          return { 
            ...s, 
            messages: [...filtered, { 
              id: uuidv4(), 
              role: Role.ASSISTANT, 
              content: response.text, 
              timestamp: new Date(), 
              sources: response.sources 
            }] 
          };
        }
        return s;
      }));
    } catch (err) {
      window.log("APP-ERR", err.message, "#ef4444");
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: s.messages.filter(m => m.id !== 'thinking') } : s));
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
            <span>🧠</span> Helpfulat
          </h1>
          <button 
            onClick={createNewSession}
            className="w-full py-4 font-black text-emerald-700 bg-white border-b-8 border-emerald-100 rounded-[1.5rem] shadow-sm hover:translate-y-1 hover:border-b-4 transition-all active:translate-y-2 active:border-b-0"
          >
            {lang === 'EN' ? '+ New Chat' : '+ محادثة جديدة'}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
          {sessions.map(s => (
            <button 
              key={s.id} 
              onClick={() => { setCurrentSessionId(s.id); setActiveTab('chat'); }}
              className={`w-full text-left px-5 py-4 rounded-2xl text-sm font-bold truncate transition-all ${currentSessionId === s.id && activeTab === 'chat' ? 'bg-emerald-500 text-white shadow-lg' : 'hover:bg-white/80 text-emerald-900'}`}
            >
              {s.messages.length > 0 ? s.messages[0].content : s.title}
            </button>
          ))}
        </div>

        <div className="p-4 border-t-4 border-white/50 space-y-2">
          <button onClick={() => setActiveTab('arcade')} className={`w-full py-3 rounded-xl font-bold transition-all ${activeTab === 'arcade' ? 'bg-purple-500 text-white' : 'bg-white/50 text-purple-700'}`}>
            🕹️ Arcade Room
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-white/30 backdrop-blur-sm relative">
        <header className="h-20 border-b-4 border-white flex items-center justify-between px-8 bg-white/20">
          <div className="lg:hidden text-2xl font-black text-emerald-900">Helpfulat</div>
          <div className="flex items-center gap-4">
             <div className="flex bg-white/50 rounded-2xl p-1 border-2 border-white shadow-sm">
                <button 
                  onClick={() => setIsDeepSearch(true)}
                  className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${isDeepSearch ? 'bg-emerald-500 text-white' : 'text-emerald-700'}`}
                >
                  DEEP SEARCH
                </button>
                <button 
                  onClick={() => setIsDeepSearch(false)}
                  className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${!isDeepSearch ? 'bg-gray-400 text-white' : 'text-gray-500'}`}
                >
                  FAST
                </button>
             </div>
             <button onClick={() => setLang(lang === 'EN' ? 'AR' : 'EN')} className="w-10 h-10 rounded-xl bg-white border-2 border-white flex items-center justify-center font-black text-xs shadow-sm hover:scale-110 transition-transform">
               {lang === 'EN' ? 'AR' : 'EN'}
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'chat' ? (
            <div className="pb-32">
              {currentSession?.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center mt-32 text-center px-6">
                  <div className="text-8xl mb-6 animate-bounce">👋</div>
                  <h2 className="text-4xl font-black text-emerald-900 mb-2">
                    {lang === 'EN' ? "I'm Helpfulat!" : "أنا هيلبفولات!"}
                  </h2>
                  <p className="text-emerald-800/60 font-bold max-w-sm">
                    {lang === 'EN' ? "How can I assist your deep research today?" : "كيف يمكنني مساعدتك في بحثك العميق اليوم؟"}
                  </p>
                </div>
              ) : (
                currentSession?.messages.map(m => <ChatMessage key={m.id} message={m} />)
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <Arcade />
          )}
        </div>

        {activeTab === 'chat' && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-sky-200/80 to-transparent pointer-events-none">
            <form 
              onSubmit={handleSend}
              className="max-w-4xl mx-auto flex items-center bg-white border-4 border-white rounded-[2.5rem] shadow-2xl px-6 py-2 pointer-events-auto"
            >
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={lang === 'EN' ? "Search for anything..." : "ابحث عن أي شيء..."}
                className="flex-1 bg-transparent border-none focus:ring-0 font-bold py-4 text-gray-700 text-lg"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-4 bg-emerald-500 text-white rounded-full disabled:opacity-30 hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
