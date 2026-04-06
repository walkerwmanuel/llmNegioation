import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  if (!user) return null;

  const getInitial = () => {
    return user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase();
  };

  const isActive = isHovered || isFocused;
  const showAvatar = user.avatar_url && !avatarError;

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
          padding: '4px 10px 4px 4px',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '20px',
          background: isActive ? '#161b36' : '#0f1328',
          cursor: 'pointer',
          color: '#e8edf9',
          transform: isActive ? 'scale(1.02)' : 'scale(1)',
          boxShadow: isActive
            ? '0 4px 12px rgba(0,0,0,0.4)'
            : '0 1px 4px rgba(0,0,0,0.25)',
          transition: 'transform 150ms ease, box-shadow 150ms ease, background 150ms ease, outline 150ms ease',
          outline: isFocused
            ? '3px solid rgba(204,0,0,0.5)'
            : 'none',
          outlineOffset: '2px',
        }}
      >
        {showAvatar ? (
          <img
            src={user.avatar_url}
            alt={user.name}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={() => setAvatarError(true)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#CC0000',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              flexShrink: 0,
            }}
          >
            {getInitial()}
          </div>
        )}
        <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#e8edf9' }}>
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
            marginTop: '6px',
            background: '#0f1328',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '10px',
            boxShadow: '0 8px 25px rgba(0,0,0,0.45)',
            minWidth: '200px',
            zIndex: 10000,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {showAvatar ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={() => setAvatarError(true)}
                style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }}
              />
            ) : (
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#CC0000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                {getInitial()}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 700, color: '#e8edf9', fontSize: '14px' }}>{user.name}</div>
              <div style={{ fontSize: '12px', color: '#a7b0c6' }}>{user.email}</div>
            </div>
          </div>
          <button
            role="menuitem"
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            onFocus={(e) => { e.currentTarget.style.background = '#161b36'; }}
            onBlur={(e) => { e.currentTarget.style.background = 'transparent'; }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#161b36'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            style={{
              width: '100%',
              padding: '12px 14px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              color: '#e8edf9',
              fontSize: '14px',
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
