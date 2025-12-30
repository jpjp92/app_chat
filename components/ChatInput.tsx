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
      // 높이를 auto로 설정하여 실제 콘텐츠 높이(scrollHeight)를 정확히 측정합니다.
      textarea.style.height = 'auto'; 
      const newHeight = Math.min(textarea.scrollHeight, 200);
      // 최소 높이를 48px로 유지하면서 콘텐츠에 따라 늘어납니다.
      textarea.style.height = `${Math.max(newHeight, 48)}px`;
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
        textareaRef.current.style.height = '48px';
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
    <div className="max-w-4xl mx-auto px-4">
      {selectedImage && (
        <div className="flex px-4 py-3 mb-3 bg-white/50 dark:bg-slate-800/50 glass-effect rounded-2xl animate-in slide-in-from-bottom-4 fade-in duration-300 border border-slate-200 dark:border-slate-700">
          <div className="relative group">
            <img 
              src={selectedImage.data} 
              alt="To upload" 
              className="h-20 w-20 object-cover rounded-xl ring-2 ring-primary-500 shadow-lg"
            />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-xl hover:bg-red-500 transition-all transform hover:scale-110"
            >
              <i className="fa-solid fa-xmark text-[10px]"></i>
            </button>
          </div>
        </div>
      )}
      
      <form 
        onSubmit={handleSubmit} 
        className="relative flex items-end space-x-2 bg-white dark:bg-slate-900 p-1.5 rounded-[24px] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 transition-all focus-within:ring-4 focus-within:ring-primary-500/10"
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
        
        <button 
          type="button" 
          onClick={() => fileInputRef.current?.click()}
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            selectedImage ? 'bg-primary-100 text-primary-600' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
          title="Attach an image"
        >
          <i className="fa-solid fa-plus text-base"></i>
        </button>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Gemini..."
          rows={1}
          disabled={disabled}
          className="flex-1 bg-transparent px-2 py-3 outline-none resize-none text-slate-700 dark:text-slate-200 placeholder-slate-400 min-h-[48px] max-h-[200px] leading-relaxed block overflow-y-auto"
        />

        <button
          type="submit"
          disabled={(!input.trim() && !selectedImage) || disabled}
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-300 ${
            (!input.trim() && !selectedImage) || disabled 
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed' 
              : 'bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/20 active:scale-95'
          }`}
        >
          <i className="fa-solid fa-arrow-up text-base"></i>
        </button>
      </form>
    </div>
  );
};

export default ChatInput;