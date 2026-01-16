import React, { useState, useEffect, useRef } from 'react';
import { Slide } from '../../types';
import { CloseIcon, PlayIcon } from '../UI/Icons';

interface PresentationModeProps {
  slides: Slide[];
  initialSlideId: string | null;
  onClose: () => void;
}

const PresentationMode: React.FC<PresentationModeProps> = ({ slides, initialSlideId, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (initialSlideId) {
      const idx = slides.findIndex(s => s.id === initialSlideId);
      if (idx !== -1) setCurrentIndex(idx);
    }
  }, [initialSlideId, slides]);

  // Restart animations for the current slide whenever the index changes
  useEffect(() => {
    const iframe = document.getElementById(`slide-iframe-${currentIndex}`) as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      // Send a message to the iframe to restart its animations
      // We use a small timeout to align with the fade-in transition
      setTimeout(() => {
        iframe.contentWindow?.postMessage('play', '*');
      }, 50);
    }
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prev: Ctrl + ArrowLeft OR ArrowLeft
      if ((e.ctrlKey && e.key === 'ArrowLeft') || e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
      
      // Next: Alt + ArrowRight OR ArrowRight OR Space
      if ((e.altKey && e.key === 'ArrowRight') || e.key === 'ArrowRight' || e.key === ' ') {
         e.preventDefault();
         handleNext();
      }

      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, slides.length, onClose]);

  if (!slides.length) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      {/* Controls Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50 opacity-0 hover:opacity-100 transition-opacity duration-300">
         <div className="text-white/50 text-sm font-mono">
            {currentIndex + 1} / {slides.length}
         </div>
         <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md">
            <CloseIcon className="w-6 h-6" />
         </button>
      </div>

      {/* Main Slide Stage */}
      <div className="w-full h-full relative flex items-center justify-center bg-black overflow-hidden">
        <div className="w-full h-full max-w-[177.78vh] max-h-[56.25vw] aspect-video shadow-2xl bg-black relative">
            {slides.map((slide, index) => {
                const isActive = index === currentIndex;
                
                return (
                    <div 
                        key={slide.id}
                        className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                        style={{ pointerEvents: isActive ? 'auto' : 'none' }}
                    >
                        <iframe
                            id={`slide-iframe-${index}`}
                            srcDoc={slide.html}
                            scrolling="no"
                            className="w-full h-full border-0 bg-black overflow-hidden" 
                            title={`Presentation Slide ${index + 1}`}
                            sandbox="allow-scripts"
                            // If it's the first slide and we just opened, trigger play on load
                            onLoad={(e) => {
                                if (isActive) {
                                    (e.target as HTMLIFrameElement).contentWindow?.postMessage('play', '*');
                                }
                            }}
                        />
                    </div>
                );
            })}
        </div>
      </div>

      {/* Navigation Areas */}
      <div className="absolute top-0 bottom-0 left-0 w-[10%] z-40 cursor-w-resize" onClick={handlePrev} />
      <div className="absolute top-0 bottom-0 right-0 w-[10%] z-40 cursor-e-resize" onClick={handleNext} />
      
      {/* Footer / Progress */}
      <div className="absolute bottom-6 flex gap-2 z-50">
        {slides.map((_, idx) => (
            <div 
                key={idx} 
                className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-primary w-8' : 'bg-white/20'}`} 
            />
        ))}
      </div>
    </div>
  );
};

export default PresentationMode;