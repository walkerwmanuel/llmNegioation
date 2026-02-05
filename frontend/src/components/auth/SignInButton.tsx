import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';

export function SignInButton() {
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
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={handleError}
      useOneTap
      shape="rectangular"
      size="medium"
    />
  );
}
