"use client";

import { IGFeedCard } from "./ig-feed-card";
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
    buyerAvatars?: string[];
    endDate?: string;
    waveId?: string; // Add Wave ID
}

interface Voter {
    name: string;
    qty: number;
    userId?: string;
}

interface IGProductFeedProps {
    products: Product[];
    mode: 'active' | 'collecting' | 'preparing';
    cart: Record<string, number>;
    voters: Record<string, Voter[]>;
    onQuantityChange: (productName: string, delta: number) => void;
    isLoading?: boolean;
    isLeader?: boolean;
    onRemoveVoter?: (productName: string, voterName: string, userId?: string) => void;
    onJoin?: (productName: string) => void;
    leaderName?: string;
    leaderAvatar?: string;
    currentUserId?: string;
    onSingleSubmit?: (productName: string) => void;
    submittingProduct?: string | null;
    onEnableProduct?: (productName: string, isEnabled?: boolean, waveId?: string) => void;
    onShare?: (product: Product) => void;
}

export function IGProductFeed({
    products,
    mode,
    cart,
    voters,
    onQuantityChange,
    isLoading,
    isLeader,
    onRemoveVoter,
    onJoin,
    leaderName,
    leaderAvatar,
    currentUserId,
    onSingleSubmit,
    submittingProduct,
    onEnableProduct,
    onShare
}: IGProductFeedProps) {

    if (isLoading) {
        return (
            <div className="space-y-4 pb-20">
                {[1, 2, 3].map((i) => (
                    <ProductSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-6 mx-4 mt-8 rounded-2xl bg-white/20 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/30 text-white text-center">
                <p className="font-bold text-xl mb-2 drop-shadow-sm">團長補貨中...</p>
                <p className="text-sm text-white/90 drop-shadow-sm">超值精選好物即將上架，敬請期待！</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto pb-24 space-y-4">
            {products.map((product) => {
                const productVoters = voters[product.name] || [];
                const currentQty = cart[product.name] || 0;

                return (
                    <IGFeedCard
                        key={product.name}
                        product={product}
                        mode={mode}
                        voters={productVoters}
                        cartQty={currentQty}
                        isLeader={isLeader}
                        leaderName={leaderName}
                        leaderAvatar={leaderAvatar}
                        currentUserId={currentUserId}
                        onJoin={() => onQuantityChange(product.name, 1)}
                        onAdd={() => onQuantityChange(product.name, 1)}
                        onRemove={() => onQuantityChange(product.name, -1)}
                        onSubmit={onSingleSubmit ? () => onSingleSubmit(product.name) : undefined}
                        isSubmitting={submittingProduct === product.name}
                        onEnableProduct={onEnableProduct ? () => onEnableProduct(product.name, product.isEnabled, product.waveId) : undefined}
                        onShare={onShare}
                    />
                );
            })}
        </div>
    );
}
