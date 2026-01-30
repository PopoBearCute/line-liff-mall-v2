"use client";

export function ProductSkeleton() {
    return (
        <div className="rounded-2xl overflow-hidden bg-white/50 border border-white/20 shadow-sm relative isolate">
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent z-10" />

            {/* Image container skeleton */}
            <div className="relative aspect-[16/10] w-full bg-gray-200/50" />

            {/* Content skeleton */}
            <div className="flex items-start justify-between gap-4 px-4 py-6">
                {/* Left: Text Skeleton */}
                <div className="flex-1 space-y-3">
                    {/* Title */}
                    <div className="h-5 w-3/4 rounded-md bg-gray-200/80" />
                    <div className="h-5 w-1/2 rounded-md bg-gray-200/80" />

                    {/* Description */}
                    <div className="h-3 w-full rounded-md bg-gray-100/80 mt-2" />

                    {/* Price area */}
                    <div className="mt-4 flex items-baseline gap-2">
                        <div className="h-3 w-12 rounded bg-gray-200" /> {/* Orig price */}
                        <div className="h-6 w-16 rounded-md bg-gray-300" /> {/* Main price */}
                    </div>
                </div>

                {/* Right: Button Skeleton */}
                <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-xl bg-gray-200" />
                        <div className="h-6 w-6 rounded bg-gray-100" />
                        <div className="h-10 w-10 rounded-xl bg-gray-200" />
                    </div>
                    <div className="h-3 w-20 rounded bg-gray-100 mt-2" />
                </div>
            </div>
        </div>
    );
}
