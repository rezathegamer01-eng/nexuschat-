// P2P Store — types + Zustand state for room/call management
import { create } from 'zustand';

export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'failed' | 'disconnected';
export type MediaMode = 'video' | 'voice' | 'screen';

export interface PeerStats {
  peerId: string;
  latencyMs: number;
  bandwidth: string;
  connectionType: string; // 'direct' | 'relay'
  packetLoss: number;
}

export interface TransferFile {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number; // 0-100
  status: 'pending' | 'transferring' | 'done' | 'error';
  direction: 'send' | 'receive';
  url?: string; // object URL after receive
  fromPeerId?: string;
}

export interface ChatMessage {
  id: string;
  fromPeerId: string;
  fromName: string;
  content: string;
  timestamp: number;
  type: 'text' | 'file-notify' | 'system';
}

export interface RoomPeer {
  id: string;
  name: string;
  stream?: MediaStream;
  audioMuted: boolean;
  videoMuted: boolean;
  screenSharing: boolean;
  stats?: PeerStats;
  connectionState: ConnectionState;
}

interface P2PStore {
  // Room
  roomCode: string;
  myPeerId: string;
  myName: string;
  inRoom: boolean;

  // Media
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  activeMode: MediaMode;

  // Peers
  peers: Record<string, RoomPeer>;

  // Chat
  messages: ChatMessage[];

  // Files
  transfers: TransferFile[];

  // UI
  layout: 'grid' | 'spotlight';
  spotlightPeerId: string | null;
  showChat: boolean;
  showStats: boolean;
  showFiles: boolean;

  // Actions
  setRoom: (code: string, myId: string, name: string) => void;
  leaveRoom: () => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setScreenStream: (stream: MediaStream | null) => void;
  setAudioEnabled: (v: boolean) => void;
  setVideoEnabled: (v: boolean) => void;
  setScreenSharing: (v: boolean) => void;
  addPeer: (peer: RoomPeer) => void;
  removePeer: (id: string) => void;
  updatePeer: (id: string, patch: Partial<RoomPeer>) => void;
  updatePeerStats: (id: string, stats: PeerStats) => void;
  addMessage: (msg: ChatMessage) => void;
  addTransfer: (t: TransferFile) => void;
  updateTransfer: (id: string, patch: Partial<TransferFile>) => void;
  setLayout: (l: 'grid' | 'spotlight') => void;
  setSpotlight: (id: string | null) => void;
  toggleChat: () => void;
  toggleStats: () => void;
  toggleFiles: () => void;
  setMyName: (n: string) => void;
}

export const useP2PStore = create<P2PStore>((set) => ({
  roomCode: '',
  myPeerId: '',
  myName: 'Anonymous',
  inRoom: false,
  localStream: null,
  screenStream: null,
  audioEnabled: true,
  videoEnabled: true,
  screenSharing: false,
  activeMode: 'video',
  peers: {},
  messages: [],
  transfers: [],
  layout: 'grid',
  spotlightPeerId: null,
  showChat: true,
  showStats: false,
  showFiles: false,

  setRoom: (code, myId, name) => set({ roomCode: code, myPeerId: myId, myName: name, inRoom: true }),
  leaveRoom: () => set({
    inRoom: false, roomCode: '', myPeerId: '', peers: {},
    localStream: null, screenStream: null, screenSharing: false,
    messages: [], transfers: [],
  }),
  setLocalStream: (stream) => set({ localStream: stream }),
  setScreenStream: (stream) => set({ screenStream: stream }),
  setAudioEnabled: (v) => set({ audioEnabled: v }),
  setVideoEnabled: (v) => set({ videoEnabled: v }),
  setScreenSharing: (v) => set({ screenSharing: v }),
  addPeer: (peer) => set(s => ({ peers: { ...s.peers, [peer.id]: peer } })),
  removePeer: (id) => set(s => {
    const peers = { ...s.peers };
    delete peers[id];
    return { peers };
  }),
  updatePeer: (id, patch) => set(s => ({
    peers: { ...s.peers, [id]: { ...s.peers[id], ...patch } },
  })),
  updatePeerStats: (id, stats) => set(s => ({
    peers: { ...s.peers, [id]: { ...s.peers[id], stats } },
  })),
  addMessage: (msg) => set(s => ({ messages: [...s.messages, msg] })),
  addTransfer: (t) => set(s => ({ transfers: [...s.transfers, t] })),
  updateTransfer: (id, patch) => set(s => ({
    transfers: s.transfers.map(t => t.id === id ? { ...t, ...patch } : t),
  })),
  setLayout: (l) => set({ layout: l }),
  setSpotlight: (id) => set({ spotlightPeerId: id, layout: id ? 'spotlight' : 'grid' }),
  toggleChat: () => set(s => ({ showChat: !s.showChat, showFiles: false, showStats: false })),
  toggleStats: () => set(s => ({ showStats: !s.showStats, showFiles: false, showChat: false })),
  toggleFiles: () => set(s => ({ showFiles: !s.showFiles, showChat: false, showStats: false })),
  setMyName: (n) => set({ myName: n }),
}));
