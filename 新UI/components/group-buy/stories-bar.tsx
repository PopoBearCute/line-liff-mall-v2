"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";

interface Product {
    name: string;
    img: string;
}

interface StoriesBarProps {
    leaderAvatar?: string;
    leaderName?: string;
    products?: Product[];
    onProductClick?: (productName: string) => void;
}

export function StoriesBar({ leaderAvatar, leaderName, products = [], onProductClick }: StoriesBarProps) {
    return (
        <div className="w-full max-w-md mx-auto pt-2 pb-2">
            <div className="flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-none snap-x">
                {/* 1. Leader Story (Fixed) */}
                <div className="flex flex-col items-center gap-1 min-w-[72px] snap-center cursor-pointer group">
                    <div className="relative p-[3px] rounded-full group-hover:scale-105 transition-transform duration-300">
                        <div className="rounded-full bg-white dark:bg-black p-[2px] border border-gray-100 dark:border-gray-800">
                            <Avatar className="w-16 h-16">
                                <AvatarImage src={leaderAvatar || "/line-liff-mall-v2/leader-avatar.png"} alt="Leader" className="object-cover" />
                                <AvatarFallback>Leader</AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="absolute bottom-0 right-0 bg-primary-blue text-white rounded-full p-0.5 border-2 border-white dark:border-black">
                            <Plus className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <span className="text-xs text-center font-medium text-gray-900 dark:text-white truncate w-full">
                        團購主
                    </span>
                </div>

                {/* 2. Product Stories (Dynamic) */}
                {products.slice(0, 10).map((product, index) => (
                    <div
                        key={`${product.name}-${index}`}
                        className="flex flex-col items-center gap-1 min-w-[72px] snap-center cursor-pointer group"
                        onClick={() => onProductClick?.(product.name)}
                    >
                        <div className="p-[3px] rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 group-hover:from-primary-green group-hover:to-emerald-400 transition-all duration-300 group-hover:scale-105">
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
        </div>
    );
}
