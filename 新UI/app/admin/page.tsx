"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { BatchPaste } from "@/components/admin/batch-paste";
import { Loader2, Trash2 } from "lucide-react";
import Link from 'next/link';

// Client-side Supabase for Admin (should use env but hardcoded for now as per page.tsx)
const supabaseUrl = 'https://icrmiwopkmfzbryykwli.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || 'sb_publishable_9tQYpbr0kHS2i9kSbgedjA_mzcJIn2y';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Product {
    id: number;
    "WaveID": number;
    "商品名稱": string;
    "原價": number;
    "團購價": number;
    "MOQ": number;
    "圖片網址": string;
    "商品描述": string;
    "商城連結": string;
    "販售開始時間"?: string;
    "販售結束時間"?: string;
}

export default function AdminPage() {
    const [pin, setPin] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<'list' | 'batch'>('list');

    // 1. PIN Auth
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin === "0920401419") {
            setIsAuthenticated(true);
            fetchProducts();
        } else {
            toast.error("密碼錯誤");
        }
    };

    // 2. Fetch Products
    const fetchProducts = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('id', { ascending: false }); // Newest first

        if (error) {
            toast.error("讀取失敗: " + error.message);
        } else {
            setProducts((data as any[]) || []);
        }
        setIsLoading(false);
    };

    // 3. Batch Import
    const handleBatchImport = async (parsedItems: any[]) => {
        setIsLoading(true);
        try {
            // Transform to Supabase Schema
            const rows = parsedItems.map(p => ({
                "WaveID": Number(p.wave),
                "商品名稱": p.name,
                "原價": p.origPrice,
                "團購價": p.price,
                "MOQ": p.moq,
                "圖片網址": p.img,
                "商品描述": p.desc,
                "商城連結": p.link,
                "選品開始時間": new Date().toISOString(), // Default now
                "選品結束時間": new Date(Date.now() + 7 * 86400000).toISOString() // Default +7 days
            }));

            const { error } = await supabase.from('products').insert(rows);

            if (error) throw error;

            toast.success(`成功匯入 ${rows.length} 筆商品！`);
            setMode('list');
            fetchProducts();

        } catch (err: any) {
            toast.error("匯入失敗: " + err.message);
        }
        setIsLoading(false);
    };

    // 4. Delete
    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`確定要刪除 [${name}] 嗎？`)) return;

        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) {
            toast.error("刪除失敗");
        } else {
            toast.success("已刪除");
            setProducts(prev => prev.filter(p => p.id !== id));
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm space-y-4">
                    <h1 className="text-xl font-bold text-center">後台管理登入</h1>
                    <Input
                        type="password"
                        placeholder="請輸入密碼 (8888)"
                        value={pin}
                        onChange={e => setPin(e.target.value)}
                        autoFocus
                    />
                    <Button type="submit" className="w-full">登入</Button>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-gray-500 hover:text-black">← 回首頁</Link>
                        <h1 className="text-xl font-bold">商品管理後台</h1>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={mode === 'list' ? "default" : "outline"}
                            onClick={() => setMode('list')}
                        >
                            商品列表
                        </Button>
                        <Button
                            variant={mode === 'batch' ? "default" : "outline"}
                            onClick={() => setMode('batch')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            大量貼上新增 (Batch Paste)
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl shadow-sm min-h-[500px] p-6">

                    {/* Mode: List */}
                    {mode === 'list' && (
                        <>
                            <div className="mb-4 flex justify-between items-center">
                                <span className="text-sm text-gray-500">共 {products.length} 筆商品</span>
                                <Button size="sm" variant="outline" onClick={fetchProducts}>
                                    {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "重新整理"}
                                </Button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead className="bg-gray-100 text-gray-600">
                                        <tr>
                                            <th className="p-3 border-b">ID</th>
                                            <th className="p-3 border-b">波段</th>
                                            <th className="p-3 border-b">圖片</th>
                                            <th className="p-3 border-b w-[30%]">名稱</th>
                                            <th className="p-3 border-b">團購價</th>
                                            <th className="p-3 border-b">MOQ</th>
                                            <th className="p-3 border-b text-right">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map(p => (
                                            <tr key={p.id} className="hover:bg-gray-50 group border-b last:border-0">
                                                <td className="p-3 text-gray-400">{p.id}</td>
                                                <td className="p-3">{p.WaveID}</td>
                                                <td className="p-3">
                                                    {p["圖片網址"] && (
                                                        <img src={p["圖片網址"]} className="w-10 h-10 object-cover rounded bg-gray-100" />
                                                    )}
                                                </td>
                                                <td className="p-3 font-medium">{p["商品名稱"]}</td>
                                                <td className="p-3 text-red-600 font-bold">${p["團購價"]}</td>
                                                <td className="p-3">{p.MOQ}</td>
                                                <td className="p-3 text-right">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-red-400 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDelete(p.id, p["商品名稱"])}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* Mode: Batch Paste */}
                    {mode === 'batch' && (
                        <div className="max-w-3xl mx-auto">
                            <BatchPaste onParsed={handleBatchImport} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
