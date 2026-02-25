"use client";

import { useState } from "react";
import { Share2, BarChart3, LogOut, ShieldOff, Home, Loader2, Printer } from "lucide-react";
import { OrderSummaryDrawer } from "./order-summary-drawer";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface LeaderManagementTabProps {
    userName?: string;
    lineUserId?: string;
    leaderId?: string;
    collectingCount: number;
    activeCount: number;
    products: any[];
    onShareCollecting: () => void;
    onShareActive: () => void;
    onRemoveVoter?: (productName: string, voterName: string, voterUserId?: string) => void;
    onReturnToLobby: () => void;
}

export function LeaderManagementTab({
    userName,
    lineUserId,
    leaderId,
    collectingCount,
    activeCount,
    products,
    onShareCollecting,
    onShareActive,
    onRemoveVoter,
    onReturnToLobby,
}: LeaderManagementTabProps) {
    const [showStats, setShowStats] = useState(false);
    const [isUnbinding, setIsUnbinding] = useState(false);

    // Secret Admin Trigger State
    const [clickCount, setClickCount] = useState(0);
    const [lastClickTime, setLastClickTime] = useState(0);
    const [showAdmin, setShowAdmin] = useState(false);

    const isCollectingDisabled = collectingCount === 0;
    const isActiveDisabled = activeCount === 0;

    // Unbind with native confirm dialogs (Radix AlertDialog onClick doesn't fire in LINE WebView)
    const handleUnbindClick = async () => {
        if (!window.confirm("確定要解除團主身分嗎？\n\n解除後您需要重新輸入站號與工號才能再次綁定。")) return;
        if (!window.confirm("⚠️ 最終確認\n\n這將會清除您的團主綁定資料，此操作無法在此頁面中復原。")) return;
        await handleUnbind();
    };

    const handleUnbind = async () => {
        setIsUnbinding(true);

        try {
            // Get LIFF Token for secure verification
            let idToken = "";
            if (typeof window !== 'undefined' && window.liff && window.liff.isLoggedIn()) {
                idToken = window.liff.getIDToken() || "";
            }

            if (!idToken) {
                toast.error("無法取得身分驗證 Token，請重新整理頁面後再試", { duration: 3000 });
                setIsUnbinding(false);
                return;
            }

            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'unbind_leader',
                    idToken
                })
            });

            const result = await res.json();

            if (!res.ok || !result.success) {
                console.error("Unbind error:", result.error);
                const apiError = result.error || "解除失敗，請稍後再試";
                if (apiError.toLowerCase().includes("expired") || apiError.toLowerCase().includes("token") || apiError.includes("身分驗證")) {
                    toast.error("登入逾時，正在重新取得安全憑證...");
                    if (typeof window !== 'undefined' && window.liff) {
                        if (window.liff.isLoggedIn()) {
                            window.liff.logout();
                        }
                        window.liff.login({ redirectUri: window.location.href });
                    } else {
                        setTimeout(() => window.location.reload(), 1500);
                    }
                } else {
                    toast.error(apiError, { duration: 3000 });
                    setIsUnbinding(false);
                }
                return;
            }

            toast.success("已成功解除團主身分");
            onReturnToLobby();
        } catch (err) {
            console.error("Unexpected unbind error:", err);
            toast.error("系統異常");
        } finally {
            setIsUnbinding(false);
        }
    };

    return (
        <div className="animate-in fade-in zoom-in-95 px-4 py-6 max-w-md mx-auto">
            {/* Secret Admin Trigger Area (Invisible Header) */}
            <div
                className="w-full h-8 mb-2 cursor-pointer"
                onClick={() => {
                    const now = Date.now();
                    if (now - lastClickTime > 1000) {
                        setClickCount(1);
                    } else {
                        setClickCount(prev => prev + 1);
                    }
                    setLastClickTime(now);
                    if (clickCount + 1 >= 5) {
                        setShowAdmin(true);
                        setClickCount(0);
                    }
                }}
            />

            {/* Admin button (hidden until 5-click) */}
            {showAdmin && (
                <button
                    onClick={() => window.location.href = '/admin'}
                    className="mb-4 w-full text-xs font-bold text-gray-500 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                >
                    🔧 進入商品管理後台
                </button>
            )}

            {/* Action Cards */}
            <div className="space-y-3">
                {/* Share Collecting */}
                <button
                    onClick={onShareCollecting}
                    disabled={isCollectingDisabled}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-95 ${isCollectingDisabled
                        ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-200 shadow-sm"
                        }`}
                >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCollectingDisabled ? "bg-slate-100" : "bg-blue-100"
                        }`}>
                        <Share2 className={`h-5 w-5 ${isCollectingDisabled ? "text-slate-300" : "text-blue-600"}`} />
                    </div>
                    <div className="flex-1 text-left">
                        <p className="font-bold text-sm">
                            {isCollectingDisabled ? "暫無集單中商品" : "分享「集單中」商品圖卡"}
                        </p>
                        {!isCollectingDisabled && (
                            <p className="text-xs text-slate-400 mt-0.5">{collectingCount} 件商品集單中</p>
                        )}
                    </div>
                </button>

                {/* Share Active */}
                <button
                    onClick={onShareActive}
                    disabled={isActiveDisabled}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-95 ${isActiveDisabled
                        ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-red-50 hover:border-red-200 shadow-sm"
                        }`}
                >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActiveDisabled ? "bg-slate-100" : "bg-red-100"
                        }`}>
                        <Share2 className={`h-5 w-5 ${isActiveDisabled ? "text-slate-300" : "text-red-500"}`} />
                    </div>
                    <div className="flex-1 text-left">
                        <p className="font-bold text-sm">
                            {isActiveDisabled ? "暫無上架中商品" : "分享「上架中」商品圖卡"}
                        </p>
                        {!isActiveDisabled && (
                            <p className="text-xs text-slate-400 mt-0.5">{activeCount} 件商品上架中</p>
                        )}
                    </div>
                </button>

                {/* Stats */}
                <button
                    onClick={() => setShowStats(true)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 shadow-sm transition-all active:scale-95"
                >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-100">
                        <BarChart3 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 text-left">
                        <p className="font-bold text-sm">看看有誰登記了？</p>
                        <p className="text-xs text-emerald-500 mt-0.5">點這裡複製名單，發到 LINE 群組</p>
                    </div>
                </button>

                {/* Print DM */}
                <button
                    onClick={() => {
                        const dmUrl = `/dm?leaderId=${leaderId || ''}`;
                        // Attempt to open native LINE App first
                        window.location.href = dmUrl;

                        setTimeout(() => {
                            // Since target="_top" or location.href will just navigate, we simply show toast.
                            toast.success("已開啟私訊邀請！");
                        }, 1000);
                    }}
                    disabled={collectingCount === 0}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-95 ${collectingCount === 0
                        ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-amber-50 hover:border-amber-200 shadow-sm"
                        }`}
                >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${collectingCount === 0 ? "bg-slate-100" : "bg-amber-100"
                        }`}>
                        <Printer className={`h-5 w-5 ${collectingCount === 0 ? "text-slate-300" : "text-amber-600"}`} />
                    </div>
                    <div className="flex-1 text-left">
                        <p className="font-bold text-sm">
                            {collectingCount === 0 ? "暫無可產生 DM 的商品" : "生成紙本商品型錄"}
                        </p>
                        {collectingCount > 0 && (
                            <p className="text-xs text-slate-400 mt-0.5">宣傳 {collectingCount} 件許願登記中商品</p>
                        )}
                    </div>
                </button>

                {/* Unbind - Red Glassmorphism Style */}
                <Button
                    variant="ghost"
                    onClick={handleUnbindClick}
                    disabled={isUnbinding}
                    className="w-full h-12 rounded-2xl bg-red-500/30 backdrop-blur-md border border-red-500/40 text-red-500 hover:bg-red-500/40 hover:text-red-600 transition-all active:scale-[0.98] font-bold text-sm transform-gpu mt-4"
                    style={{ transform: 'translateZ(0)', willChange: 'backdrop-filter' }}
                >
                    {isUnbinding ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            解除中...
                        </>
                    ) : (
                        <>
                            <ShieldOff className="h-4 w-4 mr-2" />
                            解除團主身分
                        </>
                    )}
                </Button>
            </div>

            {/* Stats Drawer */}
            <OrderSummaryDrawer
                open={showStats}
                onOpenChange={setShowStats}
                products={products}
                onRemoveVoter={onRemoveVoter}
            />
        </div>
    );
}
