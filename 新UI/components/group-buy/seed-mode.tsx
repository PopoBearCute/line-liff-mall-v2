"use client";

import { Share2, Rocket, Sparkles } from "lucide-react";
import { useState } from "react";

interface SeedModeProps {
  onShare: () => void;
  wave: string;
}

export function SeedMode({ onShare, wave }: SeedModeProps) {
  // Secret Admin Trigger State
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [showAdmin, setShowAdmin] = useState(false);

  return (
    <section className="flex flex-col items-center justify-center px-6 py-12">
      <div className="mb-4">
        {/* Simplified Seed Content */}
      </div>

      <div className="glass-card-featured card-hover flex w-full max-w-sm flex-col items-center rounded-3xl p-8 text-center">
        {/* Animated Icon - Secret Admin Trigger */}
        <div
          className="relative mb-6 cursor-pointer active:scale-95 transition-transform"
          onClick={() => {
            const now = Date.now();
            // Reset count if too slow (more than 1s between clicks)
            if (now - lastClickTime > 1000) {
              setClickCount(1);
            } else {
              setClickCount(prev => prev + 1);
            }
            setLastClickTime(now);

            // Trigger on 5th click
            if (clickCount + 1 >= 5) {
              setShowAdmin(true);
              setClickCount(0);
            }
          }}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20">
            <Rocket className="h-10 w-10 text-primary" />
          </div>
          <div className="absolute -top-1 -right-1">
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
        </div>

        <h3 className="text-xl font-bold text-foreground">
          不用再數+1了！
        </h3>
        <p className="mt-4 text-base font-medium leading-relaxed text-foreground/90">
          分享您的<span className="text-blue-600 font-bold">專屬圖卡</span><br />
          讓團員許願，自動加總、輕鬆統計<br />
          看到「可成團」即可準備開團！
        </p>

        {showAdmin && (
          <button
            onClick={() => window.location.href = '/admin'}
            className="mb-4 text-xs font-bold text-gray-400 border border-gray-200 px-3 py-1 rounded-full hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            🔧 進入管理後台
          </button>
        )}

        <button
          id="btn-share"
          type="button"
          onClick={onShare}
          className="btn-tactile mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary/90 py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/25"
        >
          <Share2 className="h-5 w-5" />
          分享<span className="text-white">專屬圖卡</span>至 LINE 群組
        </button>
      </div>
    </section>
  );
}
