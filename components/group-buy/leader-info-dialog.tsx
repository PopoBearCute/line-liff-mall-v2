"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Store, User, Hash } from "lucide-react";

interface LeaderProfile {
    name: string;
    store: string;
    avatar: string;
}

interface LeaderInfoDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    profile: LeaderProfile | null;
}

export function LeaderInfoDialog({ isOpen, onOpenChange, profile }: LeaderInfoDialogProps) {
    if (!profile) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] rounded-3xl border-none shadow-2xl overflow-hidden p-0 bg-white/95 backdrop-blur-xl">
                <div className="relative h-24 bg-gradient-to-r from-blue-600 to-blue-400">
                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                        <div className="p-1 bg-white rounded-full shadow-lg">
                            <Avatar className="w-24 h-24 border-4 border-white">
                                <AvatarImage src={profile.avatar || "/leader-avatar.png"} alt={profile.name} className="object-cover" />
                                <AvatarFallback className="bg-blue-100 text-blue-600 text-xl font-bold">
                                    {profile.name[0]}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                </div>

                <div className="pt-16 pb-8 px-6 text-center">
                    <h2 className="text-2xl font-bold text-slate-800">{profile.name}</h2>
                    <p className="text-sm text-slate-500 mt-1">集單團購主身分卡</p>

                    <div className="mt-8 space-y-4 text-left bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 p-1.5 bg-blue-100 rounded-lg text-blue-600">
                                <Store className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-medium">取貨站點</p>
                                <p className="text-sm font-semibold text-slate-700">{profile.store || "未設定站點"}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <button
                            onClick={() => onOpenChange(false)}
                            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 active:scale-[0.98] transition-all shadow-lg shadow-slate-200"
                        >
                            我知道了
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
