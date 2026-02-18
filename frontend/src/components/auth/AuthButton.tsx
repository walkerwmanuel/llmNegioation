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
          border: '2px solid #f3f3f3',
          borderTop: '2px solid #4285f4',
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
