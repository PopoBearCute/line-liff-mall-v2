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
  cart = {} // Default to empty
}: FooterProps & { cart?: Record<string, number> }) {
  // Calculate total items
  const totalQty = Object.values(cart).reduce((a, b) => a + b, 0);

  // Conditions to show footer:
  // 1. Leader always sees it (for Share button)
  // 2. Consumer sees it ONLY if they have items in cart
  if (!isLeader && totalQty === 0) return null;

  return (
    <div className="fixed bottom-6 inset-x-0 z-50 px-4 pointer-events-none">
      <div className="mx-auto max-w-md pointer-events-auto">
        <div className="bg-black/80 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-white/10 p-3 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">

          {/* Left Side: Info or Share */}
          <div className="flex items-center gap-3 pl-2">
            {isLeader && totalQty === 0 ? (
              <button
                onClick={onShare}
                className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <span>邀請成員</span>
              </button>
            ) : (
              <div className="flex flex-col">
                <span className="text-xs text-gray-400">
                  {totalQty < 0 ? "減少登記" : "本次追加"}
                </span>
                <span className={`text-lg font-bold leading-none ${totalQty < 0 ? 'text-red-400' : 'text-white'}`}>
                  {totalQty > 0 ? `+${totalQty}` : totalQty}
                  <span className="text-xs font-normal text-gray-500 ml-1">件</span>
                </span>
              </div>
            )}
          </div>

          {/* Right Side: Action Button */}
          {/* If Leader AND 0 items -> Show Share as main action? Or just hide submit? */}
          {/* Current logic: Submit button is always there if validation passes, or maybe disabled */}

          {(totalQty > 0 || isLeader) && (
            <button
              onClick={totalQty > 0 ? onSubmit : onShare} // If leader has 0 items, main button behaves as share? Or just keep it separate.
              // Let's keep it simple: Consumer -> Submit. Leader -> Share (if 0 items) or Submit (if has items).
              disabled={isSubmitting || (totalQty === 0 && !isLeader)}
              className={`
               flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95
               ${totalQty > 0
                  ? 'bg-white text-black hover:bg-gray-200'
                  : 'bg-white/10 text-gray-400' // Leader sharing mode styling
                }
             `}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                totalQty > 0 ? <Send className="w-4 h-4" /> : <Share2 className="w-4 h-4" />
              )}
              {totalQty > 0 ? "確認送出" : "分享連結"}
            </button>
          )}

        </div>
      </div>
    </div>
  );
}
