'use client';
import { useState, useRef, useEffect } from 'react';
import { useP2PStore, ChatMessage } from '@/lib/p2p-store';
import { Send, X } from 'lucide-react';

interface ChatPanelProps {
  onSendChat: (msg: string) => void;
}

function MessageBubble({ msg, isMe }: { msg: ChatMessage; isMe: boolean }) {
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (msg.type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: '#96989d' }}>
          {msg.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'} mb-3`}>
      {!isMe && (
        <span className="text-xs font-semibold ml-1" style={{ color: '#96989d' }}>{msg.fromName}</span>
      )}
      <div className="flex items-end gap-2">
        <div
          className="max-w-[200px] px-3 py-2 rounded-2xl text-sm leading-relaxed break-words"
          style={{
            background: isMe ? '#5865f2' : '#383a40',
            color: isMe ? '#fff' : '#dcddde',
            borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          }}
        >
          {msg.content}
        </div>
      </div>
      <span className="text-[10px] px-1" style={{ color: '#72767d' }}>{time}</span>
    </div>
  );
}

export function ChatPanel({ onSendChat }: ChatPanelProps) {
  const { messages, myPeerId, toggleChat } = useP2PStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = () => {
    if (!input.trim()) return;
    onSendChat(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col flex-shrink-0"
      style={{ width: 280, background: '#2b2d31', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="font-bold text-white text-sm">Room Chat</span>
        <button onClick={toggleChat} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors">
          <X size={14} style={{ color: '#96989d' }} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto dc-scrollbar px-3 py-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
            <span className="text-3xl">💬</span>
            <p className="text-sm text-center" style={{ color: '#96989d' }}>Messages only visible during this call</p>
          </div>
        )}
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} isMe={msg.fromPeerId === myPeerId} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-2 flex-shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: '#383a40' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Message…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: '#dcddde' }}
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
            style={{ background: '#5865f2' }}
          >
            <Send size={14} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
