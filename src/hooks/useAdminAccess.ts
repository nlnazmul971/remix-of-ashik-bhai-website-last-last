import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from './useSupabase';

export const useAdminAccess = () => {
  const { user } = useAuth();
  const { data: role } = useUserRole(user?.uid);
  const isAdmin = role === 'admin';
  const isModerator = role === 'moderator';
  const isStaff = isAdmin || isModerator;
  return { user, role, isAdmin, isModerator, isStaff };
};

export const usePendingApprovalsCount = (enabled: boolean) => {
  return useQuery({
    queryKey: ['approval-requests-pending-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('approval_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) throw error;
      return count ?? 0;
    },
    enabled,
    refetchInterval: 30_000,
  });
};
