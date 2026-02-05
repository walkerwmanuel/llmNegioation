import { useState, ReactNode } from 'react';
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

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 100px)', overflow: 'hidden' }}>
      {/* Mobile hamburger menu */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        style={{
          display: 'none',
          position: 'fixed',
          top: '100px',
          left: '10px',
          zIndex: 1001,
          background: '#4285f4',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '8px 12px',
          cursor: 'pointer',
        }}
        className="mobile-menu-btn"
      >
        ☰
      </button>

      {/* Sidebar */}
      <div
        style={{
          display: isSidebarOpen ? 'block' : 'none',
          width: '280px',
          flexShrink: 0,
        }}
        className="sidebar-container"
      >
        <ChatHistorySidebar
          onSelectNegotiation={onSelectNegotiation}
          selectedId={selectedId}
          onNewNegotiation={onNewNegotiation}
        />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: block !important;
          }
          .sidebar-container {
            position: fixed !important;
            top: 100px;
            left: 0;
            height: calc(100vh - 100px);
            z-index: 1000;
          }
        }
      `}</style>
    </div>
  );
}
