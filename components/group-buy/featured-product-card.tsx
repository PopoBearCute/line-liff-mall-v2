"use client";

import { Minus, Plus, Users, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import Image from "next/image";

interface Product {
  name: string;
  price: number;
  moq: number;
  img: string;
}

interface Voter {
  name: string;
  qty: number;
}

interface FeaturedProductCardProps {
  product: Product;
  quantity: number;
  voters: Voter[];
  isExpanded: boolean;
  onToggleVoters: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
}

export function FeaturedProductCard({
  product,
  quantity,
  voters,
  isExpanded,
  onToggleVoters,
  onIncrease,
  onDecrease,
}: FeaturedProductCardProps) {
  const hasVoters = voters.length > 0;

  return (
    <div className="glass-card-featured card-hover rounded-3xl overflow-hidden">
      {/* Featured Badge */}
      <div className="relative px-4 pt-4">
        <div className="inline-flex">
          <div className="badge-pulse relative flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-accent-foreground shadow-lg">
            <Sparkles className="h-3.5 w-3.5" />
            今日主打
          </div>
        </div>
      </div>

      <div className="flex gap-4 p-4 pt-3">
        {/* Large Product Image */}
        <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl shadow-lg">
          <Image
            src={product.img || "/placeholder.svg"}
            alt={product.name}
            fill
            className="object-contain"
            sizes="128px"
            priority
          />
        </div>

        {/* Product Info */}
        <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
          <div>
            <h4 className="text-base font-bold leading-tight text-foreground line-clamp-2">
              {product.name}
            </h4>
            <p className="mt-1.5 text-xl font-black price-highlight">
              ${product.price}
            </p>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
              成團門檻：{product.moq} 份
            </p>
          </div>

          {/* Quantity Control - Centered flex layout */}
          <div className="mt-3 flex items-center justify-start gap-2">
            <button
              type="button"
              onClick={onDecrease}
              onClick={onDecrease}
              className="qty-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/80 text-foreground disabled:opacity-40"
              aria-label="減少數量"
              data-action="decrease"
              data-product={product.name}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[2rem] text-center text-lg font-black text-foreground">
              {quantity}
            </span>
            <button
              type="button"
              onClick={onIncrease}
              className="qty-btn qty-btn-plus flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"
              aria-label="增加數量"
              data-action="increase"
              data-product={product.name}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Voters Accordion */}
      {hasVoters && (
        <>
          <button
            type="button"
            onClick={onToggleVoters}
            className="expand-btn flex w-full items-center justify-center gap-2 border-t border-border/30 bg-muted/30 px-4 py-3 text-sm font-medium text-muted-foreground"
          >
            <Users className="h-4 w-4" />
            <span>查看跟團者 ({voters.length} 人)</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-out ${isExpanded ? "max-h-64" : "max-h-0"
              }`}
          >
            <div className="border-t border-border/20 bg-muted/20 px-4 py-3">
              {voters.map((voter, idx) => (
                <div
                  key={`${voter.name}-${idx}`}
                  className="flex items-center justify-between py-1.5 text-sm"
                >
                  <span className="text-foreground/80">• {voter.name}</span>
                  <span className="font-semibold text-foreground">
                    x{voter.qty}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
