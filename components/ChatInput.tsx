
import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // 높이 초기화 후 실제 컨텐츠 높이로 재설정
      textarea.style.height = '44px'; 
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input);
      setInput('');
      // 전송 후 높이 초기화
      if (textareaRef.current) {
        textareaRef.current.style.height = '44px';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto flex items-end space-x-2">
      <div className="relative flex-1 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary-500/50 transition-all duration-200 overflow-hidden shadow-sm">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          rows={1}
          disabled={disabled}
          className="w-full bg-transparent px-4 py-[10px] outline-none resize-none text-gray-700 dark:text-gray-200 placeholder-gray-400 min-h-[44px] max-h-[200px] leading-relaxed block"
        />
        <div className="absolute right-3 bottom-[10px] flex items-center space-x-2">
          <button 
            type="button" 
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <i className="fa-solid fa-paperclip"></i>
          </button>
        </div>
      </div>
      <button
        type="submit"
        disabled={!input.trim() || disabled}
        className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all duration-200 ${
          !input.trim() || disabled 
            ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' 
            : 'bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-500/20 active:scale-95'
        }`}
      >
        <i className="fa-solid fa-paper-plane text-sm"></i>
      </button>
    </form>
  );
};

export default ChatInput;
