import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';

interface SignInButtonProps {
  /** Override background color (CSS variable or hex) */
  bgColor?: string;
  /** Override text color (CSS variable or hex) */
  fgColor?: string;
}

export function SignInButton({ bgColor, fgColor }: SignInButtonProps) {
  const { login } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSuccess = async (response: CredentialResponse) => {
    if (response.credential) {
      try {
        await login(response.credential);
      } catch (error) {
        console.error('Login failed:', error);
      }
    }
  };

  const handleError = () => {
    console.error('Google Sign-In failed');
  };

  const isActive = isHovered || isFocused;

  return (
    <div
      className="auth-button-wrapper"
      role="group"
      aria-label="Sign in with Google"
      tabIndex={0}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={{
        // Container provides themed background that frames the Google button
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px',
        borderRadius: '10px',
        background: bgColor || 'var(--auth-bg, var(--color-accent, #CC0000))',
        boxShadow: isActive
          ? '0 4px 12px rgba(0, 0, 0, 0.25)'
          : '0 2px 8px rgba(0, 0, 0, 0.15)',
        // Animation properties
        transform: isActive ? 'scale(1.02)' : 'scale(1)',
        transition: 'transform 150ms ease, box-shadow 150ms ease, outline 150ms ease',
        // Focus ring for accessibility
        outline: isFocused
          ? '3px solid var(--ring, rgba(204, 0, 0, 0.5))'
          : 'none',
        outlineOffset: '2px',
        // CSS custom properties for potential use by child elements
        ['--wrapper-bg' as string]: bgColor || 'var(--auth-bg, var(--color-accent, #CC0000))',
        ['--wrapper-fg' as string]: fgColor || 'var(--auth-fg, #fff)',
        cursor: 'pointer',
      }}
    >
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap
        shape="rectangular"
        size="medium"
        theme="filled_blue"
      />
    </div>
  );
}
