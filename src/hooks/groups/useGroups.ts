import { useState, useCallback } from "react";
import { groupsService, Group } from "@/services/groupsService";

export function useGroups(tenantId: string | null) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);

    const result = await groupsService.list(tenantId);

    setLoading(false);

    if (result.error) {
      setError(result.error);
      setGroups([]);
    } else {
      setGroups(result.data);
    }
  }, [tenantId]);

  const createGroup = useCallback(
    async (
      userId: string,
      name: string,
      type: "private" | "internal"
    ): Promise<{ success: boolean; error?: string }> => {
      if (!tenantId) return { success: false, error: "Tenant não definido" };

      const result = await groupsService.create(tenantId, userId, name, type);

      if (result.error) {
        return { success: false, error: result.error };
      }

      if (result.data) {
        setGroups((prev) => [result.data!, ...prev]);
      }

      return { success: true };
    },
    [tenantId]
  );

  const deleteGroup = useCallback(
    async (groupId: string): Promise<{ success: boolean; error?: string }> => {
      const result = await groupsService.delete(groupId);

      if (result.error) {
        return { success: false, error: result.error };
      }

      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      return { success: true };
    },
    []
  );

  return {
    groups,
    loading,
    error,
    loadGroups,
    createGroup,
    deleteGroup,
  };
}