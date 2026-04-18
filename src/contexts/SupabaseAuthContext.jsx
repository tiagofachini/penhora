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
  const [teamMembership, setTeamMembership] = useState(null);

  const CUSTOM_DOMAIN = 'https://www.penhora.app.br';
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
      console.error('Admin check error', e);
      setIsAdmin(false);
    }
  }, []);

  // Ensures a row exists in public.users for every authenticated user.
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
        await supabase.from('users').insert({
          id: authUser.id,
          email: authUser.email,
          name: googleName,
        });
      } else if (!existing.name && googleName) {
        await supabase.from('users').update({ name: googleName }).eq('id', authUser.id);
      }
    } catch (e) {
      console.error('Profile sync error:', e);
    }
  }, []);

  // Detect and activate team membership on every login.
  // Pending memberships are activated (member_id set); last_login_at is updated.
  const handleTeamMembership = useCallback(async (authUser) => {
    if (!authUser?.email) {
      setTeamMembership(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .ilike('member_email', authUser.email)
        .maybeSingle();

      if (error || !data) {
        setTeamMembership(null);
        return;
      }

      // Build the update payload
      const updates = { last_login_at: new Date().toISOString() };
      if (!data.member_id) {
        updates.member_id = authUser.id;
        updates.status = 'active';
      }

      const { data: updated } = await supabase
        .from('team_members')
        .update(updates)
        .eq('id', data.id)
        .select()
        .single();

      setTeamMembership(updated ?? { ...data, ...updates });
    } catch (e) {
      console.error('Team membership check error:', e);
      setTeamMembership(null);
    }
  }, []);

  const handleSession = useCallback(async (session) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
    if (session?.user) {
      // Block inactive users before anything else
      const { data: profile } = await supabase
        .from('users')
        .select('is_active')
        .eq('id', session.user.id)
        .maybeSingle();
      if (profile && profile.is_active === false) {
        await supabase.auth.signOut();
        window.location.replace('/login?blocked=1');
        return;
      }

      await checkAdminStatus(session.user.email);
      await handleTeamMembership(session.user);
      // Sync profile for OAuth users
      const provider = session.user.app_metadata?.provider;
      const providers = session.user.app_metadata?.providers ?? [];
      if (provider === 'google' || providers.includes('google')) {
        await syncUserProfile(session.user);
      }
    } else {
      setIsAdmin(false);
      setTeamMembership(null);
    }
  }, [checkAdminStatus, syncUserProfile, handleTeamMembership]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await handleSession(session);
      } catch (error) {
        console.error('Auth init error:', error);
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
      options: { ...options, emailRedirectTo: SITE_URL },
    });
    return { data, error };
  }, [SITE_URL]);

  const signIn = useCallback(async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    return { data, error };
  }, [SITE_URL]);

  const signInWithOtp = useCallback(async ({ email }) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: SITE_URL },
    });
    return { data, error };
  }, [SITE_URL]);

  const resetPassword = useCallback(async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${CUSTOM_DOMAIN}/update-password`,
    });
    return { data, error };
  }, [CUSTOM_DOMAIN]);

  const signOut = useCallback(async () => {
    try {
      await Promise.race([
        logActivity(supabase, 'Logout'),
        new Promise(resolve => setTimeout(resolve, 3000)),
      ]);
    } catch (e) {}
    const { error } = await supabase.auth.signOut();
    return { error };
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    isAdmin,
    // teamMembership: null = account owner; object = team member
    teamMembership,
    // effectiveOwnerId: use this instead of user.id for all data queries
    effectiveOwnerId: teamMembership?.owner_id ?? user?.id ?? null,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithOtp,
    signOut,
    resetPassword,
    CUSTOM_DOMAIN,
  }), [user, session, loading, isAdmin, teamMembership, signUp, signIn, signInWithGoogle, signInWithOtp, signOut, resetPassword, CUSTOM_DOMAIN]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
