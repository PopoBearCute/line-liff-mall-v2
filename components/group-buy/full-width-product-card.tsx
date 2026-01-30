"use client";

import { Minus, Plus, Users, ChevronDown, ChevronUp, Trash2, ExternalLink, Lock, Rocket } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface Product {
  name: string;
  price: number | string;
  origPrice?: number;
  moq: number;
  img: string;
  description: string;
  link?: string;
  isEnabled?: boolean;
  currentQty?: number;
}

interface Voter {
  name: string;
  qty: number;
  userId?: string;
}

interface FullWidthProductCardProps {
  product: Product;
  quantity: number;
  voters: Voter[];
  isExpanded: boolean;
  onToggleVoters: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
  isFeatured?: boolean;
  isLeader?: boolean;
  onRemoveVoter?: (productName: string, voterName: string, userId?: string) => void;
  onEnableProduct?: (productName: string) => void;
  isEnabling?: boolean;
  showQuantityControls?: boolean;
}

export function FullWidthProductCard({
  product,
  quantity,
  voters,
  isExpanded,
  onToggleVoters,
  onIncrease,
  onDecrease,
  isFeatured = false,
  isLeader,
  onRemoveVoter,
  onEnableProduct,
  isEnabling = false,
  showQuantityControls = true,
}: FullWidthProductCardProps) {
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const hasVoters = voters.length > 0;

  // 決定按鈕狀態：如果是銷售期 (有 link)，則顯示購買相關按鈕
  const isSalePhase = !!product.link;

  return (
    <div
      className={`card-hover rounded-2xl overflow-hidden ${isFeatured ? "glass-card-featured" : "glass-card"
        }`}
    >
      {/* Large Product Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <Image
          src={product.img || "/placeholder.svg"}
          alt={product.name}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 400px"
          priority={isFeatured}
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isFeatured && (
            <span className="badge-pulse relative inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground shadow-lg">
              今日主打
            </span>
          )}
          {isSalePhase && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shadow-md ${product.isEnabled ? "bg-green-500 text-white btn-gemstone" : "bg-orange-500 text-white"
              }`}>
              {product.isEnabled ? "✨ 開放購買" : "🔴 團主準備中"}
            </span>
          )}
        </div>
      </div>

      {/* Product Info & Controls */}
      <div className="flex flex-col gap-4 px-4 py-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Product details */}
          <div className="min-w-0 flex-1">
            <h4 className="text-base font-bold leading-tight text-foreground line-clamp-2">
              {product.name}
            </h4>
            <div className="mt-0.5 text-xs text-muted-foreground">
              <div className="relative">
                <p className={`${!isDescExpanded ? "line-clamp-2" : ""} break-words text-left`}>
                  {product.description}
                </p>
                {product.description && product.description.length > 40 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDescExpanded(!isDescExpanded);
                    }}
                    className="mt-1 font-bold text-primary hover:underline focus:outline-none block"
                  >
                    {isDescExpanded ? "收起" : "...更多"}
                  </button>
                )}
              </div>
            </div>

            {/* 📊 Inline Progress Bar */}
            <div className="mt-2.5">
              <div className="flex justify-between items-center text-[10px] mb-1">
                <span className={product.currentQty && product.currentQty >= product.moq ? "text-green-600 font-bold" : "text-muted-foreground"}>
                  {product.currentQty && product.currentQty >= product.moq
                    ? `🎉 已成團 (達成率 ${Math.min(Math.round((product.currentQty / product.moq) * 100), 999)}%)`
                    : `🔥 還差 ${product.moq - (product.currentQty || 0)} 組成團`
                  }
                </span>
                <span className="text-muted-foreground/60">{product.currentQty || 0}/{product.moq}</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${product.currentQty && product.currentQty >= product.moq ? "bg-green-500" : "bg-orange-400"
                    }`}
                  style={{ width: `${Math.min(((product.currentQty || 0) / product.moq) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="mt-2 flex flex-col items-start gap-0.5">
              {product.origPrice && (
                <span className="text-xs text-muted-foreground line-through decoration-muted-foreground/50">
                  市價 ${product.origPrice}
                </span>
              )}
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold text-red-600/90">團購價</span>
                <span className="text-xl font-black text-red-600">
                  ${product.price}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Quantity Control container */}
          {showQuantityControls && (
            <div className="flex flex-col items-center gap-1">
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={onDecrease}
                  className="qty-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/80 text-foreground disabled:opacity-40"
                  disabled={isSalePhase && product.isEnabled}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-[2rem] text-center text-lg font-bold text-foreground">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={onIncrease}
                  className="qty-btn qty-btn-plus flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"
                  disabled={isSalePhase && product.isEnabled}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="text-xs font-bold text-gray-600 text-center w-full mt-2">
                大家一起湊 {product.moq} 份
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons for Sale Phase */}
        {isSalePhase && (
          <div className="mt-2 flex flex-col gap-2">
            {isLeader && !product.isEnabled && (
              <button
                onClick={() => onEnableProduct?.(product.name)}
                disabled={isEnabling}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 font-bold text-white shadow-lg active:scale-95 disabled:opacity-50 transition-all btn-gemstone"
              >
                {isEnabling ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Rocket className="h-4 w-4" />}
                團主點此啟用購買 (啟用後無法取消)
              </button>
            )}

            {product.isEnabled ? (
              <a
                href={product.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-primary-foreground shadow-lg active:scale-95 transition-all"
              >
                <ExternalLink className="h-4 w-4" />
                前往商城購買
              </a>
            ) : !isLeader && (
              <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-muted py-3 font-bold text-muted-foreground opacity-70">
                <Lock className="h-4 w-4" />
                團主確認數量中，稍後開放
              </div>
            )}
          </div>
        )}
      </div>

      {/* Voters Accordion */}
      {hasVoters && (
        <>
          <button
            type="button"
            onClick={onToggleVoters}
            className="expand-btn flex w-full items-center justify-center gap-1.5 border-t border-border/30 bg-muted/30 px-4 py-2.5 text-xs font-medium text-muted-foreground"
          >
            <Users className="h-3.5 w-3.5" />
            <span>{voters.length} 人跟團</span>
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-out ${isExpanded ? "max-h-48" : "max-h-0"
              }`}
          >
            <div className="border-t border-border/20 bg-muted/20 px-4 py-2">
              {voters.map((voter, idx) => (
                <div
                  key={`${voter.name}-${idx}`}
                  className="flex items-center justify-between py-1.5 text-sm"
                >
                  <span className="text-foreground/80">{voter.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      x{voter.qty}
                    </span>
                    {isLeader && onRemoveVoter && (
                      <button
                        onClick={() => onRemoveVoter(product.name, voter.name, voter.userId)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
                        title="移除此紀錄"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
