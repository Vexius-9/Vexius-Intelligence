import React from 'react';
import { 
  Menu, Search, BookOpen, Moon, 
  ZoomOut, ZoomIn, Maximize, FileImage,
  Highlighter, Underline, Strikethrough,
  PenTool, Square, Circle, ArrowUpRight, StickyNote, Signature,
  Palette, RotateCcw, RotateCw, Trash2, Download
} from 'lucide-react';

export interface VexiusPdfRibbonProps {
  navbarElement?: React.ReactNode;
}

export function VexiusPdfRibbon({ navbarElement }: VexiusPdfRibbonProps) {

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
            <span style={{ padding: '0 4px', borderRight: '1px solid #d1d5db' }}>1</span>
            <span style={{ padding: '0 4px', color: '#6b7280' }}>of 5</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px' }}><ZoomOut size={16} color="#6b7280" /></button>
            <span style={{ fontSize: '12px', width: '36px', textAlign: 'center' }}>175%</span>
            <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px' }}><ZoomIn size={16} color="#6b7280" /></button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <RibbonButton label="Fit width"><Maximize size={18} /></RibbonButton>
            <RibbonButton label="Fit page"><FileImage size={18} /></RibbonButton>
          </div>
        </div>

        <Divider />

        {/* Highlight & Markup */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <RibbonButton label="Highlight"><Highlighter size={20} /></RibbonButton>
          <RibbonButton label="Underline"><Underline size={20} /></RibbonButton>
          <RibbonButton label="Strikethrough"><Strikethrough size={20} /></RibbonButton>
        </div>

        <Divider />

        {/* Drawing & Annotation */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <RibbonButton label="Draw"><PenTool size={20} /></RibbonButton>
          <RibbonButton label="Rectangle"><Square size={20} /></RibbonButton>
          <RibbonButton label="Ellipse"><Circle size={20} /></RibbonButton>
          <RibbonButton label="Arrow"><ArrowUpRight size={20} /></RibbonButton>
          <RibbonButton label="Note"><StickyNote size={20} /></RibbonButton>
          <RibbonButton label="Sign"><Signature size={20} /></RibbonButton>
          
          {/* Color Picker Mock */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ display: 'flex', gap: '2px', padding: '4px 0' }}>
              {['#ef4444', '#f59e0b', '#10b981', '#3b82f6'].map(c => (
                <div key={c} style={{ width: '12px', height: '12px', borderRadius: '50%', background: c }} />
              ))}
            </div>
            <span style={{ fontSize: '10px', color: '#6b7280' }}>Color</span>
          </div>
        </div>

        <Divider />

        {/* Page Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <RibbonButton label="Rotate left"><RotateCcw size={20} /></RibbonButton>
          <RibbonButton label="Rotate right"><RotateCw size={20} /></RibbonButton>
          <RibbonButton label="Delete page"><Trash2 size={20} /></RibbonButton>
          <RibbonButton label="Extract page"><Download size={20} /></RibbonButton>
        </div>

      </div>
    </div>
  );
}
