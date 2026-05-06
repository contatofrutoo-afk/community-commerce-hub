// Sistema unificado de solicitação de acesso à comunidade.
// Fonte única: localStorage "community_access_requests".

export type AccessStatus = "none" | "pending" | "approved" | "rejected";

export type AccessRequest = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

// Tipos legados mantidos para compatibilidade com componentes existentes
export type GlobalAccessRequest = {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  brandId: string;
  slug: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export type B2BNotification = {
  type: "request_access";
  requestId: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  slug: string;
  tenantId: string;
  tenantName: string;
  createdAt: string;
};

export type B2CNotification = {
  type: "approved" | "rejected";
  requestId: string;
  slug: string;
  tenantName: string;
  message: string;
  createdAt: string;
};

const KEY = "community_access_requests";

const readAll = (): AccessRequest[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AccessRequest[]) : [];
  } catch {
    return [];
  }
};

const writeAll = (items: AccessRequest[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
  console.log("[community_access_requests] write", items);
};

const genId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Date.now().toString() + Math.random().toString(36).slice(2);
};

// ============= API principal =============

export const getAccessStatus = (slugOrTenantId: string, userId: string): AccessStatus => {
  const items = readAll();
  const found = items.find(
    (r) =>
      r.userId === userId &&
      (r.tenantSlug === slugOrTenantId || r.tenantId === slugOrTenantId),
  );
  return (found?.status as AccessStatus) || "none";
};

export const requestAccess = (
  slug: string,
  userId: string,
  userName: string | null,
  userEmail: string,
  tenantId: string,
  tenantName: string = "",
): void => {
  const items = readAll();
  const existing = items.find((r) => r.userId === userId && r.tenantId === tenantId);
  if (existing) {
    console.log("[requestAccess] já existe, ignorando", existing);
    return;
  }
  const newReq: AccessRequest = {
    id: genId(),
    userId,
    userName: userName || userEmail.split("@")[0] || "Usuário",
    userEmail,
    tenantId,
    tenantSlug: slug,
    tenantName: tenantName || slug,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  items.unshift(newReq);
  writeAll(items);
};

export const approveRequest = (requestId: string): void => {
  const items = readAll().map((r) => (r.id === requestId ? { ...r, status: "approved" as const } : r));
  writeAll(items);
};

export const rejectRequest = (requestId: string): void => {
  const items = readAll().map((r) => (r.id === requestId ? { ...r, status: "rejected" as const } : r));
  writeAll(items);
};

// ============= Compat: setAccessStatus / approveAccess / rejectAccess (por slug+userId) =============

export const setAccessStatus = (slug: string, userId: string, status: AccessStatus): void => {
  const items = readAll();
  const idx = items.findIndex((r) => r.userId === userId && r.tenantSlug === slug);
  if (idx >= 0 && status !== "none") {
    items[idx] = { ...items[idx], status: status as AccessRequest["status"] };
    writeAll(items);
  }
};

export const approveAccess = (slug: string, userId: string, _tenantId: string, _tenantName: string = ""): void => {
  const items = readAll();
  const target = items.find((r) => r.userId === userId && r.tenantSlug === slug);
  if (target) approveRequest(target.id);
};

export const rejectAccess = (slug: string, userId: string, _tenantId: string, _tenantName: string = ""): void => {
  const items = readAll();
  const target = items.find((r) => r.userId === userId && r.tenantSlug === slug);
  if (target) rejectRequest(target.id);
};

export const clearUserAccessStatus = (slug: string, userId: string): void => {
  const items = readAll().filter((r) => !(r.userId === userId && r.tenantSlug === slug));
  writeAll(items);
};

// Mantido por compat — agora não cria duplicado (delegado a requestAccess)
export const addGlobalRequest = (
  userId: string,
  userName: string | null,
  userEmail: string,
  brandId: string,
  slug: string,
  tenantName: string = "",
): void => {
  requestAccess(slug, userId, userName, userEmail, brandId, tenantName);
};

// ============= Notificações =============

export const getB2BNotifications = (tenantId: string): B2BNotification[] => {
  const items = readAll().filter((r) => r.tenantId === tenantId && r.status === "pending");
  return items.map((r) => ({
    type: "request_access",
    requestId: r.id,
    userId: r.userId,
    userName: r.userName,
    userEmail: r.userEmail,
    slug: r.tenantSlug,
    tenantId: r.tenantId,
    tenantName: r.tenantName,
    createdAt: r.createdAt,
  }));
};

export const getB2CNotifications = (userId: string): B2CNotification[] => {
  const items = readAll().filter((r) => r.userId === userId && r.status !== "pending");
  return items.map((r) => ({
    type: r.status === "approved" ? "approved" : "rejected",
    requestId: r.id,
    slug: r.tenantSlug,
    tenantName: r.tenantName,
    message: r.status === "approved" ? "Seu acesso foi aprovado" : "Seu acesso foi recusado",
    createdAt: r.createdAt,
  }));
};

export const clearB2BNotifications = (_tenantId: string): void => {
  // No-op: solicitações pendentes só saem da lista quando aprovadas/rejeitadas.
};

// ============= Helpers para listagem (compat) =============

const toLegacy = (r: AccessRequest): GlobalAccessRequest => ({
  id: r.id,
  userId: r.userId,
  userName: r.userName,
  userEmail: r.userEmail,
  brandId: r.tenantId,
  slug: r.tenantSlug,
  status: r.status,
  createdAt: r.createdAt,
});

export const getRequestsByBrandId = (brandId: string): GlobalAccessRequest[] =>
  readAll().filter((r) => r.tenantId === brandId).map(toLegacy);

export const getAllRequestsByBrandIds = (brandIds: string[]): GlobalAccessRequest[] =>
  readAll().filter((r) => brandIds.includes(r.tenantId)).map(toLegacy);

export const updateRequestStatus = (requestId: string, newStatus: "approved" | "rejected"): void => {
  if (newStatus === "approved") approveRequest(requestId);
  else rejectRequest(requestId);
};

export const getUserRequests = (userId: string): GlobalAccessRequest[] =>
  readAll().filter((r) => r.userId === userId).map(toLegacy);
