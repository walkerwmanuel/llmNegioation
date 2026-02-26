import type { Negotiation } from '../../types/negotiation';

interface NegotiationListItemProps {
  negotiation: Negotiation;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getTypeIcon(type: string): string {
  return type === 'ai_vs_ai' ? '🤖' : '💬';
}

export function NegotiationListItem({
  negotiation,
  isSelected,
  onSelect,
  onDelete,
}: NegotiationListItemProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this negotiation?')) {
      onDelete(negotiation.id);
    }
  };

  return (
    <div
      onClick={() => onSelect(negotiation.id)}
      style={{
        padding: '12px',
        borderRadius: '8px',
        cursor: 'pointer',
        background: isSelected ? 'rgba(66, 133, 244, 0.1)' : 'transparent',
        border: isSelected ? '1px solid #4285f4' : '1px solid transparent',
        marginBottom: '4px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}
    >
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{getTypeIcon(negotiation.negotiation_type)}</span>
          <span
            style={{
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {negotiation.topic.length > 30
              ? negotiation.topic.substring(0, 30) + '...'
              : negotiation.topic}
          </span>
        </div>
        <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
          {getRelativeTime(negotiation.updated_at)}
        </div>
      </div>
      <button
        onClick={handleDelete}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          color: '#888',
          fontSize: '14px',
        }}
        title="Delete"
      >
        ×
      </button>
    </div>
  );
}
