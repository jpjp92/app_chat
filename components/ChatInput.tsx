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
    if ((input.trim() || selectedImage) && !disabled) {
      onSend(input, selectedImage || undefined);
      setInput('');
      setSelectedImage(null);
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
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-2">
      {selectedImage && (
        <div className="flex px-2 animate-in fade-in slide-in-from-bottom-2">
          <div className="relative group">
            <img 
              src={selectedImage.data} 
              alt="To upload" 
              className="h-20 w-20 object-cover rounded-lg border-2 border-primary-500 shadow-sm"
            />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
            >
              <i className="fa-solid fa-xmark text-xs"></i>
            </button>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="relative flex items-end space-x-2">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
        <div className="relative flex-1 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary-500/50 transition-all duration-200 overflow-hidden shadow-sm">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message or attach an image..."
            rows={1}
            disabled={disabled}
            className="w-full bg-transparent px-4 py-[10px] outline-none resize-none text-gray-700 dark:text-gray-200 placeholder-gray-400 min-h-[44px] max-h-[200px] leading-relaxed block"
          />
          <div className="absolute right-3 bottom-[10px] flex items-center space-x-2">
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className={`p-1 transition-colors ${selectedImage ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
              title="Attach an image"
            >
              <i className="fa-solid fa-paperclip"></i>
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={(!input.trim() && !selectedImage) || disabled}
          className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all duration-200 ${
            (!input.trim() && !selectedImage) || disabled 
              ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' 
              : 'bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-500/20 active:scale-95'
          }`}
        >
          <i className="fa-solid fa-paper-plane text-sm"></i>
        </button>
      </form>
    </div>
  );
};

export default ChatInput;