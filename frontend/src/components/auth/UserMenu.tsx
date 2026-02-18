import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  if (!user) return null;

  const getInitial = () => {
    return user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase();
  };

  const isActive = isHovered || isFocused;

  return (
    <div style={{ position: 'relative', zIndex: 9999 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`User menu for ${user.name || user.email}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 8px',
          border: '1px solid #ddd',
          borderRadius: '20px',
          background: 'white',
          cursor: 'pointer',
          // Animation properties
          transform: isActive ? 'scale(1.02)' : 'scale(1)',
          boxShadow: isActive
            ? '0 4px 12px rgba(0, 0, 0, 0.2)'
            : '0 1px 4px rgba(0, 0, 0, 0.1)',
          transition: 'transform 150ms ease, box-shadow 150ms ease, outline 150ms ease',
          // Focus ring for accessibility - blue
          outline: isFocused
            ? '3px solid rgba(26, 86, 219, 0.5)'
            : 'none',
          outlineOffset: '2px',
        }}
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.name}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
            }}
          />
        ) : (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#4285f4',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
            }}
          >
            {getInitial()}
          </div>
        )}
        <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {user.name || user.email}
        </span>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="User menu"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            minWidth: '180px',
            zIndex: 10000,
          }}
        >
          <div style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
            <div style={{ fontWeight: 'bold', color: '#333' }}>{user.name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{user.email}</div>
          </div>
          <button
            role="menuitem"
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            onFocus={(e) => {
              e.currentTarget.style.background = '#f5f5f5';
            }}
            onBlur={(e) => {
              e.currentTarget.style.background = 'none';
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
            style={{
              width: '100%',
              padding: '12px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              color: '#333',
              transition: 'background 150ms ease',
            }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
