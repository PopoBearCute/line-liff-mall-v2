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

interface ProductCardProps {
  product: Product;
  quantity: number;
  voters: Voter[];
  isExpanded: boolean;
  onToggleVoters: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
}

export function ProductCard({
  product,
  quantity,
  voters,
  isExpanded,
  onToggleVoters,
  onIncrease,
  onDecrease,
}: ProductCardProps) {
  const hasVoters = voters.length > 0;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex gap-3 p-3">
        {/* Product Image - 1:1 aspect ratio */}
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
          <Image
            src={product.img || "/placeholder.svg"}
            alt={product.name}
            fill
            className="object-contain"
            sizes="96px"
          />
        </div>

        {/* Product Info */}
        <div className="flex flex-1 flex-col justify-between py-0.5">
          <div>
            <h4 className="line-clamp-2 text-[15px] font-semibold leading-tight text-card-foreground">
              {product.name}
            </h4>
            <p className="mt-1 text-lg font-bold text-accent">
              ${product.price}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {`成團門檻：${product.moq} 份`}
            </p>
          </div>

          {/* Quantity Control - Large touch targets (44x44px minimum) */}
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onDecrease}
              onClick={onDecrease}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-foreground transition-colors active:bg-muted disabled:opacity-40"
              aria-label="減少數量"
            >
              <Minus className="h-5 w-5" />
            </button>
            <span className="min-w-[2rem] text-center text-lg font-bold text-card-foreground">
              {quantity}
            </span>
            <button
              type="button"
              onClick={onIncrease}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors active:opacity-80"
              aria-label="增加數量"
            >
              <Plus className="h-5 w-5" />
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
            className="flex w-full items-center justify-center gap-2 border-t border-border bg-muted/50 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors active:bg-muted"
          >
            <Users className="h-4 w-4" />
            <span>{`查看跟團者 (${voters.length} 人)`}</span>
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
            <div className="border-t border-border bg-muted/30 px-4 py-3">
              {voters.map((voter, idx) => (
                <div
                  key={`${voter.name}-${idx}`}
                  className="flex items-center justify-between py-1.5 text-sm"
                >
                  <span className="text-card-foreground">{`• ${voter.name}`}</span>
                  <span className="font-medium text-muted-foreground">
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
