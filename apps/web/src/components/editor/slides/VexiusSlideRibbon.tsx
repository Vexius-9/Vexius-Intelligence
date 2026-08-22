import React from 'react';
import { 
  ClipboardPaste, LayoutTemplate, LayoutGrid, Library,
  Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  PaintBucket, Type,
  Sparkles, CheckCircle2, Image as ImageIcon,
  Search, PanelRight
} from 'lucide-react';

export interface VexiusSlideRibbonProps {
  navbarElement?: React.ReactNode;
}

export function VexiusSlideRibbon({ navbarElement }: VexiusSlideRibbonProps) {
  const [activeTab, setActiveTab] = React.useState('Home');

  const RibbonButton = ({ onClick, isActive, children }: { onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void, isActive?: boolean, children: React.ReactNode }) => (
    <button 
      onClick={onClick}
      style={{
        padding: '6px 8px',
        borderRadius: '4px',
        border: 'none',
        background: isActive ? 'rgba(0,0,0,0.1)' : 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isActive ? '#000' : '#4b5563',
        transition: 'background 0.2s'
      }}
      onMouseOver={(e) => e.currentTarget.style.background = isActive ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)'}
      onMouseOut={(e) => e.currentTarget.style.background = isActive ? 'rgba(0,0,0,0.1)' : 'transparent'}
    >
      {children}
    </button>
  );

  const Divider = () => (
    <div style={{ width: '1px', height: '40px', background: '#e5e7eb', margin: '0 8px' }} />
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '16px', padding: '0 16px', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <button style={{ 
          padding: '8px 16px', 
          border: 'none', 
          background: '#ea580c', 
          color: '#fff', 
          fontWeight: 500, 
          cursor: 'pointer',
          borderRadius: '4px 4px 0 0'
        }}>
          File
        </button>
        {['Home', 'Insert', 'Draw', 'Design', 'Transitions', 'Animations', 'Slide Show', 'Review', 'View'].map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            style={{ 
              padding: '8px 4px',
              border: 'none', 
              background: 'transparent',
              color: activeTab === tab ? '#ea580c' : '#4b5563',
              borderBottom: activeTab === tab ? '2px solid #ea580c' : '2px solid transparent',
              fontWeight: activeTab === tab ? 600 : 400,
              cursor: 'pointer'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Ribbon Content */}
      <div style={{ display: 'flex', padding: '8px 16px', gap: '4px', alignItems: 'center', background: '#f9fafb', minHeight: '60px', overflowX: 'auto' }}>
        
        {/* Vexius AI Group */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', paddingRight: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: 600 }}>
            <div style={{ background: '#10b981', color: '#fff', padding: '2px', borderRadius: '4px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="m19 12-7 7"/></svg>
            </div>
            Vexius
          </div>
        </div>

        <Divider />

        {/* AI Tools */}
        <div style={{ display: 'flex', gap: '2px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '64px' }}>
            <RibbonButton><Sparkles size={20} color="#3b82f6" /></RibbonButton>
            <span style={{ fontSize: '10px', color: '#6b7280' }}>AI Beautify</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '64px' }}>
            <RibbonButton><CheckCircle2 size={20} color="#3b82f6" /></RibbonButton>
            <span style={{ fontSize: '10px', color: '#6b7280' }}>AI Fact Check</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '64px' }}>
            <RibbonButton><ImageIcon size={20} color="#3b82f6" /></RibbonButton>
            <span style={{ fontSize: '10px', color: '#6b7280' }}>AI Image</span>
          </div>
        </div>

        <Divider />

        {/* Clipboard */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <RibbonButton><ClipboardPaste size={20} /></RibbonButton>
          <span style={{ fontSize: '10px', color: '#6b7280' }}>Paste</span>
        </div>

        <Divider />

        {/* Slides */}
        <div style={{ display: 'flex', gap: '2px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <RibbonButton><LayoutTemplate size={20} /></RibbonButton>
            <span style={{ fontSize: '10px', color: '#6b7280' }}>New Slide</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <RibbonButton><LayoutGrid size={20} /></RibbonButton>
            <span style={{ fontSize: '10px', color: '#6b7280' }}>Layout</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <RibbonButton><Library size={20} /></RibbonButton>
            <span style={{ fontSize: '10px', color: '#6b7280' }}>Add Section</span>
          </div>
        </div>

        <Divider />

        {/* Typography */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <select style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 4px', fontSize: '12px', background: '#fff' }}>
              <option>Calibri</option>
              <option>Arial</option>
            </select>
            <select style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 4px', fontSize: '12px', background: '#fff', width: '50px' }}>
              <option>18</option>
              <option>24</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '2px' }}>
            <RibbonButton><Bold size={16} /></RibbonButton>
            <RibbonButton><Italic size={16} /></RibbonButton>
            <RibbonButton><Underline size={16} /></RibbonButton>
          </div>
        </div>

        <Divider />

        {/* Paragraph & Formatting */}
        <div style={{ display: 'flex', gap: '2px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '64px' }}>
            <RibbonButton><AlignLeft size={20} /></RibbonButton>
            <span style={{ fontSize: '10px', color: '#6b7280' }}>Paragraph</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '64px' }}>
            <RibbonButton><PanelRight size={20} /></RibbonButton>
            <span style={{ fontSize: '10px', color: '#6b7280' }}>Format Pane</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '64px' }}>
            <RibbonButton><AlignCenter size={20} /></RibbonButton>
            <span style={{ fontSize: '10px', color: '#6b7280' }}>Align</span>
          </div>
        </div>

        <Divider />

        {/* Edit */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '64px' }}>
          <RibbonButton><Search size={20} /></RibbonButton>
          <span style={{ fontSize: '10px', color: '#6b7280' }}>Find/Replace</span>
        </div>

      </div>
    </div>
  );
}
