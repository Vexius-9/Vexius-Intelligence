import React from 'react';
import { 
  ClipboardPaste, ClipboardType,
  Bold, Italic, Underline, Strikethrough, PaintBucket, Type, Grid,
  AlignLeft, AlignCenter, AlignRight, Merge,
  DollarSign, Percent, MoreHorizontal,
  LayoutTemplate, Table, Brush,
  Sparkles, Wand2, Search,
  ArrowUpToLine, ArrowDownToLine, GripHorizontal
} from 'lucide-react';

export interface VexiusSheetRibbonProps {
  hotInstance?: any;
  navbarElement?: React.ReactNode;
}

export function VexiusSheetRibbon({ hotInstance, navbarElement }: VexiusSheetRibbonProps) {
  const [activeTab, setActiveTab] = React.useState('Home');

  const RibbonButton = ({ onClick, isActive, children }: { onClick: (e: React.MouseEvent<HTMLButtonElement>) => void, isActive?: boolean, children: React.ReactNode }) => (
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
        color: isActive ? '#000' : '#4b5563'
      }}
    >
      {children}
    </button>
  );

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      borderBottom: '1px solid #e5e7eb',
      background: '#f9fafb',
      fontFamily: 'var(--font-geist-sans)',
      width: '100%',
      overflowX: 'hidden',
      flexShrink: 0
    }}>
      {/* Top Tabs */}
      <div style={{ display: 'flex', gap: '16px', padding: '4px 8px', alignItems: 'center' }}>
        
        {navbarElement}

        {/* File & Quick Actions Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button style={{ padding: '6px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>File</button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '0.85rem', color: '#4b5563', marginRight: '4px' }}>AutoSave</span>
            <div style={{ width: '32px', height: '18px', background: '#e5e7eb', borderRadius: '16px', position: 'relative', cursor: 'pointer' }}>
              <div style={{ position: 'absolute', left: '2px', top: '2px', width: '14px', height: '14px', background: '#fff', borderRadius: '50%', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }} />
            </div>
          </div>

          <div style={{ width: '1px', background: '#e5e7eb', height: '16px', margin: '0 4px' }} />

          {/* Tab Headers */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {['Home', 'Insert', 'Page Layout', 'Formulas', 'Data', 'Review', 'View'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: activeTab === tab ? 600 : 400,
                  color: activeTab === tab ? '#10b981' : '#4b5563',
                  borderBottom: activeTab === tab ? '2px solid #10b981' : '2px solid transparent'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ padding: '8px', display: 'flex', gap: '16px', minHeight: '84px', overflowX: 'auto', background: '#ffffff', borderTop: '1px solid #f3f4f6' }}>
        
        {activeTab === 'Home' && (
          <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>
            
            {/* AI Group */}
            <div style={{ display: 'flex', gap: '4px', borderRight: '1px solid #e5e7eb', paddingRight: '16px' }}>
              <button onClick={() => window.dispatchEvent(new CustomEvent('vexius:toggle-ai'))} style={{ 
                border: 'none', background: '#ecfdf5', borderRadius: '6px', padding: '8px', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' 
              }}>
                <div style={{ padding: '4px', display: 'flex' }}>
                  <img src="/logo.png" alt="Vexius AI" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: '#065f46', fontWeight: 600 }}>Vexius AI</span>
              </button>
              
              <button onClick={() => {
                window.dispatchEvent(new CustomEvent('vexius:toggle-ai'));
                setTimeout(() => window.dispatchEvent(new CustomEvent('vexius:ai-action', { detail: 'check' })), 100);
              }} style={{ 
                border: 'none', background: 'transparent', borderRadius: '6px', padding: '8px 4px', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' 
              }}>
                <Search size={24} color="#10b981" />
                <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>AI Check</span>
              </button>
              
              <button onClick={() => {
                window.dispatchEvent(new CustomEvent('vexius:toggle-ai'));
                setTimeout(() => window.dispatchEvent(new CustomEvent('vexius:ai-action', { detail: 'analyze' })), 100);
              }} style={{ 
                border: 'none', background: 'transparent', borderRadius: '6px', padding: '8px 4px', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' 
              }}>
                <Sparkles size={24} color="#10b981" />
                <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>AI Analyze</span>
              </button>
            </div>

            {/* Clipboard Group */}
            <div style={{ display: 'flex', gap: '4px', borderRight: '1px solid #e5e7eb', paddingRight: '16px' }}>
              <button onClick={() => {}} style={{ 
                border: 'none', background: 'transparent', borderRadius: '6px', padding: '8px 4px', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' 
              }}>
                <ClipboardPaste size={24} color="#4b5563" />
                <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>Paste</span>
              </button>
              
              <button onClick={() => {}} style={{ 
                border: 'none', background: 'transparent', borderRadius: '6px', padding: '8px 4px', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' 
              }}>
                <ClipboardType size={24} color="#4b5563" />
                <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>Paste Special</span>
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', marginLeft: '4px' }}>
                <RibbonButton onClick={() => {}} isActive={false}>
                  <Brush size={16} />
                </RibbonButton>
              </div>
            </div>

            {/* Font Group */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderRight: '1px solid #e5e7eb', paddingRight: '16px' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <select style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px 8px', fontSize: '0.85rem', width: '130px' }}>
                  <option value="Calibri">Calibri</option>
                  <option value="Inter">Inter</option>
                  <option value="Arial">Arial</option>
                </select>
                <select style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px 8px', fontSize: '0.85rem', width: '60px' }}>
                  <option value="11">11</option>
                  <option value="12">12</option>
                  <option value="14">14</option>
                </select>
                
                <RibbonButton onClick={() => {}} isActive={false}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>A<span style={{ fontSize: '0.7rem' }}>↑</span></span>
                </RibbonButton>
                <RibbonButton onClick={() => {}} isActive={false}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>A<span style={{ fontSize: '0.7rem' }}>↓</span></span>
                </RibbonButton>
              </div>
              
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <RibbonButton onClick={() => {}} isActive={false}>
                  <span style={{ fontWeight: 700, fontFamily: 'serif', fontSize: '1rem', width: '16px', textAlign: 'center' }}>B</span>
                </RibbonButton>
                <RibbonButton onClick={() => {}} isActive={false}>
                  <span style={{ fontStyle: 'italic', fontFamily: 'serif', fontSize: '1rem', width: '16px', textAlign: 'center' }}>I</span>
                </RibbonButton>
                <RibbonButton onClick={() => {}} isActive={false}>
                  <span style={{ textDecoration: 'underline', fontFamily: 'serif', fontSize: '1rem', width: '16px', textAlign: 'center' }}>U</span>
                </RibbonButton>
                <RibbonButton onClick={() => {}} isActive={false}>
                  <span style={{ textDecoration: 'line-through', fontSize: '1rem', width: '18px', textAlign: 'center' }}>ab</span>
                </RibbonButton>
                
                <div style={{ width: '1px', background: '#e5e7eb', height: '16px', margin: '0 4px' }} />
                
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <RibbonButton onClick={() => {}} isActive={false}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: '14px' }}>A</span>
                      <div style={{ width: '14px', height: '3px', background: '#ff0000', marginTop: '2px' }} />
                    </div>
                  </RibbonButton>
                  <span style={{ fontSize: '0.5rem', marginLeft: '2px', color: '#6b7280' }}>▼</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <RibbonButton onClick={() => {}} isActive={false}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <PaintBucket size={14} />
                      <div style={{ width: '14px', height: '3px', background: '#ffff00', marginTop: '2px' }} />
                    </div>
                  </RibbonButton>
                  <span style={{ fontSize: '0.5rem', marginLeft: '2px', color: '#6b7280' }}>▼</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <RibbonButton onClick={() => {}} isActive={false}>
                    <Grid size={16} />
                    <span style={{ fontSize: '0.5rem', marginLeft: '4px' }}>Borders ▼</span>
                  </RibbonButton>
                </div>
              </div>
            </div>

            {/* Alignment Group */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderRight: '1px solid #e5e7eb', paddingRight: '16px' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <RibbonButton onClick={() => {}} isActive={false}>
                  <ArrowUpToLine size={16} />
                </RibbonButton>
                <RibbonButton onClick={() => {}} isActive={false}>
                  <GripHorizontal size={16} />
                </RibbonButton>
                <RibbonButton onClick={() => {}} isActive={false}>
                  <ArrowDownToLine size={16} />
                </RibbonButton>
                
                <div style={{ width: '1px', background: '#e5e7eb', height: '16px', margin: '0 4px' }} />
                
                <RibbonButton onClick={() => {}} isActive={false}>
                  <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>ab</span>
                </RibbonButton>
              </div>
              
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <RibbonButton onClick={() => {}} isActive={false}>
                  <AlignLeft size={16} />
                </RibbonButton>
                <RibbonButton onClick={() => {}} isActive={false}>
                  <AlignCenter size={16} />
                </RibbonButton>
                <RibbonButton onClick={() => {}} isActive={false}>
                  <AlignRight size={16} />
                </RibbonButton>
                
                <div style={{ width: '1px', background: '#e5e7eb', height: '16px', margin: '0 4px' }} />
                
                <RibbonButton onClick={() => {}} isActive={false}>
                  <Merge size={16} />
                  <span style={{ fontSize: '0.75rem', marginLeft: '4px', fontWeight: 500 }}>Merge ▼</span>
                </RibbonButton>
              </div>
            </div>

            {/* Number Group */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderRight: '1px solid #e5e7eb', paddingRight: '16px' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <select style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px 8px', fontSize: '0.85rem', width: '140px' }}>
                  <option value="General">General</option>
                  <option value="Number">Number</option>
                  <option value="Currency">Currency</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <RibbonButton onClick={() => {}} isActive={false}>
                  <DollarSign size={16} />
                </RibbonButton>
                <RibbonButton onClick={() => {}} isActive={false}>
                  <Percent size={16} />
                </RibbonButton>
                <RibbonButton onClick={() => {}} isActive={false}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', padding: '0 2px' }}>,</span>
                </RibbonButton>
                
                <div style={{ width: '1px', background: '#e5e7eb', height: '16px', margin: '0 4px' }} />
                
                <RibbonButton onClick={() => {}} isActive={false}>
                  <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>.0+</span>
                </RibbonButton>
                <RibbonButton onClick={() => {}} isActive={false}>
                  <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>.0-</span>
                </RibbonButton>
              </div>
            </div>

            {/* Styles Group */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <RibbonButton onClick={() => {}} isActive={false}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <LayoutTemplate size={16} color="#2563eb" />
                    <span style={{ fontSize: '0.75rem' }}>Conditional Formatting ▼</span>
                  </div>
                </RibbonButton>
                
                <RibbonButton onClick={() => {}} isActive={false}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Table size={16} color="#2563eb" />
                    <span style={{ fontSize: '0.75rem' }}>Format as Table ▼</span>
                  </div>
                </RibbonButton>
              </div>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <RibbonButton onClick={() => {}} isActive={false}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Grid size={16} color="#2563eb" />
                    <span style={{ fontSize: '0.75rem' }}>Cell Styles ▼</span>
                  </div>
                </RibbonButton>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
