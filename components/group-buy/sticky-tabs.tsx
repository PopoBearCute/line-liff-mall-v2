import { motion } from "framer-motion";
import { Flame, MessageCircleHeart, Shield } from "lucide-react";

interface StickyTabsProps {
    activeTab: number;
    onTabChange: (index: number) => void;
    isLeader?: boolean;
}

export function StickyTabs({ activeTab, onTabChange, isLeader }: StickyTabsProps) {
    const tabs = [
        { name: "熱銷開賣", icon: Flame },
        { name: "許願登記", icon: MessageCircleHeart },
        ...(isLeader ? [{ name: "團主管理", icon: Shield }] : []),
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 pb-safe-area-bottom">
            <div className="flex justify-around items-center h-[60px]">
                {tabs.map((tab, index) => {
                    const isActive = activeTab === index;
                    const Icon = tab.icon;

                    return (
                        <button
                            key={index}
                            onClick={() => onTabChange(index)}
                            className={`relative flex-1 h-full flex flex-col items-center justify-center gap-1 transition-colors ${isActive ? "text-gray-900" : "text-gray-400"
                                }`}
                        >
                            <div className="relative">
                                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabDot"
                                        className={`absolute -top-1 -right-1 w-2 h-2 ${index === 2 ? "bg-blue-500" : "bg-red-500"} rounded-full`}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                            </div>
                            <span className="text-[10px] font-medium">{tab.name}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
