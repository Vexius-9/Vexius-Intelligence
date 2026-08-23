import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { VexiusSlideRibbon } from './VexiusSlideRibbon';
import { Paperclip, CornerDownLeft, Trash2 } from 'lucide-react';

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
  const [notes, setNotes] = useState<string[]>(['']);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [hoveredSlideIndex, setHoveredSlideIndex] = useState<number | null>(null);
  const [isCopilotVisible, setIsCopilotVisible] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(83);
  
  const [isPanning, setIsPanning] = useState(false);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const deleteSlide = (indexToDelete: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (slides.length <= 1) return; // Prevent deleting the last slide
    
    const newSlides = [...slides];
    const newNotes = [...notes];
    newSlides.splice(indexToDelete, 1);
    newNotes.splice(indexToDelete, 1);
    
    setSlides(newSlides);
    setNotes(newNotes);
    
    if (currentSlideIndex === indexToDelete) {
      setCurrentSlideIndex(Math.max(0, indexToDelete - 1));
    } else if (currentSlideIndex > indexToDelete) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
    
    saveContent(newSlides, newNotes);
  };

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
          setNotes(new Array(parsed.length).fill(''));
        } else if (parsed && Array.isArray(parsed.slides)) {
          setSlides(parsed.slides);
          setNotes(parsed.notes || new Array(parsed.slides.length).fill(''));
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
      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : '';
      if (text) {
        return text;
      }
      return `Slide ${currentSlideIndex + 1} Content:\n${slides[currentSlideIndex]}`;
    },
    applyAction: (text: string) => {
      let newSlides = [...slides];
      let newNotes = [...notes];
      
      const isNotes = text.includes('<!-- ACTION:SPEAKER_NOTES -->');
      const isReplace = text.includes('<!-- ACTION:REPLACE_SLIDE -->');
      const isNew = text.includes('<!-- ACTION:NEW_SLIDE -->');
      
      let cleanText = text.replace('<!-- ACTION:SPEAKER_NOTES -->', '').replace('<!-- ACTION:REPLACE_SLIDE -->', '').replace('<!-- ACTION:NEW_SLIDE -->', '').trim();
      
      const parseMarkdownToHtml = (textPart: string) => {
        let htmlText = textPart;
        const isHtml = /<[a-z][\s\S]*>/i.test(htmlText);
        if (!isHtml) {
          htmlText = htmlText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          htmlText = htmlText.replace(/\*(.*?)\*/g, '<em>$1</em>');
          htmlText = htmlText.replace(/^### (.*$)/gim, '<h3>$1</h3>');
          htmlText = htmlText.replace(/^## (.*$)/gim, '<h2>$1</h2>');
          htmlText = htmlText.replace(/^# (.*$)/gim, '<h1>$1</h1>');
          htmlText = htmlText.split('\n\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('');
        }
        return htmlText;
      };

      if (isNotes) {
        newNotes[currentSlideIndex] = parseMarkdownToHtml(cleanText);
        setNotes(newNotes);
        saveContent(slides, newNotes);
        return;
      }
      // Try splitting by the new explicit separator first
      let parts = cleanText.split(/---SLIDE_SEPARATOR---/g).map(s => s.trim()).filter(s => s.length > 0);
      
      // Fallback: If AI still used the old format like "Slide 1:" or "# Slide 1:"
      if (parts.length === 1) {
        const slideRegex = /(?:^|\n|<[^>]+>|#+\s*\*?)\s*\*?Slide\s*\d+[:\-]?\s*\*?(?:<\/[^>]+>)?/gi;
        parts = parts[0].split(slideRegex).map(s => s.trim()).filter(s => s.length > 0);
      }
      
      parts = parts.map(parseMarkdownToHtml);
      
      if (parts.length > 1) {
        if (isReplace) {
          // Replace current slide with the first, then append the rest immediately after
          newSlides[currentSlideIndex] = parts[0];
          newSlides.splice(currentSlideIndex + 1, 0, ...parts.slice(1));
          
          newNotes.splice(currentSlideIndex + 1, 0, ...new Array(parts.length - 1).fill(''));
          
          setCurrentSlideIndex(currentSlideIndex + parts.length - 1);
        } else if (isNew) {
          newSlides.push(...parts);
          newNotes.push(...new Array(parts.length).fill(''));
          setCurrentSlideIndex(newSlides.length - 1);
        } else {
          newSlides.push(...parts);
          newNotes.push(...new Array(parts.length).fill(''));
          setCurrentSlideIndex(newSlides.length - 1);
        }
      } else {
        // Single slide logic
        if (isReplace) {
          newSlides[currentSlideIndex] = cleanText;
        } else if (isNew) {
          newSlides.push(cleanText);
          newNotes.push('');
          setCurrentSlideIndex(newSlides.length - 1);
        } else {
          newSlides[currentSlideIndex] += `<br/>${cleanText}`;
        }
      }
      
      setSlides(newSlides);
      setNotes(newNotes);
      saveContent(newSlides, newNotes);
    }
  }));

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (slideRef.current) {
      slideRef.current.focus();
      handleInput(); // Trigger save
    }
  };


  const saveContent = async (slideData: string[], noteData: string[]) => {
    try {
      const token = localStorage.getItem("vexius_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      await fetch(`${apiUrl}/documents/${documentId}/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: JSON.stringify({ slides: slideData, notes: noteData }) })
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
      saveContent(newSlides, notes);
    }, 1000);
  };

  const handleNotesInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newNotes = [...notes];
    newNotes[currentSlideIndex] = e.currentTarget.innerHTML;
    setNotes(newNotes);
    
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      saveContent(slides, newNotes);
    }, 1000);
  };

  const addSlide = () => {
    const newSlides = [...slides, '<h1>New Slide</h1>'];
    const newNotes = [...notes, ''];
    setSlides(newSlides);
    setNotes(newNotes);
    setCurrentSlideIndex(newSlides.length - 1);
    saveContent(newSlides, newNotes);
  };

  const handleWrapperMouseDown = (e: React.MouseEvent) => {
    // Start pan if clicking on the wrapper background, or using middle mouse button
    if (e.target === e.currentTarget || e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
    }
  };

  const handleWrapperMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !canvasWrapperRef.current) return;
    canvasWrapperRef.current.scrollLeft -= e.movementX;
    canvasWrapperRef.current.scrollTop -= e.movementY;
  };

  const handleWrapperMouseUpOrLeave = () => {
    setIsPanning(false);
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

        {/* Left Sidebar (Thumbnails) */}
        <div style={{ width: '200px', background: '#1f2937', borderRight: '1px solid #374151', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {slides.map((s, index) => (
            <div 
              key={index}
              onClick={() => setCurrentSlideIndex(index)}
              onMouseEnter={() => setHoveredSlideIndex(index)}
              onMouseLeave={() => setHoveredSlideIndex(null)}
              style={{ 
                padding: '12px', 
                cursor: 'pointer',
                background: currentSlideIndex === index ? '#374151' : 'transparent',
                borderBottom: '1px solid #374151'
              }}
            >
              <div style={{ paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 'bold' }}>{index + 1}</span>
                {hoveredSlideIndex === index && slides.length > 1 && (
                  <button 
                    onClick={(e) => deleteSlide(index, e)}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}
                    title="Delete Slide"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div 
                className="vexius-slide-container"
                style={{ 
                width: '100%', 
                aspectRatio: '16/9', 
                background: '#fff', 
                border: currentSlideIndex === index ? '2px solid #ea580c' : '1px solid #d1d5db',
                borderRadius: '4px',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div 
                  className="vexius-slide-content"
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
        <div 
          ref={canvasWrapperRef}
          onMouseDown={handleWrapperMouseDown}
          onMouseMove={handleWrapperMouseMove}
          onMouseUp={handleWrapperMouseUpOrLeave}
          onMouseLeave={handleWrapperMouseUpOrLeave}
          style={{ 
            flex: 1, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            overflow: 'auto', 
            position: 'relative',
            cursor: isPanning ? 'grabbing' : 'auto'
          }}
        >
          
          <div 
            className="vexius-slide-container"
            style={{ 
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
              className="vexius-slide-content"
              contentEditable
              onInput={handleInput}
              suppressContentEditableWarning
              dangerouslySetInnerHTML={{ __html: slides[currentSlideIndex] }}
              style={{ 
                flex: 1,
                padding: '48px',
                outline: 'none',
                fontSize: '1.5rem',
                overflow: 'auto',
                color: '#000'
              }}
            />
          </div>
          
          {/* Notes Area */}
          {showNotes && (
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '150px',
              background: '#f9fafb',
              borderTop: '1px solid #e5e7eb',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280' }}>SPEAKER NOTES</span>
                <button onClick={() => setShowNotes(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '12px' }}>Close</button>
              </div>
              <div
                contentEditable
                onInput={handleNotesInput}
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: notes[currentSlideIndex] || '' }}
                data-placeholder="Click to add notes..."
                style={{
                  flex: 1,
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  color: '#374151',
                  lineHeight: 1.5,
                  overflow: 'auto',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          )}
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
          <button 
            onClick={() => setShowNotes(!showNotes)}
            style={{ 
              border: 'none', 
              background: showNotes ? '#e5e7eb' : 'transparent', 
              cursor: 'pointer', 
              color: showNotes ? '#374151' : '#6b7280',
              padding: '4px 8px',
              borderRadius: '4px',
              fontWeight: showNotes ? 500 : 400
            }}
          >
            Notes
          </button>
          
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
