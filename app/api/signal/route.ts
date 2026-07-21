// Signaling server for WebRTC P2P
// Uses in-memory rooms + Server-Sent Events for real-time signaling
import { NextRequest, NextResponse } from 'next/server';

interface SignalMessage {
  type: 'join' | 'offer' | 'answer' | 'ice' | 'leave' | 'peer-list' | 'peer-joined' | 'peer-left';
  roomCode: string;
  fromPeerId: string;
  toPeerId?: string;
  fromName?: string;
  payload?: unknown;
}

// In-memory room registry (resets on server restart — fine for demo)
const rooms = new Map<string, Map<string, { name: string; writer: ReadableStreamDefaultController }>>();

function getRoom(code: string) {
  if (!rooms.has(code)) rooms.set(code, new Map());
  return rooms.get(code)!;
}

function broadcast(roomCode: string, msg: SignalMessage, excludePeerId?: string) {
  const room = rooms.get(roomCode);
  if (!room) return;
  const data = `data: ${JSON.stringify(msg)}\n\n`;
  for (const [id, peer] of room.entries()) {
    if (id !== excludePeerId) {
      try { peer.writer.enqueue(data); } catch {}
    }
  }
}

function send(roomCode: string, toPeerId: string, msg: SignalMessage) {
  const room = rooms.get(roomCode);
  if (!room) return;
  const peer = room.get(toPeerId);
  if (peer) {
    try { peer.writer.enqueue(`data: ${JSON.stringify(msg)}\n\n`); } catch {}
  }
}

// SSE — GET /api/signal?room=CODE&peer=ID&name=NAME
export async function GET(req: NextRequest) {
  const roomCode = req.nextUrl.searchParams.get('room') || '';
  const peerId = req.nextUrl.searchParams.get('peer') || '';
  const name = req.nextUrl.searchParams.get('name') || 'Anonymous';

  if (!roomCode || !peerId) {
    return NextResponse.json({ error: 'Missing room or peer' }, { status: 400 });
  }

  const room = getRoom(roomCode);

  // Build SSE stream
  let controller: ReadableStreamDefaultController;
  const stream = new ReadableStream({
    start(c) {
      controller = c;
      room.set(peerId, { name, writer: c });

      // Send current peer list to new joiner
      const peerList = Array.from(room.entries())
        .filter(([id]) => id !== peerId)
        .map(([id, p]) => ({ id, name: p.name }));

      const listMsg: SignalMessage = {
        type: 'peer-list',
        roomCode,
        fromPeerId: 'server',
        payload: peerList,
      };
      c.enqueue(`data: ${JSON.stringify(listMsg)}\n\n`);

      // Announce to others
      broadcast(roomCode, {
        type: 'peer-joined',
        roomCode,
        fromPeerId: peerId,
        fromName: name,
      }, peerId);
    },
    cancel() {
      room.delete(peerId);
      broadcast(roomCode, {
        type: 'peer-left',
        roomCode,
        fromPeerId: peerId,
      });
      if (room.size === 0) rooms.delete(roomCode);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

// POST /api/signal — forward signaling messages
export async function POST(req: NextRequest) {
  const msg: SignalMessage = await req.json();
  const { roomCode, toPeerId } = msg;

  if (toPeerId) {
    send(roomCode, toPeerId, msg);
  } else {
    broadcast(roomCode, msg, msg.fromPeerId);
  }

  return NextResponse.json({ ok: true });
}
