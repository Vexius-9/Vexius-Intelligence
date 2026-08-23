import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { VexiusSlideRibbon } from './VexiusSlideRibbon';
import { Paperclip, CornerDownLeft } from 'lucide-react';

export interface VexiusSlideEditorProps {
  documentId: string;
  initialContent?: any;
  navbarElement?: React.ReactNode;
  sidebar?: React.ReactNode;
}

export interface VexiusSlideEditorRef {
  getFullText: () => string;
  getCurrentSelection: () => string;
  applyAction: (text: string) => void;
}

export const VexiusSlideEditor = forwardRef<VexiusSlideEditorRef, VexiusSlideEditorProps>(({ documentId, initialContent, navbarElement, sidebar }, ref) => {
  const [slides, setSlides] = useState<string[]>(['<h1>Welcome to Vexius Slides</h1><p>Edit me...</p>']);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isCopilotVisible, setIsCopilotVisible] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(83);
  
  const slideRef = useRef<HTMLDivElement>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleToggleAI = () => setIsCopilotVisible(prev => !prev);
    window.addEventListener('vexius:toggle-ai', handleToggleAI as EventListener);
    return () => window.removeEventListener('vexius:toggle-ai', handleToggleAI as EventListener);
  }, []);

  useEffect(() => {
    if (initialContent) {
      try {
        let parsed = initialContent;
        if (typeof initialContent === 'string') {
          parsed = JSON.parse(initialContent);
        }
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSlides(parsed);
        }
      } catch (e) {
        console.error("Failed to parse initial slides", e);
      }
    }
  }, [initialContent]);

  useImperativeHandle(ref, () => ({
    getFullText: () => {
      return slides.map((s, i) => `Slide ${i + 1}:\n${s}`).join('\n\n');
    },
    getCurrentSelection: () => {
      return `Currently editing Slide ${currentSlideIndex + 1}`;
    },
    applyAction: (text: string) => {
      // If the text seems like a complete slide (e.g. contains <h1>, <ul>), 
      // check if it's meant to replace or append via context
      const newSlides = [...slides];
      
      // If we are replacing the current slide
      if (text.includes('<!-- ACTION:REPLACE_SLIDE -->')) {
        const cleanText = text.replace('<!-- ACTION:REPLACE_SLIDE -->', '').trim();
        newSlides[currentSlideIndex] = cleanText;
      } 
      // If we are creating a new slide
      else if (text.includes('<!-- ACTION:NEW_SLIDE -->')) {
        const cleanText = text.replace('<!-- ACTION:NEW_SLIDE -->', '').trim();
        newSlides.push(cleanText);
        setCurrentSlideIndex(newSlides.length - 1);
      }
      // Otherwise append to current slide
      else {
        newSlides[currentSlideIndex] += `<br/>${text}`;
      }
      
      setSlides(newSlides);
      saveContent(newSlides);
    }
  }));

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (slideRef.current) {
      slideRef.current.focus();
      handleInput(); // Trigger save
    }
  };


  const saveContent = async (data: string[]) => {
    try {
      const token = localStorage.getItem("vexius_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      await fetch(`${apiUrl}/documents/${documentId}/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: JSON.stringify(data) })
      });
    } catch (e) {
      console.error("Autosave failed", e);
    }
  };

  const handleInput = () => {
    if (!slideRef.current) return;
    const content = slideRef.current.innerHTML;
    const newSlides = [...slides];
    newSlides[currentSlideIndex] = content;
    setSlides(newSlides);

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      saveContent(newSlides);
    }, 2000);
  };

  const addSlide = () => {
    const newSlides = [...slides, '<h2>New Slide</h2>'];
    setSlides(newSlides);
    setCurrentSlideIndex(newSlides.length - 1);
    saveContent(newSlides);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: '#f3f4f6' }}>
      
      {/* Top Ribbon */}
      <VexiusSlideRibbon 
        navbarElement={navbarElement} 
        isCopilotVisible={isCopilotVisible} 
        onFormat={handleFormat}
      />

      {/* Main Area: Copilot + Thumbnails + Canvas */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Left Sidebar (AI Copilot) */}
        {isCopilotVisible && sidebar && (
          <div style={{ 
            width: '320px', 
            flexShrink: 0, 
            background: '#fff', 
            borderRight: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {sidebar}
          </div>
        )}

        {/* Left Thumbnails Pane */}
        <div style={{ 
          width: '200px', 
          background: '#f9fafb', 
          borderRight: '1px solid #e5e7eb', 
          display: 'flex', 
          flexDirection: 'column',
          overflowY: 'auto',
          padding: '16px 0'
        }}>
          {slides.map((s, index) => (
            <div 
              key={index}
              onClick={() => setCurrentSlideIndex(index)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                padding: '8px 16px',
                cursor: 'pointer',
                background: currentSlideIndex === index ? '#f3f4f6' : 'transparent',
              }}
            >
              <div style={{ width: '20px', fontSize: '12px', color: '#6b7280', paddingTop: '4px' }}>
                {index + 1}
              </div>
              <div style={{ 
                flex: 1, 
                aspectRatio: '16/9', 
                background: '#fff', 
                border: currentSlideIndex === index ? '2px solid #ea580c' : '1px solid #d1d5db',
                borderRadius: '4px',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div 
                  dangerouslySetInnerHTML={{ __html: s }} 
                  style={{ transform: 'scale(0.15)', transformOrigin: 'top left', width: '666%', height: '666%', padding: '20px', color: '#000' }} 
                />
              </div>
            </div>
          ))}
          <button 
            onClick={addSlide} 
            style={{ margin: '16px', padding: '8px', border: '1px dashed #d1d5db', borderRadius: '4px', background: 'transparent', cursor: 'pointer', color: '#6b7280' }}
          >
            + Add Slide
          </button>
        </div>

        {/* Center Canvas */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto', position: 'relative' }}>
          
          <div style={{ 
            width: '960px', 
            height: '540px', 
            background: '#fff', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', 
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'center center',
            display: 'flex'
          }}>
            <div 
              ref={slideRef}
              contentEditable
              onInput={handleInput}
              suppressContentEditableWarning
              dangerouslySetInnerHTML={{ __html: slides[currentSlideIndex] }}
              style={{ 
                flex: 1,
                padding: '48px',
                outline: 'none',
                fontSize: '1.5rem',
                overflow: 'hidden',
                color: '#000'
              }}
            />
          </div>
        </div>



      </div>

      {/* Status Bar */}
      <div style={{
        background: '#f3f4f6',
        borderTop: '1px solid #e5e7eb',
        padding: '2px 16px',
        fontSize: '11px',
        color: '#6b7280',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '24px',
        flexShrink: 0
      }}>
        {/* Left Side */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span>Slide {currentSlideIndex + 1} of {slides.length}</span>
        </div>
        
        {/* Right Side */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280' }}>Notes</button>
          
          <button 
            onClick={() => setZoomLevel(z => Math.max(z - 10, 50))} 
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280', fontSize: '14px', padding: 0, width: '16px', marginLeft: '16px' }}
          >
            −
          </button>
          <input 
            type="range" 
            min="50" 
            max="150" 
            value={zoomLevel} 
            onChange={(e) => setZoomLevel(Number(e.target.value))}
            style={{ width: '80px', accentColor: '#6b7280' }}
          />
          <button 
            onClick={() => setZoomLevel(z => Math.min(z + 10, 150))} 
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280', fontSize: '14px', padding: 0, width: '16px' }}
          >
            +
          </button>
          <span style={{ width: '32px', textAlign: 'right' }}>{zoomLevel}%</span>
        </div>
      </div>
    </div>
  );
});

VexiusSlideEditor.displayName = "VexiusSlideEditor";
