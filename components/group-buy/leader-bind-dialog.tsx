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
    const stationCodeValid = /^[0-9A-Za-z]{3,6}$/.test(stationCode); // Allow 3-6 alphanumeric
    const employeeIdValid = /^\d{4,8}$/.test(employeeId); // Numeric 4-8 digits
    const canSubmit = stationCode.length > 0 && employeeId.length > 0;

    const handleSubmit = async () => {
        setError("");

        if (!stationCodeValid) {
            setError("站號格式不正確（3~6位英數字）");
            return;
        }
        if (!employeeIdValid) {
            setError("工號格式不正確（4~8位數字）");
            return;
        }

        const username = `D${stationCode.toUpperCase()}-${employeeId}`;
        setIsSubmitting(true);

        try {
            if (!supabase) {
                toast.error("系統錯誤：無法連接資料庫");
                return;
            }

            // 1. Check Station Code (Prepend 'D' automatically)
            const fullStationCode = `D${stationCode}`;

            const { data: stationData, error: stationError } = await supabase
                .from("StationList")
                .select("StationID")
                .eq("StationCode", fullStationCode)
                .single();

            if (stationError || !stationData) {
                setError("找不到此站號，請檢查是否正確");
                setIsSubmitting(false);
                return;
            }

            // 2. Check if this username exists in GroupLeaders
            const { data: leader, error: fetchError } = await supabase
                .from("GroupLeaders")
                .select("id, Username, EmployeeID, LineID, 團主名稱")
                .eq("Username", fullStationCode)
                .eq("EmployeeID", employeeId)
                .single();

            if (fetchError || !leader) {
                setError(`查無此站號工號組合「${fullStationCode}-${employeeId}」，請確認後重試`);
                setIsSubmitting(false);
                return;
            }

            // 2. Check if another person already bound to this leader
            if (leader.LineID && leader.LineID !== lineUserId) {
                setError("此站號工號已被其他帳號綁定，請聯絡管理員");
                setIsSubmitting(false);
                return;
            }

            // 3. Bind: write LineID
            const { error: updateError } = await supabase
                .from("GroupLeaders")
                .update({
                    LineID: lineUserId,
                    avatar_url: userAvatar || "", // [New] Update avatar
                    "暱稱": displayName || ""      // [New] Update nickname
                })
                .eq("Username", fullStationCode) // Use full station code with D prefix
                .eq("EmployeeID", employeeId);

            if (updateError) {
                console.error("Bind error:", updateError);
                setError("綁定失敗，請稍後再試");
                setIsSubmitting(false);
                return;
            }

            toast.success(`綁定成功！歡迎，${leader.團主名稱}`);
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
                        🔐 團主身分綁定
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center text-slate-500 text-sm leading-relaxed">
                        請輸入您的站號與工號完成身分驗證<br />
                        <span className="text-xs text-slate-400">綁定後下次長按即可直接進入</span>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4 py-2">
                    {/* Station Code */}
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                            站號
                        </label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 select-none">
                                D
                            </div>
                            <Input
                                className="pl-7 h-12 rounded-xl text-center text-lg font-bold tracking-widest border-slate-200 focus-visible:ring-blue-500/30 uppercase"
                                placeholder="12345"
                                value={stationCode}
                                maxLength={6}
                                inputMode="text"
                                onChange={(e) => {
                                    // Allow numbers and letters
                                    const val = e.target.value.replace(/[^0-9a-zA-Z]/g, "");
                                    setStationCode(val.toUpperCase()); // Auto upper case
                                    setError("");
                                }}
                                disabled={isSubmitting}
                            />
                        </div>
                        {stationCode && !stationCodeValid && (
                            <p className="text-xs text-amber-500 mt-1">3~6位英數字</p>
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

                    {/* Combined preview */}
                    {stationCode && employeeId && (
                        <div className="text-center py-2 px-4 bg-slate-50 rounded-xl">
                            <span className="text-xs text-slate-400">將比對：</span>
                            <span className="ml-2 font-mono font-bold text-slate-700">
                                D{stationCode.toUpperCase()}-{employeeId}
                            </span>
                        </div>
                    )}

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
                            "確認綁定"
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
