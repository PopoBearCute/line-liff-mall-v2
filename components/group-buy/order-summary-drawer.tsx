"use client";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, ClipboardList, Check, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Voter {
    name: string;
    qty: number;
    userId?: string;
}

interface Product {
    name: string;
    price: number | string;
    voters?: Voter[];
    mode?: 'active' | 'collecting';
}

interface OrderSummaryDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    products: Product[];
    onRemoveVoter?: (productName: string, voterName: string, voterUserId?: string) => void;
}

export function OrderSummaryDrawer({ open, onOpenChange, products, onRemoveVoter }: OrderSummaryDrawerProps) {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'collecting'>('collecting');

    // Filter items based on selected tab and whether they have votes
    const filteredProducts = products.filter(p => {
        const isCorrectMode = p.mode === activeTab;
        const hasVotes = (p.voters?.reduce((acc, v) => acc + (Number(v.qty) || 0), 0) || 0) > 0;
        return isCorrectMode && hasVotes;
    });

    const generateText = () => {
        const date = new Date().toLocaleDateString('zh-TW');
        const modeTitle = activeTab === 'active' ? "熱銷中" : "許願登記";
        let text = `【${modeTitle} 統計報告】\n${date}\n\n`;

        if (filteredProducts.length === 0) {
            text += "目前尚無登記紀錄。";
            return text;
        }

        filteredProducts.forEach(p => {
            const total = p.voters?.reduce((acc, v) => acc + (Number(v.qty) || 0), 0) || 0;
            text += `${p.name} (共 ${total} 份)\n`;
            text += `單價: $${p.price}\n`;
            text += `------------------\n`;

            p.voters?.forEach(v => {
                if (v.qty > 0) {
                    text += `・${v.name}: +${v.qty}\n`;
                }
            });
            text += `\n`;
        });

        return text;
    };

    const handleCopy = async () => {
        const text = generateText();
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success("已複製成功！", { description: "快去 LINE 群組貼上吧" });
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Copy failed", err);
            toast.error("複製失敗");
        }
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[85vh] bg-white">
                <DrawerHeader className="pb-2">
                    <DrawerTitle className="flex items-center justify-center gap-2 text-xl font-bold">
                        <ClipboardList className="w-6 h-6 text-primary-blue" />
                        大家登記的明細
                    </DrawerTitle>
                </DrawerHeader>

                {/* Tabs Layer */}
                <div className="px-4 mb-4">
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('collecting')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'collecting' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}
                        >
                            🔥 許願登記中
                        </button>
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'active' ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500"}`}
                        >
                            🛍️ 熱銷開賣中
                        </button>
                    </div>
                </div>

                <div className="px-4 pb-4 flex-1 overflow-hidden flex flex-col">
                    {filteredProducts.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-10 text-gray-400">
                            <ClipboardList className="w-12 h-12 mb-2 opacity-20" />
                            <p>這個分頁暫時沒人登記哦</p>
                        </div>
                    ) : (
                        <ScrollArea className="flex-1 -mx-4 px-4">
                            <div className="space-y-4 pb-20">
                                {filteredProducts.map((p, idx) => {
                                    const total = p.voters?.reduce((acc, v) => acc + (Number(v.qty) || 0), 0) || 0;
                                    return (
                                        <div key={idx} className={`rounded-xl p-4 border ${activeTab === 'active' ? 'bg-emerald-50/30 border-emerald-100' : 'bg-blue-50/30 border-blue-100'}`}>
                                            <div className="flex justify-between items-baseline mb-3 border-b border-gray-100 pb-2">
                                                <h3 className="font-bold text-gray-900">{p.name}</h3>
                                                <span className={`font-bold px-2 py-0.5 rounded-full text-sm ${activeTab === 'active' ? 'text-emerald-600 bg-emerald-50' : 'text-blue-600 bg-blue-50'}`}>
                                                    x{total}
                                                </span>
                                            </div>
                                            <div className="space-y-2">
                                                {p.voters?.map((v, vIdx) => (
                                                    <div key={vIdx} className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-600 flex items-center gap-2">
                                                            <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'active' ? 'bg-emerald-300' : 'bg-blue-300'}`}></span>
                                                            <span className="font-medium text-gray-900">{v.name}</span>
                                                        </span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-medium text-gray-900">+{v.qty}</span>
                                                            {onRemoveVoter && (
                                                                <button
                                                                    onClick={() => onRemoveVoter(p.name, v.name, v.userId)}
                                                                    className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                <div className="p-4 border-t bg-white">
                    <Button
                        onClick={handleCopy}
                        className={`w-full h-14 text-base font-bold shadow-lg active:scale-[0.98] transition-all rounded-2xl ${activeTab === 'active'
                                ? 'bg-emerald-600 hover:bg-emerald-700'
                                : 'bg-blue-600 hover:bg-blue-700'
                            } text-white`}
                    >
                        {copied ? (
                            <>
                                <Check className="w-6 h-6 mr-2" />
                                已複製，快去 LINE 貼上吧！
                            </>
                        ) : (
                            <>
                                <Copy className="w-5 h-5 mr-2" />
                                一鍵複製【{activeTab === 'active' ? '開賣中' : '登記中'}】名單
                            </>
                        )}
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
