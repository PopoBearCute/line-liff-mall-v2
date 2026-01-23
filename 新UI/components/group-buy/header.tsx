import { Crown, User, Sparkles } from "lucide-react";

interface HeaderProps {
  wave: string;
  roleTag: string;
  isLeader: boolean;
  leaderName?: string; // 團購主名稱
}

export function Header({ roleTag, isLeader }: HeaderProps) {
  return (
    <div className="fixed top-4 right-4 z-[50]">
      <div
        className={`
          flex h-10 w-10 items-center justify-center rounded-full shadow-lg backdrop-blur-md border border-white/20
          ${isLeader
            ? "bg-gradient-to-br from-amber-400/90 to-amber-500/90 text-white"
            : "bg-white/70 text-gray-700"
          }
        `}
        title={roleTag}
      >
        {isLeader ? (
          <Crown className="h-5 w-5" />
        ) : (
          <User className="h-5 w-5" />
        )}
      </div>
    </div>
  );
}
