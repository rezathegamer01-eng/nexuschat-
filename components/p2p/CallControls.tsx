'use client';
import { useP2PStore } from '@/lib/p2p-store';
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  PhoneOff, MessageSquare, Users, LayoutGrid, Maximize2,
  BarChart2, FolderOpen, Copy, Check
} from 'lucide-react';
import { useState } from 'react';

interface CallControlsProps {
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onStartScreen: () => void;
  onStopScreen: () => void;
  onLeave: () => void;
}

function ControlBtn({
  onClick, active, danger, disabled, children, label,
}: {
  onClick: () => void; active?: boolean; danger?: boolean;
  disabled?: boolean; children: React.ReactNode; label: string;
}) {
  return (
    <div className="relative group flex flex-col items-center gap-1">
      <button
        onClick={onClick}
        disabled={disabled}
        className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all disabled:opacity-40"
        style={{
          background: danger
            ? '#f23f43'
            : active === false
            ? 'rgba(242,63,67,0.3)'
            : 'rgba(255,255,255,0.1)',
          color: danger ? '#fff' : active === false ? '#f23f43' : '#dcddde',
          border: active === true ? '2px solid rgba(88,101,242,0.6)' : '2px solid transparent',
        }}
      >
        {children}
      </button>
      {/* Tooltip */}
      <div className="absolute -top-9 hidden group-hover:flex items-center z-50 pointer-events-none">
        <div className="px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap"
          style={{ background: '#111214' }}>
          {label}
        </div>
      </div>
    </div>
  );
}

export function CallControls({
  onToggleAudio, onToggleVideo, onStartScreen, onStopScreen, onLeave,
}: CallControlsProps) {
  const {
    roomCode, audioEnabled, videoEnabled, screenSharing,
    peers, showChat, showStats, showFiles, layout,
    toggleChat, toggleStats, toggleFiles, setLayout,
  } = useP2PStore();
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const peerCount = Object.keys(peers).length;

  return (
    <div
      className="flex items-center justify-between px-6 py-3 flex-shrink-0"
      style={{ background: '#1e1f22', borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Left — room info */}
      <div className="flex items-center gap-3 min-w-0" style={{ width: 220 }}>
        <div className="px-3 py-1.5 rounded-lg font-mono text-sm font-bold tracking-widest flex items-center gap-2"
          style={{ background: '#2b2d31', color: '#5865f2' }}>
          {roomCode}
          <button onClick={copyCode} className="hover:opacity-70 transition-opacity">
            {copied ? <Check size={13} style={{ color: '#23a559' }} /> : <Copy size={13} />}
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#23a559' }} />
          <span className="text-xs font-medium" style={{ color: '#96989d' }}>
            {peerCount + 1} connected
          </span>
        </div>
      </div>

      {/* Center — core controls */}
      <div className="flex items-center gap-3">
        <ControlBtn
          onClick={onToggleAudio}
          active={audioEnabled ? undefined : false}
          label={audioEnabled ? 'Mute Mic' : 'Unmute Mic'}
        >
          {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
        </ControlBtn>

        <ControlBtn
          onClick={onToggleVideo}
          active={videoEnabled ? undefined : false}
          label={videoEnabled ? 'Stop Camera' : 'Start Camera'}
        >
          {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
        </ControlBtn>

        <ControlBtn
          onClick={screenSharing ? onStopScreen : onStartScreen}
          active={screenSharing ? true : undefined}
          label={screenSharing ? 'Stop Screen Share' : 'Share Screen'}
        >
          {screenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
        </ControlBtn>

        {/* Leave */}
        <ControlBtn onClick={onLeave} danger label="Leave Call">
          <PhoneOff size={20} />
        </ControlBtn>
      </div>

      {/* Right — panel toggles */}
      <div className="flex items-center gap-2" style={{ width: 220, justifyContent: 'flex-end' }}>
        <ControlBtn
          onClick={() => setLayout(layout === 'grid' ? 'spotlight' : 'grid')}
          active={layout === 'spotlight' ? true : undefined}
          label="Toggle Layout"
        >
          {layout === 'grid' ? <Maximize2 size={18} /> : <LayoutGrid size={18} />}
        </ControlBtn>

        <ControlBtn onClick={toggleChat} active={showChat ? true : undefined} label="Chat">
          <MessageSquare size={18} />
        </ControlBtn>

        <ControlBtn onClick={toggleFiles} active={showFiles ? true : undefined} label="Files">
          <FolderOpen size={18} />
        </ControlBtn>

        <ControlBtn onClick={toggleStats} active={showStats ? true : undefined} label="Connection Stats">
          <BarChart2 size={18} />
        </ControlBtn>
      </div>
    </div>
  );
}
