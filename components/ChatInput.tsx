import React, { useState, useRef, useEffect } from 'react';
import { MessageImage } from '../types';

interface ChatInputProps {
  onSend: (message: string, image?: MessageImage) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<MessageImage | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; 
      const newHeight = Math.min(textarea.scrollHeight, 150);
      textarea.style.height = `${Math.max(newHeight, 40)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((input.trim() || selectedImage) && !disabled) {
      onSend(input, selectedImage || undefined);
      setInput('');
      setSelectedImage(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = '40px';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        alert("Image must be smaller than 4MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage({
          data: reader.result as string,
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto px-1 sm:px-4">
      {selectedImage && (
        <div className="flex px-3 py-2 sm:px-4 sm:py-3 mb-2 sm:mb-3 bg-white/10 dark:bg-slate-800/50 glass-effect rounded-xl sm:rounded-2xl animate-in slide-in-from-bottom-4 duration-300 border border-white/10">
          <div className="relative group">
            <img 
              src={selectedImage.data} 
              alt="To upload" 
              className="h-12 w-12 sm:h-16 sm:w-16 object-cover rounded-lg sm:rounded-xl ring-2 ring-primary-500 shadow-lg"
            />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-1.5 -right-1.5 bg-slate-900 text-white w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-xl hover:bg-red-500 transition-all"
            >
              <i className="fa-solid fa-xmark text-[8px] sm:text-[10px]"></i>
            </button>
          </div>
        </div>
      )}
      
      <form 
        onSubmit={handleSubmit} 
        className="relative flex items-center bg-gray-100 dark:bg-[#2f2f2f] px-2 sm:px-3 py-1 sm:py-1.5 rounded-[24px] sm:rounded-full transition-all focus-within:ring-2 focus-within:ring-white/10 border border-transparent dark:border-white/5"
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
        
        {/* Left Plus Button */}
        <button 
          type="button" 
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
        >
          <i className="fa-solid fa-plus text-base sm:text-lg"></i>
        </button>

        {/* Text Input Area */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything"
          rows={1}
          disabled={disabled}
          className="flex-1 bg-transparent px-2 py-2 sm:py-2.5 outline-none resize-none text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 min-h-[36px] sm:min-h-[40px] max-h-[120px] sm:max-h-[150px] leading-relaxed block overflow-y-auto text-sm sm:text-[15px] font-medium"
        />

        {/* Right Action Icons */}
        <div className="flex items-center pr-1">
          <button
            type="submit"
            disabled={(!input.trim() && !selectedImage) || disabled}
            className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
              (!input.trim() && !selectedImage) || disabled 
                ? 'bg-transparent text-slate-400 dark:text-slate-600' 
                : 'bg-white text-black shadow-md active:scale-90'
            }`}
          >
            {(!input.trim() && !selectedImage) ? (
               <i className="fa-solid fa-bars-staggered text-[10px] sm:text-xs rotate-90 opacity-40"></i>
            ) : (
               <i className="fa-solid fa-arrow-up text-xs sm:text-sm"></i>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;