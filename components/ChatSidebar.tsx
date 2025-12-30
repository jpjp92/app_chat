import React from 'react';
import { ChatSession } from '../types';

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
  sessions, 
  currentSessionId, 
  onSelectSession, 
  onNewSession,
  onDeleteSession
}) => {
  return (
    <aside className="hidden md:flex flex-col w-72 lg:w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full transition-all">
      <div className="p-6">
        <button 
          onClick={onNewSession}
          className="w-full group flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3.5 px-4 rounded-2xl transition-all duration-300 shadow-lg shadow-primary-500/25 active:scale-[0.98]"
        >
          <i className="fa-solid fa-plus group-hover:rotate-90 transition-transform duration-300"></i>
          <span>New Conversation</span>
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

      <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute -bottom-0.5 -right-0.5 border-2 border-white dark:border-slate-900 z-10"></div>
            <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500">
              <i className="fa-solid fa-plug text-xs"></i>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">API STATUS</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">System operational</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ChatSidebar;