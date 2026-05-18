import { useState, useCallback } from "react";
import { groupsService, GroupMember, MemberSearchResult } from "@/services/groupsService";

export function useGroupMembers() {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [searchResults, setSearchResults] = useState<MemberSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(async (groupId: string) => {
    setLoading(true);
    setError(null);

    const result = await groupsService.getMembers(groupId);

    setLoading(false);

    if (result.error) {
      setError(result.error);
      setMembers([]);
    } else {
      setMembers(result.data);
    }
  }, []);

  const addMember = useCallback(
    async (
      groupId: string,
      userId: string,
      addedBy: string
    ): Promise<{ success: boolean; error?: string }> => {
      const result = await groupsService.addMember(groupId, userId, addedBy);

      if (result.error) {
        return { success: false, error: result.error };
      }

      await loadMembers(groupId);
      return { success: true };
    },
    [loadMembers]
  );

  const removeMember = useCallback(
    async (
      groupMemberId: string,
      groupId: string
    ): Promise<{ success: boolean; error?: string }> => {
      const result = await groupsService.removeMember(groupMemberId);

      if (result.error) {
        return { success: false, error: result.error };
      }

      setMembers((prev) => prev.filter((m) => m.id !== groupMemberId));
      return { success: true };
    },
    []
  );

  const searchMembers = useCallback(
    async (
      tenantId: string,
      groupId: string,
      query: string
    ) => {
      if (query.length < 3) {
        setSearchResults([]);
        return;
      }

      setSearching(true);

      const result = await groupsService.searchMembers(tenantId, groupId, query);

      setSearching(false);

      if (result.error) {
        setSearchResults([]);
      } else {
        setSearchResults(result.data);
      }
    },
    []
  );

  const clearSearch = useCallback(() => {
    setSearchResults([]);
  }, []);

  return {
    members,
    searchResults,
    loading,
    searching,
    error,
    loadMembers,
    addMember,
    removeMember,
    searchMembers,
    clearSearch,
  };
}