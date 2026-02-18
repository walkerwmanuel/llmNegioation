import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getNegotiations, deleteNegotiation } from '../../api/negotiations';
import type { Negotiation } from '../../types/negotiation';
import { NegotiationListItem } from './NegotiationListItem';

interface ChatHistorySidebarProps {
  onSelectNegotiation: (id: number) => void;
  selectedId: number | null;
  onNewNegotiation: () => void;
  /** Filter negotiations by type: 'ai_vs_ai' for TextToText, 'user_vs_ai' for SpeechToText */
  negotiationType?: string;
}

export function ChatHistorySidebar({
  onSelectNegotiation,
  selectedId,
  onNewNegotiation,
  negotiationType,
}: ChatHistorySidebarProps) {
  const { isAuthenticated } = useAuth();
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter negotiations by type if specified
  const filteredNegotiations = useMemo(() => {
    if (!negotiationType) return negotiations;
    return negotiations.filter((n) => n.negotiation_type === negotiationType);
  }, [negotiations, negotiationType]);

  useEffect(() => {
    if (isAuthenticated) {
      loadNegotiations();
    } else {
      setNegotiations([]);
      setError(null);
    }
  }, [isAuthenticated]);

  const loadNegotiations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getNegotiations();
      setNegotiations(data);
    } catch (err) {
      console.error('Failed to load negotiations:', err);
      setError('Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNegotiation(id);
      setNegotiations((prev) => prev.filter((n) => n.id !== id));
      if (selectedId === id) {
        onNewNegotiation();
      }
    } catch (err) {
      console.error('Failed to delete negotiation:', err);
      alert('Failed to delete negotiation. Please try again.');
    }
  };

  return (
    <div
      style={{
        width: '280px',
        height: '100%',
        borderRight: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(0,0,0,0.2)',
      }}
    >
      <div style={{ padding: '12px' }}>
        <button
          onClick={onNewNegotiation}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '10px',
            background: isLoading ? '#666' : '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          + New Negotiation
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
        {!isAuthenticated ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            Sign in to see your negotiation history
          </div>
        ) : error ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ color: '#f87171', marginBottom: '12px' }}>{error}</div>
            <button
              onClick={loadNegotiations}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                color: '#4285f4',
                border: '1px solid #4285f4',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <div style={{ padding: '8px 0' }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  padding: '12px',
                  marginBottom: '4px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)',
                }}
              >
                <div
                  style={{
                    height: '14px',
                    width: '80%',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
                <div
                  style={{
                    height: '10px',
                    width: '40%',
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '4px',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
              </div>
            ))}
            <style>{`
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
              }
            `}</style>
          </div>
        ) : filteredNegotiations.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            No negotiations yet. Start a new one!
          </div>
        ) : (
          filteredNegotiations.map((negotiation) => (
            <NegotiationListItem
              key={negotiation.id}
              negotiation={negotiation}
              isSelected={selectedId === negotiation.id}
              onSelect={onSelectNegotiation}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}

export { ChatHistorySidebar as default };
