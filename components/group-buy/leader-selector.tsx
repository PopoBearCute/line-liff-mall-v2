"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search } from "lucide-react";
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
}

interface LeaderSelectorProps {
  onSelect: (leaderId: string, mode?: string) => void;
  lineUserId?: string; // Current user's LINE ID for binding
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

export function LeaderSelector({ onSelect, lineUserId }: LeaderSelectorProps) {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [filteredLeaders, setFilteredLeaders] = useState<Leader[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

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

      // Check if this LINE ID is already bound
      const { data: existingLeader } = await supabase
        .from("GroupLeaders")
        .select("Username")
        .eq("LineID", lineUserId)
        .single();

      if (existingLeader) {
        toast.success("歡迎回來，團購主！");
        onSelect(existingLeader.Username, "seed");
      } else {
        setShowBindDialog(true);
      }
    }, 2000); // 2 seconds
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
    onSelect(username, "seed");
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
        if (!supabase) {
          console.error("Supabase client not initialized");
          toast.error("系統錯誤：無法連接資料庫");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("GroupLeaders")
          .select("id, name:團主名稱, avatar_url, store_name:加油站, station_code:站代號, username:Username, latitude:緯度, longitude:經度, address:指定地址")
          .eq("IsGroupLeader", "Yes");

        if (error) {
          console.error("Error fetching leaders:", error);
          toast.error("無法載入團購主列表");
        } else {
          const formattedData = (data as any[]).map(item => ({
            id: item.id,
            name: item.name,
            avatar_url: item.avatar_url,
            store_name: item.store_name,
            station_code: item.station_code,
            username: item.username,
            latitude: item.latitude,
            longitude: item.longitude,
            address: item.address
          }));
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
    <div className="container mx-auto p-4 max-w-md min-h-screen bg-transparent">
      {/* Logo with long-press trigger */}
      <div className="flex justify-center pt-6 mb-2">
        <div
          className={`relative select-none cursor-pointer transition-transform duration-300 ${isLongPressing ? "scale-90 opacity-70" : "scale-100"
            }`}
          onTouchStart={handleLongPressStart}
          onTouchEnd={handleLongPressEnd}
          onTouchCancel={handleLongPressEnd}
          onMouseDown={handleLongPressStart}
          onMouseUp={handleLongPressEnd}
          onMouseLeave={handleLongPressEnd}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="bg-white p-2 rounded-full shadow-lg border border-slate-100">
            <Image
              src="/mall-icon.png"
              alt="CPC Mall"
              width={80}
              height={80}
              className="rounded-full pointer-events-none"
              draggable={false}
              priority
            />
          </div>
          {isLongPressing && (
            <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping" />
          )}
        </div>
      </div>

      <div className="text-center mb-8 px-4">
        <h1 className="text-3xl font-extrabold mb-3 tracking-tight text-slate-800">選擇團購主</h1>
        <p className="text-slate-500 text-sm font-medium">
          {userCoords ? "已根據您的位置推薦鄰近站點" : "請選擇您所屬的團購主以進入賣場"}
        </p>
      </div>

      <div className="relative mb-8 group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500 text-slate-400">
          <Search className="h-5 w-5" />
        </div>
        <Input
          type="text"
          placeholder="搜尋姓名或加油站名稱..."
          className="pl-12 pr-4 h-14 w-full rounded-2xl border-none bg-white shadow-xl shadow-slate-200/50 focus-visible:ring-2 focus-visible:ring-blue-500/20 text-base"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-4 pb-20">
        {filteredLeaders.map((leader) => (
          <div
            key={leader.id}
            onClick={() => onSelect(leader.username)}
            className="group relative cursor-pointer active:scale-95 transition-all duration-300"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-[24px] opacity-0 group-hover:opacity-10 transition duration-300"></div>
            <Card className="relative overflow-hidden border border-slate-100 bg-white rounded-[20px] shadow-sm hover:shadow-md transition-all duration-300">
              <div className="p-4 flex flex-col gap-3">

                {/* 1. Header Row (Identity) */}
                <div className="flex items-center gap-4">
                  {/* Left: Avatar */}
                  <div className="relative shrink-0">
                    <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
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
                    <h3 className="font-bold text-lg text-slate-900 leading-tight truncate">
                      {leader.name}
                    </h3>
                  </div>

                  {/* Right: Select Button */}
                  <div className="shrink-0">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 font-bold shadow-sm shadow-blue-200"
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
                      {/* Gas Station Icon */}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 22v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8" />
                        <path d="M3 12a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2" />
                        <path d="M12 2v2" />
                        <path d="M3 22h18" />
                      </svg>
                    </div>
                    <div className="flex items-baseline gap-2 overflow-hidden">
                      <span className="font-bold text-slate-700 truncate text-[15px]">
                        {leader.store_name || "中油加油站"}
                      </span>
                      {leader.distance !== undefined && (
                        <span className="text-slate-400 text-xs whitespace-nowrap font-medium">
                          | 距您 {leader.distance.toFixed(1)} km
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 3. Footer Row (Detail: Address) */}
                  <div className="flex items-start gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 text-slate-400">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0 py-1.5">
                      <p className="text-sm text-slate-500 leading-snug break-words">
                        取貨地址：{leader.address || "請洽團購主確認"}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </Card>
          </div>
        ))}

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

      {/* Leader Bind Dialog */}
      {lineUserId && (
        <LeaderBindDialog
          open={showBindDialog}
          onOpenChange={setShowBindDialog}
          lineUserId={lineUserId}
          onBindSuccess={handleBindSuccess}
        />
      )}
    </div>
  );
}
