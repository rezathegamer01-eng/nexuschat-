'use client';
// Core WebRTC P2P hook — manages peer connections, signaling, media, and data channels
import { useEffect, useRef, useCallback } from 'react';
import { useP2PStore, RoomPeer, TransferFile, ChatMessage } from '@/lib/p2p-store';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
];

const CHUNK_SIZE = 64 * 1024; // 64KB chunks for file transfer

interface PeerConnection {
  pc: RTCPeerConnection;
  dc: RTCDataChannel | null;
  latencyInterval: ReturnType<typeof setInterval> | null;
}

export function useWebRTC() {
  const store = useP2PStore();
  const peerConns = useRef<Record<string, PeerConnection>>({});
  const sseRef = useRef<EventSource | null>(null);
  const pendingFileChunks = useRef<Record<string, { chunks: ArrayBuffer[]; meta: TransferFile }>>({});

  const signal = useCallback(async (msg: object) => {
    await fetch('/api/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg),
    });
  }, []);

  // ── Data channel message handler ──────────────────────────────────────────
  const handleDataMessage = useCallback((fromPeerId: string, raw: string | ArrayBuffer) => {
    if (raw instanceof ArrayBuffer) {
      // File chunk
      const view = new DataView(raw);
      const metaLen = view.getUint32(0);
      const metaBytes = new Uint8Array(raw, 4, metaLen);
      const meta = JSON.parse(new TextDecoder().decode(metaBytes));
      const chunk = raw.slice(4 + metaLen);

      if (!pendingFileChunks.current[meta.id]) {
        pendingFileChunks.current[meta.id] = { chunks: [], meta };
      }
      pendingFileChunks.current[meta.id].chunks.push(chunk);
      const received = pendingFileChunks.current[meta.id].chunks.reduce((a, c) => a + c.byteLength, 0);
      const progress = Math.round((received / meta.size) * 100);
      store.updateTransfer(meta.id, { progress, status: 'transferring' });

      if (meta.last) {
        const blob = new Blob(pendingFileChunks.current[meta.id].chunks, { type: meta.type });
        const url = URL.createObjectURL(blob);
        store.updateTransfer(meta.id, { progress: 100, status: 'done', url });
        delete pendingFileChunks.current[meta.id];
      }
      return;
    }

    try {
      const msg = JSON.parse(raw as string);
      if (msg.type === 'chat') {
        const from = store.peers[fromPeerId];
        store.addMessage({
          id: `${Date.now()}-${fromPeerId}`,
          fromPeerId,
          fromName: from?.name || 'Peer',
          content: msg.content,
          timestamp: Date.now(),
          type: 'text',
        });
      } else if (msg.type === 'file-meta') {
        const transfer: TransferFile = {
          id: msg.id, name: msg.name, size: msg.size,
          type: msg.fileType, progress: 0,
          status: 'pending', direction: 'receive',
          fromPeerId,
        };
        store.addTransfer(transfer);
      } else if (msg.type === 'ping') {
        const dc = peerConns.current[fromPeerId]?.dc;
        if (dc?.readyState === 'open') dc.send(JSON.stringify({ type: 'pong', t: msg.t }));
      } else if (msg.type === 'pong') {
        const latencyMs = Date.now() - msg.t;
        store.updatePeerStats(fromPeerId, {
          peerId: fromPeerId,
          latencyMs,
          bandwidth: '—',
          connectionType: 'direct',
          packetLoss: 0,
        });
      }
    } catch {}
  }, [store]);

  // ── Create RTCPeerConnection ──────────────────────────────────────────────
  const createPeerConnection = useCallback((peerId: string, initiator: boolean) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Add local tracks
    const localStream = useP2PStore.getState().localStream;
    if (localStream) {
      localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
    }

    // Remote track → update peer stream
    const remoteStream = new MediaStream();
    pc.ontrack = (e) => {
      e.streams[0]?.getTracks().forEach(t => remoteStream.addTrack(t));
      store.updatePeer(peerId, { stream: remoteStream });
    };

    // ICE candidates
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        signal({
          type: 'ice',
          roomCode: useP2PStore.getState().roomCode,
          fromPeerId: useP2PStore.getState().myPeerId,
          toPeerId: peerId,
          payload: e.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState as RoomPeer['connectionState'];
      store.updatePeer(peerId, { connectionState: state as never });
      if (state === 'failed' || state === 'disconnected') {
        store.removePeer(peerId);
      }
    };

    // Data channel
    let dc: RTCDataChannel;
    if (initiator) {
      dc = pc.createDataChannel('nexus', { ordered: true });
      setupDataChannel(peerId, dc);
    } else {
      pc.ondatachannel = (e) => {
        setupDataChannel(peerId, e.channel);
        peerConns.current[peerId] = { ...peerConns.current[peerId], dc: e.channel };
      };
    }

    // Latency ping every 3s
    const latencyInterval = setInterval(() => {
      const conn = peerConns.current[peerId];
      if (conn?.dc?.readyState === 'open') {
        conn.dc.send(JSON.stringify({ type: 'ping', t: Date.now() }));
      }
    }, 3000);

    const conn: PeerConnection = {
      pc,
      dc: initiator ? dc! : null,
      latencyInterval,
    };
    peerConns.current[peerId] = conn;
    return conn;
  }, [signal, store]);

  function setupDataChannel(peerId: string, dc: RTCDataChannel) {
    dc.binaryType = 'arraybuffer';
    dc.onopen = () => {
      store.updatePeer(peerId, { connectionState: 'connected' });
      // Send initial ping
      dc.send(JSON.stringify({ type: 'ping', t: Date.now() }));
    };
    dc.onmessage = (e) => handleDataMessage(peerId, e.data);
    dc.onclose = () => store.updatePeer(peerId, { connectionState: 'disconnected' });
  }

  // ── Handle signaling messages ─────────────────────────────────────────────
  const handleSignal = useCallback(async (msg: {
    type: string; fromPeerId: string; fromName?: string;
    toPeerId?: string; payload?: unknown;
  }) => {
    const myPeerId = useP2PStore.getState().myPeerId;
    const { type, fromPeerId, fromName, payload } = msg;

    if (type === 'peer-list') {
      // Initiate connections to existing peers
      const peerList = payload as { id: string; name: string }[];
      for (const p of peerList) {
        store.addPeer({ id: p.id, name: p.name, audioMuted: false, videoMuted: false, screenSharing: false, connectionState: 'connecting' });
        const conn = createPeerConnection(p.id, true);
        const offer = await conn.pc.createOffer();
        await conn.pc.setLocalDescription(offer);
        signal({ type: 'offer', roomCode: useP2PStore.getState().roomCode, fromPeerId: myPeerId, toPeerId: p.id, payload: offer });
      }
    } else if (type === 'peer-joined') {
      store.addPeer({ id: fromPeerId, name: fromName || 'Peer', audioMuted: false, videoMuted: false, screenSharing: false, connectionState: 'connecting' });
      store.addMessage({ id: `sys-${Date.now()}`, fromPeerId: 'system', fromName: 'System', content: `${fromName || 'Someone'} joined the room`, timestamp: Date.now(), type: 'system' });
    } else if (type === 'peer-left') {
      store.removePeer(fromPeerId);
      const peer = useP2PStore.getState().peers[fromPeerId];
      store.addMessage({ id: `sys-${Date.now()}`, fromPeerId: 'system', fromName: 'System', content: `${peer?.name || 'Someone'} left the room`, timestamp: Date.now(), type: 'system' });
      const conn = peerConns.current[fromPeerId];
      if (conn) {
        clearInterval(conn.latencyInterval!);
        conn.pc.close();
        delete peerConns.current[fromPeerId];
      }
    } else if (type === 'offer') {
      const conn = createPeerConnection(fromPeerId, false);
      await conn.pc.setRemoteDescription(payload as RTCSessionDescriptionInit);
      const answer = await conn.pc.createAnswer();
      await conn.pc.setLocalDescription(answer);
      signal({ type: 'answer', roomCode: useP2PStore.getState().roomCode, fromPeerId: myPeerId, toPeerId: fromPeerId, payload: answer });
    } else if (type === 'answer') {
      const conn = peerConns.current[fromPeerId];
      if (conn) await conn.pc.setRemoteDescription(payload as RTCSessionDescriptionInit);
    } else if (type === 'ice') {
      const conn = peerConns.current[fromPeerId];
      if (conn && payload) await conn.pc.addIceCandidate(payload as RTCIceCandidateInit);
    }
  }, [createPeerConnection, signal, store]);

  // ── Join room ─────────────────────────────────────────────────────────────
  const joinRoom = useCallback(async (roomCode: string, name: string, mode: 'video' | 'voice') => {
    const myPeerId = `peer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    store.setRoom(roomCode, myPeerId, name);

    // Get user media
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: mode === 'video' ? { width: 1280, height: 720, frameRate: 30 } : false,
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      store.setLocalStream(stream);
      store.setVideoEnabled(mode === 'video');
    } catch (e) {
      console.warn('Media access denied, continuing without media:', e);
    }

    // Connect SSE
    const sse = new EventSource(`/api/signal?room=${roomCode}&peer=${myPeerId}&name=${encodeURIComponent(name)}`);
    sseRef.current = sse;
    sse.onmessage = (e) => {
      try { handleSignal(JSON.parse(e.data)); } catch {}
    };
  }, [store, handleSignal]);

  // ── Leave room ────────────────────────────────────────────────────────────
  const leaveRoom = useCallback(() => {
    sseRef.current?.close();
    sseRef.current = null;
    const localStream = useP2PStore.getState().localStream;
    localStream?.getTracks().forEach(t => t.stop());
    Object.values(peerConns.current).forEach(({ pc, latencyInterval }) => {
      if (latencyInterval) clearInterval(latencyInterval);
      pc.close();
    });
    peerConns.current = {};
    store.leaveRoom();
  }, [store]);

  // ── Toggle media ──────────────────────────────────────────────────────────
  const toggleAudio = useCallback(() => {
    const stream = useP2PStore.getState().localStream;
    const enabled = useP2PStore.getState().audioEnabled;
    stream?.getAudioTracks().forEach(t => { t.enabled = !enabled; });
    store.setAudioEnabled(!enabled);
  }, [store]);

  const toggleVideo = useCallback(() => {
    const stream = useP2PStore.getState().localStream;
    const enabled = useP2PStore.getState().videoEnabled;
    stream?.getVideoTracks().forEach(t => { t.enabled = !enabled; });
    store.setVideoEnabled(!enabled);
  }, [store]);

  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      store.setScreenStream(screenStream);
      store.setScreenSharing(true);
      const videoTrack = screenStream.getVideoTracks()[0];
      // Replace video track in all peer connections
      Object.values(peerConns.current).forEach(({ pc }) => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
      });
      videoTrack.onended = () => stopScreenShare();
    } catch {}
  }, [store]);

  const stopScreenShare = useCallback(() => {
    const screenStream = useP2PStore.getState().screenStream;
    screenStream?.getTracks().forEach(t => t.stop());
    store.setScreenStream(null);
    store.setScreenSharing(false);
    // Restore camera
    const localStream = useP2PStore.getState().localStream;
    const videoTrack = localStream?.getVideoTracks()[0];
    if (videoTrack) {
      Object.values(peerConns.current).forEach(({ pc }) => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
      });
    }
  }, [store]);

  // ── Send chat message ─────────────────────────────────────────────────────
  const sendChat = useCallback((content: string) => {
    const { myPeerId, myName } = useP2PStore.getState();
    Object.values(peerConns.current).forEach(({ dc }) => {
      if (dc?.readyState === 'open') dc.send(JSON.stringify({ type: 'chat', content }));
    });
    store.addMessage({ id: `${Date.now()}-me`, fromPeerId: myPeerId, fromName: myName, content, timestamp: Date.now(), type: 'text' });
  }, [store]);

  // ── Send file ─────────────────────────────────────────────────────────────
  const sendFile = useCallback(async (file: File, toPeerId?: string) => {
    const id = `file-${Date.now()}`;
    const transfer: TransferFile = { id, name: file.name, size: file.size, type: file.type, progress: 0, status: 'transferring', direction: 'send' };
    store.addTransfer(transfer);

    const targets = toPeerId
      ? [peerConns.current[toPeerId]].filter(Boolean)
      : Object.values(peerConns.current);

    // Announce file meta via data channel
    targets.forEach(({ dc }) => {
      if (dc?.readyState === 'open') {
        dc.send(JSON.stringify({ type: 'file-meta', id, name: file.name, size: file.size, fileType: file.type }));
      }
    });

    // Send chunks
    let offset = 0;
    const reader = new FileReader();
    const sendChunk = () => {
      const slice = file.slice(offset, offset + CHUNK_SIZE);
      reader.readAsArrayBuffer(slice);
    };

    reader.onload = (e) => {
      if (!e.target?.result) return;
      const chunk = e.target.result as ArrayBuffer;
      const last = offset + chunk.byteLength >= file.size;
      const metaStr = JSON.stringify({ id, size: file.size, type: file.type, last });
      const metaBytes = new TextEncoder().encode(metaStr);
      const buf = new ArrayBuffer(4 + metaBytes.byteLength + chunk.byteLength);
      const view = new DataView(buf);
      view.setUint32(0, metaBytes.byteLength);
      new Uint8Array(buf, 4, metaBytes.byteLength).set(metaBytes);
      new Uint8Array(buf, 4 + metaBytes.byteLength).set(new Uint8Array(chunk));
      targets.forEach(({ dc }) => {
        if (dc?.readyState === 'open') dc.send(buf);
      });
      offset += chunk.byteLength;
      const progress = Math.round((offset / file.size) * 100);
      store.updateTransfer(id, { progress, status: last ? 'done' : 'transferring' });
      if (!last) sendChunk();
    };
    sendChunk();
  }, [store]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { leaveRoom(); };
  }, []);

  return { joinRoom, leaveRoom, toggleAudio, toggleVideo, startScreenShare, stopScreenShare, sendChat, sendFile };
}
