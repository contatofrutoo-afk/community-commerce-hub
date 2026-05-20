import { useState, useCallback } from "react";
import { getMyGroups, B2CGroup } from "@/services/groupsB2CService";

export function useB2CGroups(userId: string | null) {
  const [groups, setGroups] = useState<B2CGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    const result = await getMyGroups(userId);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      setGroups([]);
    } else {
      setGroups(result.data || []);
    }
  }, [userId]);

  return { groups, loading, error, loadGroups };
}
