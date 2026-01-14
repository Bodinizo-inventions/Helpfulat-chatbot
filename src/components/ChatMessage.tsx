import React from 'react';
import { Role } from '../utils';

interface Message {
  id: string;
  role: string;
  content: string;
  isSearching?: boolean;
  sources?: Array<{
    web?: {
      uri: string;
      title: string;
    };
  }>;
}

export const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
  const isAssistant = message.role === Role.ASSISTANT;
  const isArabic = /[\u0600-\u06FF]/.test(message.content);

  return (
    <div
      className={`py-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 ${
        isAssistant ? 'bg-white/30 backdrop-blur-md border-y border-white/50' : 'bg-transparent'
      }`}
    >
      <div className={`max-w-4xl mx-auto px-6 flex gap-8 ${isArabic ? 'flex-row-reverse' : ''}`}>
        <div className="flex-shrink-0">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-xl border-4 border-white ${
              isAssistant ? 'bg-emerald-500' : 'bg-sky-500'
            }`}
          >
            {isAssistant ? '🧠' : '👤'}
          </div>
        </div>
        <div className={`flex-1 min-w-0 ${isArabic ? 'text-right' : 'text-left'}`}>
          {message.isSearching ? (
            <div className="flex items-center gap-4 py-4">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
              <div className="text-emerald-700 font-black italic tracking-wider animate-pulse">
                {isArabic ? 'أقوم بالبحث والتحليل العميق...' : 'DIGGING DEEP INTO THE WEB...'}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-gray-800 text-lg leading-relaxed font-semibold whitespace-pre-wrap">
                {message.content}
              </div>
              {message.sources && message.sources.length > 0 && (
                <div className="pt-6 border-t-2 border-emerald-100">
                  <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">
                    {isArabic ? 'المصادر الموثقة' : 'VERIFIED SOURCES'}
                  </div>
                  <div className={`flex flex-wrap gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    {message.sources.map((s, i) => (
                      <a
                        key={i}
                        href={s.web?.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white/80 hover:bg-emerald-50 border-2 border-white px-4 py-2 rounded-xl text-xs font-bold text-emerald-900 shadow-sm transition-all hover:-translate-y-1 flex items-center gap-2"
                      >
                        <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                        {s.web?.title || 'Research Link'}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
