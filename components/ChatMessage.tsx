import React from 'react';
import ReactMarkdown from 'https://esm.sh/react-markdown@9';
import remarkGfm from 'https://esm.sh/remark-gfm@4';
import { Role, Message, UserProfile } from '../types';

interface ChatMessageProps {
  message: Message;
  userProfile?: UserProfile;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, userProfile }) => {
  const isUser = message.role === Role.USER;

  // 마크다운 요소별 커스텀 스타일 정의 (다크모드 가독성 강화)
  const MarkdownComponents = {
    h1: ({ ...props }) => <h1 className="text-lg sm:text-xl font-black mb-3 mt-2 border-b-2 pb-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" {...props} />,
    h2: ({ ...props }) => <h2 className="text-md sm:text-lg font-bold mb-2.5 mt-4 text-slate-800 dark:text-slate-100" {...props} />,
    h3: ({ ...props }) => <h3 className="text-sm sm:text-md font-bold mb-2 mt-3 text-slate-800 dark:text-slate-200" {...props} />,
    p: ({ ...props }) => <p className="mb-2.5 last:mb-0 leading-relaxed break-words text-sm sm:text-[15px]" {...props} />,
    ul: ({ ...props }) => <ul className="list-disc ml-4 mb-3 space-y-1" {...props} />,
    ol: ({ ...props }) => <ol className="list-decimal ml-4 mb-3 space-y-1" {...props} />,
    li: ({ ...props }) => <li className="pl-1 text-slate-700 dark:text-slate-300" {...props} />,
    code: ({ node, inline, className, children, ...props }: any) => {
      return (
        <code 
          className="bg-slate-100 dark:bg-slate-900/80 px-1.5 py-0.5 rounded text-[12px] sm:text-[13px] font-mono text-primary-600 dark:text-primary-400 border border-slate-200 dark:border-slate-800"
          {...props}
        >
          {children}
        </code>
      );
    },
    table: ({ ...props }) => (
      <div className="overflow-x-auto my-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900/40">
        <table className="w-full text-[12.5px] sm:text-[13.5px] border-collapse" {...props} />
      </div>
    ),
    thead: ({ ...props }) => <thead className="bg-slate-50 dark:bg-slate-900/80" {...props} />,
    th: ({ ...props }) => (
      <th 
        className="border-b border-slate-200 dark:border-slate-700 px-3 py-2.5 sm:px-4 sm:py-3 text-left font-black text-slate-900 dark:text-white uppercase tracking-wider" 
        {...props} 
      />
    ),
    td: ({ ...props }) => (
      <td 
        className="border-b border-slate-200 dark:border-slate-700 px-3 py-2.5 sm:px-4 sm:py-3 text-slate-700 dark:text-slate-200 font-medium" 
        {...props} 
      />
    ),
    blockquote: ({ ...props }) => (
      <blockquote className="border-l-4 border-primary-400 dark:border-primary-600 pl-4 py-1.5 my-3 italic bg-primary-50/50 dark:bg-primary-950/20 rounded-r-lg text-slate-600 dark:text-slate-400" {...props} />
    ),
    hr: () => <hr className="my-6 border-slate-200 dark:border-slate-800" />,
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 sm:mb-8 group animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      <div className={`flex max-w-[88%] sm:max-w-[85%] lg:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start`}>
        <div className={`flex-shrink-0 ${isUser ? 'ml-2 sm:ml-4' : 'mr-2 sm:mr-4'} relative pt-1`}>
          {isUser && userProfile?.avatarUrl ? (
            <img 
              src={userProfile.avatarUrl} 
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl object-cover shadow-md border-2 border-white dark:border-slate-800 transition-transform group-hover:scale-110"
              alt="User"
            />
          ) : (
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center text-xs sm:text-sm font-bold shadow-lg transition-transform group-hover:scale-110 ${
              isUser 
                ? 'bg-gradient-to-br from-primary-500 to-indigo-600 text-white' 
                : 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 border border-slate-100 dark:border-slate-700'
            }`}>
              {isUser ? <i className="fa-solid fa-user"></i> : <i className="fa-solid fa-robot"></i>}
            </div>
          )}
        </div>
        
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} min-w-0`}>
          {message.image && (
            <div className={`mb-2 max-w-sm rounded-xl sm:rounded-2xl overflow-hidden shadow-xl ring-1 ring-slate-200 dark:ring-slate-700 transition-transform hover:scale-[1.02] cursor-zoom-in ${isUser ? 'mr-0' : 'ml-0'}`}>
              <img src={message.image.data} alt="Sent" className="max-w-full h-auto block" />
            </div>
          )}
          
          <div className={`relative px-4 py-2.5 sm:px-5 sm:py-4 rounded-2xl sm:rounded-3xl shadow-sm border ${
            isUser 
              ? 'bg-gradient-to-br from-primary-600 to-indigo-700 text-white rounded-tr-none border-primary-500' 
              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border-slate-100 dark:border-slate-700/50'
          }`}>
            <div className="text-sm sm:text-[15px] font-medium tracking-tight overflow-hidden">
              {message.content ? (
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={MarkdownComponents as any}
                >
                  {message.content}
                </ReactMarkdown>
              ) : (
                <div className="flex space-x-1.5 py-1.5 px-0.5">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                </div>
              )}
            </div>
            
            <div className={`text-[8px] sm:text-[9px] mt-2 sm:mt-3 font-black uppercase tracking-[0.2em] opacity-40 ${isUser ? 'text-right' : 'text-left'}`}>
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;