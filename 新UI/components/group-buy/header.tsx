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
      {/* Buttons removed as per Phase 14 requirements */}
    </div>
  );
}
