"use client";

import { Share2, Rocket, Sparkles, BarChart3 } from "lucide-react";
import { useState } from "react";
import { OrderSummaryDrawer } from "./order-summary-drawer";

interface SeedModeProps {
  onEnterShop: () => void;
  onShareCollecting: () => void;
  onShareActive: () => void;
  userName?: string;
  collectingCount?: number;
  activeCount?: number;
  products?: any[]; // Passed for summary report
  onRemoveVoter?: (productName: string, voterName: string, voterUserId?: string) => void;
}

export function SeedMode({
  onEnterShop,
  onShareCollecting,
  onShareActive,
  userName,
  collectingCount = 0,
  activeCount = 0,
  products = [],
  onRemoveVoter
}: SeedModeProps) {
  // Secret Admin Trigger State
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showStats, setShowStats] = useState(false); // New state for Stats Drawer

  const isCollectingDisabled = collectingCount === 0;
  const isActiveDisabled = activeCount === 0;

  return (
    <section className="flex flex-col items-center justify-center min-h-screen px-6 py-12 bg-gradient-to-b from-blue-50 to-white">

      <div className="glass-card-featured card-hover flex w-full max-w-sm flex-col items-center rounded-3xl p-8 text-center shadow-xl border border-white/50">
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
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary-blue to-teal-400 shadow-lg shadow-blue-200">
            <Rocket className="h-12 w-12 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 animate-pulse">
            <Sparkles className="h-6 w-6 text-yellow-400 fill-yellow-400" />
          </div>
        </div>

        <h3 className="text-2xl font-black text-gray-900 mb-2">
          歡迎回來，團購主！
        </h3>
        <p className="text-gray-600 font-medium mb-8 leading-relaxed">
          這裡是您的專屬商店入口。<br />
          點擊下方按鈕進入商店，<br />
          管理訂單、開放登記或分享好物。
        </p>

        {showAdmin && (
          <button
            onClick={() => window.location.href = '/admin'}
            className="mb-6 w-full text-xs font-bold text-gray-500 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 hover:text-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            🔧 進入商品管理後台
          </button>
        )}

        {/* 1. Main Action: Enter Shop */}
        <button
          onClick={onEnterShop}
          className="btn-tactile w-full flex items-center justify-center gap-2 rounded-2xl bg-gray-900 text-white py-4 text-lg font-bold shadow-lg shadow-gray-300 hover:bg-black transition-all active:scale-95 mb-4"
        >
          <span>🏪</span>
          <span className="flex items-center gap-1">
            進入
            <span className="bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300 bg-clip-text text-transparent drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] font-black italic px-1">
              {userName || '我'}
            </span>
            的商店
          </span>
        </button>

        <div className="w-full h-[1px] bg-gray-200 my-4"></div>

        {/* 2. Secondary Actions: Share Buttons */}
        <div className="w-full space-y-3">
          <button
            onClick={onShareCollecting}
            disabled={isCollectingDisabled}
            className={`w-full flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-bold shadow-sm transition-all active:scale-95 
              ${isCollectingDisabled
                ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            <Share2 className={`h-4 w-4 ${isCollectingDisabled ? 'text-gray-200' : 'text-blue-500'}`} />
            {isCollectingDisabled ? '暫無集單中商品' : '分享「集單中」商品圖卡'}
          </button>

          <button
            onClick={onShareActive}
            disabled={isActiveDisabled}
            className={`w-full flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-bold shadow-sm transition-all active:scale-95 
              ${isActiveDisabled
                ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            <Share2 className={`h-4 w-4 ${isActiveDisabled ? 'text-gray-200' : 'text-red-500'}`} />
            {isActiveDisabled ? '暫無上架中商品' : '分享「上架中」商品圖卡'}
          </button>
        </div>

        {/* 3. New Feature: Stats Button */}
        <div className="w-full mt-3">
          <button
            onClick={() => setShowStats(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-3 text-sm font-bold text-emerald-700 shadow-sm transition-all active:scale-95 hover:bg-emerald-100"
          >
            <BarChart3 className="h-4 w-4" />
            查看團購統計與明細
          </button>
        </div>

      </div>

      <p className="mt-8 text-xs text-gray-400 font-medium">
        Powered by 多角化室
      </p>

      {/* Stats Drawer */}
      <OrderSummaryDrawer
        open={showStats}
        onOpenChange={setShowStats}
        products={products}
        onRemoveVoter={onRemoveVoter}
      />
    </section>
  );
}
