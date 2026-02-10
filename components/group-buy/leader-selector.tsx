"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Leader {
  id: string;
  name: string;
  avatar_url?: string;
  store_name?: string;
  station_code?: string;
  username: string; // The leaderId used in the app
  latitude?: number;
  longitude?: number;
}

interface LeaderSelectorProps {
  onSelect: (leaderId: string) => void;
}

export function LeaderSelector({ onSelect }: LeaderSelectorProps) {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [filteredLeaders, setFilteredLeaders] = useState<Leader[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          .select("id, name:團主名稱, avatar_url, store_name:加油站, station_code:站代號, username:Username, latitude:緯度, longitude:經度")
          .eq("IsGroupLeader", "Yes"); // Default is 'Yes' even if column hidden

        if (error) {
          console.error("Error fetching leaders:", error);
          toast.error("無法載入團購主列表");
        } else {
          // Type assertion to handle the aliased response
          const formattedData = (data as any[]).map(item => ({
            id: item.id,
            name: item.name,
            avatar_url: item.avatar_url,
            store_name: item.store_name,
            station_code: item.station_code,
            username: item.username,
            latitude: item.latitude, // Available for map features
            longitude: item.longitude
          }));
          setLeaders(formattedData);
          setFilteredLeaders(formattedData);
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

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = leaders.filter(
      (leader) =>
        leader.name.toLowerCase().includes(query) ||
        (leader.store_name && leader.store_name.toLowerCase().includes(query))
    );
    setFilteredLeaders(filtered);
  }, [searchQuery, leaders]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-md min-h-screen bg-gray-50/50">
      <div className="text-center mb-8 pt-8">
        <h1 className="text-2xl font-bold mb-2">選擇團購主</h1>
        <p className="text-muted-foreground text-sm">請選擇您所屬的團購主以進入賣場</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜尋姓名或門店..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-white"
        />
      </div>

      <div className="grid gap-3 pb-8">
        {filteredLeaders.map((leader) => (
          <Card
            key={leader.id}
            className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md active:scale-95"
            onClick={() => onSelect(leader.username)}
          >
            <CardHeader className="flex flex-row items-center gap-4 p-4">
              <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                <AvatarImage src={leader.avatar_url} alt={leader.name} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {leader.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base truncate">{leader.name}</CardTitle>
                {leader.store_name && (
                  <CardDescription className="truncate">{leader.store_name}</CardDescription>
                )}
              </div>
              <Button size="sm" variant="ghost" className="shrink-0 text-primary">
                選擇
              </Button>
            </CardHeader>
          </Card>
        ))}
        {filteredLeaders.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground bg-white rounded-lg border border-dashed">
            <p>沒有找到符合的團購主</p>
          </div>
        )}
      </div>
    </div>
  );
}
