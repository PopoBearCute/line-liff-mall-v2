"use client";

import { Share2, Rocket, Sparkles } from "lucide-react";

interface SeedModeProps {
  onShare: () => void;
  wave: string;
}

export function SeedMode({ onShare, wave }: SeedModeProps) {
  return (
    <section className="flex flex-col items-center justify-center px-6 py-12">
      <div className="mb-4">
        {/* Simplified Seed Content */}
      </div>

      <div className="glass-card-featured card-hover flex w-full max-w-sm flex-col items-center rounded-3xl p-8 text-center">
        {/* Animated Icon */}
        <div className="relative mb-6">
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
