import React from 'react';
import { 
  Menu, Search, BookOpen, Moon, 
  ZoomOut, ZoomIn, Maximize, FileImage,
  Highlighter, Underline, Strikethrough,
  Eraser, PenTool, Square, Circle, ArrowUpRight, StickyNote, Signature,
  Palette, RotateCcw, RotateCw, Trash2, Download
} from 'lucide-react';
import { PdfTool } from './VexiusPdfEditor';

export interface VexiusPdfRibbonProps {
  navbarElement?: React.ReactNode;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitWidth: () => void;
  onFitPage: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onDeletePage: () => void;
  onExtractPage: () => void;
  activeTool: PdfTool;
  onSelectTool: (tool: PdfTool) => void;
  activeColor: string;
  onSelectColor: (color: string) => void;
  pageNumber: number;
  numPages: number;
}

export function VexiusPdfRibbon({ 
  navbarElement,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  onFitPage,
  onRotateLeft,
  onRotateRight,
  onDeletePage,
  onExtractPage,
  activeTool,
  onSelectTool,
  activeColor,
  onSelectColor,
  pageNumber,
  numPages
}: VexiusPdfRibbonProps) {

  const RibbonButton = ({ onClick, isActive, children, label, activeColor = '#fee2e2' }: { onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void, isActive?: boolean, children: React.ReactNode, label: string, activeColor?: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <button 
        onClick={onClick}
        style={{
          padding: '4px',
          borderRadius: '4px',
          border: 'none',
          background: isActive ? activeColor : 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isActive ? '#dc2626' : '#4b5563',
          transition: 'background 0.2s'
        }}
        onMouseOver={(e) => {
          if (!isActive) e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
        }}
        onMouseOut={(e) => {
          if (!isActive) e.currentTarget.style.background = 'transparent';
        }}
      >
        {children}
      </button>
      <span style={{ fontSize: '10px', color: isActive ? '#dc2626' : '#6b7280', fontWeight: isActive ? 600 : 400 }}>{label}</span>
    </div>
  );

  const Divider = () => (
    <div style={{ width: '1px', height: '32px', background: '#e5e7eb', margin: '0 8px' }} />
  );

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      background: '#fff',
      borderBottom: '1px solid #e5e7eb',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      flexShrink: 0
    }}>
      {/* Top Navbar Context (e.g. Breadcrumbs) */}
      {navbarElement}

      {/* Ribbon Content */}
      <div style={{ display: 'flex', padding: '8px 16px', gap: '8px', alignItems: 'center', background: '#f9fafb', overflowX: 'auto', minHeight: '64px' }}>
        
        {/* Navigation Group */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <RibbonButton label="Thumbnails" isActive={true}><Menu size={20} /></RibbonButton>
          <RibbonButton label="Outline"><Menu size={20} /></RibbonButton>
          <RibbonButton label="Search"><Search size={20} /></RibbonButton>
          <RibbonButton label="Two pages"><BookOpen size={20} /></RibbonButton>
          <RibbonButton label="Night mode"><Moon size={20} /></RibbonButton>
        </div>

        <Divider />

        {/* Zoom Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: '4px', background: '#fff', padding: '2px', fontSize: '12px' }}>
            <span style={{ padding: '0 4px', borderRight: '1px solid #d1d5db', color: '#374151' }}>{pageNumber}</span>
            <span style={{ padding: '0 4px', color: '#6b7280' }}>of {numPages}</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button onClick={onZoomOut} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px' }}><ZoomOut size={16} color="#6b7280" /></button>
            <span style={{ fontSize: '12px', width: '36px', textAlign: 'center', color: '#374151' }}>{Math.round(zoomLevel * 100)}%</span>
            <button onClick={onZoomIn} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px' }}><ZoomIn size={16} color="#6b7280" /></button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <RibbonButton label="Fit width" onClick={onFitWidth}><Maximize size={18} /></RibbonButton>
            <RibbonButton label="Fit page" onClick={onFitPage}><FileImage size={18} /></RibbonButton>
          </div>
        </div>

        <Divider />

        {/* Highlight & Markup */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <RibbonButton label="Highlight" isActive={activeTool === 'highlight'} onClick={() => onSelectTool(activeTool === 'highlight' ? 'select' : 'highlight')}><Highlighter size={20} /></RibbonButton>
          <RibbonButton label="Underline" isActive={activeTool === 'underline'} onClick={() => onSelectTool(activeTool === 'underline' ? 'select' : 'underline')}><Underline size={20} /></RibbonButton>
          <RibbonButton label="Strikethrough" isActive={activeTool === 'strikethrough'} onClick={() => onSelectTool(activeTool === 'strikethrough' ? 'select' : 'strikethrough')}><Strikethrough size={20} /></RibbonButton>
        </div>

        <Divider />

        {/* Drawing & Annotation */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <RibbonButton label="Draw" isActive={activeTool === 'draw'} onClick={() => onSelectTool(activeTool === 'draw' ? 'select' : 'draw')}><PenTool size={20} /></RibbonButton>
          <RibbonButton label="Rectangle" isActive={activeTool === 'rectangle'} onClick={() => onSelectTool(activeTool === 'rectangle' ? 'select' : 'rectangle')}><Square size={20} /></RibbonButton>
          <RibbonButton label="Ellipse" isActive={activeTool === 'ellipse'} onClick={() => onSelectTool(activeTool === 'ellipse' ? 'select' : 'ellipse')}><Circle size={20} /></RibbonButton>
          <RibbonButton label="Arrow" isActive={activeTool === 'arrow'} onClick={() => onSelectTool(activeTool === 'arrow' ? 'select' : 'arrow')}><ArrowUpRight size={20} /></RibbonButton>
          <RibbonButton label="Note" isActive={activeTool === 'note'} onClick={() => onSelectTool(activeTool === 'note' ? 'select' : 'note')}><StickyNote size={20} /></RibbonButton>
          <RibbonButton label="Sign" isActive={activeTool === 'sign'} onClick={() => onSelectTool(activeTool === 'sign' ? 'select' : 'sign')}><Signature size={20} /></RibbonButton>
          <RibbonButton label="Eraser" isActive={activeTool === 'eraser'} onClick={() => onSelectTool(activeTool === 'eraser' ? 'select' : 'eraser')}><Eraser size={20} /></RibbonButton>
          
          {/* Color Picker */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ display: 'flex', gap: '4px', padding: '4px 0', alignItems: 'center' }}>
              {['#000000', '#ef4444', '#f59e0b', '#10b981', '#3b82f6'].map(c => (
                <div 
                  key={c} 
                  onClick={() => onSelectColor(c)}
                  style={{ 
                    width: '14px', 
                    height: '14px', 
                    borderRadius: '50%', 
                    background: c,
                    cursor: 'pointer',
                    border: activeColor === c ? '2px solid #6b7280' : '1px solid #d1d5db'
                  }} 
                />
              ))}
              <input 
                type="color" 
                value={activeColor} 
                onChange={(e) => onSelectColor(e.target.value)}
                style={{
                  width: '20px',
                  height: '20px',
                  padding: 0,
                  border: 'none',
                  cursor: 'pointer',
                  background: 'transparent'
                }}
                title="Custom Color"
              />
            </div>
            <span style={{ fontSize: '10px', color: '#6b7280' }}>Color</span>
          </div>
        </div>

        <Divider />

        {/* Page Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <RibbonButton label="Rotate left" onClick={onRotateLeft}><RotateCcw size={20} /></RibbonButton>
          <RibbonButton label="Rotate right" onClick={onRotateRight}><RotateCw size={20} /></RibbonButton>
          <RibbonButton label="Delete Page" onClick={onDeletePage}><Trash2 size={20} /></RibbonButton>
          <RibbonButton label="Download" onClick={onExtractPage}><Download size={20} /></RibbonButton>
        </div>

      </div>
    </div>
  );
}
