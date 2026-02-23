"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Info } from "lucide-react";
import { LeaderInfoDialog } from "./leader-info-dialog";

interface Product {
    name: string;
    img: string;
}

interface LeaderProfile {
    name: string;
    store: string;
    stationCode: string;
    address: string;
    avatar: string;
}

interface StoriesBarProps {
    leaderAvatar?: string;
    leaderName?: string;
    leaderProfile?: LeaderProfile | null;
    products?: Product[];
    onProductClick?: (productName: string) => void;
}

export function StoriesBar({ leaderAvatar, leaderName, leaderProfile, products = [], onProductClick }: StoriesBarProps) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    return (
        <div className="w-full max-w-md mx-auto pt-2 pb-2">
            <div className="flex gap-4 overflow-x-auto px-4 scrollbar-none snap-x">
                {/* 1. Leader Story (Fixed) */}
                <div
                    className="flex flex-col items-center gap-1 min-w-[72px] snap-center cursor-pointer group"
                    onClick={() => setIsProfileOpen(true)}
                >
                    <div className="relative p-[3px] rounded-full group-hover:scale-105 transition-transform duration-300">
                        <div className="rounded-full bg-white dark:bg-black p-[2px] border border-gray-100 dark:border-gray-800">
                            <Avatar className="w-16 h-16">
                                <AvatarImage src={leaderAvatar || "/leader-avatar.png"} alt="Leader" className="object-cover" />
                                <AvatarFallback>Leader</AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1 border-2 border-white dark:border-black shadow-sm">
                            <Info className="w-3 h-3" />
                        </div>
                    </div>
                    <span className="text-[11px] text-center font-bold text-slate-700 dark:text-white truncate w-full px-1">
                        {leaderName || "團購主"}
                    </span>
                </div>

                {/* 2. Product Stories (Dynamic) */}
                {products.slice(0, 10).map((product, index) => (
                    <div
                        key={`${product.name}-${index}`}
                        className="flex flex-col items-center gap-1 min-w-[72px] snap-center cursor-pointer group"
                        onClick={() => onProductClick?.(product.name)}
                    >
                        <div className="p-[3px] rounded-full bg-gradient-to-tr from-amber-400 to-fuchsia-600 group-hover:scale-105 transition-all duration-300">
                            <div className="rounded-full bg-white dark:bg-black p-[2px]">
                                <Avatar className="w-16 h-16 border-2 border-white dark:border-black">
                                    <AvatarImage src={product.img} alt={product.name} className="object-cover" />
                                    <AvatarFallback>{product.name[0]}</AvatarFallback>
                                </Avatar>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Leader Info Popup */}
            <LeaderInfoDialog
                isOpen={isProfileOpen}
                onOpenChange={setIsProfileOpen}
                profile={leaderProfile || null}
            />
        </div>
    );
}
