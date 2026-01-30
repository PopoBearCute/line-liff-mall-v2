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
}

interface OrderSummaryDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    products: Product[];
    onRemoveVoter?: (productName: string, voterName: string, voterUserId?: string) => void;
}

export function OrderSummaryDrawer({ open, onOpenChange, products, onRemoveVoter }: OrderSummaryDrawerProps) {
    const [copied, setCopied] = useState(false);

    // Filter out products with 0 votes to keep the summary clean
    const activeProducts = products.filter(p => {
        const total = p.voters?.reduce((acc, v) => acc + (Number(v.qty) || 0), 0) || 0;
        return total > 0;
    });

    const generateText = () => {
        const date = new Date().toLocaleDateString('zh-TW');
        let text = `【團購統計報告】\n${date}\n\n`;

        if (activeProducts.length === 0) {
            text += "目前尚無登記紀錄。";
            return text;
        }

        activeProducts.forEach(p => {
            const total = p.voters?.reduce((acc, v) => acc + (Number(v.qty) || 0), 0) || 0;
            text += `${p.name} (總數: ${total})\n`;
            text += `單價: $${p.price}\n`;
            text += `------------------\n`;

            p.voters?.forEach(v => {
                if (v.qty > 0) {
                    text += `・${v.name}: +${v.qty}\n`;
                }
            });
            text += `\n`; // Spacer
        });

        return text;
    };

    const handleCopy = async () => {
        const text = generateText();
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success("已複製到剪貼簿！", { description: "請直接貼上到 LINE 群組" });
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Copy failed", err);
            toast.error("複製失敗", { description: "請手動選取文字複製" });
        }
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[85vh]">
                <DrawerHeader>
                    <DrawerTitle className="flex items-center justify-center gap-2 text-xl font-bold">
                        <ClipboardList className="w-6 h-6 text-primary-blue" />
                        團購統計明細
                    </DrawerTitle>
                </DrawerHeader>

                <div className="px-4 pb-4 flex-1 overflow-hidden flex flex-col">
                    {activeProducts.length === 0 ? (
                        <div className="py-10 text-center text-gray-500">
                            目前還沒有人登記哦！
                        </div>
                    ) : (
                        <ScrollArea className="flex-1 -mx-4 px-4">
                            <div className="space-y-6 pb-20">
                                {activeProducts.map((p, idx) => {
                                    const total = p.voters?.reduce((acc, v) => acc + (Number(v.qty) || 0), 0) || 0;
                                    return (
                                        <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <div className="flex justify-between items-baseline mb-3 border-b border-gray-200 pb-2">
                                                <h3 className="font-bold text-gray-900">{p.name}</h3>
                                                <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-sm">
                                                    x{total}
                                                </span>
                                            </div>
                                            <div className="space-y-2">
                                                {p.voters?.map((v, vIdx) => (
                                                    <div key={vIdx} className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-600 flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block"></span>
                                                            <span className="font-medium text-gray-900">{v.name}</span>
                                                        </span>

                                                        <div className="flex items-center gap-3">
                                                            <span className="font-medium text-gray-900">+{v.qty}</span>
                                                            {onRemoveVoter && (
                                                                <button
                                                                    onClick={() => onRemoveVoter(p.name, v.name, v.userId)}
                                                                    className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                                    title="刪除此紀錄"
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
                        className="w-full h-12 text-base font-bold bg-gray-900 hover:bg-black text-white shadow-lg active:scale-[0.98] transition-all"
                    >
                        {copied ? (
                            <>
                                <Check className="w-5 h-5 mr-2" />
                                已複製
                            </>
                        ) : (
                            <>
                                <Copy className="w-5 h-5 mr-2" />
                                一鍵複製明細文字
                            </>
                        )}
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
