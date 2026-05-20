import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import TopBar from "@/components/layout/TopBar";
import { Loader2, Folder, ChevronRight, Users } from "lucide-react";
import { useB2CGroups } from "@/hooks/groups/useB2CGroups";

export default function GroupsPageB2C() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { groups, loading, loadGroups } = useB2CGroups(user?.id || null);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", display: "flex", flexDirection: "column", paddingBottom: 80 }}>
      <TopBar />
      <div style={{ padding: "16px 16px 0" }}>
        <h1 style={{ fontSize: 22, fontWeight: "bold", color: "#333" }}>Meus grupos</h1>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : groups.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#888" }}>
          <Folder size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
          <p>Você ainda não foi adicionado a nenhum grupo</p>
        </div>
      ) : (
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => navigate(`/groups/member/${group.id}`)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 16,
                background: "#fff",
                borderRadius: 12,
                border: "none",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                    background: group.type === "internal" ? "#e8f4f8" : "#f0e6ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Users size={22} color={group.type === "internal" ? "#0891b2" : "#7c3aed"} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, color: "#333", fontSize: 15, marginBottom: 2 }}>{group.name}</p>
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 10,
                    background: group.type === "internal" ? "#e8f4f8" : "#f0e6ff",
                    color: group.type === "internal" ? "#0891b2" : "#7c3aed",
                    fontWeight: 500,
                    display: "inline-block",
                  }}
                >
                  {group.type === "internal" ? "Interno" : "Privado"}
                </span>
              </div>
              <ChevronRight size={18} color="#bbb" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
