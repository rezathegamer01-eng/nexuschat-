'use client';
// Measures real network latency by timing a fetch to /api/ping
// and classifies quality into 4 tiers.
import { useState, useEffect, useRef } from 'react';

export type NetQuality = 'excellent' | 'good' | 'poor' | 'offline';

export interface NetStats {
  quality: NetQuality;
  latencyMs: number | null;
  label: string;
  color: string;
  barHeights: [number, number, number, number]; // signal bar heights (4 bars)
}

function classify(ms: number | null): NetQuality {
  if (ms === null) return 'offline';
  if (ms < 80)  return 'excellent';
  if (ms < 200) return 'good';
  return 'poor';
}

const META: Record<NetQuality, Omit<NetStats, 'quality' | 'latencyMs'>> = {
  excellent: { label: 'Excellent',  color: '#23a559', barHeights: [4, 7, 11, 15] },
  good:      { label: 'Good',       color: '#f0b232', barHeights: [4, 7, 11,  4] },
  poor:      { label: 'Poor',       color: '#f23f43', barHeights: [4, 7,  4,  4] },
  offline:   { label: 'No Signal',  color: '#80848e', barHeights: [4, 4,  4,  4] },
};

export function useNetworkQuality(intervalMs = 5000): NetStats {
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const measure = async () => {
    try {
      const t0 = performance.now();
      await fetch('/api/ping', { cache: 'no-store' });
      const ms = Math.round(performance.now() - t0);
      setLatencyMs(ms);
    } catch {
      setLatencyMs(null);
    }
  };

  useEffect(() => {
    measure();
    timerRef.current = setInterval(measure, intervalMs);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [intervalMs]);

  const quality = classify(latencyMs);
  return { quality, latencyMs, ...META[quality] };
}
