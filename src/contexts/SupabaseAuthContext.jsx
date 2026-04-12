import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { logActivity } from '@/lib/logger';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Custom Domain Configuration
  const CUSTOM_DOMAIN = 'https://go.penhora.app.br';
  const SITE_URL = `${CUSTOM_DOMAIN}/dashboard`;

  const SUPER_ADMIN_EMAIL = 'emaildogago@gmail.com';

  const checkAdminStatus = useCallback(async (email) => {
    if (!email || email.toLowerCase() !== SUPER_ADMIN_EMAIL) {
      setIsAdmin(false);
      return;
    }
    try {
        const { data, error } = await supabase.rpc('is_admin');
        setIsAdmin(!error && !!data);
    } catch (e) {
        console.error("Admin check error", e);
        setIsAdmin(false);
    }
  }, []);

  // Ensures a row exists in public.users for every authenticated user.
  // Critical for Google OAuth users who bypass the email signup flow.
  const syncUserProfile = useCallback(async (authUser) => {
    if (!authUser) return;
    try {
      const { data: existing } = await supabase
        .from('users')
        .select('id, name')
        .eq('id', authUser.id)
        .maybeSingle();

      const googleName =
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        '';

      if (!existing) {
        // First login via Google — create the profile row
        await supabase.from('users').insert({
          id: authUser.id,
          email: authUser.email,
          name: googleName,
        });
      } else if (!existing.name && googleName) {
        // Profile exists but name is empty — fill it from Google metadata
        await supabase
          .from('users')
          .update({ name: googleName })
          .eq('id', authUser.id);
      }
    } catch (e) {
      console.error('Profile sync error:', e);
    }
  }, []);

  const handleSession = useCallback(async (session) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
    if (session?.user) {
      await checkAdminStatus(session.user.email);
      // Sync profile for OAuth users (no-op if row already exists with name)
      const provider = session.user.app_metadata?.provider;
      const providers = session.user.app_metadata?.providers ?? [];
      if (provider === 'google' || providers.includes('google')) {
        await syncUserProfile(session.user);
      }
    } else {
      setIsAdmin(false);
    }
  }, [checkAdminStatus, syncUserProfile]);

  useEffect(() => {
    const initAuth = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            await handleSession(session);
        } catch (error) {
            console.error("Auth init error:", error);
            setLoading(false);
        }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        await handleSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const signUp = useCallback(async ({ email, password, options }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        ...options,
        emailRedirectTo: SITE_URL,
      }
    });

    return { data, error };
  }, [SITE_URL]);

  const signIn = useCallback(async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) {
       logActivity(supabase, 'Login').catch(console.error);
    }

    return { data, error };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: SITE_URL,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    return { data, error };
  }, [SITE_URL]);

  const signInWithOtp = useCallback(async ({ email }) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: SITE_URL,
      },
    });
    return { data, error };
  }, [SITE_URL]);

  const resetPassword = useCallback(async (email) => {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${CUSTOM_DOMAIN}/update-password`, // Specific route for password updates if needed, or dashboard
      });
      return { data, error };
  }, [CUSTOM_DOMAIN]);

  const signOut = useCallback(async () => {
    try {
        await logActivity(supabase, 'Logout');
    } catch(e) { console.error("Logout log failed", e); }
    
    const { error } = await supabase.auth.signOut();
    return { error };
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    isAdmin,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithOtp,
    signOut,
    resetPassword,
    CUSTOM_DOMAIN
  }), [user, session, loading, isAdmin, signUp, signIn, signInWithGoogle, signInWithOtp, signOut, resetPassword, CUSTOM_DOMAIN]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};