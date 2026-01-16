import React, { useState, useRef, useEffect } from 'react';
import { SparklesIcon } from '../UI/Icons';

interface PromptInputProps {
  onGenerate: (topic: string) => void;
  isGenerating: boolean;
  compact?: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({ onGenerate, isGenerating, compact = false }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isGenerating) {
      onGenerate(input);
      setInput(''); // Clear input to reset size for compact mode
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      // If compact, we might want to restrict growth or keep it one line mostly
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input, compact]);

  return (
    <div className={`w-full mx-auto relative z-30 transition-all duration-500 ${compact ? 'max-w-3xl' : 'max-w-3xl'}`}>
      <form onSubmit={handleSubmit} className="relative group">
        <div className={`absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 ${compact ? 'rounded-3xl' : 'rounded-2xl'}`}></div>
        
        <div 
          className={`
            relative bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-500
            ${compact 
              ? 'rounded-3xl flex items-center pr-2 pl-4 py-1' 
              : 'rounded-2xl p-2 flex flex-col'
            }
          `}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={compact ? "继续输入主题以添加更多幻灯片..." : "在此粘贴您的演示文稿脚本或旁白...\n(例如：'大家好。今天我们要发布一款速度快 3 倍的产品...')"}
            className={`
              w-full bg-transparent border-none outline-none text-white resize-none leading-relaxed custom-scrollbar transition-all duration-500
              ${compact 
                ? 'min-h-[44px] max-h-[120px] py-2.5 text-base placeholder-gray-500' 
                : 'min-h-[80px] max-h-[300px] px-4 py-3 text-lg placeholder-gray-500 font-light'
              }
            `}
            disabled={isGenerating}
            rows={1}
          />
          
          <div 
            className={`
              transition-all duration-500
              ${compact ? 'shrink-0 ml-2' : 'flex justify-end px-2 pb-2 pt-1'}
            `}
          >
             <button
              type="submit"
              disabled={isGenerating || !input.trim()}
              className={`
                font-medium text-white flex items-center justify-center gap-2 transition-all duration-300
                ${isGenerating ? 'bg-gray-700 cursor-wait' : 'bg-primary hover:bg-primary/80 shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-95'}
                ${compact 
                  ? 'w-9 h-9 rounded-full p-0' 
                  : 'px-6 py-2 rounded-xl text-sm'
                }
              `}
              title={compact ? "生成" : ""}
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <SparklesIcon className="w-4 h-4" />
              )}
              
              {!compact && !isGenerating && <span>生成幻灯片</span>}
              {!compact && isGenerating && <span>正在分析...</span>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PromptInput;