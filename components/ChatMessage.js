
import React from 'react';
import { Role } from '../types.js';

export default function ChatMessage({ message }) {
  const isAssistant = message.role === Role.ASSISTANT;
  const isArabic = /[\u0600-\u06FF]/.test(message.content);
  return (
    <div className={`py-8 w-full ${isAssistant ? 'bg-white/40' : 'bg-transparent'}`}>
      <div className={`max-w-3xl mx-auto px-4 flex gap-6 ${isArabic ? 'flex-row-reverse' : ''}`}>
        <div className="w-12 h-12 flex-shrink-0 bg-white rounded-2xl border-2 flex items-center justify-center text-2xl shadow-sm">
          {isAssistant ? '🧠' : '🙋'}
        </div>
        <div className={`flex-1 ${isArabic ? 'text-right' : 'text-left'}`}>
          {message.isSearching ? (
             <div className="animate-pulse text-emerald-600 font-bold">Helpfulat is digging deep...</div>
          ) : (
            <div className="text-gray-800 font-medium whitespace-pre-wrap">{message.content}</div>
          )}
        </div>
      </div>
    </div>
  );
}
