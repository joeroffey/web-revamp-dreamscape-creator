
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthContext';

export const useAdmin = () => {
  const { session, user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Memoize the user ID to prevent unnecessary re-renders
  const userId = useMemo(() => user?.id, [user?.id]);

  useEffect(() => {
    console.log('useAdmin - checking admin role for user:', userId, 'session exists:', !!session);
    
    // If no user or session, set admin to false immediately
    if (!session?.user?.id || !userId) {
      console.log('useAdmin - no session or user, setting admin false');
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const checkAdminRole = async () => {
      try {
        setLoading(true);
        console.log('useAdmin - querying user_roles for user:', userId);
        
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .single();

        console.log('useAdmin - query result:', { data, error });

        if (error && error.code !== 'PGRST116') {
          console.error('useAdmin - Error checking admin role:', error);
          setIsAdmin(false);
        } else {
          const hasAdminRole = !!data;
          console.log('useAdmin - user has admin role:', hasAdminRole);
          setIsAdmin(hasAdminRole);
        }
      } catch (error) {
        console.error('useAdmin - Exception checking admin role:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [userId, session?.user?.id]);

  console.log('useAdmin - returning:', { isAdmin, loading });
  return { isAdmin, loading };
};
