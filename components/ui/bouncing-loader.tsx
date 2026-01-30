"use client";

import { useEffect, useRef, useState } from "react";
import { ShoppingBag } from "lucide-react";

// Bright, vibrant colors for the "DVD" effect
const COLORS = [
    "text-red-500",
    "text-blue-500",
    "text-green-500",
    "text-yellow-500",
    "text-purple-500",
    "text-pink-500",
    "text-orange-500",
    "text-cyan-500",
];

export function BouncingLoader() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [colorIndex, setColorIndex] = useState(0);

    // Use refs for animation state to avoid re-renders causing jitter/logic issues in loop
    const stateRef = useRef({
        x: 0,
        y: 0,
        dx: 3, // slightly irregular speed to avoid perfect loops too quickly
        dy: 3,
        width: 60, // approximate icon width
        height: 60, // approximate icon height
    });

    useEffect(() => {
        // Initial random position to keep it fresh
        if (typeof window !== "undefined") {
            stateRef.current.x = Math.random() * (window.innerWidth - 100);
            stateRef.current.y = Math.random() * (window.innerHeight - 200);
        }

        let animationFrameId: number;

        const animate = () => {
            if (!containerRef.current) return;

            const { innerWidth, innerHeight } = window;
            const state = stateRef.current;

            // Update position
            state.x += state.dx;
            state.y += state.dy;

            // Bounce Logic (Horizontal)
            if (state.x + state.width >= innerWidth || state.x <= 0) {
                state.dx = -state.dx; // Reverse direction
                state.x = Math.max(0, Math.min(state.x, innerWidth - state.width)); // Clamp
                setColorIndex((prev) => (prev + 1) % COLORS.length); // Change color
            }

            // Bounce Logic (Vertical) - accounting for some bottom padding if needed
            // Assuming full screen loader
            if (state.y + state.height >= innerHeight || state.y <= 0) {
                state.dy = -state.dy; // Reverse direction
                state.y = Math.max(0, Math.min(state.y, innerHeight - state.height)); // Clamp
                setColorIndex((prev) => (prev + 1) % COLORS.length); // Change color
            }

            // Apply transform directly to DOM for max performance (bypass React render loop for position)
            if (containerRef.current) {
                containerRef.current.style.transform = `translate(${state.x}px, ${state.y}px)`;
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-auto bg-white/90 backdrop-blur-sm">
            {/* Logo Container */}
            <div
                ref={containerRef}
                className={`absolute top-0 left-0 transition-colors duration-300 ${COLORS[colorIndex]}`}
                style={{ width: '60px', height: '60px', willChange: 'transform' }}
            >
                <div className="flex flex-col items-center justify-center">
                    <ShoppingBag size={48} strokeWidth={2.5} />
                    <span className="text-xs font-bold mt-1 whitespace-nowrap opacity-80">
                        載入中...
                    </span>
                </div>
            </div>
        </div>
    );
}
