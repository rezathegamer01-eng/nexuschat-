'use client';
import { useEffect, useRef } from 'react';
import { useP2PStore, RoomPeer } from '@/lib/p2p-store';
import { Mic, MicOff, Video, VideoOff, Monitor, Pin, Maximize2 } from 'lucide-react';

function VideoTile({
  stream, name, peerId, muted: isMuted, videoOff, screenSharing,
  isLocal, isSpotlight, onSpotlight, latency, connectionState,
}: {
  stream?: MediaStream; name: string; peerId: string;
  muted: boolean; videoOff: boolean; screenSharing: boolean;
  isLocal: boolean; isSpotlight: boolean;
  onSpotlight: (id: string | null) => void;
  latency?: number; connectionState?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const colors = ['#5865f2','#23a559','#f0b232','#f23f43','#eb459e'];
  const color = colors[peerId.charCodeAt(peerId.length - 1) % colors.length];
  const initials = name.slice(0, 2).toUpperCase();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideo = stream && !videoOff && stream.getVideoTracks().length > 0;

  return (
    <div
      className="relative rounded-xl overflow-hidden flex items-center justify-center group cursor-pointer"
      style={{
        background: '#1e1f22',
        border: isSpotlight ? '2px solid #5865f2' : '2px solid transparent',
        aspectRatio: '16/9',
      }}
      onClick={() => onSpotlight(isSpotlight ? null : peerId)}
    >
      {/* Video element */}
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full gap-3">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
            style={{ background: color }}>
            {initials}
          </div>
          <span className="text-sm font-medium" style={{ color: '#dcddde' }}>{name}</span>
        </div>
      )}

      {/* Name + status bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2"
        style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white truncate max-w-[120px]">{name}</span>
          {isLocal && <span className="text-xs px-1 rounded" style={{ background: '#5865f2', color: '#fff' }}>You</span>}
          {screenSharing && (
            <span className="flex items-center gap-1 text-xs px-1 rounded" style={{ background: '#23a559', color: '#fff' }}>
              <Monitor size={10} /> Screen
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {latency !== undefined && (
            <span className="text-xs px-1.5 py-0.5 rounded font-mono"
              style={{
                background: latency < 80 ? 'rgba(35,165,89,0.8)' : latency < 200 ? 'rgba(240,178,50,0.8)' : 'rgba(242,63,67,0.8)',
                color: '#fff',
              }}>
              {latency}ms
            </span>
          )}
          {isMuted ? (
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(242,63,67,0.85)' }}>
              <MicOff size={12} className="text-white" />
            </div>
          ) : null}
          {videoOff && (
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
              <VideoOff size={12} style={{ color: '#96989d' }} />
            </div>
          )}
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1">
        <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={e => { e.stopPropagation(); onSpotlight(isSpotlight ? null : peerId); }}>
          <Maximize2 size={14} className="text-white" />
        </button>
      </div>

      {/* Connection state badge */}
      {connectionState && connectionState !== 'connected' && (
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#5865f2', borderTopColor: 'transparent' }} />
            <span className="text-xs text-white capitalize">{connectionState}…</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function VideoGrid() {
  const {
    peers, myPeerId, myName, localStream, audioEnabled, videoEnabled,
    screenSharing, screenStream, layout, spotlightPeerId, setSpotlight,
  } = useP2PStore();

  const peerList = Object.values(peers);
  const total = peerList.length + 1; // +1 for self

  const gridCols = total <= 1 ? 1 : total <= 4 ? 2 : total <= 9 ? 3 : 4;

  const spotlightPeer = spotlightPeerId
    ? (spotlightPeerId === 'me' ? null : peers[spotlightPeerId])
    : null;

  if (layout === 'spotlight' && spotlightPeerId) {
    const isMe = spotlightPeerId === 'me';
    return (
      <div className="flex gap-3 h-full p-3">
        {/* Main spotlight */}
        <div className="flex-1 min-w-0">
          <VideoTile
            stream={isMe ? (screenSharing ? screenStream ?? undefined : localStream ?? undefined) : spotlightPeer?.stream}
            name={isMe ? myName : spotlightPeer?.name || 'Peer'}
            peerId={spotlightPeerId}
            muted={isMe ? !audioEnabled : (spotlightPeer?.audioMuted ?? false)}
            videoOff={isMe ? !videoEnabled : (spotlightPeer?.videoMuted ?? false)}
            screenSharing={isMe ? screenSharing : (spotlightPeer?.screenSharing ?? false)}
            isLocal={isMe}
            isSpotlight
            onSpotlight={setSpotlight}
            latency={spotlightPeer?.stats?.latencyMs}
            connectionState={isMe ? 'connected' : spotlightPeer?.connectionState}
          />
        </div>
        {/* Strip */}
        <div className="flex flex-col gap-2 overflow-y-auto" style={{ width: 180 }}>
          {!isMe && (
            <div style={{ width: 180 }}>
              <VideoTile
                stream={screenSharing ? screenStream ?? undefined : localStream ?? undefined}
                name={myName} peerId="me"
                muted={!audioEnabled} videoOff={!videoEnabled} screenSharing={screenSharing}
                isLocal isSpotlight={false} onSpotlight={setSpotlight} connectionState="connected"
              />
            </div>
          )}
          {peerList.filter(p => p.id !== spotlightPeerId).map(peer => (
            <div key={peer.id} style={{ width: 180 }}>
              <VideoTile
                stream={peer.stream} name={peer.name} peerId={peer.id}
                muted={peer.audioMuted} videoOff={peer.videoMuted} screenSharing={peer.screenSharing}
                isLocal={false} isSpotlight={false} onSpotlight={setSpotlight}
                latency={peer.stats?.latencyMs} connectionState={peer.connectionState}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 h-full overflow-auto">
      <div
        className="grid gap-3 h-full"
        style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
      >
        {/* Self tile */}
        <VideoTile
          stream={screenSharing ? screenStream ?? undefined : localStream ?? undefined}
          name={myName}
          peerId="me"
          muted={!audioEnabled}
          videoOff={!videoEnabled}
          screenSharing={screenSharing}
          isLocal
          isSpotlight={spotlightPeerId === 'me'}
          onSpotlight={setSpotlight}
          connectionState="connected"
        />
        {/* Remote peers */}
        {peerList.map(peer => (
          <VideoTile
            key={peer.id}
            stream={peer.stream}
            name={peer.name}
            peerId={peer.id}
            muted={peer.audioMuted}
            videoOff={peer.videoMuted}
            screenSharing={peer.screenSharing}
            isLocal={false}
            isSpotlight={spotlightPeerId === peer.id}
            onSpotlight={setSpotlight}
            latency={peer.stats?.latencyMs}
            connectionState={peer.connectionState}
          />
        ))}
      </div>
    </div>
  );
}
