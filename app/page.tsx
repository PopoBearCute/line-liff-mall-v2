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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const GAS_URL = "/api/products";
const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || "2008798234-72bJqeYx";
const LEADER_ID_STORAGE_KEY = "liff_leaderId";

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
  waveId?: string; // Add waveId
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
interface Liff {
  init: (config: { liffId: string }) => Promise<void>;
  isLoggedIn: () => boolean;
  login: (loginConfig?: { redirectUri?: string }) => void;
  logout: () => void;
  getProfile: () => Promise<{ userId: string; displayName: string; pictureUrl?: string }>;
  getIDToken: () => string | null;
  getContext: () => { type: string; viewType: string; userId?: string; utouId?: string; roomId?: string; groupId?: string } | null; // Add getContext
  getOS: () => string;
  getLanguage: () => string;
  getVersion: () => string;
  isInClient: () => boolean;
  getDecodedIDToken: () => any;
  isApiAvailable: (name: string) => boolean;
  shareTargetPicker: (messages: any[]) => Promise<any>;
}

declare global {
  interface Window {
    liff: Liff;
  }
}

const DEPLOY_TIMESTAMP = '2026-01-30T22:50:00Z'; // Cache-busting timestamp

const extractLeaderIdFromState = (stateRaw: string | null): string | null => {
  if (!stateRaw) return null;
  let decoded = stateRaw;
  try {
    decoded = decodeURIComponent(stateRaw);
  } catch {
    decoded = stateRaw;
  }

  // 1) Full URL form
  try {
    if (decoded.startsWith("http://") || decoded.startsWith("https://")) {
      const url = new URL(decoded);
      const idFromUrl = url.searchParams.get("leaderId");
      if (idFromUrl) return idFromUrl;
      const nestedState = url.searchParams.get("liff.state");
      if (nestedState) return extractLeaderIdFromState(nestedState);
    }
  } catch {
    // ignore URL parse errors
  }

  // 2) Query string form
  try {
    const params = new URLSearchParams(decoded.startsWith("?") ? decoded.slice(1) : decoded);
    const idFromParams = params.get("leaderId");
    if (idFromParams) return idFromParams;
  } catch {
    // ignore query parse errors
  }

  // 3) Regex fallback
  const match = decoded.match(/leaderId=([^&?#]+)/);
  return match?.[1] || null;
};

const buildRedirectUri = (href: string, leaderId: string | null): string => {
  if (!leaderId) return href;
  try {
    const url = new URL(href);
    if (!url.searchParams.get("leaderId")) {
      url.searchParams.set("leaderId", leaderId);
    }
    return url.toString();
  } catch {
    return href;
  }
};

export default function GroupBuyPage() {
  const searchParams = useSearchParams();
  console.log(`[Persistence Fix] Build Time: ${DEPLOY_TIMESTAMP}`);
  const leaderIdFromUrl = searchParams.get('leaderId');
  const previewMode = searchParams.get('mode'); // 'consumer' for testing

  // State
  const [isLeader, setIsLeader] = useState(false);
  const [leaderId, setLeaderId] = useState<string | null>(leaderIdFromUrl);
  const [leaderName, setLeaderName] = useState<string>("");
  const [leaderAvatar, setLeaderAvatar] = useState<string>(""); // New State
  const [viewMode, setViewMode] = useState<'loading' | 'seed' | 'main'>(leaderIdFromUrl ? 'main' : 'loading');
  const [activeWaves, setActiveWaves] = useState<ActiveWave[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(!!leaderIdFromUrl);
  const [isEnabling, setIsEnabling] = useState(false);
  const [submittingProduct, setSubmittingProduct] = useState<string | null>(null);
  const [enabledStatusSnapshot, setEnabledStatusSnapshot] = useState<Record<string, boolean>>({});
  const [debugInfo, setDebugInfo] = useState<any>(null); // Debug info state
  const [showDebug, setShowDebug] = useState(false);

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
      const mode = urlParams.get('mode');

      if (mode === 'seed') {
        setViewMode('seed');
        const targetId = lId || mockUserId;
        loadData(targetId, targetId, 'Dev Tester', false);
      } else if (!lId) {
        setViewMode('main');
        toast.error('請用 LINE 原生瀏覽器開啟');
      } else {
        setLeaderId(lId);
        // [Local Fix] Treat the provided leaderId as the current user to enable "Leader View" locally
        setUserProfile({
          userId: lId,
          displayName: '本地測試團主',
          pictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leader',
        });
        setLeaderName('本地測試團主'); // Ensure state is set for immediate UI update
        setViewMode('main');
        loadData(lId, lId, '本地測試團主', true);
      }
      return;
    }

    try {
      if (typeof window === 'undefined' || !window.liff) {
        setTimeout(initializeLiff, 100);
        return;
      }

      if (!LIFF_ID || LIFF_ID.includes('YOUR_LIFF_ID')) {
        throw new Error('LIFF ID 未設定或格式錯誤，請檢查環境變數 NEXT_PUBLIC_LIFF_ID');
      }

      // [Ultra-Robust Persistence] Multi-layered storage & URL Protection
      let lId: string | null = null;
      let m: string | null = null;
      const originalHref = window.location.href;
      const urlParams = new URLSearchParams(window.location.search);

      lId = urlParams.get('leaderId');
      m = urlParams.get('mode');

      // Regex Fallback for mangled URLs (OpenChat context)
      if (!lId) {
        const match = window.location.href.match(/leaderId=([^&?#]+)/);
        if (match) lId = match[1];
      }

      // LINE community: leaderId may be embedded in liff.state
      if (!lId) {
        const liffStateParam = urlParams.get('liff.state');
        const lIdFromState = extractLeaderIdFromState(liffStateParam);
        if (lIdFromState) lId = lIdFromState;
      }

      // 1. SAVE to all layers if found in URL/state
      if (lId) {
        localStorage.setItem(LEADER_ID_STORAGE_KEY, lId);
        sessionStorage.setItem(LEADER_ID_STORAGE_KEY, lId);
        console.log(`[Persistence] Saved leaderId: ${lId}`);
      }
      // 2. LOAD from layers if missing in URL/state
      else {
        lId = localStorage.getItem(LEADER_ID_STORAGE_KEY) || sessionStorage.getItem(LEADER_ID_STORAGE_KEY);
        if (lId) console.log(`[Persistence] Restored leaderId from storage: ${lId}`);
      }

      await window.liff.init({ liffId: LIFF_ID });

      if (!window.liff.isLoggedIn()) {
        const redirectUri = buildRedirectUri(originalHref, lId);
        window.liff.login({ redirectUri });
        return;
      }

      // Post-login: try LIFF runtime state in case URL was stripped
      const runtimeState = (window.liff as any)?.state as string | undefined;
      const lIdFromRuntime = extractLeaderIdFromState(runtimeState || null);
      if (!lId && lIdFromRuntime) {
        lId = lIdFromRuntime;
        localStorage.setItem(LEADER_ID_STORAGE_KEY, lId);
        sessionStorage.setItem(LEADER_ID_STORAGE_KEY, lId);
        console.log(`[Persistence] Restored leaderId from liff.state: ${lId}`);
      }

      // Redirect-Once Cleanup: only after login and only if leaderId is still present in URL
      if (lId && urlParams.has('leaderId') && !urlParams.has('code') && !urlParams.has('state') && !urlParams.has('liff.state')) {
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('leaderId');
        // We use history.replaceState to avoid adding a new history entry
        window.history.replaceState({}, '', cleanUrl.toString());
      }

      let profile = null;
      let context = null;

      // Debug: Check for debug flag
      const debugMode = urlParams.get('debug') === 'true';
      setShowDebug(debugMode);

      try {
        profile = await window.liff.getProfile();
      } catch (profileError) {
        console.warn('LIFF getProfile failed, attempting fallback:', profileError);
        // Fallback for OpenChat or blocked profile access
        context = window.liff.getContext();
        if (context && context.userId) {
          profile = {
            userId: context.userId,
            displayName: `社群使用者 (${context.userId.slice(0, 4)})`,
            pictureUrl: undefined
          };
          toast("已切換至社群相容模式", { description: "部分功能(如頭像)可能無法顯示" });
        }
      }

      if (debugMode) {
        setDebugInfo({
          os: window.liff.getOS(),
          language: window.liff.getLanguage(),
          version: window.liff.getVersion(),
          isInClient: window.liff.isInClient(),
          isLoggedIn: window.liff.isLoggedIn(),
          context: window.liff.getContext(),
          decodedIDToken: window.liff.getDecodedIDToken(),
          profileError: !profile ? "Profile load failed" : null,
          profile: profile
        });
      }

      if (!profile) {
        throw new Error('無法取得使用者資料 (Profile & Context failed)');
      }

      setUserProfile({
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
      });

      if (m === 'seed') {
        setViewMode('seed');
        const targetId = lId || profile.userId;
        loadData(targetId, profile.userId, profile.displayName, false);
      } else if (!lId) {
        setViewMode('main');
        console.error('Missing leaderId in storage and URL:', window.location.href);
        toast.error('無效的連結：缺少團主 ID (Missing Leader ID)。請再次確認分享連結是否完整。');
      } else {
        const cleanLId = lId.trim();
        setLeaderId(cleanLId);
        if (profile.userId === cleanLId) {
          setLeaderName(profile.displayName);
        }
        setViewMode('main');
        let tok = "";
        if (typeof window !== 'undefined' && window.liff && window.liff.isLoggedIn()) {
          tok = window.liff.getIDToken() || "";
        }
        loadData(cleanLId, profile.userId, profile.displayName, true, tok);
      }
    } catch (error) {
      console.error('LIFF initialization failed:', error);
      const msg = error instanceof Error ? error.message : String(error);

      // More descriptive error for user troubleshooting
      if (msg.includes('liffId')) {
        toast.error(`系統啟動失敗：LIFF ID 設定錯誤 (${LIFF_ID})。請聯絡系統管理員。`);
      } else if (msg.includes('init')) {
        toast.error(`LIFF 初始化失敗：請確保在 LINE 環境或支援的瀏覽器中開啟。`);
      } else {
        toast.error(`系統啟動失敗: ${msg}`);
      }

      // If debug mode is on, still show what we have
      if (urlParams.get('debug') === 'true') {
        setDebugInfo(prev => ({ ...prev, error: msg }));
      }

      setViewMode('main');
    }
  };

  const loadData = async (
    targetLeaderId: string,
    userId: string,
    displayName: string,
    showLoader: boolean = false,
    idToken: string = "",
    refreshSnapshot: boolean = true
  ) => {
    if (showLoader) setIsLoading(true);
    try {
      const response = await fetch(`${GAS_URL}?leaderId=${targetLeaderId}&userId=${userId}&t=${Date.now()}`);
      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) { /* ignore JSON parse error */ }
        throw new Error(errorMsg);
      }

      const data = await response.json();

      if (data.success) {
        setActiveWaves(data.activeWaves || []);
        setIsLeader(previewMode === 'consumer' ? false : (data.isLeader || false));

        // 如果 GAS 回傳了名字，直接用
        if (data.leaderName && data.leaderName !== '團購主') {
          setLeaderName(data.leaderName);
        }
        // 否則，如果目前沒名字或者還是預設值，嘗試用 profile 備份
        else if (!leaderName || leaderName === '團購主') {
          if (data.isLeader && displayName) {
            setLeaderName(displayName);
          } else {
            setLeaderName('團購主');
          }
        }
        setLeaderAvatar(data.leaderAvatar || ""); // Set Avatar

        setLeaderId(data.leaderId);

        setCart((prev: Record<string, number>) => {
          const newCart = { ...prev };
          data.activeWaves?.forEach((wave: ActiveWave) => {
            wave.products.forEach((p: Product) => {
              if (newCart[p.name] === undefined) newCart[p.name] = 0;
            });
          });
          return newCart;
        });

        if (refreshSnapshot) {
          const newSnapshot: Record<string, boolean> = {};
          data.activeWaves?.forEach((wave: ActiveWave) => {
            wave.products.forEach(p => {
              const isEnabled = p.isEnabled === true || String(p.isEnabled).toLowerCase() === 'true' || Number(p.isEnabled) === 1;
              newSnapshot[p.name] = isEnabled;
            });
          });
          setEnabledStatusSnapshot(newSnapshot);
        }

        setIsLoading(false);

        // 自動註冊團主：如果是團主且有 activeWaves，自動建立 LeaderBinding (針對每個波段)
        if (data.isLeader && data.activeWaves && data.activeWaves.length > 0 && displayName) {
          for (const waveObj of data.activeWaves) {
            try {
              await fetch(GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'auto_register_leader',
                  wave: waveObj.wave,
                  leaderId: data.leaderId,
                  userId: userId,
                  leaderName: displayName,
                  idToken: idToken || ""
                })
              });
            } catch (error) {
              console.error(`Auto-register failed for wave ${waveObj.wave}:`, error);
            }
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
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(`資料載入失敗: ${msg}`);
      setIsLoading(false);
      return [];
    }
  };

  // [Stability Fix] Refresh snapshot when switching tabs to allow order updates
  useEffect(() => {
    if (activeWaves.length > 0) {
      const newSnapshot: Record<string, boolean> = {};
      activeWaves.forEach((wave: ActiveWave) => {
        wave.products.forEach((p: Product) => {
          const isEnabled = p.isEnabled === true || String(p.isEnabled).toLowerCase() === 'true' || Number(p.isEnabled) === 1;
          newSnapshot[p.name] = isEnabled;
        });
      });
      setEnabledStatusSnapshot(newSnapshot);
    }
  }, [activeTab]);

  const handleQuantityChange = (productName: string, delta: number) => {
    setCart((prev: Record<string, number>) => ({
      ...prev,
      [productName]: (prev[productName] || 0) + delta
    }));
  };

  const handleEnableProduct = async (productName: string, currentEnabled: boolean | undefined, explicitWaveId?: string) => {
    if (!isLeader) return;

    // Get LIFF Token for Security
    let idToken = "";
    if (typeof window !== 'undefined' && window.liff && window.liff.isLoggedIn()) {
      idToken = window.liff.getIDToken() || "";
    }


    // [Optimistic UI] 1. Store previous state for rollback
    const previousWaves = [...activeWaves];

    // [Optimistic UI] 2. Update local state immediately
    const optimisticWaves = activeWaves.map((wave: ActiveWave) => ({
      ...wave,
      products: wave.products.map((p: Product) =>
        p.name === productName
          ? { ...p, isEnabled: !currentEnabled }
          : p
      )
    }));
    setActiveWaves(optimisticWaves);

    // [Stability] Snapshot is ALREADY protecting the sort order (handled in useEffect), 
    // so this state change won't cause a jump.

    try {
      // [Fix] Strictly use provided waveId to prevent cross-wave contamination
      const targetWave = explicitWaveId;

      if (!targetWave) {
        toast.error("程式錯誤：未提供波段 ID (Missing Wave ID)");
        return;
      }

      console.log(`📡 [Toggle] Product: ${productName}, Target Wave: ${targetWave}`);


      const payload = {
        action: 'enable_product',
        wave: targetWave,
        leaderId: leaderId || userProfile?.userId,
        userId: userProfile?.userId, // Added userId
        leaderName: leaderName,
        prodName: productName,
        isEnabled: !currentEnabled,
        idToken: idToken // Secure Token
      };

      console.log("🚀 [Client] Submitting Payload:", payload);

      const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // Content-Type for Next.js API
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "設定失敗");

      // [Optimistic UI] 3. Success - Sync with server silently (no loader)
      // We pass refreshSnapshot=false to strictly maintain the current order until page refresh or tab switch
      if (leaderId && userProfile) {
        await loadData(leaderId, userProfile.userId, userProfile.displayName, false, idToken, false);
      }
      toast.success(currentEnabled ? "已關閉購買" : "已開放購買");
    } catch (e) {
      console.error(e);
      const errStr = e instanceof Error ? e.message : String(e);

      if (errStr.includes("expired") || errStr.includes("身分驗證")) {
        toast.error("登入逾時，正在重新驗證身分...");
        // On PC, a simple reload might not clear the stale token if LIFF caches it.
        // Force a re-login flow to get a fresh token.
        if (typeof window !== 'undefined' && window.liff) {
          // [PC Fix] Force logout to clear stale token from cache before re-login
          if (window.liff.isLoggedIn()) {
            window.liff.logout();
          }
          window.liff.login({ redirectUri: window.location.href });
        } else {
          setTimeout(() => window.location.reload(), 1500);
        }
      } else {
        // [Debug] Show actual error from backend
        toast.error(`設定失敗: ${errStr}`);
      }
      // [Optimistic UI] 4. Error - Revert state
      setActiveWaves(previousWaves);
    } finally {
      setIsEnabling(false);
    }
  };






  // --- Submit Handler ---
  const handleSubmit = async (singleProductName?: string) => {
    if (!userProfile) {
      toast.error("請先等待身分驗證完成...");
      return;
    }

    // Validate
    const productsToSubmit = singleProductName
      ? [{ name: singleProductName, qty: cart[singleProductName] || 1 }]
      : Object.entries(cart).map(([name, qty]) => ({ name, qty }));

    const validItems = productsToSubmit.filter(i => i.qty !== 0);

    // Special Logic for Single Submit in Active Mode context: 
    // If explicit single submit (Buy Now button), allow even if cart logic differs
    // But here we rely on cart[name] having been set to 1 by the button click if not present?
    // Actually, in IGFeedCard, "active" mode -> calls onSubmit directly. 
    // We should probably ensure qty is 1 if 0.
    if (singleProductName && (!validItems.length || validItems[0].qty === 0)) {
      validItems[0].qty = 1; // Default to 1 for direct buy
    }

    if (validItems.length === 0) {
      toast.error("購物車是空的");
      return;
    }

    // Get LIFF Token
    let idToken = "";
    if (typeof window !== 'undefined' && window.liff && window.liff.isLoggedIn()) {
      idToken = window.liff.getIDToken() || "";
    }

    if (singleProductName) setSubmittingProduct(singleProductName);
    else setIsSubmitting(true);

    try {
      // [Fix] Group items by their actual waveId instead of defaulting to wave 0
      const itemsWithWaves = validItems.map(item => {
        let waveId = "1";
        // Search across all active waves to find which one contains this product
        for (const w of activeWaves) {
          if (w.products.some(p => p.name === item.name)) {
            waveId = w.wave;
            break;
          }
        }
        return { ...item, waveId };
      });

      // Group by waveId
      const groupedByWave: Record<string, typeof validItems> = {};
      itemsWithWaves.forEach(item => {
        if (!groupedByWave[item.waveId]) groupedByWave[item.waveId] = [];
        groupedByWave[item.waveId].push({ name: item.name, qty: item.qty });
      });

      // Submit each group separately (Safest for existing API compatibility)
      for (const [waveId, groupItems] of Object.entries(groupedByWave)) {
        const payload = {
          action: 'submit_batch_intent',
          wave: waveId,
          leaderId: leaderId || userProfile.userId,
          userId: userProfile.userId,
          userName: userProfile.displayName,
          userAvatar: userProfile.pictureUrl,
          items: groupItems.map(i => ({
            prodName: i.name,
            qty: i.qty
          })),
          idToken: idToken
        };

        const res = await fetch(GAS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || `波段 ${waveId} 送出失敗`);
      }

      toast.success("登記成功！");
      setCart({}); // Clear Cart

      // Auto-refresh
      await loadData(leaderId || userProfile.userId, userProfile.userId, userProfile.displayName, isLeader, idToken);

    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "送出失敗");
    } finally {
      setIsSubmitting(false);
      setSubmittingProduct(null);
    }
  };

  const handleRemoveVoter = async (productName: string, voterName: string, voterUserId?: string) => {
    if (!confirm(`確定要移除 ${voterName} 的 ${productName} 紀錄嗎？`)) return;
    if (!leaderId || !userProfile) return;

    // Get current token
    let idTok = "";
    if (typeof window !== 'undefined' && window.liff && window.liff.isLoggedIn()) {
      idTok = window.liff.getIDToken() || "";
    }

    try {
      // Find the product's wave
      let itemWave = "1";
      for (const w of activeWaves) {
        if (w.products.some(p => p.name === productName)) {
          itemWave = w.wave;
          break;
        }
      }

      await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_batch_intent',
          wave: itemWave,
          leaderId: leaderId,
          userId: voterUserId || 'UNKNOWN',
          userName: voterName,
          items: [{ prodName: productName, qty: -9999 }],
          idToken: idTok
        })
      });

      toast.success("已移除紀錄");
      await loadData(leaderId, userProfile.userId, userProfile.displayName, false, idTok);
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
      // [Fix] Unified Share Link: Use LIFF URL to ensure it opens in LINE internal browser
      const shareUrl = `https://liff.line.me/${LIFF_ID}?leaderId=${leaderId || ""}`;

      console.log("[Share] Prepared data:", { cleanName, displayImg, shareUrl });

      // [Fix] Label Unification based on Phase
      const parentWave = activeWaves.find((w: ActiveWave) => w.products.some((prod: Product) => prod.name === p.name));
      const isActivePhase = parentWave?.phase === 'active';
      const buttonLabel = isActivePhase ? "來去下單" : "來去跟團";

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
            { "type": "text", "text": isActivePhase ? "成功開團了，我也要上車!" : `進來湊個單 ${userProfile?.displayName || leaderName || '團主'} 就開團 🔥`, "size": "xs", "color": "#E63946", "margin": "sm" }
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
                "label": buttonLabel,
                "uri": (isActivePhase && p.link) ? p.link : shareUrl
              }
            }
          ]
        }
      };

      const nameToUse = (isLeader && userProfile?.displayName) ? userProfile.displayName : (leaderName || '團購主');
      const safeLeaderName = nameToUse.replace(/[^\w\u4e00-\u9fa5\s]/g, '').slice(0, 10);

      const result = await window.liff.shareTargetPicker([{
        type: "flex",
        altText: `${safeLeaderName} 邀請您參加團購：${cleanName}`,
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
    } catch (error) {
      console.error("[Share] Error:", error);
      // Only show error if it's truly an error, not cancellation
      const errorStr = (error instanceof Error ? error.message : String(error)) || "";
      if (errorStr.toLowerCase().includes('cancel')) {
        toast.info("已取消分享");
      } else {
        toast.error("分享過程發生問題");
      }
    }
  };

  // Refactored handleShare to support "Collecting Only" or "Active Only" modes
  const handleShare = async (filterMode?: 'collecting' | 'active' | object) => {
    if (!leaderId) return;

    // Safety check for loading state
    if (activeWaves.length === 0 && isLoading) {
      toast.info("資料處理中，請稍候再分享...");
      return;
    }

    const shareUrl = `https://liff.line.me/${LIFF_ID}?leaderId=${leaderId}`;

    if (!window.liff?.isApiAvailable('shareTargetPicker')) {
      navigator.clipboard.writeText(shareUrl);
      toast.success("連結已複製", { description: "請手動貼上給好友" });
      return;
    }

    try {
      // Use user's own name if they are the leader (Seed Mode or Owner)
      const nameToUse = (isLeader && userProfile?.displayName) ? userProfile.displayName : (leaderName || '團購主');
      const safeLeaderName = nameToUse.replace(/[^\w\u4e00-\u9fa5\s]/g, '').slice(0, 10);
      const validWaves = activeWaves.filter((w: ActiveWave) => w.phase !== 'closed');

      const collectingProds = validWaves.filter((w: ActiveWave) => w.phase === 'collecting').flatMap((w: ActiveWave) => w.products);
      const activeProds = validWaves.filter((w: ActiveWave) => w.phase === 'active').flatMap((w: ActiveWave) => w.products);

      let candidateProducts: Product[] = [];

      // Detect Filter Mode (Filter by string 'collecting' or 'active', ignore if it's an Event object)
      const mode = (typeof filterMode === 'string') ? filterMode : null;

      if (mode === 'collecting') {
        candidateProducts = collectingProds;
      } else if (mode === 'active') {
        candidateProducts = activeProds;
      } else {
        // Default: Mixed (collecting prioritized)
        candidateProducts = [...collectingProds, ...activeProds];
      }

      // 移除原有的保底邏輯，若該分類無商品則直接回傳錯誤
      if (candidateProducts.length === 0) {
        toast.error(`目前沒有「${mode === 'collecting' ? '集單中' : (mode === 'active' ? '上架中' : '可分享')}」的商品`);
        return;
      }

      // 限額 9 名
      candidateProducts = candidateProducts.slice(0, 9);

      if (candidateProducts.length === 0) {
        toast.error("目前沒有商品可分享");
        return;
      }

      const productBubbles = candidateProducts.map((p: Product) => {
        // 处理图片网址 (如果是 Google Drive 则转换)
        let displayImg = p.img || "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=600&auto=format&fit=crop";
        if (displayImg.includes('drive.google.com')) {
          const fileId = displayImg.match(/[-\w]{25,}/)?.[0];
          if (fileId) displayImg = `https://lh3.googleusercontent.com/u/0/d/${fileId}=w800-h800-p-k-no-nu`;
        }

        // 修正团主名称显示问题
        const cleanName = (p.name || "熱門商品").replace(/[\x00-\x1F\x7F]/g, "").trim().slice(0, 30);

        // 選取正確按鈕文字
        // [Fix] Label Unification based on Phase
        const isActivePhase = activeProds.some((ap: Product) => ap.name === p.name);
        const buttonLabel = isActivePhase ? "來去下單" : "來去跟團";

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
              { "type": "text", "text": isActivePhase ? "成功開團了，我也要上車!" : `進來湊個單 ${nameToUse} 就開團 🔥`, "size": "xs", "color": "#E63946", "margin": "sm" }
            ]
          },
          "footer": {
            "type": "box",
            "layout": "vertical",
            "contents": [
              { "type": "button", "height": "sm", "style": "primary", "color": "#E63946", "action": { "type": "uri", "label": buttonLabel, "uri": (isActivePhase && p.link) ? p.link : shareUrl } }
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

    } catch (err) {
      console.error("Share Error:", err);
      // Fallback
      navigator.clipboard.writeText(shareUrl);
      toast.error("圖卡分享失敗 (可能是圖片或格式問題)", { description: "已改為複製連結" });
    }
  };

  // 1. activeProducts: Phase=active
  // Logic: 
  // - Leader: sees ALL active products
  // - Member: sees only isEnabled active products
  // - Sort: isEnabled first, then by achievement rate descending
  const activeProducts = activeWaves
    .filter((w: ActiveWave) => w.phase === 'active')
    .flatMap((w: ActiveWave) => w.products
      .filter((p: Product) => {
        if (isLeader) return true;
        const isEnabled = p.isEnabled === true || String(p.isEnabled).toLowerCase() === 'true' || Number(p.isEnabled) === 1;
        return isEnabled;
      })
      .map(p => ({ ...p, waveId: w.wave })) // Attach Wave ID
    )
    .sort((a: Product, b: Product) => {
      if (isLeader) {
        // [Stability Fix] Use snapshot for sorting isEnabled to prevent jumping
        const aEnabled = !!enabledStatusSnapshot[a.name];
        const bEnabled = !!enabledStatusSnapshot[b.name];
        if (aEnabled !== bEnabled) return aEnabled ? -1 : 1;
      }
      const rateA = (a.currentQty || 0) / Math.max(a.moq || 1, 1);
      const rateB = (b.currentQty || 0) / Math.max(b.moq || 1, 1);
      return rateB - rateA;
    });

  // 2. collectingProducts: Phase=collecting OR Phase=preparing
  // Show ALL products in these phases, sorted by achievement rate descending
  const collectingProducts = activeWaves
    .filter((w: ActiveWave) => w.phase === 'collecting' || w.phase === 'preparing')
    .flatMap((w: ActiveWave) => w.products.map(p => ({ ...p, waveId: w.wave }))) // Attach Wave ID
    .sort((a: Product, b: Product) => {
      const rateA = (a.currentQty || 0) / Math.max(a.moq || 1, 1);
      const rateB = (b.currentQty || 0) / Math.max(b.moq || 1, 1);
      return rateB - rateA;
    });

  if (viewMode === 'loading') return <Loading />;
  if (viewMode === 'seed') return (
    <SeedMode
      onEnterShop={() => setViewMode('main')}
      onShareCollecting={() => handleShare('collecting')}
      onShareActive={() => handleShare('active')}
      userName={userProfile?.displayName || leaderName}
      collectingCount={collectingProducts.length}
      activeCount={activeProducts.length}
      products={[...activeProducts, ...collectingProducts]}
      onRemoveVoter={handleRemoveVoter}
    />
  );

  // 3. preparingProducts: REMOVED (Merged into collecting)

  const allDisplayProducts = activeProducts;

  // --- Derived State for Voters Map ---
  const activeVotersMap = Object.fromEntries(activeProducts.map((p: Product) => [p.name, p.voters || []]));
  const collectingVotersMap = Object.fromEntries(collectingProducts.map((p: Product) => [p.name, p.voters || []]));


  // [Phase 16 Refinement] StoriesBar: Merge Active & Collecting, Sort by Popularity (Qty)
  // "只論登記數量 不論標籤頁別"
  const storiesProducts = [...activeProducts, ...collectingProducts]
    .sort((a: Product, b: Product) => (b.currentQty || 0) - (a.currentQty || 0));

  return (
    <Suspense fallback={<Loading />}>
      {isLoading && <Loading />}

      <div className="mesh-gradient min-h-screen w-full pb-36 overflow-y-auto">
        <Header
          roleTag={isLeader ? "您是本團負責人" : "你是團員"}
          isLeader={isLeader}
          wave={activeWaves[0]?.wave || ""}
          leaderName={leaderName}
        />


        {/* Stories Bar */}
        <div className="pt-3">
          <StoriesBar
            // Logic: If I am the leader, show MY current profile avatar (most up to date). 
            // If I am a guest, show the fetched 'leaderAvatar'. If missing, let component show default icon.
            // NEVER show guest's avatar as the leader.
            leaderAvatar={isLeader ? (userProfile?.pictureUrl || leaderAvatar) : leaderAvatar}
            leaderName={leaderName}
            products={storiesProducts}
            onProductClick={(name: string) => {
              // Confirm which tab the product belongs to
              const isActive = activeProducts.some((p: Product) => p.name === name);
              const isCollecting = collectingProducts.some((p: Product) => p.name === name);

              let targetTab = activeTab;
              if (isActive) targetTab = 0; // Hot Sale Tab
              else if (isCollecting) targetTab = 1; // Wishlist Tab

              if (activeTab !== targetTab) {
                setActiveTab(targetTab);
                // Wait for tab switch render
                setTimeout(() => {
                  const element = document.getElementById(name);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  } else {
                    console.warn(`Element ${name} not found after tab switch`);
                  }
                }, 150);
              } else {
                const element = document.getElementById(name);
                element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
                leaderAvatar={leaderAvatar} // Pass Avatar
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
                leaderAvatar={leaderAvatar} // Pass Avatar
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

      {/* Debug Panel */}
      {showDebug && debugInfo && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/90 text-green-400 p-4 text-xs font-mono z-50 overflow-auto max-h-[50vh] break-all">
          <div className="flex justify-between items-center mb-2 border-b border-green-600 pb-1">
            <h3 className="font-bold">LIFF Debugger</h3>
            <button onClick={() => setShowDebug(false)} className="px-2 py-1 bg-green-900 rounded">Close</button>
          </div>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
    </Suspense>
  );
}
