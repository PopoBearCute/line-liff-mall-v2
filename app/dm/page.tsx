"use client";

import "./dm-print.css";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const API_URL = "/api/products";
const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || "2008798234-72bJqeYx";

interface Product {
    name: string;
    price: number | string;
    origPrice?: number;
    moq: number;
    img: string;
    description: string;
    endDate?: string;
}

interface ActiveWave {
    wave: string;
    phase: string;
    products: Product[];
}

function DMContent() {
    const searchParams = useSearchParams();
    const leaderId = searchParams.get("leaderId") || "";
    const [products, setProducts] = useState<Product[]>([]);
    const [leaderName, setLeaderName] = useState("團購主");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!leaderId) {
            setError("缺少團購主 ID，請從管理面板進入");
            setIsLoading(false);
            return;
        }
        fetchProducts();
    }, [leaderId]);

    const fetchProducts = async () => {
        try {
            const res = await fetch(`${API_URL}?leaderId=${leaderId}&userId=DM_PRINT&t=${Date.now()}`);
            const data = await res.json();

            if (data.success) {
                setLeaderName(data.leaderName || "團購主");
                const collectingProducts = (data.activeWaves || [])
                    .filter((w: ActiveWave) => w.phase === "collecting" || w.phase === "preparing")
                    .flatMap((w: ActiveWave) => w.products);
                setProducts(collectingProducts);
            } else {
                setError(data.error || "資料載入失敗");
            }
        } catch (err) {
            setError("無法連線至伺服器");
        } finally {
            setIsLoading(false);
        }
    };

    const storeUrl = `https://liff.line.me/${LIFF_ID}?leaderId=${leaderId}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(storeUrl)}`;

    const handlePrint = () => window.print();

    // Google Drive image handler
    const getDisplayImg = (src: string) => {
        if (!src) return "";
        if (src.includes("drive.google.com")) {
            const fileId = src.match(/[-\w]{25,}/)?.[0];
            if (fileId) return `https://lh3.googleusercontent.com/u/0/d/${fileId}=w400-h400-p-k-no-nu`;
        }
        return src;
    };

    if (isLoading) {
        return (
            <div className="dm-loading">
                <div className="dm-spinner" />
                <p>正在載入商品資料...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dm-loading">
                <p className="dm-error-title">⚠️ 錯誤</p>
                <p>{error}</p>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="dm-loading">
                <p className="dm-error-title">📭 目前沒有許願登記中的商品</p>
                <p>請先在管理後台新增商品</p>
            </div>
        );
    }

    return (
        <>
            {/* Print Control Bar — hidden when printing */}
            <div className="no-print dm-toolbar">
                <div>
                    <h1 className="dm-toolbar-title">📄 紙本 DM 預覽</h1>
                    <p className="dm-toolbar-sub">{leaderName} · {products.length} 件商品</p>
                </div>
                <button onClick={handlePrint} className="dm-toolbar-btn">
                    🖨️ 列印 / 存為 PDF
                </button>
            </div>

            {/* === Printable DM Flyer === */}
            <div className="dm-flyer">

                {/* Banner Header with QR */}
                <div className="dm-banner">
                    <div className="dm-banner-left">
                        <div className="dm-banner-title-row">
                            <img src="/mall-icon.png" alt="Logo" className="dm-banner-logo" />
                            <h1 className="dm-banner-title">行動商城團購優惠特報</h1>
                        </div>
                        <p className="dm-banner-leader">{leaderName} 為您嚴選</p>
                        <p className="dm-banner-cta">📱 用 LINE 掃描 QR Code 立即線上選購 →</p>
                    </div>
                    <div className="dm-banner-right">
                        <img src={qrCodeUrl} alt="QR Code" className="dm-banner-qr" />
                    </div>
                </div>

                {/* Product Grid */}
                <div className="dm-grid">
                    {products.map((p, i) => {
                        const img = getDisplayImg(p.img);
                        const hasDiscount = p.origPrice && Number(p.origPrice) > Number(p.price);
                        const discountPct = hasDiscount
                            ? Math.round((1 - Number(p.price) / Number(p.origPrice!)) * 100)
                            : 0;

                        return (
                            <div key={i} className="dm-card">
                                {/* Discount Badge */}
                                {hasDiscount && discountPct > 0 && (
                                    <div className="dm-badge">省 {discountPct}%</div>
                                )}

                                {/* Product Image */}
                                <div className="dm-card-img-wrap">
                                    {img ? (
                                        <img src={img} alt={p.name} className="dm-card-img" />
                                    ) : (
                                        <div className="dm-card-img-placeholder">📦</div>
                                    )}
                                </div>

                                {/* Product Info */}
                                <div className="dm-card-body">
                                    <h3 className="dm-card-name">{p.name}</h3>
                                    {p.description && (
                                        <p className="dm-card-desc">{p.description.slice(0, 30)}</p>
                                    )}
                                    <div className="dm-card-pricing">
                                        {hasDiscount && (
                                            <span className="dm-card-orig">原價 ${p.origPrice}</span>
                                        )}
                                        <span className="dm-card-price">
                                            <span className="dm-card-price-dollar">$</span>
                                            {p.price}
                                        </span>
                                    </div>
                                    <div className="dm-card-moq">
                                        {p.moq} 份成團
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>


            </div>
        </>
    );
}

export default function DMPage() {
    return (
        <Suspense fallback={
            <div className="dm-loading">
                <div className="dm-spinner" />
            </div>
        }>
            <DMContent />
        </Suspense>
    );
}
