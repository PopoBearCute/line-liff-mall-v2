import { Crown, User, Share2 } from "lucide-react";
import Image from "next/image";

interface HeaderProps {
  wave: string;
  roleTag: string;
  isLeader: boolean;
  leaderName?: string;
  onShare?: () => void;
}

export function Header({ roleTag, isLeader, onShare, leaderName }: HeaderProps) {
  return (
    <div className="fixed top-4 right-4 z-[50] flex gap-2">
      {/* Share Button */}
      {onShare && (
        <button
          onClick={onShare}
          className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-medium hover:bg-white/30 transition-all border border-white/20 shadow-sm"
        >
          <Share2 className="w-3 h-3" />
          <span>分享</span>
        </button>
      )}
    </div>
  );
}
