import React from 'react';
import { ChatSession, Language } from '../types';

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  language: Language;
  isOpen?: boolean;
  onClose?: () => void;
  onLanguageChange: (lang: Language) => void;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
  sessions, 
  currentSessionId, 
  language,
  isOpen,
  onClose,
  onLanguageChange,
  onSelectSession, 
  onNewSession,
  onDeleteSession
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={onClose}
        ></div>
      )}

      <aside className={`fixed md:relative flex flex-col w-72 lg:w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full transition-all duration-300 z-50 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-6 flex items-center justify-between">
          <button 
            onClick={onNewSession}
            className="flex-1 group flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3.5 px-4 rounded-2xl transition-all duration-300 shadow-lg shadow-primary-500/25 active:scale-[0.98]"
          >
            <i className="fa-solid fa-plus group-hover:rotate-90 transition-transform duration-300"></i>
            <span>New Chat</span>
          </button>
          
          <button 
            onClick={onClose}
            className="md:hidden ml-4 w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-1.5 pb-6">
          <div className="flex items-center justify-between px-2 mb-4">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">History</h3>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">{sessions.length}</span>
          </div>
          
          {sessions.map((session) => (
            <div 
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`group relative flex items-center px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${
                currentSessionId === session.id 
                  ? 'bg-primary-50 dark:bg-primary-950/30 border-primary-100 dark:border-primary-900/30 text-primary-700 dark:text-primary-400' 
                  : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className={`w-2 h-2 rounded-full mr-3 transition-all duration-300 ${
                currentSessionId === session.id ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}></div>
              <span className="truncate flex-1 text-sm font-semibold">{session.title}</span>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if(confirm('Delete this chat?')) onDeleteSession(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 transition-all transform hover:scale-110"
              >
                <i className="fa-solid fa-trash-can text-xs"></i>
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 space-y-4">
          {/* Language Selector */}
          <div className="px-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Language</label>
            <div className="relative">
              <select 
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as Language)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-9 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 appearance-none outline-none focus:ring-2 focus:ring-primary-500/20 cursor-pointer transition-all"
              >
                <option value="ko">한국어 (Korean)</option>
                <option value="en">English (US)</option>
                <option value="es">Español (Spanish)</option>
                <option value="fr">Français (French)</option>
              </select>
              <i className="fa-solid fa-globe absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]"></i>
              <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[8px] pointer-events-none"></i>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default ChatSidebar;