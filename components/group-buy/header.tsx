"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { LeaderBindDialog } from "./leader-bind-dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface HeaderProps {
  wave: string;
  roleTag: string;
  isLeader: boolean;
  leaderName?: string;
  lineUserId?: string;
  onSelect?: (leaderId: string, mode?: string) => void;
  onShare?: () => void;
}

export function Header({ isLeader, lineUserId, onSelect }: HeaderProps) {
  const [showBindDialog, setShowBindDialog] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);

  const handleLongPressStart = useCallback(() => {
    setIsLongPressing(true);
    longPressTimer.current = setTimeout(async () => {
      setIsLongPressing(false);
      if (!lineUserId || !supabase) {
        toast.error("無法取得您的身分資訊");
        return;
      }

      // Check if this LINE ID is already bound
      const { data: existingLeader } = await supabase
        .from("GroupLeaders")
        .select("Username")
        .eq("LineID", lineUserId)
        .single();

      if (existingLeader) {
        toast.success("歡迎回來，團購主！");
        if (onSelect) onSelect(existingLeader.Username, "seed");
      } else {
        setShowBindDialog(true);
      }
    }, 2000);
  }, [lineUserId, onSelect]);

  const handleLongPressEnd = useCallback(() => {
    setIsLongPressing(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleBindSuccess = (username: string) => {
    setShowBindDialog(false);
    if (onSelect) onSelect(username, "seed");
  };

  return (
    <>
      <div className="fixed top-4 right-4 z-[50] flex items-center gap-3">
        {/* Logo with long-press trigger */}
        <div
          className={`relative select-none cursor-pointer transition-transform duration-300 ${isLongPressing ? "scale-90 opacity-70" : "scale-100"
            }`}
          onTouchStart={handleLongPressStart}
          onTouchEnd={handleLongPressEnd}
          onTouchCancel={handleLongPressEnd}
          onMouseDown={handleLongPressStart}
          onMouseUp={handleLongPressEnd}
          onMouseLeave={handleLongPressEnd}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="bg-white p-1 rounded-full shadow-md border border-slate-100">
            <Image
              src="/mall-icon.png"
              alt="CPC Mall"
              width={40}
              height={40}
              className="rounded-full pointer-events-none"
              draggable={false}
              priority
            />
          </div>
          {isLongPressing && (
            <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping" />
          )}
        </div>
      </div>

      {/* Leader Bind Dialog */}
      {lineUserId && (
        <LeaderBindDialog
          open={showBindDialog}
          onOpenChange={setShowBindDialog}
          lineUserId={lineUserId}
          onBindSuccess={handleBindSuccess}
        />
      )}
    </>
  );
}
