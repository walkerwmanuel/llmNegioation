import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { ChatHistorySidebar } from '../history/ChatHistorySidebar';

interface NegotiationLayoutProps {
  children: ReactNode;
  onSelectNegotiation: (id: number) => void;
  selectedId: number | null;
  onNewNegotiation: () => void;
}

export function NegotiationLayout({
  children,
  onSelectNegotiation,
  selectedId,
  onNewNegotiation,
}: NegotiationLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSelectNegotiation = (id: number) => {
    onSelectNegotiation(id);
    if (isMobile) setIsSidebarOpen(false);
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 100px)', overflow: 'hidden' }}>
      {/* Mobile hamburger menu */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        style={{
          display: isMobile ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'fixed',
          top: '110px',
          left: '10px',
          zIndex: 1001,
          background: '#4285f4',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '10px 14px',
          cursor: 'pointer',
          fontSize: '18px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        {isSidebarOpen ? '✕' : '☰'}
      </button>

      {/* Mobile overlay */}
      {isMobile && isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 999,
          }}
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          display: isSidebarOpen ? 'block' : 'none',
          width: '280px',
          flexShrink: 0,
          ...(isMobile
            ? {
                position: 'fixed',
                top: '100px',
                left: 0,
                height: 'calc(100vh - 100px)',
                zIndex: 1000,
              }
            : {}),
        }}
      >
        <ChatHistorySidebar
          onSelectNegotiation={handleSelectNegotiation}
          selectedId={selectedId}
          onNewNegotiation={() => {
            onNewNegotiation();
            if (isMobile) setIsSidebarOpen(false);
          }}
        />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
    </div>
  );
}
