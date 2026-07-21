'use client';
import { useP2PStore } from '@/lib/p2p-store';
import { X, Wifi, Activity, Signal, Zap } from 'lucide-react';

function LatencyBar({ ms }: { ms: number }) {
  const max = 500;
  const pct = Math.min((ms / max) * 100, 100);
  const color = ms < 80 ? '#23a559' : ms < 200 ? '#f0b232' : '#f23f43';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#313338' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-mono font-bold w-14 text-right" style={{ color }}>{ms} ms</span>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#1e1f22' }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}22` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <div className="text-xs" style={{ color: '#72767d' }}>{label}</div>
        <div className="text-sm font-bold text-white">{value}</div>
      </div>
    </div>
  );
}

export function StatsPanel() {
  const { peers, toggleStats } = useP2PStore();
  const peerList = Object.values(peers);

  const avgLatency = peerList.length
    ? Math.round(peerList.reduce((a, p) => a + (p.stats?.latencyMs ?? 0), 0) / peerList.length)
    : 0;

  const connected = peerList.filter(p => p.connectionState === 'connected').length;

  return (
    <div className="flex flex-col flex-shrink-0"
      style={{ width: 280, background: '#2b2d31', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="font-bold text-white text-sm">Connection Stats</span>
        <button onClick={toggleStats} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10">
          <X size={14} style={{ color: '#96989d' }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto dc-scrollbar px-3 py-3 flex flex-col gap-3">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Peers" value={`${connected}/${peerList.length}`} icon={Wifi} color="#5865f2" />
          <StatCard label="Avg Latency" value={avgLatency ? `${avgLatency}ms` : '—'} icon={Zap} color={avgLatency < 80 ? '#23a559' : avgLatency < 200 ? '#f0b232' : '#f23f43'} />
        </div>

        {/* P2P info */}
        <div className="p-3 rounded-xl" style={{ background: 'rgba(35,165,89,0.1)', border: '1px solid rgba(35,165,89,0.2)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Signal size={14} style={{ color: '#23a559' }} />
            <span className="text-xs font-bold" style={{ color: '#23a559' }}>Direct P2P</span>
          </div>
          <p className="text-xs" style={{ color: '#96989d' }}>
            Your connection goes directly to peers — no relay server for media. Lower latency, fully private.
          </p>
        </div>

        {/* Per-peer breakdown */}
        {peerList.length === 0 && (
          <div className="flex flex-col items-center py-8 gap-2 opacity-50">
            <span className="text-3xl">📡</span>
            <p className="text-sm" style={{ color: '#96989d' }}>Waiting for peers…</p>
          </div>
        )}

        {peerList.map(peer => {
          const colors = ['#5865f2','#23a559','#f0b232','#f23f43','#eb459e'];
          const idx = peer.id.charCodeAt(peer.id.length - 1) % colors.length;
          const color = colors[idx];
          return (
            <div key={peer.id} className="rounded-xl p-3" style={{ background: '#1e1f22' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: color }}>
                  {peer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{peer.name}</div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full"
                      style={{ background: peer.connectionState === 'connected' ? '#23a559' : '#f23f43' }} />
                    <span className="text-xs capitalize" style={{ color: '#72767d' }}>{peer.connectionState}</span>
                  </div>
                </div>
              </div>

              {peer.stats ? (
                <div className="flex flex-col gap-2">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs" style={{ color: '#72767d' }}>Latency</span>
                    </div>
                    <LatencyBar ms={peer.stats.latencyMs} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span style={{ color: '#72767d' }}>Type</span>
                      <div className="font-medium text-white mt-0.5 capitalize">{peer.stats.connectionType}</div>
                    </div>
                    <div>
                      <span style={{ color: '#72767d' }}>Packet Loss</span>
                      <div className="font-medium mt-0.5" style={{ color: peer.stats.packetLoss > 5 ? '#f23f43' : '#23a559' }}>
                        {peer.stats.packetLoss}%
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: '#5865f2', borderTopColor: 'transparent' }} />
                  <span className="text-xs" style={{ color: '#72767d' }}>Measuring…</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
