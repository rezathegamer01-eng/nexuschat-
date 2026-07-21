'use client';
import { useRef } from 'react';
import { useP2PStore, TransferFile } from '@/lib/p2p-store';
import { Upload, Download, FileText, Image, Music, Film, File, X, Check, AlertCircle } from 'lucide-react';

interface FilesPanelProps {
  onSendFile: (file: File) => void;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ type }: { type: string }) {
  if (type.startsWith('image/')) return <Image size={18} style={{ color: '#5865f2' }} />;
  if (type.startsWith('audio/')) return <Music size={18} style={{ color: '#23a559' }} />;
  if (type.startsWith('video/')) return <Film size={18} style={{ color: '#f0b232' }} />;
  if (type.includes('pdf') || type.includes('text') || type.includes('document')) return <FileText size={18} style={{ color: '#eb459e' }} />;
  return <File size={18} style={{ color: '#96989d' }} />;
}

function TransferRow({ t }: { t: TransferFile }) {
  const isImage = t.type.startsWith('image/');
  const isAudio = t.type.startsWith('audio/');
  const isVideo = t.type.startsWith('video/');
  const canPreview = t.status === 'done' && t.url;

  return (
    <div className="rounded-xl p-3 mb-2" style={{ background: '#1e1f22' }}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: '#313338' }}>
          <FileIcon type={t.type} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-white truncate">{t.name}</span>
            <span className="flex items-center gap-1 flex-shrink-0">
              {t.direction === 'send'
                ? <Upload size={12} style={{ color: '#96989d' }} />
                : <Download size={12} style={{ color: '#5865f2' }} />}
            </span>
          </div>
          <span className="text-xs" style={{ color: '#72767d' }}>{formatBytes(t.size)}</span>

          {/* Progress bar */}
          {t.status === 'transferring' && (
            <div className="mt-2">
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#313338' }}>
                <div className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${t.progress}%`, background: '#5865f2' }} />
              </div>
              <span className="text-xs mt-0.5 block" style={{ color: '#96989d' }}>{t.progress}%</span>
            </div>
          )}

          {/* Status */}
          {t.status === 'done' && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <Check size={12} style={{ color: '#23a559' }} />
              <span className="text-xs" style={{ color: '#23a559' }}>
                {t.direction === 'send' ? 'Sent' : 'Received'}
              </span>
            </div>
          )}
          {t.status === 'error' && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <AlertCircle size={12} style={{ color: '#f23f43' }} />
              <span className="text-xs" style={{ color: '#f23f43' }}>Transfer failed</span>
            </div>
          )}

          {/* Media previews */}
          {canPreview && isImage && (
            <a href={t.url} download={t.name} target="_blank" rel="noreferrer">
              <img src={t.url} alt={t.name} className="mt-2 rounded-lg max-h-28 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity" />
            </a>
          )}
          {canPreview && isAudio && (
            <audio controls src={t.url} className="mt-2 w-full" style={{ height: 32 }} />
          )}
          {canPreview && isVideo && (
            <video controls src={t.url} className="mt-2 rounded-lg max-h-28 w-full" />
          )}
          {canPreview && !isImage && !isAudio && !isVideo && (
            <a href={t.url} download={t.name}
              className="mt-2 flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg inline-flex"
              style={{ background: 'rgba(88,101,242,0.2)', color: '#c9cdfb' }}>
              <Download size={12} /> Download {t.name}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function FilesPanel({ onSendFile }: FilesPanelProps) {
  const { transfers, toggleFiles } = useP2PStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    Array.from(e.dataTransfer.files).forEach(onSendFile);
  };

  return (
    <div className="flex flex-col flex-shrink-0"
      style={{ width: 280, background: '#2b2d31', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="font-bold text-white text-sm">Files & Media</span>
        <button onClick={toggleFiles} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors">
          <X size={14} style={{ color: '#96989d' }} />
        </button>
      </div>

      {/* Drop zone */}
      <div
        className="mx-3 mt-3 flex flex-col items-center justify-center gap-2 rounded-xl py-5 cursor-pointer transition-colors"
        style={{ background: 'rgba(88,101,242,0.08)', border: '2px dashed rgba(88,101,242,0.3)' }}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={22} style={{ color: '#5865f2' }} />
        <p className="text-sm font-medium" style={{ color: '#96989d' }}>
          Drop files or click to send
        </p>
        <p className="text-xs" style={{ color: '#72767d' }}>
          Videos, music, images, any file
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={e => Array.from(e.target.files || []).forEach(onSendFile)}
        />
      </div>

      {/* Quick send icons */}
      <div className="flex gap-2 px-3 pt-3">
        {[
          { label: '🎵 Music', accept: 'audio/*' },
          { label: '🎥 Video', accept: 'video/*' },
          { label: '🖼️ Image', accept: 'image/*' },
        ].map(btn => {
          const ref = useRef<HTMLInputElement>(null);
          return (
            <div key={btn.label}>
              <button
                onClick={() => ref.current?.click()}
                className="text-xs px-2 py-1.5 rounded-lg font-medium transition-colors"
                style={{ background: '#383a40', color: '#dcddde' }}
              >
                {btn.label}
              </button>
              <input ref={ref} type="file" accept={btn.accept} multiple className="hidden"
                onChange={e => Array.from(e.target.files || []).forEach(onSendFile)} />
            </div>
          );
        })}
      </div>

      {/* Transfer list */}
      <div className="flex-1 overflow-y-auto dc-scrollbar px-3 pt-3 pb-3">
        {transfers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 gap-2 opacity-50">
            <span className="text-3xl">📁</span>
            <p className="text-sm text-center" style={{ color: '#96989d' }}>No transfers yet</p>
          </div>
        )}
        {[...transfers].reverse().map(t => (
          <TransferRow key={t.id} t={t} />
        ))}
      </div>
    </div>
  );
}
