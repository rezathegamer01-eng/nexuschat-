'use client';
import { useState, useEffect } from 'react';
import { useDiscordStore } from '@/lib/discord-store';
import { Plus, Compass, Download, ShieldCheck, ShieldOff, Lock } from 'lucide-react';
import { useNetworkQuality } from '@/hooks/useNetworkQuality';

// ── E2E Encryption badge ──────────────────────────────────────────────────────
// Simulates ECDH key-exchange status: on mount it "negotiates" for 1.2s
// then settles to 'active'. In a real app this would reflect your actual
// crypto handshake state.
type E2EState = 'negotiating' | 'active' | 'inactive';

function E2EBadge() {
  const [state, setState] = useState<E2EState>('negotiating');
  const [pulse, setPulse] = useState(false);

  // Simulate key-exchange on mount
  useEffect(() => {
    const t = setTimeout(() => setState('active'), 1200);
    return () => clearTimeout(t);
  }, []);

  // Subtle heartbeat pulse every 4 s while active
  useEffect(() => {
    if (state !== 'active') return;
    const id = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    }, 4000);
    return () => clearInterval(id);
  }, [state]);

  const cfg = {
    negotiating: { bg: '#2c2e36', ring: '#f0b232', icon: Lock,         iconColor: '#f0b232', label: 'Negotiating…' },
    active:      { bg: '#1a2e22', ring: '#23a559', icon: ShieldCheck,   iconColor: '#23a559', label: 'E2E Encrypted' },
    inactive:    { bg: '#2e1a1a', ring: '#f23f43', icon: ShieldOff,     iconColor: '#f23f43', label: 'Not Encrypted' },
  }[state];

  const Icon = cfg.icon;

  return (
    <div className="relative flex items-center justify-center group mb-1">
      {/* Icon button */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center cursor-default transition-all duration-300"
        style={{
          background: cfg.bg,
          boxShadow: `0 0 0 2px ${cfg.ring}${pulse ? '99' : '44'}`,
          transform: pulse ? 'scale(1.08)' : 'scale(1)',
          transition: 'box-shadow 300ms ease, transform 300ms ease',
        }}
        aria-label={cfg.label}
      >
        {state === 'negotiating' ? (
          <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#f0b232', borderTopColor: 'transparent' }} />
        ) : (
          <Icon size={18} style={{ color: cfg.iconColor }} strokeWidth={2} />
        )}
      </div>

      {/* Tooltip */}
      <div className="absolute left-12 bottom-0 hidden group-hover:flex flex-col z-50 pointer-events-none"
        style={{ minWidth: 200 }}>
        <div className="bg-[#111214] rounded-lg shadow-xl px-3 py-2.5"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Arrow */}
          <div className="absolute -left-1.5 bottom-3 w-0 h-0 border-t-4 border-b-4 border-r-4
            border-transparent border-r-[#111214]" />

          {/* Title row */}
          <div className="flex items-center gap-2 mb-1.5">
            <Icon size={14} style={{ color: cfg.iconColor }} />
            <span className="text-sm font-bold" style={{ color: cfg.iconColor }}>{cfg.label}</span>
          </div>

          {/* Description */}
          {state === 'active' && (
            <p className="text-xs leading-relaxed mb-2" style={{ color: '#96989d' }}>
              All messages and P2P streams are protected with{' '}
              <span className="font-semibold text-white">ECDH + AES-256-GCM</span>.
              Keys never leave your device.
            </p>
          )}
          {state === 'negotiating' && (
            <p className="text-xs leading-relaxed mb-2" style={{ color: '#96989d' }}>
              Performing key exchange with peers…
            </p>
          )}
          {state === 'inactive' && (
            <p className="text-xs leading-relaxed mb-2" style={{ color: '#96989d' }}>
              Encryption could not be established.
            </p>
          )}

          {/* Detail rows */}
          <div className="flex flex-col gap-1 pt-1.5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { k: 'Key exchange',  v: 'ECDH P-256' },
              { k: 'Cipher',        v: 'AES-256-GCM' },
              { k: 'Forward secrecy', v: 'Yes — per session' },
            ].map(r => (
              <div key={r.k} className="flex items-center justify-between gap-4">
                <span className="text-xs" style={{ color: '#72767d' }}>{r.k}</span>
                <span className="text-xs font-mono font-medium text-white">{r.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Four animated signal bars + latency tooltip */
function NetworkQualityBadge() {
  const { quality, latencyMs, label, color, barHeights } = useNetworkQuality();

  const barColors = barHeights.map((_, i) => {
    // bars light up left-to-right based on quality tier
    const lit = quality === 'excellent' ? 4
               : quality === 'good'      ? 3
               : quality === 'poor'      ? 2
               : 1; // offline — all dim
    return i < lit ? color : 'rgba(255,255,255,0.15)';
  });

  return (
    <div className="relative flex items-center justify-center group mt-auto mb-2">
      {/* Badge button */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-end pr-1.5 cursor-default"
        style={{ background: '#313338', gap: 2 }}
        aria-label={`Network: ${label}`}
      >
        {barHeights.map((h, i) => (
          <div
            key={i}
            className="rounded-sm transition-all duration-500"
            style={{
              width: 3,
              height: h,
              background: barColors[i],
              alignSelf: 'flex-end',
              marginBottom: 2,
            }}
          />
        ))}
      </div>

      {/* Tooltip */}
      <div className="absolute left-12 bottom-0 hidden group-hover:flex flex-col z-50 pointer-events-none"
        style={{ minWidth: 160 }}>
        <div className="bg-[#111214] rounded-lg shadow-xl px-3 py-2.5"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Arrow */}
          <div className="absolute -left-1.5 bottom-3 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-[#111214]" />

          <div className="flex items-center gap-2 mb-1">
            {/* Inline bars (mini) */}
            <div className="flex items-end gap-0.5 h-3">
              {barHeights.map((h, i) => (
                <div key={i} className="rounded-sm"
                  style={{ width: 3, height: h * 0.7, background: barColors[i], alignSelf: 'flex-end' }} />
              ))}
            </div>
            <span className="text-sm font-bold" style={{ color }}>{label}</span>
          </div>

          <div className="text-xs" style={{ color: '#96989d' }}>
            {latencyMs !== null
              ? <>Ping: <span className="font-mono font-semibold" style={{ color }}>{latencyMs} ms</span></>
              : 'Unable to reach server'}
          </div>

          <div className="mt-1.5 pt-1.5 flex flex-col gap-0.5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { tier: 'Excellent', range: '< 80 ms',  c: '#23a559' },
              { tier: 'Good',      range: '80–200 ms', c: '#f0b232' },
              { tier: 'Poor',      range: '> 200 ms',  c: '#f23f43' },
            ].map(r => (
              <div key={r.tier} className="flex items-center justify-between gap-4">
                <span className="text-xs font-medium" style={{ color: r.c }}>{r.tier}</span>
                <span className="text-xs font-mono" style={{ color: '#72767d' }}>{r.range}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ServerIcon({ server, active, onClick }: {
  server: { id: string; name: string; acronym: string; color: string; isHome?: boolean };
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div className="relative flex items-center justify-center group mb-1" onClick={onClick}>
      {/* Active pill indicator */}
      <div className={`server-pill transition-all duration-150 ${active ? 'h-10' : 'h-0 group-hover:h-5'}`}
        style={{ position: 'absolute', left: 0, width: 4, background: '#fff', borderRadius: '0 4px 4px 0' }} />
      
      {/* Icon */}
      <div
        className={`w-12 h-12 flex items-center justify-center cursor-pointer select-none font-bold text-sm transition-all duration-150 ${
          active ? 'rounded-2xl' : 'rounded-full group-hover:rounded-2xl'
        }`}
        style={{ background: active ? server.color : '#313338', color: active ? '#fff' : '#dcddde' }}
      >
        {server.isHome ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
        ) : (
          <span className="text-base">{server.acronym}</span>
        )}
      </div>
      
      {/* Tooltip */}
      <div className="absolute left-16 hidden group-hover:flex items-center z-50 pointer-events-none">
        <div className="bg-[#111214] text-white text-sm font-semibold px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
          {server.name}
          <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-[#111214]" />
        </div>
      </div>
    </div>
  );
}

export function ServerSidebar() {
  const { servers, activeServerId, setActiveServer } = useDiscordStore();

  return (
    <div
      className="flex flex-col items-center py-3 gap-0.5 overflow-y-auto dc-scrollbar flex-shrink-0"
      style={{ width: 72, background: '#1e1f22', minHeight: '100vh', height: '100vh' }}
    >
      {/* Home / DM button */}
      {servers.filter(s => s.isHome).map(server => (
        <ServerIcon
          key={server.id}
          server={server}
          active={activeServerId === server.id}
          onClick={() => setActiveServer(server.id)}
        />
      ))}

      {/* Separator */}
      <div className="w-8 h-0.5 rounded-full my-1" style={{ background: 'rgba(255,255,255,0.1)' }} />

      {/* Server list */}
      {servers.filter(s => !s.isHome).map(server => (
        <ServerIcon
          key={server.id}
          server={server}
          active={activeServerId === server.id}
          onClick={() => setActiveServer(server.id)}
        />
      ))}

      {/* Add Server */}
      <div className="relative flex items-center justify-center group mb-1 mt-1">
        <div
          className="w-12 h-12 flex items-center justify-center cursor-pointer select-none font-bold transition-all duration-150 rounded-full group-hover:rounded-2xl"
          style={{ background: '#313338', color: '#23a559' }}
          onClick={() => {}}
        >
          <Plus size={22} />
        </div>
        <div className="absolute left-16 hidden group-hover:flex items-center z-50 pointer-events-none">
          <div className="bg-[#111214] text-[#23a559] text-sm font-semibold px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
            Add a Server
            <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-[#111214]" />
          </div>
        </div>
      </div>

      {/* Discover */}
      <div className="relative flex items-center justify-center group mb-1">
        <div
          className="w-12 h-12 flex items-center justify-center cursor-pointer select-none transition-all duration-150 rounded-full group-hover:rounded-2xl"
          style={{ background: '#313338', color: '#23a559' }}
        >
          <Compass size={22} />
        </div>
        <div className="absolute left-16 hidden group-hover:flex items-center z-50 pointer-events-none">
          <div className="bg-[#111214] text-white text-sm font-semibold px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
            Explore Public Servers
            <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-[#111214]" />
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="w-8 h-0.5 rounded-full my-1" style={{ background: 'rgba(255,255,255,0.1)' }} />

      {/* Download apps */}
      <div className="relative flex items-center justify-center group mb-1">
        <div
          className="w-12 h-12 flex items-center justify-center cursor-pointer transition-all duration-150 rounded-full group-hover:rounded-2xl"
          style={{ background: '#313338', color: '#5865f2' }}
        >
          <Download size={20} />
        </div>
        <div className="absolute left-16 hidden group-hover:flex items-center z-50 pointer-events-none">
          <div className="bg-[#111214] text-white text-sm font-semibold px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
            Download Apps
            <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-[#111214]" />
          </div>
        </div>
      </div>

      {/* Spacer pushes badges to bottom */}
      <div className="flex-1" />

      {/* E2E encryption badge */}
      <E2EBadge />

      {/* Thin separator between badges */}
      <div className="w-8 h-0.5 rounded-full my-0.5" style={{ background: 'rgba(255,255,255,0.08)' }} />

      {/* Network quality indicator */}
      <NetworkQualityBadge />
    </div>
  );
}
