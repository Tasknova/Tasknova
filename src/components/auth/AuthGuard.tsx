import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasBusinessProfile, setHasBusinessProfile] = useState(false);
  const location = useLocation();
  const { toast } = useToast();

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

  useEffect(() => {
    const handleGooglePostCheck = async () => {
      const intent = localStorage.getItem('google-auth-intent');
      if (!intent) return;
      if (!session) return;
      if (session.user.app_metadata?.provider !== 'google') return;
      // Check if user exists in business_profiles
      const { data, error } = await supabase
        .from('business_profiles')
        .select('user_id')
        .eq('user_id', session.user.id)
        .maybeSingle();
      const exists = !!data;
      if (intent === 'signin' && !exists) {
        await supabase.auth.signOut();
        toast({ title: 'No account found', description: 'No account found. Please sign up first.', variant: 'destructive' });
      } else if (intent === 'signup' && exists) {
        await supabase.auth.signOut();
        toast({ title: 'Account already exists', description: 'Please log in instead.', variant: 'destructive' });
      }
      localStorage.removeItem('google-auth-intent');
    };
    handleGooglePostCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    const createProfileIfNeeded = async () => {
      if (!session) return;
      const user = session.user;
      // Only for Google users
      if (user.app_metadata?.provider !== 'google') return;
      // Check if profile exists
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
      if (!data) {
        // Insert new profile
        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          avatar_url: user.user_metadata?.avatar_url || null,
          phone: user.phone || null
        });
      }
    };
    createProfileIfNeeded();
  }, [session]);

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
        return <Navigate to="/home" replace />;
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
