import React from 'react';
import { Role, Message, UserProfile } from '../types';

interface ChatMessageProps {
  message: Message;
  userProfile?: UserProfile;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, userProfile }) => {
  const isUser = message.role === Role.USER;

  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.trim().startsWith('```')) return null;
      
      const formatted = line.replace(/`([^`]+)`/g, '<code class="bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono text-primary-600 dark:text-primary-300">$1</code>');
      
      return (
        <p 
          key={i} 
          className="mb-1.5 last:mb-0 leading-relaxed break-words"
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    });
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 group animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start`}>
        <div className={`flex-shrink-0 ${isUser ? 'ml-4' : 'mr-4'} relative`}>
          {isUser && userProfile?.avatarUrl ? (
            <img 
              src={userProfile.avatarUrl} 
              className="w-10 h-10 rounded-2xl object-cover shadow-md border-2 border-white dark:border-slate-800 transition-transform group-hover:scale-110"
              alt="User"
            />
          ) : (
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold shadow-lg transition-transform group-hover:scale-110 ${
              isUser 
                ? 'bg-gradient-to-br from-primary-500 to-indigo-600 text-white' 
                : 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 border border-slate-100 dark:border-slate-700'
            }`}>
              {isUser ? <i className="fa-solid fa-user"></i> : <i className="fa-solid fa-robot"></i>}
            </div>
          )}
        </div>
        
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {message.image && (
            <div className={`mb-3 max-w-sm rounded-2xl overflow-hidden shadow-xl ring-1 ring-slate-200 dark:ring-slate-700 transition-transform hover:scale-[1.02] cursor-zoom-in ${isUser ? 'mr-0' : 'ml-0'}`}>
              <img src={message.image.data} alt="Sent" className="max-w-full h-auto block" />
            </div>
          )}
          
          <div className={`relative px-5 py-3.5 rounded-3xl shadow-sm border ${
            isUser 
              ? 'bg-gradient-to-br from-primary-600 to-indigo-700 text-white rounded-tr-none border-primary-500' 
              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border-slate-100 dark:border-slate-700/50'
          }`}>
            <div className="text-[15px] font-medium tracking-tight">
              {message.content ? renderContent(message.content) : (
                <div className="flex space-x-1.5 py-2 px-1">
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                </div>
              )}
            </div>
            
            <div className={`text-[10px] mt-2 font-bold uppercase tracking-widest opacity-40 ${isUser ? 'text-right' : 'text-left'}`}>
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;