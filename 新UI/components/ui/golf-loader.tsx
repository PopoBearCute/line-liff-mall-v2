"use client";

import { useEffect, useRef, useState } from "react";
import { Flag } from "lucide-react";

const GRAVITY = 0.5;
const BOUNCE_DAMPING = 0.55;
const FRICTION = 0.985;
const BALL_SIZE = 48;
const HOLE_SIZE = 60;
const GROUND_HEIGHT = 100;
const SLOPE_FORCE = 0.8; // How much hills "push" the ball horizontally

// Generate simple hills for terrain
function generateHills(width: number): { x: number; height: number }[] {
    const hills = [];
    const numHills = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numHills; i++) {
        hills.push({
            x: (width / numHills) * i + Math.random() * 50,
            height: 30 + Math.random() * 50 // Increased height for more impact
        });
    }
    return hills;
}

export function GolfBallLoader() {
    const ballRef = useRef<HTMLDivElement>(null);
    const [holeX, setHoleX] = useState(100);
    const [isSuccess, setIsSuccess] = useState(false);
    const [hills, setHills] = useState<{ x: number; height: number }[]>([]);
    const initRef = useRef(false);

    const physicsRef = useRef({
        x: 100,
        y: -100,
        vx: 0,
        vy: 0,
        rotation: 0,
        isResting: false,
    });

    const getGroundLevel = (x: number) => {
        if (typeof window === "undefined") return 0;
        let baseGround = window.innerHeight - GROUND_HEIGHT;
        // Apply hill offset based on x position
        for (const hill of hills) {
            const dist = Math.abs(x - hill.x);
            if (dist < 100) { // Slightly wider hills for smoother slopes
                // Smooth hill shape using cosine
                baseGround -= hill.height * Math.cos((dist / 100) * (Math.PI / 2));
            }
        }
        return baseGround;
    };

    const getSlope = (x: number) => {
        const y1 = getGroundLevel(x - 2);
        const y2 = getGroundLevel(x + 2);
        return (y2 - y1) / 4;
    };

    useEffect(() => {
        if (typeof window === "undefined" || initRef.current) return;
        initRef.current = true;

        const width = window.innerWidth;
        setHills(generateHills(width));
        setHoleX(Math.random() * (width - HOLE_SIZE - 40) + 20);

        // Initial ball position
        physicsRef.current = {
            x: Math.random() * (width - BALL_SIZE),
            y: -BALL_SIZE * 2,
            vx: (Math.random() - 0.5) * 15, // Faster initial speed
            vy: 0,
            rotation: 0,
            isResting: false,
        };
    }, []);

    useEffect(() => {
        if (hills.length === 0) return;

        let animationFrameId: number;
        let restFrames = 0;

        const update = () => {
            const state = physicsRef.current;
            const { innerWidth } = window;

            if (isSuccess) {
                animationFrameId = requestAnimationFrame(update);
                return;
            }

            if (state.isResting) {
                restFrames++;
                if (restFrames > 120) {
                    // Respawn after 2 seconds of rest
                    state.x = Math.random() * (innerWidth - BALL_SIZE);
                    state.y = -BALL_SIZE * 2;
                    state.vx = (Math.random() - 0.5) * 15;
                    state.vy = 0;
                    state.isResting = false;
                    restFrames = 0;
                    setHills(generateHills(innerWidth));
                    setHoleX(Math.random() * (innerWidth - HOLE_SIZE - 40) + 20);
                }
                animationFrameId = requestAnimationFrame(update);
                return;
            }

            // Physics
            state.vy += GRAVITY;
            state.vx *= FRICTION;

            // Apply slope force when on or near the ground
            const groundY = getGroundLevel(state.x + BALL_SIZE / 2);
            if (state.y >= groundY - BALL_SIZE - 5) {
                const slope = getSlope(state.x + BALL_SIZE / 2);
                state.vx -= slope * SLOPE_FORCE; // Pushes ball away from high points
            }

            state.x += state.vx;
            state.y += state.vy;
            state.rotation += state.vx * 3;

            // Walls
            if (state.x <= 0) { state.x = 0; state.vx = -state.vx * 0.7; }
            if (state.x >= innerWidth - BALL_SIZE) { state.x = innerWidth - BALL_SIZE; state.vx = -state.vx * 0.7; }

            // Final ground constraint
            if (state.y >= groundY - BALL_SIZE) {
                const ballCenter = state.x + BALL_SIZE / 2;
                const holeCenter = holeX + HOLE_SIZE / 2;
                const speed = Math.sqrt(state.vx * state.vx + state.vy * state.vy);

                if (Math.abs(ballCenter - holeCenter) < HOLE_SIZE * 0.5 && speed < 12) {
                    setIsSuccess(true);
                    if (ballRef.current) {
                        ballRef.current.style.transition = "all 0.5s ease";
                        ballRef.current.style.transform = `translate(${holeX + (HOLE_SIZE - BALL_SIZE) / 2}px, ${groundY + 20}px) scale(0.3)`;
                        ballRef.current.style.opacity = "0";
                    }
                    setTimeout(() => {
                        setIsSuccess(false);
                        state.x = Math.random() * (innerWidth - BALL_SIZE);
                        state.y = -BALL_SIZE * 2;
                        state.vx = (Math.random() - 0.5) * 15;
                        state.vy = 0;
                        state.isResting = false;
                        setHills(generateHills(innerWidth));
                        setHoleX(Math.random() * (innerWidth - HOLE_SIZE - 40) + 20);
                        if (ballRef.current) {
                            ballRef.current.style.transition = "none";
                            ballRef.current.style.opacity = "1";
                        }
                    }, 1500);
                    return;
                }

                state.y = groundY - BALL_SIZE;
                if (state.vy > 1) {
                    state.vy = -state.vy * BOUNCE_DAMPING;
                } else {
                    state.vy = 0;
                    if (Math.abs(state.vx) < 0.2) {
                        state.isResting = true;
                    }
                }
            }

            if (ballRef.current && !isSuccess) {
                ballRef.current.style.transform = `translate(${state.x}px, ${state.y}px) rotate(${state.rotation}deg)`;
            }

            animationFrameId = requestAnimationFrame(update);
        };

        animationFrameId = requestAnimationFrame(update);
        return () => cancelAnimationFrame(animationFrameId);
    }, [hills, holeX, isSuccess]);

    // Generate SVG path for hilly ground
    const groundPath = () => {
        if (typeof window === "undefined" || hills.length === 0) return "";
        const width = window.innerWidth;
        const height = window.innerHeight;
        let path = `M0,${height}`;
        for (let x = 0; x <= width; x += 5) { // More segments for smoother visuals
            const y = getGroundLevel(x);
            path += ` L${x},${y}`;
        }
        path += ` L${width},${height} Z`;
        return path;
    };

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-auto bg-gradient-to-b from-sky-200 to-sky-100 overflow-hidden font-sans">
            {/* Status */}
            <div className="absolute top-10 left-0 right-0 text-center">
                <h2 className="text-2xl font-bold text-gray-800 animate-pulse">載入中...</h2>
                {isSuccess && (
                    <div className="mt-4 animate-bounce">
                        <span className="text-4xl font-black text-green-600 drop-shadow-lg">NICE SHOT! ⛳</span>
                    </div>
                )}
            </div>

            {/* Hilly Ground SVG */}
            <svg className="absolute bottom-0 left-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="grassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#4ade80' }} />
                        <stop offset="100%" style={{ stopColor: '#16a34a' }} />
                    </linearGradient>
                </defs>
                <path d={groundPath()} fill="url(#grassGradient)" />
            </svg>

            {/* Hole */}
            <div
                className="absolute h-[20px] bg-slate-900 rounded-[100%] border-b-2 border-white/20"
                style={{
                    left: holeX,
                    width: HOLE_SIZE,
                    bottom: GROUND_HEIGHT - (getGroundLevel(holeX + HOLE_SIZE / 2) - (typeof window !== "undefined" ? window.innerHeight - GROUND_HEIGHT : 0)) + 5,
                    boxShadow: 'inset 0 5px 15px rgba(0,0,0,0.9)'
                }}
            >
                <Flag className="absolute -top-10 left-1/2 -translate-x-1/2 text-red-600 fill-red-600 h-10 w-10 drop-shadow-md" />
            </div>

            {/* Ball - Using CPC Brand Colors */}
            <div
                ref={ballRef}
                className="absolute top-0 left-0 z-20"
                style={{ width: BALL_SIZE, height: BALL_SIZE, willChange: 'transform' }}
            >
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
                    <circle cx="50" cy="50" r="48" fill="#005EB8" stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="35" cy="35" r="10" fill="rgba(255,255,255,0.3)" />
                    <text x="50" y="62" textAnchor="middle" fontSize="32" fontWeight="900" fill="#FFFFFF" fontFamily="sans-serif">CPC</text>
                </svg>
            </div>
        </div>
    );
}
