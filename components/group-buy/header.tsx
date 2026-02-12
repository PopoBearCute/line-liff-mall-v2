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
  onHome?: () => void;
  onShare?: () => void;
}

export function Header({ isLeader, onHome }: HeaderProps) {
  return (
    <div className="fixed top-4 right-4 z-[50]">
      <div
        onClick={onHome}
        className="flex flex-col items-center gap-1 cursor-pointer group active:scale-95 transition-transform"
      >
        <div className="bg-white p-1 rounded-full shadow-md border border-slate-100 group-hover:border-blue-200 transition-colors">
          <Image
            src="/mall-icon.png"
            alt="CPC Mall"
            width={38}
            height={38}
            className="rounded-full"
            priority
          />
        </div>
        <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-500 transition-colors bg-white/80 px-1.5 py-0.5 rounded-full shadow-sm">
          返回選單
        </span>
      </div>
    </div>
  );
}
