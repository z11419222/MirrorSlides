import React, { useRef, useState, useEffect } from 'react';
import { Slide } from '../../types';
import { ArrowsExpandIcon, RefreshIcon } from '../UI/Icons';
import { remixSlideLayout } from '../../services/geminiService';

interface SlideCardProps {
  slide: Slide;
  onFocus: (slide: Slide) => void;
  onUpdateSlide: (id: string, newHtml: string) => void;
}

const SlideCard: React.FC<SlideCardProps> = ({ slide, onFocus, onUpdateSlide }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isRemixing, setIsRemixing] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleRemix = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent focusing
    setIsRemixing(true);
    // Randomly choose a remix direction for variety
    const variants: ('visual' | 'text-heavy' | 'split')[] = ['visual', 'text-heavy', 'split'];
    const direction = variants[Math.floor(Math.random() * variants.length)];
    
    const newHtml = await remixSlideLayout(slide.html, direction);
    onUpdateSlide(slide.id, newHtml);
    setIsRemixing(false);
  };

  return (
    <div
      className="group relative w-full aspect-video bg-gray-900 rounded-xl overflow-hidden border border-glassBorder shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:border-primary/50 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onFocus(slide)}
      style={{ perspective: '1000px' }}
    >
      {/* Loading State Overlay for Remix */}
      {isRemixing && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
          <span className="text-sm font-medium text-primary">正在重组布局...</span>
        </div>
      )}

      {/* The Slide Content */}
      <div className="w-full h-full relative">
        <iframe
          ref={iframeRef}
          srcDoc={slide.html}
          sandbox="allow-scripts"
          scrolling="no"
          className="w-full h-full pointer-events-none select-none overflow-hidden"
          title={`Slide ${slide.id}`}
        />
        {/* Transparent overlay to capture clicks but allow seeing content */}
        <div className="absolute inset-0 z-10 bg-transparent" />
      </div>

      {/* Hover Controls */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent flex justify-between items-end transform transition-transform duration-300 z-20 ${isHovered ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 font-mono">ID: {slide.id.slice(0, 4)}</span>
          <span className="text-xs text-gray-300 font-medium">{slide.variant === 'remix' ? '重组版本' : '原始版本'}</span>
        </div>
        
        <div className="flex gap-2">
           <button
            onClick={handleRemix}
            className="p-2 rounded-full bg-glass hover:bg-primary/20 border border-white/10 hover:border-primary/50 transition-colors text-white"
            title="重组布局"
          >
            <RefreshIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => onFocus(slide)}
            className="p-2 rounded-full bg-primary hover:bg-primary/80 transition-colors text-white shadow-lg shadow-primary/20"
            title="演示 (专注模式)"
          >
            <ArrowsExpandIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SlideCard;