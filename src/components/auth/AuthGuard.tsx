import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasBusinessProfile, setHasBusinessProfile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setLoading(true);
    const checkSessionAndProfile = async (currentSession: Session | null) => {
      if (currentSession?.user) {
        const { data, error } = await supabase
          .from('business_profiles')
          .select('user_id')
          .eq('user_id', currentSession.user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking business profile:', error);
          setHasBusinessProfile(false);
        } else {
          setHasBusinessProfile(!!data);
        }
      } else {
        setHasBusinessProfile(false);
      }
      setSession(currentSession);
      setLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      checkSessionAndProfile(session);
    });

    // Also check immediately on load/navigation
    supabase.auth.getSession().then(({ data: { session } }) => {
        checkSessionAndProfile(session);
    });


    return () => {
      subscription?.unsubscribe();
    };
  }, [location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isAuthPage = location.pathname === '/auth';

  if (session) {
    // User is logged in
    if (isAuthPage) {
      return <Navigate to="/" replace />;
    }

    // User is on a protected route
    if (hasBusinessProfile) {
      if (location.pathname === '/onboarding') {
        return <Navigate to="/profile" replace />;
      }
      return <>{children}</>;
    } else {
      if (location.pathname !== '/onboarding') {
        return <Navigate to="/onboarding" replace />;
      }
      return <>{children}</>;
    }
  } else {
    // User is not logged in
    if (!isAuthPage) {
      return <Navigate to="/auth" replace />;
    }
    return <>{children}</>;
  }
};

export default AuthGuard;
