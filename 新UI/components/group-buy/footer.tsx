"use client";

import { Send, Share2, Loader2 } from "lucide-react";

interface FooterProps {
  isLeader: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
  onShare: () => void;
}

export function Footer({
  isLeader,
  isSubmitting,
  onSubmit,
  onShare,
}: FooterProps) {
  return (
    <footer className="glass-footer fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
      <div className="mx-auto flex w-full max-w-lg gap-3">
        {isLeader && (
          <button
            type="button"
            onClick={onShare}
            className="btn-tactile flex flex-1 items-center justify-center gap-2 rounded-2xl bg-secondary py-3.5 text-base font-bold text-secondary-foreground shadow-lg"
          >
            <Share2 className="h-5 w-5" />
            邀請更多人
          </button>
        )}

        <button
          id="btn-submit"
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="btn-tactile flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary/90 py-3.5 text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 disabled:opacity-60 disabled:shadow-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              提交中...
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              跟團主登記數量
            </>
          )}
        </button>
      </div>
    </footer>
  );
}
