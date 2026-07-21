'use client';
import { useDiscordStore, OnlineStatus, User } from '@/lib/discord-store';
import { Search } from 'lucide-react';
import { useState } from 'react';

function StatusDot({ status, size = 12 }: { status: OnlineStatus; size?: number }) {
  const colors: Record<OnlineStatus, string> = {
    online: '#23a559', idle: '#f0b232', dnd: '#f23f43', offline: '#80848e',
  };
  return (
    <div
      className="rounded-full border-2 flex-shrink-0"
      style={{
        width: size, height: size,
        background: colors[status],
        borderColor: '#2b2d31',
      }}
    />
  );
}

function MemberRow({ user }: { user: User }) {
  const colors = ['#5865f2','#23a559','#f0b232','#f23f43','#eb459e','#3ba55c','#1abc9c','#e67e22'];
  const colorIndex = user.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  const color = colors[colorIndex];
  const initials = user.displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-3 px-2 py-1.5 rounded cursor-pointer hover:bg-white/[0.06] group transition-colors">
      <div className="relative flex-shrink-0">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
          style={{ background: color, opacity: user.status === 'offline' ? 0.5 : 1 }}
        >
          {initials}
        </div>
        <div className="absolute -bottom-0.5 -right-0.5">
          <StatusDot status={user.status} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className="text-sm font-medium truncate transition-colors group-hover:text-white"
            style={{ color: user.status === 'offline' ? '#72767d' : '#96989d' }}
          >
            {user.displayName}
          </span>
          {user.isBot && (
            <span className="text-[9px] font-bold px-1 rounded"
              style={{ background: '#5865f2', color: '#fff', letterSpacing: '0.05em' }}>
              BOT
            </span>
          )}
        </div>
        {user.activity && user.status !== 'offline' && (
          <div className="text-xs truncate" style={{ color: '#72767d' }}>
            {user.activity}
          </div>
        )}
      </div>
    </div>
  );
}

function MemberGroup({ label, members }: { label: string; members: User[] }) {
  if (members.length === 0) return null;
  return (
    <div className="mb-4">
      <div className="px-2 py-1 mb-1">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#96989d' }}>
          {label} — {members.length}
        </span>
      </div>
      {members.map(user => (
        <MemberRow key={user.id} user={user} />
      ))}
    </div>
  );
}

export function MembersPanel() {
  const { servers, activeServerId, users } = useDiscordStore();
  const [search, setSearch] = useState('');

  const server = servers.find(s => s.id === activeServerId);
  const memberIds = server?.members || [];
  const memberList = memberIds.map(id => users[id]).filter(Boolean);

  const filtered = memberList.filter(u =>
    u.displayName.toLowerCase().includes(search.toLowerCase())
  );

  const bots = filtered.filter(u => u.isBot);
  const online = filtered.filter(u => !u.isBot && u.status !== 'offline');
  const offline = filtered.filter(u => !u.isBot && u.status === 'offline');

  return (
    <div
      className="flex flex-col flex-shrink-0"
      style={{ width: 240, background: '#2b2d31', borderLeft: '1px solid rgba(255,255,255,0.04)' }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#96989d' }}>
          Members — {memberList.length}
        </h3>
        {/* Search */}
        <div className="flex items-center gap-2 px-2 py-1.5 rounded"
          style={{ background: '#1e1f22' }}>
          <Search size={13} style={{ color: '#96989d' }} />
          <input
            type="text"
            placeholder="Search members"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none w-full"
            style={{ color: '#dcddde' }}
          />
        </div>
      </div>

      {/* Member list */}
      <div className="flex-1 overflow-y-auto dc-scrollbar px-2 py-2">
        {bots.length > 0 && <MemberGroup label="Bots" members={bots} />}
        <MemberGroup label="Online" members={online} />
        <MemberGroup label="Offline" members={offline} />
        {filtered.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: '#96989d' }}>No members found</p>
          </div>
        )}
      </div>
    </div>
  );
}
