import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getNegotiations, deleteNegotiation } from '../../api/negotiations';
import { Negotiation } from '../../types/negotiation';
import { NegotiationListItem } from './NegotiationListItem';

interface ChatHistorySidebarProps {
  onSelectNegotiation: (id: number) => void;
  selectedId: number | null;
  onNewNegotiation: () => void;
}

export function ChatHistorySidebar({
  onSelectNegotiation,
  selectedId,
  onNewNegotiation,
}: ChatHistorySidebarProps) {
  const { isAuthenticated } = useAuth();
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadNegotiations();
    } else {
      setNegotiations([]);
    }
  }, [isAuthenticated]);

  const loadNegotiations = async () => {
    setIsLoading(true);
    try {
      const data = await getNegotiations();
      setNegotiations(data);
    } catch (error) {
      console.error('Failed to load negotiations:', error);
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
    } catch (error) {
      console.error('Failed to delete negotiation:', error);
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
          style={{
            width: '100%',
            padding: '10px',
            background: '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
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
        ) : isLoading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            Loading...
          </div>
        ) : negotiations.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            No negotiations yet. Start a new one!
          </div>
        ) : (
          negotiations.map((negotiation) => (
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
