import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const { googleLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('Google authentication was cancelled');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (code) {
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      
      googleLogin(code, redirectUri).then(result => {
        if (result.success) {
          navigate('/dashboard');
        } else {
          setError(result.error);
          setTimeout(() => navigate('/login'), 2000);
        }
      });
    } else {
      setError('No authorization code received');
      setTimeout(() => navigate('/login'), 2000);
    }
  }, [searchParams, googleLogin, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        {error ? (
          <div className="space-y-4">
            <div className="text-destructive text-lg">{error}</div>
            <p className="text-muted-foreground">Redirecting to login...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Completing sign in...</p>
          </div>
        )}
      </div>
    </div>
  );
}
