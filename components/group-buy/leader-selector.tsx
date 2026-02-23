"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, MapPin, Fuel, Smartphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Image from "next/image";
import { LeaderBindDialog } from "./leader-bind-dialog";

interface Leader {
  id: string;
  name: string;
  avatar_url?: string;
  store_name?: string;
  station_code?: string;
  username: string; // The leaderId used in the app
  latitude?: number;
  longitude?: number;
  distance?: number; // Calculated distance in km
  address?: string;
  LineID?: string;
}

interface LeaderSelectorProps {
  onSelect: (leaderId: string, mode?: string) => void;
  lineUserId?: string; // Current user's LINE ID for binding
  userAvatar?: string; // [New] Pass avatar for binding
  displayName?: string; // [New] Pass name for binding
}

// Haversine formula to calculate distance between two points in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function LeaderSelector({ onSelect, lineUserId, userAvatar, displayName }: LeaderSelectorProps) {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [filteredLeaders, setFilteredLeaders] = useState<Leader[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showAllLeaders, setShowAllLeaders] = useState(false);

  // Long-press state for logo
  const [showBindDialog, setShowBindDialog] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);

  const handleLongPressStart = useCallback(() => {
    setIsLongPressing(true);
    longPressTimer.current = setTimeout(async () => {
      setIsLongPressing(false);
      if (!lineUserId || !supabase) {
        toast.error("無法取得您的身分資訊");
        return;
      }

      try {
        const res = await fetch(`/api/leaders?action=check_status&lineUserId=${encodeURIComponent(lineUserId)}`);
        const result = await res.json();
        const existingLeader = result.leader;

        if (existingLeader) {
          toast.success("歡迎回來，團購主！");
          onSelect(existingLeader.Username);
        } else {
          setShowBindDialog(true);
        }
      } catch (err) {
        toast.error("驗證失敗，請稍待後再試");
      }
    }, 1000); // 1.0 seconds
  }, [lineUserId, onSelect]);

  const handleLongPressEnd = useCallback(() => {
    setIsLongPressing(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleBindSuccess = (username: string) => {
    setShowBindDialog(false);
    onSelect(username);
  };

  useEffect(() => {
    // Attempt to get user location
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Geolocation error:", error);
          // Don't toast error for location denial, just proceed with normal sorting
        }
      );
    }

    async function fetchLeaders() {
      try {
        const res = await fetch('/api/leaders');
        const result = await res.json();

        if (!res.ok || !result.success) {
          console.error("Error fetching leaders:", result.error);
          toast.error("無法載入團購主列表");
        } else {
          const data = result.data || [];
          const formattedData = (data as any[]).map(item => ({
            id: item.id,
            name: item.name,
            avatar_url: item.avatar_url,
            store_name: item.store_name,
            station_code: item.station_code,
            username: item.username,
            latitude: item.latitude,
            longitude: item.longitude,
            address: item.address,
            LineID: item.LineID
          }))
            .filter(item => item.LineID && item.LineID.trim() !== ""); // Keep only bound leaders
          setLeaders(formattedData);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        toast.error("載入失敗");
      } finally {
        setLoading(false);
      }
    }

    fetchLeaders();
  }, []);

  // Update filtered and sorted leaders based on search and user position
  useEffect(() => {
    let result = [...leaders];

    // 1. Calculate distances if user location is available
    if (userCoords) {
      result = result.map(leader => {
        if (leader.latitude && leader.longitude) {
          return {
            ...leader,
            distance: calculateDistance(userCoords.lat, userCoords.lng, leader.latitude, leader.longitude)
          };
        }
        return leader;
      });
    }

    // 2. Apply search filter
    const query = searchQuery.toLowerCase();
    if (query) {
      result = result.filter(
        (leader) =>
          leader.name.toLowerCase().includes(query) ||
          (leader.store_name && leader.store_name.toLowerCase().includes(query))
      );
    }

    // 3. Sort
    result.sort((a, b) => {
      // If both have distances, sort by distance ascending
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      // If only one has distance, prioritize it
      if (a.distance !== undefined) return -1;
      if (b.distance !== undefined) return 1;
      // Default fallback
      return a.name.localeCompare(b.name, "zh-Hant");
    });

    setFilteredLeaders(result);
  }, [searchQuery, leaders, userCoords]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 relative pb-10 bg-[url('/ocean-bg.png')] bg-cover bg-fixed bg-center">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#00519E]/95 to-[#003B7E]/95 backdrop-blur-md rounded-b-[40px] pt-12 pb-16 px-6 relative overflow-hidden shadow-lg shadow-[#003B7E]/20">
        {/* Interactive Logo on the Right */}
        <div
          className={`absolute right-[-10px] top-[-5px] transition-all duration-150 transform rotate-12 select-none cursor-pointer z-20 ${isLongPressing
            ? "animate-strobe-glow"
            : "scale-100 drop-shadow-2xl opacity-90"
            }`}
          style={{ WebkitTapHighlightColor: 'transparent' }}
          onTouchStart={handleLongPressStart}
          onTouchEnd={handleLongPressEnd}
          onTouchCancel={handleLongPressEnd}
          onMouseDown={handleLongPressStart}
          onMouseUp={handleLongPressEnd}
          onMouseLeave={handleLongPressEnd}
          onContextMenu={(e) => e.preventDefault()}
        >
          <Image
            src="/mall-icon.png"
            alt="CPC Mall"
            width={160}
            height={160}
            className="pointer-events-none"
            draggable={false}
            priority
          />
        </div>

        <div className="relative z-10 flex flex-col justify-end min-h-[107px]">
          <h1 className="text-[28px] sm:text-[30px] font-black text-white leading-tight tracking-tight drop-shadow-sm">
            中油PAY行動商城
          </h1>
          <p className="text-blue-100/90 text-[15px] font-medium mt-1">
            {userCoords ? "為您推薦距離最近的取貨據點" : "找你愛的站點，輕鬆到站取貨"}
          </p>
        </div>
      </div>

      {/* Overlapping Search Bar */}
      <div className="px-5 -mt-8 relative z-20">
        <div className="relative group mx-auto max-w-md">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600 text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <Input
            type="text"
            placeholder="搜尋姓名或站名稱..."
            className="pl-12 pr-4 h-[60px] w-full rounded-2xl border-none bg-white/80 backdrop-blur-xl shadow-xl shadow-slate-950/10 focus-visible:ring-4 focus-visible:ring-blue-100/50 text-base font-medium transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="container mx-auto px-5 max-w-md mt-6">
        {filteredLeaders.slice(0, showAllLeaders ? undefined : 5).map((leader) => (
          <div
            key={leader.id}
            onClick={() => onSelect(leader.username)}
            className="group relative cursor-pointer active:scale-95 transition-all duration-300"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-[24px] opacity-0 group-hover:opacity-10 transition duration-300"></div>
            <Card className="relative overflow-hidden border border-slate-100 bg-white rounded-[20px] shadow-sm hover:shadow-md transition-all duration-300">
              <div className="pt-0.5 pb-0.5 px-4 flex flex-col gap-3">

                {/* 1. Header Row (Identity) */}
                <div className="flex items-center gap-3">
                  {/* Left: Avatar */}
                  <div className="relative shrink-0">
                    <Avatar className="h-14 w-14 border-2 border-white shadow-sm shrink-0">
                      <AvatarImage src={leader.avatar_url || "/leader-avatar.png"} className="object-cover" />
                      <AvatarFallback className="bg-slate-100 text-slate-500 font-bold text-lg">
                        {leader.name.slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Middle: Text Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="inline-flex items-center gap-1.5 mb-0.5">
                      <span className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wide">
                        團購主
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-slate-900 leading-tight truncate">
                      {leader.name}
                    </h3>
                  </div>

                  {/* Right: Select Button */}
                  <div className="shrink-0">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3 h-9 font-bold shadow-sm shadow-blue-200"
                    >
                      選我
                    </Button>
                  </div>
                </div>

                {/* Separator */}
                <div className="h-px bg-slate-50 w-full" />

                {/* 2. Middle Row (Context: Location) */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-blue-600">
                      <Fuel className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                      <span className="font-bold text-slate-700 truncate text-[14px]">
                        {leader.store_name || "中油加油站"}
                      </span>
                      {leader.distance !== undefined && (
                        <span className="text-slate-400 text-xs whitespace-nowrap font-medium shrink-0">
                          | 距您 {leader.distance.toFixed(1)} km
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 3. Footer Row (Detail: Address) */}
                  <div className="flex items-start gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 text-slate-400">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0 py-0.5">
                      <p className="text-[13px] text-slate-500 leading-snug break-words">
                        取貨地址：{leader.address || "請洽團購主確認"}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </Card>
          </div>
        ))}

        {!showAllLeaders && filteredLeaders.length > 5 && (
          <Button
            variant="outline"
            className="w-full h-12 rounded-2xl border-slate-200 text-slate-500 font-bold hover:bg-slate-50 hover:text-blue-600 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              setShowAllLeaders(true);
            }}
          >
            展開顯示更多站點 ({filteredLeaders.length - 5})
          </Button>
        )}

        {filteredLeaders.length === 0 && (
          <div className="text-center py-20 bg-white/50 rounded-[2rem] border-2 border-dashed border-slate-200">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">找不到符合條件的團購主</p>
            <Button
              variant="link"
              className="text-blue-600 mt-2 font-bold"
              onClick={() => setSearchQuery("")}
            >
              顯示全部
            </Button>
          </div>
        )}
      </div>

      {/* App Download Footer */}
      <div className="mt-4 mb-8 px-5 max-w-md mx-auto">
        <div className="px-4 py-5 bg-white/70 backdrop-blur-lg rounded-3xl border border-white/20 shadow-sm">
          <div className="flex items-center gap-3 mb-4 justify-center">
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <Smartphone className="h-6 w-6" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-800 text-lg leading-tight">還沒安裝中油Pay嗎？</h3>
              <p className="text-xs text-slate-500 font-medium">現在下載，享受更便利的服務</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <a
              href="https://play.google.com/store/apps/details?id=com.cpc.cpcpay&hl=zh_TW"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform hover:scale-105 active:scale-95"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                alt="Get it on Google Play"
                className="h-10 w-auto"
              />
            </a>
            <a
              href="https://apps.apple.com/tw/app/%E4%B8%AD%E6%B2%B9pay/id1475467410"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform hover:scale-105 active:scale-95"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                alt="Download on the App Store"
                className="h-10 w-auto"
              />
            </a>
          </div>
        </div>
      </div>

      {/* Leader Bind Dialog */}
      {lineUserId && (
        <LeaderBindDialog
          open={showBindDialog}
          onOpenChange={setShowBindDialog}
          lineUserId={lineUserId}
          userAvatar={userAvatar}
          displayName={displayName}
          onBindSuccess={handleBindSuccess}
        />
      )}
    </div>
  );
}
