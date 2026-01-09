import { useQuery } from "@tanstack/react-query";
import type { PlexFriend } from "@/types/friend";

interface FriendsResponse {
  success: boolean;
  friends: PlexFriend[];
}

export function useFriends() {
  return useQuery({
    queryKey: ["friends"],
    queryFn: async (): Promise<FriendsResponse> => {
      const response = await fetch("/api/plex/friends");
      if (!response.ok) {
        throw new Error("Failed to fetch friends");
      }
      return response.json();
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - data stays fresh
    gcTime: 60 * 60 * 1000, // 1 hour - keep in cache even when unmounted
  });
}
