"use client";

import { useState } from "react";
import { BadgeCheck, Heart, MessageCircle, Send, MoreHorizontal, Plus, Minus, Flame, Box, Clock, Loader2 } from "lucide-react";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Product {
    name: string;
    price: number | string;
    origPrice?: number;
    moq: number;
    img: string;
    description: string;
    link?: string;
    isEnabled?: boolean;
    buyerAvatars?: string[];
    currentQty?: number;
    endDate?: string;
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
    leaderName?: string;
    currentUserId?: string; // 新增：供檢查個人登記上限使用
    onEnableProduct?: () => void; // Toggle handler
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
    leaderName,
    currentUserId,
    onSubmit,
    isSubmitting = false,
    onEnableProduct
}: IGFeedCardProps & { onSubmit?: () => void; isSubmitting?: boolean }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [isToggling, setIsToggling] = useState(false);
    const totalVotes = Array.isArray(voters) ? voters.reduce((acc, v) => acc + (Number(v.qty) || 0), 0) : 0;
    const safeMoq = Math.max(Number(product.moq) || 1, 1);
    const achievedPercent = Math.min(Math.round((totalVotes / safeMoq) * 100), 100) || 0;
    const isTargetMet = totalVotes >= safeMoq;

    const handleToggle = async () => {
        if (onEnableProduct) {
            setIsToggling(true);
            await onEnableProduct();
            // We don't set setIsToggling(false) here immediately if we expect a prop update to clear it?
            // Actually, since onEnableProduct in page.tsx is async but void in signature here (we didn't type it async), 
            // we should probably just rely on re-render. 
            // But let's set it back to false after a delay or just let it spin until re-render functionality?
            // Better to timeout or assume parent update. 
            // For now, let's just let it spin until props change.
            setTimeout(() => setIsToggling(false), 2000); // Failsafe
        }
    };

    // Check if enabled (handling string/number/boolean)
    const isEnabled = product.isEnabled === true ||
        String(product.isEnabled).toLowerCase() === 'true' ||
        Number(product.isEnabled) === 1;


    // --- Dynamic Configuration based on Mode ---
    const config = {
        active: {
            headerLabel: "Hot Sale",
            headerIcon: <Flame className="w-3 h-3 text-red-500 fill-red-500" />,
            btnColor: "bg-primary-green hover:bg-green-600",
            btnText: "來去下單",
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

    // Find the current user's existing quantity in the voters list
    const myExistingQty = voters.find(v => v.userId === currentUserId)?.qty || 0;

    // Updated: showStepper should be visible if:
    // 1. There is ANY cart activity (positive or negative)
    // 2. OR the user already has a record (so they can start subtract)
    const showStepper = mode === 'collecting' && (cartQty !== 0 || myExistingQty > 0);

    return (
        <article id={product.name} className="bg-white dark:bg-black pb-4 border-b border-gray-100 dark:border-gray-800 mb-2 scroll-mt-20">
            {/* 1. Header (User Info) */}
            <div className="flex items-center justify-between px-3 py-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-yellow-400 to-pink-600">
                        <div className="w-full h-full rounded-full bg-white dark:bg-black p-[1.5px] overflow-hidden">
                            <Image
                                src="/line-liff-mall-v2/leader-avatar.png"
                                alt={leaderName || "Leader"}
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                            />
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
                <div>
                    {isLeader && onEnableProduct ? (
                        <div className="flex items-center gap-2">
                            {isToggling && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
                            <Switch
                                checked={isEnabled}
                                onCheckedChange={handleToggle}
                                disabled={isToggling}
                                className="data-[state=checked]:bg-primary-blue"
                            />
                        </div>
                    ) : (
                        <button className="text-gray-900 dark:text-white">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* 2. Media (Image) */}
            <div className="relative w-full aspect-[2/1] bg-gray-50 dark:bg-gray-900 overflow-hidden">
                <Image
                    src={product.img}
                    alt={product.name}
                    fill
                    className={`object-contain ${mode === 'preparing' ? 'opacity-80 grayscale-[0.2]' : ''}`}
                    priority={false}
                />
                {mode === 'preparing' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                        <span className="bg-black/60 text-white px-3 py-1 rounded-full text-xs backdrop-blur-md border border-white/20">
                            即將開團
                        </span>
                    </div>
                )}
            </div>

            {/* 4. Content Area */}
            <div className="px-3 mt-3">
                {mode !== 'preparing' && (
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2.5 border border-gray-100 dark:border-gray-800 mb-3 space-y-2">
                        {/* Top Layer: Percent | Deadline */}
                        <div className="flex justify-between items-baseline">
                            <span className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
                                達成率 <span className={`ml-1 ${isTargetMet ? 'text-emerald-500' : 'text-sky-500'}`}>
                                    {achievedPercent}%
                                </span>
                            </span>
                            {product.endDate && (
                                <span className="text-[11px] text-gray-500 font-medium">
                                    截止日期: {product.endDate}
                                </span>
                            )}
                        </div>

                        {/* Middle Layer: Progress Bar */}
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                                className={`h-2 rounded-full ${isTargetMet ? 'bg-emerald-500' : 'bg-sky-500'} transition-all duration-500`}
                                style={{ width: `${Math.min(achievedPercent, 100)}%` }}
                            ></div>
                        </div>

                        {/* Bottom Layer: Target Info | Avatar Stack */}
                        <div className="flex justify-between items-center">
                            <span className="text-[11px] text-gray-500 font-medium tracking-tight">
                                目標 {product.moq} 份 / 已達 {product.currentQty || 0} 份
                            </span>

                            {/* Avatar Stack moved here */}
                            {product.buyerAvatars && product.buyerAvatars.length > 0 && (
                                <div className="flex items-center -space-x-1.5 translate-x-1">
                                    {product.buyerAvatars.slice(0, 3).map((avatar, i) => (
                                        <Avatar key={i} className="w-5 h-5 border border-white dark:border-black shadow-sm">
                                            <AvatarImage src={avatar} />
                                            <AvatarFallback className="text-[7px]">U</AvatarFallback>
                                        </Avatar>
                                    ))}
                                    {product.buyerAvatars.length > 3 && (
                                        <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[8px] border border-white dark:border-black font-bold text-gray-500 shadow-sm">
                                            +{product.buyerAvatars.length - 3}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="text-[14px] text-gray-900 dark:text-white leading-relaxed mb-1">
                    <div className={isExpanded ? "" : "line-clamp-2"}>
                        <span className="font-bold mr-2">{product.name}</span>
                        {product.description}
                    </div>
                    {!isExpanded && typeof product.description === 'string' && product.description.length > 30 && (
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="text-gray-500 hover:text-gray-700 text-[13px] inline-block"
                        >
                            ... 更多
                        </button>
                    )}
                    {isExpanded && (
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="text-gray-500 hover:text-gray-700 text-[13px] block mt-1"
                        >
                            顯示較少
                        </button>
                    )}
                </div>
            </div>

            {/* 5. Sticky/Fixed Action Row */}
            <div className="px-3 mt-4 mb-2">
                <div className={`flex items-center justify-between border rounded-xl p-3 shadow-sm transition-all duration-300 ${cartQty !== 0 ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/50' : 'bg-white dark:bg-black border-gray-200 dark:border-gray-800'}`}>
                    <div className="flex flex-col min-w-[120px]">
                        {cartQty !== 0 ? (
                            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${cartQty > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {cartQty > 0 ? '本次追加' : '減少登記'}
                                </span>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-lg font-black ${cartQty > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                                        {cartQty > 0 ? `+${cartQty}` : cartQty}
                                    </span>
                                    <span className="text-xs font-medium text-gray-500">件</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                {product.origPrice && <span className="text-[10px] text-gray-400 line-through">市價 ${product.origPrice}</span>}
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-lg font-bold ${config.priceColor}`}>${product.price}</span>
                                    <span className="text-[10px] font-medium text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">團購價</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* 1. Confirm Capsule (Only when qty changed AND not active mode) */}
                        {cartQty !== 0 && mode !== 'active' && (
                            <button
                                onClick={onSubmit}
                                disabled={isSubmitting}
                                className="h-[36px] px-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale flex items-center gap-2 animate-in zoom-in-95"
                            >
                                {isSubmitting ? (
                                    <Clock className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <BadgeCheck className="w-3.5 h-3.5" />
                                )}
                                確認
                            </button>
                        )}

                        {/* 2. Main Action Button (Initial) */}
                        {(!showStepper && mode !== 'preparing') && (
                            <button
                                onClick={mode === 'active' && config.action ? config.action : onAdd}
                                className={`${config.btnColor} text-white text-xs font-bold px-6 py-2.5 rounded-full transition-colors shadow-sm whitespace-nowrap active:scale-95`}
                            >
                                {config.btnText}
                            </button>
                        )}

                        {/* 3. Preparing State */}
                        {mode === 'preparing' && (
                            <button className={`${config.btnColor} text-white text-xs font-bold px-6 py-2.5 rounded-full whitespace-nowrap`}>
                                {config.btnText}
                            </button>
                        )}

                        {/* 4. Quantity Stepper */}
                        {showStepper && (
                            <div className="flex items-center bg-gray-50 dark:bg-gray-900 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700 h-[36px]">
                                <button
                                    onClick={onRemove}
                                    disabled={myExistingQty + cartQty <= 0}
                                    className="w-8 h-full flex items-center justify-center text-gray-400 hover:text-gray-600 active:bg-gray-200 rounded transition-colors disabled:opacity-20"
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
