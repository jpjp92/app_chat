
import React from 'react';
import { Role, Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  const renderContent = (content: string) => {
    // 줄바꿈 및 기본 마크다운 스타일 처리
    return content.split('\n').map((line, i) => {
      if (line.trim().startsWith('```')) return null;
      
      const formatted = line.replace(/`([^`]+)`/g, '<code class="bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
      
      return (
        <p 
          key={i} 
          className="mb-1 last:mb-0 leading-relaxed break-words"
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    });
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start`}>
        <div className={`flex-shrink-0 mt-1 ${isUser ? 'ml-3' : 'mr-3'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
            isUser 
              ? 'bg-primary-600 text-white' 
              : 'bg-indigo-600 text-white'
          }`}>
            {isUser ? <i className="fa-solid fa-user"></i> : <i className="fa-solid fa-robot"></i>}
          </div>
        </div>
        
        <div className={`relative px-4 py-2.5 rounded-2xl shadow-sm ${
          isUser 
            ? 'bg-primary-600 text-white rounded-tr-none' 
            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700'
        }`}>
          <div className="text-[15px] whitespace-pre-wrap">
            {message.content ? renderContent(message.content) : (
              <div className="flex space-x-1.5 py-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              </div>
            )}
          </div>
          <div className={`text-[10px] mt-1.5 font-medium opacity-70 ${isUser ? 'text-right' : 'text-left'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
