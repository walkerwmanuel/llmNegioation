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

  return (
    <div
      className="auth-button-wrapper"
      style={{
        // Container provides themed background that frames the Google button
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px',
        borderRadius: '10px',
        background: bgColor || 'var(--auth-bg, var(--color-accent, #CC0000))',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        // CSS custom properties for potential use by child elements
        ['--wrapper-bg' as string]: bgColor || 'var(--auth-bg, var(--color-accent, #CC0000))',
        ['--wrapper-fg' as string]: fgColor || 'var(--auth-fg, #fff)',
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
