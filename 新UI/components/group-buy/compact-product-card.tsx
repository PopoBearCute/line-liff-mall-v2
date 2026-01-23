"use client";

import { Minus, Plus, Users, ChevronDown, ChevronUp } from "lucide-react";
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

interface CompactProductCardProps {
  product: Product;
  quantity: number;
  voters: Voter[];
  isExpanded: boolean;
  onToggleVoters: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
}

export function CompactProductCard({
  product,
  quantity,
  voters,
  isExpanded,
  onToggleVoters,
  onIncrease,
  onDecrease,
}: CompactProductCardProps) {
  const hasVoters = voters.length > 0;

  return (
    <div className="glass-card card-hover flex flex-col rounded-2xl overflow-hidden">
      {/* Product Image - Square aspect ratio */}
      <div className="relative aspect-square w-full overflow-hidden">
        <Image
          src={product.img || "/placeholder.svg"}
          alt={product.name}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 50vw, 200px"
        />
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col p-3 pb-4">
        <h4 className="text-sm font-semibold leading-tight text-foreground line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h4>
        <p className="mt-1 text-lg font-black price-highlight">
          ${product.price}
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          門檻 {product.moq} 份
        </p>

        {/* Compact Quantity Control - Flex layout with safe spacing */}
        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onDecrease}
            onClick={onDecrease}
            className="qty-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-background/80 text-foreground disabled:opacity-40"
            aria-label="減少數量"
            data-action="decrease"
            data-product={product.name}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-[1.75rem] text-center text-base font-bold text-foreground">
            {quantity}
          </span>
          <button
            type="button"
            onClick={onIncrease}
            className="qty-btn qty-btn-plus flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
            aria-label="增加數量"
            data-action="increase"
            data-product={product.name}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Voters Accordion */}
      {hasVoters && (
        <>
          <button
            type="button"
            onClick={onToggleVoters}
            className="expand-btn flex w-full items-center justify-center gap-1.5 border-t border-border/30 bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground"
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
            <div className="border-t border-border/20 bg-muted/20 px-3 py-2">
              {voters.map((voter, idx) => (
                <div
                  key={`${voter.name}-${idx}`}
                  className="flex items-center justify-between py-1 text-xs"
                >
                  <span className="text-foreground/80">{voter.name}</span>
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
