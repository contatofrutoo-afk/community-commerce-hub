export type AccessStatus = "none" | "pending" | "approved" | "rejected";

const getStorageKey = (slug: string) => `community_${slug}`;

export const getCommunityAccess = (slug: string, userRole?: "owner" | "admin" | "member"): AccessStatus => {
  if (typeof window === "undefined") return "none";
  
  if (userRole === "owner" || userRole === "admin") {
    return "approved";
  }
  
  const status = localStorage.getItem(getStorageKey(slug));
  if (status === "pending" || status === "approved" || status === "rejected") {
    return status;
  }
  return "none";
};

export const requestCommunityAccess = (slug: string): AccessStatus => {
  if (typeof window === "undefined") return "none";
  localStorage.setItem(getStorageKey(slug), "pending");
  return "pending";
};

export const setCommunityAccess = (slug: string, status: AccessStatus): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(slug), status);
};

export const simulateApproval = (slug: string): AccessStatus => {
  setCommunityAccess(slug, "approved");
  return "approved";
};