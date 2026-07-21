'use client';
import { useState } from 'react';
import { Video, Mic, Users, Copy, Check, Wifi, ArrowRight, Radio } from 'lucide-react';

interface JoinRoomProps {
  onJoin: (roomCode: string, name: string, mode: 'video' | 'voice') => void;
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function JoinRoom({ onJoin }: JoinRoomProps) {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'video' | 'voice'>('video');
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [generatedCode] = useState(generateCode);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    const code = tab === 'create' ? generatedCode : roomCode.toUpperCase().trim();
    if (!code) return;
    onJoin(code, name.trim(), mode);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4"
      style={{ background: 'linear-gradient(135deg, #0d0e11 0%, #1a1b2e 50%, #0d0e11 100%)' }}>
      {/* Logo / brand */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #5865f2, #eb459e)' }}>
            <Radio size={24} className="text-white" />
          </div>
          <span className="text-3xl font-extrabold text-white tracking-tight">NexusChat</span>
        </div>
        <p className="text-sm" style={{ color: '#96989d' }}>
          Peer-to-peer calls &amp; file sharing — direct connection, no middleman
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#2b2d31', border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Tabs */}
        <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {(['create', 'join'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-4 text-sm font-semibold transition-colors"
              style={{
                color: tab === t ? '#ffffff' : '#96989d',
                borderBottom: tab === t ? '2px solid #5865f2' : '2px solid transparent',
                background: 'transparent',
              }}>
              {t === 'create' ? '✦ Create Room' : '→ Join Room'}
            </button>
          ))}
        </div>

        <div className="p-6 flex flex-col gap-4">
          {/* Name input */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: '#96989d' }}>
              Your Display Name
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Alex Storm"
              className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors"
              style={{ background: '#1e1f22', color: '#dcddde', border: '2px solid transparent' }}
              onFocus={e => (e.target.style.border = '2px solid #5865f2')}
              onBlur={e => (e.target.style.border = '2px solid transparent')}
            />
          </div>

          {/* Create: show generated code */}
          {tab === 'create' && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: '#96989d' }}>
                Your Room Code
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-3 rounded-lg font-mono text-xl font-bold tracking-widest text-center"
                  style={{ background: '#1e1f22', color: '#5865f2', letterSpacing: '0.3em' }}>
                  {generatedCode}
                </div>
                <button onClick={handleCopy}
                  className="px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                  style={{ background: '#5865f2', color: '#fff' }}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-xs mt-2" style={{ color: '#72767d' }}>
                Share this code with people you want to invite
              </p>
            </div>
          )}

          {/* Join: enter code */}
          {tab === 'join' && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: '#96989d' }}>
                Room Code
              </label>
              <input
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="Enter 6-char code"
                className="w-full px-4 py-3 rounded-lg text-xl font-mono font-bold tracking-widest text-center outline-none transition-colors"
                style={{ background: '#1e1f22', color: '#dcddde', border: '2px solid transparent', letterSpacing: '0.3em' }}
                onFocus={e => (e.target.style.border = '2px solid #5865f2')}
                onBlur={e => (e.target.style.border = '2px solid transparent')}
                maxLength={6}
              />
            </div>
          )}

          {/* Mode selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: '#96989d' }}>
              Call Mode
            </label>
            <div className="flex gap-3">
              {[
                { value: 'video' as const, icon: Video, label: 'Video Call' },
                { value: 'voice' as const, icon: Mic, label: 'Voice Only' },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setMode(value)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: mode === value ? 'rgba(88,101,242,0.3)' : '#1e1f22',
                    border: `2px solid ${mode === value ? '#5865f2' : 'transparent'}`,
                    color: mode === value ? '#c9cdfb' : '#96989d',
                  }}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Stats preview */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg"
            style={{ background: 'rgba(35,165,89,0.1)', border: '1px solid rgba(35,165,89,0.2)' }}>
            <Wifi size={14} style={{ color: '#23a559' }} />
            <span className="text-xs" style={{ color: '#23a559' }}>
              Direct P2P connection — your media never touches our servers
            </span>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || (tab === 'join' && roomCode.length < 6)}
            className="w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #5865f2, #4752c4)', fontSize: 15 }}
          >
            {tab === 'create' ? 'Create & Enter Room' : 'Join Room'}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Features row */}
      <div className="flex gap-6 mt-8">
        {[
          { icon: '🎥', label: 'Video Call' },
          { icon: '🎤', label: 'Voice Chat' },
          { icon: '🖥️', label: 'Screen Share' },
          { icon: '📁', label: 'File Transfer' },
          { icon: '🎵', label: 'Music Share' },
        ].map(f => (
          <div key={f.label} className="flex flex-col items-center gap-1">
            <span className="text-2xl">{f.icon}</span>
            <span className="text-xs" style={{ color: '#72767d' }}>{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
