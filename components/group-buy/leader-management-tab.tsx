"use client";

import { useState } from "react";
import { Share2, BarChart3, LogOut, ShieldOff, Home, Loader2 } from "lucide-react";
import { OrderSummaryDrawer } from "./order-summary-drawer";
// [Cleanup] supabase 直接操作已移至 API route
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface LeaderManagementTabProps {
    userName?: string;
    lineUserId?: string;
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
    collectingCount,
    activeCount,
    products,
    onShareCollecting,
    onShareActive,
    onRemoveVoter,
    onReturnToLobby,
}: LeaderManagementTabProps) {
    const [showStats, setShowStats] = useState(false);
    const [unbindStep, setUnbindStep] = useState<0 | 1 | 2>(0); // 0=closed, 1=first confirm, 2=second confirm
    const [isUnbinding, setIsUnbinding] = useState(false);

    // Secret Admin Trigger State
    const [clickCount, setClickCount] = useState(0);
    const [lastClickTime, setLastClickTime] = useState(0);
    const [showAdmin, setShowAdmin] = useState(false);

    const isCollectingDisabled = collectingCount === 0;
    const isActiveDisabled = activeCount === 0;

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
                toast.error(result.error || "解除失敗，請稍後再試", { duration: 3000 });
                setIsUnbinding(false);
                return;
            }

            toast.success("已成功解除團主身分");
            setUnbindStep(0);
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
            {/* Welcome Header */}
            <div
                className="text-center mb-6 cursor-pointer"
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
            >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-200 mb-3">
                    <span className="text-2xl">👑</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-800">
                    團購主管理
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                    {userName || "團主"}，這是您的管理面板
                </p>
            </div>

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
                        <p className="font-bold text-sm">查看團購統計與明細</p>
                        <p className="text-xs text-emerald-500 mt-0.5">訂單匯總、明細報表</p>
                    </div>
                </button>

                {/* Divider */}
                <div className="h-px bg-slate-100 my-4" />

                {/* Return to Lobby */}
                <Button
                    variant="outline"
                    onClick={onReturnToLobby}
                    className="w-full h-12 rounded-2xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                    <Home className="h-4 w-4 mr-2" />
                    回到大廳首頁
                </Button>

                {/* Unbind */}
                <Button
                    variant="ghost"
                    onClick={() => setUnbindStep(1)}
                    className="w-full h-10 rounded-2xl text-red-400 hover:text-red-600 hover:bg-red-50 font-medium text-sm"
                >
                    <ShieldOff className="h-4 w-4 mr-2" />
                    解除團主身分
                </Button>
            </div>

            {/* Stats Drawer */}
            <OrderSummaryDrawer
                open={showStats}
                onOpenChange={setShowStats}
                products={products}
                onRemoveVoter={onRemoveVoter}
            />

            {/* Unbind Confirmation - Step 1 */}
            <AlertDialog open={unbindStep === 1} onOpenChange={(open) => !open && setUnbindStep(0)}>
                <AlertDialogContent className="max-w-[340px] rounded-3xl border-none">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-center">確定要解除團主身分嗎？</AlertDialogTitle>
                        <AlertDialogDescription className="text-center">
                            解除後您需要重新輸入站號與工號才能再次綁定。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
                        <AlertDialogAction
                            onClick={() => setUnbindStep(2)}
                            className="w-full bg-red-500 hover:bg-red-600 rounded-xl"
                        >
                            確定解除
                        </AlertDialogAction>
                        <AlertDialogCancel
                            onClick={() => setUnbindStep(0)}
                            className="w-full rounded-xl"
                        >
                            取消
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Unbind Confirmation - Step 2 (Final) - Plain div modal to avoid Radix focus trap */}
            {unbindStep === 2 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/50" />
                    <div className="relative z-50 w-full max-w-[340px] mx-4 bg-white rounded-3xl p-6 shadow-2xl">
                        <div className="flex flex-col gap-2 text-center mb-4">
                            <h3 className="text-lg font-semibold text-red-600">
                                ⚠️ 最終確認
                            </h3>
                            <p className="text-sm text-gray-500">
                                請再次確認：這將會清除您的團主綁定資料。
                                此操作無法在此頁面中復原。
                            </p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Button
                                onClick={handleUnbind}
                                disabled={isUnbinding}
                                className="w-full bg-red-600 hover:bg-red-700 rounded-xl"
                            >
                                {isUnbinding ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        解除中...
                                    </>
                                ) : (
                                    "確認解除團主身分"
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setUnbindStep(0)}
                                disabled={isUnbinding}
                                className="w-full rounded-xl"
                            >
                                我再想想
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
