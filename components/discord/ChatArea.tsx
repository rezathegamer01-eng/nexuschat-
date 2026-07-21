'use client';
import { useState, useRef, useEffect } from 'react';
import { useDiscordStore, Message, User } from '@/lib/discord-store';
import {
  Hash, Volume2, Megaphone, Bell, Pin, Users, Search,
  Inbox, HelpCircle, Smile, PlusCircle, Gift, ImageIcon,
  MoreHorizontal, Edit3, Trash2
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

function UserAvatar({ userId, size = 40 }: { userId: string; size?: number }) {
  const users = useDiscordStore(s => s.users);
  const user = users[userId];
  const colors = ['#5865f2','#23a559','#f0b232','#f23f43','#eb459e','#3ba55c','#1abc9c','#e67e22'];
  const colorIndex = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  const color = colors[colorIndex];
  const initials = user?.displayName?.slice(0, 2).toUpperCase() || '??';
  return (
    <div className="flex-shrink-0 rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:opacity-80 transition-opacity"
      style={{ width: size, height: size, background: color, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

function formatDate(date: Date) {
  if (isToday(date)) return `Today at ${format(date, 'h:mm a')}`;
  if (isYesterday(date)) return `Yesterday at ${format(date, 'h:mm a')}`;
  return format(date, 'MM/dd/yyyy h:mm a');
}

function MessageRow({ msg, prevMsg, channelId }: { msg: Message; prevMsg?: Message; channelId: string }) {
  const { users, toggleReaction } = useDiscordStore();
  const author = users[msg.authorId];
  const prevAuthor = prevMsg?.authorId;
  const isCompact = prevMsg && prevAuthor === msg.authorId &&
    (msg.timestamp.getTime() - prevMsg.timestamp.getTime()) < 5 * 60 * 1000;
  const [hovering, setHovering] = useState(false);

  const QUICK_REACTIONS = ['👍', '❤️', '😂', '🔥', '🎉'];

  return (
    <div
      className="message-row group relative px-4 py-0.5 hover:bg-white/[0.03] transition-colors"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Date divider */}
      {!isCompact && prevMsg && (
        (() => {
          const sameDay = prevMsg && format(prevMsg.timestamp, 'yyyy-MM-dd') === format(msg.timestamp, 'yyyy-MM-dd');
          if (!sameDay) {
            return (
              <div className="flex items-center gap-4 my-4">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <span className="text-xs font-semibold px-2 flex-shrink-0" style={{ color: '#96989d' }}>
                  {isToday(msg.timestamp) ? 'Today' : isYesterday(msg.timestamp) ? 'Yesterday' : format(msg.timestamp, 'MMMM d, yyyy')}
                </span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>
            );
          }
          return null;
        })()
      )}

      <div className={`flex gap-4 ${isCompact ? 'mt-0.5' : 'mt-4'}`}>
        {/* Avatar or timestamp indent */}
        {isCompact ? (
          <div className="w-10 flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100">
            <span className="text-[10px]" style={{ color: '#96989d' }}>
              {format(msg.timestamp, 'h:mm')}
            </span>
          </div>
        ) : (
          <UserAvatar userId={msg.authorId} size={40} />
        )}

        {/* Message content */}
        <div className="flex-1 min-w-0">
          {!isCompact && (
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="font-semibold text-sm cursor-pointer hover:underline"
                style={{ color: author?.isBot ? '#5865f2' : '#ffffff' }}>
                {author?.displayName || 'Unknown'}
              </span>
              {author?.isBot && (
                <span className="text-[10px] font-bold px-1 py-0.5 rounded" style={{ background: '#5865f2', color: '#fff' }}>
                  BOT
                </span>
              )}
              <span className="text-xs" style={{ color: '#96989d' }}>
                {formatDate(msg.timestamp)}
              </span>
              {msg.edited && <span className="text-xs" style={{ color: '#96989d' }}>(edited)</span>}
            </div>
          )}

          {/* Message text with markdown-like rendering */}
          <div className="text-sm leading-relaxed break-words" style={{ color: '#dcddde' }}>
            {msg.content.split('\n').map((line, i) => {
              // Code block
              if (line.startsWith('```') || line.endsWith('```')) {
                return null; // handled below
              }
              // Bold **text**
              const boldParts = line.split(/(\*\*[^*]+\*\*)/g);
              return (
                <p key={i} className={i > 0 ? 'mt-1' : ''}>
                  {boldParts.map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={j} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
                    }
                    // @mentions
                    const mentionParts = part.split(/(@\w+)/g);
                    return mentionParts.map((mp, k) => {
                      if (mp.startsWith('@')) {
                        return <span key={k} className="px-0.5 rounded cursor-pointer"
                          style={{ background: 'rgba(88,101,242,0.3)', color: '#c9cdfb' }}>{mp}</span>;
                      }
                      return mp;
                    });
                  })}
                </p>
              );
            })}
            {/* Code block */}
            {msg.content.includes('```') && (
              <pre className="mt-1 p-3 rounded text-xs overflow-x-auto"
                style={{ background: '#1e1f22', color: '#dcddde', fontFamily: 'JetBrains Mono, monospace' }}>
                {msg.content.replace(/```\w*\n?/g, '').replace(/```/g, '').trim()}
              </pre>
            )}
          </div>

          {/* Reactions */}
          {msg.reactions && msg.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {msg.reactions.filter(r => r.count > 0).map(reaction => (
                <button
                  key={reaction.emoji}
                  onClick={() => toggleReaction(channelId, msg.id, reaction.emoji)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors"
                  style={{
                    background: reaction.reacted ? 'rgba(88,101,242,0.3)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${reaction.reacted ? 'rgba(88,101,242,0.6)' : 'transparent'}`,
                    color: reaction.reacted ? '#c9cdfb' : '#dcddde',
                  }}
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hover action bar */}
      {hovering && (
        <div className="absolute right-4 -top-4 flex items-center gap-0.5 rounded-lg p-0.5 shadow-lg"
          style={{ background: '#2b2d31', border: '1px solid rgba(255,255,255,0.08)' }}>
          {QUICK_REACTIONS.map(emoji => (
            <button key={emoji} className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 text-base transition-colors"
              onClick={() => toggleReaction(channelId, msg.id, emoji)}>
              {emoji}
            </button>
          ))}
          <div className="w-px h-6 mx-0.5" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 transition-colors">
            <MoreHorizontal size={16} style={{ color: '#96989d' }} />
          </button>
        </div>
      )}
    </div>
  );
}

export function ChatArea() {
  const {
    servers, activeServerId, activeChannelId, activeView, activeDmUserId,
    messages, users, sendMessage, showMemberList, toggleMemberList
  } = useDiscordStore();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const server = servers.find(s => s.id === activeServerId);
  const channel = server?.channels.find(c => c.id === activeChannelId);
  const dmUser = activeDmUserId ? users[activeDmUserId] : null;

  const currentMessages = messages[activeChannelId] || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages.length, activeChannelId]);

  const handleSend = () => {
    if (inputValue.trim()) {
      sendMessage(activeChannelId, inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const ChannelHeaderIcon = () => {
    if (!channel) return <Hash size={22} style={{ color: '#96989d' }} />;
    if (channel.type === 'voice') return <Volume2 size={22} style={{ color: '#96989d' }} />;
    if (channel.type === 'announcement') return <Megaphone size={22} style={{ color: '#96989d' }} />;
    return <Hash size={22} style={{ color: '#96989d' }} />;
  };

  const headerTitle = activeView === 'dm' && dmUser
    ? dmUser.displayName
    : channel ? channel.name : 'Select a channel';

  return (
    <div className="flex flex-col flex-1 min-w-0" style={{ background: '#313338' }}>
      {/* Channel Header */}
      <div className="flex items-center justify-between px-4 h-12 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#313338' }}>
        <div className="flex items-center gap-2">
          <ChannelHeaderIcon />
          <span className="font-bold text-white text-[15px]">{headerTitle}</span>
          {channel?.topic && (
            <>
              <div className="w-px h-5 mx-1" style={{ background: 'rgba(255,255,255,0.12)' }} />
              <span className="text-sm truncate max-w-xs hidden md:block" style={{ color: '#96989d' }}>
                {channel.topic}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 transition-colors">
            <Bell size={20} style={{ color: '#b9bbbe' }} />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 transition-colors">
            <Pin size={20} style={{ color: '#b9bbbe' }} />
          </button>
          <button
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
            onClick={toggleMemberList}
          >
            <Users size={20} style={{ color: showMemberList ? '#ffffff' : '#b9bbbe' }} />
          </button>
          <div className="flex items-center gap-2 px-2 py-1 rounded ml-1 cursor-text"
            style={{ background: '#1e1f22', width: 140 }}>
            <Search size={14} style={{ color: '#96989d' }} />
            <span className="text-sm" style={{ color: '#96989d' }}>Search</span>
          </div>
          <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 transition-colors">
            <Inbox size={20} style={{ color: '#b9bbbe' }} />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 transition-colors">
            <HelpCircle size={20} style={{ color: '#b9bbbe' }} />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto dc-scrollbar flex flex-col">
        {/* Channel welcome */}
        <div className="px-4 pt-16 pb-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: '#4f545c' }}>
            <ChannelHeaderIcon />
          </div>
          <h2 className="text-3xl font-bold text-white mb-1">
            {activeView === 'dm' ? `@${dmUser?.displayName}` : `#${channel?.name || 'channel'}`}
          </h2>
          <p className="text-base" style={{ color: '#96989d' }}>
            {activeView === 'dm'
              ? `This is the beginning of your direct message history with ${dmUser?.displayName}.`
              : channel?.topic || `This is the start of the #${channel?.name || 'channel'} channel.`
            }
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1">
          {currentMessages.map((msg, i) => (
            <MessageRow
              key={msg.id}
              msg={msg}
              prevMsg={i > 0 ? currentMessages[i - 1] : undefined}
              channelId={activeChannelId}
            />
          ))}
          {currentMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: '#4f545c' }}>
                <Hash size={40} style={{ color: '#96989d' }} />
              </div>
              <p style={{ color: '#96989d' }}>No messages yet. Be the first to say something!</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="px-4 pb-6 pt-2 flex-shrink-0">
        <div className="flex items-center gap-2 px-4 rounded-lg"
          style={{ background: '#383a40', minHeight: 44 }}>
          {/* Add attachment */}
          <button className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 hover:bg-white/10 transition-colors">
            <PlusCircle size={22} style={{ color: '#b9bbbe' }} />
          </button>

          {/* Text input */}
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${activeView === 'dm' ? `@${dmUser?.displayName}` : `#${channel?.name || 'channel'}`}`}
            className="flex-1 bg-transparent text-sm resize-none outline-none leading-relaxed py-3"
            style={{ color: '#dcddde', maxHeight: 120 }}
            rows={1}
          />

          {/* Emoji + Gift */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 transition-colors">
              <Gift size={22} style={{ color: '#b9bbbe' }} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 transition-colors">
              <ImageIcon size={22} style={{ color: '#b9bbbe' }} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 transition-colors">
              <Smile size={22} style={{ color: '#b9bbbe' }} />
            </button>
          </div>
        </div>
        <p className="text-xs mt-1 px-1" style={{ color: '#72767d' }}>
          Press <kbd className="px-1 py-0.5 rounded text-xs" style={{ background: '#4f545c', color: '#dcddde' }}>Enter</kbd> to send,{' '}
          <kbd className="px-1 py-0.5 rounded text-xs" style={{ background: '#4f545c', color: '#dcddde' }}>Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
