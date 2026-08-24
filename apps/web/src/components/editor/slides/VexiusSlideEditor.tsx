import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
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
  const [isPresenting, setIsPresenting] = useState(false);
  const [isUsingPresenterView, setIsUsingPresenterView] = useState(true);
  const [presenterScale, setPresenterScale] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(83);
  const [slideUpdateKey, setSlideUpdateKey] = useState(0);
  const [draggedSlideIndex, setDraggedSlideIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  
  const [isPanning, setIsPanning] = useState(false);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentSlideHtml = useMemo(() => slides[currentSlideIndex], [currentSlideIndex, slideUpdateKey]);
  const currentNotesHtml = useMemo(() => notes[currentSlideIndex] || '', [currentSlideIndex, slideUpdateKey]);

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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSlideIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (index !== dropTargetIndex) {
      setDropTargetIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    setDropTargetIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedSlideIndex === null || draggedSlideIndex === targetIndex) {
      setDraggedSlideIndex(null);
      setDropTargetIndex(null);
      return;
    }

    const newSlides = [...slides];
    const newNotes = [...notes];
    
    const [movedSlide] = newSlides.splice(draggedSlideIndex, 1);
    const [movedNote] = newNotes.splice(draggedSlideIndex, 1);
    
    newSlides.splice(targetIndex, 0, movedSlide);
    newNotes.splice(targetIndex, 0, movedNote);
    
    setSlides(newSlides);
    setNotes(newNotes);
    
    if (currentSlideIndex === draggedSlideIndex) {
      setCurrentSlideIndex(targetIndex);
    } else if (draggedSlideIndex < currentSlideIndex && targetIndex >= currentSlideIndex) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    } else if (draggedSlideIndex > currentSlideIndex && targetIndex <= currentSlideIndex) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }

    saveContent(newSlides, newNotes);
    setDraggedSlideIndex(null);
    setDropTargetIndex(null);
  };

  useEffect(() => {
    const handleToggleAI = () => setIsCopilotVisible(prev => !prev);
    const handleStartSlideshow = (e: any) => {
      const { fromBeginning, usePresenterView } = e.detail || { fromBeginning: false, usePresenterView: true };
      if (fromBeginning) {
        setCurrentSlideIndex(0);
      }
      setIsUsingPresenterView(usePresenterView);
      setIsPresenting(true);
      
      // Calculate initial scale
      const calculateScale = () => {
        const availableWidth = usePresenterView ? window.innerWidth - 480 : window.innerWidth;
        const availableHeight = usePresenterView ? window.innerHeight - 80 : window.innerHeight;
        setPresenterScale(Math.min(availableWidth / 960, availableHeight / 540));
      };
      
      calculateScale();
      window.addEventListener('resize', calculateScale);
      
      // We attach the cleanup to a one-off listener when presentation exits
      // But actually, we can just let a global resize listener handle it if isPresenting is true
    };
    
    const handleDownloadHtml = () => {
      // Use state variable 'slides' which is in the component scope
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Vexius Presentation</title>
  <style>
    body { background: #f1f5f9; display: flex; flex-direction: column; align-items: center; gap: 24px; padding: 24px; font-family: 'Inter', 'Segoe UI', sans-serif; margin: 0; }
    .slide { width: 960px; height: 540px; background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%); box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 48px; box-sizing: border-box; position: relative; overflow: hidden; font-size: 1.5rem; color: #1f2937; }
    
    .vexius-slide-content { display: flex; flex-direction: column; justify-content: center; height: 100%; }
    .vexius-slide-content h1 { font-size: 3.5rem; font-weight: 800; color: #ea580c; margin-bottom: 0.5rem; line-height: 1.2; margin-top: 0; }
    .vexius-slide-content h2 { font-size: 2rem; font-weight: 600; color: #4b5563; margin-bottom: 1.5rem; border-bottom: 3px solid #ea580c; padding-bottom: 0.5rem; display: inline-block; margin-top: 0; }
    .vexius-slide-content p { font-size: 1.5rem; line-height: 1.6; color: #374151; margin-bottom: 1.5rem; margin-top: 0; }
    .vexius-slide-content ul, .vexius-slide-content ol { font-size: 1.5rem; line-height: 1.8; color: #374151; margin-bottom: 1.5rem; padding-left: 2rem; margin-top: 0; }
    .vexius-slide-content li { margin-bottom: 0.5rem; }
    .vexius-slide-content li::marker { color: #ea580c; }
  </style>
</head>
<body>
  ${slides.map(slide => `<div class="slide"><div class="vexius-slide-content">${slide}</div></div>`).join('\n  ')}
</body>
</html>`;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'presentation.html';
      a.click();
      URL.revokeObjectURL(url);
    };
    
    const captureSlidesAsImages = async (): Promise<string[]> => {
      const { default: html2canvas } = await import('html2canvas');
      const images: string[] = [];
      
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      document.body.appendChild(container);
      
      for (const slideHtml of slides) {
        const slideEl = document.createElement('div');
        slideEl.style.width = '960px';
        slideEl.style.height = '540px';
        slideEl.style.background = '#fff';
        slideEl.style.padding = '0';
        slideEl.style.boxSizing = 'border-box';
        slideEl.style.fontSize = '1.5rem';
        slideEl.style.color = '#000';
        slideEl.style.overflow = 'hidden';
        slideEl.className = 'vexius-slide-content'; // To apply any global slide css
        slideEl.innerHTML = slideHtml;
        
        // --- FIX FOR HTML2CANVAS GRADIENT TEXT BUG ---
        const gradientTexts = slideEl.querySelectorAll<HTMLElement>('[style*="background-clip: text"], [style*="-webkit-background-clip: text"]');
        gradientTexts.forEach(el => {
          const bg = el.style.background || el.style.backgroundImage;
          let fallbackColor = '#38bdf8'; // default fallback
          
          if (bg) {
            const hexMatch = bg.match(/#[0-9a-fA-F]{3,8}/);
            const rgbMatch = bg.match(/rgba?\([^)]+\)/);
            if (hexMatch) {
              fallbackColor = hexMatch[0];
            } else if (rgbMatch) {
              fallbackColor = rgbMatch[0];
            }
          }
          
          el.style.background = 'none';
          el.style.backgroundImage = 'none';
          el.style.webkitTextFillColor = 'initial';
          el.style.webkitBackgroundClip = 'initial';
          el.style.backgroundClip = 'initial';
          el.style.color = fallbackColor;
        });
        
        container.appendChild(slideEl);
        
        // Wait a tiny bit for the DOM to settle
        await new Promise(r => setTimeout(r, 50));
        
        const canvas = await html2canvas(slideEl, { scale: 2 }); // scale: 2 for better quality
        images.push(canvas.toDataURL('image/png'));
        
        container.innerHTML = '';
      }
      
      document.body.removeChild(container);
      return images;
    };
    
    const handleDownloadPdf = async () => {
      try {
        const { default: jsPDF } = await import('jspdf');
        const images = await captureSlidesAsImages();
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [960, 540] });
        
        images.forEach((img, i) => {
          if (i > 0) pdf.addPage([960, 540], 'landscape');
          pdf.addImage(img, 'PNG', 0, 0, 960, 540);
        });
        
        pdf.save('presentation.pdf');
      } catch (e) {
        console.error('Failed to generate PDF:', e);
      }
    };

    const handleDownloadPptx = async () => {
      try {
        const { default: PptxGenJS } = await import('pptxgenjs');
        const images = await captureSlidesAsImages();
        const pptx = new PptxGenJS();
        pptx.layout = 'LAYOUT_16x9';
        
        images.forEach((img) => {
          const slide = pptx.addSlide();
          slide.addImage({ data: img, x: 0, y: 0, w: '100%', h: '100%' });
        });
        
        pptx.writeFile({ fileName: 'presentation.pptx' });
      } catch (e) {
        console.error('Failed to generate PPTX:', e);
      }
    };

    window.addEventListener('vexius:toggle-ai', handleToggleAI as EventListener);
    window.addEventListener('vexius:start-slideshow', handleStartSlideshow as EventListener);
    window.addEventListener('vexius:download-html', handleDownloadHtml as EventListener);
    window.addEventListener('vexius:download-pdf', handleDownloadPdf as EventListener);
    window.addEventListener('vexius:download-pptx', handleDownloadPptx as EventListener);
    
    return () => {
      window.removeEventListener('vexius:toggle-ai', handleToggleAI as EventListener);
      window.removeEventListener('vexius:start-slideshow', handleStartSlideshow as EventListener);
      window.removeEventListener('vexius:download-html', handleDownloadHtml as EventListener);
      window.removeEventListener('vexius:download-pdf', handleDownloadPdf as EventListener);
      window.removeEventListener('vexius:download-pptx', handleDownloadPptx as EventListener);
      window.removeEventListener('resize', () => {}); // cleanup dummy
    };
  }, [slides, notes]);

  useEffect(() => {
    const handleForceSave = () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      // Immediately save the current state
      saveContent(slides, notes);
    };
    window.addEventListener('vexius:force-save', handleForceSave);
    return () => window.removeEventListener('vexius:force-save', handleForceSave);
  }, [slides, notes]);

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
          setSlideUpdateKey(k => k + 1);
        } else if (parsed && Array.isArray(parsed.slides)) {
          setSlides(parsed.slides);
          setNotes(parsed.notes || new Array(parsed.slides.length).fill(''));
          setSlideUpdateKey(k => k + 1);
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
        setSlideUpdateKey(k => k + 1);
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
      setSlideUpdateKey(k => k + 1);
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

  useEffect(() => {
    if (!isPresenting) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        setCurrentSlideIndex(prev => Math.min(prev + 1, slides.length - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentSlideIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        setIsPresenting(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresenting, slides.length]);

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
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => setCurrentSlideIndex(index)}
              onMouseEnter={() => setHoveredSlideIndex(index)}
              onMouseLeave={() => setHoveredSlideIndex(null)}
              style={{ 
                padding: '12px', 
                cursor: 'grab',
                background: currentSlideIndex === index ? '#374151' : 'transparent',
                borderTop: dropTargetIndex === index && draggedSlideIndex !== null && index < draggedSlideIndex ? '2px solid #ea580c' : 'none',
                borderBottom: dropTargetIndex === index && draggedSlideIndex !== null && index > draggedSlideIndex ? '2px solid #ea580c' : '1px solid #374151',
                opacity: draggedSlideIndex === index ? 0.5 : 1
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
                  style={{ transform: 'scale(0.15)', transformOrigin: 'top left', width: '666%', height: '666%', padding: '0', color: '#000', overflow: 'hidden' }} 
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
              dangerouslySetInnerHTML={{ __html: currentSlideHtml }}
              style={{ 
                flex: 1,
                padding: '0',
                outline: 'none',
                fontSize: '1.5rem',
                overflow: 'hidden',
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
                dangerouslySetInnerHTML={{ __html: currentNotesHtml }}
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

      {/* Presenter View Overlay */}
      {isPresenting && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: isUsingPresenterView ? '#0f172a' : '#000',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'row'
        }}>
          {/* Main Slide Area */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
             <div 
               className="vexius-slide-container" 
               style={{ 
                 width: '960px',
                 height: '540px',
                 background: '#fff',
                 display: 'flex',
                 transform: `scale(${presenterScale})`,
                 transformOrigin: 'center center'
               }}
             >
                <div 
                  className="vexius-slide-content"
                  dangerouslySetInnerHTML={{ __html: slides[currentSlideIndex] }}
                  style={{ flex: 1, padding: '48px', fontSize: '1.5rem', color: '#000', overflow: 'hidden' }}
                />
             </div>
             
             {/* Navigation controls */}
             {isUsingPresenterView && (
               <div style={{ position: 'absolute', bottom: '32px', display: 'flex', gap: '24px', background: 'rgba(0,0,0,0.6)', padding: '12px 24px', borderRadius: '30px', backdropFilter: 'blur(10px)' }}>
                  <button onClick={() => setCurrentSlideIndex(prev => Math.max(prev - 1, 0))} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center' }}>&larr;</button>
                  <span style={{ color: 'white', lineHeight: '24px', fontSize: '14px', fontWeight: 500, fontFamily: 'monospace' }}>
                    {currentSlideIndex + 1} / {slides.length}
                  </span>
                  <button onClick={() => setCurrentSlideIndex(prev => Math.min(prev + 1, slides.length - 1))} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center' }}>&rarr;</button>
               </div>
             )}
          </div>
          
          {/* Presenter Notes Panel */}
          {isUsingPresenterView && (
            <div style={{ width: '400px', background: '#1e293b', borderLeft: '1px solid #334155', color: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#94a3b8', letterSpacing: '1px' }}>PRESENTER VIEW</h3>
                <button onClick={() => setIsPresenting(false)} style={{ background: '#ef4444', border: 'none', color: 'white', cursor: 'pointer', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>EXIT</button>
              </div>
              
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1, fontSize: '16px', lineHeight: 1.6 }}>
                {notes[currentSlideIndex] && notes[currentSlideIndex].trim() !== '' ? (
                  <div dangerouslySetInnerHTML={{ __html: notes[currentSlideIndex] }} />
                ) : (
                  <div style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center', marginTop: '40px' }}>No speaker notes for this slide.</div>
                )}
              </div>
              
              <div style={{ padding: '16px', borderTop: '1px solid #334155', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
                Use <kbd style={{ background: '#334155', padding: '2px 6px', borderRadius: '4px' }}>Space</kbd> or arrows to navigate
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

VexiusSlideEditor.displayName = "VexiusSlideEditor";
