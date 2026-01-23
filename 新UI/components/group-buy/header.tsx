import { Crown, User, Share2 } from "lucide-react";

interface HeaderProps {
  wave: string;
  roleTag: string;
  isLeader: boolean;
  leaderName?: string;
  onShare?: () => void;
}

export function Header({ roleTag, isLeader, onShare }: HeaderProps) {
  return (
    <div className="fixed top-4 right-4 z-[50] flex gap-2">
      {/* 團主專用分享按鈕 */}
      {isLeader && (
        <button
          onClick={onShare}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-primary-blue shadow-lg backdrop-blur-md border border-white/20 active:scale-95 transition-all"
          title="分享給團員"
        >
          <Share2 className="h-5 w-5" />
        </button>
      )}

      {/* 身分識別圖示 */}
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
