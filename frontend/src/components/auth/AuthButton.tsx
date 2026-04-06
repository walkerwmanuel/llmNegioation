import { useAuth } from '../../context/AuthContext';
import { SignInButton } from './SignInButton';
import { UserMenu } from './UserMenu';

export function AuthButton() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          width: '24px',
          height: '24px',
          border: '2px solid rgba(255,255,255,0.15)',
          borderTop: '2px solid #CC0000',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
    );
  }

  if (isAuthenticated) {
    return <UserMenu />;
  }

  return <SignInButton />;
}
