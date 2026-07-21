'use client';
import { useState } from 'react';
import { useDiscordStore } from '@/lib/discord-store';
import { useP2PStore } from '@/lib/p2p-store';
import { ServerSidebar } from '@/components/discord/ServerSidebar';
import { ChannelPanel } from '@/components/discord/ChannelPanel';
import { ChatArea } from '@/components/discord/ChatArea';
import { MembersPanel } from '@/components/discord/MembersPanel';
import { JoinRoom } from '@/components/p2p/JoinRoom';
import { RoomView } from '@/components/p2p/RoomView';
import { useWebRTC } from '@/hooks/useWebRTC';
import { Video, MessageSquare, Download } from 'lucide-react';

type AppView = 'chat' | 'call';

function P2PSection() {
  const { inRoom } = useP2PStore();
  const { joinRoom } = useWebRTC();
  if (inRoom) return <RoomView />;
  return (
    <JoinRoom
      onJoin={(code, name, mode) => joinRoom(code, name, mode)}
    />
  );
}

export default function Home() {
  const { showMemberList } = useDiscordStore();
  const [view, setView] = useState<AppView>('chat');

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{ background: '#1a1b1e', fontFamily: 'var(--font-outfit), -apple-system, BlinkMacSystemFont, sans-serif' }}
    >
      {view === 'chat' ? (
        <>
          {/* Server sidebar */}
          <ServerSidebar />

          {/* Channel panel */}
          <ChannelPanel />

          {/* Chat area */}
          <ChatArea />

          {/* Members panel */}
          {showMemberList && <MembersPanel />}

          {/* Floating call button */}
          <button
            onClick={() => setView('call')}
            className="fixed bottom-20 right-6 flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-white shadow-2xl z-50 transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #5865f2, #eb459e)' }}
            title="Start P2P Call"
          >
            <Video size={18} />
            <span className="text-sm">P2P Call</span>
          </button>

          {/* Download button */}
          <a
            href="/download"
            className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-white shadow-xl z-50 transition-all hover:scale-105 no-underline"
            style={{ background: '#2b2d31', border: '1px solid rgba(255,255,255,0.12)', fontSize: 13 }}
            title="Download source code"
          >
            <Download size={15} />
            <span>Download</span>
          </a>
        </>
      ) : (
        <div className="flex flex-col w-full h-full relative">
          {/* Back to chat button */}
          <button
            onClick={() => setView('chat')}
            className="absolute top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#dcddde' }}
          >
            <MessageSquare size={15} />
            Back to Chat
          </button>
          <P2PSection />
        </div>
      )}
    </div>
  );
}
