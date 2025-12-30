
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
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-full">
      <div className="p-4">
        <button 
          onClick={onNewSession}
          className="w-full flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 shadow-sm"
        >
          <i className="fa-solid fa-plus"></i>
          <span>New Chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        <h3 className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Recent Chats</h3>
        {sessions.map((session) => (
          <div 
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`group relative flex items-center px-3 py-3 rounded-lg cursor-pointer transition-colors duration-200 ${
              currentSessionId === session.id 
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <i className="fa-regular fa-message mr-3 opacity-60"></i>
            <span className="truncate flex-1 text-sm font-medium">{session.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSession(session.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
            >
              <i className="fa-solid fa-trash-can text-xs"></i>
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-400">
        <div className="flex items-center space-x-2 opacity-70">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span>Gemini API Connected</span>
        </div>
      </div>
    </aside>
  );
};

export default ChatSidebar;
