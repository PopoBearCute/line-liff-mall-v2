"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface LeaderBindDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lineUserId: string;
    onBindSuccess: (username: string) => void;
    userAvatar?: string;
    displayName?: string;
}

export function LeaderBindDialog({
    open,
    onOpenChange,
    lineUserId,
    onBindSuccess,
    userAvatar, // [New]
    displayName // [New]
}: LeaderBindDialogProps) {
    const [stationCode, setStationCode] = useState("");
    const [employeeId, setEmployeeId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Validation
    const stationCodeValid = /^[0-9A-Za-z]{4}$/.test(stationCode); // Allow exactly 4 alphanumeric
    const employeeIdValid = /^\d{4,8}$/.test(employeeId); // Numeric 4-8 digits
    const canSubmit = stationCode.length > 0 && employeeId.length > 0;

    const handleSubmit = async () => {
        setError("");

        if (!stationCodeValid) {
            setError("站號格式不正確（需為4位英數字）");
            return;
        }
        if (!employeeIdValid) {
            setError("工號格式不正確（4~8位數字）");
            return;
        }

        const username = `D${stationCode.toUpperCase()}-${employeeId}`;
        setIsSubmitting(true);

        try {
            const idToken = window.liff?.getIDToken();
            if (!idToken) {
                toast.error("無法取得登入驗證碼，請確認是否已登入 LINE");
                setIsSubmitting(false);
                return;
            }

            const payload = {
                action: 'bind_leader',
                stationCode,
                employeeId,
                lineUserId,
                userAvatar,
                displayName,
                idToken
            };

            const res = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const resData = await res.json();

            if (!res.ok || !resData.success) {
                const apiError = resData.error || "綁定失敗，請稍後再試";
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
                    setError(apiError);
                    setIsSubmitting(false);
                }
                return;
            }

            const fullStationCode = `D${stationCode}`;
            toast.success(`綁定成功！歡迎，${resData.leaderName || "團長"}`);
            onBindSuccess(`${fullStationCode}-${employeeId}`);
        } catch (err) {
            console.error("Unexpected bind error:", err);
            setError("系統異常，請稍後再試");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setStationCode("");
        setEmployeeId("");
        setError("");
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-[340px] rounded-3xl border-none shadow-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-center text-xl font-extrabold text-slate-800">
                        👉 開通您的商城團購
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center text-slate-500 text-sm leading-relaxed">
                        輸入站代號與工號。<br />
                        <span className="text-xs text-slate-400">開通後，長按商城 Logo 即可進入您的商店！</span>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4 py-2">
                    {/* Station Code */}
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1.5 block text-center">
                            站代號
                        </label>
                        <div className="flex items-center justify-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100 focus-within:border-blue-500/30 transition-colors">
                            <span className="text-2xl font-black text-blue-600 select-none">D</span>
                            <Input
                                className="w-32 h-12 bg-transparent border-none text-2xl font-black tracking-[0.2em] focus-visible:ring-0 uppercase placeholder:text-slate-200"
                                placeholder="0100"
                                value={stationCode}
                                maxLength={4}
                                inputMode="text"
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9a-zA-Z]/g, "");
                                    setStationCode(val.toUpperCase());
                                    setError("");
                                }}
                                disabled={isSubmitting}
                            />
                        </div>
                        {stationCode && !stationCodeValid && (
                            <p className="text-xs text-amber-500 mt-1 text-center">需為4位英數字</p>
                        )}
                    </div>

                    {/* Employee ID */}
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                            工號
                        </label>
                        <Input
                            placeholder="例如：123456"
                            value={employeeId}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "");
                                setEmployeeId(val);
                                setError("");
                            }}
                            className="h-12 rounded-xl text-center text-lg font-bold tracking-widest border-slate-200 focus-visible:ring-blue-500/30"
                            maxLength={8}
                            inputMode="numeric"
                            disabled={isSubmitting}
                        />
                        {employeeId && !employeeIdValid && (
                            <p className="text-xs text-amber-500 mt-1">4~8位數字</p>
                        )}
                    </div>



                    {/* Error message */}
                    {error && (
                        <div className="text-center py-2 px-4 bg-red-50 rounded-xl border border-red-100">
                            <p className="text-sm text-red-600 font-medium">{error}</p>
                        </div>
                    )}
                </div>

                <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
                    <Button
                        onClick={handleSubmit}
                        disabled={!canSubmit || isSubmitting}
                        className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                驗證中...
                            </>
                        ) : (
                            "進入你的團購商店"
                        )}
                    </Button>
                    <AlertDialogCancel
                        onClick={handleReset}
                        className="w-full h-10 rounded-xl border-slate-200 text-slate-500 font-medium"
                    >
                        取消
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
