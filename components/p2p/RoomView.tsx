'use client';
// Room view scaffold — imports + type
import dynamic from 'next/dynamic';
import { useP2PStore } from '@/lib/p2p-store';
import { useWebRTC } from '@/hooks/useWebRTC';
import { VideoGrid } from './VideoGrid';
import { CallControls } from './CallControls';
import { ChatPanel } from './ChatPanel';
import { FilesPanel } from './FilesPanel';
import { StatsPanel } from './StatsPanel';

export function RoomView() {
  const { showChat, showFiles, showStats } = useP2PStore();
  const {
    leaveRoom, toggleAudio, toggleVideo,
    startScreenShare, stopScreenShare, sendChat, sendFile,
  } = useWebRTC();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden"
      style={{ background: '#1a1b1e' }}>
      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        {/* Video grid */}
        <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
          <VideoGrid />
        </div>

        {/* Side panels — only one shown at a time */}
        {showChat && <ChatPanel onSendChat={sendChat} />}
        {showFiles && <FilesPanel onSendFile={sendFile} />}
        {showStats && <StatsPanel />}
      </div>

      {/* Controls bar */}
      <CallControls
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onStartScreen={startScreenShare}
        onStopScreen={stopScreenShare}
        onLeave={leaveRoom}
      />
    </div>
  );
}
