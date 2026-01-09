import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useAdmin() {
  const { user } = useAuth();

  const { data: isAdmin, isLoading: loading } = useQuery({
    queryKey: ['user-admin-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (error) {
        console.error('Error checking admin role:', error);
        return false;
      }
      
      return data !== null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return { isAdmin: isAdmin ?? false, loading };
}
