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
    const employeeIdValid = /^\d{6}$/.test(employeeId); // Numeric exactly 6 digits
    const canSubmit = stationCode.length > 0 && employeeId.length > 0;

    const handleSubmit = async () => {
        setError("");

        if (!stationCodeValid) {
            setError("站號格式不正確（需為4位英數字）");
            return;
        }
        if (!employeeIdValid) {
            setError("工號格式不正確（需為6位數字）");
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
            <AlertDialogContent className="max-w-[340px] rounded-3xl border-none shadow-2xl bg-white/95 backdrop-blur-xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-center text-2xl font-extrabold text-slate-800 flex items-center justify-center gap-2">
                        進入團購主管理頁面
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center mt-3 flex flex-col gap-1.5">
                        <span className="text-lg font-bold text-slate-700">輸入站代號與工號。</span>
                        <span className="text-base font-medium text-slate-500">開通後，長按商城 Logo 即可進入您的商店！</span>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4 py-2">
                    {/* Station Code */}
                    <div>
                        <label className="text-sm font-bold text-slate-700 mb-2 block">
                            站代號
                        </label>
                        <div className="flex items-center justify-center bg-slate-50/80 rounded-2xl border border-slate-200 focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all h-14">
                            <span className="font-black font-sans text-blue-600 select-none tracking-[0.1em]" style={{ fontSize: '32px', fontWeight: 900, fontFamily: 'inherit' }}>D</span>
                            <Input
                                className="w-[4.8ch] bg-transparent border-none font-black font-sans text-blue-600 tracking-[0.1em] focus-visible:ring-0 uppercase placeholder:text-blue-300/50 p-0 text-left"
                                style={{ fontSize: '32px', fontWeight: 900, fontFamily: 'inherit' }}
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
                            <p className="text-sm text-red-500 mt-1.5 font-medium flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-red-500 inline-block"></span>
                                需為 4 位英數字
                            </p>
                        )}
                    </div>

                    {/* Employee ID */}
                    <div>
                        <label className="text-sm font-bold text-slate-700 mb-2 block">
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
                            className="h-14 rounded-2xl text-center font-black font-sans text-blue-600 tracking-[0.1em] bg-slate-50/80 border-slate-200 focus-visible:border-blue-500/50 focus-visible:ring-4 focus-visible:ring-blue-500/10 transition-all placeholder:text-blue-300/50 placeholder:font-medium placeholder:tracking-normal"
                            style={{ fontSize: '32px', fontWeight: 900, fontFamily: 'inherit' }}
                            maxLength={6}
                            inputMode="numeric"
                            disabled={isSubmitting}
                        />
                        {employeeId && !employeeIdValid && (
                            <p className="text-sm text-red-500 mt-1.5 font-medium flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-red-500 inline-block"></span>
                                需為 6 位數字
                            </p>
                        )}
                    </div>

                    {/* Data sync notice */}
                    <div className="flex gap-2 px-3 py-2.5 bg-amber-50 rounded-xl border border-amber-200/80">
                        <span className="text-amber-500 text-base leading-none mt-0.5 shrink-0">⚠️</span>
                        <p className="text-xs text-amber-700 leading-relaxed">
                            後台資料非即時同步至此團購主工具，如綁定失敗請過兩天再嘗試。此工具綁定不影響團購之功能。
                        </p>
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
