"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/group-buy/header";
import { IGProductFeed } from "@/components/group-buy/ig-product-feed";
import { StoriesBar } from "@/components/group-buy/stories-bar";
import { StickyTabs } from "@/components/group-buy/sticky-tabs";

import { SeedMode } from "@/components/group-buy/seed-mode";
import Loading from "./loading";
import { toast } from "sonner";
import { GolfBallLoader } from "@/components/ui/golf-loader";

const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL || "https://script.google.com/macros/s/AKfycbwv82nbJ7SjU8UBxVBdVybXmS0LAryYwiexu1X_N9zmYyCWY3KmncpZMmRwEppAll-g/exec";
const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || "2008798234-72bJqeYx";

// Type definitions
interface Product {
  name: string;
  price: number | string;
  origPrice?: number;
  moq: number;
  img: string;
  description: string;
  link?: string;
  isEnabled?: boolean;
  currentQty?: number;
  voters?: Voter[];
  buyerAvatars?: string[]; // Add buyerAvatars
  endDate?: string; // [Phase 8] Add endDate
}

interface ActiveWave {
  wave: string;
  phase: 'collecting' | 'active' | 'closed' | 'preparing';
  products: Product[];
}

interface Voter {
  name: string;
  qty: number;
  userId?: string;
}

interface UserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string; // Add pictureUrl
}

// Declare LIFF on window
declare global {
  interface Window {
    liff: any;
  }
}

export default function GroupBuyPage() {
  const searchParams = useSearchParams();
  const leaderIdFromUrl = searchParams.get('leaderId');
  const previewMode = searchParams.get('mode'); // 'consumer' for testing

  // State
  const [isLeader, setIsLeader] = useState(false);
  const [leaderId, setLeaderId] = useState<string | null>(leaderIdFromUrl);
  const [leaderName, setLeaderName] = useState<string>("");
  const [viewMode, setViewMode] = useState<'loading' | 'seed' | 'main'>(leaderIdFromUrl ? 'main' : 'loading');
  const [activeWaves, setActiveWaves] = useState<ActiveWave[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(!!leaderIdFromUrl);
  const [isEnabling, setIsEnabling] = useState(false);
  const [submittingProduct, setSubmittingProduct] = useState<string | null>(null);

  // IG-Style Tabs State
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    initializeLiff();
  }, []);

  const initializeLiff = async () => {
    // DEV_MODE: Skip LIFF login for local testing
    const isLocalDev = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (isLocalDev) {
      console.log('[DEV_MODE] Skipping LIFF login for local testing');
      const mockUserId = 'DEV_TEST_USER_123';
      setUserProfile({
        userId: mockUserId,
        displayName: 'Dev Tester',
        pictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dev', // Mock avatar
      });

      const urlParams = new URLSearchParams(window.location.search);
      const lId = urlParams.get('leaderId');

      if (!lId) {
        setViewMode('seed');
        loadData(mockUserId, mockUserId, 'Dev Tester', false);
      } else {
        setLeaderId(lId);
        setViewMode('main');
        loadData(lId, mockUserId, 'Dev Tester', true);
      }
      return;
    }

    try {
      if (typeof window === 'undefined' || !window.liff) {
        setTimeout(initializeLiff, 100);
        return;
      }

      await window.liff.init({ liffId: LIFF_ID });

      if (!window.liff.isLoggedIn()) {
        window.liff.login();
        return;
      }

      const profile = await window.liff.getProfile();
      setUserProfile({
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl, // Capture pictureUrl
      });

      const urlParams = new URLSearchParams(window.location.search);
      const lId = urlParams.get('leaderId');

      if (!lId) {
        setViewMode('seed');
        loadData(profile.userId, profile.userId, profile.displayName, false);
      } else {
        setLeaderId(lId);
        // 如果目前使用者就是團主，先用 Line 抓到的暱稱預填
        if (profile.userId === lId) {
          setLeaderName(profile.displayName);
        }
        setViewMode('main');
        loadData(lId, profile.userId, profile.displayName, true);
      }
    } catch (error) {
      console.error('LIFF initialization failed:', error);
      toast.error('系統啟動失敗，請確認 LIFF ID 設定');
      setViewMode('main');
    }
  };

  const loadData = async (
    targetLeaderId: string,
    userId: string,
    displayName: string,
    showLoader: boolean = false
  ) => {
    if (showLoader) setIsLoading(true);
    try {
      const response = await fetch(`${GAS_URL}?leaderId=${targetLeaderId}&userId=${userId}&t=${Date.now()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      if (data.success) {
        setActiveWaves(data.activeWaves || []);
        setIsLeader(previewMode === 'consumer' ? false : (data.isLeader || false));

        // 只有在 GAS 回傳的是有效名稱且目前沒名字，或 GAS 回傳的不是預設值時才更新
        if (data.leaderName && data.leaderName !== '團購主') {
          setLeaderName(data.leaderName);
        } else if (!leaderName) {
          setLeaderName('團購主');
        }

        setLeaderId(data.leaderId);

        setCart(prev => {
          const newCart = { ...prev };
          data.activeWaves?.forEach((wave: ActiveWave) => {
            wave.products.forEach(p => {
              if (newCart[p.name] === undefined) newCart[p.name] = 0;
            });
          });
          return newCart;
        });

        setIsLoading(false);

        // 自動註冊團主：如果是團主且有 activeWaves，自動建立 LeaderBinding
        if (data.isLeader && data.activeWaves && data.activeWaves.length > 0 && displayName) {
          const mainWave = data.activeWaves[0].wave;
          try {
            await fetch(GAS_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain' },
              body: JSON.stringify({
                action: 'auto_register_leader',
                wave: mainWave,
                leaderId: data.leaderId,
                leaderName: displayName
              })
            });
          } catch (error) {
            console.error('Auto-register failed:', error);
            // 不顯示錯誤給使用者，因為這是背景操作
          }
        }

        return data.activeWaves;
      } else {
        console.error('GAS Error Response:', data);
        toast.error(`資料載入錯誤: ${data.error || '不明錯誤'}`);
        setIsLoading(false);
        return [];
      }
    } catch (error) {
      console.error('Data loading failed:', error);
      toast.error('資料載入失敗，可能後端正在更新中');
      setIsLoading(false);
      return [];
    }
  };

  const handleQuantityChange = (productName: string, delta: number) => {
    setCart((prev) => ({
      ...prev,
      [productName]: (prev[productName] || 0) + delta
    }));
  };

  const handleEnableProduct = async (productName: string, isValue?: any) => {
    if (!leaderId || !isLeader) return;
    setIsEnabling(true);

    const currentIsEnabled = isValue === true || String(isValue).toLowerCase() === 'true' || Number(isValue) === 1;
    const newEnabledState = !currentIsEnabled;

    // 1. Optimistic Update
    setActiveWaves(prev => prev.map(wave => ({
      ...wave,
      products: wave.products.map(p =>
        p.name === productName ? { ...p, isEnabled: newEnabledState } : p
      )
    })));

    try {
      const wave = activeWaves.find((w: ActiveWave) => w.products.some((p: Product) => p.name === productName))?.wave;
      if (!wave) throw new Error("Wave not found");

      const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'enable_product',
          wave: wave,
          leaderId: leaderId,
          leaderName: userProfile?.displayName || '團購主',
          prodName: productName,
          isEnabled: newEnabledState
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(newEnabledState ? `已開放 ${productName}` : `已關閉 ${productName}`);
        await loadData(leaderId, userProfile?.userId || leaderId, userProfile?.displayName || '團購主', false);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      // 3. Rollback
      setActiveWaves(prev => prev.map(wave => ({
        ...wave,
        products: wave.products.map(p =>
          p.name === productName ? { ...p, isEnabled: currentIsEnabled } : p
        )
      })));
      toast.error("操作失敗", { description: error?.message });
    } finally {
      setIsEnabling(false);
    }
  };

  const handleSubmit = async (specificProductName?: string) => {
    if (!userProfile || !leaderId) return;

    let itemsToSubmit;
    if (specificProductName) {
      const qty = cart[specificProductName];
      if (!qty || qty === 0) return;
      itemsToSubmit = [{ prodName: specificProductName, qty }];
      setSubmittingProduct(specificProductName);
    } else {
      itemsToSubmit = Object.entries(cart)
        .filter(([, qty]) => qty !== 0)
        .map(([name, qty]) => ({ prodName: name, qty }));

      if (itemsToSubmit.length === 0) {
        toast.warning("請先調整商品數量");
        return;
      }
      setIsSubmitting(true);
    }

    try {
      const mainWave = activeWaves[0]?.wave || "Unknown";

      const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'submit_batch_intent',
          wave: mainWave,
          leaderId: leaderId,
          leaderName: userProfile.displayName,
          userId: userProfile.userId,
          userName: userProfile.displayName,
          userAvatar: userProfile.pictureUrl || "", // Force empty string if undefined
          items: itemsToSubmit
        })
      });

      const resData = await response.json();

      if (resData.success) {
        toast.success("登記成功！", { description: "已更新您的登記紀錄" });
        await loadData(leaderId, userProfile.userId, userProfile.displayName, false);

        if (specificProductName) {
          setCart(prev => ({ ...prev, [specificProductName]: 0 }));
        } else {
          setCart({});
        }
      } else {
        throw new Error(resData.error);
      }
    } catch (error) {
      console.error('Submit failed:', error);
      toast.error("提交失敗");
    } finally {
      setIsSubmitting(false);
      setSubmittingProduct(null);
    }
  };

  const handleRemoveVoter = async (productName: string, voterName: string, voterUserId?: string) => {
    if (!confirm(`確定要移除 ${voterName} 的 ${productName} 紀錄嗎？`)) return;
    if (!leaderId || !userProfile) return;

    try {
      await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'submit_batch_intent',
          wave: activeWaves[0]?.wave,
          leaderId: leaderId,
          userId: voterUserId || 'UNKNOWN',
          userName: voterName,
          items: [{ prodName: productName, qty: -9999 }]
        })
      });

      toast.success("已移除紀錄");
      await loadData(leaderId, userProfile.userId, userProfile.displayName, false);
    } catch (error) {
      toast.error("移除失敗");
    }
  };

  // [Phase 14] Individual Product Share
  const handleShareProduct = async (p: Product) => {
    if (!p) return;

    console.log("[Share] Starting share for product:", p.name);

    // Check LIFF availability
    if (!window.liff) {
      toast.error("LIFF 尚未初始化");
      console.error("[Share] LIFF not initialized");
      return;
    }

    if (!window.liff.isApiAvailable('shareTargetPicker')) {
      toast.error("此環境不支援分享功能");
      console.error("[Share] shareTargetPicker not available");
      return;
    }

    try {
      // 处理图片网址 (如果是 Google Drive 则转换)
      let displayImg = p.img || "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=600&auto=format&fit=crop";
      if (displayImg.includes('drive.google.com')) {
        const fileId = displayImg.match(/[-\w]{25,}/)?.[0];
        if (fileId) displayImg = `https://lh3.googleusercontent.com/u/0/d/${fileId}=w800-h800-p-k-no-nu`;
      }

      const cleanName = (p.name || "熱門商品").replace(/[\x00-\x1F\x7F]/g, "").trim().slice(0, 30);
      const shareUrl = `${window.location.origin}${window.location.pathname}?leaderId=${leaderId || ""}`;

      console.log("[Share] Prepared data:", { cleanName, displayImg, shareUrl });

      const bubble = {
        "type": "bubble",
        "size": "mega",
        "hero": {
          "type": "image",
          "url": displayImg,
          "size": "full",
          "aspectRatio": "20:13",
          "aspectMode": "fit"
        },
        "body": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            { "type": "text", "text": cleanName, "weight": "bold", "size": "md", "wrap": true, "maxLines": 2 },
            { "type": "text", "text": "進來湊個單 團主就開團 🔥", "size": "xs", "color": "#E63946", "margin": "sm" }
          ]
        },
        "footer": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "button",
              "height": "sm",
              "style": "primary",
              "color": "#E63946",
              "action": {
                "type": "uri",
                "label": "來去看看",
                "uri": shareUrl
              }
            }
          ]
        }
      };

      const result = await window.liff.shareTargetPicker([{
        type: "flex",
        altText: `分享商品：${cleanName}`,
        contents: bubble
      }]);

      console.log("[Share] Result:", result);

      // shareTargetPicker returns undefined on success in some LINE versions
      // It may also return { status: 'success' } in newer versions
      if (result) {
        toast.success("已選擇分享對象！");
      } else {
        // User closed the picker without sharing, or sharing succeeded (older behavior)
        toast.info("分享完成");
      }
    } catch (error: any) {
      console.error("[Share] Error:", error);
      // Only show error if it's truly an error, not cancellation
      const errorStr = error?.message || error?.toString() || "";
      if (errorStr.toLowerCase().includes('cancel')) {
        toast.info("已取消分享");
      } else {
        toast.error("分享過程發生問題");
      }
    }
  };

  const handleShare = async () => {
    if (!leaderId) return;

    // 防呆：如果資料還沒讀取完，跳出提示
    if (activeWaves.length === 0 && isLoading) {
      toast.info("資料處理中，請稍候再分享...");
      return;
    }

    const shareUrl = `https://liff.line.me/${LIFF_ID}?leaderId=${leaderId}`;

    if (!window.liff?.isApiAvailable('shareTargetPicker')) {
      // Fallback for external browser
      navigator.clipboard.writeText(shareUrl);
      toast.success("連結已複製", { description: "請手動貼上給好友" });
      return;
    }

    try {
      const safeLeaderName = (leaderName || '我').replace(/[^\w\u4e00-\u9fa5\s]/g, '').slice(0, 10);

      // (B) 獲取真實商品資料，限制在前 9 個 (留 1 個給 More Card)
      // 邏輯：優先抓取「許願登記中 (collecting)」的商品
      const validWaves = activeWaves.filter(w => w.phase !== 'closed');

      const collectingProds = validWaves
        .filter(w => w.phase === 'collecting')
        .flatMap(w => w.products);

      const activeProds = validWaves
        .filter(w => w.phase === 'active')
        .flatMap(w => w.products);

      // 合併但不在此過濾 isEnabled，確保圖卡內容豐富
      let candidateProducts = [...collectingProds, ...activeProds];

      // 保底邏輯
      if (candidateProducts.length === 0) {
        candidateProducts = activeWaves.flatMap(w => w.products);
      }

      // 限額 9 名
      candidateProducts = candidateProducts.slice(0, 9);

      if (candidateProducts.length === 0) {
        toast.error("目前沒有商品可分享");
        return;
      }

      const productBubbles = candidateProducts.map(p => {
        // 处理图片网址 (如果是 Google Drive 则转换)
        let displayImg = p.img || "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=600&auto=format&fit=crop";
        if (displayImg.includes('drive.google.com')) {
          const fileId = displayImg.match(/[-\w]{25,}/)?.[0];
          if (fileId) displayImg = `https://lh3.googleusercontent.com/u/0/d/${fileId}=w800-h800-p-k-no-nu`;
        }

        // 修正团主名称显示问题
        const cleanName = (p.name || "熱門商品").replace(/[\x00-\x1F\x7F]/g, "").trim().slice(0, 30);

        return {
          "type": "bubble",
          "size": "mega",
          "hero": {
            "type": "image",
            "url": displayImg,
            "size": "full",
            "aspectRatio": "20:13",
            "aspectMode": "fit" // Use FIT to avoid cropping
          },
          "body": {
            "type": "box",
            "layout": "vertical",
            "contents": [
              { "type": "text", "text": cleanName, "weight": "bold", "size": "md", "wrap": true, "maxLines": 2 },
              { "type": "text", "text": "進來湊個單 團主就開團 🔥", "size": "xs", "color": "#E63946", "margin": "sm" }
            ]
          },
          "footer": {
            "type": "box",
            "layout": "vertical",
            "contents": [
              { "type": "button", "height": "sm", "style": "primary", "color": "#E63946", "action": { "type": "uri", "label": "來去許願", "uri": shareUrl } }
            ]
          }
        };
      });

      const moreBubble = {
        "type": "bubble",
        "size": "mega",
        "hero": {
          "type": "image",
          "url": "https://images.unsplash.com/photo-1522204538344-922f76cee040?q=80&w=600&auto=format&fit=crop",
          "size": "full",
          "aspectRatio": "20:13",
          "aspectMode": "cover",
          "action": { "type": "uri", "uri": shareUrl }
        },
        "body": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            { "type": "text", "text": "還有更多驚喜商品...", "weight": "bold", "size": "lg", "color": "#005EB8" },
            { "type": "text", "text": "點擊下方按鈕回大廳，探索更多開發中的熱門選品！", "size": "xs", "margin": "md", "color": "#666666", "wrap": true }
          ]
        },
        "footer": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            { "type": "button", "style": "primary", "color": "#E63946", "action": { "type": "uri", "label": "我要看更多", "uri": shareUrl } }
          ]
        }
      };

      const payload = [{
        "type": "flex",
        "altText": `${safeLeaderName} 邀請您參加團購`,
        "contents": { "type": "carousel", "contents": [...productBubbles, moreBubble] }
      }];

      const res = await window.liff.shareTargetPicker(payload);
      if (res) {
        toast.success("分享圖卡已送出！");
      } else {
        toast.info("已取消分享");
      }

    } catch (err: any) {
      console.error("Share Error:", err);
      // Fallback
      navigator.clipboard.writeText(shareUrl);
      toast.error("圖卡分享失敗 (可能是圖片或格式問題)", { description: "已改為複製連結" });
    }
  };

  if (viewMode === 'loading') return <Loading />;
  if (viewMode === 'seed') return <SeedMode onShare={handleShare} wave={activeWaves[0]?.wave || "1"} />;

  // 1. activeProducts: Phase=active
  // Logic: 
  // - Leader: sees ALL active products
  // - Member: sees only isEnabled active products
  const activeProducts = activeWaves
    .filter(w => w.phase === 'active')
    .flatMap(w => w.products.filter(p => {
      // If leader, show all. If member, check isEnabled.
      if (isLeader) return true;

      const isEnabled = p.isEnabled === true ||
        String(p.isEnabled).toLowerCase() === 'true' ||
        Number(p.isEnabled) === 1;
      return isEnabled;
    }));

  // 2. collectingProducts: Phase=collecting OR Phase=preparing
  // Show ALL products in these phases
  const collectingProducts = activeWaves
    .filter(w => w.phase === 'collecting' || w.phase === 'preparing')
    .flatMap(w => w.products);

  // 3. preparingProducts: REMOVED (Merged into collecting)

  const allDisplayProducts = activeProducts;

  // --- Derived State for Voters Map ---
  const activeVotersMap = Object.fromEntries(activeProducts.map(p => [p.name, p.voters || []]));
  const collectingVotersMap = Object.fromEntries(collectingProducts.map(p => [p.name, p.voters || []]));


  // [Phase 16 Refinement] StoriesBar: Merge Active & Collecting, Sort by Popularity (Qty)
  // "只論登記數量 不論標籤頁別"
  const storiesProducts = [...activeProducts, ...collectingProducts]
    .sort((a, b) => (b.currentQty || 0) - (a.currentQty || 0));

  return (
    <Suspense fallback={<Loading />}>
      {isLoading && <GolfBallLoader />}

      <div className="mesh-gradient min-h-screen w-full pb-36 overflow-y-auto">
        <Header
          roleTag={isLeader ? "您是本團負責人" : "你是團員"}
          isLeader={isLeader}
          onShare={handleShare}
          wave={activeWaves[0]?.wave || ""}
          leaderName={leaderName}
        />

        {/* Stories Bar */}
        <div className="pt-3">
          <StoriesBar
            leaderAvatar={userProfile?.pictureUrl || undefined}
            leaderName={leaderName}
            products={storiesProducts}
            onProductClick={(name: string) => {
              // 1. 若商品在現有 Tab，直接捲動
              const element = document.getElementById(name);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              } else {
                // 2. 若找不到，切換到許願 Tab 再捲動 (因為限動顯示的是登記中商品)
                setActiveTab(1);
                setTimeout(() => {
                  document.getElementById(name)?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
          />
        </div>

        {/* 4. Tab Content (IG Feed Style) - Removed extra pt-4 to tighten gap */}
        <div className="flex-1 w-full max-w-md mx-auto px-0">
          {activeTab === 0 && (
            <div className="animate-in fade-in zoom-in-95">
              <IGProductFeed
                products={activeProducts}
                mode="active"
                cart={cart}
                voters={activeVotersMap}
                onQuantityChange={handleQuantityChange}
                isLoading={isLoading}
                isLeader={isLeader}
                leaderName={leaderName || undefined}
                currentUserId={userProfile?.userId}
                onRemoveVoter={handleRemoveVoter}
                onSingleSubmit={handleSubmit}
                submittingProduct={submittingProduct}
                onEnableProduct={handleEnableProduct} // Pass the handler
                onShare={handleShareProduct}
              />
            </div>
          )}

          {activeTab === 1 && (
            <div className="animate-in fade-in zoom-in-95">
              <IGProductFeed
                products={collectingProducts}
                mode="collecting"
                cart={cart}
                voters={collectingVotersMap}
                onQuantityChange={handleQuantityChange}
                isLoading={isLoading}
                isLeader={isLeader}
                leaderName={leaderName || undefined}
                currentUserId={userProfile?.userId}
                onRemoveVoter={handleRemoveVoter}
                onSingleSubmit={handleSubmit}
                submittingProduct={submittingProduct}
                onShare={handleShareProduct}
              />
            </div>
          )}
        </div>
      </div>
      <StickyTabs activeTab={activeTab} onTabChange={setActiveTab} />
    </Suspense>
  );
}
