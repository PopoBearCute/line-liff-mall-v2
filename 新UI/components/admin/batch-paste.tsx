"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ParsedProduct {
    wave: string;
    name: string;
    origPrice: number;
    price: number;
    moq: number;
    img: string;
    desc: string;
    link: string;
}

interface BatchPasteProps {
    onParsed: (products: ParsedProduct[]) => void;
}

export function BatchPaste({ onParsed }: BatchPasteProps) {
    const [rawText, setRawText] = useState("");
    const [preview, setPreview] = useState<ParsedProduct[]>([]);

    const parseText = (text: string) => {
        const lines = text.trim().split('\n');
        const products: ParsedProduct[] = [];

        lines.forEach(line => {
            // Excel copy-paste is usually tab-separated
            const cols = line.split('\t').map(c => c.trim());
            if (cols.length < 2) return; // Skip empty rows

            // Assumed Format: 
            // Wave | Name | OrigPrice | Price | MOQ | Img | Desc | Link
            // Flexible fallback:
            const wave = cols[0] || "1";
            const name = cols[1] || "";
            const origPrice = Number(cols[2]) || 0;
            const price = Number(cols[3]) || 0;
            const moq = Number(cols[4]) || 1;
            const img = cols[5] || "";
            const desc = cols[6] || "";
            const link = cols[7] || "";

            if (name) {
                products.push({ wave, name, origPrice, price, moq, img, desc, link });
            }
        });

        setPreview(products);
    };

    const handlePaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setRawText(val);
        parseText(val);
    };

    return (
        <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-blue-800">
                <h3 className="font-bold mb-2">Excel 快速貼上區</h3>
                <p>請從 Excel 複製以下欄位順序 (至少要有前 2 欄)：</p>
                <div className="mt-2 font-mono text-xs bg-white p-2 border rounded">
                    波段ID | 商品名稱 | 原價 | 團購價 | MOQ | 圖片網址 | 描述 | 商城連結
                </div>
            </div>

            <Textarea
                placeholder="在此按 Ctrl+V 貼上..."
                className="min-h-[150px] font-mono text-xs"
                value={rawText}
                onChange={handlePaste}
            />

            {preview.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm text-gray-500">已解析 {preview.length} 筆資料：</p>
                    <div className="max-h-[200px] overflow-auto border rounded-md">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-gray-100 sticky top-0">
                                <tr>
                                    <th className="p-2">波段</th>
                                    <th className="p-2">名稱</th>
                                    <th className="p-2">價格</th>
                                    <th className="p-2">MOQ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {preview.map((p, i) => (
                                    <tr key={i} className="border-t">
                                        <td className="p-2">{p.wave}</td>
                                        <td className="p-2 truncate max-w-[150px]">{p.name}</td>
                                        <td className="p-2">${p.price}</td>
                                        <td className="p-2">{p.moq}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => onParsed(preview)}
                    >
                        確認匯入這 {preview.length} 筆資料
                    </Button>
                </div>
            )}
        </div>
    );
}
