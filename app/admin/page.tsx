"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { BatchPaste } from "@/components/admin/batch-paste";
import { ProductForm } from "@/components/admin/product-form";
import { Loader2, Trash2, Edit, Plus } from "lucide-react";
import Link from 'next/link';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface Product {
    // id: number; // Removed as determined by debug script
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

    // Edit/Add Modal State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [originalKey, setOriginalKey] = useState<{ wave: number, name: string } | null>(null);

    // 1. PIN Auth
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'login', pin }),
            });
            const data = await res.json();

            if (data.success) {
                setIsAuthenticated(true);
                fetchProducts();
            } else {
                toast.error(data.error || "密碼錯誤");
            }
        } catch (err) {
            toast.error("驗證失敗");
        }
    };

    // 2. Fetch Products via API (all Supabase operations now go through /api/admin)
    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'list', pin }),
            });
            const data = await res.json();

            if (data.success) {
                setProducts((data.products as Product[]) || []);
            } else {
                toast.error("讀取失敗: " + (data.error || "未知錯誤"));
            }
        } catch (err) {
            toast.error("讀取失敗");
        }
        setIsLoading(false);
    };

    // 3. Batch Import
    const handleBatchImport = async (parsedItems: { wave: number; name: string; origPrice: number; price: number; moq: number; img: string; desc: string; link: string; wishStart: string; wishEnd: string; saleStart: string; saleEnd: string }[]) => {
        setIsLoading(true);
        try {
            // Helper to parse date string to ISO or null
            const toIso = (val: string) => {
                if (!val) return null;
                const d = new Date(val);
                return isNaN(d.getTime()) ? null : d.toISOString();
            };

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
                "選品開始時間": toIso(p.wishStart),
                "選品結束時間": toIso(p.wishEnd),
                "販售開始時間": toIso(p.saleStart),
                "販售結束時間": toIso(p.saleEnd)
            }));

            // API Call
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'batch_insert',
                    pin,
                    payload: { rows }
                }),
            });
            const resData = await res.json();

            if (!resData.success) throw new Error(resData.error);

            toast.success(`成功匯入 ${rows.length} 筆商品！`);
            setMode('list');
            fetchProducts();

        } catch (err: any) {
            toast.error("匯入失敗: " + err.message);
        }
        setIsLoading(false);
    };

    // 4. Delete
    const handleDelete = async (waveId: number, name: string) => {
        if (!confirm(`確定要刪除 [${name}] 嗎？`)) return;

        try {
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete',
                    pin,
                    payload: { filter: { 'WaveID': waveId, '商品名稱': name } }
                }),
            });
            const data = await res.json();

            if (!data.success) throw new Error(data.error);

            toast.success("已刪除");
            setProducts(prev => prev.filter(p => !(p.WaveID === waveId && p["商品名稱"] === name)));
        } catch (err: any) {
            toast.error("刪除失敗: " + err.message);
        }
    };

    // 5. Open Add Dialog
    const handleOpenAdd = () => {
        setEditingProduct(null);
        setOriginalKey(null);
        setIsDialogOpen(true);
    };

    // 6. Open Edit Dialog
    const handleOpenEdit = (product: Product) => {
        setEditingProduct(product);
        setOriginalKey({ wave: product.WaveID, name: product["商品名稱"] });
        setIsDialogOpen(true);
    };

    // 7. Save Product (Add or Edit)
    const handleSaveProduct = async (formData: any) => {
        // Prepare data
        const payload = {
            "WaveID": formData.WaveID,
            "商品名稱": formData["商品名稱"],
            "原價": formData["原價"],
            "團購價": formData["團購價"],
            "MOQ": formData["MOQ"],
            "圖片網址": formData["圖片網址"],
            "商品描述": formData["商品描述"],
            "商城連結": formData["商城連結"],
            // Use form data dates if present, otherwise fallback (or empty if user cleared them)
            "選品開始時間": formData["選品開始時間"] ? new Date(formData["選品開始時間"]).toISOString() : null,
            "選品結束時間": formData["選品結束時間"] ? new Date(formData["選品結束時間"]).toISOString() : null,
            "販售開始時間": formData["販售開始時間"] ? new Date(formData["販售開始時間"]).toISOString() : null,
            "販售結束時間": formData["販售結束時間"] ? new Date(formData["販售結束時間"]).toISOString() : null,
        };

        try {
            if (originalKey) {
                // UPDATE
                const keyChanged = (originalKey.wave !== payload.WaveID || originalKey.name !== payload["商品名稱"]);

                if (keyChanged) {
                    // Key changed: Calls 'replace' action
                    const res = await fetch('/api/admin', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'replace',
                            pin,
                            payload: {
                                oldFilter: { 'WaveID': originalKey.wave, '商品名稱': originalKey.name },
                                newData: payload
                            }
                        }),
                    });
                    const data = await res.json();
                    if (!data.success) throw new Error(data.error);

                } else {
                    // Key same: Simple update
                    const res = await fetch('/api/admin', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'update',
                            pin,
                            payload: {
                                filter: { 'WaveID': originalKey.wave, '商品名稱': originalKey.name },
                                data: payload
                            }
                        }),
                    });
                    const data = await res.json();
                    if (!data.success) throw new Error(data.error);
                }
                toast.success("更新成功");

            } else {
                // CREATE
                const res = await fetch('/api/admin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'create',
                        pin,
                        payload: payload
                    }),
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error);

                toast.success("新增成功");
            }

            setIsDialogOpen(false);
            fetchProducts(); // Refresh

        } catch (err) {
            console.error(err);
            const errorMsg = err instanceof Error ? err.message : String(err);
            toast.error("儲存失敗: " + errorMsg);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm space-y-4">
                    <h1 className="text-xl font-bold text-center">後台管理登入</h1>
                    <Input
                        type="password"
                        placeholder="請輸入管理 PIN 碼"
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
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700">
                                        <Plus className="w-4 h-4 mr-1" />
                                        新增單筆
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={fetchProducts}>
                                        {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "重新整理"}
                                    </Button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead className="bg-gray-100 text-gray-600">
                                        <tr>
                                            <th className="p-3 border-b">波段</th>
                                            <th className="p-3 border-b">圖片</th>
                                            <th className="p-3 border-b w-[30%]">名稱</th>
                                            <th className="p-3 border-b">團購價</th>
                                            <th className="p-3 border-b">MOQ</th>
                                            <th className="p-3 border-b text-right">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map((p, idx) => (
                                            <tr key={`${p.WaveID}_${p["商品名稱"]}_${idx}`} className="hover:bg-gray-50 group border-b last:border-0">
                                                <td className="p-3">{p.WaveID}</td>
                                                <td className="p-3">
                                                    {p["圖片網址"] && (
                                                        <img src={p["圖片網址"]} className="w-10 h-10 object-cover rounded bg-gray-100" />
                                                    )}
                                                </td>
                                                <td className="p-3 font-medium">{p["商品名稱"]}</td>
                                                <td className="p-3 text-red-600 font-bold">${p["團購價"]}</td>
                                                <td className="p-3">{p.MOQ}</td>
                                                <td className="p-3 text-right whitespace-nowrap">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-blue-400 hover:text-blue-700 hover:bg-blue-50 mr-1"
                                                        onClick={() => handleOpenEdit(p)}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-red-400 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDelete(p.WaveID, p["商品名稱"])}
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

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? "編輯商品" : "新增商品"}</DialogTitle>
                    </DialogHeader>
                    <ProductForm
                        initialData={editingProduct}
                        onSave={handleSaveProduct}
                        onCancel={() => setIsDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
