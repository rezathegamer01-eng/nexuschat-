'use client';
import { useState } from 'react';
import { useDiscordStore } from '@/lib/discord-store';
import {
  Hash, Volume2, Megaphone, ChevronDown, ChevronRight,
  Plus, Settings, Mic, Headphones, UserCircle2, Search,
  MessageSquare, Users
} from 'lucide-react';

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    online: '#23a559', idle: '#f0b232', dnd: '#f23f43', offline: '#80848e',
  };
  return (
    <div className="w-3 h-3 rounded-full border-2 flex-shrink-0"
      style={{ background: colors[status] || '#80848e', borderColor: '#2b2d31' }} />
  );
}

function UserAvatar({ userId, size = 32 }: { userId: string; size?: number }) {
  const users = useDiscordStore(s => s.users);
  const user = users[userId];
  const colors = ['#5865f2','#23a559','#f0b232','#f23f43','#eb459e','#3ba55c'];
  const color = colors[userId.charCodeAt(userId.length - 1) % colors.length];
  const initials = user?.displayName?.slice(0, 2).toUpperCase() || '??';
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div className="w-full h-full rounded-full flex items-center justify-center text-white font-bold"
        style={{ background: color, fontSize: size * 0.35 }}>
        {initials}
      </div>
    </div>
  );
}

export function ChannelPanel() {
  const {
    servers, activeServerId, activeChannelId, activeView,
    directMessages, users, setActiveChannel, setActiveDm, setActiveView
  } = useDiscordStore();
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());

  const server = servers.find(s => s.id === activeServerId);
  const isHome = server?.isHome;

  const toggleCat = (catId: string) => {
    setCollapsedCats(prev => {
      const next = new Set(prev);
      next.has(catId) ? next.delete(catId) : next.add(catId);
      return next;
    });
  };

  const ChannelIcon = ({ type }: { type: string }) => {
    if (type === 'voice') return <Volume2 size={18} style={{ color: '#80848e' }} />;
    if (type === 'announcement') return <Megaphone size={18} style={{ color: '#80848e' }} />;
    return <Hash size={18} style={{ color: '#80848e' }} />;
  };

  return (
    <div className="flex flex-col flex-shrink-0" style={{ width: 240, background: '#2b2d31', minHeight: '100vh' }}>
      {/* Server/Home Header */}
      <div className="flex items-center justify-between px-4 h-12 flex-shrink-0 cursor-pointer hover:bg-white/5 transition-colors"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="font-bold text-white truncate text-[15px]">
          {isHome ? 'Direct Messages' : server?.name || 'Select a server'}
        </span>
        <ChevronDown size={16} style={{ color: '#96989d' }} />
      </div>

      {/* Search bar */}
      <div className="px-2 py-2">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded cursor-text"
          style={{ background: '#1e1f22' }}>
          <Search size={14} style={{ color: '#96989d' }} />
          <span className="text-sm" style={{ color: '#96989d' }}>Find or start a conversation</span>
        </div>
      </div>

      {/* Channel / DM list */}
      <div className="flex-1 overflow-y-auto dc-scrollbar px-2 pb-2">
        {isHome ? (
          /* DM list */
          <div className="flex flex-col gap-0.5">
            {/* Friends shortcut */}
            <div
              className={`channel-item flex items-center gap-3 px-2 py-2 rounded cursor-pointer ${activeView === 'server' && activeServerId === 's0' ? 'active' : ''}`}
              onClick={() => { setActiveView('server'); }}
            >
              <Users size={18} style={{ color: '#96989d' }} />
              <span className="text-sm font-medium" style={{ color: '#dcddde' }}>Friends</span>
            </div>

            {/* Nitro */}
            <div className="channel-item flex items-center gap-3 px-2 py-2 rounded cursor-pointer">
              <div className="w-5 h-5 rounded-sm flex items-center justify-center" style={{ background: '#5865f2' }}>
                <span className="text-white text-xs font-bold">N</span>
              </div>
              <span className="text-sm font-medium" style={{ color: '#dcddde' }}>Nitro</span>
            </div>

            {/* DMs */}
            <div className="flex items-center justify-between px-2 mt-3 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#96989d' }}>
                Direct Messages
              </span>
              <Plus size={14} style={{ color: '#96989d' }} className="cursor-pointer hover:text-white" />
            </div>

            {directMessages.map(dm => {
              const user = users[dm.userId];
              if (!user) return null;
              return (
                <div
                  key={dm.id}
                  className={`channel-item flex items-center gap-3 px-2 py-1.5 rounded cursor-pointer ${activeView === 'dm' && useDiscordStore.getState().activeDmUserId === dm.userId ? 'active' : ''}`}
                  onClick={() => setActiveDm(dm.userId)}
                >
                  <div className="relative flex-shrink-0">
                    <UserAvatar userId={dm.userId} size={32} />
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <StatusDot status={user.status} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: '#dcddde' }}>
                      {user.displayName}
                    </div>
                    <div className="text-xs truncate" style={{ color: '#96989d' }}>
                      {user.status === 'online' ? 'Online' : user.status === 'idle' ? 'Idle' : user.status === 'dnd' ? 'Do Not Disturb' : 'Offline'}
                    </div>
                  </div>
                  {dm.unread && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: '#f23f43', fontSize: 11 }}>
                      {dm.unread}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Server channels by category */
          server?.categories.map(cat => {
            const catChannels = server.channels.filter(c => c.categoryId === cat.id);
            const isCollapsed = collapsedCats.has(cat.id);
            return (
              <div key={cat.id} className="mb-1">
                {/* Category header */}
                <div
                  className="flex items-center gap-1 px-1 py-1 cursor-pointer hover:text-white transition-colors"
                  style={{ color: '#96989d' }}
                  onClick={() => toggleCat(cat.id)}
                >
                  {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                  <span className="text-xs font-semibold uppercase tracking-wider flex-1">{cat.name}</span>
                  <Plus size={14} className="hover:text-white transition-colors" onClick={e => e.stopPropagation()} />
                </div>

                {/* Channels */}
                {!isCollapsed && catChannels.map(ch => {
                  const isActive = activeChannelId === ch.id && activeView === 'server';
                  return (
                    <div
                      key={ch.id}
                      className={`channel-item flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer mb-0.5 ${isActive ? 'active' : ''}`}
                      onClick={() => { setActiveChannel(ch.id); setActiveView('server'); }}
                    >
                      <ChannelIcon type={ch.type} />
                      <span className={`text-sm flex-1 truncate ${isActive ? 'text-white font-medium' : ''}`}
                        style={{ color: isActive ? undefined : ch.unread ? '#dcddde' : '#96989d' }}>
                        {ch.name}
                      </span>
                      {ch.locked && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#96989d">
                          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                        </svg>
                      )}
                      {ch.mentioned && (
                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                          style={{ background: '#f23f43', fontSize: 10 }}>
                          @
                        </div>
                      )}
                      {ch.unread && !ch.mentioned && (
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#dcddde' }} />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      {/* User bottom bar */}
      <UserBar />
    </div>
  );
}

function UserBar() {
  const users = useDiscordStore(s => s.users);
  const me = users['me'];
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);

  return (
    <div className="flex items-center justify-between px-2 py-2 flex-shrink-0"
      style={{ background: '#232428', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Avatar + name */}
      <div className="flex items-center gap-2 cursor-pointer rounded px-1 py-1 hover:bg-white/5 flex-1 min-w-0">
        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ background: '#5865f2' }}>
            YO
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
            style={{ background: '#23a559', borderColor: '#232428' }} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white truncate">You</div>
          <div className="text-xs truncate" style={{ color: '#96989d' }}>#0001</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-0.5">
        <button
          className="w-8 h-8 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
          onClick={() => setMuted(!muted)}
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#f23f43">
              <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
            </svg>
          ) : (
            <Mic size={18} style={{ color: '#b9bbbe' }} />
          )}
        </button>
        <button
          className="w-8 h-8 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
          onClick={() => setDeafened(!deafened)}
          title={deafened ? 'Undeafen' : 'Deafen'}
        >
          {deafened ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#f23f43">
              <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z"/>
            </svg>
          ) : (
            <Headphones size={18} style={{ color: '#b9bbbe' }} />
          )}
        </button>
        <button className="w-8 h-8 rounded flex items-center justify-center hover:bg-white/10 transition-colors">
          <Settings size={18} style={{ color: '#b9bbbe' }} />
        </button>
      </div>
    </div>
  );
}
