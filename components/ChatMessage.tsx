
import React from 'react';
import { Message, Role } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAssistant = message.role === Role.ASSISTANT;
  // Basic check for Arabic content to apply RTL inside message
  const isArabic = /[\u0600-\u06FF]/.test(message.content);

  return (
    <div className={`py-8 w-full ${isAssistant ? 'bg-white/40' : 'bg-transparent'}`}>
      <div className={`max-w-3xl mx-auto px-4 flex gap-6 ${isArabic ? 'flex-row-reverse' : ''}`}>
        <div className="flex-shrink-0">
          {isAssistant ? (
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border-2 border-emerald-400 flex items-center justify-center text-2xl" title="Helpfulat Brain">
              🧠
            </div>
          ) : (
            <div className="w-12 h-12 bg-orange-100 rounded-2xl shadow-sm border-2 border-orange-400 flex items-center justify-center text-2xl" title="Friendly User">
              🙋‍♂️
            </div>
          )}
        </div>
        
        <div className={`flex-1 space-y-4 min-w-0 ${isArabic ? 'text-right' : 'text-left'}`}>
          <div className={`markdown-content text-[16px] text-gray-800 font-medium ${isArabic ? 'dir-rtl' : 'dir-ltr'}`} dir={isArabic ? 'rtl' : 'ltr'}>
            {message.isSearching ? (
              <div className={`flex items-center space-x-3 text-emerald-600 bg-white/80 p-4 rounded-2xl border-2 border-emerald-200 animate-pulse ${isArabic ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className="relative">
                  <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <span className="font-bold">
                    {isArabic ? 'هيلبفولات يبحث بعمق في الويب...' : 'Helpfulat is digging deep into the web...'}
                </span>
              </div>
            ) : (
              message.content.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))
            )}
          </div>

          {message.sources && message.sources.length > 0 && (
            <div className="mt-4 pt-4 border-t border-black/5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                {isArabic ? 'مصادر موثوقة' : 'Verified Sources'}
              </p>
              <div className={`flex flex-wrap gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                {message.sources.map((source: any, idx) => (
                  <a
                    key={idx}
                    href={source.web?.uri || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 bg-white/80 border-2 border-gray-100 px-3 py-1.5 rounded-xl text-xs font-semibold hover:border-emerald-400 hover:scale-105 transition-all truncate max-w-[200px]"
                  >
                    <img 
                      src={`https://www.google.com/s2/favicons?domain=${new URL(source.web?.uri || 'https://google.com').hostname}`} 
                      className="w-4 h-4 rounded-sm" 
                      alt="" 
                    />
                    <span className="truncate">{source.web?.title || 'External Source'}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
