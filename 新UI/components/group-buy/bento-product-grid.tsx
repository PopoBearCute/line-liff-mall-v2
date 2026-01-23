"use client";

import { useState } from "react";
import { FullWidthProductCard } from "./full-width-product-card";
import { ProductSkeleton } from "./product-skeleton";

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

interface Voter {
  name: string;
  qty: number;
  userId?: string;
}

interface BentoProductGridProps {
  products: Product[];
  cart: Record<string, number>;
  voters: Record<string, Voter[]>;
  onQuantityChange: (productName: string, delta: number) => void;
  isLoading?: boolean;
  isLeader?: boolean;
  onRemoveVoter?: (productName: string, voterName: string, userId?: string) => void;
  onEnableProduct?: (productName: string) => void;
  isEnabling?: boolean;
  showQuantityControls?: boolean;
}

export function BentoProductGrid({
  products,
  cart,
  voters,
  onQuantityChange,
  isLoading,
  isLeader,
  onRemoveVoter,
  onEnableProduct,
  isEnabling = false,
  showQuantityControls = true,
}: BentoProductGridProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});

  const toggleVoters = (index: number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  if (isLoading && products.length === 0) {
    return (
      <section id="product-list" className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <ProductSkeleton key={i} />
        ))}
      </section>
    );
  }

  return (
    <section id="product-list" className="space-y-4">
      {products.map((product, idx) => (
        <FullWidthProductCard
          key={product.name}
          product={product}
          quantity={cart[product.name] || 0}
          voters={voters[product.name] || []}
          isExpanded={expandedItems[idx] || false}
          onToggleVoters={() => toggleVoters(idx)}
          onIncrease={() => onQuantityChange(product.name, 1)}
          onDecrease={() => onQuantityChange(product.name, -1)}
          isFeatured={idx === 0}
          isLeader={isLeader}
          onRemoveVoter={onRemoveVoter}
          onEnableProduct={onEnableProduct}
          isEnabling={isEnabling}
          showQuantityControls={showQuantityControls}
        />
      ))}
    </section>
  );
}
