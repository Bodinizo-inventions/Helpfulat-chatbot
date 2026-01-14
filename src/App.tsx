import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from './components/ChatMessage';
import { Arcade } from './components/Arcade';
import { generateResponse } from './services/geminiService';
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

export const App: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeepSearch, setIsDeepSearch] = useState(true);
  const [lang, setLang] = useState('EN');
  const [activeTab, setActiveTab] = useState<'chat' | 'arcade'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isRTL = lang === 'AR';
  const currentSession = sessions.find((s) => s.id === currentSessionId);

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
        isDeepSearch
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
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? { ...s, messages: s.messages.filter((m) => m.id !== 'thinking') }
            : s
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden ${isRTL ? 'flex-row-reverse' : 'flex-row'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <aside className="w-72 bg-white/60 backdrop-blur-xl border-r-4 border-white flex flex-col hidden lg:flex">
        <div className="p-6">
          <h1 className="text-3xl font-black text-emerald-900 mb-6 flex items-center gap-2">
            🧠 Helpfulat
          </h1>
          <button
            onClick={createNewSession}
            className="w-full py-4 font-black text-emerald-700 bg-white border-b-8 border-emerald-100 rounded-2xl shadow-sm hover:translate-y-1 transition-all"
          >
            + New Chat
          </button>
        </div>
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
              {s.messages.length > 0 ? s.messages[0].content : s.title}
            </button>
          ))}
        </div>
        <div className="p-4 border-t-4 border-white/50">
          <button
            onClick={() => setActiveTab('arcade')}
            className="w-full py-3 rounded-xl font-bold bg-purple-500 text-white"
          >
            🕹️ Arcade
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-white/30 backdrop-blur-sm relative">
        <header className="h-20 border-b-4 border-white flex items-center justify-between px-8 bg-white/20">
          <div className="lg:hidden text-2xl font-black text-emerald-900">Helpfulat</div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDeepSearch(!isDeepSearch)}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                isDeepSearch ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              DEEP SEARCH
            </button>
            <button
              onClick={() => setLang(lang === 'EN' ? 'AR' : 'EN')}
              className="w-10 h-10 rounded-xl bg-white border-2 border-white flex items-center justify-center font-black text-xs"
            >
              {lang === 'EN' ? 'AR' : 'EN'}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'chat' ? (
            <div className="pb-32">
              {currentSession?.messages.length === 0 ? (
                <div className="mt-32 text-center px-6">
                  <div className="text-8xl mb-6 animate-bounce">👋</div>
                  <h2 className="text-4xl font-black text-emerald-900 mb-2">Helpfulat</h2>
                  <p className="text-emerald-800/60 font-bold">Deep search assistant at your service.</p>
                </div>
              ) : (
                currentSession?.messages.map((m) => <ChatMessage key={m.id} message={m} />)
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <Arcade />
          )}
        </div>

        {activeTab === 'chat' && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-sky-200/80 to-transparent">
            <form
              onSubmit={handleSend}
              className="max-w-4xl mx-auto flex items-center bg-white border-4 border-white rounded-[2.5rem] shadow-2xl px-6 py-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Search for anything..."
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
