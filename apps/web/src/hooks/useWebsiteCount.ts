import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";

const API_BASE = "/api";

export function useWebsiteCount(): { count: number; loading: boolean } {
  const { getToken } = useAuth();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchCount() {
      const token = await getToken();
      if (!token) {
        if (!cancelled) {
          setLoading(false);
          setCount(0);
        }
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/websites`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!cancelled && res.ok) {
          const list = data.websites ?? [];
          setCount(list.length);
        } else if (!cancelled) {
          setCount(0);
        }
      } catch {
        if (!cancelled) setCount(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchCount();
    return () => { cancelled = true; };
  }, [getToken]);

  return { count, loading };
}
