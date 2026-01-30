"use client";

import { useState } from "react";
import { ProductCard } from "./product-card";

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

interface ProductListProps {
  products: Product[];
  cart: Record<string, number>;
  voters: Record<string, Voter[]>;
  onQuantityChange: (productName: string, delta: number) => void;
  isLoading: boolean;
}

export function ProductList({
  products,
  cart,
  voters,
  onQuantityChange,
  isLoading,
}: ProductListProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});

  const toggleVoters = (index: number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  if (isLoading) {
    return (
      <section className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex gap-4 rounded-2xl border border-border bg-card p-3 animate-pulse"
          >
            <div className="h-24 w-24 rounded-xl bg-muted" />
            <div className="flex-1 space-y-3 py-1">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-5 w-1/4 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
          </div>
        ))}
      </section>
    );
  }

  return (
    <section className="space-y-3">
      {products.map((product, index) => (
        <ProductCard
          key={product.name}
          product={product}
          quantity={cart[product.name] || 0}
          voters={voters[product.name] || []}
          isExpanded={expandedItems[index] || false}
          onToggleVoters={() => toggleVoters(index)}
          onIncrease={() => onQuantityChange(product.name, 1)}
          onDecrease={() => onQuantityChange(product.name, -1)}
        />
      ))}
    </section>
  );
}
