"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ProductFormData {
    WaveID: number;
    "商品名稱": string;
    "原價": number;
    "團購價": number;
    "MOQ": number;
    "圖片網址": string;
    "商品描述": string;
    "商城連結": string;
    "選品開始時間"?: string;
    "選品結束時間"?: string;
    "販售開始時間"?: string;
    "販售結束時間"?: string;
}

interface ProductFormProps {
    initialData?: ProductFormData | null;
    onSave: (data: ProductFormData) => void;
    onCancel: () => void;
}

export function ProductForm({ initialData, onSave, onCancel }: ProductFormProps) {
    const [formData, setFormData] = useState<ProductFormData>({
        WaveID: 1,
        "商品名稱": "",
        "原價": 0,
        "團購價": 0,
        "MOQ": 1,
        "圖片網址": "",
        "商品描述": "",
        "商城連結": "",
        "選品開始時間": "",
        "選品結束時間": "",
        "販售開始時間": "",
        "販售結束時間": "",
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleChange = (field: keyof ProductFormData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>波段 (WaveID)</Label>
                    <Input
                        type="number"
                        value={formData.WaveID}
                        onChange={e => handleChange("WaveID", Number(e.target.value))}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>MOQ (成團目標)</Label>
                    <Input
                        type="number"
                        value={formData.MOQ}
                        onChange={e => handleChange("MOQ", Number(e.target.value))}
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>商品名稱</Label>
                <Input
                    value={formData["商品名稱"]}
                    onChange={e => handleChange("商品名稱", e.target.value)}
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>原價 (顯示用)</Label>
                    <Input
                        type="number"
                        value={formData["原價"]}
                        onChange={e => handleChange("原價", Number(e.target.value))}
                    />
                </div>
                <div className="space-y-2">
                    <Label>團購價 (實際價格)</Label>
                    <Input
                        type="number"
                        value={formData["團購價"]}
                        onChange={e => handleChange("團購價", Number(e.target.value))}
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>圖片網址</Label>
                <div className="flex gap-2">
                    <Input
                        value={formData["圖片網址"]}
                        onChange={e => handleChange("圖片網址", e.target.value)}
                        placeholder="https://..."
                    />
                    {formData["圖片網址"] && (
                        <div className="w-10 h-10 rounded overflow-hidden border shrink-0">
                            <img src={formData["圖片網址"]} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <Label>商城連結 (選填)</Label>
                <Input
                    value={formData["商城連結"]}
                    onChange={e => handleChange("商城連結", e.target.value)}
                    placeholder="https://..."
                />
            </div>

            <div className="space-y-2">
                <Label>商品描述</Label>
                <Textarea
                    value={formData["商品描述"]}
                    onChange={e => handleChange("商品描述", e.target.value)}
                    rows={3}
                />
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="col-span-2 text-sm font-semibold text-gray-500">檔期設定 (選品/許願階段)</div>
                <div className="space-y-2">
                    <Label>選品開始時間</Label>
                    <Input
                        type="datetime-local"
                        value={formData["選品開始時間"]?.slice(0, 16) || ""}
                        onChange={e => handleChange("選品開始時間", e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>選品結束時間</Label>
                    <Input
                        type="datetime-local"
                        value={formData["選品結束時間"]?.slice(0, 16) || ""}
                        onChange={e => handleChange("選品結束時間", e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="col-span-2 text-sm font-semibold text-gray-500">檔期設定 (販售/開團階段)</div>
                <div className="space-y-2">
                    <Label>販售開始時間</Label>
                    <Input
                        type="datetime-local"
                        value={formData["販售開始時間"]?.slice(0, 16) || ""}
                        onChange={e => handleChange("販售開始時間", e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>販售結束時間</Label>
                    <Input
                        type="datetime-local"
                        value={formData["販售結束時間"]?.slice(0, 16) || ""}
                        onChange={e => handleChange("販售結束時間", e.target.value)}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>取消</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                    {initialData ? "儲存修改" : "新增商品"}
                </Button>
            </div>
        </form>
    );
}
