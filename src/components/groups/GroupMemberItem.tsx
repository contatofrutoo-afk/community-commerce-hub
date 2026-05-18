import { GroupMember } from "@/services/groupsService";

type GroupMemberItemProps = {
  member: GroupMember;
  onRemove: (memberId: string) => void;
  canRemove: boolean;
  removing?: boolean;
};

export function GroupMemberItem({ member, onRemove, canRemove, removing }: GroupMemberItemProps) {
  const profile = member.profiles;
  const name = profile?.name || "Usuário";
  const avatar = profile?.avatar_url;

  return (
    <div className="flex items-center justify-between p-3 bg-card rounded-xl border">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
          {avatar ? (
            <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <span className="text-sm font-medium text-muted-foreground">
              {name[0]?.toUpperCase() || "?"}
            </span>
          )}
        </div>
        <span className="text-sm font-medium">{name}</span>
      </div>
      {canRemove && (
        <button
          onClick={() => onRemove(member.id)}
          disabled={removing}
          className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          title="Remover membro"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}