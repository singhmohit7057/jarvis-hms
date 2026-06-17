
import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

interface LogActivityParams {
  action: string;
  entityType: string;
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
}

interface UseActivityLogReturn {
  logActivity: (params: LogActivityParams) => Promise<void>;
}

/**
 * Provides a fire-and-forget function to log user activities.
 * Gets the current user from authStore and inserts into the activity_logs table.
 * Errors are silently swallowed to avoid disrupting the user flow.
 */
export function useActivityLog(): UseActivityLogReturn {
  const logActivity = useCallback(async (params: LogActivityParams) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    // Fire-and-forget — intentionally not awaited at the call site
    supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        user_name: user.name,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId ?? null,
        description: params.description,
        metadata: params.metadata ?? null,
      })
      .then(({ error }) => {
        if (error) {
          console.error('[ActivityLog] Failed to log activity:', error.message);
        }
      });
  }, []);

  return { logActivity };
}
