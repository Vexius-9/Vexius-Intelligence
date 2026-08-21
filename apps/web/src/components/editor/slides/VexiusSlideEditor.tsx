import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

export interface VexiusSlideEditorProps {
  documentId: string;
  initialContent?: any;
}

export interface VexiusSlideEditorRef {
  getFullText: () => string;
  getCurrentSelection: () => string;
  applyAction: (text: string) => void;
}

export const VexiusSlideEditor = forwardRef<VexiusSlideEditorRef, VexiusSlideEditorProps>(({ documentId, initialContent }, ref) => {
  const [slides, setSlides] = useState<string[]>(['<h1>Welcome to Vexius Slides</h1><p>Edit me...</p>']);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const slideRef = useRef<HTMLDivElement>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      // Just append text to the current slide for prototype
      const newSlides = [...slides];
      newSlides[currentSlideIndex] += `<br/>${text}`;
      setSlides(newSlides);
      saveContent(newSlides);
    }
  }));

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f3f4f6' }}>
      <div style={{ padding: '16px', background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <button onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))} disabled={currentSlideIndex === 0} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>
          Prev
        </button>
        <span style={{ fontWeight: 600 }}>Slide {currentSlideIndex + 1} of {slides.length}</span>
        <button onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))} disabled={currentSlideIndex === slides.length - 1} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>
          Next
        </button>
        <button onClick={addSlide} style={{ padding: '8px 16px', background: '#000', color: '#fff', borderRadius: '4px', cursor: 'pointer', marginLeft: 'auto' }}>
          + Add Slide
        </button>
      </div>
      
      <div style={{ flex: 1, padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto' }}>
        <div 
          ref={slideRef}
          contentEditable
          onInput={handleInput}
          suppressContentEditableWarning
          dangerouslySetInnerHTML={{ __html: slides[currentSlideIndex] }}
          style={{ 
            width: '800px', 
            height: '450px', 
            background: '#fff', 
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', 
            padding: '40px',
            outline: 'none',
            fontSize: '1.5rem'
          }}
        />
      </div>
    </div>
  );
});

VexiusSlideEditor.displayName = "VexiusSlideEditor";
