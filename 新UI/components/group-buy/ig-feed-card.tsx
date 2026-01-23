"use client";

import { useState } from "react";
import { BadgeCheck, Heart, MessageCircle, Send, MoreHorizontal, Plus, Minus, Flame, Box, Clock } from "lucide-react";
import Image from "next/image";

interface Product {
    name: string;
    price: number | string;
    origPrice?: number;
    moq: number;
    img: string;
    description: string;
    link?: string;
    isEnabled?: boolean;
}

interface IGFeedCardProps {
    product: Product;
    mode: 'active' | 'collecting' | 'preparing';
    voters?: { name: string; qty: number; userId?: string }[];
    cartQty?: number;
    onJoin?: () => void; // For collecting/preparing
    onAdd?: () => void;
    onRemove?: () => void;
    isLeader?: boolean;
    leaderName?: string; // 新增：傳遞團主名稱
}

export function IGFeedCard({
    product,
    mode,
    voters = [],
    cartQty = 0,
    onJoin,
    onAdd,
    onRemove,
    isLeader,
    leaderName
}: IGFeedCardProps) {
    const [isLiked, setIsLiked] = useState(false);
    const totalVotes = voters.reduce((acc, v) => acc + v.qty, 0);
    const achievedPercent = Math.min(Math.round((totalVotes / product.moq) * 100), 100);
    const isTargetMet = totalVotes >= product.moq;

    // --- Dynamic Configuration based on Mode ---
    const config = {
        active: {
            headerLabel: "Hot Sale",
            headerIcon: <Flame className="w-3 h-3 text-red-500 fill-red-500" />,
            btnColor: "bg-primary-green hover:bg-green-600",
            btnText: "立即購買",
            progressColor: "bg-primary-green",
            statusText: `剩餘庫存: 充足`, // Placeholder logic
            action: () => window.open(product.link, '_blank'),
            priceColor: "text-black dark:text-white"
        },
        collecting: {
            headerLabel: "Sponsored",
            headerIcon: null,
            btnColor: "bg-primary-blue hover:bg-blue-600",
            btnText: "跟團登記",
            progressColor: "bg-gradient-to-r from-primary-green to-teal-400",
            statusText: `目標 ${product.moq} / 已達 ${totalVotes}`,
            action: onJoin, // This will toggle the quantity selector
            priceColor: "text-black dark:text-white"
        },
        preparing: {
            headerLabel: "Coming Soon",
            headerIcon: <Clock className="w-3 h-3 text-gray-400" />,
            btnColor: "bg-gray-400 cursor-not-allowed",
            btnText: "籌備中",
            progressColor: "bg-gray-300",
            statusText: "等待團主開啟",
            action: () => { },
            priceColor: "text-gray-400"
        }
    }[mode];

    // Helper to determine if we show the "Add/Remove" stepper or the big button
    const showStepper = (mode === 'collecting' || mode === 'active') && cartQty > 0;

    return (
        <article className="bg-white dark:bg-black pb-4 border-b border-gray-100 dark:border-gray-800 mb-2">
            {/* 1. Header (User Info) */}
            <div className="flex items-center justify-between px-3 py-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-yellow-400 to-pink-600">
                        <div className="w-full h-full rounded-full bg-white dark:bg-black p-[1.5px] overflow-hidden">
                            {/* Placeholder Avatar - replace with Leader Avatar if available */}
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-[10px]">L</div>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {leaderName ? `${leaderName}嚴選` : "團購主"}
                            </span>
                            <BadgeCheck className="w-3 h-3 text-primary-blue fill-primary-blue text-white" />
                        </div>
                        <div className="flex items-center gap-1 text-xs text-secondary">
                            {config.headerIcon}
                            <span>{config.headerLabel}</span>
                        </div>
                    </div>
                </div>
                <button className="text-gray-900 dark:text-white">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </div>

            {/* 2. Media (Image) - Shorter Aspect Ratio */}
            <div className="relative w-full aspect-[2/1] bg-gray-50 dark:bg-gray-900 overflow-hidden">
                <Image
                    src={product.img}
                    alt={product.name}
                    fill
                    className={`object-contain ${mode === 'preparing' ? 'opacity-80 grayscale-[0.2]' : ''}`}
                    priority={false} // Lazy load for feed
                />
                {mode === 'preparing' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                        <span className="bg-black/60 text-white px-3 py-1 rounded-full text-xs backdrop-blur-md border border-white/20">
                            即將開團
                        </span>
                    </div>
                )}
            </div>

            {/* 3. Action Bar (Social) - Optional, similar to IG */}
            {/* <div className="flex items-center justify-between px-3 pt-3">
        <div className="flex items-center gap-4">
            <Heart className="w-6 h-6 hover:text-gray-500 cursor-pointer" />
            <MessageCircle className="w-6 h-6 hover:text-gray-500 cursor-pointer" />
            <Send className="w-6 h-6 hover:text-gray-500 cursor-pointer" />
        </div>
        <div className="w-6"></div> 
      </div> */}

            {/* 4. Content Area */}
            <div className="px-3 mt-3">
                {/* Progress Section */}
                {mode !== 'preparing' && (
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2.5 border border-gray-100 dark:border-gray-800 mb-3 space-y-2">
                        <div className="flex justify-between items-baseline mb-1">
                            <span className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
                                {mode === 'collecting' ? '達成率' : '銷售狀況'}
                                <span className={`ml-1 ${mode === 'collecting' ? (isTargetMet ? 'text-primary-green' : 'text-primary-blue') : 'text-primary-green'}`}>
                                    {mode === 'collecting' ? `${achievedPercent}%` : '熱賣中'}
                                </span>
                            </span>
                            <span className="text-[10px] text-gray-500">
                                {config.statusText}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                            <div
                                className={`h-1.5 rounded-full ${config.progressColor} transition-all duration-500`}
                                style={{ width: mode === 'collecting' ? `${achievedPercent}%` : '80%' }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Title & Description */}
                <div className="text-[14px] text-gray-900 dark:text-white leading-relaxed mb-1">
                    <span className="font-semibold mr-1">商品詳情</span>
                    {product.name}
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
            </div>

            {/* 5. Sticky/Fixed Action Row (or inline) */}
            <div className="px-3 mt-4 mb-2">
                <div className="flex items-center justify-between bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-3 shadow-sm">
                    <div className="flex flex-col">
                        {product.origPrice && <span className="text-[10px] text-gray-400 line-through">市價 ${product.origPrice}</span>}
                        <div className="flex items-baseline gap-1">
                            <span className={`text-lg font-bold ${config.priceColor}`}>${product.price}</span>
                            <span className="text-[10px] font-medium text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">團購價</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Main Action Button */}
                        {(!showStepper && mode !== 'preparing') && (
                            <button
                                onClick={config.action}
                                className={`${config.btnColor} text-white text-xs font-bold px-6 py-2.5 rounded-full transition-colors shadow-sm whitespace-nowrap active:scale-95`}
                            >
                                {config.btnText}
                            </button>
                        )}

                        {/* Preparing State */}
                        {mode === 'preparing' && (
                            <button className={`${config.btnColor} text-white text-xs font-bold px-6 py-2.5 rounded-full whitespace-nowrap`}>
                                {config.btnText}
                            </button>
                        )}

                        {/* Quantity Stepper (Only for active/collecting when engaged) */}
                        {showStepper && (
                            <div className="flex items-center bg-gray-50 dark:bg-gray-900 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700 h-[36px]">
                                <button
                                    onClick={onRemove}
                                    className="w-8 h-full flex items-center justify-center text-gray-400 hover:text-gray-600 active:bg-gray-200 rounded transition-colors"
                                >
                                    <Minus size={16} />
                                </button>
                                <span className="w-8 text-center text-sm font-semibold text-gray-900 dark:text-white select-none">
                                    {cartQty}
                                </span>
                                <button
                                    onClick={onAdd}
                                    className="w-8 h-full flex items-center justify-center text-primary-blue hover:bg-blue-50 active:bg-blue-100 rounded transition-colors"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}
